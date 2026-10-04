import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { ToastService } from '../../../core/services/toast.service';
import { fechaCorta } from '../../../core/utils/fechas';
import {
  EstadoPublicacion,
  Publicacion,
  TipoPublicacion,
} from '../../../core/models/publicacion.model';

type CategoriaFiltro = TipoPublicacion | 'todas';
type EstadoFiltro = EstadoPublicacion | 'todos';

const POR_PAGINA = 8;

@Component({
  selector: 'app-gestion-publicaciones',
  imports: [RouterLink],
  templateUrl: './gestion-publicaciones.html',
  styleUrl: './gestion-publicaciones.scss',
})
export class GestionPublicaciones {
  protected readonly pub = inject(PublicacionesService);
  private readonly toast = inject(ToastService);

  protected readonly busqueda = signal('');
  protected readonly categoria = signal<CategoriaFiltro>('todas');
  protected readonly estado = signal<EstadoFiltro>('todos');
  protected readonly pagina = signal(1);

  protected readonly porPagina = POR_PAGINA;
  protected readonly fechaCorta = fechaCorta;

  /** El panel administrativo ve TODOS los estados, incluidos borradores */
  protected readonly todas = computed(() =>
    [...this.pub.publicaciones()].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)),
  );

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    const est = this.estado();
    return this.todas()
      .filter((p) => (cat === 'todas' ? true : p.tipo === cat))
      .filter((p) => (est === 'todos' ? true : p.estado === est))
      .filter((p) =>
        texto
          ? [p.titulo, p.organizador, p.resumen, ...p.etiquetas]
              .join(' ')
              .toLowerCase()
              .includes(texto)
          : true,
      );
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / POR_PAGINA)),
  );

  /** [1, 2, 3...] indices de pagina disponibles */
  protected readonly paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1),
  );

  protected readonly visibles = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.filtradas().slice(inicio, inicio + POR_PAGINA);
  });

  protected readonly hayAnterior = computed(() => this.pagina() > 1);
  protected readonly haySiguiente = computed(() => this.pagina() < this.totalPaginas());

  /** Estado pendiente de confirmacion de borrado */
  protected readonly porEliminar = signal<Publicacion | null>(null);
  protected readonly eliminando = signal(false);

  protected readonly iconoCategoria: Record<TipoPublicacion, string> = {
    evento: 'event',
    convocatoria: 'campaign',
    aviso: 'campaign',
    noticia: 'newspaper',
    institucional: 'domain',
  };

  protected readonly fondoIcono: Record<TipoPublicacion, string> = {
    evento: 'bg-primary-fixed text-primary',
    convocatoria: 'bg-primary-fixed text-primary',
    aviso: 'bg-error-container text-accent-alert',
    noticia: 'bg-surface-container text-on-surface',
    institucional: 'bg-surface-container text-on-surface-variant',
  };

  protected readonly chipCategoria: Record<TipoPublicacion, string> = {
    evento: 'bg-secondary-fixed text-primary',
    convocatoria: 'bg-secondary-fixed text-primary',
    aviso: 'bg-error-container text-accent-alert',
    noticia: 'bg-surface-container text-on-surface',
    institucional: 'bg-surface-container text-on-surface-variant',
  };

  protected readonly puntoCategoria: Record<TipoPublicacion, string> = {
    evento: 'bg-primary',
    convocatoria: 'bg-primary',
    aviso: 'bg-accent-alert',
    noticia: 'bg-muted',
    institucional: 'bg-outline',
  };

  protected readonly etiquetaCategoria: Record<TipoPublicacion, string> = {
    evento: 'Evento',
    convocatoria: 'Convocatoria',
    aviso: 'Aviso',
    noticia: 'Noticia',
    institucional: 'Institucional',
  };

  protected readonly chipEstado: Record<EstadoPublicacion, string> = {
    publicada: 'bg-primary-fixed text-primary',
    programada: 'bg-secondary-fixed text-primary',
    borrador: 'bg-surface-container text-on-surface-variant',
    archivada: 'bg-surface-container text-outline',
  };

  protected readonly iconoEstado: Record<EstadoPublicacion, string> = {
    publicada: 'check_circle',
    programada: 'schedule',
    borrador: 'edit_note',
    archivada: 'archive',
  };

  protected readonly etiquetaEstado: Record<EstadoPublicacion, string> = {
    publicada: 'Publicado',
    programada: 'Programada',
    borrador: 'Borrador',
    archivada: 'Archivada',
  };

  protected readonly resumen = computed(() => {
    const total = this.todas().length;
    const visibles = this.filtradas().length;
    if (visibles === total) {
      return `Mostrando ${total} publicaciones`;
    }
    return `Mostrando ${visibles} de ${total} publicaciones`;
  });

  protected actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  protected actualizarCategoria(evento: Event): void {
    this.categoria.set((evento.target as HTMLSelectElement).value as CategoriaFiltro);
    this.pagina.set(1);
  }

  protected actualizarEstado(evento: Event): void {
    this.estado.set((evento.target as HTMLSelectElement).value as EstadoFiltro);
    this.pagina.set(1);
  }

  protected irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) {
      return;
    }
    this.pagina.set(n);
  }

  protected pedirBorrado(p: Publicacion): void {
    this.porEliminar.set(p);
  }

  protected cancelarBorrado(): void {
    if (this.eliminando()) {
      return;
    }
    this.porEliminar.set(null);
  }

  protected confirmarBorrado(): void {
    const objetivo = this.porEliminar();
    if (!objetivo || this.eliminando()) {
      return;
    }
    this.eliminando.set(true);
    this.pub.eliminar(objetivo.id).subscribe(() => {
      this.eliminando.set(false);
      this.porEliminar.set(null);
      this.toast.mostrar('Publicacion eliminada', 'delete');
      if (this.pagina() > this.totalPaginas()) {
        this.pagina.set(this.totalPaginas());
      }
    });
  }
}