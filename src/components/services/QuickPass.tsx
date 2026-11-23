import { useState, useEffect, useRef } from "react";
import { encryptText, decryptText, hashPassword } from "./crypto";

const API_BASE =
  (import.meta as any).env?.PUBLIC_API_BASE ||
  "https://quizora-api.portfolio-quizora.workers.dev/v1";

type SessionInfo = {
  name: string;
  createdAt: number;
  expiresAt: number;
};

export default function QuickPass() {
  const [tab, setTab] = useState<"send" | "receive">("send");

  // Send state
  const [sendName, setSendName] = useState("");
  const [sendPassword, setSendPassword] = useState("");
  const [sendText, setSendText] = useState("");
  const [duration, setDuration] = useState<number>(10);
  const [createdSession, setCreatedSession] = useState<{
    name: string;
    expiresAt: number;
  } | null>(null);

  // Receive state
  const [receiveName, setReceiveName] = useState("");
  const [receivePassword, setReceivePassword] = useState("");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [burned, setBurned] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);

  // Common UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  const timerRef = useRef<number | null>(null);

  // Handle URL query param ?session=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get("session");
      if (sessionParam) {
        setReceiveName(sessionParam);
        setTab("receive");
      }
    } catch {}
  }, []);

  // Fetch active sessions list for quick selection/search
  async function fetchSessions(query = "") {
    try {
      const url = `${API_BASE}/quickpass${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { sessions: SessionInfo[] };
        setActiveSessions(data.sessions || []);
      }
    } catch {}
  }

  useEffect(() => {
    if (tab === "receive") {
      void fetchSessions(searchQuery);
    }
  }, [tab, searchQuery]);

  // Countdown timer for active created session
  useEffect(() => {
    if (createdSession?.expiresAt) {
      const update = () => {
        const remaining = Math.max(
          0,
          Math.floor((createdSession.expiresAt - Date.now()) / 1000),
        );
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
        if (remaining <= 0) {
          setMessage("Session expired and was automatically deleted.");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
      update();
      timerRef.current = window.setInterval(update, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [createdSession]);

  function generateRandomName() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let slug = "pass-";
    for (let i = 0; i < 5; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSendName(slug);
  }

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  async function handleSend() {
    resetAlerts();
    const name = sendName.trim();
    if (!name || name.length < 2) {
      setError("Please choose a session name (at least 2 characters).");
      return;
    }
    if (!sendPassword) {
      setError("Please set a password so only you can access this session.");
      return;
    }
    if (!sendText.trim()) {
      setError("Please enter the text you want to transfer.");
      return;
    }

    setBusy(true);
    try {
      // Client-side encryption before transmission
      const { salt, iv, ciphertext } = await encryptText(
        sendText,
        sendPassword,
      );
      const passHash = await hashPassword(sendPassword, name);

      const res = await fetch(`${API_BASE}/quickpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          salt,
          iv,
          passHash,
          ciphertext,
          durationMinutes: duration,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: { code?: string };
        };
        if (errData.error?.code === "nameTaken") {
          throw new Error(
            `Session name "${name}" is already in use. Please choose another unique name.`,
          );
        }
        if (errData.error?.code) {
          throw new Error(
            `Session creation failed (${errData.error.code}). Please try again.`,
          );
        }
        throw new Error(
          `Could not create session (${res.status} ${res.statusText || "Error"}). Please try again.`,
        );
      }

      const outcome = (await res.json()) as { name: string; expiresAt: number };
      setCreatedSession(outcome);
      setMessage(
        `Quick Pass session "${name}" created! Auto-expires in ${duration} minutes.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReceive() {
    resetAlerts();
    setDecryptedText("");
    const name = receiveName.trim();
    if (!name) {
      setError("Please enter the session name.");
      return;
    }
    if (!receivePassword) {
      setError("Please enter the session password.");
      return;
    }

    setBusy(true);
    try {
      const passHash = await hashPassword(receivePassword, name);
      const res = await fetch(
        `${API_BASE}/quickpass/${encodeURIComponent(name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passHash, burn: burnAfterRead }),
        },
      );

      if (res.status === 404) {
        throw new Error(
          `Session "${name}" was not found or has already expired.`,
        );
      }
      if (res.status === 403) {
        throw new Error("Incorrect password. Access denied.");
      }
      if (!res.ok) {
        throw new Error("Could not retrieve session.");
      }

      const data = (await res.json()) as {
        name: string;
        salt: string;
        iv: string;
        ciphertext: string;
        burned?: boolean;
      };

      // Decrypt client-side
      const plain = await decryptText(
        data.ciphertext,
        data.iv,
        data.salt,
        receivePassword,
      );
      setDecryptedText(plain);
      setBurned(!!data.burned);
      setMessage(
        data.burned
          ? "Text retrieved and session permanently deleted."
          : "Text decrypted successfully!",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(decryptedText);
      setMessage("Text copied to clipboard.");
    } catch {
      setError("Could not access clipboard.");
    }
  }

  const shareUrl = createdSession
    ? `${window.location.origin}/services/quick-pass/?session=${encodeURIComponent(createdSession.name)}`
    : "";

  return (
    <>
      <div className="workspace-bar">
        <div className="tab-group" role="tablist" aria-label="Quick Pass Mode">
          <button
            role="tab"
            aria-selected={tab === "send"}
            className={tab === "send" ? "tab active" : "tab"}
            onClick={() => {
              resetAlerts();
              setTab("send");
            }}
          >
            Send
          </button>
          <button
            role="tab"
            aria-selected={tab === "receive"}
            className={tab === "receive" ? "tab active" : "tab"}
            onClick={() => {
              resetAlerts();
              setTab("receive");
            }}
          >
            Receive
          </button>
        </div>
      </div>

      {tab === "send" ? (
        <div className="file-workspace">
          <div className="upload-zone compact">
            <h2>Send text to another device</h2>
            <p>
              It is locked with your password before it leaves this browser, and
              deleted when the time runs out.
            </p>
          </div>

          <div className="settings-strip field-row">
            <div className="field">
              <label htmlFor="qp-send-name">Session name</label>
              <div className="with-button">
                <input
                  id="qp-send-name"
                  type="text"
                  placeholder="e.g. notes-laptop"
                  value={sendName}
                  disabled={busy || !!createdSession}
                  onChange={(e) => {
                    resetAlerts();
                    setSendName(e.target.value);
                  }}
                />
                {!createdSession && (
                  <button type="button" onClick={generateRandomName}>
                    Random
                  </button>
                )}
              </div>
            </div>

            <label>
              Password
              <input
                type="password"
                placeholder="Choose a password"
                value={sendPassword}
                disabled={busy || !!createdSession}
                onChange={(e) => {
                  resetAlerts();
                  setSendPassword(e.target.value);
                }}
              />
            </label>

            <label className="narrow">
              Expires after
              <select
                value={duration}
                disabled={busy || !!createdSession}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </label>
          </div>

          <div className="pass-body">
            <label htmlFor="quickpass-text">Text to send</label>
            <textarea
              id="quickpass-text"
              rows={6}
              value={sendText}
              disabled={busy || !!createdSession}
              placeholder="Paste a note, link, code or token…"
              onChange={(e) => {
                resetAlerts();
                setSendText(e.target.value);
              }}
            />
            <div className="pass-submit">
              {!createdSession ? (
                <button
                  className="primary"
                  disabled={busy || !sendText.trim()}
                  onClick={handleSend}
                >
                  {busy ? "Encrypting…" : "Create Quick Pass"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCreatedSession(null);
                    setSendText("");
                    setSendPassword("");
                    setSendName("");
                    resetAlerts();
                  }}
                >
                  Send something else
                </button>
              )}
            </div>
          </div>

          {createdSession && (
            <div className="pass-live">
              <h3>Ready · expires in {timeLeft}</h3>
              <p>
                On your other device, open Quick Pass and enter{" "}
                <strong>{createdSession.name}</strong> with your password, or
                open this link:
              </p>
              <div className="with-button">
                <input
                  type="text"
                  readOnly
                  aria-label="Direct link"
                  value={shareUrl}
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl);
                    setMessage("Link copied.");
                  }}
                >
                  Copy link
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="file-workspace">
          <div className="upload-zone compact">
            <h2>Receive text</h2>
            <p>
              Enter the session name and password. The text is unlocked in this
              browser.
            </p>
          </div>

          <div className="settings-strip field-row">
            <label>
              Session name
              <input
                type="text"
                placeholder="e.g. notes-laptop"
                value={receiveName}
                disabled={busy}
                onChange={(e) => {
                  resetAlerts();
                  setReceiveName(e.target.value);
                  setSearchQuery(e.target.value);
                }}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter password"
                value={receivePassword}
                disabled={busy}
                onChange={(e) => {
                  resetAlerts();
                  setReceivePassword(e.target.value);
                }}
              />
            </label>

            <label className="check-label">
              <input
                type="checkbox"
                checked={burnAfterRead}
                disabled={busy}
                onChange={(e) => setBurnAfterRead(e.target.checked)}
              />
              Delete after reading
            </label>

            <button
              className="primary"
              disabled={busy || !receiveName.trim() || !receivePassword}
              onClick={handleReceive}
            >
              {busy ? "Decrypting…" : "Receive"}
            </button>
          </div>

          {activeSessions.length > 0 && (
            <div className="pass-recent">
              <span>Recent:</span>
              {activeSessions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setReceiveName(s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {decryptedText && (
            <div className="pass-result">
              <div className="pass-result-head">
                <label htmlFor="qp-received">Received text</label>
                <button type="button" onClick={copyText}>
                  Copy text
                </button>
              </div>
              <textarea
                id="qp-received"
                readOnly
                rows={6}
                value={decryptedText}
              />
              {burned && (
                <p className="pass-burned">
                  This pass has been deleted from the server.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="tool-result-bar">
        <p role="status">
          {message ||
            (busy
              ? "Working…"
              : "Only you and the password holder can read the text.")}
        </p>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <p className="tool-note">
        Encrypted in your browser with AES-256-GCM (key from PBKDF2). The server
        only ever stores unreadable data, and deletes it when the pass expires.
      </p>
    </>
  );
}
