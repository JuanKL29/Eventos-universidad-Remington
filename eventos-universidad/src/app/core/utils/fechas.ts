const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** '2026-03-28' -> '28 de Marzo de 2026' */
export function fechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia} de ${MESES[Number(mes) - 1]} de ${anio}`;
}

/** '2026-03-28' -> '28 de Marzo' */
export function fechaMedia(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia} de ${MESES[Number(mes) - 1]}`;
}

/** '2026-03-28' -> '28 Feb 2026' */
export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia} ${MESES[Number(mes) - 1].slice(0, 3)} ${anio}`;
}

/** '10:00' -> '10:00 AM' */
export function hora12(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
}

/** Rango de fechas legible para banners y fichas */
export function rangoFechas(fechaInicio: string, fechaFin?: string): string {
  if (!fechaFin || fechaFin === fechaInicio) return fechaLarga(fechaInicio);
  const [, mesInicio, diaInicio] = fechaInicio.split('-');
  const [anioFin, , diaFin] = fechaFin.split('-');
  const mismoAnio = fechaInicio.slice(0, 4) === fechaFin.slice(0, 4);
  const mismoMes = fechaInicio.slice(0, 7) === fechaFin.slice(0, 7);

  if (mismoAnio && mismoMes) return `${diaInicio} al ${diaFin} de ${MESES[Number(mesInicio) - 1]} ${anioFin}`;
  if (mismoAnio) return `${fechaMedia(fechaInicio)} al ${fechaCorta(fechaFin)}`;
  return `${fechaCorta(fechaInicio)} al ${fechaCorta(fechaFin)}`;
}

/** '2026-03-25T07:00:00' -> 'hace 3 horas' */
export function tiempoRelativo(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return 'hace un momento';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? '' : 's'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? '' : 's'}`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} dia${dias === 1 ? '' : 's'}`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} mes${meses === 1 ? '' : 'es'}`;

  const anios = Math.floor(meses / 12);
  return `hace ${anios} ano${anios === 1 ? '' : 's'}`;
}

/** Texto legible de un dia de la semana: '2026-03-28' -> 'Viernes' */
export function diaSemana(iso: string): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return dias[new Date(`${iso}T00:00:00`).getDay()];
}
