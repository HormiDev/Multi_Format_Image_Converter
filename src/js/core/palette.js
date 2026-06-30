(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Color = Hormi.Core.Color;

  /**
   * Devuelve el canal con mayor rango dentro de una caja de colores.
   *
   * @param {{colors:object[]}} box Caja de colores.
   * @returns {string} Canal dominante.
   */
  function largestChannel(box) {
    var min = { r: 255, g: 255, b: 255 };
    var max = { r: 0, g: 0, b: 0 };
    for (var i = 0; i < box.colors.length; i += 1) {
      var color = box.colors[i];
      min.r = Math.min(min.r, color.r);
      min.g = Math.min(min.g, color.g);
      min.b = Math.min(min.b, color.b);
      max.r = Math.max(max.r, color.r);
      max.g = Math.max(max.g, color.g);
      max.b = Math.max(max.b, color.b);
    }

    var ranges = {
      r: max.r - min.r,
      g: max.g - min.g,
      b: max.b - min.b
    };
    if (ranges.r >= ranges.g && ranges.r >= ranges.b) {
      return 'r';
    }
    if (ranges.g >= ranges.r && ranges.g >= ranges.b) {
      return 'g';
    }
    return 'b';
  }

  /**
   * Cuenta los colores de una imagen con muestreo adaptativo.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {number} alphaThreshold Umbral de transparencia.
   * @returns {object[]} Lista de colores con contador.
   */
  function collectColors(imageData, alphaThreshold) {
    var totalPixels = imageData.width * imageData.height;
    var stride = Math.max(1, Math.floor(totalPixels / 90000));
    var map = new Map();

    for (var pixel = 0; pixel < totalPixels; pixel += stride) {
      var offset = pixel * 4;
      if (imageData.data[offset + 3] < alphaThreshold) {
        continue;
      }
      var key = imageData.data[offset] + ',' + imageData.data[offset + 1] + ',' + imageData.data[offset + 2];
      var existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          r: imageData.data[offset],
          g: imageData.data[offset + 1],
          b: imageData.data[offset + 2],
          count: 1
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Divide una caja de colores usando la mediana ponderada.
   *
   * @param {{colors:object[],weight:number}} box Caja de entrada.
   * @returns {object[]} Dos cajas nuevas.
   */
  function splitBox(box) {
    if (box.colors.length <= 1) {
      return [box];
    }

    var channel = largestChannel(box);
    var sorted = box.colors.slice().sort(function (a, b) {
      return a[channel] - b[channel];
    });
    var half = box.weight / 2;
    var cursor = 0;
    var splitAt = 1;

    for (var i = 0; i < sorted.length; i += 1) {
      cursor += sorted[i].count;
      if (cursor >= half) {
        splitAt = Math.max(1, Math.min(sorted.length - 1, i + 1));
        break;
      }
    }

    return [
      makeBox(sorted.slice(0, splitAt)),
      makeBox(sorted.slice(splitAt))
    ];
  }

  /**
   * Crea una caja de colores con peso acumulado.
   *
   * @param {object[]} colors Colores de la caja.
   * @returns {{colors:object[],weight:number}} Caja preparada.
   */
  function makeBox(colors) {
    var weight = 0;
    for (var i = 0; i < colors.length; i += 1) {
      weight += colors[i].count;
    }
    return { colors: colors, weight: weight };
  }

  /**
   * Calcula el color promedio ponderado de una caja.
   *
   * @param {{colors:object[],weight:number}} box Caja de colores.
   * @returns {{r:number,g:number,b:number}} Color medio.
   */
  function averageBoxColor(box) {
    if (!box.colors.length || box.weight === 0) {
      return { r: 0, g: 0, b: 0 };
    }

    var r = 0;
    var g = 0;
    var b = 0;
    for (var i = 0; i < box.colors.length; i += 1) {
      var color = box.colors[i];
      r += color.r * color.count;
      g += color.g * color.count;
      b += color.b * color.count;
    }
    return {
      r: Color.clampByte(r / box.weight),
      g: Color.clampByte(g / box.weight),
      b: Color.clampByte(b / box.weight)
    };
  }

  /**
   * Reduce una imagen a una paleta por corte mediano.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {number} maxColors Numero maximo de colores.
   * @param {number} alphaThreshold Umbral de alfa ignorado.
   * @returns {object[]} Paleta RGB.
   */
  function quantize(imageData, maxColors, alphaThreshold) {
    var colors = collectColors(imageData, alphaThreshold || 1);
    if (!colors.length) {
      return [{ r: 0, g: 0, b: 0 }];
    }

    var boxes = [makeBox(colors)];
    while (boxes.length < maxColors) {
      boxes.sort(function (a, b) {
        return b.weight - a.weight;
      });
      var next = boxes.shift();
      if (!next || next.colors.length <= 1) {
        if (next) {
          boxes.push(next);
        }
        break;
      }
      boxes = boxes.concat(splitBox(next));
    }

    return boxes.map(averageBoxColor);
  }

  /**
   * Calcula la distancia cuadrada entre un color y una entrada de paleta.
   *
   * @param {number} r Canal rojo.
   * @param {number} g Canal verde.
   * @param {number} b Canal azul.
   * @param {{r:number,g:number,b:number}} color Color de paleta.
   * @returns {number} Distancia al cuadrado.
   */
  function colorDistance(r, g, b, color) {
    var dr = r - color.r;
    var dg = g - color.g;
    var db = b - color.b;
    return (dr * dr) + (dg * dg) + (db * db);
  }

  /**
   * Busca el indice de paleta mas cercano para un color.
   *
   * @param {number} r Canal rojo.
   * @param {number} g Canal verde.
   * @param {number} b Canal azul.
   * @param {object[]} palette Paleta RGB.
   * @returns {number} Indice de la paleta.
   */
  function nearestColorIndex(r, g, b, palette) {
    var bestIndex = 0;
    var bestDistance = Infinity;
    for (var i = 0; i < palette.length; i += 1) {
      var distance = colorDistance(r, g, b, palette[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  /**
   * Indexa una imagen RGBA contra una paleta.
   *
   * @param {{width:number,height:number,data:Uint8ClampedArray|Uint8Array}} imageData Imagen de origen.
   * @param {object[]} palette Paleta RGB.
   * @param {object} options Opciones de transparencia.
   * @returns {{pixels:Uint8Array,transparentIndex:number|null}} Pixeles indexados.
   */
  function indexImage(imageData, palette, options) {
    var settings = options || {};
    var transparentIndex = Number.isInteger(settings.transparentIndex) ? settings.transparentIndex : null;
    var alphaThreshold = settings.alphaThreshold || 1;
    var pixels = new Uint8Array(imageData.width * imageData.height);

    for (var i = 0; i < pixels.length; i += 1) {
      var offset = i * 4;
      if (transparentIndex !== null && imageData.data[offset + 3] < alphaThreshold) {
        pixels[i] = transparentIndex;
      } else {
        pixels[i] = nearestColorIndex(
          imageData.data[offset],
          imageData.data[offset + 1],
          imageData.data[offset + 2],
          palette
        );
      }
    }

    return {
      pixels: pixels,
      transparentIndex: transparentIndex
    };
  }

  /**
   * Calcula la potencia de dos necesaria para una tabla de color indexada.
   *
   * @param {number} colorCount Numero de colores utiles.
   * @returns {number} Tamano de tabla como potencia de dos.
   */
  function paletteTableSize(colorCount) {
    var size = 2;
    while (size < colorCount && size < 256) {
      size *= 2;
    }
    return size;
  }

  Hormi.Core.Palette = {
    indexImage: indexImage,
    nearestColorIndex: nearestColorIndex,
    paletteTableSize: paletteTableSize,
    quantize: quantize
  };
}(globalThis));
