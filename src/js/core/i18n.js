(function (global) {
  'use strict';

  var Hormi = global.Hormi;
  var storageKey = 'hormi-language';
  var fallbackLanguage = 'en';
  var supportedLanguages = ['en', 'es', 'fr'];
  var currentLanguage = fallbackLanguage;

  var messages = {
    en: {
      'app.aria': 'Image converter',
      'repo.aria': 'Official GitHub repository',
      'language.label': 'Language',
      'language.aria': 'Select interface language',
      'theme.toLight': 'Switch to light theme',
      'theme.toDark': 'Switch to dark theme',
      'action.clear': 'Clear',
      'action.convert': 'Convert',
      'manual.title': 'Quick manual',
      'manual.hint': 'View steps',
      'manual.step1': 'Drag one or more images into the input area or press <strong>Choose files</strong>.',
      'manual.step2': 'Select the output format in the export panel.',
      'manual.step3': 'Adjust format options such as resolution, quality, background, alpha, palette, or depth.',
      'manual.step4': 'Leave <strong>Keep original resolution</strong> enabled or disable it to change size.',
      'manual.step5': 'Leave <strong>Package as ZIP</strong> enabled if you want to download everything in a single file.',
      'manual.step6': 'Press <strong>Convert</strong> and wait for the download to finish.',
      'manual.body': 'The app runs locally. Native formats depend on the browser, and special formats use encoders included in the project.',
      'pane.input': 'Input',
      'pane.export': 'Export',
      'drop.title': 'Drop images',
      'drop.pick': 'Choose files',
      'loading.importing': 'Importing images',
      'field.format': 'Format',
      'zip.label': 'Package as ZIP',
      'status.ready': 'Ready',
      'status.loading': 'Loading {name}',
      'status.loadError': 'Could not load {name}: {message}',
      'status.imageReady': '{count} image ready',
      'status.imagesReady': '{count} images ready',
      'status.converting': 'Converting',
      'status.convertingFile': 'Converting {name}',
      'status.done': 'Export complete',
      'status.error': 'Error: {message}',
      'status.empty': 'Empty list',
      'gallery.empty': 'No images loaded',
      'gallery.remove': 'Remove',
      'options.empty': 'No additional options',

      'option.quality': 'Quality',
      'option.background': 'Alpha background',
      'option.flattenAlpha': 'Flatten transparency',
      'option.keepResolution': 'Keep original resolution',
      'option.resizeMode': 'Resolution mode',
      'option.resizeWidth': 'Width',
      'option.resizeHeight': 'Height',
      'option.resizePercent': 'Percentage',
      'option.resizeFilter': 'Scale filter',
      'option.paletteColors': 'Palette colors',
      'option.transparency': 'Transparency',
      'option.alphaThreshold': 'Alpha threshold',
      'option.multiImageOutput': 'Multiple-image output',
      'option.loop': 'Loop',
      'option.canvasMode': 'Animation canvas',
      'option.frameWidth': 'Custom width',
      'option.frameHeight': 'Custom height',
      'option.fitMode': 'Frame fit',
      'option.bitDepth': 'Bit depth',
      'option.icoSize': 'ICO size',
      'option.alpha': 'Alpha',
      'option.dpi': 'DPI',
      'option.origin': 'Origin',
      'option.colorspace': 'Color space',
      'option.asciiP3': 'ASCII P3',
      'option.asciiP2': 'ASCII P2',
      'option.asciiP1': 'ASCII P1',
      'option.threshold': 'Black/white threshold',
      'option.variableName': 'C variable',
      'option.title': 'Title',

      'choice.exact': 'Exact width and height',
      'choice.width': 'Proportional width',
      'choice.height': 'Proportional height',
      'choice.percent': 'By percentage',
      'choice.smooth': 'Smooth',
      'choice.nearest': 'Pixel art',
      'choice.gifAnimation': 'One animated GIF',
      'choice.gifIndividual': 'Individual GIFs',
      'choice.infinite': 'Infinite',
      'choice.once': 'Once',
      'choice.3Repeats': '3 repeats',
      'choice.5Repeats': '5 repeats',
      'choice.10Repeats': '10 repeats',
      'choice.largest': 'Largest image',
      'choice.first': 'First image',
      'choice.custom': 'Custom',
      'choice.contain': 'Contain full image',
      'choice.cover': 'Cover and crop',
      'choice.stretch': 'Stretch',
      'choice.center': 'Center without scaling',
      'choice.24Rgb': '24-bit RGB',
      'choice.32Rgba': '32-bit RGBA',
      'choice.currentResolution': 'Current resolution',
      'choice.flattenBackground': 'Flatten against background',
      'choice.preserveAlpha': 'Save alpha channel',
      'choice.topLeft': 'Top left',
      'choice.bottomLeft': 'Bottom left',
      'choice.srgbAlpha': 'sRGB with linear alpha',
      'choice.linear': 'Linear',

      'format.png.description': 'Lossless, full alpha, ideal for screenshots and UI.',
      'format.jpeg.description': 'Lossy, no transparency, recommended for photography.',
      'format.webp.description': 'Modern format with alpha and efficient compression.',
      'format.avif.description': 'Modern lossy format; browser support required.',
      'format.gif.description': 'Static or animated GIF89a with indexed palette.',
      'format.bmp.description': 'Uncompressed Windows bitmap.',
      'format.ico.description': 'Single-resolution Windows icon.',
      'format.tiff.description': 'Uncompressed baseline TIFF.',
      'format.tga.description': 'Uncompressed Targa, useful in graphics pipelines.',
      'format.qoi.description': 'Quite OK Image, lossless and very simple.',
      'format.ppm.description': 'Portable Pixmap RGB.',
      'format.pgm.description': 'Portable Graymap grayscale.',
      'format.pbm.description': 'Portable Bitmap monochrome.',
      'format.xpm.description': 'C-style textual pixmap with palette.',
      'format.svg.description': 'SVG with the PNG image embedded in base64.'
    },
    es: {
      'app.aria': 'Conversor de imagenes',
      'repo.aria': 'Repositorio oficial en GitHub',
      'language.label': 'Idioma',
      'language.aria': 'Seleccionar idioma de la interfaz',
      'theme.toLight': 'Cambiar a tema claro',
      'theme.toDark': 'Cambiar a tema oscuro',
      'action.clear': 'Vaciar',
      'action.convert': 'Convertir',
      'manual.title': 'Manual rapido',
      'manual.hint': 'Ver pasos',
      'manual.step1': 'Arrastra una o varias imagenes a la zona de entrada o pulsa <strong>Elegir archivos</strong>.',
      'manual.step2': 'Selecciona el formato de salida en el panel de exportacion.',
      'manual.step3': 'Ajusta las opciones del formato, como resolucion, calidad, fondo, alfa, paleta o profundidad.',
      'manual.step4': 'Deja <strong>Mantener resolucion original</strong> activo o desmarcalo para cambiar tamano.',
      'manual.step5': 'Deja <strong>Empaquetar en ZIP</strong> activo si quieres descargar todo en un unico archivo.',
      'manual.step6': 'Pulsa <strong>Convertir</strong> y espera a que termine la descarga.',
      'manual.body': 'La app funciona localmente. Los formatos nativos dependen del navegador y los formatos especiales usan codificadores incluidos en el proyecto.',
      'pane.input': 'Entrada',
      'pane.export': 'Exportacion',
      'drop.title': 'Soltar imagenes',
      'drop.pick': 'Elegir archivos',
      'loading.importing': 'Importando imagenes',
      'field.format': 'Formato',
      'zip.label': 'Empaquetar en ZIP',
      'status.ready': 'Preparado',
      'status.loading': 'Cargando {name}',
      'status.loadError': 'No se pudo cargar {name}: {message}',
      'status.imageReady': '{count} imagen lista',
      'status.imagesReady': '{count} imagenes listas',
      'status.converting': 'Convirtiendo',
      'status.convertingFile': 'Convirtiendo {name}',
      'status.done': 'Exportacion completada',
      'status.error': 'Error: {message}',
      'status.empty': 'Lista vacia',
      'gallery.empty': 'Sin imagenes cargadas',
      'gallery.remove': 'Quitar',
      'options.empty': 'Sin opciones adicionales',

      'option.quality': 'Calidad',
      'option.background': 'Fondo para alfa',
      'option.flattenAlpha': 'Aplanar transparencia',
      'option.keepResolution': 'Mantener resolucion original',
      'option.resizeMode': 'Modo de resolucion',
      'option.resizeWidth': 'Ancho',
      'option.resizeHeight': 'Alto',
      'option.resizePercent': 'Porcentaje',
      'option.resizeFilter': 'Filtro de escala',
      'option.paletteColors': 'Colores de paleta',
      'option.transparency': 'Transparencia',
      'option.alphaThreshold': 'Umbral alfa',
      'option.multiImageOutput': 'Salida con varias imagenes',
      'option.loop': 'Bucle',
      'option.canvasMode': 'Lienzo animado',
      'option.frameWidth': 'Ancho personalizado',
      'option.frameHeight': 'Alto personalizado',
      'option.fitMode': 'Ajuste de fotograma',
      'option.bitDepth': 'Profundidad',
      'option.icoSize': 'Tamano ICO',
      'option.alpha': 'Alfa',
      'option.dpi': 'DPI',
      'option.origin': 'Origen',
      'option.colorspace': 'Espacio de color',
      'option.asciiP3': 'ASCII P3',
      'option.asciiP2': 'ASCII P2',
      'option.asciiP1': 'ASCII P1',
      'option.threshold': 'Umbral blanco/negro',
      'option.variableName': 'Variable C',
      'option.title': 'Titulo',

      'choice.exact': 'Ancho y alto exactos',
      'choice.width': 'Ancho proporcional',
      'choice.height': 'Alto proporcional',
      'choice.percent': 'Por porcentaje',
      'choice.smooth': 'Suavizado',
      'choice.nearest': 'Pixel art',
      'choice.gifAnimation': 'Un GIF animado',
      'choice.gifIndividual': 'GIF individuales',
      'choice.infinite': 'Infinito',
      'choice.once': 'Una vez',
      'choice.3Repeats': '3 repeticiones',
      'choice.5Repeats': '5 repeticiones',
      'choice.10Repeats': '10 repeticiones',
      'choice.largest': 'Mayor imagen',
      'choice.first': 'Primera imagen',
      'choice.custom': 'Personalizado',
      'choice.contain': 'Encajar completo',
      'choice.cover': 'Cubrir y recortar',
      'choice.stretch': 'Estirar',
      'choice.center': 'Centrar sin escalar',
      'choice.24Rgb': '24 bits RGB',
      'choice.32Rgba': '32 bits RGBA',
      'choice.currentResolution': 'Resolucion actual',
      'choice.flattenBackground': 'Aplanar contra fondo',
      'choice.preserveAlpha': 'Guardar canal alfa',
      'choice.topLeft': 'Arriba izquierda',
      'choice.bottomLeft': 'Abajo izquierda',
      'choice.srgbAlpha': 'sRGB con alfa lineal',
      'choice.linear': 'Lineal',

      'format.png.description': 'Sin perdida, alfa completo, ideal para capturas e interfaz.',
      'format.jpeg.description': 'Con perdida, sin transparencia, recomendado para fotografia.',
      'format.webp.description': 'Formato moderno con alfa y compresion eficiente.',
      'format.avif.description': 'Formato moderno con perdida; depende del navegador.',
      'format.gif.description': 'GIF89a estatico o animado con paleta indexada.',
      'format.bmp.description': 'Mapa de bits Windows sin compresion.',
      'format.ico.description': 'Icono Windows de una resolucion.',
      'format.tiff.description': 'TIFF baseline sin compresion.',
      'format.tga.description': 'Targa sin compresion, util en pipelines graficos.',
      'format.qoi.description': 'Quite OK Image, sin perdida y muy simple.',
      'format.ppm.description': 'Portable Pixmap RGB.',
      'format.pgm.description': 'Portable Graymap en escala de grises.',
      'format.pbm.description': 'Portable Bitmap monocromo.',
      'format.xpm.description': 'Pixmap textual C-style con paleta.',
      'format.svg.description': 'SVG con la imagen PNG embebida en base64.'
    },
    fr: {
      'app.aria': 'Convertisseur d images',
      'repo.aria': 'Depot GitHub officiel',
      'language.label': 'Langue',
      'language.aria': 'Selectionner la langue de l interface',
      'theme.toLight': 'Passer au theme clair',
      'theme.toDark': 'Passer au theme sombre',
      'action.clear': 'Vider',
      'action.convert': 'Convertir',
      'manual.title': 'Guide rapide',
      'manual.hint': 'Voir les etapes',
      'manual.step1': 'Glissez une ou plusieurs images dans la zone d entree ou appuyez sur <strong>Choisir des fichiers</strong>.',
      'manual.step2': 'Selectionnez le format de sortie dans le panneau d export.',
      'manual.step3': 'Reglez les options du format, comme la resolution, la qualite, le fond, l alpha, la palette ou la profondeur.',
      'manual.step4': 'Gardez <strong>Conserver la resolution d origine</strong> active ou desactivez-la pour changer la taille.',
      'manual.step5': 'Gardez <strong>Regrouper en ZIP</strong> actif si vous voulez tout telecharger dans un seul fichier.',
      'manual.step6': 'Appuyez sur <strong>Convertir</strong> et attendez la fin du telechargement.',
      'manual.body': 'L app fonctionne localement. Les formats natifs dependent du navigateur et les formats speciaux utilisent les encodeurs inclus dans le projet.',
      'pane.input': 'Entree',
      'pane.export': 'Export',
      'drop.title': 'Deposer des images',
      'drop.pick': 'Choisir des fichiers',
      'loading.importing': 'Importation des images',
      'field.format': 'Format',
      'zip.label': 'Regrouper en ZIP',
      'status.ready': 'Pret',
      'status.loading': 'Chargement de {name}',
      'status.loadError': 'Impossible de charger {name}: {message}',
      'status.imageReady': '{count} image prete',
      'status.imagesReady': '{count} images pretes',
      'status.converting': 'Conversion',
      'status.convertingFile': 'Conversion de {name}',
      'status.done': 'Export termine',
      'status.error': 'Erreur : {message}',
      'status.empty': 'Liste vide',
      'gallery.empty': 'Aucune image chargee',
      'gallery.remove': 'Retirer',
      'options.empty': 'Aucune option supplementaire',

      'option.quality': 'Qualite',
      'option.background': 'Fond pour alpha',
      'option.flattenAlpha': 'Aplatir la transparence',
      'option.keepResolution': 'Conserver la resolution d origine',
      'option.resizeMode': 'Mode de resolution',
      'option.resizeWidth': 'Largeur',
      'option.resizeHeight': 'Hauteur',
      'option.resizePercent': 'Pourcentage',
      'option.resizeFilter': 'Filtre de mise a l echelle',
      'option.paletteColors': 'Couleurs de palette',
      'option.transparency': 'Transparence',
      'option.alphaThreshold': 'Seuil alpha',
      'option.multiImageOutput': 'Sortie multi-images',
      'option.loop': 'Boucle',
      'option.canvasMode': 'Canevas anime',
      'option.frameWidth': 'Largeur personnalisee',
      'option.frameHeight': 'Hauteur personnalisee',
      'option.fitMode': 'Ajustement de l image',
      'option.bitDepth': 'Profondeur',
      'option.icoSize': 'Taille ICO',
      'option.alpha': 'Alpha',
      'option.dpi': 'DPI',
      'option.origin': 'Origine',
      'option.colorspace': 'Espace couleur',
      'option.asciiP3': 'ASCII P3',
      'option.asciiP2': 'ASCII P2',
      'option.asciiP1': 'ASCII P1',
      'option.threshold': 'Seuil noir/blanc',
      'option.variableName': 'Variable C',
      'option.title': 'Titre',

      'choice.exact': 'Largeur et hauteur exactes',
      'choice.width': 'Largeur proportionnelle',
      'choice.height': 'Hauteur proportionnelle',
      'choice.percent': 'Par pourcentage',
      'choice.smooth': 'Lissage',
      'choice.nearest': 'Pixel art',
      'choice.gifAnimation': 'Un GIF anime',
      'choice.gifIndividual': 'GIF individuels',
      'choice.infinite': 'Infini',
      'choice.once': 'Une fois',
      'choice.3Repeats': '3 repetitions',
      'choice.5Repeats': '5 repetitions',
      'choice.10Repeats': '10 repetitions',
      'choice.largest': 'Image la plus grande',
      'choice.first': 'Premiere image',
      'choice.custom': 'Personnalise',
      'choice.contain': 'Image entiere',
      'choice.cover': 'Couvrir et recadrer',
      'choice.stretch': 'Etirer',
      'choice.center': 'Centrer sans mise a l echelle',
      'choice.24Rgb': '24 bits RGB',
      'choice.32Rgba': '32 bits RGBA',
      'choice.currentResolution': 'Resolution actuelle',
      'choice.flattenBackground': 'Aplatir sur le fond',
      'choice.preserveAlpha': 'Conserver le canal alpha',
      'choice.topLeft': 'En haut a gauche',
      'choice.bottomLeft': 'En bas a gauche',
      'choice.srgbAlpha': 'sRGB avec alpha lineaire',
      'choice.linear': 'Lineaire',

      'format.png.description': 'Sans perte, alpha complet, ideal pour captures et interface.',
      'format.jpeg.description': 'Avec perte, sans transparence, recommande pour la photo.',
      'format.webp.description': 'Format moderne avec alpha et compression efficace.',
      'format.avif.description': 'Format moderne avec perte ; depend du navigateur.',
      'format.gif.description': 'GIF89a statique ou anime avec palette indexee.',
      'format.bmp.description': 'Bitmap Windows sans compression.',
      'format.ico.description': 'Icone Windows avec une resolution.',
      'format.tiff.description': 'TIFF baseline sans compression.',
      'format.tga.description': 'Targa sans compression, utile dans les pipelines graphiques.',
      'format.qoi.description': 'Quite OK Image, sans perte et tres simple.',
      'format.ppm.description': 'Portable Pixmap RGB.',
      'format.pgm.description': 'Portable Graymap en niveaux de gris.',
      'format.pbm.description': 'Portable Bitmap monochrome.',
      'format.xpm.description': 'Pixmap textuel style C avec palette.',
      'format.svg.description': 'SVG avec l image PNG integree en base64.'
    }
  };

  /**
   * Normaliza un codigo de idioma soportado.
   *
   * @param {string} language Idioma candidato.
   * @returns {string} Idioma valido.
   */
  function normalize(language) {
    return supportedLanguages.indexOf(language) === -1 ? fallbackLanguage : language;
  }

  /**
   * Sustituye parametros simples en una cadena traducida.
   *
   * @param {string} text Texto base.
   * @param {object} params Parametros.
   * @returns {string} Texto interpolado.
   */
  function interpolate(text, params) {
    var output = text;
    Object.keys(params || {}).forEach(function (key) {
      output = output.replace(new RegExp('\\{' + key + '\\}', 'g'), params[key]);
    });
    return output;
  }

  /**
   * Traduce una clave.
   *
   * @param {string} key Clave de traduccion.
   * @param {object} params Parametros opcionales.
   * @param {string} fallback Texto alternativo.
   * @returns {string} Texto traducido.
   */
  function t(key, params, fallback) {
    var languageMessages = messages[currentLanguage] || messages[fallbackLanguage];
    var text = languageMessages[key] || messages[fallbackLanguage][key] || fallback || key || '';
    return interpolate(text, params);
  }

  /**
   * Lee el idioma guardado en el navegador.
   *
   * @returns {string} Idioma guardado o ingles por defecto.
   */
  function savedLanguage() {
    try {
      return normalize(global.localStorage.getItem(storageKey));
    } catch (_error) {
      return fallbackLanguage;
    }
  }

  /**
   * Guarda el idioma elegido.
   *
   * @param {string} language Idioma a persistir.
   * @returns {void}
   */
  function saveLanguage(language) {
    try {
      global.localStorage.setItem(storageKey, language);
    } catch (_error) {
      // localStorage puede no estar disponible en algunos contextos file://.
    }
  }

  /**
   * Cambia el idioma activo.
   *
   * @param {string} language Idioma elegido.
   * @param {boolean} persist Si debe persistirse.
   * @returns {string} Idioma aplicado.
   */
  function setLanguage(language, persist) {
    currentLanguage = normalize(language);
    if (global.document && global.document.documentElement) {
      global.document.documentElement.lang = currentLanguage;
    }
    if (persist !== false) {
      saveLanguage(currentLanguage);
    }
    return currentLanguage;
  }

  /**
   * Traduce los nodos anotados con atributos data-i18n.
   *
   * @param {Document|HTMLElement} root Raiz a traducir.
   * @returns {void}
   */
  function translateDocument(root) {
    var scope = root || global.document;
    if (!scope || !scope.querySelectorAll) {
      return;
    }
    scope.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.dataset.i18n);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (node) {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    scope.querySelectorAll('[data-i18n-aria-label]').forEach(function (node) {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
  }

  Hormi.I18n = {
    current: function () {
      return currentLanguage;
    },
    savedLanguage: savedLanguage,
    setLanguage: setLanguage,
    t: t,
    translateDocument: translateDocument
  };
}(globalThis));
