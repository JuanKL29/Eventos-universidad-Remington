import { Controller, Get } from '@nestjs/common';
import { Publico } from '../../common/decorators/publico.decorator.js';
import { PublicacionesService } from './publicaciones.service.js';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly publicaciones: PublicacionesService) {}

  /** Alimenta el selector de tipo del formulario. */
  @Publico()
  @Get()
  listar() {
    return this.publicaciones.listarCategorias();
  }
}