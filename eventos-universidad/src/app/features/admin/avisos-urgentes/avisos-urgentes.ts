import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { TipoPublicacion } from '../../../core/models/publicacion.model';

@Component({
  selector: 'app-avisos-urgentes',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './avisos-urgentes.html',
  styleUrl: './avisos-urgentes.scss',
})
export class AvisosUrgentes {
  private readonly publicaciones = inject(PublicacionesService);

  protected readonly tipoSeleccionado = signal<TipoPublicacion | 'todos'>('todos');
  protected readonly textoBusqueda = signal('');

  protected readonly categorias: Array<{ valor: TipoPublicacion | 'todos'; etiqueta: string }> = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'aviso', etiqueta: 'Avisos' },
    { valor: 'noticia', etiqueta: 'Noticias' },
    { valor: 'evento', etiqueta: 'Eventos' },
    { valor: 'convocatoria', etiqueta: 'Convocatorias' },
    { valor: 'institucional', etiqueta: 'Institucional' },
  ];

  protected readonly avisosUrgentes = computed(() => {
    const texto = this.textoBusqueda().trim().toLowerCase();
    const tipo = this.tipoSeleccionado();

    return this.publicaciones
      .publicaciones()
      .filter((p) => p.estado === 'publicada' || p.estado === 'programada')
      .filter((p) => (tipo === 'todos' ? true : p.tipo === tipo))
      .filter((p) => {
        if (!texto) return true;
        const campos = [p.titulo, p.resumen, p.organizador, p.lugar, ...p.etiquetas];
        return campos.join(' ').toLowerCase().includes(texto);
      })
      .sort((a, b) => {
        // Priorizar destacados primero, luego por fecha más próxima
        if (a.destacado !== b.destacado) {
          return a.destacado ? -1 : 1;
        }
        return a.fechaInicio.localeCompare(b.fechaInicio);
      });
  });

  protected readonly hayResultados = computed(() => this.avisosUrgentes().length > 0);

  protected seleccionarTipo(tipo: TipoPublicacion | 'todos'): void {
    this.tipoSeleccionado.set(tipo);
  }

  protected buscar(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.textoBusqueda.set(target.value);
  }
}