import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { ToastService } from '../../../core/services/toast.service';
import { diaSemana, hora12, tiempoRelativo } from '../../../core/utils/fechas';
import {
  CategoriaNotificacion,
  FiltroNotificaciones,
  Notificacion,
} from '../../../core/models/notificacion.model';

interface ChipFiltro {
  valor: FiltroNotificaciones;
  etiqueta: string;
  conContador: boolean;
}

@Component({
  selector: 'app-notificaciones',
  imports: [RouterLink],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.scss',
})
export class Notificaciones {
  private readonly notif = inject(NotificacionesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly filtro = signal<FiltroNotificaciones>('todas');
  protected readonly yaMarcadasTodas = signal(false);

  protected readonly chips: ChipFiltro[] = [
    { valor: 'todas', etiqueta: 'Todas', conContador: false },
    { valor: 'no-leidas', etiqueta: 'No leidas', conContador: true },
    { valor: 'eventos', etiqueta: 'Eventos proximos', conContador: false },
    { valor: 'avisos', etiqueta: 'Avisos importantes', conContador: false },
  ];

  protected readonly noLeidas = this.notif.noLeidas;
  protected readonly programados = this.notif.programados;
  protected readonly total = computed(() => this.notif.notificaciones().length);
  protected readonly leidas = computed(() => this.total() - this.noLeidas());

  /** Porcentaje real de notificaciones atendidas, no una cifra fija del diseno. */
  protected readonly porcentajeAtencion = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.leidas() / this.total()) * 100),
  );

  /** Siguiente recordatorio programado: alimenta la tarjeta 'Agenda Inmediata'. */
  protected readonly agendaInmediata = computed(() => {
    const programados = this.notif
      .programados()
      .slice()
      .sort((a, b) => a.fechaEnvio.localeCompare(b.fechaEnvio));
    return programados[0] ?? null;
  });

  protected readonly nombreUsuario = computed(() => this.auth.usuario()?.nombre ?? 'Usuario');

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const lista = this.notif.notificaciones();

    switch (filtro) {
      case 'no-leidas':
        return lista.filter((n) => !n.leida);
      case 'eventos':
        return lista.filter((n) => n.categoria === 'evento');
      case 'avisos':
        return lista.filter((n) => n.categoria === 'aviso');
      default:
        return lista;
    }
  });

  protected aplicarFiltro(valor: FiltroNotificaciones): void {
    this.filtro.set(valor);
  }

  protected tiempo(iso: string): string {
    return tiempoRelativo(iso);
  }

  protected esHoy(iso: string): boolean {
    return new Date(`${iso}T00:00:00`).toDateString() === new Date().toDateString();
  }

  protected diaAgenda(iso: string): string {
    return diaSemana(iso);
  }

  protected numeroDia(iso: string): string {
    return String(Number(iso.slice(8, 10)));
  }

  protected hora(iso: string): string {
    return hora12(iso);
  }

  /** Al abrir la tarjeta se marca como leida. */
  protected abrir(notificacion: Notificacion): void {
    if (!notificacion.leida) {
      this.notif.marcarLeida(notificacion.id);
      this.toast.mostrar('Notificacion marcada como leida', 'mark_email_read');
    }
  }

  protected marcarTodas(): void {
    if (this.noLeidas() === 0) return;
    this.notif.marcarTodasLeidas();
    this.yaMarcadasTodas.set(true);
    this.toast.mostrar('Todas las notificaciones fueron marcadas como leidas', 'done_all');
  }

  protected descargar(adjunto: { nombre: string }): void {
    this.toast.mostrar(`Descarga simulada: ${adjunto.nombre}`, 'download');
  }

  protected claseIcono(notificacion: Notificacion): string {
    switch (notificacion.categoria) {
      case 'evento':
        return 'bg-primary-fixed text-primary-container';
      case 'aviso':
        return 'bg-tertiary-fixed text-tertiary';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  }

  protected claseEtiqueta(notificacion: Notificacion): string {
    switch (notificacion.categoria) {
      case 'evento':
        return 'text-primary';
      case 'aviso':
        return 'text-error';
      default:
        return 'text-on-surface-variant';
    }
  }

  protected puntoEtiqueta(categoria: CategoriaNotificacion): string {
    return categoria === 'aviso' ? 'bg-error' : 'bg-primary';
  }
}