import { promises as fs } from "node:fs";
import { dirname, join, normalize, sep } from "node:path";
import { tmpdir } from "node:os";
import type { PresignedUpload, PutObjectParams, StorageProvider, StoredObject } from "./types.js";

export interface MockStorageOptions {
  /** Where objects are written on disk. Defaults to <tmp>/tally-storage. */
  baseDir?: string;
  /** API base the read/upload URLs point at, e.g. http://localhost:4000/api. */
  publicBaseUrl?: string;
}

/**
 * Disk-backed local storage that stands in for S3/GCS. Objects are written under
 * baseDir and served back through the API (publicBaseUrl + /files/<key>), so an
 * uploaded document opens with a real, working URL. A production adapter
 * implements the same interface against a bucket.
 */
export class MockStorageProvider implements StorageProvider {
  readonly name = "mock";
  private readonly baseDir: string;
  private readonly publicBaseUrl: string;

  constructor(opts: MockStorageOptions = {}) {
    this.baseDir = opts.baseDir ?? join(tmpdir(), "tally-storage");
    this.publicBaseUrl = (opts.publicBaseUrl ?? "http://localhost:4000/api").replace(/\/$/, "");
  }

  // Resolve a key to a path inside baseDir, rejecting traversal.
  private resolve(key: string): string {
    const clean = normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    const full = join(this.baseDir, clean);
    if (full !== this.baseDir && !full.startsWith(this.baseDir + sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(p: PutObjectParams): Promise<StoredObject> {
    const full = this.resolve(p.key);
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, p.body);
    await fs.writeFile(`${full}.meta`, p.contentType, "utf8");
    return { key: p.key, url: this.publicUrl(p.key), contentType: p.contentType, size: p.body.length };
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const full = this.resolve(key);
      const body = await fs.readFile(full);
      const contentType = await fs.readFile(`${full}.meta`, "utf8").catch(() => "application/octet-stream");
      return { body, contentType };
    } catch {
      return null;
    }
  }

  async createPresignedUpload(params: { key: string; contentType: string }): Promise<PresignedUpload> {
    return {
      method: "PUT",
      uploadUrl: `${this.publicBaseUrl}/uploads/${params.key.split("/").map(encodeURIComponent).join("/")}`,
      key: params.key,
      publicUrl: this.publicUrl(params.key),
    };
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/files/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
