import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);

/**
 * Carga un script clasico en el contexto global de Node.
 *
 * @param {string} relative Ruta relativa al repo.
 * @returns {void}
 */
function loadScript(relative) {
  const file = resolve(root, relative);
  vm.runInThisContext(readFileSync(file, 'utf8'), { filename: file });
}

[
  'src/js/core/namespace.js',
  'src/js/core/i18n.js',
  'src/js/core/binary.js',
  'src/js/core/color.js',
  'src/js/core/palette.js',
  'src/js/zip/crc32.js',
  'src/js/zip/zip.js',
  'src/js/importers/netpbm.js',
  'src/js/importers/bmp.js',
  'src/js/importers/qoi.js',
  'src/js/importers/tga.js',
  'src/js/importers/xpm.js',
  'src/js/encoders/bmp.js',
  'src/js/encoders/netpbm.js',
  'src/js/encoders/qoi.js',
  'src/js/encoders/tga.js',
  'src/js/encoders/xpm.js',
  'src/js/encoders/gif.js',
  'src/js/encoders/ico.js',
  'src/js/encoders/tiff.js',
  'src/js/formats/catalog.js',
  'src/js/conversion/resize.js',
  'src/js/encoders/registry.js',
  'src/js/conversion/converter.js',
  'src/js/conversion/file-loader.js'
].forEach(loadScript);

const { Hormi } = globalThis;

/**
 * Crea una imagen RGBA de prueba con colores y alfa variados.
 *
 * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen de prueba.
 */
function fixtureImage() {
  return {
    width: 4,
    height: 3,
    data: new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
      0, 255, 255, 255, 255, 0, 255, 255, 20, 40, 60, 255, 90, 110, 130, 255,
      255, 255, 255, 0, 0, 0, 0, 255, 128, 128, 128, 255, 250, 120, 20, 255
    ])
  };
}

/**
 * Crea una imagen solida RGBA.
 *
 * @param {number} width Ancho.
 * @param {number} height Alto.
 * @param {number[]} rgba Color RGBA.
 * @returns {{width:number,height:number,data:Uint8ClampedArray}} Imagen solida.
 */
function solidImage(width, height, rgba) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data.set(rgba, i * 4);
  }
  return { width, height, data };
}

/**
 * Compara dimensiones e igualdad exacta RGBA.
 *
 * @param {object} actual Imagen decodificada.
 * @param {object} expected Imagen esperada.
 * @returns {void}
 */
function assertExactImage(actual, expected) {
  assert.equal(actual.width, expected.width);
  assert.equal(actual.height, expected.height);
  assert.deepEqual(Array.from(actual.data), Array.from(expected.data));
}

/**
 * Compara solo canales RGB de dos imagenes.
 *
 * @param {object} actual Imagen decodificada.
 * @param {object} expected Imagen esperada.
 * @returns {void}
 */
function assertRgbImage(actual, expected) {
  assert.equal(actual.width, expected.width);
  assert.equal(actual.height, expected.height);
  for (let i = 0; i < actual.data.length; i += 4) {
    assert.equal(actual.data[i], expected.data[i]);
    assert.equal(actual.data[i + 1], expected.data[i + 1]);
    assert.equal(actual.data[i + 2], expected.data[i + 2]);
  }
}

/**
 * Busca una opcion de exportacion por formato e identificador.
 *
 * @param {string} formatId Identificador del formato.
 * @param {string} optionId Identificador de la opcion.
 * @returns {object} Opcion encontrada.
 */
function formatOption(formatId, optionId) {
  return Hormi.Formats.byId(formatId).options.find((option) => option.id === optionId);
}

/**
 * Lee un entero little-endian de 16 bits.
 *
 * @param {Uint8Array} bytes Bytes de entrada.
 * @param {number} offset Posicion de lectura.
 * @returns {number} Valor leido.
 */
function u16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

/**
 * Lee un entero little-endian de 32 bits.
 *
 * @param {Uint8Array} bytes Bytes de entrada.
 * @param {number} offset Posicion de lectura.
 * @returns {number} Valor leido.
 */
function u32(bytes, offset) {
  return Hormi.Core.Binary.readU32LE(bytes, offset);
}

/**
 * Extrae bytes desde un Blob.
 *
 * @param {Blob} blob Blob de entrada.
 * @returns {Promise<Uint8Array>} Bytes del blob.
 */
async function blobBytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Lee los subbloques GIF desde una posicion.
 *
 * @param {Uint8Array} bytes Bytes GIF.
 * @param {number} offset Posicion inicial.
 * @returns {{data:Uint8Array,offset:number}} Datos unidos y nueva posicion.
 */
