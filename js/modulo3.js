//  Módulo 3: probar si una palabra es reconocida. Muestra el recorrido, el estado en que termina, si es final y el resultado (verde/rojo). Lleva un  historial de las palabras probadas. El recorrido está en AFD.recorrer().

const Modulo3 = (function () {

  let contador = 0; // número de pruebas en el historial

  /**
   * Muestra la tupla del autómata actual (se llama al entrar a la pestaña).
   * @param {AFD} afd
   */
  function mostrar(afd) {
    $('#tupla-modulo3').text(afd.tupla());
    $('#inp-palabra').trigger('focus');
  }

  // Prueba la palabra escrita en el campo con el autómata actual.
  function probar() {
    const afd = Simulador.automata;
    // ui.js ya muestra el aviso de ir al Módulo 1
    if (!afd) return;

    const palabra = $('#inp-palabra').val();
    const r = afd.recorrer(palabra);
    const camino = afd.formatearCamino(r);

    // Resultado detallado
    const $res = $('#resultado-prueba').empty().removeClass('oculto');
    $res.append($('<p>').append('<strong>Palabra:</strong> ').append(document.createTextNode(mostrarPalabra(palabra))));
    $res.append($('<p>').append('<strong>Recorrido:</strong> ').append($('<span class="camino">').text(camino)));

    if (r.error) {
      $res.append($('<p>').text('Se detuvo en el estado ' + r.estadoFinal + ': ' + r.error.mensaje));
    } else {
      if (palabra === '') {
        $res.append($('<p>').text('Palabra vacía: el autómata se queda en el estado inicial ' + afd.inicial + '.'));
      }
      $res.append($('<p>')
        .append('<strong>Estado en que termina:</strong> ')
        .append(document.createTextNode(r.estadoFinal + ' — '))
        .append($('<span>').addClass(r.esFinal ? 'si-texto' : 'no-texto')
          .text(r.esFinal ? 'es final (∈ F)' : 'no es final (∉ F)')));
    }

    const textoVeredicto = r.aceptada ? 'SÍ es reconocida' : 'NO es reconocida';
    $res.append($('<p>').append(
      $('<span class="veredicto">').addClass(r.aceptada ? 'si' : 'no')
        .text('La palabra ' + mostrarPalabra(palabra) + ' ' + textoVeredicto + '.')
    ));

    agregarAlHistorial(palabra, camino, r, textoVeredicto);

    // Dejar el campo listo para otra palabra.
    $('#inp-palabra').val('').trigger('focus');
  }

  /**
   * Agrega una fila al historial.
   * @param {string} palabra
   * @param {string} camino
   * @param {object} r Resultado de recorrer().
   * @param {string} textoVeredicto
   */
  function agregarAlHistorial(palabra, camino, r, textoVeredicto) {
    contador++;
    const $fila = $('<tr>')
      .append($('<td>').text(contador))
      .append($('<td>').text(mostrarPalabra(palabra)))
      .append($('<td class="camino">').text(camino + (r.error ? '  (símbolo "' + r.error.simbolo + '" en posición ' + r.error.posicion + ' ∉ Σ)' : '')))
      .append($('<td>').append($('<span>').addClass(r.aceptada ? 'si-texto' : 'no-texto').text(textoVeredicto)));
    $('#tabla-historial tbody').prepend($fila); // la más reciente arriba
    actualizarHistorialVacio();
  }

  // Borra el historial y el último resultado.
  function limpiarHistorial() {
    contador = 0;
    $('#tabla-historial tbody').empty();
    $('#resultado-prueba').empty().addClass('oculto');
    actualizarHistorialVacio();
  }

  // Muestra u oculta el texto "Aún no se ha probado ninguna palabra".
  function actualizarHistorialVacio() {
    const vacio = $('#tabla-historial tbody tr').length === 0;
    $('#historial-vacio').toggleClass('oculto', !vacio);
    $('#tabla-historial').toggleClass('oculto', vacio);
  }

  // Conecta los eventos del Módulo 3.
  function iniciar() {
    $('#btn-probar').on('click', probar);
    $('#inp-palabra').on('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); probar(); }
    });
    $('#btn-limpiar-historial').on('click', limpiarHistorial);
    actualizarHistorialVacio();
  }

  return { iniciar: iniciar, mostrar: mostrar, limpiarHistorial: limpiarHistorial };
})();
