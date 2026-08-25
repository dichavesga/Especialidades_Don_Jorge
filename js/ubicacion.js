// ============================================================
// ubicacion.js
//  1) Google Maps API: mapa + marcador del negocio
//  2) Geolocalización del navegador + ruta con Routes API
//     (Compute Routes — compatible con la Maps Demo Key)
//  3) Consumo de un API Rest EXTERNO (Open-Meteo) para el clima
// ============================================================

// Clave de Google Maps (Maps Demo Key) — la misma que se usa en el <script> de ubicacion.html
const API_KEY = 'AIzaSyC6DUK78eDcsYRKTfqXXCHrMwqOIGLhE2M';

// Coordenadas aproximadas de Santa Gertrudis Sur, Grecia, Alajuela
const NEGOCIO = { lat: 10.0733, lng: -84.2742 };

let map;
let marcadorNegocio;
let marcadorUsuario;
let lineaRuta;

// ---------- 1. Inicialización del mapa (callback de Google Maps API) ----------
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: NEGOCIO,
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false
  });

  marcadorNegocio = new google.maps.Marker({
    position: NEGOCIO,
    map: map,
    title: 'Especialidades Don Jorge'
  });

  const infoWindow = new google.maps.InfoWindow({
    content:
      '<div style="font-family:sans-serif;max-width:220px">' +
      '<strong>Especialidades Don Jorge</strong><br>' +
      'Santa Gertrudis Sur, Grecia, Alajuela<br>' +
      '<a href="tel:+50689311228">8931-1228</a>' +
      '</div>'
  });
  marcadorNegocio.addListener('click', function () {
    infoWindow.open(map, marcadorNegocio);
  });
  infoWindow.open(map, marcadorNegocio);
}

// ---------- 2. Geolocalización + ruta ----------
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('btnUbicarme');
  const estado = document.getElementById('geoEstado');
  const rutaInfo = document.getElementById('rutaInfo');

  if (btn) {
    btn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        estado.textContent = 'Su navegador no soporta geolocalización.';
        return;
      }
      estado.textContent = 'Obteniendo su ubicación…';

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          const origen = { lat: pos.coords.latitude, lng: pos.coords.longitude };

          if (marcadorUsuario) marcadorUsuario.setMap(null);
          marcadorUsuario = new google.maps.Marker({
            position: origen,
            map: map,
            title: 'Su ubicación',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#171412',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });

          calcularRuta(origen, estado, rutaInfo);
        },
        function (error) {
          const mensajes = {
            1: 'Permiso de ubicación denegado. Actívelo para trazar la ruta.',
            2: 'No fue posible determinar su ubicación.',
            3: 'La solicitud de ubicación tardó demasiado.'
          };
          estado.textContent = mensajes[error.code] || 'Ocurrió un error al obtener su ubicación.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  cargarClima();
});

/**
 * Calcula la ruta usando la Routes API (Compute Routes).
 * Se usa esta API en lugar del DirectionsService porque es compatible
 * con la Maps Demo Key (no requiere cuenta de facturación).
 */
function calcularRuta(origen, estado, rutaInfo) {
  estado.textContent = 'Calculando la ruta…';

  const cuerpo = {
    origin:      { location: { latLng: { latitude: origen.lat,  longitude: origen.lng  } } },
    destination: { location: { latLng: { latitude: NEGOCIO.lat, longitude: NEGOCIO.lng } } },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    languageCode: 'es-CR',
    units: 'METRIC'
  };

  fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
    },
    body: JSON.stringify(cuerpo)
  })
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
      return respuesta.json();
    })
    .then(function (datos) {
      if (!datos.routes || datos.routes.length === 0) {
        throw new Error('Sin resultados');
      }

      const ruta = datos.routes[0];

      // Distancia
      const km = (ruta.distanceMeters / 1000).toFixed(1);
      document.getElementById('rutaDistancia').textContent = km + ' km';

      // Duración: llega como texto en segundos, por ejemplo "1234s"
      const segundos = parseInt(ruta.duration.replace('s', ''), 10);
      document.getElementById('rutaTiempo').textContent = formatearDuracion(segundos);

      // Dibujar la ruta decodificando la polilínea
      dibujarRuta(ruta.polyline.encodedPolyline, origen);

      rutaInfo.hidden = false;
      estado.textContent = 'Ruta trazada desde su ubicación actual.';
    })
    .catch(function (error) {
      estado.textContent = 'No fue posible calcular la ruta. Verifique su clave de API.';
      console.error('Error al calcular la ruta:', error);
    });
}

function dibujarRuta(polilineaCodificada, origen) {
  if (lineaRuta) lineaRuta.setMap(null);

  const puntos = google.maps.geometry.encoding.decodePath(polilineaCodificada);

  lineaRuta = new google.maps.Polyline({
    path: puntos,
    strokeColor: '#A31621',
    strokeWeight: 5,
    strokeOpacity: 0.85,
    map: map
  });

  // Ajustar el zoom para que se vean ambos extremos
  const limites = new google.maps.LatLngBounds();
  limites.extend(new google.maps.LatLng(origen.lat, origen.lng));
  limites.extend(new google.maps.LatLng(NEGOCIO.lat, NEGOCIO.lng));
  map.fitBounds(limites);
}

function formatearDuracion(segundos) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.round((segundos % 3600) / 60);
  if (horas > 0) return horas + ' h ' + minutos + ' min';
  return minutos + ' min';
}

// ---------- 3. API REST EXTERNO: clima actual (Open-Meteo, sin API key) ----------
function cargarClima() {
  const card = document.getElementById('climaCard');
  const estadoClima = document.getElementById('climaEstado');
  if (!card) return;

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + NEGOCIO.lat +
    '&longitude=' + NEGOCIO.lng +
    '&current=temperature_2m,relative_humidity_2m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min' +
    '&timezone=America%2FCosta_Rica&forecast_days=1';

  fetch(url)
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error('Respuesta no válida');
      return respuesta.json();
    })
    .then(function (datos) {
      const actual = datos.current;
      const dia = datos.daily;

      card.innerHTML =
        '<div class="weather-main">' +
          '<span class="weather-temp">' + Math.round(actual.temperature_2m) + '°C</span>' +
          '<span class="weather-desc">' + describirClima(actual.weather_code) + '</span>' +
        '</div>' +
        '<ul class="weather-details">' +
          '<li><span class="eyebrow">Humedad</span><strong>' + actual.relative_humidity_2m + '%</strong></li>' +
          '<li><span class="eyebrow">Máxima</span><strong>' + Math.round(dia.temperature_2m_max[0]) + '°C</strong></li>' +
          '<li><span class="eyebrow">Mínima</span><strong>' + Math.round(dia.temperature_2m_min[0]) + '°C</strong></li>' +
        '</ul>' +
        '<p class="weather-source">Datos de Open-Meteo API</p>';
    })
    .catch(function () {
      if (estadoClima) {
        estadoClima.textContent = 'No fue posible consultar el clima en este momento.';
      }
    });
}

function describirClima(codigo) {
  const tabla = {
    0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Neblina', 48: 'Neblina con escarcha',
    51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
    61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
    80: 'Aguaceros aislados', 81: 'Aguaceros moderados', 82: 'Aguaceros fuertes',
    95: 'Tormenta eléctrica', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo'
  };
  return tabla[codigo] || 'Condiciones variables';
}