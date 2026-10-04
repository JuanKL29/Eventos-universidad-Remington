import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { Rol } from '../../common/decorators/roles.decorator.js';
import { Administrador } from '../publicaciones/entities/administrador.entity.js';
import { CrearAdministradorDto } from './dto/crear-administrador.dto.js';
import { LoginDto } from './dto/login.dto.js';

/** Campos que el front ya espera en Usuario. Nunca incluir contrasenaHash. */
export interface UsuarioRespuesta {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  carrera?: string;
  activo: boolean;
  creadoEn: string;
}

/** Misma forma que Sesion en el front, para no transformar nada al integrar. */
export interface SesionRespuesta {
  token: string;
  usuario: UsuarioRespuesta;
  expiraEn: string;
}

@Injectable()
export class AuthService {
  private readonly expiraEnSegundos: number;

  constructor(
    @InjectRepository(Administrador)
    private readonly administradores: Repository<Administrador>,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.expiraEnSegundos = this.aSegundos(config.get<string>('JWT_EXPIRES_IN', '8h'));
  }

  async login(datos: LoginDto): Promise<SesionRespuesta> {
    const administrador = await this.administradores
      .createQueryBuilder('administrador')
      // contrasenaHash tiene select:false, hay que pedirla explicitamente.
      .addSelect('administrador.contrasenaHash')
      .where('administrador.correo = :correo', { correo: datos.correo.trim().toLowerCase() })
      .getOne();

    // Mismo mensaje para "no existe" y "contrasena mala": no revelamos
    // que correos estan dados de alta.
    if (!administrador || !(await this.comparar(datos.contrasena, administrador.contrasenaHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (!administrador.activo) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    return this.crearSesion(administrador);
  }

  async crearAdministrador(datos: CrearAdministradorDto): Promise<UsuarioRespuesta> {
    const correo = datos.correo.trim().toLowerCase();

    const existente = await this.administradores.findOne({ where: { correo } });
    if (existente) {
      throw new ConflictException('Ya existe un administrador con ese correo');
    }

    const administrador = this.administradores.create({
      nombre: datos.nombre.trim(),
      correo,
      contrasenaHash: await bcrypt.hash(datos.contrasena, 10),
      activo: datos.activo ?? true,
      rol: datos.rol ?? 'administrador',
      carrera: datos.carrera?.trim() || null,
    });

    await this.administradores.save(administrador);
    return this.aUsuario(administrador);
  }

  async perfil(id: number): Promise<UsuarioRespuesta> {
    const administrador = await this.administradores.findOne({ where: { id } });
    if (!administrador) {
      throw new NotFoundException('El administrador no existe');
    }
    return this.aUsuario(administrador);
  }

  async listar(): Promise<UsuarioRespuesta[]> {
    const filas = await this.administradores.find({
      order: { id: 'ASC' },
    });
    return filas.map((a) => this.aUsuario(a));
  }

  async alternarEstado(id: number): Promise<UsuarioRespuesta> {
    const administrador = await this.administradores.findOne({ where: { id } });
    if (!administrador) {
      throw new NotFoundException('El administrador no existe');
    }
    // Evitar quedarse sin acceso: no se puede desactivar al ultimo activo.
    if (administrador.activo) {
      const activos = await this.administradores.count({ where: { activo: true } });
      if (activos <= 1) {
        throw new ConflictException(
          'No se puede desactivar: es el único administrador activo',
        );
      }
    }

    administrador.activo = !administrador.activo;
    await this.administradores.save(administrador);
    return this.aUsuario(administrador);
  }

  private async crearSesion(administrador: Administrador): Promise<SesionRespuesta> {
    const token = await this.jwt.signAsync({
      sub: administrador.id,
      correo: administrador.correo,
    });

    return {
      token,
      usuario: this.aUsuario(administrador),
      expiraEn: new Date(Date.now() + this.expiraEnSegundos * 1000).toISOString(),
    };
  }

  private aUsuario(administrador: Administrador): UsuarioRespuesta {
    return {
      id: administrador.id,
      nombre: administrador.nombre,
      correo: administrador.correo,
      rol: administrador.rol,
      carrera: administrador.carrera ?? undefined,
      activo: administrador.activo,
      creadoEn: administrador.fechaCreacion.toISOString(),
    };
  }

  private async comparar(contrasena: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(contrasena, hash);
  }

  /** Convierte '8h' / '30m' / '3600' a segundos. */
  private aSegundos(valor: string): number {
    const coincide = /^(\d+)([smhd])?$/.exec(valor.trim());
    if (!coincide) return 8 * 3600;

    const cantidad = Number(coincide[1]);
    switch (coincide[2]) {
      case 's':
        return cantidad;
      case 'm':
        return cantidad * 60;
      case 'h':
        return cantidad * 3600;
      case 'd':
        return cantidad * 86400;
      default:
        return cantidad;
    }
  }
}