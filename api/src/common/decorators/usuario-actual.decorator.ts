import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface UsuarioAutenticado {
  id: number;
  correo: string;
  rol: string;
  nombre: string;
}

/**
 * Inyecta el usuario resuelto del token en el controlador.
 * Passport guarda lo que devuelve JwtStrategy.validate() en `request.user`,
 * por eso se lee de ahi y no de una propiedad propia.
 */
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const peticion = ctx.switchToHttp().getRequest<Request & { user?: UsuarioAutenticado }>();
    return peticion.user as UsuarioAutenticado;
  },
);