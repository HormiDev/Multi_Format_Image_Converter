(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Codifica una imagen RGBA como BMP sin compresion.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes BMP.
   */
  function encodeBmp(imageData, options) {
    var settings = options || {};
    var bitDepth = Number(settings.bitDepth || 24);
    var bytesPerPixel = bitDepth === 32 ? 4 : 3;
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var rowStride = Math.floor(((imageData.width * bitDepth) + 31) / 32) * 4;
    var pixelBytes = rowStride * imageData.height;
    var fileSize = 14 + 40 + pixelBytes;
    var out = new Uint8Array(fileSize);
    var offset = 0;

    out[0] = 0x42;
    out[1] = 0x4d;
    offset = 2;
    offset = Binary.writeU32LE(out, offset, fileSize);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU16LE(out, offset, 0);
    offset = Binary.writeU32LE(out, offset, 54);
    offset = Binary.writeU32LE(out, offset, 40);
    offset = Binary.writeU32LE(out, offset, imageData.width);
    offset = Binary.writeU32LE(out, offset, imageData.height);
    offset = Binary.writeU16LE(out, offset, 1);
    offset = Binary.writeU16LE(out, offset, bitDepth);
    offset = Binary.writeU32LE(out, offset, 0);
    offset = Binary.writeU32LE(out, offset, pixelBytes);
    offset = Binary.writeU32LE(out, offset, 2835);
    offset = Binary.writeU32LE(out, offset, 2835);
    offset = Binary.writeU32LE(out, offset, 0);
    Binary.writeU32LE(out, offset, 0);

    for (var y = 0; y < imageData.height; y += 1) {
      var sourceY = imageData.height - 1 - y;
      var row = 54 + (y * rowStride);
      for (var x = 0; x < imageData.width; x += 1) {
        var source = ((sourceY * imageData.width) + x) * 4;
        var target = row + (x * bytesPerPixel);
        var pixel = bitDepth === 32
          ? {
            r: imageData.data[source],
            g: imageData.data[source + 1],
            b: imageData.data[source + 2],
            a: imageData.data[source + 3]
          }
          : Color.flattenPixel(imageData.data, source, background);
        out[target] = pixel.b;
        out[target + 1] = pixel.g;
        out[target + 2] = pixel.r;
        if (bitDepth === 32) {
          out[target + 3] = pixel.a;
        }
      }
    }

    return out;
  }

  Hormi.Encoders.Bmp = {
    encode: encodeBmp
  };
}(globalThis));
