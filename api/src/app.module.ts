import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validarEntorno } from './config/env.validation.js';
import { GuardJwt } from './common/guards/guard-jwt.guard.js';
import { GuardRoles } from './common/guards/guard-roles.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PublicacionesModule } from './modules/publicaciones/publicaciones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validarEntorno,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // MariaDB 10.4 de XAMPP via driver mysql2.
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        charset: 'utf8mb4',
        // Fechas civiles: con 'Z' el dia se corria un dia hacia atras.
        timezone: 'local',
        // El esquema se(versiona con migraciones, nunca con synchronize.
        synchronize: false,
        logging: config.get<boolean>('DB_LOGGING'),
        autoLoadEntities: true,
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false,
      }),
    }),
    PublicacionesModule,
    AuthModule,
  ],
  providers: [
    // Orden importa: primero se valida el token, luego los roles.
    { provide: APP_GUARD, useClass: GuardJwt },
    { provide: APP_GUARD, useClass: GuardRoles },
  ],
})
export class AppModule {}