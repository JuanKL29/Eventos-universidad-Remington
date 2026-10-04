import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';

interface EnlaceNav {
  path: string;
  etiqueta: string;
  icono: string;
  exacto: boolean;
  requiereSesion: boolean;
  soloAdmin: boolean;
}

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-layout',
  styleUrl: './layout.scss',
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly auth = inject(AuthService);
  protected readonly notif = inject(NotificacionesService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);
  protected readonly perfilAbierto = signal(false);

  protected readonly logo =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDINgcFPiX3lvk8dlPpmZe51wdzJSouAzVwwfFknSgX3C6SFatKhuImKPMDzJZhdMG9Z-YR_PRm1cvek5oDzS-vIP2gsz_y7ffF9h4AaUrIHtBFzPawMOtVycw9NOCWw5uEJKgql3p0gmmIkG6an7Usg-z6AAXunbCll1vQtPeTLlG-b8Ny9qcRJ6LC7GQ04aMwRubxqIfl8pjeC9p0RzzxT8Gr6oWBujIi0wNOUwDSZHjieZv_klXV82zErwAoGcZfAQ';
  protected readonly avatar =
    'https://lh3.googleusercontent.com/aida/AEtjO1X1bXgjM14uf1hT8SCxAGtNHoP-jG3oHTTMDO9jYUmS8_w8MGtrTpipQeiue6Cblr-G-KOW4ixp4r5_D0wbwOSQa1uCsfhAxghs4D3HSDD4Z_QXKm7Rxt3rEN6VoWTyBto8CBDD2OTnX7lRBz28RJcn-cY-bhk-1yIVBTcxK4GMYoM1JN78olUNa55K5dsRsm9AcwB2aR_k-pnt-BtLcgpBeVJWZaHrCJ-dM3hne6YNU2BlcAFbtABMCw';

  protected readonly enlaces: EnlaceNav[] = [
    { path: '/', etiqueta: 'Cartelera', icono: 'dashboard', exacto: true, requiereSesion: false, soloAdmin: false },
    { path: '/notificaciones', etiqueta: 'Notificaciones', icono: 'notifications', exacto: false, requiereSesion: true, soloAdmin: false },
    { path: '/panel/publicaciones', etiqueta: 'Mi Panel', icono: 'folder_open', exacto: false, requiereSesion: true, soloAdmin: false },
    { path: '/admin/publicaciones', etiqueta: 'Administración', icono: 'admin_panel_settings', exacto: false, requiereSesion: true, soloAdmin: true },
  ];

  protected readonly visibles = computed(() =>
    this.enlaces
      .filter((e) => !e.requiereSesion || this.auth.autenticado())
      .filter((e) => !e.soloAdmin || this.auth.esAdmin()),
  );

  protected alternarMenu(): void {
    this.menuAbierto.update((v) => !v);
  }

  protected alternarPerfil(): void {
    this.perfilAbierto.update((v) => !v);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected cerrarPerfil(): void {
    this.perfilAbierto.set(false);
  }

  protected irAdmin(): void {
    this.cerrarPerfil();
    this.router.navigateByUrl('/admin/publicaciones');
  }

  protected salir(): void {
    this.cerrarPerfil();
    this.auth.cerrarSesion();
  }
}