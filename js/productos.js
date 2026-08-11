// ============================================================
// productos.js — Consumo del catálogo (data/productos.json)
// simulando un API Rest interno, y construcción dinámica del DOM.
// Usa jQuery para manipular el DOM ($.getJSON, $.each, .html()).
// ============================================================

$(function () {
  const $featured = $('#featuredProducts');   // Home: solo destacados
  const $fullGrid = $('#allProducts');         // productos.html: catálogo completo

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
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <span class="price-tag">${presentaciones}</span>
        </div>
      </article>`;
  }

  $.getJSON('data/productos.json')
    .done(function (productos) {
      if ($featured.length) {
        const destacados = productos.filter(function (p) { return p.destacado; });
        let html = '';
        $.each(destacados, function (i, producto) {
          html += buildCard(producto);
        });
        $featured.html(html);
      }

      if ($fullGrid.length) {
        let html = '';
        $.each(productos, function (i, producto) {
          html += buildCard(producto);
        });
        $fullGrid.html(html);
        $fullGrid.data('productos', productos); // guardado para el filtro por categoría
      }
    })
    .fail(function () {
      const errorMsg = '<p class="eyebrow">No se pudo cargar el catálogo en este momento.</p>';
      if ($featured.length) $featured.html(errorMsg);
      if ($fullGrid.length) $fullGrid.html(errorMsg);
    });
});