function readGifSubBlocks(bytes, offset) {
  const parts = [];
  let total = 0;
  let cursor = offset;
  while (bytes[cursor] !== 0) {
    const size = bytes[cursor];
    const chunk = bytes.subarray(cursor + 1, cursor + 1 + size);
    parts.push(chunk);
    total += chunk.length;
    cursor += 1 + size;
  }
  const data = new Uint8Array(total);
  let target = 0;
  for (const part of parts) {
    data.set(part, target);
    target += part.length;
  }
  return { data, offset: cursor + 1 };
}

/**
 * Decodifica el flujo LZW de un fotograma GIF.
 *
 * @param {Uint8Array} data Datos LZW empaquetados.
 * @param {number} minCodeSize Tamano minimo de codigo.
 * @param {number} expectedPixels Pixeles esperados.
 * @returns {number[]} Pixeles indexados.
 */
function decodeGifLzw(data, minCodeSize, expectedPixels) {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  let bitOffset = 0;
  let oldCode = null;
  let dictionary = [];
  const pixels = [];

  function resetDictionary() {
    dictionary = [];
    for (let i = 0; i < clearCode; i += 1) {
      dictionary[i] = [i];
    }
    dictionary[clearCode] = null;
    dictionary[endCode] = null;
    codeSize = minCodeSize + 1;
    nextCode = endCode + 1;
    oldCode = null;
  }

  function readCode() {
    let code = 0;
    for (let bit = 0; bit < codeSize; bit += 1) {
      const byte = data[Math.floor(bitOffset / 8)] || 0;
      code |= ((byte >> (bitOffset % 8)) & 1) << bit;
      bitOffset += 1;
    }
    return code;
  }

  resetDictionary();
  while (pixels.length < expectedPixels && bitOffset < data.length * 8) {
    const code = readCode();
    if (code === clearCode) {
      resetDictionary();
      continue;
    }
    if (code === endCode) {
      break;
    }

    let entry;
    if (dictionary[code]) {
      entry = dictionary[code].slice();
    } else if (code === nextCode && oldCode !== null) {
      entry = dictionary[oldCode].concat(dictionary[oldCode][0]);
    } else {
      throw new Error('Codigo LZW GIF invalido');
    }

    pixels.push(...entry);
    if (oldCode === null) {
      oldCode = code;
      continue;
    }

    dictionary[nextCode] = dictionary[oldCode].concat(entry[0]);
    nextCode += 1;
    if (nextCode === (1 << codeSize) && codeSize < 12) {
      codeSize += 1;
    }
    oldCode = code;
  }

  return pixels.slice(0, expectedPixels);
}

/**
 * Decodifica los fotogramas indexados de un GIF basico.
 *
 * @param {Uint8Array} bytes Bytes GIF.
 * @returns {object[]} Fotogramas decodificados.
 */
function decodeGifFrames(bytes) {
  assert.equal(Hormi.Core.Binary.asciiText(bytes.subarray(0, 6)), 'GIF89a');
  let offset = 13;
  const logicalPacked = bytes[10];
  if (logicalPacked & 0x80) {
    offset += 3 * (1 << ((logicalPacked & 0x07) + 1));
  }

  const frames = [];
  while (offset < bytes.length && bytes[offset] !== 0x3b) {
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0x21) {
      offset += 1;
      const skipped = readGifSubBlocks(bytes, offset);
      offset = skipped.offset;
      continue;
    }
    assert.equal(marker, 0x2c);
    const width = u16(bytes, offset + 4);
    const height = u16(bytes, offset + 6);
    const packed = bytes[offset + 8];
    offset += 9;
    if (packed & 0x80) {
      offset += 3 * (1 << ((packed & 0x07) + 1));
    }
    const minCodeSize = bytes[offset];
    const blocks = readGifSubBlocks(bytes, offset + 1);
    const pixels = decodeGifLzw(blocks.data, minCodeSize, width * height);
    assert.equal(pixels.length, width * height);
    frames.push({ width, height, pixels });
    offset = blocks.offset;
  }
  return frames;
}

/**
 * Ejecuta una prueba e imprime su resultado.
 *
 * @param {string} name Nombre de prueba.
 * @param {Function} fn Funcion de prueba.
 * @returns {Promise<void>} Promesa de ejecucion.
 */
async function test(name, fn) {
  await fn();
  console.log('ok - ' + name);
}

await test('QOI exporta e importa sin perdida', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Qoi.encode(image, {});
  const decoded = Hormi.Importers.Qoi.decode(encoded);
  assertExactImage(decoded, image);
});

