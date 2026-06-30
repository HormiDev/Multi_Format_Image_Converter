# Uso local

## Abrir sin servidor

Abre `src/index.html` directamente con tu navegador. La aplicacion no descarga recursos externos y todos los scripts estan en `src/js`.

## Servir con Make

```sh
make serve
```

Por defecto sirve `src/` en `http://localhost:8080`. Puedes cambiar el puerto:

```sh
make serve PORT=9000
```

Para abrir la aplicacion desde otro equipo de la misma red:

```sh
make serve-net
```

Usa la URL indicada como `Otro equipo`.

## Flujo de conversion

1. Arrastra una o varias imagenes a la zona de entrada, o usa `Elegir archivos`.
2. Selecciona el formato de salida.
3. Ajusta las opciones del formato.
4. Pulsa `Convertir`.

La casilla `Empaquetar en ZIP` esta activada por defecto. Asi, incluso una sola imagen se descarga dentro de un `.zip`.

## Notas

- Los formatos animados se rasterizan como una imagen estatica cuando el navegador los decodifica en canvas.
- `PNG`, `JPG`, `WebP` y `AVIF` dependen de la capacidad real del navegador instalado.
- Si el navegador no soporta `AVIF` en `canvas.toBlob`, la exportacion mostrara error.
