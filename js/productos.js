// ============================================================
// productos.js — Consumo del catálogo (data/productos.json)
// simulando un API Rest interno, y construcción dinámica del DOM.
// Usa jQuery para manipular el DOM ($.getJSON, $.each, .html(),
// filtros de categoría) — Home (destacados) y catalogo.html (todos).
// ============================================================

$(function () {
  const $featured = $('#featuredProducts');   // Home: solo destacados
  const $fullGrid = $('#allProducts');         // catalogo.html: catálogo completo
  const $filters = $('#catalogFilters');       // catalogo.html: chips de categoría
  const $count = $('#catalogCount');           // catalogo.html: contador de resultados

  if (!$featured.length && !$fullGrid.length) return;

  // Icono genérico de "corte" para las tarjetas (SVG propio, sin fotos de terceros)
  const sliceIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
      <ellipse cx="12" cy="12" rx="8" ry="5"/>
      <path d="M6 12c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5"/>
    </svg>`;

  function buildCard(producto) {
    const presentaciones = producto.presentaciones.join(' · ');
    return `
      <article class="product-card" data-categoria="${producto.categoria}">
        <div class="photo-slot" aria-hidden="true">
          ${sliceIcon}
          <span>${producto.nombre} — foto pendiente</span>
        </div>
        <div class="product-card-body">
          <span class="eyebrow">${producto.categoria}</span>
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <span class="price-tag">${presentaciones}</span>
        </div>
      </article>`;
  }

  function updateCount(visible, total) {
    if (!$count.length) return;
    $count.text(visible + ' de ' + total + ' productos');
  }

  function applyFilter(categoria) {
    const $cards = $fullGrid.children('.product-card');
    let visible = 0;
    $cards.each(function () {
      const match = categoria === 'todos' || $(this).data('categoria') === categoria;
      $(this).toggle(match);
      if (match) visible++;
    });
    updateCount(visible, $cards.length);
  }

  $.getJSON('data/productos.json')
    .done(function (productos) {
      // ---- Home: solo destacados ----
      if ($featured.length) {
        const destacados = productos.filter(function (p) { return p.destacado; });
        let html = '';
        $.each(destacados, function (i, producto) {
          html += buildCard(producto);
        });
        $featured.html(html);
      }

      // ---- Catálogo completo ----
      if ($fullGrid.length) {
        let html = '';
        $.each(productos, function (i, producto) {
          html += buildCard(producto);
        });
        $fullGrid.html(html);

        // Chips de categoría, generados a partir de las categorías únicas del JSON
        if ($filters.length) {
          const categorias = [];
          $.each(productos, function (i, producto) {
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
            $filters.find('.filter-chip').removeClass('active');
            $(this).addClass('active');
            applyFilter($(this).data('filter'));
          });
        }

        updateCount(productos.length, productos.length);
      }
    })
    .fail(function () {
      const errorMsg = '<p class="eyebrow">No se pudo cargar el catálogo en este momento.</p>';
      if ($featured.length) $featured.html(errorMsg);
      if ($fullGrid.length) $fullGrid.html(errorMsg);
    });
});