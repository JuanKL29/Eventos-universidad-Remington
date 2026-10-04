import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source.js';
import { Administrador } from '../modules/publicaciones/entities/administrador.entity.js';

/**
 * Crea las cuentas de prueba con los mismos datos que tenia el mock del front,
 * mas la clave del proyecto. Es idempotente: si el correo ya existe no lo
 * duplica ni le cambia la clave.
 *
 *   npm run seed
 */
const CLAVE = 'Uniremington2026';

const CUENTAS = [
  {
    nombre: 'Ana Restrepo',
    correo: 'admin@uniremington.edu.co',
    rol: 'administrador',
    carrera: null,
  },
  {
    nombre: 'Carlos Mejia',
    correo: 'coordinacion@uniremington.edu.co',
    rol: 'coordinador',
    carrera: 'Ingenieria de Sistemas',
  },
  {
    nombre: 'Juan Pabon',
    correo: 'juanpabon@uniremington.edu.co',
    rol: 'docente',
    carrera: 'Administracion de Empresas',
  },
  {
    nombre: 'Mateo Rios',
    correo: 'mateo.rios@uniremington.edu.co',
    rol: 'estudiante',
    carrera: 'Ingenieria de Sistemas',
  },
] as const;

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    // Importante: la clase entidad, no el nombre de la tabla. Con el string,
    // TypeORM no mapea propiedades a columnas.
    const repositorio = dataSource.getRepository(Administrador);
    const hash = await bcrypt.hash(CLAVE, 10);

    let creadas = 0;

    for (const cuenta of CUENTAS) {
      const existente = await repositorio.findOne({ where: { correo: cuenta.correo } });

      if (existente) {
        console.log(`  = ${cuenta.correo} (ya existia)`);
        continue;
      }

      await repositorio.save(
        repositorio.create({
          nombre: cuenta.nombre,
          correo: cuenta.correo,
          contrasenaHash: hash,
          activo: true,
          rol: cuenta.rol,
          carrera: cuenta.carrera,
        }),
      );

      console.log(`  + ${cuenta.correo} (${cuenta.rol})`);
      creadas += 1;
    }

    console.log(`\n${creadas} cuenta(s) creada(s).`);
    console.log(`Clave para todas: ${CLAVE}`);
    console.log('Cambiar estas claves antes de entregar el proyecto.');
  } finally {
    await dataSource.destroy();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Falló el seed:', error.message);
    if (error.driverError) console.error('  driver:', error.driverError.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  });