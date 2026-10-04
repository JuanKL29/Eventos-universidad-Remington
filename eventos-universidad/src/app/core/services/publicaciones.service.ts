import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MonoTypeOperatorFunction, Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { API_BASE } from '../config/api.config';
import {
  EstadoPublicacion,
  FiltroPublicaciones,
  Publicacion,
  PublicacionFormValue,
  TipoPublicacion,
} from '../models/publicacion.model';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);

  /**
   * Cache local en signal. Los componentes leen de aqui, asi que cualquier
   * escritura pasa por `refrescar()` para volver a pedir la lista al API.
   */
  private readonly lista = signal<Publicacion[]>([]);
  private readonly cargando = signal(false);
  private readonly errorCarga = signal('');

  readonly publicaciones = this.lista.asReadonly();
  readonly cargandoActual = this.cargando.asReadonly();
  readonly errorActual = this.errorCarga.asReadonly();
  readonly publicadas = computed(() =>
    this.lista()
      .filter((p) => p.estado === 'publicada')
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
  );
  readonly destacadas = computed(() => this.publicadas().filter((p) => p.destacado));
  readonly proximas = computed(() =>
    this.lista()
      .filter((p) => p.estado === 'publicada' || p.estado === 'programada')
      .filter((p) => p.fechaInicio >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio)),
  );

  constructor() {
    // Hay que suscribirse: HttpClient es perezoso, asi que llamar a `refrescar()`
    // sin suscribirse no lanza ninguna peticion y los signals quedan vacios.
    this.refrescar().subscribe({
      error: () => {
        /* refrescar() ya dejo el mensaje en errorActual */
      },
    });
  }

  /**
   * El API devuelve TODAS las publicaciones, sin filtrar por estado; el
   * filtrado ocurre aqui para respetar los signals de arriba.
   */
  listar(filtro: FiltroPublicaciones = {}): Observable<Publicacion[]> {
    return this.refrescar().pipe(map(() => this.aplicarFiltro(this.lista(), filtro)));
  }

  obtenerPorId(id: number): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${API_BASE}/publicaciones/${id}`);
  }

  obtenerPorSlug(slug: string): Observable<Publicacion | null> {
    return this.listar().pipe(map((items) => items.find((p) => p.slug === slug) ?? null));
  }

  crear(valor: PublicacionFormValue, _autor = 'Usuario actual'): Observable<Publicacion> {
    return this.http
      .post<Publicacion>(`${API_BASE}/publicaciones`, this.aCuerpo(valor))
      .pipe(this.actualizandoCache());
  }

  actualizar(id: number, valor: PublicacionFormValue): Observable<Publicacion> {
    return this.http
      .put<Publicacion>(`${API_BASE}/publicaciones/${id}`, this.aCuerpo(valor))
      .pipe(this.actualizandoCache());
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE}/publicaciones/${id}`)
      .pipe(this.actualizandoCache());
  }

  cambiarEstado(id: number, estado: EstadoPublicacion): Observable<Publicacion> {
    return this.http
      .patch<Publicacion>(`${API_BASE}/publicaciones/${id}/estado`, { estado })
      .pipe(this.actualizandoCache());
  }

  alternarDestacado(id: number): Observable<Publicacion> {
    return this.http
      .patch<Publicacion>(`${API_BASE}/publicaciones/${id}/destacado`, {})
      .pipe(this.actualizandoCache());
  }

  ajustarInscripcion(id: number, delta: number): Observable<Publicacion | null> {
    return this.http
      .patch<Publicacion | null>(`${API_BASE}/publicaciones/${id}/inscripcion`, { delta })
      .pipe(this.actualizandoCache());
  }

  contarPorTipo(): Record<TipoPublicacion, number> {
    const conteo: Record<TipoPublicacion, number> = {
      evento: 0,
      convocatoria: 0,
      aviso: 0,
      noticia: 0,
      institucional: 0,
    };
    for (const p of this.lista()) {
      conteo[p.tipo] += 1;
    }
    return conteo;
  }

  /**
   * Tras una escritura vuelve a pedir la lista y devuelve el valor original de
   * la respuesta, que es lo que esperan los componentes.
   *
   * Se usa `switchMap` y no `tap(() => this.refrescar())`: `tap` solo invoca la
   * funcion, y como `HttpClient` es perezoso el GET nunca se suscribia, la cache
   * se quedaba con los datos de antes y lo recien creado no aparecia.
   */
  private actualizandoCache<T>(): MonoTypeOperatorFunction<T> {
    return switchMap((valor: T) => this.refrescar().pipe(map(() => valor)));
  }

  /** Vuelve a traer la lista completa y actualiza la cache. */
  refrescar(): Observable<Publicacion[]> {
    this.cargando.set(true);
    this.errorCarga.set('');
    return this.http.get<Publicacion[]>(`${API_BASE}/publicaciones`).pipe(
      map((items) => {
        this.lista.set(items);
        this.cargando.set(false);
        return items;
      }),
      catchError((error) => {
        this.cargando.set(false);
        this.errorCarga.set(this.mensaje(error));
        return throwError(() => new Error(this.mensaje(error)));
      }),
    );
  }

  /** PublicacionFormValue y el DTO del API comparten nombres de campo. */
  private aCuerpo(valor: PublicacionFormValue) {
    return {
      titulo: valor.titulo,
      resumen: valor.resumen,
      contenido: valor.contenido,
      tipo: valor.tipo,
      estado: valor.estado,
      fechaInicio: valor.fechaInicio,
      fechaFin: valor.fechaFin ?? null,
      hora: valor.hora,
      lugar: valor.lugar,
      organizador: valor.organizador,
      subtitulo: valor.subtitulo ?? null,
      pieDeImagen: valor.pieDeImagen ?? null,
      imagenUrl: valor.imagenUrl ?? null,
      etiquetas: valor.etiquetas,
      destacado: valor.destacado,
      cupoMaximo: valor.cupoMaximo ?? null,
      adjuntos: valor.adjuntos ?? [],
    };
  }

  private aplicarFiltro(items: Publicacion[], filtro: FiltroPublicaciones): Publicacion[] {
    const texto = filtro.texto?.trim().toLowerCase();
    return items
      .filter((p) => (filtro.tipo && filtro.tipo !== 'todas' ? p.tipo === filtro.tipo : true))
      .filter((p) => (filtro.estado && filtro.estado !== 'todos' ? p.estado === filtro.estado : true))
      .filter((p) => (filtro.fechaDesde ? p.fechaInicio >= filtro.fechaDesde! : true))
      .filter((p) => (filtro.fechaHasta ? p.fechaInicio <= filtro.fechaHasta! : true))
      .filter((p) =>
        texto
          ? [p.titulo, p.resumen, p.lugar, p.organizador, ...p.etiquetas]
              .join(' ')
              .toLowerCase()
              .includes(texto)
          : true,
      )
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  }

  private mensaje(error: unknown): string {
    const e = error as { error?: { mensaje?: string | string[] } };
    const mensaje = e?.error?.mensaje;
    if (Array.isArray(mensaje)) return mensaje.join('. ');
    return mensaje ?? 'No se pudo comunicar con el servidor.';
  }
}