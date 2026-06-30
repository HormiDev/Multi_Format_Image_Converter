(function (global) {
  'use strict';

  var Hormi = global.Hormi;

  var state = {
    rasters: [],
    formatId: 'png',
    statusKey: 'status.ready',
    statusParams: {}
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
      loadingIndicator: document.querySelector('[data-loading-indicator]'),
      languageControl: document.querySelector('[data-language-control]'),
      languageSelect: document.querySelector('[data-language-select]'),
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
   * @param {string} key Clave de traduccion.
   * @param {object} params Parametros del mensaje.
   * @returns {void}
   */
  function setStatus(refs, key, params) {
    state.statusKey = key;
    state.statusParams = params || {};
    refs.status.textContent = Hormi.I18n.t(state.statusKey, state.statusParams);
  }

  /**
   * Vuelve a traducir el ultimo mensaje de estado.
   *
   * @param {object} refs Referencias DOM.
   * @returns {void}
   */
  function renderStatus(refs) {
    refs.status.textContent = Hormi.I18n.t(state.statusKey, state.statusParams);
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
   * Espera a que el navegador tenga ocasion de pintar cambios visuales.
   *
   * @returns {Promise<void>} Promesa resuelta en el siguiente repintado.
   */
  function nextPaint() {
    return new Promise(function (resolve) {
      if (typeof global.requestAnimationFrame === 'function') {
        global.requestAnimationFrame(function () {
          resolve();
        });
        return;
      }
      global.setTimeout(resolve, 0);
    });
  }

  /**
   * Activa o desactiva el estado visual de importacion.
   *
   * @param {object} refs Referencias DOM.
   * @param {boolean} importing Si hay una importacion activa.
   * @returns {void}
   */
  function setImporting(refs, importing) {
    refs.dropZone.classList.toggle('is-loading', importing);
    refs.dropZone.setAttribute('aria-busy', importing ? 'true' : 'false');
    refs.fileInput.disabled = importing;
    refs.pickButton.disabled = importing;
    if (refs.loadingIndicator) {
      refs.loadingIndicator.hidden = !importing;
    }
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
      Hormi.I18n.t(nextTheme === 'dark' ? 'theme.toLight' : 'theme.toDark')
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
   * @param {object} values Valores de opciones ya elegidos.
   * @returns {void}
   */
  function renderSelectedFormat(refs, values) {
    var format = Hormi.Formats.byId(state.formatId);
    refs.formatDescription.textContent = Hormi.I18n.t(format.descriptionKey, null, format.description);
    Hormi.UI.Options.renderFormatOptions(refs.options, format, values);
  }

  /**
   * Mueve una imagen cargada a otra posicion.
   *
   * @param {string} sourceId Imagen arrastrada.
   * @param {string} targetId Imagen destino.
   * @param {string} placement Posicion relativa al destino.
   * @returns {void}
   */
  function moveRaster(sourceId, targetId, placement) {
    var from = state.rasters.findIndex(function (raster) {
      return raster.id === sourceId;
    });
    var to = state.rasters.findIndex(function (raster) {
      return raster.id === targetId;
    });
    var moved;
    if (from === -1 || to === -1 || from === to) {
      return;
    }
    moved = state.rasters.splice(from, 1)[0];
    if (from < to) {
      to -= 1;
    }
    if (placement === 'after') {
      to += 1;
    }
    state.rasters.splice(to, 0, moved);
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
    }, function (sourceId, targetId, placement) {
      moveRaster(sourceId, targetId, placement);
      renderState(refs);
    });
    refs.convertButton.disabled = state.rasters.length === 0;
    refs.clearButton.disabled = state.rasters.length === 0;
  }

  /**
   * Aplica el idioma visual y vuelve a pintar los textos dinamicos.
   *
   * @param {object} refs Referencias DOM.
   * @param {string} language Idioma elegido.
   * @param {boolean} persist Si debe persistirse.
   * @returns {void}
   */
  function applyLanguage(refs, language, persist) {
    var optionValues = Hormi.UI.Options.readOptions(refs.options);
    var nextLanguage = Hormi.I18n.setLanguage(language, persist);
    if (refs.languageSelect) {
      refs.languageSelect.value = nextLanguage;
    }
    if (refs.languageControl) {
      refs.languageControl.dataset.language = nextLanguage;
    }
    Hormi.I18n.translateDocument(document);
    applyTheme(refs, document.documentElement.dataset.theme);
    renderSelectedFormat(refs, optionValues);
    renderState(refs);
    renderStatus(refs);
  }

  /**
   * Elige la clave de estado correcta para una cantidad de imagenes.
   *
   * @param {number} count Cantidad de imagenes listas.
   * @returns {string} Clave de traduccion.
   */
  function imagesReadyKey(count) {
    return count === 1 ? 'status.imageReady' : 'status.imagesReady';
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
    setImporting(refs, true);
    try {
      for (var i = 0; i < list.length; i += 1) {
        setStatus(refs, 'status.loading', { name: list[i].name });
        await nextPaint();
        try {
          var loader = Hormi.Conversion.FileLoader;
          var rasters = loader.loadFileRasters
            ? await loader.loadFileRasters(list[i])
            : [await loader.loadFile(list[i])];
          state.rasters = state.rasters.concat(rasters);
        } catch (error) {
          setStatus(refs, 'status.loadError', { name: list[i].name, message: error.message });
        }
        setProgress(refs, i + 1, list.length);
        renderState(refs);
      }
    } finally {
      setImporting(refs, false);
    }
    setStatus(refs, imagesReadyKey(state.rasters.length), { count: state.rasters.length });
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
    setStatus(refs, 'status.converting');
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
            setStatus(refs, 'status.convertingFile', { name: raster.name });
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
      setStatus(refs, 'status.done');
    } catch (error) {
      setStatus(refs, 'status.error', { message: error.message });
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
    refs.languageSelect.addEventListener('change', function () {
      applyLanguage(refs, refs.languageSelect.value, true);
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
      setStatus(refs, 'status.empty');
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
    applyLanguage(refs, Hormi.I18n.savedLanguage(), false);
    bindEvents(refs);
    renderStatus(refs);
  }

  document.addEventListener('DOMContentLoaded', init);
}(globalThis));
