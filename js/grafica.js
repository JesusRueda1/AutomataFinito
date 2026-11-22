/**
 * grafica.js
 * -----------------------------------------------------------------------------
 * Dibuja el autómata con Graphviz.
 *  1) generarDOT(afd): arma el texto en lenguaje DOT (el formato de Graphviz)
 *     a partir de los datos del autómata.
 *  2) renderizarGrafica(dot, contenedor): usa Viz.js (Graphviz compilado para
 *     el navegador, archivo lib/viz-standalone.js) para convertir el DOT en
 *     una imagen SVG dentro de la página.
 * Si Viz.js no está disponible, se muestra un aviso y el texto DOT.
 * -----------------------------------------------------------------------------
 */

/**
 * Pone comillas a un nombre para usarlo en DOT y escapa \ y ".
 * Así funcionan nombres con espacios o símbolos raros.
 * @param {string} texto
 * @returns {string}
 */
function citarDOT(texto) {
  return '"' + String(texto).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/**
 * Genera el código DOT del autómata cumpliendo las reglas del enunciado:
 *  1. Flecha de entrada a q0 desde un nodo invisible (no sale de ningún estado).
 *  2. Finales con doble círculo (doublecircle); los demás con círculo (circle).
 *  3. δ(q, a) = q se dibuja como bucle (Graphviz lo hace solo con q -> q).
 *  4. Transiciones p -> q y q -> p son dos aristas distintas (dos flechas).
 *  5. Varios símbolos con el mismo origen y destino: UNA flecha con etiqueta
 *     "a, b", respetando el orden de ingreso de Σ.
 *  Disposición de izquierda a derecha (rankdir=LR).
 *
 * @param {AFD} afd
 * @returns {string} Texto DOT.
 */
function generarDOT(afd) {
  const lineas = [];
  lineas.push('digraph AFD {');
  lineas.push('  rankdir=LR;');
  lineas.push('  node [fontname="Helvetica"];');
  lineas.push('  edge [fontname="Helvetica"];');

  // 1) Nodo invisible y flecha de entrada al estado inicial.
  lineas.push('  __inicio__ [shape=point, style=invis, width=0, height=0, label=""];');

  // 2) Declarar los estados en orden de ingreso con su forma.
  for (const q of afd.estados) {
    const forma = afd.esFinal(q) ? 'doublecircle' : 'circle';
    lineas.push('  ' + citarDOT(q) + ' [shape=' + forma + '];');
  }
  lineas.push('  __inicio__ -> ' + citarDOT(afd.inicial) + ';');

  // 5) Agrupar símbolos por (origen, destino). Recorremos Σ en orden, así
  //    los símbolos de cada etiqueta quedan en el orden de ingreso.
  for (const q of afd.estados) {
    const porDestino = new Map(); // destino -> [símbolos]
    for (const a of afd.alfabeto) {
      const p = afd.transicion(q, a);
      if (!porDestino.has(p)) porDestino.set(p, []);
      porDestino.get(p).push(a);
    }
    // 3) y 4): cada par (q, p) es una arista dirigida independiente.
    porDestino.forEach(function (simbolos, p) {
      lineas.push('  ' + citarDOT(q) + ' -> ' + citarDOT(p) +
        ' [label=' + citarDOT(simbolos.join(', ')) + '];');
    });
  }

  lineas.push('}');
  return lineas.join('\n');
}

/** Instancia de Viz.js (se crea una sola vez porque cargar Graphviz tarda un poco). */
let promesaViz = null;

/**
 * Dibuja el texto DOT dentro de un elemento HTML.
 * Si Viz.js no cargó o falla, muestra un aviso y el código DOT (la página no se rompe).
 * @param {string} dot Texto DOT.
 * @param {HTMLElement} contenedor Elemento donde se coloca la gráfica.
 * @returns {Promise<void>}
 */
function renderizarGrafica(dot, contenedor) {
  contenedor.innerHTML = '<p class="cargando">Generando gráfica…</p>';

  function mostrarAlternativa(motivo) {
    contenedor.innerHTML = '';
    const aviso = document.createElement('p');
    aviso.className = 'mensaje advertencia';
    aviso.textContent = 'No se pudo dibujar la gráfica (' + motivo + '). ' +
      'Este es el código DOT generado; puede pegarlo en cualquier visor de Graphviz:';
    const pre = document.createElement('pre');
    pre.className = 'codigo-dot';
    pre.textContent = dot;
    contenedor.appendChild(aviso);
    contenedor.appendChild(pre);
  }

  if (typeof Viz === 'undefined' || typeof Viz.instance !== 'function') {
    mostrarAlternativa('la librería Viz.js no está cargada');
    return Promise.resolve();
  }

  if (promesaViz === null) promesaViz = Viz.instance();

  return promesaViz.then(function (viz) {
    const svg = viz.renderSVGElement(dot);
    contenedor.innerHTML = '';
    contenedor.appendChild(svg);
  }).catch(function (err) {
    promesaViz = null; // permite reintentar más tarde
    mostrarAlternativa(err && err.message ? err.message : 'error desconocido');
  });
}
