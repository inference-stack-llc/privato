import type { EncryptedPayload } from "@/modules/encryption/crypto";

export interface StoredDocument {
  id: string;
  sanitizedFilename: string;
  mimeType: string;
  sizeBytes: number;
  encryptedBytes: EncryptedPayload;
}

export interface DocumentStoragePort {
  put(document: StoredDocument): Promise<void>;
  get(id: string): Promise<StoredDocument | undefined>;
}
