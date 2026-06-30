(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Color = Hormi.Core.Color;

  /**
   * Convierte un canvas a Blob con promesa.
   *
   * @param {HTMLCanvasElement} canvas Canvas de origen.
   * @param {string} mime Tipo MIME de salida.
   * @param {number|undefined} quality Calidad opcional.
   * @returns {Promise<Blob>} Blob codificado.
   */
  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('El navegador no pudo exportar ' + mime));
          return;
        }
        resolve(blob);
      }, mime, quality);
    });
  }

  /**
   * Crea un canvas opaco mezclando la imagen contra un fondo.
   *
   * @param {object} raster Imagen cargada.
   * @param {string} background Color hexadecimal de fondo.
   * @returns {HTMLCanvasElement} Canvas opaco.
   */
  function opaqueCanvas(raster, background) {
    var canvas = document.createElement('canvas');
    canvas.width = raster.width;
    canvas.height = raster.height;
    var ctx = canvas.getContext('2d');
    var color = Color.parseHexColor(background, { r: 255, g: 255, b: 255 });
    ctx.fillStyle = Color.rgbToHex(color.r, color.g, color.b);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(raster.canvas, 0, 0);
    return canvas;
  }

  /**
   * Codifica una imagen con los formatos nativos del navegador.
   *
   * @param {object} raster Imagen cargada.
   * @param {object} options Opciones de exportacion.
   * @returns {Promise<Blob>} Blob codificado.
   */
  async function encodeNative(raster, options) {
    var settings = options || {};
    var mime = settings.mime;
    var quality = Number(settings.quality);
    var shouldFlatten = settings.flattenAlpha || mime === 'image/jpeg';
    var sourceCanvas = shouldFlatten ? opaqueCanvas(raster, settings.background || '#ffffff') : raster.canvas;
    return canvasToBlob(sourceCanvas, mime, Number.isFinite(quality) ? quality : undefined);
  }

  Hormi.Encoders.Native = {
    canvasToBlob: canvasToBlob,
    encode: encodeNative,
    opaqueCanvas: opaqueCanvas
  };
}(globalThis));
