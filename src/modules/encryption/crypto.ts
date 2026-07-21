import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const encryptedPayloadSchema = z.object({
  version: z.literal(1),
  algorithm: z.literal("aes-256-gcm"),
  iv: z.string().min(1),
  authTag: z.string().min(1),
  ciphertext: z.string().min(1),
});

export type EncryptedPayload = z.infer<typeof encryptedPayloadSchema>;

export function demoMasterKey(): Buffer {
  return createHash("sha256").update("privato-local-demo-key-not-for-production").digest();
}

export function masterKeyFromEnvironment(): Buffer {
  const configured = process.env.PRIVATO_MASTER_KEY;
  if (!configured) return demoMasterKey();
  const key = Buffer.from(configured, "hex");
  if (key.length !== 32) throw new Error("PRIVATO_MASTER_KEY must be 64 hexadecimal characters.");
  return key;
}

export function encryptPayload(value: unknown, key: Buffer): EncryptedPayload {
  if (key.length !== 32) throw new Error("Encryption requires a 32-byte key.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptPayload<T>(payload: EncryptedPayload, key: Buffer): T {
  const parsed = encryptedPayloadSchema.parse(payload);
  const decipher = createDecipheriv(
    parsed.algorithm,
    key,
    Buffer.from(parsed.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(parsed.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parsed.ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
