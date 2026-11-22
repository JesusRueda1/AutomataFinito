/**
 * automata.js
 * -----------------------------------------------------------------------------
 * Lógica pura del Autómata Finito Determinista (AFD).
 * NO usa jQuery ni toca la página: solo datos y algoritmos. Así se puede
 * probar por separado (pruebas.html) y explicar sin mezclarlo con la interfaz.
 *
 * Un AFD es una 5-tupla M = (Q, Σ, δ, q0, F):
 *   Q  -> conjunto finito de estados
 *   Σ  -> alfabeto (símbolos de entrada)
 *   δ  -> función de transición δ: Q × Σ → Q
 *   q0 -> estado inicial (q0 ∈ Q)
 *   F  -> conjunto de estados finales (F ⊆ Q)
 * -----------------------------------------------------------------------------
 */

/** Longitud máxima de palabra que se explora en el Módulo 2. */
const LONGITUD_MAXIMA = 10;

/* ============================================================================
 * Utilidades de texto
 * ========================================================================== */

/**
 * Separa un texto por comas y quita los espacios sobrantes de cada parte.
 * Ejemplo: " s0, s1 ,s2 " -> ["s0", "s1", "s2"].  Un texto vacío -> [].
 * @param {string} texto Texto escrito por el usuario.
 * @returns {string[]} Lista de elementos (puede contener vacíos si hay ",,").
 */
function parsearLista(texto) {
  const limpio = String(texto == null ? '' : texto).trim();
  if (limpio === '') return [];
  return limpio.split(',').map(function (parte) { return parte.trim(); });
}

/**
 * Escribe un conjunto en notación matemática: ["a","b"] -> "{a, b}".
 * @param {string[]} elementos
 * @returns {string}
 */
function formatearConjunto(elementos) {
  return '{' + elementos.join(', ') + '}';
}

/**
 * Busca el primer elemento repetido de una lista.
 * @param {string[]} lista
 * @returns {string|null} El elemento repetido o null si no hay.
 */
function buscarRepetido(lista) {
  const vistos = new Set();
  for (const x of lista) {
    if (vistos.has(x)) return x;
    vistos.add(x);
  }
  return null;
}

/* ============================================================================
 * Validaciones (devuelven {ok, valor, error, advertencia}; nunca lanzan errores)
 * ========================================================================== */

/**
 * Valida el conjunto de estados Q.
 * Reglas: al menos un estado, sin nombres vacíos, sin repetidos y sin comas.
 * @param {string} texto Estados separados por comas, p. ej. "s0, s1, s2".
 * @returns {{ok: boolean, valor?: string[], error?: string}}
 */
function validarEstados(texto) {
  const estados = parsearLista(texto);
  if (estados.length === 0) {
    return { ok: false, error: 'Debe ingresar al menos un estado (por ejemplo: s0, s1, s2).' };
  }
  if (estados.some(function (e) { return e === ''; })) {
    return { ok: false, error: 'Hay un nombre de estado vacío (revise que no haya dos comas seguidas ni una coma al final).' };
  }
  const rep = buscarRepetido(estados);
  if (rep !== null) {
    return { ok: false, error: 'El estado "' + rep + '" está repetido. Cada estado debe aparecer una sola vez.' };
  }
  return { ok: true, valor: estados };
}

/**
 * Valida el alfabeto Σ.
 * Reglas: al menos un símbolo, cada símbolo es UN solo carácter, sin repetidos.
 * @param {string} texto Símbolos separados por comas, p. ej. "a, b".
 * @returns {{ok: boolean, valor?: string[], error?: string}}
 */
function validarAlfabeto(texto) {
  const simbolos = parsearLista(texto);
  if (simbolos.length === 0) {
    return { ok: false, error: 'Debe ingresar al menos un símbolo (por ejemplo: a, b).' };
  }
  for (const s of simbolos) {
    if (s === '') {
      return { ok: false, error: 'Hay un símbolo vacío (revise que no haya dos comas seguidas ni una coma al final).' };
    }
    // Array.from cuenta caracteres reales (incluye letras como "ñ" o "ε").
    if (Array.from(s).length !== 1) {
      return { ok: false, error: 'El símbolo "' + s + '" tiene ' + Array.from(s).length + ' caracteres. Cada símbolo debe ser un solo carácter.' };
    }
  }
  const rep = buscarRepetido(simbolos);
  if (rep !== null) {
    return { ok: false, error: 'El símbolo "' + rep + '" está repetido. Cada símbolo debe aparecer una sola vez.' };
  }
  return { ok: true, valor: simbolos };
}

