import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { STORAGE_PROVIDER } from "../../integrations/integrations.module.js";
import type { StorageProvider } from "@provira/integrations";

// What a multipart file looks like (avoids depending on @types/multer).
interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);
const ALLOWED_PURPOSES = new Set(["kyc", "evidence", "docs"]);

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
}

@Controller()
export class UploadsController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  /**
   * Accept a document upload and store it via the storage adapter. Returns the
   * object's key + public URL, which the caller then attaches to a KYC request,
   * dispute evidence, etc. Constrained to a small allow-list of image/pdf types.
   */
  @Post("uploads")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: UploadedFileLike | undefined,
    @Req() req: { body?: { purpose?: string } },
  ): Promise<{ key: string; url: string; contentType: string; size: number }> {
    if (!file) throw new BadRequestException("No file provided");
    if (!ALLOWED.has(file.mimetype)) throw new BadRequestException("Unsupported file type");
    if (file.size > MAX_BYTES) throw new BadRequestException("File is too large (max 5MB)");
    const purpose = ALLOWED_PURPOSES.has(req.body?.purpose ?? "") ? req.body!.purpose! : "docs";
    const key = `${purpose}/${randomUUID()}-${safeName(file.originalname)}`;
    const stored = await this.storage.put({ key, contentType: file.mimetype, body: file.buffer });
    return { key: stored.key, url: stored.url, contentType: stored.contentType, size: stored.size };
  }

  /** Serve a stored object back (the mock's read path). */
  @Get("files/*")
  async serve(@Req() req: { params: Record<string, string> }, @Res() res: Response): Promise<void> {
    const key = req.params[0];
    const obj = await this.storage.get(key);
    if (!obj) {
      res.status(404).send("Not found");
      return;
    }
    res.setHeader("Content-Type", obj.contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(obj.body);
  }
}
