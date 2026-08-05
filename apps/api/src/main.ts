import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // `rawBody` lets the Stripe webhook verify signatures against the exact bytes sent.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 4000);
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  app.setGlobalPrefix('api');

  // OpenAPI / Swagger docs at /api/docs.
  if (config.get<string>('NODE_ENV', 'development') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NOVA Commerce API')
      .setDescription('REST API for the NOVA multi-vendor e-commerce platform.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`NOVA API listening on http://localhost:${port}/api`);
}

void bootstrap();
