(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  var state = {
    rasters: [],
    formatId: 'png'
  };

  /**
   * Busca todos los nodos principales de la interfaz.
   *
   * @returns {object} Referencias DOM.
   */
  function domRefs() {
    return {
      dropZone: document.querySelector('[data-drop-zone]'),
      fileInput: document.querySelector('[data-file-input]'),
      pickButton: document.querySelector('[data-pick-button]'),
      themeToggle: document.querySelector('[data-theme-toggle]'),
      clearButton: document.querySelector('[data-clear-button]'),
      imageList: document.querySelector('[data-image-list]'),
      formatSelect: document.querySelector('[data-format-select]'),
      formatDescription: document.querySelector('[data-format-description]'),
      options: document.querySelector('[data-options]'),
      zipToggle: document.querySelector('[data-zip-toggle]'),
      convertButton: document.querySelector('[data-convert-button]'),
      status: document.querySelector('[data-status]'),
      progress: document.querySelector('[data-progress]'),
      outputList: document.querySelector('[data-output-list]')
    };
  }

  /**
   * Escribe un mensaje breve de estado.
   *
   * @param {object} refs Referencias DOM.
   * @param {string} message Mensaje visible.
   * @returns {void}
   */
  function setStatus(refs, message) {
    refs.status.textContent = message;
  }

  /**
   * Actualiza la barra de progreso.
   *
   * @param {object} refs Referencias DOM.
   * @param {number} done Elementos completados.
   * @param {number} total Elementos totales.
   * @returns {void}
   */
  function setProgress(refs, done, total) {
    var value = total ? Math.round((done / total) * 100) : 0;
    refs.progress.value = value;
  }

  /**
   * Lee el tema guardado en el navegador.
   *
   * @returns {string} Tema elegido o el oscuro por defecto.
   */
  function savedTheme() {
    try {
      var theme = global.localStorage.getItem('hormi-theme');
      return theme === 'light' ? 'light' : 'dark';
    } catch (_error) {
      return 'dark';
    }
  }

  /**
   * Guarda la preferencia de tema localmente.
   *
   * @param {string} theme Tema a persistir.
   * @returns {void}
   */
  function saveTheme(theme) {
    try {
      global.localStorage.setItem('hormi-theme', theme);
    } catch (_error) {
      // localStorage puede no estar disponible en algunos contextos file://.
    }
  }

  /**
   * Aplica el tema visual y actualiza el boton.
   *
   * @param {object} refs Referencias DOM.
   * @param {string} theme Tema deseado.
   * @returns {void}
   */
  function applyTheme(refs, theme) {
    var nextTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    refs.themeToggle.setAttribute(
      'aria-label',
      nextTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
    );
    refs.themeToggle.setAttribute('aria-pressed', nextTheme === 'light' ? 'true' : 'false');
    saveTheme(nextTheme);
  }

  /**
   * Alterna entre tema oscuro y claro.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function toggleTheme(refs) {
    var current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    applyTheme(refs, current === 'dark' ? 'light' : 'dark');
  }

  /**
   * Rellena el selector de formatos exportables.
   *
   * @param {HTMLSelectElement} select Selector destino.
   * @returns {void}
   */
  function populateFormats(select) {
    Hormi.Formats.all().forEach(function (format) {
      var option = document.createElement('option');
      option.value = format.id;
      option.textContent = format.name;
      select.appendChild(option);
    });
    select.value = state.formatId;
  }

  /**
   * Renderiza las opciones asociadas al formato actual.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function renderSelectedFormat(refs) {
    var format = Hormi.Formats.byId(state.formatId);
    refs.formatDescription.textContent = format.description;
    Hormi.UI.Options.renderFormatOptions(refs.options, format);
  }

  /**
   * Renderiza la galeria y los botones dependientes de estado.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function renderState(refs) {
    Hormi.UI.Gallery.renderImages(refs.imageList, state.rasters, function (id) {
      state.rasters = state.rasters.filter(function (raster) {
        return raster.id !== id;
      });
      renderState(refs);
    });
    refs.convertButton.disabled = state.rasters.length === 0;
    refs.clearButton.disabled = state.rasters.length === 0;
  }

  /**
   * Carga una lista de archivos seleccionados.
   *
   * @param {object} refs Referencias DOM.
   * @param {FileList|File[]} files Archivos recibidos.
   * @returns {Promise<void>} Promesa de carga.
   */
  async function loadFiles(refs, files) {
    var list = Array.from(files || []);
    if (!list.length) {
      return;
    }
    setProgress(refs, 0, list.length);
    for (var i = 0; i < list.length; i += 1) {
      setStatus(refs, 'Cargando ' + list[i].name);
      try {
        state.rasters.push(await Hormi.Conversion.FileLoader.loadFile(list[i]));
      } catch (error) {
        setStatus(refs, 'No se pudo cargar ' + list[i].name + ': ' + error.message);
      }
      setProgress(refs, i + 1, list.length);
      renderState(refs);
    }
    setStatus(refs, state.rasters.length + ' imagen(es) listas');
  }

  /**
   * Procesa el evento drop de archivos.
   *
   * @param {object} refs Referencias DOM.
   * @param {DragEvent} event Evento drop.
   * @returns {void}
   */
  function handleDrop(refs, event) {
    event.preventDefault();
    refs.dropZone.classList.remove('is-dragging');
    loadFiles(refs, event.dataTransfer.files);
  }

  /**
   * Activa el estado visual de arrastre.
   *
   * @param {object} refs Referencias DOM.
   * @param {DragEvent} event Evento drag.
   * @returns {void}
   */
  function handleDragOver(refs, event) {
    event.preventDefault();
    refs.dropZone.classList.add('is-dragging');
  }

  /**
   * Desactiva el estado visual de arrastre.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function handleDragLeave(refs) {
    refs.dropZone.classList.remove('is-dragging');
  }

  /**
   * Convierte y descarga las imagenes cargadas.
   *
   * @param {object} refs Referencias DOM.
   * @returns {Promise<void>} Promesa de conversion.
   */
  async function convertAndDownload(refs) {
    refs.convertButton.disabled = true;
    setProgress(refs, 0, state.rasters.length);
    setStatus(refs, 'Convirtiendo');
    refs.outputList.replaceChildren();

    try {
      var options = Hormi.UI.Options.readOptions(refs.options);
      var outputs = await Hormi.Conversion.Converter.convertMany(
        state.rasters,
        state.formatId,
        options,
        function (done, total, raster) {
          setProgress(refs, done, total);
          if (raster) {
            setStatus(refs, 'Convirtiendo ' + raster.name);
          }
        }
      );
      Hormi.UI.Gallery.renderOutputs(refs.outputList, outputs);
      if (refs.zipToggle.checked || outputs.length > 1) {
        var zip = await Hormi.Conversion.Converter.zipOutputs(outputs);
        Hormi.Conversion.Converter.downloadBlob(
          zip,
          Hormi.Conversion.Converter.zipName(state.rasters, state.formatId)
        );
      } else {
        Hormi.Conversion.Converter.downloadBlob(outputs[0].blob, outputs[0].name);
      }
      setProgress(refs, state.rasters.length, state.rasters.length);
      setStatus(refs, 'Exportacion completada');
    } catch (error) {
      setStatus(refs, 'Error: ' + error.message);
    } finally {
      refs.convertButton.disabled = state.rasters.length === 0;
    }
  }

  /**
   * Conecta eventos de la interfaz.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function bindEvents(refs) {
    refs.themeToggle.addEventListener('click', function () {
      toggleTheme(refs);
    });
    refs.pickButton.addEventListener('click', function () {
      refs.fileInput.click();
    });
    refs.fileInput.addEventListener('change', function () {
      loadFiles(refs, refs.fileInput.files);
      refs.fileInput.value = '';
    });
    refs.dropZone.addEventListener('drop', handleDrop.bind(null, refs));
    refs.dropZone.addEventListener('dragover', handleDragOver.bind(null, refs));
    refs.dropZone.addEventListener('dragleave', handleDragLeave.bind(null, refs));
    refs.formatSelect.addEventListener('change', function () {
      state.formatId = refs.formatSelect.value;
      renderSelectedFormat(refs);
    });
    refs.clearButton.addEventListener('click', function () {
      state.rasters = [];
      refs.outputList.replaceChildren();
      setProgress(refs, 0, 1);
      setStatus(refs, 'Lista vacia');
      renderState(refs);
    });
    refs.convertButton.addEventListener('click', function () {
      convertAndDownload(refs);
    });
  }

  /**
   * Arranca la aplicacion una vez cargado el DOM.
   *
   * @returns {void}
   */
  function init() {
    var refs = domRefs();
    applyTheme(refs, savedTheme());
    populateFormats(refs.formatSelect);
    renderSelectedFormat(refs);
    renderState(refs);
    bindEvents(refs);
    setStatus(refs, 'Preparado');
  }

  document.addEventListener('DOMContentLoaded', init);
}(globalThis));
