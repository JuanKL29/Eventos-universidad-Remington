import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  mensaje: string;
  icono: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly actual = signal<Toast | null>(null);
  private readonly pila = signal<Toast[]>([]);
  private contador = 0;
  private temporizador?: ReturnType<typeof setTimeout>;

  readonly toast = this.actual.asReadonly();
  readonly toasts = this.pila.asReadonly();

  mostrar(mensaje: string, icono = 'check_circle', duracionMs = 3000): void {
    const nuevo: Toast = { id: ++this.contador, mensaje, icono, visible: false };

    this.pila.update((items) => [...items, nuevo]);

    setTimeout(() => {
      this.pila.update((items) => items.map((t) => (t.id === nuevo.id ? { ...t, visible: true } : t)));
      this.actual.set(nuevo);
    }, 10);

    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.ocultar(nuevo.id), duracionMs);
  }

  ocultar(id: number): void {
    this.pila.update((items) =>
      items.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );
    const visibles = this.pila().filter((t) => t.visible);
    this.actual.set(visibles.length ? visibles[visibles.length - 1] : null);
    setTimeout(() => this.pila.update((items) => items.filter((t) => t.id !== id)), 300);
  }
}
