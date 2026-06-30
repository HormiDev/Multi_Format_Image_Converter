(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;

  /**
   * Convierte una fecha JavaScript al formato de hora DOS de ZIP.
   *
   * @param {Date} date Fecha de entrada.
   * @returns {number} Hora DOS empaquetada.
   */
  function dosTime(date) {
    return ((date.getHours() & 0x1f) << 11) |
      ((date.getMinutes() & 0x3f) << 5) |
      Math.floor(date.getSeconds() / 2);
  }

  /**
   * Convierte una fecha JavaScript al formato de fecha DOS de ZIP.
   *
   * @param {Date} date Fecha de entrada.
   * @returns {number} Fecha DOS empaquetada.
   */
  function dosDate(date) {
    return (((date.getFullYear() - 1980) & 0x7f) << 9) |
      (((date.getMonth() + 1) & 0x0f) << 5) |
      (date.getDate() & 0x1f);
  }

  /**
   * Normaliza un nombre de fichero dentro del zip.
   *
   * @param {string} name Nombre propuesto.
   * @returns {string} Nombre portable.
   */
  function cleanZipName(name) {
    return String(name || 'archivo.bin')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/[<>:"|?*]/g, '_');
  }

  /**
   * Convierte una entrada de fichero a bytes.
   *
   * @param {Blob|ArrayBuffer|Uint8Array|string} data Datos de entrada.
   * @returns {Promise<Uint8Array>} Bytes listos para ZIP.
   */
  async function entryBytes(data) {
    if (data instanceof Uint8Array) {
      return data;
    }
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return new Uint8Array(await data.arrayBuffer());
    }
    if (typeof data === 'string') {
      return Binary.utf8Bytes(data);
    }
    throw new TypeError('Entrada ZIP no soportada');
  }

  /**
   * Crea la cabecera local de un fichero ZIP sin compresion.
   *
   * @param {object} entry Entrada preparada.
   * @returns {Uint8Array} Cabecera local.
   */
  function localHeader(entry) {
    var nameBytes = Binary.utf8Bytes(entry.name);
    var out = new Uint8Array(30 + nameBytes.length);
    var offset = 0;
    offset = Binary.writeU32LE(out, offset, 0x04034b50);
    offset = Binary.writeU16LE(out, offset, 20);
    offset = Binary.writeU16LE(out, offset, 0x0800);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, entry.time);
    offset = Binary.writeU16LE(out, offset, entry.date);
    offset = Binary.writeU32LE(out, offset, entry.crc);
    offset = Binary.writeU32LE(out, offset, entry.bytes.length);
    offset = Binary.writeU32LE(out, offset, entry.bytes.length);
    offset = Binary.writeU16LE(out, offset, nameBytes.length);
    offset = Binary.writeU16LE(out, offset, 0);
    out.set(nameBytes, offset);
    return out;
  }

  /**
   * Crea la cabecera central de un fichero ZIP sin compresion.
   *
   * @param {object} entry Entrada preparada.
   * @returns {Uint8Array} Cabecera central.
   */
  function centralHeader(entry) {
    var nameBytes = Binary.utf8Bytes(entry.name);
    var out = new Uint8Array(46 + nameBytes.length);
    var offset = 0;
    offset = Binary.writeU32LE(out, offset, 0x02014b50);
    offset = Binary.writeU16LE(out, offset, 20);
    offset = Binary.writeU16LE(out, offset, 20);
    offset = Binary.writeU16LE(out, offset, 0x0800);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, entry.time);
    offset = Binary.writeU16LE(out, offset, entry.date);
    offset = Binary.writeU32LE(out, offset, entry.crc);
    offset = Binary.writeU32LE(out, offset, entry.bytes.length);
    offset = Binary.writeU32LE(out, offset, entry.bytes.length);
    offset = Binary.writeU16LE(out, offset, nameBytes.length);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU32LE(out, offset, 0);
    offset = Binary.writeU32LE(out, offset, entry.localOffset);
    out.set(nameBytes, offset);
    return out;
  }

  /**
   * Crea el registro final del directorio central.
   *
   * @param {number} count Numero de entradas.
   * @param {number} centralSize Tamano del directorio central.
   * @param {number} centralOffset Offset del directorio central.
   * @returns {Uint8Array} Registro final.
   */
  function endRecord(count, centralSize, centralOffset) {
    var out = new Uint8Array(22);
    var offset = 0;
    offset = Binary.writeU32LE(out, offset, 0x06054b50);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, count);
    offset = Binary.writeU16LE(out, offset, count);
    offset = Binary.writeU32LE(out, offset, centralSize);
    offset = Binary.writeU32LE(out, offset, centralOffset);
    Binary.writeU16LE(out, offset, 0);
    return out;
  }

  /**
   * Empaqueta ficheros en un ZIP de metodo store.
   *
   * @param {{name:string,data:Blob|ArrayBuffer|Uint8Array|string}[]} files Ficheros.
   * @returns {Promise<Blob>} Blob ZIP.
   */
  async function createZip(files) {
    var now = new Date();
    var entries = [];
    for (var i = 0; i < files.length; i += 1) {
      var bytes = await entryBytes(files[i].data);
      entries.push({
        name: cleanZipName(files[i].name),
        bytes: bytes,
        crc: Hormi.Zip.crc32(bytes),
        time: dosTime(now),
        date: dosDate(now),
        localOffset: 0
      });
    }

    var localParts = [];
    var centralParts = [];
    var offset = 0;
    for (var j = 0; j < entries.length; j += 1) {
      var entry = entries[j];
      entry.localOffset = offset;
      var header = localHeader(entry);
      localParts.push(header, entry.bytes);
      offset += header.length + entry.bytes.length;
    }

    var centralOffset = offset;
    var centralSize = 0;
    for (var k = 0; k < entries.length; k += 1) {
      var central = centralHeader(entries[k]);
      centralParts.push(central);
      centralSize += central.length;
    }

    var zipBytes = Binary.concatBytes(localParts.concat(centralParts, [
      endRecord(entries.length, centralSize, centralOffset)
    ]));
    return new Blob([zipBytes], { type: 'application/zip' });
  }

  Hormi.Zip.createZip = createZip;
}(globalThis));
