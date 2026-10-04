import { Routes } from '@angular/router';
import { adminGuard, authGuard, invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Iniciar sesion | Gestion de Eventos',
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/cartelera/cartelera/cartelera').then((m) => m.Cartelera),
        title: 'Cartelera informativa | Gestion de Eventos',
      },
      {
        path: 'publicaciones/:id',
        loadComponent: () =>
          import('./features/publicaciones/publicacion-detalle/publicacion-detalle').then(
            (m) => m.PublicacionDetalle,
          ),
        title: 'Detalle de publicacion | Gestion de Eventos',
      },
        {
          path: 'notificaciones',
          loadComponent: () =>
            import('./features/notificaciones/notificaciones/notificaciones').then(
              (m) => m.Notificaciones,
            ),
          title: 'Notificaciones y recordatorios | Gestion de Eventos',
        },
      {
        path: 'panel/publicaciones',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/publicaciones/panel-publicaciones/panel-publicaciones').then(
            (m) => m.PanelPublicaciones,
          ),
        title: 'Panel de publicaciones | Gestion de Eventos',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
          {
            path: 'publicaciones',
            loadComponent: () =>
              import('./features/admin/gestion-publicaciones/gestion-publicaciones').then(
                (m) => m.GestionPublicaciones,
              ),
            title: 'Gestion de publicaciones | Panel de administracion',
          },
          {
            path: 'panel',
            loadComponent: () =>
              import('./features/admin/panel-admin/panel-admin').then((m) => m.PanelAdmin),
            title: 'Panel de control | Panel de administracion',
          },
          {
            path: 'avisos-urgentes',
            loadComponent: () =>
              import('./features/admin/avisos-urgentes/avisos-urgentes').then(
                (m) => m.AvisosUrgentes,
              ),
            title: 'Avisos urgentes | Panel de administracion',
          },
          {
            path: 'publicaciones/nueva',
            loadComponent: () =>
              import('./features/publicaciones/publicacion-form/publicacion-form').then(
                (m) => m.PublicacionForm,
              ),
            title: 'Crear publicacion | Panel de administracion',
          },
          {
            path: 'publicaciones/:id/editar',
            loadComponent: () =>
              import('./features/publicaciones/publicacion-form/publicacion-form').then(
                (m) => m.PublicacionForm,
              ),
            title: 'Editar publicacion | Panel de administracion',
          },
        ],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