await test('Redimensionado comun cambia dimensiones antes de exportar', async () => {
  const image = fixtureImage();
  const blob = await Hormi.Encoders.encode('qoi', {
    name: 'demo.png',
    width: image.width,
    height: image.height,
    imageData: image
  }, {
    keepResolution: false,
    resizeMode: 'exact',
    resizeWidth: 2,
    resizeHeight: 2,
    resizeFilter: 'nearest'
  });
  const decoded = Hormi.Importers.Qoi.decode(await blobBytes(blob));
  assert.equal(decoded.width, 2);
  assert.equal(decoded.height, 2);
  assert.equal(decoded.data.length, 2 * 2 * 4);
});

await test('Color de fondo depende de opciones que aplanan transparencia', () => {
  [
    ['png', 'flattenAlpha', true],
    ['webp', 'flattenAlpha', true],
    ['avif', 'flattenAlpha', true],
    ['svg', 'flattenAlpha', true],
    ['gif', 'transparency', false],
    ['tiff', 'alphaMode', 'flatten'],
    ['bmp', 'bitDepth', '24'],
    ['tga', 'bitDepth', '24']
  ].forEach(([formatId, id, value]) => {
    assert.deepEqual(formatOption(formatId, 'background').dependsOn, { id, value });
  });
});

await test('BMP 32 bits exporta e importa RGBA', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Bmp.encode(image, { bitDepth: 32 });
  const decoded = Hormi.Importers.Bmp.decode(encoded);
  assertExactImage(decoded, image);
});

await test('TGA 32 bits exporta e importa RGBA', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Tga.encode(image, { bitDepth: 32 });
  const decoded = Hormi.Importers.Tga.decode(encoded);
  assertExactImage(decoded, image);
});

await test('TGA con origen inferior mantiene la imagen al importar', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Tga.encode(image, { bitDepth: 32, origin: 'bottom' });
  assert.equal((encoded[17] & 0x20), 0);
  const decoded = Hormi.Importers.Tga.decode(encoded);
  assertExactImage(decoded, image);
});

await test('PPM binario exporta e importa RGB', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Netpbm.encodePpm(image, { ascii: false, background: '#ffffff' });
  const decoded = Hormi.Importers.Netpbm.decode(encoded);
  assertRgbImage(decoded, Hormi.Core.Color.flattenImageData(image, { r: 255, g: 255, b: 255 }));
});

await test('PGM ASCII exporta e importa dimensiones', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Netpbm.encodePgm(image, { ascii: true, background: '#ffffff' });
  const decoded = Hormi.Importers.Netpbm.decode(encoded);
  assert.equal(decoded.width, image.width);
  assert.equal(decoded.height, image.height);
  assert.equal(decoded.data[3], 255);
});

await test('PBM binario exporta e importa monocromo', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Netpbm.encodePbm(image, { ascii: false, threshold: 128 });
  const decoded = Hormi.Importers.Netpbm.decode(encoded);
  assert.equal(decoded.width, image.width);
  assert.equal(decoded.height, image.height);
  assert.ok(decoded.data.every((value, index) => (index % 4 === 3 ? value === 255 : value === 0 || value === 255)));
});

await test('XPM exporta e importa transparencia basica', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Xpm.encode(image, { colors: 16, transparency: true, alphaThreshold: 8 });
  const decoded = Hormi.Importers.Xpm.decode(encoded);
  assert.equal(decoded.width, image.width);
  assert.equal(decoded.height, image.height);
  assert.equal(decoded.data[8 * 4 + 3], 0);
});

await test('XPM permite nombre de variable C saneado', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Xpm.encode(image, { colors: 16, variableName: 'icon demo' });
  const text = Hormi.Core.Binary.utf8Text(encoded);
  assert.ok(text.includes('static char * icon_demo[]'));
});

await test('GIF genera cabecera, dimensiones y cierre validos', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Gif.encode(image, { colors: 16, transparency: true, alphaThreshold: 8 });
  assert.equal(Hormi.Core.Binary.asciiText(encoded.subarray(0, 6)), 'GIF89a');
  assert.equal(u16(encoded, 6), image.width);
  assert.equal(u16(encoded, 8), image.height);
  assert.equal(encoded[encoded.length - 1], 0x3b);
  const frames = decodeGifFrames(encoded);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].width, image.width);
  assert.equal(frames[0].height, image.height);
});