/**
 * Valida que un nombre de estado pertenezca a Q (se usa para cada δ(q, a) y para q0).
 * @param {string} nombre Lo que escribió el usuario.
 * @param {string[]} estados El conjunto Q.
 * @returns {{ok: boolean, valor?: string, error?: string}}
 */
function validarDestino(nombre, estados) {
  const limpio = String(nombre == null ? '' : nombre).trim();
  if (limpio === '') {
    return { ok: false, error: 'Debe escribir un estado de Q = ' + formatearConjunto(estados) + '.' };
  }
  if (estados.indexOf(limpio) === -1) {
    return { ok: false, error: 'El estado ' + limpio + ' no pertenece a Q = ' + formatearConjunto(estados) + '. Intente de nuevo.' };
  }
  return { ok: true, valor: limpio };
}

/**
 * Valida el estado inicial q0 (debe pertenecer a Q).
 * @param {string} texto
 * @param {string[]} estados
 * @returns {{ok: boolean, valor?: string, error?: string}}
 */
function validarInicial(texto, estados) {
  return validarDestino(texto, estados);
}

/**
 * Valida el conjunto de estados finales F.
 * Puede quedar vacío: en ese caso es válido pero se devuelve una advertencia.
 * @param {string} texto Estados finales separados por comas.
 * @param {string[]} estados El conjunto Q.
 * @returns {{ok: boolean, valor?: string[], error?: string, advertencia?: string}}
 */
function validarFinales(texto, estados) {
  const finales = parsearLista(texto);
  if (finales.length === 0) {
    return {
      ok: true,
      valor: [],
      advertencia: 'F está vacío: el autómata no reconocerá ninguna palabra.'
    };
  }
  for (const f of finales) {
    if (f === '') {
      return { ok: false, error: 'Hay un estado final vacío (revise las comas).' };
    }
    if (estados.indexOf(f) === -1) {
      return { ok: false, error: 'El estado ' + f + ' no pertenece a Q = ' + formatearConjunto(estados) + '. Intente de nuevo.' };
    }
  }
  const rep = buscarRepetido(finales);
  if (rep !== null) {
    return { ok: false, error: 'El estado final "' + rep + '" está repetido.' };
  }
  return { ok: true, valor: finales };
}

/* ============================================================================
 * Clase AFD
 * ========================================================================== */

/**
 * Autómata Finito Determinista.
 *
 * Representación elegida:
 *  - estados:  arreglo (conserva el orden en que se ingresaron).
 *  - alfabeto: arreglo (su orden define el orden canónico del Módulo 2).
 *  - delta:    Map de Map. delta.get(q).get(a) es δ(q, a).
 *  - inicial:  texto con el nombre de q0.
 *  - finales:  Set para preguntar rápido "¿es final?" con finales.has(q).
 *              (listaFinales guarda el orden de ingreso para mostrarlo).
 */
class AFD {
  /**
   * Crea el autómata. Se asume que los datos YA fueron validados.
   * @param {string[]} estados Q
   * @param {string[]} alfabeto Σ
   * @param {Object<string, Object<string, string>>|Map} transiciones
   *        δ como objeto {estado: {simbolo: destino}} o como Map de Map.
   * @param {string} inicial q0
   * @param {string[]} finales F
   */
  constructor(estados, alfabeto, transiciones, inicial, finales) {
    this.estados = estados.slice();
    this.alfabeto = alfabeto.slice();
    this.inicial = inicial;
    this.listaFinales = finales.slice();
    this.finales = new Set(finales);

    // Construimos δ como Map<estado, Map<símbolo, destino>>.
    this.delta = new Map();
    for (const q of this.estados) {
      const fila = new Map();
      const origen = transiciones instanceof Map ? transiciones.get(q) : transiciones[q];
      for (const a of this.alfabeto) {
        const destino = origen instanceof Map ? origen.get(a) : (origen ? origen[a] : undefined);
        fila.set(a, destino);
      }
      this.delta.set(q, fila);
    }
  }

  /**
   * Aplica la función de transición: δ(q, a).
   * @param {string} q Estado actual.
   * @param {string} a Símbolo leído.
   * @returns {string} Estado siguiente.
   */
  transicion(q, a) {
    return this.delta.get(q).get(a);
  }

  /**
   * Indica si un estado es final.
   * @param {string} q
   * @returns {boolean}
   */
  esFinal(q) {
    return this.finales.has(q);
  }

  /**
   * Texto de la 5-tupla, p. ej. "M = ({s0, s1, s2}, {a, b}, δ, s0, {s2})".
   * @returns {string}
   */
  tupla() {
    return 'M = (' + formatearConjunto(this.estados) + ', ' +
      formatearConjunto(this.alfabeto) + ', δ, ' + this.inicial + ', ' +
      formatearConjunto(this.listaFinales) + ')';
  }

