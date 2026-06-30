(function (global) {
  'use strict';

  /**
   * Crea el espacio de nombres global de la aplicacion.
   *
   * @returns {object} Objeto raiz compartido por todos los scripts.
   */
  function createNamespace() {
    return {
      Core: {},
      Encoders: {},
      Importers: {},
      Conversion: {},
      UI: {},
      Zip: {},
      Formats: {}
    };
  }

  global.Hormi = global.Hormi || createNamespace();
}(globalThis));
