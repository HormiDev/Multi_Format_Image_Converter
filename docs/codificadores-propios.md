# Codificadores propios

## Binarios

Los helpers de `src/js/core/binary.js` escriben enteros little-endian y big-endian, concatenan buffers y convierten texto/base64.

## Paletas

`src/js/core/palette.js` aplica cuantizacion por corte mediano para `GIF` y `XPM`. La busqueda de color usa distancia RGB cuadratica.

## ZIP

`src/js/zip/zip.js` genera ZIP con metodo `store`, sin compresion. Esto evita dependencias y mantiene compatibilidad con visores ZIP comunes.

## Formatos implementados

- `BMP`: BITMAPINFOHEADER de 40 bytes, 24 o 32 bits, sin compresion.
- `GIF`: GIF89a estatico, tabla global y LZW.
- `ICO`: contenedor ICO con un DIB BGRA de una resolucion.
- `TIFF`: baseline little-endian, RGB/RGBA, sin compresion.
- `TGA`: true-color sin compresion, origen superior.
- `QOI`: Quite OK Image con canal alfa.
- `PPM/PGM/PBM`: familia Netpbm en ASCII o binario.
- `XPM`: C-style con tabla de colores.
- `SVG raster`: SVG con PNG embebido como data URI.
