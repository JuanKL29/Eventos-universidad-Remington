import {
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { sanearHtml, htmlATexto } from '../../../core/utils/sanitizador-html';
import { fechaLarga } from '../../../core/utils/fechas';
import {
  Adjunto,
  EstadoPublicacion,
  Publicacion,
  PublicacionFormValue,
  TipoPublicacion,
} from '../../../core/models/publicacion.model';

interface OpcionEstado {
  valor: EstadoPublicacion;
  titulo: string;
  descripcion: string;
}

interface OpcionTipo {
  valor: TipoPublicacion;
  etiqueta: string;
}

@Component({
  selector: 'app-publicacion-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './publicacion-form.html',
  styleUrl: './publicacion-form.scss',
})
export class PublicacionForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pub = inject(PublicacionesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly editor = viewChild<ElementRef<HTMLDivElement>>('editor');

  protected readonly fechaLarga = fechaLarga;
  protected readonly LIMITE_TITULO = 120;

  // ------------------------------------------------------------------ estado
  protected readonly esEdicion = signal(false);
  protected readonly publicacion = signal<Publicacion | null>(null);
  protected readonly noEncontrada = signal(false);
  protected readonly guardando = signal(false);
  protected readonly modalBorrado = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly adjuntos = signal<Adjunto[]>([]);
  protected readonly imagenUrl = signal<string | null>(null);

  protected readonly tituloPagina = computed(() =>
    this.esEdicion() ? 'Editar Publicación' : 'Crear Nueva Publicación',
  );
  protected readonly textoBoton = computed(() =>
    this.esEdicion() ? 'Guardar cambios' : 'Crear publicación',
  );
  protected readonly mimeImagen = computed(() => {
    const url = this.imagenUrl();
    if (!url) return '';
    return /^data:([^;]+);/.exec(url)?.[1] ?? 'image/*';
  });

  protected readonly tipos: OpcionTipo[] = [
    { valor: 'noticia', etiqueta: 'Noticias Universitarias' },
    { valor: 'aviso', etiqueta: 'Avisos y Comunicados Oficiales' },
    { valor: 'evento', etiqueta: 'Eventos y Conferencias' },
    { valor: 'convocatoria', etiqueta: 'Convocatorias y Postulaciones' },
    { valor: 'institucional', etiqueta: 'Información Institucional & Rectoría' },
  ];

  /** Los estados reales del modelo; el diseno original solo ofrecia dos. */
  protected readonly estados: OpcionEstado[] = [
    { valor: 'publicada', titulo: 'Publicar inmediatamente', descripcion: 'Visible en cartelera pública' },
    { valor: 'programada', titulo: 'Programar publicación', descripcion: 'Se publica en la fecha indicada' },
    { valor: 'borrador', titulo: 'Guardar como borrador', descripcion: 'Solo visible para administradores' },
    { valor: 'archivada', titulo: 'Archivada', descripcion: 'Retirada de la cartelera' },
  ];

  // ---------------------------------------------------------------- formulario
  protected readonly formulario = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(this.LIMITE_TITULO)],
    }),
    tipo: new FormControl<TipoPublicacion>('noticia', { nonNullable: true }),
    estado: new FormControl<EstadoPublicacion>('publicada', { nonNullable: true }),
    fechaInicio: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hora: new FormControl('09:00', { nonNullable: true }),
    resumen: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lugar: new FormControl('', { nonNullable: true }),
    organizador: new FormControl('', { nonNullable: true }),
    etiquetas: new FormControl('', { nonNullable: true }),
    destacado: new FormControl(false, { nonNullable: true }),
    cupoMaximo: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) return;

    const existente = this.pub.publicaciones().find((p) => p.id === id);
    if (!existente) {
      this.noEncontrada.set(true);
      return;
    }
    this.esEdicion.set(true);
    this.publicacion.set(existente);
    this.adjuntos.set([...(existente.adjuntos ?? [])]);
    this.imagenUrl.set(existente.imagenUrl ?? null);

    this.formulario.patchValue({
      titulo: existente.titulo,
      tipo: existente.tipo,
      estado: existente.estado,
      fechaInicio: this.aIso(existente.fechaInicio),
      hora: existente.hora.slice(0, 5),
      resumen: existente.resumen,
      lugar: existente.lugar,
      organizador: existente.organizador,
      etiquetas: existente.etiquetas.join(', '),
      destacado: existente.destacado,
      cupoMaximo: existente.cupoMaximo ?? null,
    });

    // El contenido puede venir como texto plano (mock) o como HTML (editor).
    queueMicrotask(() => this.escribirEnEditor(existente.contenido));
  }

  /** Acepta 'YYYY-MM-DD' y tambien la fecha corta 'DD-MM-YYYY' del mock. */
  private aIso(fecha: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    const partes = fecha.split('-');
    if (partes.length !== 3) return '';
    const [, mes, dia] = partes;
    return `${partes[0]}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  protected contadorTitulo(): number {
    return this.formulario.get('titulo')?.value.length ?? 0;
  }

  // ------------------------------------------------------------------- editor
  private escribirEnEditor(valor: string): void {
    const el = this.editor()?.nativeElement;
    if (!el) return;
    const pareceHtml = /<\/?[a-z][\s\S]*>/i.test(valor);
    el.innerHTML = pareceHtml ? valor : valor
      .split(/\n{2,}/)
      .map((p) => `<p>${this.escapar(p)}</p>`)
      .join('');
  }

  private escapar(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  protected aplicarFormato(comando: string, valor?: string): void {
    this.editor()?.nativeElement.focus();
    document.execCommand(comando, false, valor);
    this.formulario.markAsDirty();
  }

  protected crearEnlace(): void {
    const url = window.prompt('URL del enlace');
    if (!url) return;
    this.aplicarFormato('createLink', url);
  }

  protected contenidoActual(): string {
    return sanearHtml(this.editor()?.nativeElement.innerHTML ?? '');
  }

  // ---------------------------------------------------------------- adjuntos
  protected agregarAdjuntos(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    if (!nuevos.length) return;

    const validos = nuevos.filter((f) => f.size <= 25 * 1024 * 1024);
    const rechazados = nuevos.length - validos.length;

    const agregados: Adjunto[] = validos.map((f) => ({
      nombre: f.name,
      url: '',
      tipo: f.type || 'application/octet-stream',
      tamanoKb: Math.max(1, Math.round(f.size / 1024)),
      editable: false,
    }));

    this.adjuntos.update((lista) => [...lista, ...agregados]);
    this.toast.mostrar(`${agregados.length} archivo(s) adjuntos`, 'attach_file');
    if (rechazados > 0) {
      this.toast.mostrar(`${rechazados} archivo(s) superan el límite de 25MB`, 'error');
    }
    input.value = '';
  }

  protected quitarAdjunto(indice: number): void {
    this.adjuntos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  protected tamanoLegible(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }

  // ------------------------------------------------------------------ imagen
  protected elegirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.toast.mostrar('El archivo debe ser una imagen', 'error');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.toast.mostrar('La imagen supera el límite de 5MB', 'error');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      this.imagenUrl.set(String(lector.result));
      this.toast.mostrar('Imagen destacada actualizada', 'image');
    };
    lector.readAsDataURL(archivo);
  }

  protected quitarImagen(): void {
    this.imagenUrl.set(null);
  }

  // ------------------------------------------------------------------ acciones
  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.toast.mostrar('Completa los campos obligatorios', 'error');
      return;
    }

    const v = this.formulario.getRawValue();
    const contenido = this.contenidoActual();
    if (!htmlATexto(contenido)) {
      this.toast.mostrar('El contenido de la publicación no puede estar vacío', 'error');
      return;
    }

    const valor: PublicacionFormValue = {
      titulo: v.titulo.trim(),
      // El resumen es texto plano aunque el cuerpo sea HTML.
      resumen: v.resumen.trim(),
      contenido,
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
      imagenUrl: this.imagenUrl(),
      adjuntos: this.adjuntos(),
    };

    this.guardando.set(true);
    const id = this.publicacion()?.id;
    const autor = this.auth.usuario()?.nombre ?? 'Usuario actual';

    const operacion = id
      ? this.pub.actualizar(id, valor)
      : this.pub.crear(valor, autor);

    operacion.subscribe((resultado) => {
      this.guardando.set(false);
      this.toast.mostrar(
        id ? 'Publicación actualizada exitosamente' : 'Publicación creada exitosamente',
        'check_circle',
      );
      this.router.navigate(['/admin/publicaciones'], {
        queryParams: id ? { guardado: resultado.id } : undefined,
      });
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/admin/publicaciones']);
  }

  protected abrirBorrado(): void {
    if (this.esEdicion()) this.modalBorrado.set(true);
  }

  protected cerrarBorrado(): void {
    if (!this.eliminando()) this.modalBorrado.set(false);
  }

  protected confirmarBorrado(): void {
    const objetivo = this.publicacion();
    if (!objetivo || this.eliminando()) return;
    this.eliminando.set(true);
    this.pub.eliminar(objetivo.id).subscribe(() => {
      this.eliminando.set(false);
      this.modalBorrado.set(false);
      this.toast.mostrar('Publicación eliminada exitosamente', 'delete');
      this.router.navigate(['/admin/publicaciones']);
    });
  }

  protected campoInvalido(nombre: keyof typeof this.formulario.controls): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}