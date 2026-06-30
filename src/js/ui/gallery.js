(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Formatea bytes en unidades legibles.
   *
   * @param {number} bytes Tamano en bytes.
   * @returns {string} Tamano formateado.
   */
  function formatBytes(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Crea un elemento HTML con clase opcional.
   *
   * @param {string} tag Etiqueta.
   * @param {string} className Clase CSS.
   * @returns {HTMLElement} Elemento creado.
   */
  function element(tag, className) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    return node;
  }

  /**
   * Crea la tarjeta de una imagen cargada.
   *
   * @param {object} raster Imagen cargada.
   * @param {Function} onRemove Funcion de borrado.
   * @returns {HTMLElement} Tarjeta de imagen.
   */
  function imageItem(raster, onRemove) {
    var item = element('article', 'image-item');
    var preview = document.createElement('img');
    var body = element('div', 'image-item__body');
    var name = element('strong', 'image-item__name');
    var meta = element('span', 'image-item__meta');
    var remove = element('button', 'icon-button');

    preview.src = raster.previewUrl;
    preview.alt = '';
    name.textContent = raster.name;
    meta.textContent = raster.width + ' x ' + raster.height + ' px';
    remove.type = 'button';
    remove.textContent = 'Quitar';
    remove.addEventListener('click', function () {
      onRemove(raster.id);
    });

    body.append(name, meta);
    item.append(preview, body, remove);
    return item;
  }

  /**
   * Renderiza la galeria de imagenes cargadas.
   *
   * @param {HTMLElement} container Contenedor destino.
   * @param {object[]} rasters Imagenes cargadas.
   * @param {Function} onRemove Funcion de borrado.
   * @returns {void}
   */
  function renderImages(container, rasters, onRemove) {
    container.replaceChildren();
    if (!rasters.length) {
      var empty = element('p', 'empty-gallery');
      empty.textContent = 'Sin imagenes cargadas';
      container.appendChild(empty);
      return;
    }
    rasters.forEach(function (raster) {
      container.appendChild(imageItem(raster, onRemove));
    });
  }

  /**
   * Renderiza la lista de salidas convertidas.
   *
   * @param {HTMLElement} container Contenedor destino.
   * @param {object[]} outputs Salidas codificadas.
   * @returns {void}
   */
  function renderOutputs(container, outputs) {
    container.replaceChildren();
    outputs.forEach(function (output) {
      var item = element('li', 'output-item');
      item.textContent = output.name + ' - ' + formatBytes(output.size);
      container.appendChild(item);
    });
  }

  Hormi.UI.Gallery = {
    renderImages: renderImages,
    renderOutputs: renderOutputs
  };
}(globalThis));
