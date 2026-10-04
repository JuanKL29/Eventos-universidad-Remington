import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../../common/decorators/roles.decorator.js';
import type { Rol } from '../../../common/decorators/roles.decorator.js';

export class CrearAdministradorDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150)
  nombre!: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(180)
  correo!: string;

  // 72 es el limite real de bcrypt: a partir de ahi se trunca en silencio.
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  contrasena!: string;

  /** Por defecto 'administrador'. */
  @IsOptional()
  @IsIn(ROLES, { message: `El rol debe ser uno de: ${ROLES.join(', ')}` })
  rol?: Rol;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  carrera?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}