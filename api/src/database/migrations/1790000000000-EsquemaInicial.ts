import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema tal y como lo definió la universidad, sin las columnas que después
 * se agregaron por acuerdo con el frontend.
 *
 * Si la base destino YA tiene estas tablas, marca esta migracion como aplicada
 * en lugar de ejecutarla:
 *   INSERT INTO migrations (name, timestamp) VALUES ('EsquemaInicial', 1790000000000);
 */
export class EsquemaInicial1790000000000 implements MigrationInterface {
  name = 'EsquemaInicial1790000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE ADMINISTRADORES (
        id_administrador INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(150) NOT NULL,
        correo VARCHAR(180) NOT NULL,
        contrasena_hash VARCHAR(120) NOT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_administrador),
        UNIQUE KEY uq_administradores_correo (correo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await q.query(`
      CREATE TABLE CATEGORIAS (
        id_categoria INT NOT NULL AUTO_INCREMENT,
        nombre VARCHAR(80) NOT NULL,
        descripcion VARCHAR(255) NULL,
        activa TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (id_categoria),
        UNIQUE KEY uq_categorias_nombre (nombre)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await q.query(`
      CREATE TABLE PUBLICACIONES (
        id_publicacion INT NOT NULL AUTO_INCREMENT,
        id_administrador INT NOT NULL,
        id_categoria INT NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT NOT NULL,
        imagen_url VARCHAR(500) NULL,
        fecha_evento DATE NOT NULL,
        hora_evento TIME NOT NULL,
        lugar VARCHAR(200) NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id_publicacion),
        KEY idx_publicaciones_administrador (id_administrador),
        KEY idx_publicaciones_estado (estado),
        KEY idx_publicaciones_fecha_evento (fecha_evento),
        CONSTRAINT fk_publicaciones_administrador
          FOREIGN KEY (id_administrador) REFERENCES ADMINISTRADORES (id_administrador)
          ON DELETE CASCADE,
        CONSTRAINT fk_publicaciones_categoria
          FOREIGN KEY (id_categoria) REFERENCES CATEGORIAS (id_categoria)
          ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // `nombre` guarda el slug que el front ya consume como `tipo`.
    await q.query(`
      INSERT INTO CATEGORIAS (nombre, descripcion, activa) VALUES
        ('evento',        'Eventos y Conferencias', 1),
        ('convocatoria',  'Convocatorias y Postulaciones', 1),
        ('aviso',         'Avisos y Comunicados Oficiales', 1),
        ('noticia',       'Noticias Universitarias', 1),
        ('institucional', 'Informacion Institucional y Rectoria', 1)
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS PUBLICACIONES');
    await q.query('DROP TABLE IF EXISTS CATEGORIAS');
    await q.query('DROP TABLE IF EXISTS ADMINISTRADORES');
  }
}