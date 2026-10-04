/**
 * URL base del API.
 *
 * Se usa la URL absoluta en vez de un proxy de desarrollo porque el backend ya
 * tiene CORS configurado para http://localhost:4300 y http://localhost:4200.
 */
export const API_BASE = 'http://localhost:3000/api';

/** Clave de localStorage donde AuthService guarda la sesion. */
export const CLAVE_SESION = 'eu_sesion';