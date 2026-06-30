(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Elimina la extension de un nombre de archivo.
   *
   * @param {string} name Nombre original.
   * @returns {string} Nombre sin extension.
   */
  function basename(name) {
    return String(name || 'imagen').replace(/\.[^.]+$/, '') || 'imagen';
  }

  /**
   * Limpia un nombre para descarga local.
   *
   * @param {string} name Nombre propuesto.
   * @returns {string} Nombre seguro.
   */
  function safeName(name) {
    return String(name || 'imagen')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'imagen';
  }

  /**
   * Crea el nombre de salida para un raster y formato.
   *
   * @param {object} raster Imagen de origen.
   * @param {object} format Formato elegido.
   * @returns {string} Nombre con extension.
   */
  function outputName(raster, format) {
    return safeName(basename(raster.name)) + '.' + format.extension;
  }

  /**
   * Codifica una imagen individual.
   *
   * @param {object} raster Imagen cargada.
   * @param {string} formatId Formato elegido.
   * @param {object} options Opciones de exportacion.
   * @returns {Promise<object>} Entrada de salida.
   */
  async function convertOne(raster, formatId, options) {
    var format = Hormi.Formats.byId(formatId);
    var blob = await Hormi.Encoders.encode(formatId, raster, options);
    return {
      name: outputName(raster, format),
      blob: blob,
      mime: format.mime,
      size: blob.size
    };
  }

  /**
   * Convierte una lista de imagenes al mismo formato.
   *
   * @param {object[]} rasters Imagenes cargadas.
   * @param {string} formatId Formato elegido.
   * @param {object} options Opciones de exportacion.
   * @param {Function} onProgress Callback de progreso.
   * @returns {Promise<object[]>} Salidas codificadas.
   */
  async function convertMany(rasters, formatId, options, onProgress) {
    var outputs = [];
    for (var i = 0; i < rasters.length; i += 1) {
      if (onProgress) {
        onProgress(i, rasters.length, rasters[i]);
      }
      outputs.push(await convertOne(rasters[i], formatId, options));
    }
    if (onProgress) {
      onProgress(rasters.length, rasters.length, null);
    }
    return outputs;
  }

  /**
   * Descarga un Blob creando un enlace temporal.
   *
   * @param {Blob} blob Datos de descarga.
   * @param {string} name Nombre de archivo.
   * @returns {void}
   */
  function downloadBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * Empaqueta salidas en ZIP.
   *
   * @param {object[]} outputs Salidas codificadas.
   * @returns {Promise<Blob>} Blob ZIP.
   */
  function zipOutputs(outputs) {
    return Hormi.Zip.createZip(outputs.map(function (output) {
      return { name: output.name, data: output.blob };
    }));
  }

  /**
   * Calcula el nombre del ZIP de descarga.
   *
   * @param {object[]} rasters Imagenes convertidas.
   * @param {string} formatId Formato elegido.
   * @returns {string} Nombre de zip.
   */
  function zipName(rasters, formatId) {
    if (rasters.length === 1) {
      return safeName(basename(rasters[0].name)) + '_' + formatId + '.zip';
    }
    return 'hormi_export_' + formatId + '.zip';
  }

  Hormi.Conversion.Converter = {
    basename: basename,
    convertMany: convertMany,
    convertOne: convertOne,
    downloadBlob: downloadBlob,
    safeName: safeName,
    zipName: zipName,
    zipOutputs: zipOutputs
  };
}(globalThis));