  /**
   * Recorre una palabra símbolo por símbolo (Módulo 3).
   *
   * Algoritmo: empezamos en q0; por cada símbolo de la palabra verificamos
   * que pertenezca a Σ y pasamos al estado δ(actual, símbolo). Al terminar,
   * la palabra es reconocida si el estado en que quedamos es final.
   *
   * @param {string} palabra Palabra a probar ("" = palabra vacía ε).
   * @returns {{
   *   palabra: string,
   *   camino: string[],      // estados visitados, empieza en q0
   *   simbolos: string[],    // símbolos leídos con éxito
   *   estadoFinal: string,   // estado donde terminó
   *   esFinal: boolean,      // si ese estado pertenece a F
   *   aceptada: boolean,
   *   error: (null|{simbolo: string, posicion: number, mensaje: string})
   * }}
   */
  recorrer(palabra) {
    const simbolosPalabra = Array.from(palabra); // separa en caracteres
    const camino = [this.inicial];
    const leidos = [];
    let actual = this.inicial;

    for (let i = 0; i < simbolosPalabra.length; i++) {
      const s = simbolosPalabra[i];
      if (this.alfabeto.indexOf(s) === -1) {
        // Símbolo fuera de Σ: la palabra no puede ser reconocida.
        return {
          palabra: palabra,
          camino: camino,
          simbolos: leidos,
          estadoFinal: actual,
          esFinal: this.esFinal(actual),
          aceptada: false,
          error: {
            simbolo: s,
            posicion: i + 1, // las posiciones se cuentan desde 1
            mensaje: 'el símbolo "' + s + '" (posición ' + (i + 1) +
              ') no pertenece al alfabeto Σ = ' + formatearConjunto(this.alfabeto) + '.'
          }
        };
      }
      actual = this.transicion(actual, s);
      leidos.push(s);
      camino.push(actual);
    }

    return {
      palabra: palabra,
      camino: camino,
      simbolos: leidos,
      estadoFinal: actual,
      esFinal: this.esFinal(actual),
      aceptada: this.esFinal(actual),
      error: null
    };
  }

  /**
   * Convierte un recorrido en texto: "s0 –a→ s1 –b→ s2".
   * @param {{camino: string[], simbolos: string[]}} recorrido Resultado de recorrer().
   * @returns {string}
   */
  formatearCamino(recorrido) {
    let texto = recorrido.camino[0];
    for (let i = 0; i < recorrido.simbolos.length; i++) {
      texto += ' –' + recorrido.simbolos[i] + '→ ' + recorrido.camino[i + 1];
    }
    return texto;
  }

  /**
   * Estados alcanzables desde q0 (búsqueda en anchura sobre el grafo).
   * @returns {Set<string>}
   */
  estadosAlcanzables() {
    const visitados = new Set([this.inicial]);
    const cola = [this.inicial];
    while (cola.length > 0) {
      const q = cola.shift();
      for (const a of this.alfabeto) {
        const p = this.transicion(q, a);
        if (!visitados.has(p)) {
          visitados.add(p);
          cola.push(p);
        }
      }
    }
    return visitados;
  }

