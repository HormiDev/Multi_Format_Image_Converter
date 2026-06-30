(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var Binary = Hormi.Core.Binary;
  var Color = Hormi.Core.Color;

  var NAMED_COLORS = {
    black: '#000000',
    blue: '#0000ff',
    cyan: '#00ffff',
    gray: '#808080',
    green: '#008000',
    grey: '#808080',
    magenta: '#ff00ff',
    red: '#ff0000',
    white: '#ffffff',
    yellow: '#ffff00'
  };

  /**
   * Extrae las lineas entre comillas de un XPM C-style.
   *
   * @param {string} text Texto XPM.
   * @returns {string[]} Lineas XPM.
   */
  function quotedLines(text) {
    var lines = [];
    var pattern = /"((?:\\.|[^"\\])*)"/g;
    var match;
    while ((match = pattern.exec(text)) !== null) {
      lines.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
    return lines;
  }

  /**
   * Interpreta un color XPM basico.
   *
   * @param {string} raw Valor de color XPM.
   * @returns {{r:number,g:number,b:number,a:number}} Color RGBA.
   */
  function parseXpmColor(raw) {
    var value = String(raw || '').trim();
    if (!value || /^none$/i.test(value)) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    if (NAMED_COLORS[value.toLowerCase()]) {
      value = NAMED_COLORS[value.toLowerCase()];
    }
    var rgb = Color.parseHexColor(value, { r: 0, g: 0, b: 0 });
    return { r: rgb.r, g: rgb.g, b: rgb.b, a: 255 };
  }

  /**
   * Lee la declaracion de color de una linea XPM.
   *
   * @param {string} line Linea de tabla.
   * @param {number} charsPerPixel Caracteres por pixel.
   * @returns {{key:string,color:object}} Entrada de paleta.
   */
  function parseColorLine(line, charsPerPixel) {
    var key = line.slice(0, charsPerPixel);
    var rest = line.slice(charsPerPixel).trim();
    var match = /\bc\s+([^\s]+|\S.*)$/i.exec(rest);
    return {
      key: key,
      color: parseXpmColor(match ? match[1].trim() : 'None')
    };
  }

  /**
   * Decodifica una imagen XPM estatica.
   *
   * @param {ArrayBuffer|Uint8Array|string} input Texto o bytes XPM.
   * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen RGBA.
   */
  function decodeXpm(input) {
    var text = typeof input === 'string' ? input : Binary.utf8Text(input);
    var lines = quotedLines(text);
    if (!lines.length) {
      lines = text.split(/\r?\n/).filter(Boolean);
    }

    var header = lines[0].trim().split(/\s+/).map(Number);
    var width = header[0];
    var height = header[1];
    var colorCount = header[2];
    var charsPerPixel = header[3];
    if (!width || !height || !colorCount || !charsPerPixel) {
      throw new Error('Cabecera XPM no valida');
    }

    var palette = new Map();
    for (var i = 0; i < colorCount; i += 1) {
      var entry = parseColorLine(lines[1 + i], charsPerPixel);
      palette.set(entry.key, entry.color);
    }

    var out = new Uint8ClampedArray(width * height * 4);
    for (var y = 0; y < height; y += 1) {
      var row = lines[1 + colorCount + y] || '';
      for (var x = 0; x < width; x += 1) {
        var key = row.slice(x * charsPerPixel, (x + 1) * charsPerPixel);
        var color = palette.get(key) || { r: 0, g: 0, b: 0, a: 0 };
        Color.setPixel(out, ((y * width) + x) * 4, color.r, color.g, color.b, color.a);
      }
    }

    return { width: width, height: height, data: out };
  }

  Hormi.Importers.Xpm = {
    decode: decodeXpm
  };
}(globalThis));
