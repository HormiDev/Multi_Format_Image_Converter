(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;

  /**
   * Comprueba si dos pixeles QOI son iguales.
   *
   * @param {object} a Primer pixel.
   * @param {object} b Segundo pixel.
   * @returns {boolean} True si coinciden.
   */
  function samePixel(a, b) {
    return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  }

  /**
   * Lee un pixel RGBA de una imagen.
   *
   * @param {{data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {number} pixel Indice de pixel.
   * @returns {{r:number,g:number,b:number,a:number}} Pixel leido.
   */
  function readPixel(imageData, pixel) {
    var offset = pixel * 4;
    return {
      r: imageData.data[offset],
      g: imageData.data[offset + 1],
      b: imageData.data[offset + 2],
      a: imageData.data[offset + 3]
    };
  }

  /**
   * Escribe un codigo QOI_RUN pendiente.
   *
   * @param {number[]} bytes Lista de bytes.
   * @param {number} run Longitud de repeticion.
   * @returns {void}
   */
  function pushRun(bytes, run) {
    if (run > 0) {
      bytes.push(0xc0 | (run - 1));
    }
  }

  /**
   * Escribe el pixel como RGB/RGBA o delta QOI.
   *
   * @param {number[]} bytes Lista de bytes.
   * @param {object} px Pixel actual.
   * @param {object} prev Pixel anterior.
   * @returns {void}
   */
  function pushPixel(bytes, px, prev) {
    if (px.a === prev.a) {
      var dr = px.r - prev.r;
      var dg = px.g - prev.g;
      var db = px.b - prev.b;
      var drdg = dr - dg;
      var dbdg = db - dg;
      if (dr > -3 && dr < 2 && dg > -3 && dg < 2 && db > -3 && db < 2) {
        bytes.push(0x40 | ((dr + 2) << 4) | ((dg + 2) << 2) | (db + 2));
        return;
      }
      if (dg > -33 && dg < 32 && drdg > -9 && drdg < 8 && dbdg > -9 && dbdg < 8) {
        bytes.push(0x80 | (dg + 32), ((drdg + 8) << 4) | (dbdg + 8));
        return;
      }
      bytes.push(0xfe, px.r, px.g, px.b);
      return;
    }
    bytes.push(0xff, px.r, px.g, px.b, px.a);
  }

  /**
   * Codifica una imagen como Quite OK Image.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes QOI.
   */
  function encodeQoi(imageData, options) {
    var settings = options || {};
    var bytes = [];
    var index = new Array(64);
    for (var i = 0; i < 64; i += 1) {
      index[i] = { r: 0, g: 0, b: 0, a: 0 };
    }

    bytes.push(0x71, 0x6f, 0x69, 0x66);
    var header = new Uint8Array(10);
    var offset = 0;
    offset = Binary.writeU32BE(header, offset, imageData.width);
    offset = Binary.writeU32BE(header, offset, imageData.height);
    header[offset] = 4;
    header[offset + 1] = settings.colorspace === 'linear' ? 1 : 0;
    for (var h = 0; h < header.length; h += 1) {
      bytes.push(header[h]);
    }

    var prev = { r: 0, g: 0, b: 0, a: 255 };
    var run = 0;
    for (var pixel = 0; pixel < imageData.width * imageData.height; pixel += 1) {
      var px = readPixel(imageData, pixel);
      if (samePixel(px, prev)) {
        run += 1;
        if (run === 62) {
          pushRun(bytes, run);
          run = 0;
        }
        continue;
      }

      pushRun(bytes, run);
      run = 0;
      var hash = Hormi.Importers.Qoi.hash(px);
      if (samePixel(index[hash], px)) {
        bytes.push(hash);
      } else {
        index[hash] = { r: px.r, g: px.g, b: px.b, a: px.a };
        pushPixel(bytes, px, prev);
      }
      prev = px;
    }

    pushRun(bytes, run);
    bytes.push(0, 0, 0, 0, 0, 0, 0, 1);
    return new Uint8Array(bytes);
  }

  Hormi.Encoders.Qoi = {
    encode: encodeQoi
  };
}(globalThis));
