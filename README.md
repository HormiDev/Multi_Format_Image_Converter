# Hormi Image Converter

Conversor de formatos de imagen 100% local. La pagina vive en `src/`, funciona abriendo `src/index.html` directamente en el navegador y tambien puede servirse con `make serve` o Docker.

No usa librerias externas de aplicacion: los formatos nativos salen de APIs Web (`canvas`, `Blob`, `File`) y los formatos no nativos se codifican/decodifican con codigo propio bajo la licencia MIT del proyecto.

## Formatos

Exporta a `PNG`, `JPG`, `WebP`, `AVIF`, `GIF`, `BMP`, `ICO`, `TIFF`, `TGA`, `QOI`, `PPM`, `PGM`, `PBM`, `XPM` y `SVG`.

Importa con el navegador los formatos soportados por tu entorno y, ademas, importa de forma propia `BMP`, `TGA`, `QOI`, `PPM`, `PGM`, `PBM` y `XPM`.

## Uso rapido

<details>
<summary>Manual rapido de uso</summary>

1. Abre `src/index.html` directamente o ejecuta `make serve`.
2. Arrastra una o varias imagenes a la zona de entrada.
3. Selecciona el formato de salida.
4. Ajusta las opciones del formato, como calidad, fondo, alfa, paleta o profundidad.
5. Manten `Empaquetar en ZIP` activo para descargar un archivo `.zip`.
6. Pulsa `Convertir`.

La aplicacion funciona localmente. Los formatos nativos dependen del navegador y los formatos especiales usan codificadores incluidos en `src/js`.

</details>

```sh
make serve
```

Abre `http://localhost:8080`.

Desde otro equipo de la misma red no uses `0.0.0.0`. Ejecuta:

```sh
make serve-net
```

Y abre la URL que aparece como `Otro equipo`, por ejemplo `http://192.168.1.34:8080`.

Tambien puedes abrir directamente:

```text
src/index.html
```

## Docker

```sh
make build
make run
```

El contenedor publica la web solo en local: `http://localhost:8080`.

Para exponerlo a otros equipos de la red:

```sh
make run-net
```

## Pruebas

```sh
make test
```

Las pruebas generan una imagen RGBA pequena y validan exportacion/importacion en los codificadores propios: `QOI`, `BMP`, `TGA`, `PPM`, `PGM`, `PBM`, `XPM`, `GIF`, `ICO`, `TIFF` y `ZIP`.

## Documentacion

- [Indice de documentacion](docs/index.md)
- [Uso local](docs/uso-local.md)
- [Formatos soportados](docs/formatos.md)
- [Arquitectura](docs/arquitectura.md)
- [APIs del navegador](docs/apis-navegador.md)
- [Codificadores propios](docs/codificadores-propios.md)
- [Docker y Makefile](docs/docker-make.md)
- [Pruebas](docs/pruebas.md)
- [Licencias](docs/licencias.md)
