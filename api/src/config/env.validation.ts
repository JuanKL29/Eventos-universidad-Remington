import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Falla el arranque si falta o es invalida cualquier variable critica.
 * Mejor un boot ruidoso que un fallo silencioso con un JWT por defecto.
 */
export class VariablesEntorno {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  NODE_ENV = 'development';

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 3306;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD = '';

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsBoolean()
  DB_LOGGING = false;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN = '8h';

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS = 'http://localhost:4300';
}

export function validarEntorno(config: Record<string, unknown>): VariablesEntorno {
  const plano = { ...config };
  // Las variables numéricas llegan como texto.
  plano.PORT = Number(config.PORT ?? 3000);
  plano.DB_PORT = Number(config.DB_PORT ?? 3306);
  plano.DB_LOGGING = String(config.DB_LOGGING ?? 'false') === 'true';

  return plainToInstance(VariablesEntorno, plano);
}

export function listaDeOrigenes(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}