import { it, expect } from "vitest";
import {
  encryptText,
  decryptText,
  hashPassword,
} from "../src/components/services/crypto";

it("encrypts and decrypts text round-trip with password using AES-256-GCM", async () => {
  const secret = "Super secret text snippet between two PCs 12345 বাংলা";
  const password = "mySecurePassword!@#";

  const { salt, iv, ciphertext } = await encryptText(secret, password);
  expect(ciphertext).not.toBe(secret);
  expect(salt).toBeTruthy();
  expect(iv).toBeTruthy();

  const decrypted = await decryptText(ciphertext, iv, salt, password);
  expect(decrypted).toBe(secret);

  // Wrong password must fail decryption
  await expect(
    decryptText(ciphertext, iv, salt, "wrongPassword"),
  ).rejects.toThrow();
});

it("hashes passwords deterministically with given salt", async () => {
  const hash1 = await hashPassword("password123", "fixed-salt-16bytes");
  const hash2 = await hashPassword("password123", "fixed-salt-16bytes");
  const hash3 = await hashPassword("different", "fixed-salt-16bytes");
  expect(hash1).toBe(hash2);
  expect(hash1).not.toBe(hash3);
});
