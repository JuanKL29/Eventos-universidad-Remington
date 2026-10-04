import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { fechaCorta } from '../../../core/utils/fechas';
import {
  EstadoPublicacion,
  Publicacion,
  PublicacionFormValue,
  TipoPublicacion,
} from '../../../core/models/publicacion.model';

type CategoriaFiltro = TipoPublicacion | 'todas';
type EstadoFiltro = EstadoPublicacion | 'todos';

interface TabCategoria {
  valor: CategoriaFiltro;
  etiqueta: string;
}

@Component({
  selector: 'app-panel-admin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.scss',
})
export class PanelAdmin {
  private readonly pub = inject(PublicacionesService);
  private readonly notif = inject(NotificacionesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly fechaCorta = fechaCorta;

  // ---------------------------------------------------------------- signals
  protected readonly busqueda = signal('');
  protected readonly estado = signal<EstadoFiltro>('todos');
  protected readonly categoria = signal<CategoriaFiltro>('todas');
  protected readonly modalAbierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly porEliminar = signal<Publicacion | null>(null);
  protected readonly eliminando = signal(false);

  // ------------------------------------------------------------------- KPIs
  /** Todos los estados, incluida la papelera del admin. */
  protected readonly todas = computed(() =>
    [...this.pub.publicaciones()].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)),
  );

  protected readonly kpiPublicadas = computed(
    () => this.todas().filter((p) => p.estado === 'publicada').length,
  );
  protected readonly kpiProximos = computed(() => this.pub.proximas().length);
  protected readonly kpiBorradores = computed(
    () => this.todas().filter((p) => p.estado === 'borrador' || p.estado === 'programada').length,
  );
  protected readonly kpiNoLeidas = this.notif.noLeidas;
  protected readonly kpiUsuarios = signal(0);

  constructor() {
    this.auth.listarUsuarios().subscribe((lista) => this.kpiUsuarios.set(lista.length));
  }

  // ----------------------------------------------------------------- tabla
  protected readonly tabs: TabCategoria[] = [
    { valor: 'todas', etiqueta: 'Todos los contenidos' },
    { valor: 'evento', etiqueta: 'Eventos' },
    { valor: 'convocatoria', etiqueta: 'Convocatorias' },
    { valor: 'aviso', etiqueta: 'Avisos' },
    { valor: 'noticia', etiqueta: 'Noticias' },
    { valor: 'institucional', etiqueta: 'Institucional' },
  ];

  protected readonly filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    const est = this.estado();
    return this.todas()
      .filter((p) => (cat === 'todas' ? true : p.tipo === cat))
      .filter((p) => (est === 'todos' ? true : p.estado === est))
      .filter((p) =>
        texto
          ? [p.titulo, p.organizador, p.lugar, p.resumen, ...p.etiquetas]
              .join(' ')
              .toLowerCase()
              .includes(texto)
          : true,
      );
  });

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / 8)));
  protected readonly pagina = signal(1);
  protected readonly visibles = computed(() => {
    const inicio = (this.pagina() - 1) * 8;
    return this.filtradas().slice(inicio, inicio + 8);
  });
  protected readonly haySiguiente = computed(() => this.pagina() < this.totalPaginas());
  protected readonly hayAnterior = computed(() => this.pagina() > 1);

  // ----------------------------------------------------------------- estilos
  protected readonly iconoTipo: Record<TipoPublicacion, string> = {
    evento: 'event',
    convocatoria: 'campaign',
    aviso: 'campaign',
    noticia: 'newspaper',
    institucional: 'domain',
  };

  protected readonly fondoIcono: Record<TipoPublicacion, string> = {
    evento: 'bg-secondary-fixed text-on-secondary-fixed',
    convocatoria: 'bg-primary-fixed text-on-primary-fixed',
    aviso: 'bg-error-container text-accent-alert',
    noticia: 'bg-surface-container text-on-surface',
    institucional: 'bg-surface-container text-on-surface-variant',
  };

  protected readonly etiquetaTipo: Record<TipoPublicacion, string> = {
    evento: 'Evento',
    convocatoria: 'Convocatoria',
    aviso: 'Aviso',
    noticia: 'Noticia',
    institucional: 'Institucional',
  };

  protected readonly chipEstado: Record<EstadoPublicacion, string> = {
    publicada: 'bg-secondary-fixed text-on-secondary-fixed',
    programada: 'bg-primary-fixed text-primary',
    borrador: 'bg-surface-container text-on-surface',
    archivada: 'bg-surface-container-high text-on-surface-variant',
  };

  protected readonly puntoEstado: Record<EstadoPublicacion, string> = {
    publicada: 'bg-secondary',
    programada: 'bg-primary',
    borrador: 'bg-outline',
    archivada: 'bg-outline',
  };

  protected readonly etiquetaEstado: Record<EstadoPublicacion, string> = {
    publicada: 'Publicado',
    programada: 'Programada',
    borrador: 'Borrador',
    archivada: 'Archivada',
  };

  /** El diseno original alternaba Publicado <-> Deshabilitado; aqui es
   *  Publicado <-> Archivada, que es el estado real del modelo. */
  protected alternarVisibilidad(p: Publicacion): void {
    const destino: EstadoPublicacion = p.estado === 'publicada' ? 'archivada' : 'publicada';
    this.pub.cambiarEstado(p.id, destino).subscribe((actualizada) => {
      this.toast.mostrar(
        actualizada.estado === 'archivada'
          ? 'Contenido archivado: ya no aparece en la cartelera'
          : 'Contenido publicado y visible en la cartelera',
        actualizada.estado === 'archivada' ? 'visibility_off' : 'done_all',
      );
    });
  }

  // ----------------------------------------------------------------- filtros
  protected actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  protected actualizarEstado(evento: Event): void {
    this.estado.set((evento.target as HTMLSelectElement).value as EstadoFiltro);
    this.pagina.set(1);
  }

  protected aplicarCategoria(valor: CategoriaFiltro): void {
    this.categoria.set(valor);
    this.pagina.set(1);
  }

  protected irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.pagina.set(n);
  }

  // ------------------------------------------------------------------ borrar
  protected pedirBorrado(p: Publicacion): void {
    this.porEliminar.set(p);
  }

  protected cancelarBorrado(): void {
    if (!this.eliminando()) this.porEliminar.set(null);
  }

  protected confirmarBorrado(): void {
    const objetivo = this.porEliminar();
    if (!objetivo || this.eliminando()) return;
    this.eliminando.set(true);
    this.pub.eliminar(objetivo.id).subscribe(() => {
      this.eliminando.set(false);
      this.porEliminar.set(null);
      this.toast.mostrar('Elemento eliminado del sistema', 'delete');
      if (this.pagina() > this.totalPaginas()) this.pagina.set(this.totalPaginas());
    });
  }

  // ------------------------------------------------------------------- modal
  protected readonly formulario = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo: new FormControl<TipoPublicacion>('evento', { nonNullable: true }),
    estado: new FormControl<EstadoPublicacion>('publicada', { nonNullable: true }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hora: new FormControl('09:00', { nonNullable: true, validators: [Validators.required] }),
    lugar: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    organizador: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    resumen: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    etiquetas: new FormControl('', { nonNullable: true }),
    cupoMaximo: new FormControl<number | null>(null),
    destacado: new FormControl(false, { nonNullable: true }),
  });

  protected abrirModal(): void {
    this.formulario.reset({
      tipo: 'evento',
      estado: 'publicada',
      hora: '09:00',
      destacado: false,
      etiquetas: '',
      cupoMaximo: null,
    });
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    if (!this.guardando()) this.modalAbierto.set(false);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.toast.mostrar('Completa los campos obligatorios', 'error');
      return;
    }

    const v = this.formulario.getRawValue();
    const valor: PublicacionFormValue = {
      titulo: v.titulo.trim(),
      resumen: v.resumen.trim(),
      contenido: v.contenido.trim(),
      tipo: v.tipo,
      estado: v.estado,
      fechaInicio: v.fechaInicio,
      hora: v.hora,
      lugar: v.lugar.trim(),
      organizador: v.organizador.trim(),
      etiquetas: v.etiquetas
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
      destacado: v.destacado,
      cupoMaximo: v.cupoMaximo,
    };

    this.guardando.set(true);
    const autor = this.auth.usuario()?.nombre ?? 'Usuario actual';
    this.pub.crear(valor, autor).subscribe(() => {
      this.guardando.set(false);
      this.modalAbierto.set(false);
      // La tabla ordena por actualizadoEn descendente, asi que el nuevo
      // registro queda primero sin necesidad de filtrar la busqueda.
      this.busqueda.set('');
      this.categoria.set('todas');
      this.estado.set('todos');
      this.pagina.set(1);
      this.toast.mostrar('Nuevo contenido guardado', 'library_add_check');
    });
  }

  protected campoInvalido(nombre: keyof typeof this.formulario.controls): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}