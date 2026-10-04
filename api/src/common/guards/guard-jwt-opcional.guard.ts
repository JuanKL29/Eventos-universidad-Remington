import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Autentica si viene un token, pero NUNCA rechaza la peticion.
 *
 * Sirve para endpoints abiertos que aun así necesitan saber quien pregunta:
 * si eres administrador te enseño los borradores; si eres anonimo o un
 * estudiante, solo lo publicado. En vez de crear dos endpoints, se decide
 * aqui dentro segun el rol que se haya podido resolver.
 */
@Injectable()
export class GuardJwtOpcional extends AuthGuard('jwt') {
  canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest();

    // Sin cabecera Authorization no hay nada que verificar.
    if (!request?.headers?.authorization) return true;

    // Un token caducado o manipulado no debe tumbar la ruta publica: se
    // sigue como anonimo.
    return Promise.resolve(super.canActivate(ctx))
      .then(() => true)
      .catch(() => true);
  }
}