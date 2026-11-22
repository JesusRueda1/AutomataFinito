/**
 * modulo1.js
 * -----------------------------------------------------------------------------
 * Módulo 1: construcción del autómata paso a paso (tipo asistente) y gráfica.
 * Pasos: 1) Q  2) Σ  3) δ  4) q0  5) F  -> botón "Construir autómata".
 * Cada paso se habilita solo cuando el anterior es válido. Si el usuario
 * modifica un paso ya validado, los pasos siguientes se vuelven a bloquear.
 * Usa jQuery para la página; la validación y el AFD vienen de automata.js.
 * -----------------------------------------------------------------------------
 */

const Modulo1 = (function () {

  /** Datos ya validados de cada paso (null = todavía no validado). */
  const datos = {
    estados: null,   // string[]
    alfabeto: null,  // string[]
    delta: null,     // {estado: {simbolo: destino}}
    inicial: null    // string
  };

  /* ------------------------------------------------------------------ */
  /* Utilidades de la interfaz                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Muestra un mensaje bajo un campo.
   * @param {jQuery} $msg Párrafo del mensaje.
   * @param {('error'|'advertencia'|'ok'|'')} tipo Clase de estilo.
   * @param {string} texto Texto ('' para borrar).
   */
  function mostrarMensaje($msg, tipo, texto) {
    $msg.removeClass('error advertencia ok').addClass(tipo).text(texto);
  }

  /**
   * Bloquea los pasos desde `n` hasta 5 (deshabilita sus campos y botones).
   * @param {number} n Número del primer paso a bloquear.
   */
  function bloquearDesde(n) {
    for (let k = n; k <= 5; k++) {
      const $paso = $('#paso' + k);
      $paso.addClass('bloqueado').removeClass('valido');
      $paso.find('input, button').prop('disabled', true);
    }
  }

  /**
   * Habilita el paso `n` y pone el cursor en su primer campo.
   * @param {number} n
   */
  function habilitarPaso(n) {
    const $paso = $('#paso' + n);
    $paso.removeClass('bloqueado');
    $paso.find('input, button').prop('disabled', false);
    $paso.find('input').first().trigger('focus');
  }

  /**
   * Marca el paso `n` como válido (borde verde).
   * @param {number} n
   */
  function marcarValido(n) {
    $('#paso' + n).addClass('valido');
  }

  /* ------------------------------------------------------------------ */
  /* Paso 1: Q                                                           */
  /* ------------------------------------------------------------------ */

  /** Valida Q y, si es correcto, habilita el paso 2. @returns {boolean} */
  function validarPaso1() {
    const r = validarEstados($('#inp-estados').val());
    if (!r.ok) {
      $('#inp-estados').addClass('invalido');
      mostrarMensaje($('#msg-estados'), 'error', r.error);
      return false;
    }
    datos.estados = r.valor;
    $('#inp-estados').removeClass('invalido');
    mostrarMensaje($('#msg-estados'), 'ok', 'Q = ' + formatearConjunto(r.valor) + '  (|Q| = ' + r.valor.length + ')');
    marcarValido(1);
    habilitarPaso(2);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Paso 2: Σ  (y generación de la tabla de δ)                          */
  /* ------------------------------------------------------------------ */

  /** Valida Σ, genera la tabla de δ y habilita el paso 3. @returns {boolean} */
  function validarPaso2() {
    const r = validarAlfabeto($('#inp-alfabeto').val());
    if (!r.ok) {
      $('#inp-alfabeto').addClass('invalido');
      mostrarMensaje($('#msg-alfabeto'), 'error', r.error);
      return false;
    }
    datos.alfabeto = r.valor;
    $('#inp-alfabeto').removeClass('invalido');
    mostrarMensaje($('#msg-alfabeto'), 'ok', 'Σ = ' + formatearConjunto(r.valor) + '  (|Σ| = ' + r.valor.length + ')');
    marcarValido(2);
    generarTablaDelta();
    habilitarPaso(3);
    return true;
  }

  /**
   * Crea la tabla con un campo de texto por cada pareja (q, a): |Q|×|Σ| campos.
   * Si ya había valores escritos para alguna pareja, se conservan.
   */
  function generarTablaDelta() {
    // Guardar lo que ya estaba escrito (clave "estado\u0000símbolo").
    const anteriores = new Map();
    $('#contenedor-delta input').each(function () {
      anteriores.set($(this).data('estado') + '\u0000' + $(this).data('simbolo'), $(this).val());
    });

    const $tabla = $('<table class="tabla tabla-delta">');
    const $encabezado = $('<tr>').append($('<th>').text('δ'));
    datos.alfabeto.forEach(function (a) { $encabezado.append($('<th>').text(a)); });
    $tabla.append($('<thead>').append($encabezado));

    const $cuerpo = $('<tbody>');
    datos.estados.forEach(function (q, i) {
      const $fila = $('<tr>').append($('<th>').text(q));
      datos.alfabeto.forEach(function (a, j) {
        const id = 'delta-' + i + '-' + j;
        const $celda = $('<td>');
        $celda.append($('<label class="etiqueta-delta">').attr('for', id).text('δ(' + q + ', ' + a + ') ='));
        $celda.append(
          $('<input type="text" autocomplete="off">')
            .attr('id', id)
            .data('estado', q)
            .data('simbolo', a)
            .val(anteriores.get(q + '\u0000' + a) || '')
        );
        $celda.append($('<p class="mensaje">'));
        $fila.append($celda);
      });
      $cuerpo.append($fila);
    });
    $tabla.append($cuerpo);

    $('#contenedor-delta').empty().append($tabla);
    mostrarMensaje($('#msg-delta'), '', '');
  }

  /**
   * Valida una casilla de δ y muestra su mensaje.
   * @param {jQuery} $input Campo de la casilla.
   * @returns {boolean}
   */
  function validarCeldaDelta($input) {
    const r = validarDestino($input.val(), datos.estados);
    const $msg = $input.siblings('.mensaje');
    if (!r.ok) {
      $input.addClass('invalido');
      mostrarMensaje($msg, 'error', r.error);
      return false;
    }
    $input.removeClass('invalido');
    mostrarMensaje($msg, '', '');
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Paso 3: δ                                                           */
  /* ------------------------------------------------------------------ */

  /** Valida todas las casillas de δ y habilita el paso 4. @returns {boolean} */
  function validarPaso3() {
    let errores = 0;
    const delta = {};
    $('#contenedor-delta input').each(function () {
      const $input = $(this);
      if (validarCeldaDelta($input)) {
        const q = $input.data('estado');
        const a = $input.data('simbolo');
        if (!delta[q]) delta[q] = {};
        delta[q][a] = $input.val().trim();
      } else {
        errores++;
      }
    });
    if (errores > 0) {
      mostrarMensaje($('#msg-delta'), 'error',
        'Hay ' + errores + ' casilla' + (errores === 1 ? '' : 's') + ' con error. Corríjala' + (errores === 1 ? '' : 's') + ' e intente de nuevo.');
      $('#contenedor-delta input.invalido').first().trigger('focus');
      return false;
    }
    datos.delta = delta;
    mostrarMensaje($('#msg-delta'), 'ok', 'δ completa: ' + (datos.estados.length * datos.alfabeto.length) + ' transiciones.');
    marcarValido(3);
    habilitarPaso(4);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Paso 4: q0                                                          */
  /* ------------------------------------------------------------------ */

  /** Valida q0 y habilita el paso 5. @returns {boolean} */
  function validarPaso4() {
    const r = validarInicial($('#inp-inicial').val(), datos.estados);
    if (!r.ok) {
      $('#inp-inicial').addClass('invalido');
      mostrarMensaje($('#msg-inicial'), 'error', r.error);
      return false;
    }
    datos.inicial = r.valor;
    $('#inp-inicial').removeClass('invalido');
    mostrarMensaje($('#msg-inicial'), 'ok', 'q0 = ' + r.valor);
    marcarValido(4);
    habilitarPaso(5);
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Paso 5: F y construcción                                            */
  /* ------------------------------------------------------------------ */

  /** Valida F, construye el AFD y muestra tupla, tabla y gráfica. */
  function construir() {
    const r = validarFinales($('#inp-finales').val(), datos.estados);
    if (!r.ok) {
      $('#inp-finales').addClass('invalido');
      mostrarMensaje($('#msg-finales'), 'error', r.error);
      return;
    }
    $('#inp-finales').removeClass('invalido');
    if (r.advertencia) {
      mostrarMensaje($('#msg-finales'), 'advertencia', r.advertencia);
    } else {
      mostrarMensaje($('#msg-finales'), 'ok', 'F = ' + formatearConjunto(r.valor));
    }
    marcarValido(5);

    // Construir el autómata (reemplaza al anterior).
    const afd = new AFD(datos.estados, datos.alfabeto, datos.delta, datos.inicial, r.valor);
    Simulador.establecerAutomata(afd);
    mostrarResultado(afd);
  }

  /**
   * Crea la tabla de transiciones (fila por estado, columna por símbolo,
   * → en el inicial y * en los finales).
   * @param {AFD} afd
   * @returns {jQuery}
   */
  function crearTablaTransiciones(afd) {
    const $tabla = $('<table class="tabla tabla-transiciones">');
    const $enc = $('<tr>').append($('<th>').text('δ'));
    afd.alfabeto.forEach(function (a) { $enc.append($('<th>').text(a)); });
    $tabla.append($('<thead>').append($enc));
    const $cuerpo = $('<tbody>');
    afd.estados.forEach(function (q) {
      let marca = '';
      if (q === afd.inicial) marca += '→';
      if (afd.esFinal(q)) marca += '*';
      const $fila = $('<tr>').append($('<th>').text(marca + q));
      afd.alfabeto.forEach(function (a) { $fila.append($('<td>').text(afd.transicion(q, a))); });
      $cuerpo.append($fila);
    });
    return $tabla.append($cuerpo);
  }

  /**
   * Muestra la 5-tupla, la tabla y la gráfica del autómata construido.
   * @param {AFD} afd
   */
  function mostrarResultado(afd) {
    $('#texto-tupla').text(afd.tupla());
    $('#tabla-transiciones').empty().append(crearTablaTransiciones(afd));
    $('#resultado-modulo1').removeClass('oculto');
    renderizarGrafica(generarDOT(afd), document.getElementById('grafica'));
    document.getElementById('resultado-modulo1').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------ */
  /* Ejemplo A2                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Rellena los campos con el autómata A2 pasando por las mismas
   * validaciones de cada paso. No construye: el usuario presiona el botón.
   */
  function cargarEjemploA2() {
    $('#inp-estados').val(EJEMPLO_A2.estados);
    if (!validarPaso1()) return;
    $('#inp-alfabeto').val(EJEMPLO_A2.alfabeto);
    if (!validarPaso2()) return;
    $('#contenedor-delta input').each(function () {
      const q = $(this).data('estado');
      const a = $(this).data('simbolo');
      $(this).val(EJEMPLO_A2.delta[q][a]);
    });
    if (!validarPaso3()) return;
    $('#inp-inicial').val(EJEMPLO_A2.inicial);
    if (!validarPaso4()) return;
    $('#inp-finales').val(EJEMPLO_A2.finales);
    mostrarMensaje($('#msg-finales'), 'ok', 'Ejemplo A2 cargado. Presione "Construir autómata".');
    $('#btn-construir').trigger('focus');
  }

  /* ------------------------------------------------------------------ */
  /* Eventos                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Hace que Enter en un campo presione el botón indicado.
   * @param {string} selectorCampo
   * @param {Function} accion
   */
  function alPresionarEnter(selectorCampo, accion) {
    $(document).on('keydown', selectorCampo, function (e) {
      if (e.key === 'Enter') { e.preventDefault(); accion(); }
    });
  }

  /** Conecta todos los eventos del Módulo 1. Se llama una vez al cargar. */
  function iniciar() {
    bloquearDesde(2);

    $('#btn-paso1').on('click', validarPaso1);
    $('#btn-paso2').on('click', validarPaso2);
    $('#btn-paso3').on('click', validarPaso3);
    $('#btn-paso4').on('click', validarPaso4);
    $('#btn-construir').on('click', construir);
    $('#btn-ejemplo-a2').on('click', cargarEjemploA2);

    alPresionarEnter('#inp-estados', validarPaso1);
    alPresionarEnter('#inp-alfabeto', validarPaso2);
    alPresionarEnter('#contenedor-delta input', validarPaso3);
    alPresionarEnter('#inp-inicial', validarPaso4);
    alPresionarEnter('#inp-finales', construir);

    // Si se modifica un paso, los siguientes deben validarse otra vez.
    $('#inp-estados').on('input', function () { $('#paso1').removeClass('valido'); bloquearDesde(2); });
    $('#inp-alfabeto').on('input', function () { $('#paso2').removeClass('valido'); bloquearDesde(3); });
    $(document).on('input', '#contenedor-delta input', function () {
      $('#paso3').removeClass('valido');
      bloquearDesde(4);
      $(this).removeClass('invalido').siblings('.mensaje').text('');
    });
    // Al salir de una casilla de δ se valida de inmediato.
    $(document).on('blur', '#contenedor-delta input', function () {
      if ($(this).val().trim() !== '') validarCeldaDelta($(this));
    });
    $('#inp-inicial').on('input', function () { $('#paso4').removeClass('valido'); bloquearDesde(5); });
    $('#inp-finales').on('input', function () { $('#paso5').removeClass('valido'); });
  }

  return { iniciar: iniciar, crearTablaTransiciones: crearTablaTransiciones };
})();
