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
      label: 'Calidad',
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
   * @returns {object} Definicion de opcion.
   */
  function backgroundOption() {
    return {
      id: 'background',
      label: 'Fondo para alfa',
      type: 'color',
      default: '#ffffff'
    };
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
      label: 'Colores de paleta',
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
      label: 'Transparencia',
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
      label: 'Umbral alfa',
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
      description: 'Sin perdida, alfa completo, ideal para capturas e interfaz.',
      options: []
    },
    {
      id: 'jpeg',
      name: 'JPEG',
      extension: 'jpg',
      mime: 'image/jpeg',
      encoder: 'native',
      description: 'Con perdida, sin transparencia, recomendado para fotografia.',
      options: [qualityOption(0.92), backgroundOption()]
    },
    {
      id: 'webp',
      name: 'WebP',
      extension: 'webp',
      mime: 'image/webp',
      encoder: 'native',
      description: 'Formato moderno con alfa y compresion eficiente.',
      options: [qualityOption(0.9)]
    },
    {
      id: 'avif',
      name: 'AVIF',
      extension: 'avif',
      mime: 'image/avif',
      encoder: 'native',
      description: 'Formato moderno con perdida; depende del navegador.',
      options: [qualityOption(0.8)]
    },
    {
      id: 'gif',
      name: 'GIF',
      extension: 'gif',
      mime: 'image/gif',
      encoder: 'gif',
      description: 'GIF89a estatico con paleta indexada.',
      options: [colorsOption(128, 256), transparencyOption(), alphaThresholdOption()]
    },
    {
      id: 'bmp',
      name: 'BMP',
      extension: 'bmp',
      mime: 'image/bmp',
      encoder: 'bmp',
      description: 'Mapa de bits Windows sin compresion.',
      options: [
        {
          id: 'bitDepth',
          label: 'Profundidad',
          type: 'select',
          default: '24',
          choices: [
            { value: '24', label: '24 bits RGB' },
            { value: '32', label: '32 bits RGBA' }
          ]
        },
        backgroundOption()
      ]
    },
    {
      id: 'ico',
      name: 'ICO',
      extension: 'ico',
      mime: 'image/x-icon',
      encoder: 'ico',
      description: 'Icono Windows de una resolucion.',
      options: [
        {
          id: 'size',
          label: 'Tamano',
          type: 'select',
          default: '64',
          choices: ['16', '24', '32', '48', '64', '128', '256'].map(function (size) {
            return { value: size, label: size + ' x ' + size };
          })
        }
      ]
    },
    {
      id: 'tiff',
      name: 'TIFF',
      extension: 'tiff',
      mime: 'image/tiff',
      encoder: 'tiff',
      description: 'TIFF baseline sin compresion.',
      options: [
        {
          id: 'alphaMode',
          label: 'Alfa',
          type: 'select',
          default: 'flatten',
          choices: [
            { value: 'flatten', label: 'Aplanar contra fondo' },
            { value: 'preserve', label: 'Guardar canal alfa' }
          ]
        },
        backgroundOption()
      ]
    },
    {
      id: 'tga',
      name: 'TGA',
      extension: 'tga',
      mime: 'image/x-tga',
      encoder: 'tga',
      description: 'Targa sin compresion, util en pipelines graficos.',
      options: [
        {
          id: 'bitDepth',
          label: 'Profundidad',
          type: 'select',
          default: '32',
          choices: [
            { value: '24', label: '24 bits RGB' },
            { value: '32', label: '32 bits RGBA' }
          ]
        },
        backgroundOption()
      ]
    },
    {
      id: 'qoi',
      name: 'QOI',
      extension: 'qoi',
      mime: 'image/qoi',
      encoder: 'qoi',
      description: 'Quite OK Image, sin perdida y muy simple.',
      options: [
        {
          id: 'colorspace',
          label: 'Espacio de color',
          type: 'select',
          default: 'srgb',
          choices: [
            { value: 'srgb', label: 'sRGB con alfa lineal' },
            { value: 'linear', label: 'Lineal' }
          ]
        }
      ]
    },
    {
      id: 'ppm',
      name: 'PPM',
      extension: 'ppm',
      mime: 'image/x-portable-pixmap',
      encoder: 'ppm',
      description: 'Portable Pixmap RGB.',
      options: [
        { id: 'ascii', label: 'ASCII P3', type: 'checkbox', default: false },
        backgroundOption()
      ]
    },
    {
      id: 'pgm',
      name: 'PGM',
      extension: 'pgm',
      mime: 'image/x-portable-graymap',
      encoder: 'pgm',
      description: 'Portable Graymap en escala de grises.',
      options: [
        { id: 'ascii', label: 'ASCII P2', type: 'checkbox', default: false },
        backgroundOption()
      ]
    },
    {
      id: 'pbm',
      name: 'PBM',
      extension: 'pbm',
      mime: 'image/x-portable-bitmap',
      encoder: 'pbm',
      description: 'Portable Bitmap monocromo.',
      options: [
        { id: 'ascii', label: 'ASCII P1', type: 'checkbox', default: false },
        {
          id: 'threshold',
          label: 'Umbral blanco/negro',
          type: 'range',
          min: 0,
          max: 255,
          step: 1,
          default: 128
        },
        backgroundOption()
      ]
    },
    {
      id: 'xpm',
      name: 'XPM',
      extension: 'xpm',
      mime: 'image/x-xpixmap',
      encoder: 'xpm',
      description: 'Pixmap textual C-style con paleta.',
      options: [colorsOption(32, 256), transparencyOption(), alphaThresholdOption()]
    },
    {
      id: 'svg',
      name: 'SVG raster',
      extension: 'svg',
      mime: 'image/svg+xml',
      encoder: 'svg',
      description: 'SVG con la imagen PNG embebida en base64.',
      options: [
        {
          id: 'title',
          label: 'Titulo',
          type: 'text',
          default: ''
        }
      ]
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
