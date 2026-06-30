(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Crea una opcion de calidad comun para formatos con perdida.
   *
   * @param {number} value Valor inicial.
   * @returns {object} Definicion de opcion.
   */
  function qualityOption(value) {
    return {
      id: 'quality',
      labelKey: 'option.quality',
      type: 'range',
      min: 0.1,
      max: 1,
      step: 0.05,
      default: value
    };
  }

  /**
   * Crea una opcion de color de fondo para aplanar alfa.
   *
   * @param {object} dependsOn Dependencia opcional de visibilidad.
   * @returns {object} Definicion de opcion.
   */
  function backgroundOption(dependsOn) {
    var option = {
      id: 'background',
      labelKey: 'option.background',
      type: 'color',
      default: '#ffffff'
    };
    if (dependsOn) {
      option.dependsOn = dependsOn;
    }
    return option;
  }

  /**
   * Crea una opcion para aplanar el canal alfa.
   *
   * @param {boolean} value Valor inicial.
   * @returns {object} Definicion de opcion.
   */
  function flattenAlphaOption(value) {
    return {
      id: 'flattenAlpha',
      labelKey: 'option.flattenAlpha',
      type: 'checkbox',
      default: Boolean(value)
    };
  }

  /**
   * Crea las opciones comunes de resolucion de exportacion.
   *
   * @returns {object[]} Definiciones de opciones.
   */
  function resolutionOptions() {
    var whenUnlocked = { id: 'keepResolution', value: false };
    return [
      {
        id: 'keepResolution',
        labelKey: 'option.keepResolution',
        type: 'checkbox',
        default: true
      },
      {
        id: 'resizeMode',
        labelKey: 'option.resizeMode',
        type: 'select',
        default: 'exact',
        dependsOn: whenUnlocked,
        choices: [
          { value: 'exact', labelKey: 'choice.exact' },
          { value: 'width', labelKey: 'choice.width' },
          { value: 'height', labelKey: 'choice.height' },
          { value: 'percent', labelKey: 'choice.percent' }
        ]
      },
      {
        id: 'resizeWidth',
        labelKey: 'option.resizeWidth',
        type: 'number',
        min: 1,
        max: 8192,
        step: 1,
        default: 1024,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizeHeight',
        labelKey: 'option.resizeHeight',
        type: 'number',
        min: 1,
        max: 8192,
        step: 1,
        default: 1024,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizePercent',
        labelKey: 'option.resizePercent',
        type: 'number',
        min: 1,
        max: 800,
        step: 1,
        default: 100,
        dependsOn: whenUnlocked
      },
      {
        id: 'resizeFilter',
        labelKey: 'option.resizeFilter',
        type: 'select',
        default: 'smooth',
        dependsOn: whenUnlocked,
        choices: [
          { value: 'smooth', labelKey: 'choice.smooth' },
          { value: 'nearest', labelKey: 'choice.nearest' }
        ]
      }
    ];
  }

  /**
   * Anteponer las opciones comunes a las opciones de formato.
   *
   * @param {object[]} options Opciones especificas.
   * @returns {object[]} Opciones completas.
   */
  function exportOptions(options) {
    return resolutionOptions().concat(options || []);
  }

  /**
   * Crea una opcion de tabla de colores.
   *
   * @param {number} value Valor inicial.
   * @param {number} max Valor maximo.
   * @returns {object} Definicion de opcion.
   */
  function colorsOption(value, max) {
    return {
      id: 'colors',
      labelKey: 'option.paletteColors',
      type: 'range',
      min: 2,
      max: max || 256,
      step: 1,
      default: value
    };
  }

  /**
   * Crea una opcion para activar transparencia indexada.
   *
   * @returns {object} Definicion de opcion.
   */
  function transparencyOption() {
    return {
      id: 'transparency',
      labelKey: 'option.transparency',
      type: 'checkbox',
      default: true
    };
  }

  /**
   * Crea una opcion de umbral de alfa.
   *
   * @returns {object} Definicion de opcion.
   */
  function alphaThresholdOption() {
    return {
      id: 'alphaThreshold',
      labelKey: 'option.alphaThreshold',
      type: 'range',
      min: 0,
      max: 255,
      step: 1,
      default: 8
    };
  }

  var formats = [
    {
      id: 'png',
      name: 'PNG',
      extension: 'png',
      mime: 'image/png',
      encoder: 'native',
      descriptionKey: 'format.png.description',
      options: exportOptions([flattenAlphaOption(false), backgroundOption({ id: 'flattenAlpha', value: true })])
    },
    {
      id: 'jpeg',
      name: 'JPEG',
      extension: 'jpg',
      mime: 'image/jpeg',
      encoder: 'native',
      descriptionKey: 'format.jpeg.description',
      options: exportOptions([qualityOption(0.92), backgroundOption()])
    },
    {
      id: 'webp',
      name: 'WebP',
      extension: 'webp',
      mime: 'image/webp',
      encoder: 'native',
      descriptionKey: 'format.webp.description',
      options: exportOptions([qualityOption(0.9), flattenAlphaOption(false), backgroundOption({ id: 'flattenAlpha', value: true })])
    },
    {
      id: 'avif',
      name: 'AVIF',
      extension: 'avif',
      mime: 'image/avif',
      encoder: 'native',
      descriptionKey: 'format.avif.description',
      options: exportOptions([qualityOption(0.8), flattenAlphaOption(false), backgroundOption({ id: 'flattenAlpha', value: true })])
    },
    {
      id: 'gif',
      name: 'GIF',
      extension: 'gif',
      mime: 'image/gif',
      encoder: 'gif',
      descriptionKey: 'format.gif.description',
      options: exportOptions([
        colorsOption(128, 256),
        transparencyOption(),
        alphaThresholdOption(),
        {
          id: 'gifMode',
          labelKey: 'option.multiImageOutput',
          type: 'select',
          default: 'animation',
          choices: [
            { value: 'animation', labelKey: 'choice.gifAnimation' },
            { value: 'individual', labelKey: 'choice.gifIndividual' }
          ]
        },
        {
          id: 'fps',
          label: 'FPS',
          type: 'range',
          min: 1,
          max: 60,
          step: 1,
          default: 10
        },
        {
          id: 'loop',
          labelKey: 'option.loop',
          type: 'select',
          default: '0',
          choices: [
            { value: '0', labelKey: 'choice.infinite' },
            { value: '1', labelKey: 'choice.once' },
            { value: '3', labelKey: 'choice.3Repeats' },
            { value: '5', labelKey: 'choice.5Repeats' },
            { value: '10', labelKey: 'choice.10Repeats' }
          ]
        },
        {
          id: 'canvasMode',
          labelKey: 'option.canvasMode',
          type: 'select',
          default: 'largest',
          choices: [
            { value: 'largest', labelKey: 'choice.largest' },
            { value: 'first', labelKey: 'choice.first' },
            { value: 'custom', labelKey: 'choice.custom' }
          ]
        },
        {
          id: 'frameWidth',
          labelKey: 'option.frameWidth',
          type: 'range',
          min: 16,
          max: 4096,
          step: 1,
          default: 512
        },
        {
          id: 'frameHeight',
          labelKey: 'option.frameHeight',
          type: 'range',
          min: 16,
          max: 4096,
          step: 1,
          default: 512
        },
        {
          id: 'fitMode',
          labelKey: 'option.fitMode',
          type: 'select',
          default: 'contain',
          choices: [
            { value: 'contain', labelKey: 'choice.contain' },
            { value: 'cover', labelKey: 'choice.cover' },
            { value: 'stretch', labelKey: 'choice.stretch' },
            { value: 'center', labelKey: 'choice.center' }
          ]
        },
        backgroundOption({ id: 'transparency', value: false })
      ])
    },
    {
      id: 'bmp',
      name: 'BMP',
      extension: 'bmp',
      mime: 'image/bmp',
      encoder: 'bmp',
      descriptionKey: 'format.bmp.description',
      options: exportOptions([
        {
          id: 'bitDepth',
          labelKey: 'option.bitDepth',
          type: 'select',
          default: '24',
          choices: [
            { value: '24', labelKey: 'choice.24Rgb' },
            { value: '32', labelKey: 'choice.32Rgba' }
          ]
        },
        backgroundOption({ id: 'bitDepth', value: '24' })
      ])
    },
    {
      id: 'ico',
      name: 'ICO',
      extension: 'ico',
      mime: 'image/x-icon',
      encoder: 'ico',
      descriptionKey: 'format.ico.description',
      options: exportOptions([
        {
          id: 'size',
          labelKey: 'option.icoSize',
          type: 'select',
          default: 'source',
          choices: [{ value: 'source', labelKey: 'choice.currentResolution' }].concat(['16', '24', '32', '48', '64', '128', '256'].map(function (size) {
            return { value: size, label: size + ' x ' + size };
          }))
        }
      ])
    },
    {
      id: 'tiff',
      name: 'TIFF',
      extension: 'tiff',
      mime: 'image/tiff',
      encoder: 'tiff',
      descriptionKey: 'format.tiff.description',
      options: exportOptions([
        {
          id: 'alphaMode',
          labelKey: 'option.alpha',
          type: 'select',
          default: 'flatten',
          choices: [
            { value: 'flatten', labelKey: 'choice.flattenBackground' },
            { value: 'preserve', labelKey: 'choice.preserveAlpha' }
          ]
        },
        {
          id: 'dpi',
          label: 'DPI',
          type: 'number',
          min: 1,
          max: 2400,
          step: 1,
          default: 72
        },
        backgroundOption({ id: 'alphaMode', value: 'flatten' })
      ])
    },
    {
      id: 'tga',
      name: 'TGA',
      extension: 'tga',
      mime: 'image/x-tga',
      encoder: 'tga',
      descriptionKey: 'format.tga.description',
      options: exportOptions([
        {
          id: 'bitDepth',
          labelKey: 'option.bitDepth',
          type: 'select',
          default: '32',
          choices: [
            { value: '24', labelKey: 'choice.24Rgb' },
            { value: '32', labelKey: 'choice.32Rgba' }
          ]
        },
        {
          id: 'origin',
          labelKey: 'option.origin',
          type: 'select',
          default: 'top',
          choices: [
            { value: 'top', labelKey: 'choice.topLeft' },
            { value: 'bottom', labelKey: 'choice.bottomLeft' }
          ]
        },
        backgroundOption({ id: 'bitDepth', value: '24' })
      ])
    },
    {
      id: 'qoi',
      name: 'QOI',
      extension: 'qoi',
      mime: 'image/qoi',
      encoder: 'qoi',
      descriptionKey: 'format.qoi.description',
      options: exportOptions([
        {
          id: 'colorspace',
          labelKey: 'option.colorspace',
          type: 'select',
          default: 'srgb',
          choices: [
            { value: 'srgb', labelKey: 'choice.srgbAlpha' },
            { value: 'linear', labelKey: 'choice.linear' }
          ]
        }
      ])
    },
    {
      id: 'ppm',
      name: 'PPM',
      extension: 'ppm',
      mime: 'image/x-portable-pixmap',
      encoder: 'ppm',
      descriptionKey: 'format.ppm.description',
      options: exportOptions([
        { id: 'ascii', labelKey: 'option.asciiP3', type: 'checkbox', default: false },
        backgroundOption()
      ])
    },
    {
      id: 'pgm',
      name: 'PGM',
      extension: 'pgm',
      mime: 'image/x-portable-graymap',
      encoder: 'pgm',
      descriptionKey: 'format.pgm.description',
      options: exportOptions([
        { id: 'ascii', labelKey: 'option.asciiP2', type: 'checkbox', default: false },
        backgroundOption()
      ])
    },
    {
      id: 'pbm',
      name: 'PBM',
      extension: 'pbm',
      mime: 'image/x-portable-bitmap',
      encoder: 'pbm',
      descriptionKey: 'format.pbm.description',
      options: exportOptions([
        { id: 'ascii', labelKey: 'option.asciiP1', type: 'checkbox', default: false },
        {
          id: 'threshold',
          labelKey: 'option.threshold',
          type: 'range',
          min: 0,
          max: 255,
          step: 1,
          default: 128
        },
        backgroundOption()
      ])
    },
    {
      id: 'xpm',
      name: 'XPM',
      extension: 'xpm',
      mime: 'image/x-xpixmap',
      encoder: 'xpm',
      descriptionKey: 'format.xpm.description',
      options: exportOptions([
        colorsOption(32, 256),
        transparencyOption(),
        alphaThresholdOption(),
        {
          id: 'variableName',
          labelKey: 'option.variableName',
          type: 'text',
          default: 'hormi_image'
        }
      ])
    },
    {
      id: 'svg',
      name: 'SVG raster',
      extension: 'svg',
      mime: 'image/svg+xml',
      encoder: 'svg',
      descriptionKey: 'format.svg.description',
      options: exportOptions([
        {
          id: 'title',
          labelKey: 'option.title',
          type: 'text',
          default: ''
        },
        flattenAlphaOption(false),
        backgroundOption({ id: 'flattenAlpha', value: true })
      ])
    }
  ];

  /**
   * Busca un formato por identificador.
   *
   * @param {string} id Identificador de formato.
   * @returns {object|undefined} Definicion encontrada.
   */
  function byId(id) {
    return formats.find(function (format) {
      return format.id === id;
    });
  }

  /**
   * Lista todos los formatos exportables.
   *
   * @returns {object[]} Formatos disponibles.
   */
  function all() {
    return formats.slice();
  }

  Hormi.Formats = {
    all: all,
    byId: byId
  };
}(globalThis));
