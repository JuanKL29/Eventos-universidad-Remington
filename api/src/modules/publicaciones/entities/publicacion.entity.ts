import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Administrador } from './administrador.entity.js';
import { Categoria } from './categoria.entity.js';

/** Los cuatro estados que el front ya maneja en EstadoPublicacion. */
export type EstadoPublicacion = 'borrador' | 'programada' | 'publicada' | 'archivada';

export const ESTADOS = [
  'borrador',
  'programada',
  'publicada',
  'archivada',
] as const;

/** Sub-bloques del detalle. Se guardan juntos en una columna JSON. */
export interface EjeParticipacion {
  numero: string;
  titulo: string;
  descripcion: string;
}

export interface FaseCronograma {
  rango: string;
  titulo: string;
  nota: string;
  estado: 'activo' | 'pendiente' | 'cerrado';
}

export interface Adjunto {
  nombre: string;
  url: string;
  tipo: string;
  tamanoKb: number;
  editable?: boolean;
}

export interface DetalleExtra {
  subtitulo?: string;
  pieDeImagen?: string;
  ejes?: EjeParticipacion[];
  cronograma?: FaseCronograma[];
  requisitos?: string[];
  contacto?: { email: string; extension?: string };
  adjuntos?: Adjunto[];
}

/**
 * PUBLICACIONES
 * `estado` es varchar y no enum para permitir agregar estados sin migrar;
 * la API los valida contra ESTADOS antes de escribir.
 */
@Entity({ name: 'PUBLICACIONES' })
@Index('idx_publicaciones_estado', ['estado'])
@Index('idx_publicaciones_fecha_evento', ['fechaEvento'])
@Index('idx_publicaciones_administrador', ['idAdministrador'])
export class Publicacion {
  /** `PrimaryGeneratedColumn`: ver nota en Administrador sobre AUTO_INCREMENT. */
  @PrimaryGeneratedColumn({ name: 'id_publicacion', type: 'int' })
  id!: number;

  @Column({ name: 'id_administrador', type: 'int' })
  idAdministrador!: number;

  @Column({ name: 'id_categoria', type: 'int' })
  idCategoria!: number;

  @ManyToOne(() => Administrador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_administrador' })
  administrador!: Administrador;

  @ManyToOne(() => Categoria, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_categoria' })
  categoria!: Categoria;

  @Column({ name: 'titulo', type: 'varchar', length: 200 })
  titulo!: string;

  /** Texto corto que se muestra en las tarjetas de la cartelera. */
  @Column({ name: 'resumen', type: 'varchar', length: 300, default: '' })
  resumen!: string;

  /** Cuerpo largo; el front lo edita con formato enriquecido. */
  @Column({ name: 'descripcion', type: 'text' })
  descripcion!: string;

  @Column({ name: 'organizador', type: 'varchar', length: 150, nullable: true })
  organizador!: string | null;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl!: string | null;

  @Column({ name: 'fecha_evento', type: 'date' })
  fechaEvento!: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin!: string | null;

  @Column({ name: 'hora_evento', type: 'time' })
  horaEvento!: string;

  @Column({ name: 'lugar', type: 'varchar', length: 200, nullable: true })
  lugar!: string | null;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'borrador' })
  estado!: EstadoPublicacion;

  @Column({ name: 'destacado', type: 'boolean', default: false })
  destacado!: boolean;

  @Column({ name: 'cupo_maximo', type: 'int', nullable: true })
  cupoMaximo!: number | null;

  @Column({ name: 'inscritos', type: 'int', default: 0 })
  inscritos!: number;

  @Column({ name: 'etiquetas', type: 'json', nullable: true })
  etiquetas!: string[] | null;

  /** Sub-bloques del detalle agrupados para no crear 5 tablas hijas. */
  @Column({ name: 'detalle_extra', type: 'json', nullable: true })
  detalleExtra!: DetalleExtra | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime' })
  fechaCreacion!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'datetime' })
  fechaActualizacion!: Date;
}