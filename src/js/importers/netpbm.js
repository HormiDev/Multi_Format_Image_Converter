(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Avanza sobre espacios y comentarios Netpbm.
   *
   * @param {Uint8Array} bytes Bytes del fichero.
   * @param {number} offset Posicion inicial.
   * @returns {number} Nueva posicion.
   */
  function skipWhitespaceAndComments(bytes, offset) {
    var cursor = offset;
    while (cursor < bytes.length) {
      var value = bytes[cursor];
      if (value === 35) {
        while (cursor < bytes.length && bytes[cursor] !== 10 && bytes[cursor] !== 13) {
          cursor += 1;
        }
      } else if (value === 9 || value === 10 || value === 13 || value === 32) {
        cursor += 1;
      } else {
        break;
      }
    }
    return cursor;
  }

  /**
   * Lee un token ASCII de un fichero Netpbm.
   *
   * @param {Uint8Array} bytes Bytes del fichero.
   * @param {number} offset Posicion inicial.
   * @returns {{token:string,offset:number}} Token y posicion final.
   */
  function readToken(bytes, offset) {
    var cursor = skipWhitespaceAndComments(bytes, offset);
    var start = cursor;
    while (cursor < bytes.length) {
      var value = bytes[cursor];
      if (value === 9 || value === 10 || value === 13 || value === 32 || value === 35) {
        break;
      }
      cursor += 1;
    }
    return {
      token: Binary.asciiText(bytes.subarray(start, cursor)),
      offset: cursor
    };
  }

  /**
   * Escala una muestra Netpbm al rango de 8 bits.
   *
   * @param {number} value Muestra original.
   * @param {number} maxValue Maximo declarado.
   * @returns {number} Muestra entre 0 y 255.
   */
  function scaleSample(value, maxValue) {
    if (maxValue <= 0) {
      return 0;
    }
    return Color.clampByte((value / maxValue) * 255);
  }

  /**
   * Decodifica Netpbm ASCII P1, P2 o P3.
   *
   * @param {Uint8Array} bytes Bytes del fichero.
   * @param {string} magic Cabecera P1/P2/P3.
   * @param {number} width Ancho.
   * @param {number} height Alto.
   * @param {number} maxValue Valor maximo.
   * @param {number} offset Posicion de datos.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeAscii(bytes, magic, width, height, maxValue, offset) {
    var out = new Uint8ClampedArray(width * height * 4);
    var cursor = offset;
    for (var i = 0; i < width * height; i += 1) {
      var r;
      var g;
      var b;
      if (magic === 'P1') {
        var bitToken = readToken(bytes, cursor);
        cursor = bitToken.offset;
        r = g = b = bitToken.token === '1' ? 0 : 255;
      } else if (magic === 'P2') {
        var grayToken = readToken(bytes, cursor);
        cursor = grayToken.offset;
        r = g = b = scaleSample(Number(grayToken.token), maxValue);
      } else {
        var redToken = readToken(bytes, cursor);
        var greenToken = readToken(bytes, redToken.offset);
        var blueToken = readToken(bytes, greenToken.offset);
        cursor = blueToken.offset;
        r = scaleSample(Number(redToken.token), maxValue);
        g = scaleSample(Number(greenToken.token), maxValue);
        b = scaleSample(Number(blueToken.token), maxValue);
      }
      var target = i * 4;
      Color.setPixel(out, target, r, g, b, 255);
    }
    return { width: width, height: height, data: out };
  }

  /**
   * Decodifica Netpbm binario P4, P5 o P6.
   *
   * @param {Uint8Array} bytes Bytes del fichero.
   * @param {string} magic Cabecera P4/P5/P6.
   * @param {number} width Ancho.
   * @param {number} height Alto.
   * @param {number} maxValue Valor maximo.
   * @param {number} offset Posicion de datos.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeBinary(bytes, magic, width, height, maxValue, offset) {
    var out = new Uint8ClampedArray(width * height * 4);
    var cursor = skipWhitespaceAndComments(bytes, offset);

    if (magic === 'P4') {
      var rowBytes = Math.ceil(width / 8);
      for (var y = 0; y < height; y += 1) {
        for (var xByte = 0; xByte < rowBytes; xByte += 1) {
          var packed = bytes[cursor + (y * rowBytes) + xByte];
          for (var bit = 0; bit < 8; bit += 1) {
            var x = (xByte * 8) + bit;
            if (x >= width) {
              continue;
            }
            var black = (packed & (0x80 >> bit)) !== 0;
            var target = ((y * width) + x) * 4;
            Color.setPixel(out, target, black ? 0 : 255, black ? 0 : 255, black ? 0 : 255, 255);
          }
        }
      }
      return { width: width, height: height, data: out };
    }

    for (var i = 0; i < width * height; i += 1) {
      var r;
      var g;
      var b;
      if (magic === 'P5') {
        r = g = b = scaleSample(bytes[cursor], maxValue);
        cursor += 1;
      } else {
        r = scaleSample(bytes[cursor], maxValue);
        g = scaleSample(bytes[cursor + 1], maxValue);
        b = scaleSample(bytes[cursor + 2], maxValue);
        cursor += 3;
      }
      Color.setPixel(out, i * 4, r, g, b, 255);
    }
    return { width: width, height: height, data: out };
  }

  /**
   * Decodifica un fichero Netpbm PPM/PGM/PBM.
   *
   * @param {ArrayBuffer|Uint8Array} input Bytes del fichero.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeNetpbm(input) {
    var bytes = Binary.toUint8Array(input);
    var first = readToken(bytes, 0);
    var magic = first.token;
    if (!/^P[1-6]$/.test(magic)) {
      throw new Error('Cabecera Netpbm no valida');
    }

    var widthToken = readToken(bytes, first.offset);
    var heightToken = readToken(bytes, widthToken.offset);
    var width = Number(widthToken.token);
    var height = Number(heightToken.token);
    var maxValue = 1;
    var offset = heightToken.offset;

    if (magic !== 'P1' && magic !== 'P4') {
      var maxToken = readToken(bytes, offset);
      maxValue = Number(maxToken.token);
      offset = maxToken.offset;
    }

    if (!width || !height || maxValue > 255) {
      throw new Error('Netpbm invalido o con profundidad no soportada');
    }

    if (magic === 'P1' || magic === 'P2' || magic === 'P3') {
      return decodeAscii(bytes, magic, width, height, maxValue, offset);
    }
    return decodeBinary(bytes, magic, width, height, maxValue, offset);
  }

  Hormi.Importers.Netpbm = {
    decode: decodeNetpbm
  };
}(globalThis));
