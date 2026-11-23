// Navegación entre módulos (equivalente al menú principal) y estado global. Se carga al final, cuando ya existen Modulo1, Modulo2 y Modulo3.

// Estado global del simulador: guarda el autómata actual. El construir otro autómata en el Módulo 1 reemplaza al anterior.
const Simulador = {
  /** @type {AFD|null} */
  automata: null,

  // Modulo actual
  moduloActual: 'modulo1',

  /**
   * Reemplaza el autómata actual. El historial del Módulo 3 pertenece al autómata anterior, así que se limpia.
   * @param {AFD} afd
   */
  establecerAutomata: function (afd) {
    this.automata = afd;
    Modulo3.limpiarHistorial();
  },

  /**
   * Muestra un módulo. Los módulos 2 y 3 necesitan un autómata construido; si no lo hay, se muestra un aviso con un botón para ir al Módulo 1.
   * @param {string} modulo
   */
  irA: function (modulo) {
    this.moduloActual = modulo;
    $('.pestana').removeClass('activa');
    $('.pestana[data-modulo="' + modulo + '"]').addClass('activa');
    $('.modulo').addClass('oculto');
    $('#' + modulo).removeClass('oculto');

    const necesitaAutomata = (modulo === 'modulo2' || modulo === 'modulo3');
    const falta = necesitaAutomata && this.automata === null;
    $('#aviso-sin-automata').toggleClass('oculto', !falta);
    $('#' + modulo + ' .contenido-modulo').toggleClass('oculto', falta);

    if (!falta) {
      if (modulo === 'modulo2') Modulo2.mostrar(this.automata);
      if (modulo === 'modulo3') Modulo3.mostrar(this.automata);
    }
  }
};

// Arranque cuando la página terminó de cargar.
$(function () {
  Modulo1.iniciar();
  Modulo3.iniciar();

  $('.pestana').on('click', function () {
    Simulador.irA($(this).data('modulo'));
  });
  $('#btn-ir-modulo1').on('click', function () {
    Simulador.irA('modulo1');
    $('#inp-estados').trigger('focus');
  });

  // Red de seguridad: si ocurriera un error inesperado, se informa sin romper la página.
  window.addEventListener('error', function (e) {
    console.error(e.error || e.message);
  });

  Simulador.irA('modulo1');
  $('#inp-estados').trigger('focus');
});
