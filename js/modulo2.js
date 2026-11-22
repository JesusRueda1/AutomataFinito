/**
 * modulo2.js
 * -----------------------------------------------------------------------------
 * Módulo 2: muestra las 5 palabras reconocidas más cortas en orden canónico,
 * cada una con su recorrido. La búsqueda está en AFD.palabrasReconocidas().
 * -----------------------------------------------------------------------------
 */

const Modulo2 = (function () {

  /**
   * Dibuja el módulo para el autómata dado (se llama cada vez que se entra a la pestaña).
   * @param {AFD} afd
   */
  function mostrar(afd) {
    $('#tupla-modulo2').text(afd.tupla());

    const resultado = afd.palabrasReconocidas(5, LONGITUD_MAXIMA);
    const $lista = $('#lista-palabras').empty();

    resultado.palabras.forEach(function (item) {
      $lista.append(
        $('<li>')
          .append($('<span class="palabra">').text(mostrarPalabra(item.palabra)))
          .append(' ')
          .append($('<span class="camino">').text(item.texto))
      );
    });
    $lista.toggleClass('oculto', resultado.palabras.length === 0);

    const $msg = $('#msg-modulo2').removeClass('error advertencia ok');
    if (resultado.mensaje) {
      $msg.addClass(resultado.palabras.length === 0 ? 'error' : 'advertencia').text(resultado.mensaje);
    } else {
      $msg.text('');
    }
  }

  return { mostrar: mostrar };
})();
