(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Palette = Hormi.Core.Palette;

  /**
   * Calcula el numero de bits necesario para una tabla de color.
   *
   * @param {number} tableSize Tamano de tabla.
   * @returns {number} Bits necesarios.
   */
  function colorDepth(tableSize) {
    return Math.max(1, Math.ceil(Math.log(tableSize) / Math.log(2)));
  }

  /**
   * Prepara paleta, pixeles indexados y transparencia para GIF.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {{palette:object[],pixels:Uint8Array,transparentIndex:number|null,tableSize:number}} Datos GIF.
   */
  function buildGifIndexedImage(imageData, options) {
    var settings = options || {};
    var useTransparency = Boolean(settings.transparency);
    var alphaThreshold = Number(settings.alphaThreshold || 1);
    var maxColors = Math.max(2, Math.min(256, Number(settings.colors || 128)));
    var visualLimit = useTransparency ? maxColors - 1 : maxColors;
    var visualPalette = Palette.quantize(imageData, visualLimit, alphaThreshold);
    var palette = useTransparency ? [{ r: 0, g: 0, b: 0 }].concat(visualPalette) : visualPalette;
    var pixels = new Uint8Array(imageData.width * imageData.height);

    for (var i = 0; i < pixels.length; i += 1) {
      var source = i * 4;
      if (useTransparency && imageData.data[source + 3] < alphaThreshold) {
        pixels[i] = 0;
      } else {
        pixels[i] = Palette.nearestColorIndex(
          imageData.data[source],
          imageData.data[source + 1],
          imageData.data[source + 2],
          visualPalette
        ) + (useTransparency ? 1 : 0);
      }
    }

    var tableSize = Palette.paletteTableSize(Math.max(2, palette.length));
    while (palette.length < tableSize) {
      palette.push({ r: 0, g: 0, b: 0 });
    }

    return {
      palette: palette,
      pixels: pixels,
      transparentIndex: useTransparency ? 0 : null,
      tableSize: tableSize
    };
  }

  /**
   * Empaqueta codigos LZW en bits little-endian.
   *
   * @param {number[]} codes Codigos LZW.
   * @param {number[]} sizes Tamano de cada codigo.
   * @returns {Uint8Array} Bytes empaquetados.
   */
  function packCodes(codes, sizes) {
    var bytes = [];
    var current = 0;
    var bitCount = 0;
    for (var i = 0; i < codes.length; i += 1) {
      current |= codes[i] << bitCount;
      bitCount += sizes[i];
      while (bitCount >= 8) {
        bytes.push(current & 0xff);
        current >>>= 8;
        bitCount -= 8;
      }
    }
    if (bitCount > 0) {
      bytes.push(current & 0xff);
    }
    return new Uint8Array(bytes);
  }

  /**
   * Convierte pixeles indexados en flujo LZW GIF.
   *
   * @param {Uint8Array} pixels Pixeles indexados.
   * @param {number} minCodeSize Tamano minimo LZW.
   * @returns {Uint8Array} Datos LZW empaquetados.
   */
  function lzwEncode(pixels, minCodeSize) {
    var clearCode = 1 << minCodeSize;
    var endCode = clearCode + 1;
    var nextCode = endCode + 1;
    var codeSize = minCodeSize + 1;
    var dictionary = new Map();
    var codes = [clearCode];
    var sizes = [codeSize];
    var phrase = String(pixels[0]);

    for (var i = 0; i < clearCode; i += 1) {
      dictionary.set(String(i), i);
    }

    for (var p = 1; p < pixels.length; p += 1) {
      var current = String(pixels[p]);
      var combined = phrase + ',' + current;
      if (dictionary.has(combined)) {
        phrase = combined;
      } else {
        codes.push(dictionary.get(phrase));
        sizes.push(codeSize);
        if (nextCode < 4096) {
          dictionary.set(combined, nextCode);
          nextCode += 1;
          if (nextCode === (1 << codeSize) && codeSize < 12) {
            codeSize += 1;
          }
        } else {
          codes.push(clearCode);
          sizes.push(codeSize);
          dictionary.clear();
          for (var reset = 0; reset < clearCode; reset += 1) {
            dictionary.set(String(reset), reset);
          }
          nextCode = endCode + 1;
          codeSize = minCodeSize + 1;
        }
        phrase = current;
      }
    }

    codes.push(dictionary.get(phrase));
    sizes.push(codeSize);
    codes.push(endCode);
    sizes.push(codeSize);
    return packCodes(codes, sizes);
  }

  /**
   * Divide datos GIF en subbloques de 255 bytes.
   *
   * @param {Uint8Array} bytes Datos de entrada.
   * @returns {Uint8Array[]} Subbloques con terminador.
   */
  function dataSubBlocks(bytes) {
    var parts = [];
    for (var i = 0; i < bytes.length; i += 255) {
      var chunk = bytes.subarray(i, i + 255);
      var block = new Uint8Array(1 + chunk.length);
      block[0] = chunk.length;
      block.set(chunk, 1);
      parts.push(block);
    }
    parts.push(new Uint8Array([0]));
    return parts;
  }

  /**
   * Codifica una imagen como GIF89a de un fotograma.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes GIF.
   */
  function encodeGif(imageData, options) {
    var indexed = buildGifIndexedImage(imageData, options);
    var depth = colorDepth(indexed.tableSize);
    var minCodeSize = Math.max(2, depth);
    var lzw = lzwEncode(indexed.pixels, minCodeSize);
    var logical = new Uint8Array(7);
    Binary.writeU16LE(logical, 0, imageData.width);
    Binary.writeU16LE(logical, 2, imageData.height);
    logical[4] = 0x80 | (7 << 4) | (depth - 1);
    logical[5] = 0;
    logical[6] = 0;

    var globalTable = new Uint8Array(indexed.tableSize * 3);
    for (var i = 0; i < indexed.tableSize; i += 1) {
      globalTable[i * 3] = indexed.palette[i].r;
      globalTable[(i * 3) + 1] = indexed.palette[i].g;
      globalTable[(i * 3) + 2] = indexed.palette[i].b;
    }

    var descriptor = new Uint8Array(10);
    descriptor[0] = 0x2c;
    Binary.writeU16LE(descriptor, 5, imageData.width);
    Binary.writeU16LE(descriptor, 7, imageData.height);
    descriptor[9] = 0;

    var parts = [
      Binary.asciiBytes('GIF89a'),
      logical,
      globalTable
    ];

    if (indexed.transparentIndex !== null) {
      parts.push(new Uint8Array([0x21, 0xf9, 0x04, 0x01, 0, 0, indexed.transparentIndex, 0]));
    }

    parts.push(descriptor, new Uint8Array([minCodeSize]));
    parts = parts.concat(dataSubBlocks(lzw));
    parts.push(new Uint8Array([0x3b]));
    return Binary.concatBytes(parts);
  }

  Hormi.Encoders.Gif = {
    encode: encodeGif
  };
}(globalThis));
