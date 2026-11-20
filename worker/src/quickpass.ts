import { Hono } from "hono";
import { z } from "zod";
import { type App, body, fail, one, run } from "./core";

export const quickpass = new Hono<App>();

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-zA-Z0-9_\-.]+$/, "Use letters, numbers, hyphens, and dots."),
  salt: z.string().min(10).max(128),
  iv: z.string().min(10).max(128),
  passHash: z.string().min(10).max(256),
  ciphertext: z.string().min(1).max(200000),
  durationMinutes: z.number().int().min(1).max(15).default(10),
});

quickpass.post("/quickpass", async (c) => {
  const data = await body(c, createSchema);
  const now = Date.now();

  // Check if name is currently taken and not expired
  const existing = await one<{ name: string }>(
    c,
    "SELECT name FROM quick_pass WHERE name=? AND expires_at>?",
    data.name,
    now,
  );
  if (existing) {
    fail(409, "nameTaken");
  }

  const duration = (data.durationMinutes || 10) * 60 * 1000;
  const expiresAt = now + duration;

  await run(
    c,
    "INSERT OR REPLACE INTO quick_pass(name, salt, iv, pass_hash, ciphertext, created_at, expires_at) VALUES(?,?,?,?,?,?,?)",
    data.name,
    data.salt,
    data.iv,
    data.passHash,
    data.ciphertext,
    now,
    expiresAt,
  );

  return c.json({ name: data.name, expiresAt }, 201);
});

quickpass.get("/quickpass", async (c) => {
  const search = c.req.query("search")?.trim() || "";
  const now = Date.now();
  let query =
    "SELECT name, created_at, expires_at FROM quick_pass WHERE expires_at>?";
  const params: unknown[] = [now];

  if (search) {
    query += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  query += " ORDER BY created_at DESC LIMIT 25";

  const rows = await run<{
    name: string;
    created_at: number;
    expires_at: number;
  }>(c, query, ...params);

  return c.json({
    sessions: rows.results.map((r) => ({
      name: r.name,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    })),
  });
});

const retrieveSchema = z.object({
  passHash: z.string().min(10).max(256),
  burn: z.boolean().optional(),
});

quickpass.post("/quickpass/:name", async (c) => {
  const name = c.req.param("name");
  const data = await body(c, retrieveSchema);
  const now = Date.now();

  const row = await one<{
    name: string;
    salt: string;
    iv: string;
    pass_hash: string;
    ciphertext: string;
    expires_at: number;
  }>(
    c,
    "SELECT name, salt, iv, pass_hash, ciphertext, expires_at FROM quick_pass WHERE name=? AND expires_at>?",
    name,
    now,
  );

  if (!row) {
    fail(404, "notFound");
  }

  if (row.pass_hash !== data.passHash) {
    fail(403, "incorrectPassword");
  }

  if (data.burn) {
    await run(c, "DELETE FROM quick_pass WHERE name=?", name);
  }

  return c.json({
    name: row.name,
    salt: row.salt,
    iv: row.iv,
    ciphertext: row.ciphertext,
    expiresAt: row.expires_at,
    burned: !!data.burn,
  });
});

quickpass.delete("/quickpass/:name", async (c) => {
  const name = c.req.param("name");
  const data = await body(c, retrieveSchema);
  const now = Date.now();

  const row = await one<{ pass_hash: string }>(
    c,
    "SELECT pass_hash FROM quick_pass WHERE name=? AND expires_at>?",
    name,
    now,
  );

  if (!row) fail(404, "notFound");
  if (row.pass_hash !== data.passHash) fail(403, "incorrectPassword");

  await run(c, "DELETE FROM quick_pass WHERE name=?", name);
  return c.json({ ok: true });
});
