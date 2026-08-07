import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

// Load the repo-root .env BEFORE @nexus/db instantiates Prisma.
loadEnv({ path: resolve(__dirname, '../../../.env') });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.get<string>('globalPrefix') ?? 'api');
  app.enableCors({ origin: true, credentials: true });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI — the single source of truth for routes + types (upgrade Decision 2).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NEXUS OS API')
    .setDescription('AI-Native Business Operating System — Phase 1 API contract.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port') ?? 4000;
  await app.listen(port);
  console.log(`NEXUS OS API listening on http://localhost:${port}/${config.get<string>('globalPrefix')}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
}

void bootstrap();