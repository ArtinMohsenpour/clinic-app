// lib/storage.ts
import path from "path";
import fs from "fs/promises";

export type SaveResult = { url: string; key: string };

export interface StorageDriver {
  save(opts: {
    buffer: Buffer;
    key: string;
    contentType: string;
  }): Promise<SaveResult>;
  remove?(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class LocalDisk implements StorageDriver {
  private rootFs: string; // absolute folder for files
  private publicBase: string; // public URL base

  constructor({
    root = path.join(process.cwd(), "public", "uploads"),
    publicBase = "/uploads",
  } = {}) {
    this.rootFs = root;
    this.publicBase = publicBase;
  }

  async save({
    buffer,
    key,
  }: {
    buffer: Buffer;
    key: string;
    contentType: string;
  }) {
    const fullPath = path.join(this.rootFs, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return { url: this.publicUrl(key), key };
  }

  async remove(key: string) {
    const fullPath = path.join(this.rootFs, key);
    await fs.rm(fullPath, { force: true });
  }

  publicUrl(key: string) {
    return `${this.publicBase}/${key}`.replace(/\/+/g, "/");
  }
}

// Later: S3-compatible adapter (MinIO/R2/B2/etc.)
/*
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
class S3Storage implements StorageDriver { ... }
*/

export function getStorage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return new LocalDisk();
  // if (driver === "s3") return new S3Storage(/* envs */);
  return new LocalDisk();
}
