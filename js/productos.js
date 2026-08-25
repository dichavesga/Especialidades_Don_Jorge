// ============================================================
// productos.js — Consumo del catálogo (data/productos.json)
// simulando un API Rest interno, y construcción dinámica del DOM.
// Incluye la galería de imágenes integrada: cada tarjeta muestra la
// fotografía del producto y al hacer clic se amplía en un lightbox.
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

  function buildCard(producto, indice) {
    const presentaciones = producto.presentaciones.join(' · ');
    return `
      <article class="product-card" data-categoria="${producto.categoria}" data-index="${indice}">
        <div class="product-media">
          <img src="${producto.imagen}" alt="${producto.alt}" loading="lazy"
               onerror="this.classList.add('img-missing');">
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

  // ---------- Lightbox: galería de imágenes integrada ----------
  const $lightbox = $('#lightbox');
  if (!$lightbox.length) return;

  const $lbMedia = $('#lightboxMedia');
  const $lbCaption = $('#lightboxCaption');

  $fullGrid.on('click', '.product-card', function () {
    indiceActual = parseInt($(this).data('index'), 10);
    abrirLightbox(indiceActual);
  });

  function abrirLightbox(i) {
    const producto = visibles[i];
    if (!producto) return;
    $lbMedia.html('<img src="' + producto.imagen + '" alt="' + producto.alt + '">');
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
