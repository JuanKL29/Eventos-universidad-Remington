export type TipoNotificacion = 'info' | 'exito' | 'advertencia' | 'error';
export type CanalNotificacion = 'correo' | 'push' | 'sms' | 'plataforma';

/** Eje que grouping las tarjetas en la vista de bandeja. */
export type CategoriaNotificacion = 'evento' | 'aviso' | 'guardado';

export interface AdjuntoNotificacion {
  nombre: string;
  peso: string;
}

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  categoria: CategoriaNotificacion;
  /** Etiqueta corta de la cabecera: 'Evento Próximo • Hoy'. */
  etiqueta: string;
  /** Nombre del icono de Material Symbols. */
  icono: string;
  leida: boolean;
  creadaEn: string;
  publicacionId?: number;
  ubicacion?: string;
  vigencia?: string;
  origen?: string;
  adjunto?: AdjuntoNotificacion;
  usuarioDestinoId: number;
}

export interface Recordatorio {
  id: number;
  publicacionId: number;
  tituloPublicacion: string;
  fechaEnvio: string;
  horaEnvio: string;
  canales: CanalNotificacion[];
  destinatarios: number;
  enviados: number;
  estado: EstadoEnvio;
}

export type EstadoEnvio = 'programado' | 'enviando' | 'enviado' | 'fallido';

export interface PreferenciasNotificacion {
  correo: boolean;
  push: boolean;
  sms: boolean;
  recordatoriosPrevios: number;
}

/** Filtros de la barra de chips. */
export type FiltroNotificaciones = 'todas' | 'no-leidas' | 'eventos' | 'avisos';