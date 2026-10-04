import { SetMetadata } from '@nestjs/common';

export const CLAVE_ROLES = 'roles';

/** Los mismos cuatro roles que usa el front en su guard de administracion. */
export const ROLES = ['administrador', 'coordinador', 'docente', 'estudiante'] as const;

export type Rol = (typeof ROLES)[number];

/** Exige al menos uno de los roles indicados. */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);