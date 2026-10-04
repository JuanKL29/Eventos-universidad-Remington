import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Envoltorio de error uniforme para el front. Angular lee `error` del body,
 * asi que siempre devolvemos JSON con la misma forma.
 */
@Catch()
export class FiltroExcepcionGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionGlobal.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const respuesta = ctx.getResponse<Response>();
    const peticion = ctx.getRequest<Request>();

    const status =
      excepcion instanceof HttpException
        ? excepcion.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let mensaje: string | string[] = 'Error interno del servidor';

    if (excepcion instanceof HttpException) {
      const cuerpo = excepcion.getResponse();
      if (typeof cuerpo === 'string') {
        mensaje = cuerpo;
      } else if (cuerpo && typeof cuerpo === 'object') {
        const m = (cuerpo as { message?: string | string[] }).message;
        mensaje = m ?? mensaje;
      }
    } else if (excepcion instanceof Error) {
      mensaje = excepcion.message;
    }

    if (status >= 500) {
      this.logger.error(
        `${peticion.method} ${peticion.originalUrl} -> ${status}`,
        excepcion instanceof Error ? excepcion.stack : String(excepcion),
      );
    } else {
      this.logger.warn(`${peticion.method} ${peticion.originalUrl} -> ${status}: ${String(mensaje)}`);
    }

    respuesta.status(status).json({
      statusCode: status,
      mensaje,
      timestamp: new Date().toISOString(),
      ruta: peticion.originalUrl,
    });
  }
}