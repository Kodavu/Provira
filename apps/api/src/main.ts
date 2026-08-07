import "reflect-metadata";

// Money is stored as BigInt (kobo). JSON.stringify can't serialize BigInt, so
// emit it as a string in API responses — preserving exact values (no float loss).
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  // rawBody: true exposes req.rawBody (a Buffer) so provider webhook signatures
  // can be verified against the exact bytes received, not a re-serialized body.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.enableCors();
  // PaaS platforms (Render, Railway, Cloud Run) inject PORT; fall back to
  // API_PORT for local/compose, then a sane default.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Truvo API listening on http://localhost:${port}/api`);
}

bootstrap();
