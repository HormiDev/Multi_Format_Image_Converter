(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;

  /**
   * Escapa texto para XML.
   *
   * @param {string} value Texto de entrada.
   * @returns {string} Texto escapado.
   */
  function escapeXml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Codifica una imagen raster como SVG con PNG embebido.
   *
   * @param {object} raster Imagen cargada.
   * @param {object} options Opciones de salida.
   * @returns {Promise<Blob>} Blob SVG.
   */
  async function encodeSvg(raster, options) {
    var settings = options || {};
    var pngBlob = await Hormi.Encoders.Native.canvasToBlob(raster.canvas, 'image/png');
    var pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    var title = settings.title || raster.name || 'imagen';
    var svg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + raster.width + '" height="' + raster.height + '" viewBox="0 0 ' + raster.width + ' ' + raster.height + '">',
      '<title>' + escapeXml(title) + '</title>',
      '<image width="' + raster.width + '" height="' + raster.height + '" href="data:image/png;base64,' + Binary.bytesToBase64(pngBytes) + '"/>',
      '</svg>',
      ''
    ].join('\n');
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  Hormi.Encoders.Svg = {
    encode: encodeSvg
  };
}(globalThis));
