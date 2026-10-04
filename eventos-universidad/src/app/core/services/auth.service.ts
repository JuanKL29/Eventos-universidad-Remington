import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { API_BASE, CLAVE_SESION } from '../config/api.config';
import { Credenciales, Sesion, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * Debe ser un signal y no un BehaviorSubject: los computed() que lo leen
   * solo se invalidan si dependen de signals. Con un BehaviorSubject el valor
   * se cacheaba para siempre tras la primera lectura y la sesion nunca se
   * actualizaba en caliente (obliga a recargar la pagina).
   */
  private readonly sesionState = signal<Sesion | null>(this.leerSesion());

  readonly sesion$ = toObservable(this.sesionState);
  readonly usuario = computed(() => this.sesionState()?.usuario ?? null);
  readonly autenticado = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'administrador');

  iniciarSesion(credenciales: Credenciales): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${API_BASE}/auth/login`, {
        correo: credenciales.correo.trim().toLowerCase(),
        contrasena: credenciales.password,
      })
      .pipe(
        tap((sesion) => {
          this.guardarSesion(sesion);
          this.sesionState.set(sesion);
        }),
        map((sesion) => ({
          ...sesion,
          usuario: { ...sesion.usuario, rol: sesion.usuario.rol ?? 'administrador' },
        })),
        // El filtro global convierte el body del backend en un Error legible.
        catchError((error) =>
          throwError(
            () =>
              new Error(
                error?.error?.mensaje ?? 'No se pudo conectar con el servidor.',
              ),
          ),
        ),
      );
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.sesionState.set(null);
    this.router.navigate(['/login']);
  }

  usuarioPorId(id: number): Observable<Usuario | undefined> {
    return this.listarUsuarios().pipe(map((usuarios) => usuarios.find((u) => u.id === id)));
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_BASE}/auth/administradores`);
  }

  alternarEstado(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${API_BASE}/auth/administradores/${id}/activo`, {});
  }

  private guardarSesion(sesion: Sesion): void {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }

  private leerSesion(): Sesion | null {
    try {
      const crudo = localStorage.getItem(CLAVE_SESION);
      return crudo ? (JSON.parse(crudo) as Sesion) : null;
    } catch {
      return null;
    }
  }
}