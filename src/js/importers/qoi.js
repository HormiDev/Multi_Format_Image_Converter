(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Lee un entero de 32 bits big-endian.
   *
   * @param {Uint8Array} bytes Bytes de entrada.
   * @param {number} offset Posicion de lectura.
   * @returns {number} Entero sin signo.
   */
  function readU32BE(bytes, offset) {
    return (((bytes[offset] << 24) >>> 0) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>> 0;
  }

  /**
   * Calcula el indice hash de pixel usado por QOI.
   *
   * @param {{r:number,g:number,b:number,a:number}} px Pixel RGBA.
   * @returns {number} Indice de tabla.
   */
  function qoiHash(px) {
    return ((px.r * 3) + (px.g * 5) + (px.b * 7) + (px.a * 11)) % 64;
  }

  /**
   * Copia el pixel actual al buffer RGBA.
   *
   * @param {Uint8ClampedArray} out Buffer destino.
   * @param {number} pixelIndex Indice de pixel.
   * @param {{r:number,g:number,b:number,a:number}} px Pixel actual.
   * @returns {void}
   */
  function writePixel(out, pixelIndex, px) {
    var offset = pixelIndex * 4;
    Color.setPixel(out, offset, px.r, px.g, px.b, px.a);
  }

  /**
   * Decodifica una imagen QOI.
   *
   * @param {ArrayBuffer|Uint8Array} input Bytes QOI.
   * @returns {{width:number,height:number,data:Uint8ClampedArray,channels:number,colorspace:number}} Imagen RGBA.
   */
  function decodeQoi(input) {
    var bytes = Binary.toUint8Array(input);
    if (Binary.asciiText(bytes.subarray(0, 4)) !== 'qoif') {
      throw new Error('Cabecera QOI no valida');
    }

    var width = readU32BE(bytes, 4);
    var height = readU32BE(bytes, 8);
    var channels = bytes[12];
    var colorspace = bytes[13];
    var out = new Uint8ClampedArray(width * height * 4);
    var index = new Array(64);
    for (var i = 0; i < 64; i += 1) {
      index[i] = { r: 0, g: 0, b: 0, a: 0 };
    }

    var px = { r: 0, g: 0, b: 0, a: 255 };
    var cursor = 14;
    var pixel = 0;
    while (pixel < width * height && cursor < bytes.length - 8) {
      var b1 = bytes[cursor];
      cursor += 1;

      if (b1 === 0xfe) {
        px = { r: bytes[cursor], g: bytes[cursor + 1], b: bytes[cursor + 2], a: px.a };
        cursor += 3;
      } else if (b1 === 0xff) {
        px = { r: bytes[cursor], g: bytes[cursor + 1], b: bytes[cursor + 2], a: bytes[cursor + 3] };
        cursor += 4;
      } else {
        var tag = b1 & 0xc0;
        if (tag === 0x00) {
          var cached = index[b1 & 0x3f];
          px = { r: cached.r, g: cached.g, b: cached.b, a: cached.a };
        } else if (tag === 0x40) {
          px = {
            r: (px.r + ((b1 >> 4) & 0x03) - 2) & 0xff,
            g: (px.g + ((b1 >> 2) & 0x03) - 2) & 0xff,
            b: (px.b + (b1 & 0x03) - 2) & 0xff,
            a: px.a
          };
        } else if (tag === 0x80) {
          var b2 = bytes[cursor];
          cursor += 1;
          var dg = (b1 & 0x3f) - 32;
          px = {
            r: (px.r + dg - 8 + ((b2 >> 4) & 0x0f)) & 0xff,
            g: (px.g + dg) & 0xff,
            b: (px.b + dg - 8 + (b2 & 0x0f)) & 0xff,
            a: px.a
          };
        } else {
          var run = (b1 & 0x3f) + 1;
          for (var r = 0; r < run && pixel < width * height; r += 1) {
            writePixel(out, pixel, px);
            pixel += 1;
          }
          continue;
        }
      }

      index[qoiHash(px)] = { r: px.r, g: px.g, b: px.b, a: px.a };
      writePixel(out, pixel, px);
      pixel += 1;
    }

    return { width: width, height: height, data: out, channels: channels, colorspace: colorspace };
  }

  Hormi.Importers.Qoi = {
    decode: decodeQoi,
    hash: qoiHash
  };
}(globalThis));
