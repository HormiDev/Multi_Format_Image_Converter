(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Calcula el tamano de datos asociado a un tipo TIFF.
   *
   * @param {number} type Tipo TIFF.
   * @param {number} count Numero de valores.
   * @returns {number} Tamano en bytes.
   */
  function tiffValueSize(type, count) {
    var sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 };
    return sizes[type] * count;
  }

  /**
   * Escribe una entrada IFD TIFF.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion inicial.
   * @param {object} entry Entrada IFD.
   * @returns {number} Nueva posicion.
   */
  function writeIfdEntry(out, offset, entry) {
    offset = Binary.writeU16LE(out, offset, entry.tag);
    offset = Binary.writeU16LE(out, offset, entry.type);
    offset = Binary.writeU32LE(out, offset, entry.count);
    if (entry.inline) {
      out.set(entry.inline, offset);
      offset += 4;
    } else {
      offset = Binary.writeU32LE(out, offset, entry.value);
    }
    return offset;
  }

  /**
   * Crea bytes inline para valores SHORT TIFF.
   *
   * @param {number[]} values Valores SHORT.
   * @returns {Uint8Array} Bloque de cuatro bytes.
   */
  function inlineShorts(values) {
    var out = new Uint8Array(4);
    for (var i = 0; i < values.length && i < 2; i += 1) {
      Binary.writeU16LE(out, i * 2, values[i]);
    }
    return out;
  }

  /**
   * Escribe una lista de SHORT fuera del IFD.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion inicial.
   * @param {number[]} values Valores SHORT.
   * @returns {void}
   */
  function writeShortArray(out, offset, values) {
    for (var i = 0; i < values.length; i += 1) {
      Binary.writeU16LE(out, offset + (i * 2), values[i]);
    }
  }

  /**
   * Escribe un racional TIFF 72/1.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion inicial.
   * @returns {void}
   */
  function writeResolution(out, offset) {
    Binary.writeU32LE(out, offset, 72);
    Binary.writeU32LE(out, offset + 4, 1);
  }

  /**
   * Crea el bloque de pixeles RGB o RGBA para TIFF.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {number} samples Muestras por pixel.
   * @param {string} background Fondo hexadecimal.
   * @returns {Uint8Array} Pixeles TIFF.
   */
  function makeTiffPixels(imageData, samples, background) {
    var out = new Uint8Array(imageData.width * imageData.height * samples);
    var bg = Color.parseHexColor(background || '#ffffff');
    for (var i = 0; i < imageData.width * imageData.height; i += 1) {
      var source = i * 4;
      var target = i * samples;
      var pixel = samples === 4
        ? {
          r: imageData.data[source],
          g: imageData.data[source + 1],
          b: imageData.data[source + 2],
          a: imageData.data[source + 3]
        }
        : Color.flattenPixel(imageData.data, source, bg);
      out[target] = pixel.r;
      out[target + 1] = pixel.g;
      out[target + 2] = pixel.b;
      if (samples === 4) {
        out[target + 3] = pixel.a;
      }
    }
    return out;
  }

  /**
   * Codifica una imagen como TIFF baseline sin compresion.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes TIFF.
   */
  function encodeTiff(imageData, options) {
    var settings = options || {};
    var preserveAlpha = settings.alphaMode === 'preserve';
    var samples = preserveAlpha ? 4 : 3;
    var pixelData = makeTiffPixels(imageData, samples, settings.background);
    var entries = [];
    var ifdOffset = 8;
    var ifdSize = 2 + ((preserveAlpha ? 13 : 12) * 12) + 4;
    var extraOffset = ifdOffset + ifdSize;
    var bitsOffset = extraOffset;
    var bitsSize = tiffValueSize(3, samples);
    var xResolutionOffset = bitsOffset + bitsSize;
    var yResolutionOffset = xResolutionOffset + 8;
    var pixelOffset = yResolutionOffset + 8;
    var out = new Uint8Array(pixelOffset + pixelData.length);

    entries.push({ tag: 256, type: 4, count: 1, value: imageData.width });
    entries.push({ tag: 257, type: 4, count: 1, value: imageData.height });
    entries.push({ tag: 258, type: 3, count: samples, value: bitsOffset });
    entries.push({ tag: 259, type: 3, count: 1, inline: inlineShorts([1]) });
    entries.push({ tag: 262, type: 3, count: 1, inline: inlineShorts([2]) });
    entries.push({ tag: 273, type: 4, count: 1, value: pixelOffset });
    entries.push({ tag: 277, type: 3, count: 1, inline: inlineShorts([samples]) });
    entries.push({ tag: 278, type: 4, count: 1, value: imageData.height });
    entries.push({ tag: 279, type: 4, count: 1, value: pixelData.length });
    entries.push({ tag: 282, type: 5, count: 1, value: xResolutionOffset });
    entries.push({ tag: 283, type: 5, count: 1, value: yResolutionOffset });
    entries.push({ tag: 296, type: 3, count: 1, inline: inlineShorts([2]) });
    if (preserveAlpha) {
      entries.push({ tag: 338, type: 3, count: 1, inline: inlineShorts([2]) });
    }

    out[0] = 0x49;
    out[1] = 0x49;
    Binary.writeU16LE(out, 2, 42);
    Binary.writeU32LE(out, 4, ifdOffset);
    Binary.writeU16LE(out, ifdOffset, entries.length);
    var offset = ifdOffset + 2;
    for (var i = 0; i < entries.length; i += 1) {
      offset = writeIfdEntry(out, offset, entries[i]);
    }
    Binary.writeU32LE(out, offset, 0);
    writeShortArray(out, bitsOffset, new Array(samples).fill(8));
    writeResolution(out, xResolutionOffset);
    writeResolution(out, yResolutionOffset);
    out.set(pixelData, pixelOffset);
    return out;
  }

  Hormi.Encoders.Tiff = {
    encode: encodeTiff
  };
}(globalThis));
