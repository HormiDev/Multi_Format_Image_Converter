# Docker y Makefile

## Targets

```sh
make build
```

Crea la imagen `hormi-image-converter:local`.

```sh
make run
```

Levanta un contenedor Nginx solo en local: `http://localhost:8080`.

```sh
make run-net
```

Levanta el contenedor escuchando en `0.0.0.0:8080` para acceso desde otros equipos de la red.

```sh
make stop
```

Para el contenedor local.

```sh
make test
```

Ejecuta las pruebas Node sin instalar paquetes.

```sh
make serve
```

Sirve `src/` con `python3 -m http.server` solo en local.

```sh
make serve-net
```

Sirve `src/` escuchando en `0.0.0.0:8080`.

```sh
make urls-net
```

Muestra la URL que debe abrir otro equipo de la misma red.

## Puerto

Todos los targets que publican servidor respetan `PORT`:

```sh
make run PORT=9000
make run-net PORT=9000
make serve PORT=9000
make serve-net PORT=9000
```

## Imagen base

El `Dockerfile` usa `nginx:1.27-alpine` solo para servir archivos estaticos. La aplicacion no necesita internet en ejecucion.
