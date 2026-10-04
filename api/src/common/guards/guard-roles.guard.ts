import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CLAVE_ROLES, Rol } from '../decorators/roles.decorator.js';
import type { UsuarioAutenticado } from '../decorators/usuario-actual.decorator.js';

/** Se aplica despues del guard de JWT: exige que el token exista. */
@Injectable()
export class GuardRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Rol[]>(CLAVE_ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!exigidos || exigidos.length === 0) return true;

    // Passport deja el usuario resuelto en `request.user`.
    const peticion = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    const usuario = peticion.user;

    if (!usuario) {
      throw new ForbiddenException('No autenticado');
    }

    if (!exigidos.includes(usuario.rol as Rol)) {
      throw new ForbiddenException(
        `Requiere uno de estos roles: ${exigidos.join(', ')}`,
      );
    }

    return true;
  }
}