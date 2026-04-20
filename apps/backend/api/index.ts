import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express, { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../src/app.module';

let cachedApp: Express | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  cachedApp = server;
  return server;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await bootstrap();
  // @ts-expect-error express accepts Node req/res
  return app(req, res);
}
