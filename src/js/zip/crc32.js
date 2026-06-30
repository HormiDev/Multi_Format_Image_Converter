(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Genera la tabla CRC32 usada por ZIP.
   *
   * @returns {Uint32Array} Tabla de 256 entradas.
   */
  function makeCrcTable() {
    var table = new Uint32Array(256);
    for (var i = 0; i < 256; i += 1) {
      var value = i;
      for (var bit = 0; bit < 8; bit += 1) {
        value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
      }
      table[i] = value >>> 0;
    }
    return table;
  }

  var crcTable = makeCrcTable();

  /**
   * Calcula CRC32 de un bloque de bytes.
   *
   * @param {Uint8Array} bytes Bytes de entrada.
   * @returns {number} CRC32 sin signo.
   */
  function crc32(bytes) {
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i += 1) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  Hormi.Zip.crc32 = crc32;
}(globalThis));
