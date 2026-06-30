(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;
  var Palette = Hormi.Core.Palette;

  var SYMBOLS = ' .,:;=+*#@$%abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?/()[]{}<>-_';

  /**
   * Genera un codigo XPM para un indice de paleta.
   *
   * @param {number} index Indice numerico.
   * @param {number} charsPerPixel Caracteres por pixel.
   * @returns {string} Codigo XPM.
   */
  function codeForIndex(index, charsPerPixel) {
    var base = SYMBOLS.length;
    var value = index;
    var chars = [];
    for (var i = 0; i < charsPerPixel; i += 1) {
      chars.unshift(SYMBOLS[value % base]);
      value = Math.floor(value / base);
    }
    return chars.join('');
  }

  /**
   * Calcula cuantos caracteres por pixel necesita una paleta XPM.
   *
   * @param {number} colorCount Numero de colores.
   * @returns {number} Longitud del codigo.
   */
  function charsPerPixel(colorCount) {
    var count = 1;
    var capacity = SYMBOLS.length;
    while (capacity < colorCount) {
      count += 1;
      capacity *= SYMBOLS.length;
    }
    return count;
  }

  /**
   * Crea una paleta y pixeles indexados para XPM.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {{palette:object[],pixels:Uint8Array,transparentIndex:number|null}} Datos indexados.
   */
  function buildIndexedImage(imageData, options) {
    var settings = options || {};
    var useTransparency = Boolean(settings.transparency);
    var alphaThreshold = Number(settings.alphaThreshold || 1);
    var maxColors = Math.max(2, Math.min(256, Number(settings.colors || 32)));
    var transparentIndex = useTransparency ? 0 : null;
    var visualPalette = Palette.quantize(imageData, useTransparency ? maxColors - 1 : maxColors, alphaThreshold);
    var finalPalette = useTransparency ? [{ r: 0, g: 0, b: 0, a: 0 }].concat(visualPalette) : visualPalette;
    var pixels = new Uint8Array(imageData.width * imageData.height);

    for (var i = 0; i < pixels.length; i += 1) {
      var source = i * 4;
      if (useTransparency && imageData.data[source + 3] < alphaThreshold) {
        pixels[i] = transparentIndex;
      } else {
        pixels[i] = Palette.nearestColorIndex(
          imageData.data[source],
          imageData.data[source + 1],
          imageData.data[source + 2],
          visualPalette
        ) + (useTransparency ? 1 : 0);
      }
    }

    return {
      palette: finalPalette,
      pixels: pixels,
      transparentIndex: transparentIndex
    };
  }

  /**
   * Escapa texto para una linea entre comillas XPM.
   *
   * @param {string} value Texto de entrada.
   * @returns {string} Texto escapado.
   */
  function escapeXpm(value) {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  /**
   * Codifica una imagen como XPM C-style.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes XPM.
   */
  function encodeXpm(imageData, options) {
    var indexed = buildIndexedImage(imageData, options);
    var cpp = charsPerPixel(indexed.palette.length);
    var codes = indexed.palette.map(function (_color, index) {
      return codeForIndex(index, cpp);
    });
    var lines = [
      '/* XPM */',
      'static char * hormi_image[] = {',
      '"' + imageData.width + ' ' + imageData.height + ' ' + indexed.palette.length + ' ' + cpp + '",'
    ];

    for (var i = 0; i < indexed.palette.length; i += 1) {
      var color = indexed.palette[i];
      var colorText = color.a === 0 ? 'None' : Color.rgbToHex(color.r, color.g, color.b);
      lines.push('"' + escapeXpm(codes[i]) + ' c ' + colorText + '",');
    }

    for (var y = 0; y < imageData.height; y += 1) {
      var row = '';
      for (var x = 0; x < imageData.width; x += 1) {
        row += codes[indexed.pixels[(y * imageData.width) + x]];
      }
      lines.push('"' + escapeXpm(row) + '"' + (y === imageData.height - 1 ? '' : ','));
    }

    lines.push('};', '');
    return Binary.utf8Bytes(lines.join('\n'));
  }

  Hormi.Encoders.Xpm = {
    encode: encodeXpm
  };
}(globalThis));
