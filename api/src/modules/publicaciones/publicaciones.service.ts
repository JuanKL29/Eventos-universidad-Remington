import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { sanearHtml } from '../../common/utils/sanear-html.js';
import { Administrador } from './entities/administrador.entity.js';
import { Categoria } from './entities/categoria.entity.js';
import {
  Adjunto,
  DetalleExtra,
  Publicacion,
} from './entities/publicacion.entity.js';
import type {
  ActualizarPublicacionDto,
  AdjuntoDto,
  CrearPublicacionDto,
} from './dto/publicacion.dto.js';

/**
 * Forma que el front ya consume en Publicacion. Se construye aqui para que el
 * mapeo vivan en un solo lugar y no se disperse por los controladores.
 */
export interface PublicacionRespuesta {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaFin?: string;
  hora: string;
  lugar: string;
  organizador: string;
  subtitulo?: string;
  pieDeImagen?: string;
  ejes?: DetalleExtra['ejes'];
  cronograma?: DetalleExtra['cronograma'];
  requisitos?: string[];
  contacto?: DetalleExtra['contacto'];
  imagenUrl?: string;
  adjuntos?: Adjunto[];
  etiquetas: string[];
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  destacado: boolean;
  cupoMaximo?: number;
  inscritos: number;
}

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectRepository(Publicacion)
    private readonly publicaciones: Repository<Publicacion>,
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
    @InjectRepository(Administrador)
    private readonly administradores: Repository<Administrador>,
  ) {}

  /**
   * Lista sin filtrar por estado, salvo los borradores cuando quien pregunta
   * no es administrador.
   *
   * El filtro va AQUI y no en el front a proposito: antes la API publica
   * devolvia tambien los borradores y el tablero los tapaba en el cliente,
   * asi que cualquiera se los llevaba por HTTP. Ahora el secreto lo guarda el
   * servidor.
   */
  async listar(incluirBorradores = false): Promise<PublicacionRespuesta[]> {
    const filas = await this.publicaciones.find({
      where: incluirBorradores ? {} : { estado: Not('borrador') },
      relations: { administrador: true, categoria: true },
      order: { fechaCreacion: 'DESC' },
    });
    return filas.map((f) => this.aRespuesta(f));
  }

  async obtenerPorId(id: number, esAdministrador = false): Promise<PublicacionRespuesta> {
    const fila = await this.conRelaciones(id);
    if (fila.estado === 'borrador' && !esAdministrador) {
      // 404 y no 403: un borrador debe parecer que no existe para el publico.
      throw new NotFoundException('La publicacion solicitada no existe');
    }
    return this.aRespuesta(fila);
  }

  async crear(dto: CrearPublicacionDto, autorId: number): Promise<PublicacionRespuesta> {
    const categoria = await this.categoriaPorNombre(dto.tipo);

    const entidad = this.publicaciones.create({
      idAdministrador: autorId,
      idCategoria: categoria.id,
      titulo: dto.titulo.trim(),
      resumen: (dto.resumen ?? '').trim(),
      descripcion: sanearHtml(dto.contenido),
      organizador: dto.organizador.trim() || null,
      imagenUrl: dto.imagenUrl ?? null,
      fechaEvento: this.soloFecha(dto.fechaInicio),
      fechaFin: dto.fechaFin ? this.soloFecha(dto.fechaFin) : null,
      horaEvento: this.conSegundos(dto.hora),
      lugar: dto.lugar.trim() || null,
      estado: dto.estado,
      destacado: dto.destacado,
      cupoMaximo: dto.cupoMaximo ?? null,
      inscritos: 0,
      etiquetas: this.normalizarEtiquetas(dto.etiquetas),
      detalleExtra: this.aDetalleExtra(dto),
    });

    const guardada = await this.publicaciones.save(entidad);
    return this.aRespuesta(await this.conRelaciones(guardada.id));
  }

  async actualizar(id: number, dto: ActualizarPublicacionDto): Promise<PublicacionRespuesta> {
    const fila = await this.conRelaciones(id);

    if (dto.titulo !== undefined) fila.titulo = dto.titulo.trim();
    if (dto.resumen !== undefined) fila.resumen = dto.resumen.trim();
    if (dto.contenido !== undefined) fila.descripcion = sanearHtml(dto.contenido);
    if (dto.organizador !== undefined) fila.organizador = dto.organizador.trim() || null;
    if (dto.imagenUrl !== undefined) fila.imagenUrl = dto.imagenUrl;
    if (dto.fechaInicio !== undefined) fila.fechaEvento = this.soloFecha(dto.fechaInicio);
    if (dto.fechaFin !== undefined) {
      fila.fechaFin = dto.fechaFin ? this.soloFecha(dto.fechaFin) : null;
    }
    if (dto.hora !== undefined) fila.horaEvento = this.conSegundos(dto.hora);
    if (dto.lugar !== undefined) fila.lugar = dto.lugar.trim() || null;
    if (dto.estado !== undefined) fila.estado = dto.estado;
    if (dto.destacado !== undefined) fila.destacado = dto.destacado;
    if (dto.cupoMaximo !== undefined) fila.cupoMaximo = dto.cupoMaximo;
    if (dto.etiquetas !== undefined) fila.etiquetas = this.normalizarEtiquetas(dto.etiquetas);
    if (dto.tipo !== undefined) {
      const categoria = await this.categoriaPorNombre(dto.tipo);
      fila.idCategoria = categoria.id;
    }

    // Los sub-bloques se guardan juntos, asi que se rehace el objeto completo
    // mezclando lo que ya habia con lo que llega.
    if (
      dto.subtitulo !== undefined ||
      dto.pieDeImagen !== undefined ||
      dto.adjuntos !== undefined
    ) {
      fila.detalleExtra = {
        ...(fila.detalleExtra ?? {}),
        ...this.aDetalleExtra(dto),
      };
    }

    await this.publicaciones.save(fila);
    return this.aRespuesta(await this.conRelaciones(id));
  }

  async eliminar(id: number): Promise<void> {
    const existe = await this.publicaciones.exist({ where: { id } });
    if (!existe) {
      throw new NotFoundException('La publicación no existe');
    }
    await this.publicaciones.delete(id);
  }

  async cambiarEstado(id: number, estado: string): Promise<PublicacionRespuesta> {
    const fila = await this.conRelaciones(id);
    fila.estado = estado as Publicacion['estado'];
    await this.publicaciones.save(fila);
    return this.aRespuesta(fila);
  }

  async alternarDestacado(id: number): Promise<PublicacionRespuesta> {
    const fila = await this.conRelaciones(id);
    fila.destacado = !fila.destacado;
    await this.publicaciones.save(fila);
    return this.aRespuesta(fila);
  }

  /**
   * Inscripción desde la vista pública. Se limita al cupo y nunca baja de 0.
   * No hay tabla de asistentes, así que es un contador, no un registro.
   */
  async ajustarInscripcion(id: number, delta: number): Promise<PublicacionRespuesta> {
    const fila = await this.conRelaciones(id);
    const tope = fila.cupoMaximo ?? Number.POSITIVE_INFINITY;

    if (delta > 0 && fila.inscritos + delta > tope) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    fila.inscritos = Math.max(0, Math.min(tope, fila.inscritos + delta));
    await this.publicaciones.save(fila);
    return this.aRespuesta(fila);
  }

  async listarCategorias() {
    const filas = await this.categorias.find({ where: { activa: true }, order: { id: 'ASC' } });
    return filas.map((c) => ({ id: c.id, tipo: c.nombre, etiqueta: c.descripcion }));
  }

  // ---helpers -------------------------------------------------------------

  private async conRelaciones(id: number): Promise<Publicacion> {
    const fila = await this.publicaciones.findOne({
      where: { id },
      relations: { administrador: true, categoria: true },
    });
    if (!fila) {
      throw new NotFoundException('La publicación no existe');
    }
    return fila;
  }

  private async categoriaPorNombre(nombre: string): Promise<Categoria> {
    const categoria = await this.categorias.findOne({ where: { nombre, activa: true } });
    if (!categoria) {
      throw new BadRequestException(`El tipo "${nombre}" no existe en CATEGORIAS`);
    }
    return categoria;
  }

  /**
   * MySQL devuelve TIME como 'HH:MM:SS'; el front trabaja con 'HH:MM'.
   */
  private conSegundos(hora: string): string {
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  /**
   * Las fechas se guardan con `timezone: 'local'`, asi que el driver las entrega
   * como Date en hora local. Sin esta conversion, `toISOString()` las correria
   * un dia hacia atras y el orden del panel quedaria mal.
   */
  private aIso(fecha: Date): string {
    return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000).toISOString();
  }

  /** Quita la parte de hora que ClassValidator acepta en un ISO. */
  private soloFecha(iso: string): string {
    return iso.slice(0, 10);
  }

  private normalizarEtiquetas(etiquetas: string[]): string[] {
    const limpio = (etiquetas ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(limpio)].slice(0, 20);
  }

  private aDetalleExtra(dto: {
    subtitulo?: string | null;
    pieDeImagen?: string | null;
    adjuntos?: AdjuntoDto[];
  }): DetalleExtra {
    const detalle: DetalleExtra = {};
    if (dto.subtitulo !== undefined) detalle.subtitulo = dto.subtitulo ?? undefined;
    if (dto.pieDeImagen !== undefined) {
      detalle.pieDeImagen = dto.pieDeImagen ?? undefined;
    }
    if (dto.adjuntos !== undefined) detalle.adjuntos = dto.adjuntos as Adjunto[];
    return detalle;
  }

  private aRespuesta(fila: Publicacion): PublicacionRespuesta {
    const detalle = fila.detalleExtra ?? {};

    return {
      id: fila.id,
      titulo: fila.titulo,
      slug: this.generarSlug(fila.titulo),
      resumen: fila.resumen ?? '',
      contenido: fila.descripcion,
      tipo: fila.categoria?.nombre ?? 'evento',
      estado: fila.estado,
      fechaInicio: fila.fechaEvento,
      fechaFin: fila.fechaFin ?? undefined,
      hora: (fila.horaEvento ?? '').slice(0, 5),
      lugar: fila.lugar ?? '',
      organizador: fila.organizador ?? '',
      subtitulo: detalle.subtitulo,
      pieDeImagen: detalle.pieDeImagen,
      ejes: detalle.ejes,
      cronograma: detalle.cronograma,
      requisitos: detalle.requisitos,
      contacto: detalle.contacto,
      imagenUrl: fila.imagenUrl ?? undefined,
      adjuntos: detalle.adjuntos,
      etiquetas: fila.etiquetas ?? [],
      creadoPor: fila.administrador?.nombre ?? 'Sin autor',
      creadoEn: this.aIso(fila.fechaCreacion),
      actualizadoEn: this.aIso(fila.fechaActualizacion),
      destacado: Boolean(fila.destacado),
      cupoMaximo: fila.cupoMaximo ?? undefined,
      inscritos: fila.inscritos ?? 0,
    };
  }

  /** Idéntico al generarSlug del front para que ambos coincidan. */
  private generarSlug(titulo: string): string {
    return titulo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}