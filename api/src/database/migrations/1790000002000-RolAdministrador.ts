import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La tabla ADMINISTRADORES no tenia columna de rol, y el servicio devolvia
 * "administrador" fijo para todo el mundo. Con eso, cualquier cuenta metida en
 * esa tabla quedaba con permisos plenos: un estudiante pasaba el guard del
 * backend y el front lo mandaba a /admin.
 *
 * Se resuelve con una sola columna, sin crear tabla de roles.
 */
export class RolAdministrador1790000002000 implements MigrationInterface {
  name = 'RolAdministrador1790000002000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE ADMINISTRADORES ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'administrador'`,
    );
    // La carrera si aparece en el modelo Usuario del front; se conserva para no
    // perder ese dato de las cuentas existentes.
    await q.query(`ALTER TABLE ADMINISTRADORES ADD COLUMN carrera VARCHAR(120) NULL`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE ADMINISTRADORES DROP COLUMN carrera');
    await q.query('ALTER TABLE ADMINISTRADORES DROP COLUMN rol');
  }
}