  /**
   * Busca las primeras `cantidad` palabras reconocidas en ORDEN CANÓNICO (Módulo 2).
   *
   * Orden canónico: primero por longitud; en la misma longitud, según el
   * orden de ingreso de Σ (como un diccionario). Con Σ = {a, b}:
   *   ε, a, b, aa, ab, ba, bb, aaa, ...
   *
   * Algoritmo:
   *   1) Para cada longitud L = 0, 1, 2, ..., maxLongitud (en ese orden):
   *   2) Generamos las palabras de longitud L como en un diccionario: desde q0
   *      probamos los símbolos de Σ en el orden de ingreso, y para cada uno
   *      seguimos con el resto de la palabra (recursión en profundidad).
   *      Así salen, por ejemplo, aa, ab, ba, bb en ese orden.
   *   3) Cuando la palabra ya tiene longitud L, es reconocida si el estado
   *      al que llegamos es final.
   *   Como recorremos las longitudes de menor a mayor y, dentro de cada una,
   *   en orden de Σ, las palabras aparecen exactamente en orden canónico.
   *
   * Poda (para no explorar |Σ|^10 palabras inútiles): antes calculamos
   * puedeTerminar[r] = conjunto de estados desde los que se puede llegar a un
   * estado final leyendo exactamente r símbolos. Si desde el estado actual
   * no se puede llegar a un final con los r símbolos que faltan, no seguimos
   * por esa rama. Así cada palabra encontrada cuesta poco trabajo.
   *
   * @param {number} [cantidad=5] Cuántas palabras buscar.
   * @param {number} [maxLongitud=LONGITUD_MAXIMA] Longitud máxima a explorar.
   * @returns {{
   *   palabras: Array<{palabra: string, recorrido: object, texto: string}>,
   *   completas: boolean,           // true si se encontraron `cantidad`
   *   finalAlcanzable: boolean,     // false si ningún estado final es alcanzable desde q0
   *   mensaje: (string|null)        // explicación cuando hay menos de `cantidad`
   * }}
   */
  palabrasReconocidas(cantidad, maxLongitud) {
    if (cantidad === undefined) cantidad = 5;
    if (maxLongitud === undefined) maxLongitud = LONGITUD_MAXIMA;

    const automata = this;
    const encontradas = [];

    // puedeTerminar[r]: estados desde los que se llega a F con exactamente r símbolos.
    //   r = 0 -> los estados finales.
    //   r > 0 -> q sirve si para algún símbolo a, δ(q, a) está en puedeTerminar[r-1].
    const puedeTerminar = [new Set(this.listaFinales)];
    for (let r = 1; r <= maxLongitud; r++) {
      const conjunto = new Set();
      for (const q of this.estados) {
        for (const a of this.alfabeto) {
          if (puedeTerminar[r - 1].has(this.transicion(q, a))) {
            conjunto.add(q);
            break;
          }
        }
      }
      puedeTerminar.push(conjunto);
    }

    /**
     * Genera (en orden de Σ) las palabras que empiezan con `prefijo`,
     * están en el estado `estado` y les faltan `faltan` símbolos.
     * @returns {boolean} true cuando ya se juntaron `cantidad` palabras (para detenerse).
     */
    function generar(prefijo, estado, faltan) {
      if (!puedeTerminar[faltan].has(estado)) return false; // poda
      if (faltan === 0) {
        // Llegamos a la longitud buscada y (por la poda) el estado es final.
        const rec = automata.recorrer(prefijo);
        encontradas.push({ palabra: prefijo, recorrido: rec, texto: automata.formatearCamino(rec) });
        return encontradas.length === cantidad;
      }
      for (const a of automata.alfabeto) {
        if (generar(prefijo + a, automata.transicion(estado, a), faltan - 1)) return true;
      }
      return false;
    }

    for (let longitud = 0; longitud <= maxLongitud; longitud++) {
      if (generar('', this.inicial, longitud)) {
        return { palabras: encontradas, completas: true, finalAlcanzable: true, mensaje: null };
      }
    }

    // Si llegamos aquí, se encontraron menos de `cantidad` palabras.
    const alcanzables = this.estadosAlcanzables();
    const finalAlcanzable = this.listaFinales.some(function (f) { return alcanzables.has(f); });
    let mensaje;
    if (encontradas.length === 0) {
      if (this.listaFinales.length === 0) {
        mensaje = 'Este autómata no reconoce ninguna palabra: F está vacío (no hay estados finales).';
      } else if (!finalAlcanzable) {
        mensaje = 'Este autómata no reconoce ninguna palabra: ningún estado final ' +
          formatearConjunto(this.listaFinales) + ' es alcanzable desde el estado inicial ' + this.inicial + '.';
      } else {
        mensaje = 'Este autómata no reconoce ninguna palabra de longitud menor o igual que ' + maxLongitud + '.';
      }
    } else {
      mensaje = 'Este autómata solo reconoce ' + encontradas.length + ' palabra' +
        (encontradas.length === 1 ? '' : 's') + ' de longitud menor o igual que ' + maxLongitud + '.';
    }
    return { palabras: encontradas, completas: false, finalAlcanzable: finalAlcanzable, mensaje: mensaje };
  }
}

/**
 * Muestra una palabra para el usuario: la vacía se muestra como ε.
 * @param {string} palabra
 * @returns {string}
 */
function mostrarPalabra(palabra) {
  return palabra === '' ? 'ε' : palabra;
}

/**
 * Datos del autómata de ejemplo A2 (palabras sobre {a, b} que terminan en "ab").
 * Se usan en el botón "Cargar ejemplo A2" y en pruebas.html.
 */
const EJEMPLO_A2 = {
  estados: 's0, s1, s2',
  alfabeto: 'a, b',
  delta: {
    s0: { a: 's1', b: 's0' },
    s1: { a: 's1', b: 's2' },
    s2: { a: 's1', b: 's0' }
  },
  inicial: 's0',
  finales: 's2'
};
