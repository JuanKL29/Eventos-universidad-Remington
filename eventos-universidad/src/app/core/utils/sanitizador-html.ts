/**
 * El editor enriquecido produce HTML que se guarda en `Publicacion.contenido`.
 * Angular sanea `[innerHTML]` al renderizar, pero limpiamos tambien al guardar
 * para no persistir markup peligroso en el estado de la aplicacion.
 *
 * `document.execCommand` esta obsoleto pero sigue siendo la via corta y sin
 * dependencias para aplicar formato sobre un contenteditable.
 */

const ETIQUETAS_PERMITIDAS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'P',
  'BR',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'H2',
  'H3',
  'DIV',
  'SPAN',
]);

const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'target', 'rel']),
};

/** Elimina script/style y todo atributo que no este en la lista blanca. */
export function sanearHtml(sucio: string): string {
  if (!sucio) return '';
  const plantilla = document.createElement('template');
  plantilla.innerHTML = sucio;

  const limpiar = (nodo: Node) => {
    const hijos = Array.from(nodo.childNodes);
    for (const hijo of hijos) {
      if (hijo.nodeType === Node.COMMENT_NODE) {
        hijo.remove();
        continue;
      }
      if (hijo.nodeType !== Node.ELEMENT_NODE) continue;

      const el = hijo as Element;
      const etiqueta = el.tagName.toUpperCase();

      // Script y style se eliminan del todo; si no, su texto se mostraría.
      if (etiqueta === 'SCRIPT' || etiqueta === 'STYLE') {
        el.remove();
        continue;
      }

      if (!ETIQUETAS_PERMITIDAS.has(etiqueta)) {
        // Reemplazar por su contenido en vez de borrar el subtree.
        const texto = document.createTextNode(el.textContent ?? '');
        el.replaceWith(texto);
        continue;
      }

      const permitidos = ATRIBUTOS_PERMITIDOS[etiqueta];
      for (const atributo of Array.from(el.attributes)) {
        if (!permitidos?.has(atributo.name.toLowerCase())) {
          el.removeAttribute(atributo.name);
        }
      }

      if (etiqueta === 'A') {
        const href = el.getAttribute('href') ?? '';
        if (/^\s*javascript:/i.test(href) || /^\s*data:/i.test(href)) {
          el.removeAttribute('href');
        }
        if (el.getAttribute('target') === '_blank') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
      }

      limpiar(el);
    }
  };

  limpiar(plantilla.content);
  return plantilla.innerHTML.trim();
}

/** Quita el formato y devuelve el texto plano, util para el campo resumen. */
export function htmlATexto(html: string): string {
  const plantilla = document.createElement('template');
  plantilla.innerHTML = html;
  return (plantilla.content.textContent ?? '').replace(/\s+/g, ' ').trim();
}