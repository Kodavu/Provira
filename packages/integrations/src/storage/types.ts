// Provider-neutral object storage. NOT modeled on any single vendor — an
// S3 / GCS / R2 adapter implements this same surface (real providers back
// createPresignedUpload with a signed PUT straight to the bucket). The backend
// only ever depends on StorageProvider.

export interface StoredObject {
  key: string; // storage key, e.g. "kyc/<userId>/<uuid>-id.jpg"
  url: string; // URL the object can be read from
  contentType: string;
  size: number;
}

export interface PutObjectParams {
  key: string;
  contentType: string;
  body: Buffer;
}

export interface PresignedUpload {
  method: "PUT";
  uploadUrl: string; // where the client PUTs the bytes
  key: string; // the resulting object key
  publicUrl: string; // where it can be read after upload
  headers?: Record<string, string>;
}

export interface StorageProvider {
  readonly name: string;
  /** Server-side put (used by uploads that proxy through the API). */
  put(params: PutObjectParams): Promise<StoredObject>;
  /** Read bytes back (the mock serves them through the API's /files route). */
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  /** Presigned direct-to-storage upload, for clients that upload out-of-band. */
  createPresignedUpload(params: { key: string; contentType: string }): Promise<PresignedUpload>;
  /** The public read URL for a key. */
  publicUrl(key: string): string;
}
