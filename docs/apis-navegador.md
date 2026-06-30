# APIs del navegador

## File y Blob

`File` permite leer los archivos arrastrados con `arrayBuffer()`. `Blob` se usa para crear las descargas de imagen y ZIP sin tocar servidor.

## Canvas

`canvas` es el raster central de la aplicacion. Los formatos nativos salen por `canvas.toBlob()`:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/avif` si el navegador lo implementa

## ImageBitmap e Image

`createImageBitmap()` se usa como ruta principal de importacion nativa. Si falla, se usa `HTMLImageElement` con `URL.createObjectURL()`.

## Descarga local

La descarga se hace creando un enlace temporal con `download` y un `ObjectURL`. No hay subida de archivos ni peticiones a internet.
