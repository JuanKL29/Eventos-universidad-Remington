import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Columnas que el frontend ya consumia y que acordamos agregar para no recortarlo.
 * Todas son aditivas: ningun dato existente se pierde.
 */
export class ColumnasPublicaciones1790000001000 implements MigrationInterface {
  name = 'ColumnasPublicaciones1790000001000';

  public async up(q: QueryRunner): Promise<void> {
    // Resumen para las tarjetas; default '' para no fallar si hay filas.
    await q.query(
      `ALTER TABLE PUBLICACIONES ADD COLUMN resumen VARCHAR(300) NOT NULL DEFAULT ''`,
    );
    // Dependencia organizadora; es distinto del autor de la fila.
    await q.query(
      `ALTER TABLE PUBLICACIONES ADD COLUMN organizador VARCHAR(150) NULL`,
    );
    await q.query(
      `ALTER TABLE PUBLICACIONES ADD COLUMN destacado TINYINT(1) NOT NULL DEFAULT 0`,
    );
    await q.query(`ALTER TABLE PUBLICACIONES ADD COLUMN cupo_maximo INT NULL`);
    await q.query(
      `ALTER TABLE PUBLICACIONES ADD COLUMN inscritos INT NOT NULL DEFAULT 0`,
    );
    // Eventos de varios dias.
    await q.query(`ALTER TABLE PUBLICACIONES ADD COLUMN fecha_fin DATE NULL`);
    await q.query(`ALTER TABLE PUBLICACIONES ADD COLUMN etiquetas JSON NULL`);
    // Sub-bloques del detalle agrupados: ejes, cronograma, requisitos,
    // contacto, adjuntos, subtitulo y pieDeImagen.
    await q.query(`ALTER TABLE PUBLICACIONES ADD COLUMN detalle_extra JSON NULL`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN detalle_extra');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN etiquetas');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN fecha_fin');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN inscritos');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN cupo_maximo');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN destacado');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN organizador');
    await q.query('ALTER TABLE PUBLICACIONES DROP COLUMN resumen');
  }
}