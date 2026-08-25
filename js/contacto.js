// ============================================================
// contacto.js — Validaciones e interacciones del formulario
// (JavaScript propio, sin librerías de validación de terceros).
// Incluye: cálculo automático de la edad a partir de la fecha de
// nacimiento y su envío en un campo oculto.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formContacto');
  if (!form) return;

  const campoNombre = document.getElementById('nombre');
  const campoEmail = document.getElementById('email');
  const campoFecha = document.getElementById('fechaNacimiento');
  const campoEdad = document.getElementById('edad');
  const campoRango = document.getElementById('rangoIngreso');
  const campoGrado = document.getElementById('gradoAcademico');
  const feedback = document.getElementById('formFeedback');
  const infoEdad = document.getElementById('edadCalculada');
  const infoIngreso = document.getElementById('ingresoValor');

  // ---------- Cálculo de la edad ----------
  function calcularEdad(fechaTexto) {
    if (!fechaTexto) return null;
    const nacimiento = new Date(fechaTexto + 'T00:00:00');
    if (isNaN(nacimiento.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  campoFecha.addEventListener('change', function () {
    const edad = calcularEdad(this.value);
    if (edad === null) {
      infoEdad.textContent = '';
      campoEdad.value = '';
      return;
    }
    campoEdad.value = edad;                       // campo oculto que se envía
    infoEdad.textContent = 'Edad calculada: ' + edad + ' años';
  });

  // ---------- Formato del rango de ingreso ----------
  function formatearColones(valor) {
    return '₡' + Number(valor).toLocaleString('es-CR');
  }

  campoRango.addEventListener('input', function () {
    infoIngreso.textContent = formatearColones(this.value);
  });

  // ---------- Validaciones ----------
  function mostrarError(id, mensaje) {
    const el = document.getElementById(id);
    if (el) el.textContent = mensaje;
  }

  function limpiarErrores() {
    ['errorNombre', 'errorEmail', 'errorFecha', 'errorGenero', 'errorGrado']
      .forEach(function (id) { mostrarError(id, ''); });
    feedback.textContent = '';
    feedback.className = 'form-feedback';
  }

  function validarNombre(valor) {
    const limpio = valor.trim();
    if (limpio === '') return 'El nombre es obligatorio.';
    if (limpio.length < 5) return 'Ingrese su nombre completo.';
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'.-]+$/.test(limpio)) {
      return 'El nombre solo puede contener letras y espacios.';
    }
    return '';
  }

  function validarEmail(valor) {
    const limpio = valor.trim();
    if (limpio === '') return 'El correo electrónico es obligatorio.';
    const patron = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!patron.test(limpio)) return 'Ingrese un correo electrónico válido.';
    return '';
  }

  function validarFecha(valor) {
    if (!valor) return 'La fecha de nacimiento es obligatoria.';
    const edad = calcularEdad(valor);
    if (edad === null) return 'La fecha ingresada no es válida.';
    if (edad < 0) return 'La fecha no puede ser futura.';
    if (edad < 18) return 'Debe ser mayor de edad para registrarse.';
    if (edad > 120) return 'Verifique la fecha ingresada.';
    return '';
  }

  function obtenerGenero() {
    const seleccionado = form.querySelector('input[name="genero"]:checked');
    return seleccionado ? seleccionado.value : '';
  }

  function obtenerGrados() {
    return Array.from(campoGrado.selectedOptions).map(function (op) { return op.value; });
  }

  // Validación en vivo al salir de cada campo
  campoNombre.addEventListener('blur', function () {
    mostrarError('errorNombre', validarNombre(this.value));
  });
  campoEmail.addEventListener('blur', function () {
    mostrarError('errorEmail', validarEmail(this.value));
  });
  campoFecha.addEventListener('blur', function () {
    mostrarError('errorFecha', validarFecha(this.value));
  });

  // ---------- Envío ----------
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    limpiarErrores();

    const errores = [];

    const errNombre = validarNombre(campoNombre.value);
    if (errNombre) { mostrarError('errorNombre', errNombre); errores.push(errNombre); }

    const errEmail = validarEmail(campoEmail.value);
    if (errEmail) { mostrarError('errorEmail', errEmail); errores.push(errEmail); }

    const errFecha = validarFecha(campoFecha.value);
    if (errFecha) { mostrarError('errorFecha', errFecha); errores.push(errFecha); }

    const genero = obtenerGenero();
    if (!genero) {
      mostrarError('errorGenero', 'Seleccione una opción.');
      errores.push('Género');
    }

    const grados = obtenerGrados();
    if (grados.length === 0) {
      mostrarError('errorGrado', 'Seleccione al menos un grado académico.');
      errores.push('Grado académico');
    }

    if (errores.length > 0) {
      feedback.textContent = 'Revise los campos marcados antes de enviar.';
      feedback.className = 'form-feedback error';
      return;
    }

    // Edad calculada e incluida de forma oculta
    campoEdad.value = calcularEdad(campoFecha.value);

    // Envío por correo electrónico
    const asunto = 'Nuevo registro desde el sitio web — ' + campoNombre.value.trim();
    const cuerpo =
      'Nombre completo: ' + campoNombre.value.trim() + '\n' +
      'Correo: ' + campoEmail.value.trim() + '\n' +
      'Fecha de nacimiento: ' + campoFecha.value + '\n' +
      'Edad: ' + campoEdad.value + ' años\n' +
      'Rango de ingreso: ' + formatearColones(campoRango.value) + '\n' +
      'Género: ' + genero + '\n' +
      'Grado académico: ' + grados.join(', ') + '\n' +
      'Mensaje: ' + (document.getElementById('mensaje').value.trim() || '(sin mensaje)');

    const enlace =
      'mailto:especialidadespalermo@gmail.com' +
      '?subject=' + encodeURIComponent(asunto) +
      '&body=' + encodeURIComponent(cuerpo);

    window.location.href = enlace;

    feedback.textContent = '¡Gracias! Se abrirá su cliente de correo para completar el envío.';
    feedback.className = 'form-feedback exito';
  });

  // ---------- Limpiar ----------
  document.getElementById('btnLimpiar').addEventListener('click', function () {
    limpiarErrores();
    infoEdad.textContent = '';
    campoEdad.value = '';
    setTimeout(function () {
      infoIngreso.textContent = formatearColones(campoRango.value);
    }, 0);
  });
});
