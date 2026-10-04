import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';

interface EnlaceAdmin {
  path: string;
  etiqueta: string;
  icono: string;
  exacto: boolean;
  deshabilitado: boolean;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly notif = inject(NotificacionesService);

  protected readonly menuAbierto = signal(false);

  protected readonly logo =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDINgcFPiX3lvk8dlPpmZe51wdzJSouAzVwwfFknSgX3C6SFatKhuImKPMDzJZhdMG9Z-YR_PRm1cvek5oDzS-vIP2gsz_y7ffF9h4AaUrIHtBFzPawMOtVycw9NOCWw5uEJKgql3p0gmmIkG6an7Usg-z6AAXunbCll1vQtPeTLlG-b8Ny9qcRJ6LC7GQ04aMwRubxqIfl8pjeC9p0RzzxT8Gr6oWBujIi0wNOUwDSZHjieZv_klXV82zErwAoGcZfAQ';
  protected readonly avatar =
    'https://lh3.googleusercontent.com/aida/AEtjO1X1bXgjM14uf1hT8SCxAGtNHoP-jG3oHTTMDO9jYUmS8_w8MGtrTpipQeiue6Cblr-G-KOW4ixp4r5_D0wbwOSQa1uCsfhAxghs4D3HSDD4Z_QXKm7Rxt3rEN6VoWTyBto8CBDD2OTnX7lRBz28RJcn-cY-bhk-1yIVBTcxK4GMYoM1JN78olUNa55K5dsRsm9AcwB2aR_k-pnt-BtLcgpBeVJWZaHrCJ-dM3hne6YNU2BlcAFbtABMCw';

  protected readonly enlaces: EnlaceAdmin[] = [
    {
      path: '/admin/panel',
      etiqueta: 'Panel de Control',
      icono: 'dashboard',
      exacto: true,
      deshabilitado: false,
    },
    {
      path: '/admin/publicaciones',
      etiqueta: 'Gestion Publicaciones',
      icono: 'feed',
      exacto: true,
      deshabilitado: false,
    },
    {
      path: '/admin/publicaciones/nueva',
      etiqueta: 'Crear Publicacion',
      icono: 'add_circle',
      exacto: true,
      deshabilitado: false,
    },
        {
          path: '/admin/avisos-urgentes',
          etiqueta: 'Avisos Urgentes',
          icono: 'campaign',
          exacto: true,
          deshabilitado: false,
        },
    {
      path: '/notificaciones',
      etiqueta: 'Notificaciones',
      icono: 'notifications',
      exacto: false,
      deshabilitado: false,
    },
  ];

  protected toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected irA(path: string, deshabilitado: boolean): void {
    if (deshabilitado) {
      return;
    }
    this.cerrarMenu();
    this.router.navigateByUrl(path);
  }

  protected salir(): void {
    this.cerrarMenu();
    this.auth.cerrarSesion();
  }
}