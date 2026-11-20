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
        throw new Error("Could not create session. Please try again.");
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
        <span>Quick Pass (Ephemeral Text Transfer)</span>
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
            Create / Send
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
            Access / Receive
          </button>
        </div>
        <span className="workspace-private">End-to-End Encrypted</span>
      </div>

      {tab === "send" ? (
        <div className="file-workspace">
          <div className="upload-zone">
            <span className="upload-symbol" aria-hidden="true">
              🔑
            </span>
            <h2>Send text securely between PCs</h2>
            <p>
              Your text is encrypted client-side with your password before
              upload. Sessions auto-destruct after 5–10 minutes.
            </p>
          </div>

          <div
            className="settings-strip"
            style={{ flexWrap: "wrap", gap: "1rem" }}
          >
            <label style={{ flex: "1 1 200px" }}>
              Session Name *
              <div style={{ display: "flex", gap: "4px" }}>
                <input
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
            </label>

            <label style={{ flex: "1 1 200px" }}>
              Password / Secret PIN *
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

            <label style={{ flex: "0 0 120px" }}>
              Self-Destruct
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

          <div style={{ margin: "1rem 0" }}>
            <label
              htmlFor="quickpass-text"
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Text content to transfer:
            </label>
            <textarea
              id="quickpass-text"
              rows={6}
              value={sendText}
              disabled={busy || !!createdSession}
              placeholder="Paste text, code snippet, token, link, or notes here…"
              onChange={(e) => {
                resetAlerts();
                setSendText(e.target.value);
              }}
            />
          </div>

          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            {!createdSession ? (
              <button
                className="primary"
                disabled={busy || !sendText.trim()}
                onClick={handleSend}
              >
                {busy ? "Encrypting & Storing…" : "Create Quick Pass"}
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
                Create another pass
              </button>
            )}
          </div>

          {createdSession && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                background: "var(--soft, #f0fdf4)",
                border: "1px solid var(--accent, #0f766e)",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Pass is live! Remaining time:{" "}
                <span style={{ color: "#b45309" }}>{timeLeft}</span>
              </h3>
              <p>
                On your other PC, open Quick Pass, enter session name{" "}
                <strong>{createdSession.name}</strong> and your password.
              </p>
              <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl);
                    setMessage("Direct link copied to clipboard!");
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="file-workspace">
          <div className="upload-zone">
            <span className="upload-symbol" aria-hidden="true">
              📥
            </span>
            <h2>Retrieve transferred text</h2>
            <p>
              Enter the session name and password to decrypt the text in your
              browser.
            </p>
          </div>

          <div
            className="settings-strip"
            style={{ flexWrap: "wrap", gap: "1rem" }}
          >
            <label style={{ flex: "1 1 200px" }}>
              Session Name *
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

            <label style={{ flex: "1 1 200px" }}>
              Password *
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

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "1.25rem",
              }}
            >
              <input
                type="checkbox"
                checked={burnAfterRead}
                disabled={busy}
                onChange={(e) => setBurnAfterRead(e.target.checked)}
              />
              Burn after reading (delete immediately)
            </label>

            <button
              className="primary"
              disabled={busy || !receiveName.trim() || !receivePassword}
              onClick={handleReceive}
            >
              {busy ? "Decrypting…" : "Decrypt & Receive"}
            </button>
          </div>

          {activeSessions.length > 0 && (
            <div
              style={{ margin: "1rem 0", fontSize: "0.85rem", opacity: 0.85 }}
            >
              <span>Recent active sessions: </span>
              {activeSessions.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  style={{
                    padding: "2px 8px",
                    margin: "2px",
                    fontSize: "0.8rem",
                  }}
                  onClick={() => setReceiveName(s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {decryptedText && (
            <div style={{ marginTop: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <strong>Decrypted text:</strong>
                <button type="button" onClick={copyText}>
                  Copy text
                </button>
              </div>
              <textarea
                readOnly
                rows={6}
                value={decryptedText}
                style={{ width: "100%", fontFamily: "monospace" }}
              />
              {burned && (
                <p
                  style={{
                    color: "#b45309",
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                  }}
                >
                  🔥 This session was burned and permanently erased from the
                  server.
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
              ? "Processing cryptographic payload…"
              : "Zero-knowledge encryption protects your text.")}
        </p>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <p className="tool-note">
        Quick Pass uses browser-native WebCrypto (PBKDF2 + AES-GCM 256-bit). The
        server only holds unreadable ciphertext. All sessions are permanently
        erased after 5–10 minutes via database expiry.
      </p>
    </>
  );
}
