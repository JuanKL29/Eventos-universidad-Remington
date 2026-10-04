import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { CLAVE_SESION } from '../config/api.config';
import { Sesion } from '../models/usuario.model';

/**
 * Añade el token JWT a las peticiones y limpia la sesión guardada cuando el
 * backend responde 401, para que un token caducado no deje al usuario en una
 * pantalla muerta.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  let token: string | null = null;

  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    token = crudo ? (JSON.parse(crudo) as Sesion).token : null;
  } catch {
    token = null;
  }

  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error) => {
      // Un 401 al iniciar sesion es "credenciales malas", no sesion caducada:
      // en ese caso no hay nada que limpiar.
      const esLogin = peticion.url.endsWith('/auth/login');
      if (error.status === 401 && !esLogin) {
        localStorage.removeItem(CLAVE_SESION);
      }
      return throwError(() => error);
    }),
  );
};