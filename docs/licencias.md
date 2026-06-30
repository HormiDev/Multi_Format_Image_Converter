# Licencias

## Proyecto

El proyecto esta bajo licencia MIT, definida en `LICENSE`.

## Dependencias de aplicacion

No se han anadido librerias externas ni submodulos. La aplicacion usa:

- APIs Web estandar del navegador.
- Codificadores e importadores propios incluidos en `src/js`.
- Un generador ZIP propio sin compresion.

## Docker

El contenedor usa `nginx:1.27-alpine` como imagen base para servir estaticos. No forma parte del codigo de aplicacion ni se carga en el navegador.

## Criterio futuro

Si se anade una libreria en el futuro, la preferencia recomendada es:

1. MIT, BSD-2-Clause, BSD-3-Clause o ISC.
2. Apache-2.0 si aporta valor claro.
3. Evitar GPL/AGPL para no imponer copyleft al proyecto.
