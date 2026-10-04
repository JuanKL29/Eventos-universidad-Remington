import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CLAVE_PUBLICA } from '../decorators/publico.decorator.js';

/**
 * Guard global: por defecto TODAS las rutas exigen token.
 * Las que deban quedar abiertas se marcan con @Publico().
 * Asi no se olvida proteger un endpoint nuevo por descuido.
 */
@Injectable()
export class GuardJwt extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    const esPublica = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (esPublica) return true;

    return super.canActivate(ctx);
  }
}