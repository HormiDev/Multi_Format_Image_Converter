(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  /**
   * Decodifica TGA sin compresion RGB/RGBA o escala de grises.
   *
   * @param {ArrayBuffer|Uint8Array} input Bytes TGA.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeTga(input) {
    var bytes = Binary.toUint8Array(input);
    var idLength = bytes[0];
    var colorMapType = bytes[1];
    var imageType = bytes[2];
    var width = Binary.readU16LE(bytes, 12);
    var height = Binary.readU16LE(bytes, 14);
    var bitDepth = bytes[16];
    var descriptor = bytes[17];

    if (colorMapType !== 0 || (imageType !== 2 && imageType !== 3)) {
      throw new Error('TGA no comprimido RGB/RGBA o gris requerido');
    }
    if (bitDepth !== 8 && bitDepth !== 24 && bitDepth !== 32) {
      throw new Error('Profundidad TGA no soportada');
    }

    var topOrigin = (descriptor & 0x20) !== 0;
    var cursor = 18 + idLength;
    var bytesPerPixel = bitDepth / 8;
    var out = new Uint8ClampedArray(width * height * 4);

    for (var y = 0; y < height; y += 1) {
      var targetY = topOrigin ? y : (height - 1 - y);
      for (var x = 0; x < width; x += 1) {
        var target = ((targetY * width) + x) * 4;
        if (imageType === 3) {
          var gray = bytes[cursor];
          Color.setPixel(out, target, gray, gray, gray, 255);
        } else {
          Color.setPixel(
            out,
            target,
            bytes[cursor + 2],
            bytes[cursor + 1],
            bytes[cursor],
            bitDepth === 32 ? bytes[cursor + 3] : 255
          );
        }
        cursor += bytesPerPixel;
      }
    }

    return { width: width, height: height, data: out };
  }

  Hormi.Importers.Tga = {
    decode: decodeTga
  };
}(globalThis));
