import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('UAE Accounting Platform API')
    .setDescription('Vyapar-class SaaS for UAE SMEs - Accounting, Invoicing, Inventory & Compliance API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Accounting & Ledger')
    .addTag('Tax & Compliance')
    .addTag('Sales & Billing')
    .addTag('Offline Sync')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 UAE Accounting Platform API running on port ${port}`);
  console.log(`📑 OpenAPI documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
