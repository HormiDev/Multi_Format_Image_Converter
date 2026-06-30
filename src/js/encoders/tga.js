(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Codifica una imagen como TGA sin compresion.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen RGBA.
   * @param {object} options Opciones de salida.
   * @returns {Uint8Array} Bytes TGA.
   */
  function encodeTga(imageData, options) {
    var settings = options || {};
    var bitDepth = Number(settings.bitDepth || 32);
    var bytesPerPixel = bitDepth === 32 ? 4 : 3;
    var background = Color.parseHexColor(settings.background || '#ffffff');
    var out = new Uint8Array(18 + (imageData.width * imageData.height * bytesPerPixel));
    var offset = 0;

    out[2] = 2;
    Binary.writeU16LE(out, 12, imageData.width);
    Binary.writeU16LE(out, 14, imageData.height);
    out[16] = bitDepth;
    out[17] = bitDepth === 32 ? 0x28 : 0x20;
    offset = 18;

    for (var y = 0; y < imageData.height; y += 1) {
      for (var x = 0; x < imageData.width; x += 1) {
        var source = ((y * imageData.width) + x) * 4;
        var pixel = bitDepth === 32
          ? {
            r: imageData.data[source],
            g: imageData.data[source + 1],
            b: imageData.data[source + 2],
            a: imageData.data[source + 3]
          }
          : Color.flattenPixel(imageData.data, source, background);
        out[offset] = pixel.b;
        out[offset + 1] = pixel.g;
        out[offset + 2] = pixel.r;
        if (bitDepth === 32) {
          out[offset + 3] = pixel.a;
        }
        offset += bytesPerPixel;
      }
    }

    return out;
  }

  Hormi.Encoders.Tga = {
    encode: encodeTga
  };
}(globalThis));
