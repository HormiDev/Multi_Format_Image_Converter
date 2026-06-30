(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Lee un entero firmado de 32 bits little-endian.
   *
   * @param {Uint8Array} bytes Bytes de entrada.
   * @param {number} offset Posicion de lectura.
   * @returns {number} Valor firmado.
   */
  function readS32LE(bytes, offset) {
    return Binary.readU32LE(bytes, offset) << 0;
  }

  /**
   * Comprueba si todos los canales alfa estan vacios.
   *
   * @param {Uint8ClampedArray} data Datos RGBA.
   * @returns {boolean} True si ningun pixel tiene alfa.
   */
  function allAlphaZero(data) {
    for (var i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Decodifica BMP no comprimido de 24 o 32 bits.
   *
   * @param {ArrayBuffer|Uint8Array} input Bytes del fichero.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeBmp(input) {
    var bytes = Binary.toUint8Array(input);
    if (bytes[0] !== 0x42 || bytes[1] !== 0x4d) {
      throw new Error('Cabecera BMP no valida');
    }

    var pixelOffset = Binary.readU32LE(bytes, 10);
    var dibSize = Binary.readU32LE(bytes, 14);
    if (dibSize < 40) {
      throw new Error('BMP DIB demasiado antiguo');
    }

    var width = readS32LE(bytes, 18);
    var rawHeight = readS32LE(bytes, 22);
    var height = Math.abs(rawHeight);
    var planes = Binary.readU16LE(bytes, 26);
    var bitDepth = Binary.readU16LE(bytes, 28);
    var compression = Binary.readU32LE(bytes, 30);
    if (planes !== 1 || compression !== 0 || (bitDepth !== 24 && bitDepth !== 32)) {
      throw new Error('BMP no comprimido de 24/32 bits requerido');
    }

    var topDown = rawHeight < 0;
    var bytesPerPixel = bitDepth / 8;
    var rowStride = Math.floor(((width * bitDepth) + 31) / 32) * 4;
    var out = new Uint8ClampedArray(width * height * 4);

    for (var y = 0; y < height; y += 1) {
      var sourceY = topDown ? y : (height - 1 - y);
      var row = pixelOffset + (sourceY * rowStride);
      for (var x = 0; x < width; x += 1) {
        var source = row + (x * bytesPerPixel);
        var target = ((y * width) + x) * 4;
        Color.setPixel(
          out,
          target,
          bytes[source + 2],
          bytes[source + 1],
          bytes[source],
          bitDepth === 32 ? bytes[source + 3] : 255
        );
      }
    }

    if (bitDepth === 32 && allAlphaZero(out)) {
      for (var i = 3; i < out.length; i += 4) {
        out[i] = 255;
      }
    }

    return { width: width, height: height, data: out };
  }

  Hormi.Importers.Bmp = {
    decode: decodeBmp
  };
}(globalThis));
