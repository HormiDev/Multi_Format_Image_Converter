# Pruebas

## Ejecutar

```sh
make test
```

Equivale a:

```sh
node tests/test-runner.mjs
```

## Cobertura actual

Las pruebas cargan los scripts clasicos en Node, generan una imagen RGBA pequena y validan:

- Round-trip exacto en `QOI`.
- Round-trip exacto en `BMP` de 32 bits.
- Round-trip exacto en `TGA` de 32 bits.
- Exportacion e importacion RGB en `PPM`.
- Importacion de dimensiones en `PGM`.
- Monocromo valido en `PBM`.
- Transparencia basica en `XPM`.
- Cabecera y cierre de `GIF`.
- Directorio basico de `ICO`.
- Cabecera baseline de `TIFF`.
- Estructura local y central de `ZIP`.

## Pruebas manuales recomendadas

1. Abrir `src/index.html`.
2. Arrastrar varias imagenes reales.
3. Exportar a cada formato con ZIP activado.
4. Reimportar `BMP`, `TGA`, `QOI`, `PPM`, `PGM`, `PBM` y `XPM`.
5. Probar `PNG/JPG/WebP/AVIF` en el navegador objetivo.
