// ============================================
// MOTOR DE DIALOGO / CUTSCENES
// ============================================
// Sistema genérico para mostrar conversaciones en puntos clave de la
// partida: oscurece el fondo, muestra una viñeta central de bordes
// redondos con el texto, y va cambiando la imagen del personaje según
// quién habla y con qué expresión (ver js/conversaciones.js para el
// contenido y el formato de cada línea).

// Expresión de reserva por personaje: si una línea pide una expresión
// que no existe como archivo (ver comentario en conversaciones.js), no
// queremos una imagen rota, así que caemos a esta.
const EXPRESION_POR_DEFECTO_PERSONAJE = {
  Candela: 'normal',
  Luis: 'normal',
  Demonio: 'diabolico', // Demonio no tiene normal.png ni feliz.png
};

const elDialogoOverlay = document.getElementById('dialogo-overlay');
const elDialogoPersonaje = document.getElementById('dialogo-personaje');
const elDialogoNombre = document.getElementById('dialogo-nombre');
const elDialogoTexto = document.getElementById('dialogo-texto');
const elBtnDialogoSiguiente = document.getElementById('btn-dialogo-siguiente');

let lineasDialogoActual = [];
let indiceLineaDialogoActual = 0;
let alTerminarDialogoActual = null;

function rutaImagenPersonaje(personaje, expresion) {
  return `multimedia/${personaje}/${expresion}.png`;
}

function mostrarLineaDialogo(indice) {
  const linea = lineasDialogoActual[indice];
  const expresionPorDefecto = EXPRESION_POR_DEFECTO_PERSONAJE[linea.personaje] || 'normal';

  elDialogoPersonaje.alt = linea.personaje;
  elDialogoPersonaje.onerror = () => {
    // la expresión pedida no existe como archivo: caemos a la de reserva
    // de ese personaje en vez de dejar una imagen rota
    elDialogoPersonaje.onerror = null;
    elDialogoPersonaje.src = rutaImagenPersonaje(linea.personaje, expresionPorDefecto);
  };
  // "imagen" (ruta explícita) tiene prioridad sobre personaje+expresion:
  // para imágenes que no viven en multimedia/<Personaje>/ (ej. "demonio
  // con casita.png", que está suelta en multimedia/).
  elDialogoPersonaje.src = linea.imagen || rutaImagenPersonaje(linea.personaje, linea.expresion || expresionPorDefecto);

  elDialogoNombre.textContent = linea.personaje;
  elDialogoTexto.textContent = linea.texto;

  const esUltimaLinea = indice === lineasDialogoActual.length - 1;
  elBtnDialogoSiguiente.textContent = esUltimaLinea ? 'Cerrar' : 'Siguiente ▶';
}

function avanzarDialogo() {
  indiceLineaDialogoActual++;

  if (indiceLineaDialogoActual >= lineasDialogoActual.length) {
    cerrarDialogo();
    return;
  }

  mostrarLineaDialogo(indiceLineaDialogoActual);
}

function cerrarDialogo() {
  elDialogoOverlay.classList.add('oculto');

  const callback = alTerminarDialogoActual;
  lineasDialogoActual = [];
  indiceLineaDialogoActual = 0;
  alTerminarDialogoActual = null;

  if (callback) callback();
}

// lineas: array de { personaje, expresion, texto } (ver conversaciones.js)
// alTerminar: callback opcional, se llama una vez que se cierra el diálogo
function mostrarDialogo(lineas, alTerminar) {
  // si todavía no hay texto cargado para esta conversación, no se
  // muestra nada, pero igual se llama a alTerminar: así lo que dependa
  // de "cuando se cierra la conversación" (ej. reiniciar un juego tras
  // fallar) funciona ya mismo, sin tener que esperar a tener el texto.
  if (!lineas || lineas.length === 0) {
    if (alTerminar) alTerminar();
    return;
  }

  lineasDialogoActual = lineas;
  indiceLineaDialogoActual = 0;
  alTerminarDialogoActual = alTerminar || null;

  mostrarLineaDialogo(0);
  elDialogoOverlay.classList.remove('oculto');
}

elBtnDialogoSiguiente.addEventListener('click', avanzarDialogo);
