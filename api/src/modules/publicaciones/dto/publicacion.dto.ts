import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Los 5 tipos sembrados en CATEGORIAS. */
export const TIPOS = ['evento', 'convocatoria', 'aviso', 'noticia', 'institucional'] as const;
export const ESTADOS = ['borrador', 'programada', 'publicada', 'archivada'] as const;

export type TipoPublicacionDto = (typeof TIPOS)[number];
export type EstadoPublicacionDto = (typeof ESTADOS)[number];

export class AdjuntoDto {
  @IsString()
  @MaxLength(180)
  nombre!: string;

  @IsString()
  @MaxLength(1000)
  url!: string;

  @IsString()
  @MaxLength(120)
  tipo!: string;

  @IsInt()
  @Min(0)
  tamanoKb!: number;

  @IsOptional()
  @IsBoolean()
  editable?: boolean;
}

/** Mismo contrato que PublicacionFormValue del front. */
export class CrearPublicacionDto {
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar los 200 caracteres' })
  titulo!: string;

  @IsString()
  @MaxLength(300, { message: 'El resumen no puede superar los 300 caracteres' })
  resumen!: string;

  @IsString()
  @MinLength(1, { message: 'El contenido no puede estar vacío' })
  contenido!: string;

  @IsIn(TIPOS, { message: `El tipo debe ser uno de: ${TIPOS.join(', ')}` })
  tipo!: TipoPublicacionDto;

  @IsIn(ESTADOS, { message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` })
  estado!: EstadoPublicacionDto;

  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  fechaInicio!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  fechaFin?: string | null;

  // 'HH:MM' tal como lo usa el <input type="time"> del formulario.
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'La hora debe tener el formato HH:MM' })
  hora!: string;

  @IsString()
  @MaxLength(200, { message: 'El lugar no puede superar los 200 caracteres' })
  lugar!: string;

  @IsString()
  @MaxLength(150, { message: 'El organizador no puede superar los 150 caracteres' })
  organizador!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitulo?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  pieDeImagen?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imagenUrl?: string | null;

  @IsArray()
  @ArrayMaxSize(20, { message: 'Máximo 20 etiquetas' })
  @IsString({ each: true })
  etiquetas!: string[];

  @IsBoolean()
  destacado!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El cupo máximo debe ser al menos 1' })
  cupoMaximo?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30, { message: 'Máximo 30 adjuntos' })
  @ValidateNested({ each: true })
  @Type(() => AdjuntoDto)
  adjuntos?: AdjuntoDto[];
}

/** En actualizar todo es opcional: solo se pisan los campos enviados. */
export class ActualizarPublicacionDto {
  @IsOptional() @IsString() @MinLength(5) @MaxLength(200)
  titulo?: string;

  @IsOptional() @IsString() @MaxLength(300)
  resumen?: string;

  @IsOptional() @IsString() @MinLength(1)
  contenido?: string;

  @IsOptional() @IsIn(TIPOS)
  tipo?: TipoPublicacionDto;

  @IsOptional() @IsIn(ESTADOS)
  estado?: EstadoPublicacionDto;

  @IsOptional() @IsDateString()
  fechaInicio?: string;

  @IsOptional() @IsDateString()
  fechaFin?: string | null;

  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  hora?: string;

  @IsOptional() @IsString() @MaxLength(200)
  lugar?: string;

  @IsOptional() @IsString() @MaxLength(150)
  organizador?: string;

  @IsOptional() @IsString() @MaxLength(200)
  subtitulo?: string | null;

  @IsOptional() @IsString() @MaxLength(300)
  pieDeImagen?: string | null;

  @IsOptional() @IsString() @MaxLength(500)
  imagenUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  etiquetas?: string[];

  @IsOptional() @IsBoolean()
  destacado?: boolean;

  @IsOptional() @IsInt() @Min(1)
  cupoMaximo?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AdjuntoDto)
  adjuntos?: AdjuntoDto[];
}

export class CambiarEstadoDto {
  @IsIn(ESTADOS, { message: `El estado debe ser uno de: ${ESTADOS.join(', ')}` })
  estado!: EstadoPublicacionDto;
}

export class AjustarInscripcionDto {
  @IsInt({ message: 'El delta debe ser un número entero' })
  delta!: number;
}