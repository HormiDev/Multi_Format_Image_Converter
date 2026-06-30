(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Devuelve una version opaca de un pixel.
   *
   * @param {{data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {number} offset Posicion del pixel.
   * @param {{r:number,g:number,b:number}} background Fondo RGB.
   * @returns {{r:number,g:number,b:number}} Pixel RGB.
   */
  function rgbPixel(imageData, offset, background) {
    if (imageData.data[offset + 3] === 255) {
      return {
        r: imageData.data[offset],
        g: imageData.data[offset + 1],
        b: imageData.data[offset + 2]
      };
    }
    return Color.flattenPixel(imageData.data, offset, background);
  }

  /**
   * Codifica una imagen como PPM P3/P6.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes PPM.
   */
  function encodePpm(imageData, options) {
    var settings = options || {};
    var ascii = Boolean(settings.ascii);
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var header = (ascii ? 'P3' : 'P6') + '\n' + imageData.width + ' ' + imageData.height + '\n255\n';
    var parts = [Binary.asciiBytes(header)];

    if (ascii) {
      var lines = [];
      for (var i = 0; i < imageData.width * imageData.height; i += 1) {
        var pixel = rgbPixel(imageData, i * 4, background);
        lines.push(pixel.r + ' ' + pixel.g + ' ' + pixel.b);
      }
      parts.push(Binary.asciiBytes(lines.join('\n') + '\n'));
    } else {
      var body = new Uint8Array(imageData.width * imageData.height * 3);
      for (var j = 0; j < imageData.width * imageData.height; j += 1) {
        var source = j * 4;
        var target = j * 3;
        var rgb = rgbPixel(imageData, source, background);
        body[target] = rgb.r;
        body[target + 1] = rgb.g;
        body[target + 2] = rgb.b;
      }
      parts.push(body);
    }

    return Binary.concatBytes(parts);
  }

  /**
   * Codifica una imagen como PGM P2/P5.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes PGM.
   */
  function encodePgm(imageData, options) {
    var settings = options || {};
    var ascii = Boolean(settings.ascii);
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var header = (ascii ? 'P2' : 'P5') + '\n' + imageData.width + ' ' + imageData.height + '\n255\n';
    var parts = [Binary.asciiBytes(header)];

    if (ascii) {
      var values = [];
      for (var i = 0; i < imageData.width * imageData.height; i += 1) {
        var pixel = rgbPixel(imageData, i * 4, background);
        values.push(String(Color.luma(pixel.r, pixel.g, pixel.b)));
      }
      parts.push(Binary.asciiBytes(values.join('\n') + '\n'));
    } else {
      var body = new Uint8Array(imageData.width * imageData.height);
      for (var j = 0; j < imageData.width * imageData.height; j += 1) {
        var rgb = rgbPixel(imageData, j * 4, background);
        body[j] = Color.luma(rgb.r, rgb.g, rgb.b);
      }
      parts.push(body);
    }

    return Binary.concatBytes(parts);
  }

  /**
   * Codifica una imagen como PBM P1/P4.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes PBM.
   */
  function encodePbm(imageData, options) {
    var settings = options || {};
    var ascii = Boolean(settings.ascii);
    var threshold = Number(settings.threshold || 128);
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var header = (ascii ? 'P1' : 'P4') + '\n' + imageData.width + ' ' + imageData.height + '\n';
    var parts = [Binary.asciiBytes(header)];

    if (ascii) {
      var rows = [];
      for (var y = 0; y < imageData.height; y += 1) {
        var values = [];
        for (var x = 0; x < imageData.width; x += 1) {
          var pixel = rgbPixel(imageData, ((y * imageData.width) + x) * 4, background);
          values.push(Color.luma(pixel.r, pixel.g, pixel.b) < threshold ? '1' : '0');
        }
        rows.push(values.join(' '));
      }
      parts.push(Binary.asciiBytes(rows.join('\n') + '\n'));
    } else {
      var rowBytes = Math.ceil(imageData.width / 8);
      var body = new Uint8Array(rowBytes * imageData.height);
      for (var row = 0; row < imageData.height; row += 1) {
        for (var col = 0; col < imageData.width; col += 1) {
          var rgb = rgbPixel(imageData, ((row * imageData.width) + col) * 4, background);
          if (Color.luma(rgb.r, rgb.g, rgb.b) < threshold) {
            body[(row * rowBytes) + Math.floor(col / 8)] |= 0x80 >> (col % 8);
          }
        }
      }
      parts.push(body);
    }

    return Binary.concatBytes(parts);
  }

  Hormi.Encoders.Netpbm = {
    encodePbm: encodePbm,
    encodePgm: encodePgm,
    encodePpm: encodePpm
  };
}(globalThis));
