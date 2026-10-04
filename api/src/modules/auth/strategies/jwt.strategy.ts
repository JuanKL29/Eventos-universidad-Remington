import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioAutenticado } from '../../../common/decorators/usuario-actual.decorator.js';
import { Administrador } from '../../publicaciones/entities/administrador.entity.js';

export interface CargaToken {
  sub: number;
  correo: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(Administrador)
    private readonly administradores: Repository<Administrador>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Se relee el administrador en cada request para que una desactivacion
   * surta efecto de inmediato, sin esperar a que caduque el token.
   */
  async validate(carga: CargaToken): Promise<UsuarioAutenticado> {
    const administrador = await this.administradores.findOne({
      where: { id: carga.sub },
    });

    if (!administrador || !administrador.activo) {
      throw new UnauthorizedException('La cuenta ya no está activa');
    }

    return {
      id: administrador.id,
      nombre: administrador.nombre,
      correo: administrador.correo,
      // El rol viene de la columna, no de un valor fijo: es lo que hace que el
      // GuardRoles differentiate a un estudiante de un administrador.
      rol: administrador.rol,
    };
  }
}