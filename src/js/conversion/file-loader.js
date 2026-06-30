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
    ctx.putImageData(imageData instanceof ImageData ? imageData : browserImageData(imageData), 0, 0);
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
   * Carga un archivo como raster editable.
   *
   * @param {File} file Archivo arrastrado o seleccionado.
   * @returns {Promise<object>} Raster cargado.
   */
  async function loadFile(file) {
    var buffer = await file.arrayBuffer();
    var custom = decodeCustom(buffer, file.name);
    if (custom) {
      return rasterFromCanvas(file.name, canvasFromImageData(custom), extensionOf(file.name) || 'custom');
    }

    var canvas = await decodeWithBrowser(file);
    return rasterFromCanvas(file.name, canvas, extensionOf(file.name) || file.type || 'browser');
  }

  Hormi.Conversion.FileLoader = {
    decodeCustom: decodeCustom,
    extensionOf: extensionOf,
    loadFile: loadFile,
    rasterFromCanvas: rasterFromCanvas
  };
}(globalThis));
