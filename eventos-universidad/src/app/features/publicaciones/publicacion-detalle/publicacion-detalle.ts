import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { ToastService } from '../../../core/services/toast.service';
import { Publicacion, TipoPublicacion } from '../../../core/models/publicacion.model';
import { fechaLarga, hora12, rangoFechas } from '../../../core/utils/fechas';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [RouterLink],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.scss',
})
export class PublicacionDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pub = inject(PublicacionesService);
  protected readonly toastSvc = inject(ToastService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );

  protected readonly publicacion = computed<Publicacion | null>(
    () => this.pub.publicaciones().find((p) => p.id === this.id()) ?? null,
  );

  protected readonly guardado = signal(false);

  protected readonly relacionadas = computed<Publicacion[]>(() => {
    const actual = this.publicacion();
    if (!actual) return [];
    return this.pub
      .publicadas()
      .filter((p) => p.id !== actual.id)
      .slice(0, 2);
  });

  protected readonly iconoTipo: Record<TipoPublicacion, string> = {
    evento: 'event',
    convocatoria: 'campaign',
    aviso: 'campaign',
    noticia: 'newspaper',
    institucional: 'domain',
  };

  protected readonly etiquetaTipo: Record<TipoPublicacion, string> = {
    evento: 'Evento Institucional',
    convocatoria: 'Convocatoria',
    aviso: 'Aviso Institucional',
    noticia: 'Noticias Campus',
    institucional: 'Comunicado Institucional',
  };

  protected readonly fechaLarga = fechaLarga;
  protected readonly hora12 = hora12;
  protected readonly rangoFechas = rangoFechas;

  protected alternarGuardado(): void {
    const actual = this.publicacion();
    if (!actual) return;

    this.guardado.update((v) => !v);
    this.toastSvc.mostrar(
      this.guardado()
        ? 'Publicacion guardada en tu coleccion personal'
        : 'Publicacion removida de guardados',
      this.guardado() ? 'bookmark_added' : 'bookmark_remove',
    );
  }

  protected async compartir(): Promise<void> {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      this.toastSvc.mostrar('Enlace copiado al portapapeles', 'content_paste');
    } catch {
      this.toastSvc.mostrar('No se pudo copiar el enlace', 'error');
    }
  }

  protected descargar(adjunto: { nombre: string }): void {
    this.toastSvc.mostrar(`Descargando ${adjunto.nombre}...`, 'download_for_offline');
  }

  protected irAInicio(): void {
    this.router.navigate(['/']);
  }

  protected tamanoLegible(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }
}
