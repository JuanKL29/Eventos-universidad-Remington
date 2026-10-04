import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasController } from './categorias.controller.js';
import { Administrador } from './entities/administrador.entity.js';
import { Categoria } from './entities/categoria.entity.js';
import { Publicacion } from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Publicacion, Categoria, Administrador])],
  controllers: [PublicacionesController, CategoriasController],
  providers: [PublicacionesService],
  exports: [PublicacionesService],
})
export class PublicacionesModule {}