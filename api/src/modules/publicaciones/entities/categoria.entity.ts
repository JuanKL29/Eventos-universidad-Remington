import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * CATEGORIAS
 * Sustituye al enum TipoPublicacion del front: evento, convocatoria, aviso,
 * noticia, institucional. Se siembran como filas, no como enum de MySQL, para
 * que la universidad pueda agregar tipos sin cambiar el esquema.
 */
@Entity({ name: 'CATEGORIAS' })
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria', type: 'int' })
  id!: number;

  @Index('uq_categorias_nombre', { unique: true })
  @Column({ name: 'nombre', type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, nullable: true })
  descripcion!: string | null;

  @Column({ name: 'activa', type: 'boolean', default: true })
  activa!: boolean;
}