# Formatos soportados

## Exportacion

| Formato | Motor | Opciones |
| --- | --- | --- |
| PNG | Canvas nativo | Alfa completo |
| JPG | Canvas nativo | Calidad, fondo para alfa |
| WebP | Canvas nativo | Calidad |
| AVIF | Canvas nativo | Calidad |
| GIF | Codificador propio | Colores de paleta, transparencia, umbral alfa |
| BMP | Codificador propio | 24/32 bits, fondo para alfa |
| ICO | Codificador propio | Tamano del icono |
| TIFF | Codificador propio | Aplanar alfa o preservar canal alfa |
| TGA | Codificador propio | 24/32 bits, fondo para alfa |
| QOI | Codificador propio | Espacio de color |
| PPM | Codificador propio | Binario P6 o ASCII P3 |
| PGM | Codificador propio | Binario P5 o ASCII P2 |
| PBM | Codificador propio | Binario P4 o ASCII P1, umbral |
| XPM | Codificador propio | Colores de paleta, transparencia |
| SVG raster | Codificador propio + PNG nativo | Titulo |

## Importacion

La aplicacion intenta primero importadores propios para:

- `BMP` sin compresion de 24/32 bits.
- `TGA` sin compresion de 8/24/32 bits.
- `QOI`.
- `PPM`, `PGM`, `PBM` en variantes ASCII y binarias de 8 bits.
- `XPM` C-style basico.

Si no hay importador propio aplicable, usa el decodificador del navegador mediante `createImageBitmap` o `HTMLImageElement`.

## Limitaciones previstas

- `GIF` exporta un fotograma estatico, no animacion.
- `TIFF` se escribe sin compresion para mantener el codigo local y legible.
- `XPM` reconoce colores hexadecimales y algunos nombres basicos.
- `PPM/PGM/PBM` se limitan a muestras de 8 bits.
