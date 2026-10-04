import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { Publicacion, TipoPublicacion } from '../../../core/models/publicacion.model';

type Categoria = 'todas' | TipoPublicacion;
type Orden = 'activas' | 'recientes';

interface CategoriaOpcion {
  valor: Categoria;
  etiqueta: string;
}

@Component({
  selector: 'app-cartelera',
  imports: [DatePipe, RouterLink],
  templateUrl: './cartelera.html',
  styleUrl: './cartelera.scss',
})
export class Cartelera {
  private readonly pub = inject(PublicacionesService);
  protected readonly auth = inject(AuthService);

  protected readonly categorias: CategoriaOpcion[] = [
    { valor: 'todas', etiqueta: 'Todos' },
    { valor: 'noticia', etiqueta: 'Noticias' },
    { valor: 'aviso', etiqueta: 'Avisos' },
    { valor: 'evento', etiqueta: 'Eventos' },
    { valor: 'convocatoria', etiqueta: 'Convocatorias' },
    { valor: 'institucional', etiqueta: 'Institucionales' },
  ];

  protected readonly iconoTipo: Record<TipoPublicacion, string> = {
    evento: 'event',
    convocatoria: 'campaign',
    aviso: 'account_balance',
    noticia: 'newspaper',
    institucional: 'domain',
  };

  protected readonly badgeTipo: Record<TipoPublicacion, string> = {
    evento: 'bg-primary-fixed text-on-primary-fixed-variant',
    convocatoria: 'bg-secondary-fixed text-on-secondary-container',
    aviso: 'bg-tertiary-fixed text-tertiary-container',
    noticia: 'bg-surface-container text-on-surface-variant',
    institucional: 'bg-surface-container text-on-surface-variant',
  };

  protected readonly avatarTipo: Record<TipoPublicacion, string> = {
    evento: 'bg-primary-fixed text-primary',
    convocatoria: 'bg-secondary-fixed text-primary-container',
    aviso: 'bg-tertiary-fixed text-tertiary-container',
    noticia: 'bg-secondary-fixed text-primary-container',
    institucional: 'bg-secondary-fixed text-primary-container',
  };

  protected readonly etiquetaTipo: Record<TipoPublicacion, string> = {
    evento: 'Evento',
    convocatoria: 'Convocatoria',
    aviso: 'Aviso Institucional',
    noticia: 'Noticias',
    institucional: 'Institucional',
  };

  protected readonly busqueda = signal('');
  protected readonly categoria = signal<Categoria>('todas');
  protected readonly orden = signal<Orden>('activas');
  protected readonly modalId = signal<number | null>(null);
  protected readonly guardados = signal<Set<number>>(new Set());

  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    const hoy = new Date().toISOString().slice(0, 10);

    const filtradas = this.pub.publicaciones().filter((p) => {
      // El tablero es abierto: solo se ocultan los borradores, que ni la API
      // devuelve a quien no es administrador. Las archivadas si se muestran.
      if (p.estado === 'borrador') return false;
      if (cat !== 'todas' && p.tipo !== cat) return false;
      if (!texto) return true;
      return [p.titulo, p.resumen, p.lugar, p.organizador, ...p.etiquetas]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });

    return this.orden() === 'recientes'
      ? [...filtradas].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
      : [...filtradas].sort((a, b) => {
          const aFutura = a.fechaInicio >= hoy;
          const bFutura = b.fechaInicio >= hoy;
          if (aFutura !== bFutura) return aFutura ? -1 : 1;
          return a.fechaInicio.localeCompare(b.fechaInicio);
        });
  });

  protected readonly totalGuardados = computed(() => this.guardados().size);
  protected readonly publicacionModal = computed(() => {
    const id = this.modalId();
    return id === null ? null : (this.pub.publicaciones().find((p) => p.id === id) ?? null);
  });

  protected alternarGuardado(id: number, event: Event): void {
    event.stopPropagation();
    this.guardados.update((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  }

  protected abrirModal(id: number): void {
    this.modalId.set(id);
    document.body.style.overflow = 'hidden';
  }

  protected cerrarModal(): void {
    this.modalId.set(null);
    document.body.style.overflow = '';
  }

  protected rangoFechas(p: Publicacion): string {
    if (!p.fechaFin) return this.formatoFecha(p.fechaInicio);
    return `${this.formatoFecha(p.fechaInicio)} - ${this.formatoFecha(p.fechaFin)}`;
  }

  protected formatoFecha(iso: string): string {
    const [anio, mes, dia] = iso.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${dia} de ${meses[Number(mes) - 1]} ${anio}`;
  }

  protected horaLegible(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const periodo = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
  }

  protected disponibilidad(p: Publicacion): number | null {
    if (!p.cupoMaximo) return null;
    return Math.round((p.inscritos / p.cupoMaximo) * 100);
  }

  protected trackPublicacion(_: number, p: Publicacion): number {
    return p.id;
  }
}
