(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;

  /**
   * Obtiene la extension minuscula de un nombre de fichero.
   *
   * @param {string} name Nombre de fichero.
   * @returns {string} Extension sin punto.
   */
  function extensionOf(name) {
    var match = /\.([^.]+)$/.exec(String(name || '').toLowerCase());
    return match ? match[1] : '';
  }

  /**
   * Detecta si un bloque de bytes parece un GIF.
   *
   * @param {Uint8Array} bytes Bytes de entrada.
   * @param {string} name Nombre de archivo.
   * @returns {boolean} Si es GIF.
   */
  function isGif(bytes, name) {
    return extensionOf(name) === 'gif' || Binary.asciiText(bytes.subarray(0, 3)) === 'GIF';
  }

  /**
   * Lee una tabla de color GIF.
   *
   * @param {Uint8Array} bytes Bytes GIF.
   * @param {number} offset Posicion de lectura.
   * @param {number} size Numero de colores.
   * @returns {{colors:object[],offset:number}} Tabla y nueva posicion.
   */
  function readColorTable(bytes, offset, size) {
    var colors = [];
    for (var i = 0; i < size; i += 1) {
      colors.push({
        r: bytes[offset],
        g: bytes[offset + 1],
        b: bytes[offset + 2]
      });
      offset += 3;
    }
    return { colors: colors, offset: offset };
  }

  /**
   * Lee subbloques GIF concatenados.
   *
   * @param {Uint8Array} bytes Bytes GIF.
   * @param {number} offset Posicion de lectura.
   * @returns {{data:Uint8Array,offset:number}} Datos y nueva posicion.
   */
  function readSubBlocks(bytes, offset) {
    var parts = [];
    var total = 0;
    var cursor = offset;
    while (cursor < bytes.length && bytes[cursor] !== 0) {
      var size = bytes[cursor];
      var chunk = bytes.subarray(cursor + 1, cursor + 1 + size);
      parts.push(chunk);
      total += chunk.length;
      cursor += 1 + size;
    }

    var data = new Uint8Array(total);
    var target = 0;
    parts.forEach(function (part) {
      data.set(part, target);
      target += part.length;
    });
    return { data: data, offset: cursor + 1 };
  }

  /**
   * Decodifica pixeles indexados LZW de GIF.
   *
   * @param {Uint8Array} data Datos LZW empaquetados.
   * @param {number} minCodeSize Tamano minimo de codigo.
   * @param {number} expectedPixels Pixeles esperados.
   * @returns {Uint8Array} Pixeles indexados.
   */
  function decodeGifLzw(data, minCodeSize, expectedPixels) {
    var clearCode = 1 << minCodeSize;
    var endCode = clearCode + 1;
    var codeSize = minCodeSize + 1;
    var nextCode = endCode + 1;
    var bitOffset = 0;
    var oldCode = null;
    var dictionary = [];
    var pixels = new Uint8Array(expectedPixels);
    var pixelOffset = 0;

    function resetDictionary() {
      dictionary = [];
      for (var i = 0; i < clearCode; i += 1) {
        dictionary[i] = [i];
      }
      dictionary[clearCode] = null;
      dictionary[endCode] = null;
      codeSize = minCodeSize + 1;
      nextCode = endCode + 1;
      oldCode = null;
    }

    function readCode() {
      var code = 0;
      for (var bit = 0; bit < codeSize; bit += 1) {
        var byte = data[Math.floor(bitOffset / 8)] || 0;
        code |= ((byte >> (bitOffset % 8)) & 1) << bit;
        bitOffset += 1;
      }
      return code;
    }

    resetDictionary();
    while (pixelOffset < expectedPixels && bitOffset < data.length * 8) {
      var code = readCode();
      var entry;
      if (code === clearCode) {
        resetDictionary();
        continue;
      }
      if (code === endCode) {
        break;
      }
      if (dictionary[code]) {
        entry = dictionary[code].slice();
      } else if (code === nextCode && oldCode !== null) {
        entry = dictionary[oldCode].concat(dictionary[oldCode][0]);
      } else {
        throw new Error('GIF LZW invalido');
      }

      for (var pixel = 0; pixel < entry.length && pixelOffset < expectedPixels; pixel += 1) {
        pixels[pixelOffset] = entry[pixel];
        pixelOffset += 1;
      }
      if (oldCode !== null) {
        dictionary[nextCode] = dictionary[oldCode].concat(entry[0]);
        nextCode += 1;
        if (nextCode === (1 << codeSize) && codeSize < 12) {
          codeSize += 1;
        }
      }
      oldCode = code;
    }

    return pixels;
  }

  /**
   * Reordena las filas de un fotograma GIF entrelazado.
   *
   * @param {Uint8Array} pixels Pixeles en orden de flujo.
   * @param {number} width Ancho.
   * @param {number} height Alto.
   * @returns {Uint8Array} Pixeles en orden normal.
   */
  function deinterlaceGif(pixels, width, height) {
    var out = new Uint8Array(pixels.length);
    var passes = [[0, 8], [4, 8], [2, 4], [1, 2]];
    var sourceRow = 0;
    passes.forEach(function (pass) {
      for (var y = pass[0]; y < height; y += pass[1]) {
        out.set(
          pixels.subarray(sourceRow * width, (sourceRow + 1) * width),
          y * width
        );
        sourceRow += 1;
      }
    });
    return out;
  }

  /**
   * Copia una region RGBA de un lienzo plano.
   *
   * @param {Uint8ClampedArray} canvas Pixeles RGBA.
   * @param {number} canvasWidth Ancho del lienzo.
   * @param {number} left X inicial.
   * @param {number} top Y inicial.
   * @param {number} width Ancho de region.
   * @param {number} height Alto de region.
   * @returns {Uint8ClampedArray} Region copiada.
   */
  function copyGifRegion(canvas, canvasWidth, left, top, width, height) {
    var out = new Uint8ClampedArray(width * height * 4);
    for (var y = 0; y < height; y += 1) {
      var source = (((top + y) * canvasWidth) + left) * 4;
      out.set(canvas.subarray(source, source + (width * 4)), y * width * 4);
    }
    return out;
  }

  /**
   * Restaura una region RGBA de un lienzo plano.
   *
   * @param {Uint8ClampedArray} canvas Pixeles RGBA.
   * @param {number} canvasWidth Ancho del lienzo.
   * @param {number} left X inicial.
   * @param {number} top Y inicial.
   * @param {number} width Ancho de region.
   * @param {number} height Alto de region.
   * @param {Uint8ClampedArray} region Region guardada.
   * @returns {void}
   */
  function restoreGifRegion(canvas, canvasWidth, left, top, width, height, region) {
    for (var y = 0; y < height; y += 1) {
      var target = (((top + y) * canvasWidth) + left) * 4;
      canvas.set(region.subarray(y * width * 4, (y + 1) * width * 4), target);
    }
  }

  /**
   * Limpia una region a transparente para el metodo de disposicion GIF.
   *
   * @param {Uint8ClampedArray} canvas Pixeles RGBA.
   * @param {number} canvasWidth Ancho del lienzo.
   * @param {number} left X inicial.
   * @param {number} top Y inicial.
   * @param {number} width Ancho de region.
   * @param {number} height Alto de region.
   * @returns {void}
   */
  function clearGifRegion(canvas, canvasWidth, left, top, width, height) {
    for (var y = 0; y < height; y += 1) {
      canvas.fill(0, (((top + y) * canvasWidth) + left) * 4, (((top + y) * canvasWidth) + left + width) * 4);
    }
  }

  /**
   * Dibuja un fotograma GIF sobre el lienzo acumulado.
   *
   * @param {Uint8ClampedArray} canvas Pixeles RGBA de lienzo completo.
   * @param {number} canvasWidth Ancho del lienzo.
   * @param {object} frame Descriptor de fotograma.
   * @returns {void}
   */
  function drawGifFrame(canvas, canvasWidth, frame) {
    for (var y = 0; y < frame.height; y += 1) {
      for (var x = 0; x < frame.width; x += 1) {
        var index = frame.pixels[(y * frame.width) + x];
        var color = frame.palette[index];
        var target = (((frame.top + y) * canvasWidth) + frame.left + x) * 4;
        if (!color || index === frame.transparentIndex) {
          continue;
        }
        canvas[target] = color.r;
        canvas[target + 1] = color.g;
        canvas[target + 2] = color.b;
        canvas[target + 3] = 255;
      }
    }
  }

  /**
   * Decodifica un GIF en fotogramas RGBA completos.
   *
   * @param {ArrayBuffer|Uint8Array} input Bytes GIF.
   * @returns {object[]} Fotogramas decodificados.
   */
  function decodeGifFrames(input) {
    var bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    var header = Binary.asciiText(bytes.subarray(0, 6));
    if (header !== 'GIF87a' && header !== 'GIF89a') {
      return [];
    }

    var width = Binary.readU16LE(bytes, 6);
    var height = Binary.readU16LE(bytes, 8);
    var packed = bytes[10];
    var offset = 13;
    var globalTable = null;
    var canvas = new Uint8ClampedArray(width * height * 4);
    var frames = [];
    var gce = { disposal: 0, delayCs: 0, transparentIndex: null };

    if (packed & 0x80) {
      var global = readColorTable(bytes, offset, 1 << ((packed & 0x07) + 1));
      globalTable = global.colors;
      offset = global.offset;
    }

    while (offset < bytes.length) {
      var marker = bytes[offset];
      offset += 1;
      if (marker === 0x3b) {
        break;
      }
      if (marker === 0x21) {
        var label = bytes[offset];
        offset += 1;
        if (label === 0xf9) {
          offset += 1;
          var controlPacked = bytes[offset];
          var delayCs = Binary.readU16LE(bytes, offset + 1);
          var transparentIndex = bytes[offset + 3];
          offset += 5;
          gce = {
            disposal: (controlPacked >> 2) & 0x07,
            delayCs: delayCs,
            transparentIndex: controlPacked & 1 ? transparentIndex : null
          };
        } else {
          offset = readSubBlocks(bytes, offset).offset;
        }
        continue;
      }
      if (marker !== 0x2c) {
        throw new Error('Bloque GIF no soportado');
      }

      var left = Binary.readU16LE(bytes, offset);
      var top = Binary.readU16LE(bytes, offset + 2);
      var frameWidth = Binary.readU16LE(bytes, offset + 4);
      var frameHeight = Binary.readU16LE(bytes, offset + 6);
      var framePacked = bytes[offset + 8];
      var localTable = null;
      var interlaced = Boolean(framePacked & 0x40);
      var restore = gce.disposal === 3
        ? copyGifRegion(canvas, width, left, top, frameWidth, frameHeight)
        : null;
      offset += 9;

      if (framePacked & 0x80) {
        var local = readColorTable(bytes, offset, 1 << ((framePacked & 0x07) + 1));
        localTable = local.colors;
        offset = local.offset;
      }

      var minCodeSize = bytes[offset];
      offset += 1;
      var blocks = readSubBlocks(bytes, offset);
      var pixels = decodeGifLzw(blocks.data, minCodeSize, frameWidth * frameHeight);
      offset = blocks.offset;
      if (interlaced) {
        pixels = deinterlaceGif(pixels, frameWidth, frameHeight);
      }

      drawGifFrame(canvas, width, {
        left: left,
        top: top,
        width: frameWidth,
        height: frameHeight,
        palette: localTable || globalTable || [],
        pixels: pixels,
        transparentIndex: gce.transparentIndex
      });
      frames.push({
        width: width,
        height: height,
        delayCs: gce.delayCs,
        data: new Uint8ClampedArray(canvas)
      });

      if (gce.disposal === 2) {
        clearGifRegion(canvas, width, left, top, frameWidth, frameHeight);
      } else if (gce.disposal === 3 && restore) {
        restoreGifRegion(canvas, width, left, top, frameWidth, frameHeight, restore);
      }
      gce = { disposal: 0, delayCs: 0, transparentIndex: null };
    }

    return frames;
  }

  /**
   * Crea un ImageData del navegador desde un objeto RGBA plano.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} decoded Imagen decodificada.
   * @returns {ImageData} ImageData del navegador.
   */
  function browserImageData(decoded) {
    return new ImageData(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
  }

  /**
   * Dibuja ImageData en un canvas nuevo.
   *
   * @param {ImageData|object} imageData Datos RGBA.
   * @returns {HTMLCanvasElement} Canvas creado.
   */
  function canvasFromImageData(imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(
      typeof ImageData !== 'undefined' && imageData instanceof ImageData
        ? imageData
        : browserImageData(imageData),
      0,
      0
    );
    return canvas;
  }

  /**
   * Decodifica formatos custom que no suelen estar en canvas.
   *
   * @param {ArrayBuffer} buffer Bytes del archivo.
   * @param {string} name Nombre de archivo.
   * @returns {object|null} Imagen decodificada o null.
   */
  function decodeCustom(buffer, name) {
    var ext = extensionOf(name);
    var bytes = new Uint8Array(buffer);
    if (ext === 'ppm' || ext === 'pgm' || ext === 'pbm' || /^P[1-6]$/.test(Binary.asciiText(bytes.subarray(0, 2)))) {
      return Hormi.Importers.Netpbm.decode(bytes);
    }
    if (ext === 'xpm') {
      return Hormi.Importers.Xpm.decode(bytes);
    }
    if (ext === 'bmp' && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return Hormi.Importers.Bmp.decode(bytes);
    }
    if (ext === 'qoi' || Binary.asciiText(bytes.subarray(0, 4)) === 'qoif') {
      return Hormi.Importers.Qoi.decode(bytes);
    }
    if (ext === 'tga') {
      return Hormi.Importers.Tga.decode(bytes);
    }
    return null;
  }

  /**
   * Decodifica con createImageBitmap cuando esta disponible.
   *
   * @param {File} file Archivo de imagen.
   * @returns {Promise<HTMLCanvasElement>} Canvas cargado.
   */
  async function decodeWithImageBitmap(file) {
    var bitmap = await createImageBitmap(file);
    var canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
  }

  /**
   * Decodifica con HTMLImageElement como alternativa compatible.
   *
   * @param {File} file Archivo de imagen.
   * @returns {Promise<HTMLCanvasElement>} Canvas cargado.
   */
  function decodeWithImageElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('El navegador no pudo importar ' + file.name));
      };
      image.src = url;
    });
  }

  /**
   * Carga formatos soportados por el navegador.
   *
   * @param {File} file Archivo de imagen.
   * @returns {Promise<HTMLCanvasElement>} Canvas cargado.
   */
  async function decodeWithBrowser(file) {
    if ('createImageBitmap' in global) {
      try {
        return await decodeWithImageBitmap(file);
      } catch (_error) {
        return decodeWithImageElement(file);
      }
    }
    return decodeWithImageElement(file);
  }

  /**
   * Construye el objeto raster usado por la aplicacion.
   *
   * @param {string} name Nombre original.
   * @param {HTMLCanvasElement} canvas Canvas con la imagen.
   * @param {string} source Formato de origen detectado.
   * @returns {object} Raster preparado.
   */
  function rasterFromCanvas(name, canvas, source) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var id = global.crypto && typeof global.crypto.randomUUID === 'function'
      ? global.crypto.randomUUID()
      : String(Date.now() + Math.random());
    return {
      id: id,
      name: name,
      source: source,
      width: canvas.width,
      height: canvas.height,
      canvas: canvas,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      previewUrl: canvas.toDataURL('image/png')
    };
  }

  /**
   * Genera el nombre de un fotograma importado desde GIF.
   *
   * @param {string} name Nombre original.
   * @param {number} index Indice de fotograma.
   * @param {number} total Total de fotogramas.
   * @returns {string} Nombre del fotograma.
   */
  function frameName(name, index, total) {
    if (total <= 1) {
      return name;
    }
    var text = String(index + 1);
    var padded = ('000' + text).slice(-Math.max(3, text.length));
    return String(name || 'image.gif').replace(/(\.[^.]+)?$/, '_frame_' + padded + '$1');
  }

  /**
   * Carga un archivo como uno o varios rasters editables.
   *
   * @param {File} file Archivo arrastrado o seleccionado.
   * @returns {Promise<object[]>} Rasters cargados.
   */
  async function loadFileRasters(file) {
    var buffer = await file.arrayBuffer();
    var bytes = new Uint8Array(buffer);
    if (isGif(bytes, file.name)) {
      try {
        var frames = decodeGifFrames(bytes);
        if (frames.length) {
          return frames.map(function (frame, index) {
            return rasterFromCanvas(
              frameName(file.name, index, frames.length),
              canvasFromImageData(frame),
              'gif'
            );
          });
        }
      } catch (_error) {
        // Si aparece un GIF fuera del subconjunto soportado, se deja al navegador.
      }
    }

    var custom = decodeCustom(buffer, file.name);
    if (custom) {
      return [rasterFromCanvas(file.name, canvasFromImageData(custom), extensionOf(file.name) || 'custom')];
    }

    var canvas = await decodeWithBrowser(file);
    return [rasterFromCanvas(file.name, canvas, extensionOf(file.name) || file.type || 'browser')];
  }

  /**
   * Carga un archivo como raster editable.
   *
   * @param {File} file Archivo arrastrado o seleccionado.
   * @returns {Promise<object>} Raster cargado.
   */
  async function loadFile(file) {
    return (await loadFileRasters(file))[0];
  }

  Hormi.Conversion.FileLoader = {
    decodeGifFrames: decodeGifFrames,
    decodeCustom: decodeCustom,
    extensionOf: extensionOf,
    loadFile: loadFile,
    loadFileRasters: loadFileRasters,
    rasterFromCanvas: rasterFromCanvas
  };
}(globalThis));
