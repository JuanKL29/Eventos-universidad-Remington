import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { listaDeOrigenes } from '../config/env.validation.js';

loadEnv();

/**
 * Configuracion compartida entre la app y la CLI de TypeORM (migraciones).
 * `synchronize` queda siempre apagado: el esquema se versiona con migraciones.
 *
 * Tipo `mysql` + mysql2 a proposito: el "MySQL" de XAMPP es MariaDB 10.4, que es
 * compatible con el protocolo y con el driver `mysql` de TypeORM 0.3.x. Se evita
 * TypeORM 1.x porque su driver rompe los INSERT al no recuperar el id autogenerado
 * y porque su driver nativo `mariadb` no es compatible con 0.3.x.
 */
export const opcionesDataSource: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'eventos_uni',
  charset: 'utf8mb4',
  /**
   * Las fechas de evento son fechas civiles (un evento es el 12, ni antes ni
   * despues). Con 'Z' el driver las convertia a UTC y el dia se corria hacia
   * atras en Colombia (UTC-5). 'local' las deja tal cual.
   */
  timezone: 'local',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  migrations: ['dist/database/migrations/*.js'],
  entities: ['dist/**/*.entity.js'],
};

export default new DataSource(opcionesDataSource);

// `dotenv` se carga tambien en main; se exporta la lista para CORS.
export { listaDeOrigenes };