import { Injectable, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { NOTIFICACIONES_MOCK, RECORDATORIOS_MOCK } from '../models/mock-data';
import {
  CanalNotificacion,
  EstadoEnvio,
  Notificacion,
  PreferenciasNotificacion,
  Recordatorio,
} from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly lista = signal<Notificacion[]>(structuredClone(NOTIFICACIONES_MOCK));
  private readonly listaRecordatorios = signal<Recordatorio[]>(structuredClone(RECORDATORIOS_MOCK));

  readonly notificaciones = this.lista.asReadonly();
  readonly recordatorios = this.listaRecordatorios.asReadonly();
  readonly noLeidas = computed(() => this.lista().filter((n) => !n.leida).length);
  readonly programados = computed(() =>
    this.listaRecordatorios().filter((r) => r.estado === 'programado'),
  );

  private readonly preferencias = signal<PreferenciasNotificacion>({
    correo: true,
    push: true,
    sms: false,
    recordatoriosPrevios: 24,
  });

  readonly prefs = this.preferencias.asReadonly();

  listar(
    filtro: {
      soloNoLeidas?: boolean;
      tipo?: Notificacion['tipo'];
      categoria?: Notificacion['categoria'];
    } = {},
  ): Observable<Notificacion[]> {
    const resultado = this.lista()
      .filter((n) => (filtro.soloNoLeidas ? !n.leida : true))
      .filter((n) => (filtro.tipo ? n.tipo === filtro.tipo : true))
      .filter((n) => (filtro.categoria ? n.categoria === filtro.categoria : true))
      .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
    return of(resultado).pipe(delay(150));
  }

  marcarLeida(id: number): void {
    this.lista.update((items) => items.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  marcarTodasLeidas(): void {
    this.lista.update((items) => items.map((n) => ({ ...n, leida: true })));
  }

  eliminar(id: number): void {
    this.lista.update((items) => items.filter((n) => n.id !== id));
  }

  limpiarLeidas(): void {
    this.lista.update((items) => items.filter((n) => !n.leida));
  }

  crear(
    notificacion: Omit<Notificacion, 'id' | 'creadaEn' | 'leida' | 'icono' | 'categoria'> &
      Partial<Pick<Notificacion, 'icono' | 'categoria'>>,
  ): Notificacion {
    const nueva: Notificacion = {
      icono: 'notifications',
      categoria: 'evento',
      ...notificacion,
      id: this.lista().reduce((max, n) => Math.max(max, n.id), 0) + 1,
      creadaEn: new Date().toISOString(),
      leida: false,
    };
    this.lista.update((items) => [nueva, ...items]);
    return nueva;
  }

  programarRecordatorio(datos: {
    publicacionId: number;
    tituloPublicacion: string;
    fechaEnvio: string;
    horaEnvio: string;
    canales: CanalNotificacion[];
    destinatarios: number;
  }): Observable<Recordatorio> {
    const nuevo: Recordatorio = {
      ...datos,
      id: this.listaRecordatorios().reduce((max, r) => Math.max(max, r.id), 0) + 1,
      enviados: 0,
      estado: 'programado',
    };
    this.listaRecordatorios.update((items) => [nuevo, ...items]);
    return of(nuevo).pipe(delay(200));
  }

  cancelarRecordatorio(id: number): Observable<void> {
    this.listaRecordatorios.update((items) => items.filter((r) => r.id !== id));
    return of(void 0).pipe(delay(150));
  }

  cambiarEstadoRecordatorio(id: number, estado: EstadoEnvio): void {
    this.listaRecordatorios.update((items) =>
      items.map((r) => (r.id === id ? { ...r, estado } : r)),
    );
  }

  actualizarPreferencias(prefs: Partial<PreferenciasNotificacion>): void {
    this.preferencias.update((actual) => ({ ...actual, ...prefs }));
  }
}
