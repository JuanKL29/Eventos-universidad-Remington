import { SetMetadata } from '@nestjs/common';

export const CLAVE_PUBLICA = 'esPublica';

/** Marca una ruta como accesible sin token (login, cartelera pública). */
export const Publico = () => SetMetadata(CLAVE_PUBLICA, true);