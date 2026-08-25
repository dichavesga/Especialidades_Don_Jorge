// ============================================================
// multimedia.js — Controles propios del video HTML5
// JavaScript propio, sin componentes de terceros.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('videoProceso');
  const estado = document.getElementById('videoEstado');
  if (!video) return;

  const btnPlay = document.getElementById('btnVideoPlay');
  const btnReiniciar = document.getElementById('btnVideoReiniciar');

  if (btnPlay) {
    btnPlay.addEventListener('click', function () {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  }

  if (btnReiniciar) {
    btnReiniciar.addEventListener('click', function () {
      video.currentTime = 0;
      video.play();
    });
  }

  function actualizarEstado(texto) {
    if (estado) estado.textContent = texto;
  }

  video.addEventListener('play', function () { actualizarEstado('Reproduciendo…'); });
  video.addEventListener('pause', function () { actualizarEstado('En pausa'); });
  video.addEventListener('ended', function () { actualizarEstado('Reproducción finalizada'); });
  video.addEventListener('error', function () {
    actualizarEstado('El archivo de video aún no está disponible.');
  });
});