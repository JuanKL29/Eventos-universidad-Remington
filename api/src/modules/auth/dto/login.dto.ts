import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(180)
  correo!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  @MaxLength(72, { message: 'La contraseña es demasiado larga' })
  contrasena!: string;
}