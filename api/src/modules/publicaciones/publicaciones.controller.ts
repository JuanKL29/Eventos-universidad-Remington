import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GuardJwtOpcional } from '../../common/guards/guard-jwt-opcional.guard.js';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import type { UsuarioAutenticado } from '../../common/decorators/usuario-actual.decorator.js';
import {
  ActualizarPublicacionDto,
  AjustarInscripcionDto,
  CambiarEstadoDto,
  CrearPublicacionDto,
} from './dto/publicacion.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicaciones: PublicacionesService) {}

  /**
   * Abierto a todo el mundo: no hace falta sesion para ver el tablero.
   *
   * El guard opcional resuelve el rol si hay token, y con eso decide si el
   * que pregunta es admin (ve tambien los borradores) o no.
   */
  @Publico()
  @UseGuards(GuardJwtOpcional)
  @Get()
  listar(@UsuarioActual() usuario?: UsuarioAutenticado) {
    return this.publicaciones.listar(usuario?.rol === 'administrador');
  }

  @Publico()
  @UseGuards(GuardJwtOpcional)
  @Get(':id')
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario?: UsuarioAutenticado,
  ) {
    return this.publicaciones.obtenerPorId(id, usuario?.rol === 'administrador');
  }

  @Roles('administrador')
  @Post()
  crear(
    @Body() dto: CrearPublicacionDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.publicaciones.crear(dto, usuario.id);
  }

  @Roles('administrador')
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPublicacionDto,
  ) {
    return this.publicaciones.actualizar(id, dto);
  }

  @Roles('administrador')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.publicaciones.eliminar(id);
  }

  @Roles('administrador')
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.publicaciones.cambiarEstado(id, dto.estado);
  }

  @Roles('administrador')
  @Patch(':id/destacado')
  alternarDestacado(@Param('id', ParseIntPipe) id: number) {
    return this.publicaciones.alternarDestacado(id);
  }

  /** Publica: es la acción de "registrarse" del cartelera. */
  @Publico()
  @Patch(':id/inscripcion')
  ajustarInscripcion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarInscripcionDto,
  ) {
    return this.publicaciones.ajustarInscripcion(id, dto.delta);
  }
}