await test('GIF animado exporta varios fotogramas con lienzo comun', () => {
  const first = fixtureImage();
  const second = {
    width: 2,
    height: 5,
    data: new Uint8ClampedArray(2 * 5 * 4).fill(255)
  };
  const third = {
    width: 6,
    height: 2,
    data: new Uint8ClampedArray(6 * 2 * 4).fill(80)
  };
  const encoded = Hormi.Encoders.Gif.encodeAnimation([
    { name: 'a.png', width: first.width, height: first.height, imageData: first },
    { name: 'b.png', width: second.width, height: second.height, imageData: second },
    { name: 'c.png', width: third.width, height: third.height, imageData: third }
  ], {
    animate: true,
    gifMode: 'animation',
    colors: 16,
    transparency: false,
    fps: 8,
    loop: 0,
    canvasMode: 'largest',
    fitMode: 'contain',
    background: '#ffffff'
  });
  const frames = decodeGifFrames(encoded);
  assert.equal(u16(encoded, 6), 6);
  assert.equal(u16(encoded, 8), 5);
  assert.equal(frames.length, 3);
  assert.ok(frames.every((frame) => frame.width === 6 && frame.height === 5));
});

await test('Importador GIF separa animaciones en fotogramas', () => {
  const first = solidImage(2, 2, [255, 0, 0, 255]);
  const second = solidImage(2, 2, [0, 0, 255, 255]);
  const encoded = Hormi.Encoders.Gif.encodeAnimation([
    { name: 'rojo.png', width: first.width, height: first.height, imageData: first },
    { name: 'azul.png', width: second.width, height: second.height, imageData: second }
  ], {
    gifMode: 'animation',
    colors: 4,
    transparency: false,
    fps: 10,
    loop: 0,
    canvasMode: 'largest',
    fitMode: 'contain',
    background: '#ffffff'
  });
  const frames = Hormi.Conversion.FileLoader.decodeGifFrames(encoded);
  assert.equal(frames.length, 2);
  assert.equal(frames[0].width, 2);
  assert.equal(frames[0].height, 2);
  assert.deepEqual(Array.from(frames[0].data.subarray(0, 4)), [255, 0, 0, 255]);
  assert.deepEqual(Array.from(frames[1].data.subarray(0, 4)), [0, 0, 255, 255]);
});

await test('Conversor GIF agrupa varias imagenes como animacion', async () => {
  const image = fixtureImage();
  const outputs = await Hormi.Conversion.Converter.convertMany([
    { name: 'uno.png', width: image.width, height: image.height, imageData: image },
    { name: 'dos.png', width: image.width, height: image.height, imageData: image }
  ], 'gif', {
    gifMode: 'animation',
    colors: 16,
    transparency: false,
    fps: 10,
    loop: 0,
    canvasMode: 'largest',
    fitMode: 'contain',
    background: '#ffffff'
  });
  assert.equal(outputs.length, 1);
  assert.equal(outputs[0].name, 'uno_animation.gif');
  assert.equal(outputs[0].mime, 'image/gif');
  assert.ok(outputs[0].size > 0);
});

await test('ICO genera directorio y DIB de icono', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Ico.encode(image, { size: 32 });
  assert.equal(u16(encoded, 0), 0);
  assert.equal(u16(encoded, 2), 1);
  assert.equal(u16(encoded, 4), 1);
  assert.equal(encoded[6], 32);
  assert.equal(encoded[7], 32);
});

await test('ICO usa la resolucion actual por defecto si cabe en el formato', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Ico.encode(image, { size: 'source' });
  assert.equal(encoded[6], image.width);
  assert.equal(encoded[7], image.height);
});

await test('TIFF genera cabecera little-endian baseline', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Tiff.encode(image, { alphaMode: 'preserve' });
  assert.equal(encoded[0], 0x49);
  assert.equal(encoded[1], 0x49);
  assert.equal(u16(encoded, 2), 42);
});

await test('TIFF escribe DPI configurable', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Tiff.encode(image, { alphaMode: 'flatten', dpi: 300 });
  const ifdOffset = u32(encoded, 4);
  const entries = u16(encoded, ifdOffset);
  let xResolutionOffset = 0;
  for (let i = 0; i < entries; i += 1) {
    const entryOffset = ifdOffset + 2 + (i * 12);
    if (u16(encoded, entryOffset) === 282) {
      xResolutionOffset = u32(encoded, entryOffset + 8);
    }
  }
  assert.equal(u32(encoded, xResolutionOffset), 300);
  assert.equal(u32(encoded, xResolutionOffset + 4), 1);
});

await test('ZIP empaqueta entradas sin compresion', async () => {
  const blob = await Hormi.Zip.createZip([{ name: 'hola.txt', data: 'hola' }]);
  const encoded = await blobBytes(blob);
  assert.equal(Hormi.Core.Binary.readU32LE(encoded, 0), 0x04034b50);
  assert.ok(encoded.includes(0x68));
  assert.equal(Hormi.Core.Binary.readU32LE(encoded, encoded.length - 22), 0x06054b50);
});

console.log('Todas las pruebas pasaron');
