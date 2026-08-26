// ============================================================
// main.js — Navegación interactiva (menú móvil + estado activo)
// Especialidades Don Jorge
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Cierra el menú al elegir una opción (mobile)
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Marca el link activo según la página actual
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

// ============================================================
// Pestañas del catálogo (Productos / Video y audio)
// JavaScript propio, sin componentes de terceros.
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  const botones = document.querySelectorAll('.tab-btn');
  const paneles = document.querySelectorAll('.tab-panel');
  if (!botones.length) return;

  function activar(nombre) {
    botones.forEach(function (b) {
      const activo = b.dataset.tab === nombre;
      b.classList.toggle('active', activo);
      b.setAttribute('aria-selected', activo ? 'true' : 'false');
    });
    paneles.forEach(function (p) {
      p.classList.toggle('active', p.id === 'panel-' + nombre);
    });
    // Guarda la pestaña en la URL para poder enlazarla directamente
    history.replaceState(null, '', '#' + nombre);
  }

  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      activar(this.dataset.tab);
    });
  });

  // Si la URL trae un hash válido, abre esa pestaña al cargar
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('panel-' + hash)) {
    activar(hash);
  }
});