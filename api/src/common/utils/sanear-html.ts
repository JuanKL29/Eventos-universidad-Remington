import sanitizeHtml from 'sanitize-html';

/**
 * Sanea el HTML del cuerpo de la publicacion antes de guardarlo.
 *
 * El front ya sanea al renderizar (Angular limpia `[innerHTML]` y el propio
 * form tiene `sanearHtml`), pero si se guarda crudo un `<script>` queda
 * permanente en la base y sale en cualquier export, backup o consulta SQL.
 * Esta capa es la que lo evita de origen.
 *
 * La lista de etiquetas es la MISMA que usa `sanitizador-html.ts` en el front,
 * para que el editor no pierda formato al guardar.
 */
const OPCIONES: sanitizeHtml.IOptions = {
  // Solo lo que genera el editor del front: execCommand con bold, italic,
  // formatBlock (blockquote/h2/h3), createLink y listas.
  allowedTags: [
    'b',
    'strong',
    'i',
    'em',
    'u',
    'p',
    'br',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'h2',
    'h3',
    'div',
    'span',
  ],

  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
  },

  // Descarta el contenido, no solo la etiqueta: si no, el codigo de un
  // <script> se veria como texto en la pagina.
  nonTextTags: [
    'script',
    'style',
    'textarea',
    'option',
    'noscript',
    'iframe',
    'object',
    'embed',
    'template',
    'title',
    'head',
    'svg',
    'math',
  ],

  // Bloquea javascript:, data:, vbscript: y file:.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {},

  // Las etiquetas no permitidas se desenvuelven: se conserva su texto, que es
  // lo que hace el front. Borrarlas del todo perderia contenido.
  disallowedTagsMode: 'discard',

  transformTags: {
    // target="_blank" sin rel abre la ventana original con control completo.
    a: (etiqueta, atributos) => {
      if (atributos.target === '_blank') {
        return {
          tagName: etiqueta,
          attribs: { ...atributos, rel: 'noopener noreferrer' },
        };
      }
      return { tagName: etiqueta, attribs: atributos };
    },
  },
};

export function sanearHtml(sucio: string | null | undefined): string {
  if (!sucio) return '';
  return sanitizeHtml(sucio, OPCIONES).trim();
}

/** Texto plano, util para generar el resumen o validar que no este vacio. */
export function htmlATexto(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}