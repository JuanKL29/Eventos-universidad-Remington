import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { FiltroExcepcionGlobal } from './common/filters/filtro-excepcion.filter.js';
import { listaDeOrigenes } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Todo el API cuelga de /api para no chocar con las rutas del front.
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: listaDeOrigenes(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new FiltroExcepcionGlobal());
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const puerto = config.get<number>('PORT', 3000);

  await app.listen(puerto);

  new Logger('Bootstrap').log(`API escuchando en http://localhost:${puerto}/api`);
}

await bootstrap();