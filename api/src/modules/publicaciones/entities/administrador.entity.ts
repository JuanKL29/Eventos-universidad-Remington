import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ROLES } from '../../../common/decorators/roles.decorator.js';
import type { Rol } from '../../../common/decorators/roles.decorator.js';

/**
 * ADMINISTRADORES
 *
 * Unico lugar donde se autentica la gente: la tabla no tiene columna de rol
 * propia, asi que se agrego despues (migracion RolAdministrador1790000002000).
 * Guardarla aqui evita tener una segunda tabla de roles.
 *
 * Sin `OneToMany` hacia Publicacion a proposito: mantener la relacion en un solo
 * sentido evita el ciclo de imports ESM que rompe el arranque de TypeORM.
 */
@Entity({ name: 'ADMINISTRADORES' })
export class Administrador {
  /**
   * `PrimaryGeneratedColumn` es obligatorio: la base genera el id con
   * AUTO_INCREMENT. Si se declara como `@Column({primary:true})` a secas,
   * TypeORM no la registra como columna autogenerada, no recupera el id
   * despues del INSERT y los inserts fallan con
   * "Cannot update entity because entity id is not set in the entity".
   */
  @PrimaryGeneratedColumn({ name: 'id_administrador', type: 'int' })
  id!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre!: string;

  @Index('uq_administradores_correo', { unique: true })
  @Column({ name: 'correo', type: 'varchar', length: 180 })
  correo!: string;

  /** Nunca se devuelve en las respuestas del API. */
  @Column({ name: 'contrasena_hash', type: 'varchar', length: 120, select: false })
  contrasenaHash!: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  /** Determina a que panel puede entrar. Ver ROLES en roles.decorator.ts. */
  @Column({ name: 'rol', type: 'varchar', length: 20, default: 'administrador' })
  rol!: Rol;

  @Column({ name: 'carrera', type: 'varchar', length: 120, nullable: true })
  carrera!: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime' })
  fechaCreacion!: Date;
}