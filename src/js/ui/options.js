(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  /**
   * Crea un elemento con clase CSS.
   *
   * @param {string} tag Etiqueta HTML.
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
   * Crea un input numerico tipo rango con lectura visible.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function rangeControl(option) {
    var wrap = element('label', 'option-row option-row--range');
    var span = element('span', 'option-label');
    var value = element('output', 'option-value');
    var input = document.createElement('input');
    input.type = 'range';
    input.min = option.min;
    input.max = option.max;
    input.step = option.step;
    input.value = option.default;
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'number';
    value.value = input.value;
    input.addEventListener('input', function () {
      value.value = input.value;
    });
    span.textContent = option.label;
    wrap.append(span, input, value);
    return wrap;
  }

  /**
   * Crea un input de color.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function colorControl(option) {
    var wrap = element('label', 'option-row option-row--color');
    var span = element('span', 'option-label');
    var input = document.createElement('input');
    span.textContent = option.label;
    input.type = 'color';
    input.value = option.default;
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'string';
    wrap.append(span, input);
    return wrap;
  }

  /**
   * Crea un selector desplegable.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function selectControl(option) {
    var wrap = element('label', 'option-row');
    var span = element('span', 'option-label');
    var select = document.createElement('select');
    span.textContent = option.label;
    select.dataset.optionId = option.id;
    select.dataset.optionType = 'string';
    option.choices.forEach(function (choice) {
      var item = document.createElement('option');
      item.value = choice.value;
      item.textContent = choice.label;
      select.appendChild(item);
    });
    select.value = option.default;
    wrap.append(span, select);
    return wrap;
  }

  /**
   * Crea una casilla de verificacion.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function checkboxControl(option) {
    var wrap = element('label', 'option-row option-row--check');
    var input = document.createElement('input');
    var span = element('span', 'option-label');
    input.type = 'checkbox';
    input.checked = Boolean(option.default);
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'boolean';
    span.textContent = option.label;
    wrap.append(input, span);
    return wrap;
  }

  /**
   * Crea una caja de texto corta.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function textControl(option) {
    var wrap = element('label', 'option-row');
    var span = element('span', 'option-label');
    var input = document.createElement('input');
    span.textContent = option.label;
    input.type = 'text';
    input.value = option.default || '';
    input.dataset.optionId = option.id;
    input.dataset.optionType = 'string';
    wrap.append(span, input);
    return wrap;
  }

  /**
   * Crea el control HTML adecuado para una opcion.
   *
   * @param {object} option Definicion de opcion.
   * @returns {HTMLElement} Control creado.
   */
  function optionControl(option) {
    if (option.type === 'range') {
      return rangeControl(option);
    }
    if (option.type === 'color') {
      return colorControl(option);
    }
    if (option.type === 'select') {
      return selectControl(option);
    }
    if (option.type === 'checkbox') {
      return checkboxControl(option);
    }
    return textControl(option);
  }

  /**
   * Renderiza las opciones del formato seleccionado.
   *
   * @param {HTMLElement} container Contenedor destino.
   * @param {object} format Formato seleccionado.
   * @returns {void}
   */
  function renderFormatOptions(container, format) {
    container.replaceChildren();
    if (!format.options.length) {
      var empty = element('p', 'empty-options');
      empty.textContent = 'Sin opciones adicionales';
      container.appendChild(empty);
      return;
    }
    format.options.forEach(function (option) {
      container.appendChild(optionControl(option));
    });
  }

  /**
   * Lee las opciones actuales del formulario.
   *
   * @param {HTMLElement} container Contenedor de opciones.
   * @returns {object} Opciones serializadas.
   */
  function readOptions(container) {
    var values = {};
    container.querySelectorAll('[data-option-id]').forEach(function (input) {
      var id = input.dataset.optionId;
      var type = input.dataset.optionType;
      if (type === 'boolean') {
        values[id] = input.checked;
      } else if (type === 'number') {
        values[id] = Number(input.value);
      } else {
        values[id] = input.value;
      }
    });
    return values;
  }

  Hormi.UI.Options = {
    readOptions: readOptions,
    renderFormatOptions: renderFormatOptions
  };
}(globalThis));
