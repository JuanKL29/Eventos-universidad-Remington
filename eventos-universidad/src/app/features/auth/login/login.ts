import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { APP_CONFIG } from '../../../core/config/app-config';

type RolAcceso = 'estudiante' | 'administrador';
type EstadoBoton = 'idle' | 'cargando' | 'exito';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

protected readonly config = APP_CONFIG;
  protected readonly rol = signal<RolAcceso>('estudiante');
  protected readonly estado = signal<EstadoBoton>('idle');
  protected readonly error = signal('');
  protected readonly mostrarClave = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    recordar: [true],
  });

  protected readonly textoBoton = (): string => {
    switch (this.estado()) {
      case 'cargando':
        return 'Validando credenciales...';
      case 'exito':
        return 'Bienvenido! Redirigiendo...';
      default:
        return this.rol() === 'administrador' ? 'Acceso Administrativo' : 'Iniciar sesion';
    }
  };

  protected seleccionarRol(rol: RolAcceso): void {
    this.rol.set(rol);
    this.error.set('');
  }

  protected alternarClave(): void {
    this.mostrarClave.update((v) => !v);
  }

  protected invalidar(campo: 'correo' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected mensajeError(campo: 'correo' | 'password'): string {
    const control = this.formulario.controls[campo];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'Ingresa un correo institucional valido.';
    if (control.hasError('minlength')) return 'La contrasena debe tener al menos 4 caracteres.';
    return '';
  }

  protected ingresar(): void {
    this.error.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.estado.set('cargando');
    const { correo, password } = this.formulario.getRawValue();

    this.auth.iniciarSesion({ correo, password }).subscribe({
      next: (sesion) => {
        this.estado.set('exito');
        this.toast.mostrar(
          `Sesion iniciada como ${sesion.usuario.rol}`,
          'check_circle',
        );
        this.redirigir();
      },
      error: (err: Error) => {
        this.estado.set('idle');
        this.error.set(err.message);
      },
    });
  }

  /**
   * Navega de inmediato (sin setTimeout: los timers se throttlean en pestañas
   * en segundo plano y dejaban la UI congelada en "Redirigiendo...").
   * navigateByUrl devuelve Promise<boolean>: si un guard cancela, resuelve
   * false. Antes se ignoraba ese valor y la pantalla se quedaba colgada.
   *
   * Los roles no-admin van a la cartelera: '/panel/publicaciones' sigue sin
   * diseno y cair ahi los dejaba en una pantalla muerta. Se restaura ese
   * destino cuando llegue la vista.
   */
  private async redirigir(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destino = returnUrl ? returnUrl : this.auth.esAdmin() ? '/admin' : '/';

    try {
      const navegó = await this.router.navigateByUrl(destino);
      if (!navegó) {
        throw new Error('La navegacion fue cancelada.');
      }
    } catch {
      this.estado.set('idle');
      this.error.set('No se pudo abrir el panel. Vuelve a intentarlo.');
      // Nunca dejar al usuario en un callejon sin salida.
      if (this.router.url !== '/') {
        await this.router.navigateByUrl('/');
      }
    }
  }
}
