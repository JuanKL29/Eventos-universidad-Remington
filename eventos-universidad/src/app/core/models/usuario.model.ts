export type Rol = 'administrador' | 'coordinador' | 'docente' | 'estudiante';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  carrera?: string;
  avatarUrl?: string;
  activo: boolean;
  creadoEn: string;
}

export interface Credenciales {
  correo: string;
  password: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
  expiraEn: string;
}

export const ROLES_LABEL: Record<Rol, string> = {
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Docente',
  estudiante: 'Estudiante',
};
