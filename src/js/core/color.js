(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Limita un numero al rango de un canal de color.
   *
   * @param {number} value Valor de entrada.
   * @returns {number} Entero entre 0 y 255.
   */
  function clampByte(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  /**
   * Convierte un color hexadecimal a componentes RGB.
   *
   * @param {string} value Color en formato #rgb o #rrggbb.
   * @param {object} fallback Color usado si el texto no es valido.
   * @returns {{r:number,g:number,b:number}} Componentes RGB.
   */
  function parseHexColor(value, fallback) {
    var safeFallback = fallback || { r: 255, g: 255, b: 255 };
    if (!value || typeof value !== 'string') {
      return safeFallback;
    }

    var hex = value.replace('#', '').trim();
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    }

    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
      };
    }

    return safeFallback;
  }

  /**
   * Convierte componentes RGB a hexadecimal.
   *
   * @param {number} r Canal rojo.
   * @param {number} g Canal verde.
   * @param {number} b Canal azul.
   * @returns {string} Color hexadecimal #rrggbb.
   */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (channel) {
      return clampByte(channel).toString(16).padStart(2, '0');
    }).join('');
  }

  /**
   * Calcula la luminancia perceptual aproximada de un color.
   *
   * @param {number} r Canal rojo.
   * @param {number} g Canal verde.
   * @param {number} b Canal azul.
   * @returns {number} Luminancia entre 0 y 255.
   */
  function luma(r, g, b) {
    return clampByte((0.299 * r) + (0.587 * g) + (0.114 * b));
  }

  /**
   * Mezcla un pixel RGBA contra un fondo RGB.
   *
   * @param {Uint8ClampedArray|Uint8Array} data Datos RGBA.
   * @param {number} offset Posicion del pixel.
   * @param {{r:number,g:number,b:number}} background Fondo RGB.
   * @returns {{r:number,g:number,b:number,a:number}} Pixel resultante.
   */
  function flattenPixel(data, offset, background) {
    var alpha = data[offset + 3] / 255;
    var inv = 1 - alpha;
    return {
      r: clampByte((data[offset] * alpha) + (background.r * inv)),
      g: clampByte((data[offset + 1] * alpha) + (background.g * inv)),
      b: clampByte((data[offset + 2] * alpha) + (background.b * inv)),
      a: 255
    };
  }

  /**
   * Lee un pixel RGBA de un ImageData compatible.
   *
   * @param {{data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {number} x Coordenada X.
   * @param {number} y Coordenada Y.
   * @returns {{r:number,g:number,b:number,a:number}} Pixel leido.
   */
  function getPixel(imageData, x, y) {
    var offset = ((y * imageData.width) + x) * 4;
    return {
      r: imageData.data[offset],
      g: imageData.data[offset + 1],
      b: imageData.data[offset + 2],
      a: imageData.data[offset + 3]
    };
  }

  /**
   * Escribe un pixel RGBA en un buffer de imagen.
   *
   * @param {Uint8ClampedArray|Uint8Array} data Buffer RGBA.
   * @param {number} offset Posicion del pixel.
   * @param {number} r Canal rojo.
   * @param {number} g Canal verde.
   * @param {number} b Canal azul.
   * @param {number} a Canal alfa.
   * @returns {void}
   */
  function setPixel(data, offset, r, g, b, a) {
    data[offset] = clampByte(r);
    data[offset + 1] = clampByte(g);
    data[offset + 2] = clampByte(b);
    data[offset + 3] = clampByte(a);
  }

  /**
   * Crea una copia RGBA con alfa mezclado contra un fondo.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {{r:number,g:number,b:number}} background Fondo RGB.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen opaca.
   */
  function flattenImageData(imageData, background) {
    var out = new Uint8ClampedArray(imageData.width * imageData.height * 4);
    for (var i = 0; i < imageData.data.length; i += 4) {
      var pixel = flattenPixel(imageData.data, i, background);
      setPixel(out, i, pixel.r, pixel.g, pixel.b, 255);
    }
    return {
      width: imageData.width,
      height: imageData.height,
      data: out
    };
  }

  Hormi.Core.Color = {
    clampByte: clampByte,
    flattenImageData: flattenImageData,
    flattenPixel: flattenPixel,
    getPixel: getPixel,
    luma: luma,
    parseHexColor: parseHexColor,
    rgbToHex: rgbToHex,
    setPixel: setPixel
  };
}(globalThis));
