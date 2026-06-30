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
  'src/js/encoders/registry.js'
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
 * Extrae bytes desde un Blob.
 *
 * @param {Blob} blob Blob de entrada.
 * @returns {Promise<Uint8Array>} Bytes del blob.
 */
async function blobBytes(blob) {
  return new Uint8Array(await blob.arrayBuffer());
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

await test('GIF genera cabecera, dimensiones y cierre validos', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Gif.encode(image, { colors: 16, transparency: true, alphaThreshold: 8 });
  assert.equal(Hormi.Core.Binary.asciiText(encoded.subarray(0, 6)), 'GIF89a');
  assert.equal(u16(encoded, 6), image.width);
  assert.equal(u16(encoded, 8), image.height);
  assert.equal(encoded[encoded.length - 1], 0x3b);
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

await test('TIFF genera cabecera little-endian baseline', () => {
  const image = fixtureImage();
  const encoded = Hormi.Encoders.Tiff.encode(image, { alphaMode: 'preserve' });
  assert.equal(encoded[0], 0x49);
  assert.equal(encoded[1], 0x49);
  assert.equal(u16(encoded, 2), 42);
});

await test('ZIP empaqueta entradas sin compresion', async () => {
  const blob = await Hormi.Zip.createZip([{ name: 'hola.txt', data: 'hola' }]);
  const encoded = await blobBytes(blob);
  assert.equal(Hormi.Core.Binary.readU32LE(encoded, 0), 0x04034b50);
  assert.ok(encoded.includes(0x68));
  assert.equal(Hormi.Core.Binary.readU32LE(encoded, encoded.length - 22), 0x06054b50);
});

console.log('Todas las pruebas pasaron');
