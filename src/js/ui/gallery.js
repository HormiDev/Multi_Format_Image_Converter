(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var draggedId = null;

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
   * @param {number} index Posicion en la lista.
   * @param {Function} onRemove Funcion de borrado.
   * @param {Function} onMove Funcion de reordenado.
   * @returns {HTMLElement} Tarjeta de imagen.
   */
  function imageItem(raster, index, onRemove, onMove) {
    var item = element('article', 'image-item');
    var order = element('span', 'image-item__order');
    var preview = document.createElement('img');
    var body = element('div', 'image-item__body');
    var name = element('strong', 'image-item__name');
    var meta = element('span', 'image-item__meta');
    var remove = element('button', 'icon-button');

    item.draggable = true;
    item.dataset.rasterId = raster.id;
    order.textContent = String(index + 1);
    preview.src = raster.previewUrl;
    preview.alt = '';
    name.textContent = raster.name;
    meta.textContent = raster.width + ' x ' + raster.height + ' px';
    remove.type = 'button';
    remove.textContent = Hormi.I18n.t('gallery.remove');
    remove.addEventListener('click', function () {
      onRemove(raster.id);
    });
    item.addEventListener('dragstart', function (event) {
      draggedId = raster.id;
      item.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', raster.id);
    });
    item.addEventListener('dragend', function () {
      draggedId = null;
      item.classList.remove('is-dragging');
      item.classList.remove('is-drag-over-before', 'is-drag-over-after');
    });
    item.addEventListener('dragover', function (event) {
      var placement = dropPlacement(item, event);
      if (!draggedId || draggedId === raster.id) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      item.classList.toggle('is-drag-over-before', placement === 'before');
      item.classList.toggle('is-drag-over-after', placement === 'after');
    });
    item.addEventListener('dragleave', function () {
      item.classList.remove('is-drag-over-before', 'is-drag-over-after');
    });
    item.addEventListener('drop', function (event) {
      var sourceId = event.dataTransfer.getData('text/plain') || draggedId;
      var placement = dropPlacement(item, event);
      item.classList.remove('is-drag-over-before', 'is-drag-over-after');
      if (!sourceId || sourceId === raster.id) {
        return;
      }
      event.preventDefault();
      onMove(sourceId, raster.id, placement);
    });

    body.append(name, meta);
    item.append(order, preview, body, remove);
    return item;
  }

  /**
   * Decide si se inserta antes o despues de la tarjeta destino.
   *
   * @param {HTMLElement} item Tarjeta destino.
   * @param {DragEvent} event Evento de arrastre.
   * @returns {string} Posicion relativa.
   */
  function dropPlacement(item, event) {
    var rect = item.getBoundingClientRect();
    var midpoint = rect.top + (rect.height / 2);
    return event.clientY > midpoint ? 'after' : 'before';
  }

  /**
   * Renderiza la galeria de imagenes cargadas.
   *
   * @param {HTMLElement} container Contenedor destino.
   * @param {object[]} rasters Imagenes cargadas.
   * @param {Function} onRemove Funcion de borrado.
   * @param {Function} onMove Funcion de reordenado.
   * @returns {void}
   */
  function renderImages(container, rasters, onRemove, onMove) {
    container.replaceChildren();
    if (!rasters.length) {
      var empty = element('p', 'empty-gallery');
      empty.textContent = Hormi.I18n.t('gallery.empty');
      container.appendChild(empty);
      return;
    }
    rasters.forEach(function (raster, index) {
      container.appendChild(imageItem(raster, index, onRemove, onMove));
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
