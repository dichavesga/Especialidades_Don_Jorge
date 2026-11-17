// ============================================================
// productos.js — Consumo del catálogo (data/productos.json)
// simulando un API Rest interno, y construcción dinámica del DOM.
// Incluye la galería de imágenes integrada: cada tarjeta muestra la
// fotografía del producto y al hacer clic se amplía en un lightbox.
// Los productos con "imagenes" (2 o más) muestran un slider.
// Usa jQuery para todas las operaciones sobre el DOM.
// ============================================================

$(function () {
  const $featured = $('#featuredProducts');   // Home: solo destacados
  const $fullGrid = $('#allProducts');         // catalogo.html: catálogo completo
  const $filters = $('#catalogFilters');       // catalogo.html: chips de categoría
  const $count = $('#catalogCount');           // catalogo.html: contador de resultados

  if (!$featured.length && !$fullGrid.length) return;

  let productos = [];   // dataset completo
  let visibles = [];    // dataset filtrado (para navegar en el lightbox)
  let indiceActual = 0;

  // Icono de respaldo mientras no exista la fotografía real
  const sliceIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
      <ellipse cx="12" cy="12" rx="8" ry="5"/>
      <path d="M6 12c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5"/>
    </svg>`;

  // NUEVO: genera la imagen simple o el slider según el producto
  function buildImagen(producto) {
    if (producto.imagenes && producto.imagenes.length > 1) {
      const imgs = producto.imagenes.map(function (src) {
        return `<img src="${src}" alt="${producto.alt}" loading="lazy"
                     onerror="this.classList.add('img-missing');">`;
      }).join('');
      const dots = producto.imagenes.map(function (_, i) {
        return `<span class="${i === 0 ? 'active' : ''}"></span>`;
      }).join('');

      return `
        <div class="slider" data-index="0">
          <div class="slider-pista">${imgs}</div>
          <button class="slider-btn prev" type="button" aria-label="Imagen anterior">&#10094;</button>
          <button class="slider-btn next" type="button" aria-label="Imagen siguiente">&#10095;</button>
          <div class="slider-dots">${dots}</div>
        </div>`;
    }

    return `
      <img src="${producto.imagen}" alt="${producto.alt}" loading="lazy"
           onerror="this.classList.add('img-missing');">`;
  }

  function buildCard(producto, indice) {
    const presentaciones = producto.presentaciones.join(' · ');
    return `
      <article class="product-card" data-categoria="${producto.categoria}" data-index="${indice}">
        <div class="product-media">
          ${buildImagen(producto)}
          <div class="product-fallback">
            ${sliceIcon}
            <span>Foto pendiente</span>
          </div>
          <span class="zoom-hint" aria-hidden="true">Ampliar</span>
        </div>
        <div class="product-card-body">
          <span class="eyebrow">${producto.categoria}</span>
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <span class="price-tag">${presentaciones}</span>
        </div>
      </article>`;
  }

  function renderGrid($destino, lista) {
    let html = '';
    $.each(lista, function (i, producto) {
      html += buildCard(producto, i);
    });
    $destino.html(html);
  }

  function actualizarContador(visible, total) {
    if ($count.length) $count.text(visible + ' de ' + total + ' productos');
  }

  // ---------- Carga del catálogo ----------
  $.getJSON('data/productos.json')
    .done(function (data) {
      productos = data;
      visibles = data;

      // Home: solo los destacados
      if ($featured.length) {
        const destacados = data.filter(function (p) { return p.destacado; });
        renderGrid($featured, destacados);
      }

      // Catálogo completo
      if ($fullGrid.length) {
        renderGrid($fullGrid, data);
        construirFiltros(data);
        actualizarContador(data.length, data.length);
      }
    })
    .fail(function () {
      const errorMsg = '<p class="eyebrow">No se pudo cargar el catálogo en este momento.</p>';
      if ($featured.length) $featured.html(errorMsg);
      if ($fullGrid.length) $fullGrid.html(errorMsg);
    });

  // ---------- Filtros por categoría ----------
  function construirFiltros(data) {
    if (!$filters.length) return;

    const categorias = [];
    $.each(data, function (i, producto) {
      if ($.inArray(producto.categoria, categorias) === -1) {
        categorias.push(producto.categoria);
      }
    });

    $.each(categorias, function (i, categoria) {
      $('<button/>', {
        type: 'button',
        class: 'filter-chip',
        text: categoria,
        'data-filter': categoria
      }).appendTo($filters);
    });

    $filters.on('click', '.filter-chip', function () {
      const filtro = $(this).data('filter');
      $filters.find('.filter-chip').removeClass('active');
      $(this).addClass('active');

      visibles = (filtro === 'todos')
        ? productos
        : productos.filter(function (p) { return p.categoria === filtro; });

      renderGrid($fullGrid, visibles);
      actualizarContador(visibles.length, productos.length);
    });
  }

  // ---------- NUEVO: flechas del slider (home y catálogo) ----------
  // Va ANTES del clic de la tarjeta para poder detenerlo.
  $featured.add($fullGrid).on('click', '.slider-btn', function (e) {
    e.stopPropagation();  // evita que se abra el lightbox al usar las flechas

    const $slider = $(this).closest('.slider');
    const total = $slider.find('.slider-pista img').length;
    let i = parseInt($slider.attr('data-index'), 10);

    i = $(this).hasClass('next') ? (i + 1) % total : (i - 1 + total) % total;

    $slider.attr('data-index', i);
    $slider.find('.slider-pista').css('transform', 'translateX(-' + (i * 100) + '%)');
    $slider.find('.slider-dots span').removeClass('active').eq(i).addClass('active');
  });

  // ---------- Lightbox: galería de imágenes integrada ----------
  const $lightbox = $('#lightbox');
  if (!$lightbox.length) return;

  const $lbMedia = $('#lightboxMedia');
  const $lbCaption = $('#lightboxCaption');

  $fullGrid.on('click', '.product-card', function () {
    indiceActual = parseInt($(this).data('index'), 10);
    // NUEVO: si hay slider, se amplía la imagen que se está viendo
    const $slider = $(this).find('.slider');
    const imgIndex = $slider.length ? parseInt($slider.attr('data-index'), 10) : 0;
    abrirLightbox(indiceActual, imgIndex);
  });

  function abrirLightbox(i, imgIndex) {
    const producto = visibles[i];
    if (!producto) return;
    const src = (producto.imagenes && producto.imagenes.length > 1)
      ? producto.imagenes[imgIndex || 0]
      : producto.imagen;
    $lbMedia.html('<img src="' + src + '" alt="' + producto.alt + '">');
    $lbCaption.text(producto.nombre + ' — ' + producto.presentaciones.join(' · '));
    $lightbox.addClass('open');
    $('body').css('overflow', 'hidden');
  }

  function cerrarLightbox() {
    $lightbox.removeClass('open');
    $lbMedia.empty();
    $('body').css('overflow', '');
  }

  function navegar(paso) {
    indiceActual = (indiceActual + paso + visibles.length) % visibles.length;
    abrirLightbox(indiceActual);
  }

  $('#lightboxClose').on('click', cerrarLightbox);
  $('#lightboxPrev').on('click', function () { navegar(-1); });
  $('#lightboxNext').on('click', function () { navegar(1); });
  $lightbox.on('click', function (e) {
    if (e.target === this) cerrarLightbox();
  });
  $(document).on('keydown', function (e) {
    if (!$lightbox.hasClass('open')) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowLeft') navegar(-1);
    if (e.key === 'ArrowRight') navegar(1);
  });
});