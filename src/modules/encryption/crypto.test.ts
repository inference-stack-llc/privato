import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptPayload, encryptPayload } from "@/modules/encryption/crypto";

describe("AES-256-GCM payload encryption", () => {
  const key = randomBytes(32);

  it("round trips structured data", () => {
    const source = { memberId: "synthetic-42", details: ["one", "two"] };
    expect(decryptPayload(encryptPayload(source, key), key)).toEqual(source);
  });

  it("uses a fresh nonce so ciphertext differs", () => {
    const first = encryptPayload({ value: "same" }, key);
    const second = encryptPayload({ value: "same" }, key);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
  });

  it("rejects tampering", () => {
    const encrypted = encryptPayload({ value: "protected" }, key);
    const tampered = { ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -2)}AA` };
    expect(() => decryptPayload(tampered, key)).toThrow();
  });
});
