import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../../common/decorators/usuario-actual.decorator.js';
import { AuthService } from './auth.service.js';
import type { UsuarioRespuesta } from './auth.service.js';
import { CrearAdministradorDto } from './dto/crear-administrador.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Publico: es el unico endpoint al que se llega sin token. */
  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() datos: LoginDto) {
    return this.auth.login(datos);
  }

  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioAutenticado): Promise<UsuarioRespuesta> {
    return this.auth.perfil(usuario.id);
  }

  @Roles('administrador')
  @Get('administradores')
  listarAdministradores(): Promise<UsuarioRespuesta[]> {
    return this.auth.listar();
  }

  @Roles('administrador')
  @Post('administradores')
  crearAdministrador(@Body() datos: CrearAdministradorDto): Promise<UsuarioRespuesta> {
    return this.auth.crearAdministrador(datos);
  }

  @Roles('administrador')
  @Patch('administradores/:id/activo')
  alternarEstado(@Param('id', ParseIntPipe) id: number): Promise<UsuarioRespuesta> {
    return this.auth.alternarEstado(id);
  }
}