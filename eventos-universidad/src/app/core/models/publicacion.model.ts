export type TipoPublicacion = 'evento' | 'convocatoria' | 'aviso' | 'noticia' | 'institucional';
export type EstadoPublicacion = 'borrador' | 'programada' | 'publicada' | 'archivada';

export interface Publicacion {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  tipo: TipoPublicacion;
  estado: EstadoPublicacion;
  fechaInicio: string;
  fechaFin?: string;
  hora: string;
  lugar: string;
  organizador: string;
  /** Subtitulo editorial que aparece como chip junto al tipo */
  subtitulo?: string;
  /** Texto sobre la imagen panoramica */
  pieDeImagen?: string;
  /** Eje / modalidad de participacion */
  ejes?: EjeParticipacion[];
  /** Fases del proceso (convocatorias) */
  cronograma?: FaseCronograma[];
  /** Requisitos de inscripcion */
  requisitos?: string[];
  /** Canal de contacto oficial */
  contacto?: Contacto;
  imagenUrl?: string;
  avatarUrl?: string;
  credencial?: string;
  adjuntos?: Adjunto[];
  etiquetas: string[];
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  destacado: boolean;
  cupoMaximo?: number;
  inscritos: number;
}

export interface EjeParticipacion {
  numero: string;
  titulo: string;
  descripcion: string;
}

export interface FaseCronograma {
  rango: string;
  titulo: string;
  nota: string;
  estado: 'activo' | 'pendiente' | 'cerrado';
}

export interface Contacto {
  email: string;
  extension?: string;
}

export interface Adjunto {
  nombre: string;
  url: string;
  tipo: string;
  tamanoKb: number;
  /** Documento editable vs. solo lectura */
  editable?: boolean;
}

export interface PublicacionFormValue {
  titulo: string;
  resumen: string;
  contenido: string;
  tipo: TipoPublicacion;
  estado: EstadoPublicacion;
  fechaInicio: string;
  fechaFin?: string | null;
  hora: string;
  lugar: string;
  organizador: string;
  subtitulo?: string | null;
  pieDeImagen?: string | null;
  imagenUrl?: string | null;
  etiquetas: string[];
  destacado: boolean;
  cupoMaximo?: number | null;
  adjuntos?: Adjunto[];
}

export interface FiltroPublicaciones {
  texto?: string;
  tipo?: TipoPublicacion | 'todas';
  estado?: EstadoPublicacion | 'todos';
  fechaDesde?: string;
  fechaHasta?: string;
}
