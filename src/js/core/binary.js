(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var textEncoder = new TextEncoder();
  var textDecoder = new TextDecoder('utf-8');

  /**
   * Convierte texto UTF-8 en bytes.
   *
   * @param {string} text Texto de entrada.
   * @returns {Uint8Array} Bytes codificados.
   */
  function utf8Bytes(text) {
    return textEncoder.encode(text);
  }

  /**
   * Convierte bytes UTF-8 en texto.
   *
   * @param {ArrayBuffer|Uint8Array} bytes Bytes de entrada.
   * @returns {string} Texto decodificado.
   */
  function utf8Text(bytes) {
    return textDecoder.decode(bytes);
  }

  /**
   * Convierte texto ASCII en bytes sin transformaciones Unicode.
   *
   * @param {string} text Texto ASCII.
   * @returns {Uint8Array} Bytes ASCII.
   */
  function asciiBytes(text) {
    var out = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i += 1) {
      out[i] = text.charCodeAt(i) & 0xff;
    }
    return out;
  }

  /**
   * Convierte bytes ASCII en texto.
   *
   * @param {ArrayBuffer|Uint8Array} bytes Bytes ASCII.
   * @returns {string} Texto resultante.
   */
  function asciiText(bytes) {
    var view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    var chunkSize = 8192;
    var result = '';
    for (var i = 0; i < view.length; i += chunkSize) {
      result += String.fromCharCode.apply(null, view.subarray(i, i + chunkSize));
    }
    return result;
  }

  /**
   * Une varias matrices de bytes en una sola.
   *
   * @param {Uint8Array[]} parts Bloques de bytes.
   * @returns {Uint8Array} Bloque concatenado.
   */
  function concatBytes(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i += 1) {
      total += parts[i].length;
    }

    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < parts.length; j += 1) {
      out.set(parts[j], offset);
      offset += parts[j].length;
    }
    return out;
  }

  /**
   * Escribe un entero de 16 bits little-endian.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion de escritura.
   * @param {number} value Valor numerico.
   * @returns {number} Nueva posicion de escritura.
   */
  function writeU16LE(out, offset, value) {
    out[offset] = value & 0xff;
    out[offset + 1] = (value >>> 8) & 0xff;
    return offset + 2;
  }

  /**
   * Escribe un entero de 16 bits big-endian.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion de escritura.
   * @param {number} value Valor numerico.
   * @returns {number} Nueva posicion de escritura.
   */
  function writeU16BE(out, offset, value) {
    out[offset] = (value >>> 8) & 0xff;
    out[offset + 1] = value & 0xff;
    return offset + 2;
  }

  /**
   * Escribe un entero de 32 bits little-endian.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion de escritura.
   * @param {number} value Valor numerico.
   * @returns {number} Nueva posicion de escritura.
   */
  function writeU32LE(out, offset, value) {
    out[offset] = value & 0xff;
    out[offset + 1] = (value >>> 8) & 0xff;
    out[offset + 2] = (value >>> 16) & 0xff;
    out[offset + 3] = (value >>> 24) & 0xff;
    return offset + 4;
  }

  /**
   * Escribe un entero de 32 bits big-endian.
   *
   * @param {Uint8Array} out Buffer de salida.
   * @param {number} offset Posicion de escritura.
   * @param {number} value Valor numerico.
   * @returns {number} Nueva posicion de escritura.
   */
  function writeU32BE(out, offset, value) {
    out[offset] = (value >>> 24) & 0xff;
    out[offset + 1] = (value >>> 16) & 0xff;
    out[offset + 2] = (value >>> 8) & 0xff;
    out[offset + 3] = value & 0xff;
    return offset + 4;
  }

  /**
   * Lee un entero de 16 bits little-endian.
   *
   * @param {Uint8Array} bytes Buffer de entrada.
   * @param {number} offset Posicion de lectura.
   * @returns {number} Valor leido.
   */
  function readU16LE(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  /**
   * Lee un entero de 32 bits little-endian.
   *
   * @param {Uint8Array} bytes Buffer de entrada.
   * @param {number} offset Posicion de lectura.
   * @returns {number} Valor leido sin signo.
   */
  function readU32LE(bytes, offset) {
    return (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>> 0;
  }

  /**
   * Convierte bytes a base64 en navegador o Node.
   *
   * @param {Uint8Array} bytes Bytes de entrada.
   * @returns {string} Cadena base64.
   */
  function bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }

    var chunkSize = 8192;
    var binary = '';
    for (var i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  /**
   * Normaliza una entrada binaria a Uint8Array.
   *
   * @param {ArrayBuffer|Uint8Array} input Entrada binaria.
   * @returns {Uint8Array} Vista normalizada.
   */
  function toUint8Array(input) {
    if (input instanceof Uint8Array) {
      return input;
    }
    return new Uint8Array(input);
  }

  Hormi.Core.Binary = {
    asciiBytes: asciiBytes,
    asciiText: asciiText,
    bytesToBase64: bytesToBase64,
    concatBytes: concatBytes,
    readU16LE: readU16LE,
    readU32LE: readU32LE,
    toUint8Array: toUint8Array,
    utf8Bytes: utf8Bytes,
    utf8Text: utf8Text,
    writeU16BE: writeU16BE,
    writeU16LE: writeU16LE,
    writeU32BE: writeU32BE,
    writeU32LE: writeU32LE
  };
}(globalThis));
