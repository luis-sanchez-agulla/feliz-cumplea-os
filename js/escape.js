// ============================================
// LOGICA DE LA SALA DE ESCAPE FINAL (escape.html)
// ============================================
// Mismo patrón que el reto de cada nivel (js/script.js): un enigma, se
// compara la respuesta ignorando mayúsculas/tildes/espacios de más, y al
// acertar se avanza. Acá en vez de "niveles" son "salas", en orden,
// dentro de SALAS_ESCAPE (js/escape-salas.js).
//
// Hay cinco tipos de sala (ver comentario de SALAS_ESCAPE):
// - "sopa-letras": la grilla se genera y se pinta acá abajo, con el
//   motor de js/sopa-letras.js.
// - "juego-1024" (el objeto de la sala le dice "1024" pero el motor y
//   los nombres internos quedaron como "2048" — es cosmético, no afecta
//   el funcionamiento): el tablero y el cronómetro se manejan acá abajo,
//   con el motor de js/juego-2048.js. Al fallar, dispara
//   CONVERSACIONES.fallo2048 (js/conversaciones.js, motor js/dialogo.js).
// - "eleccion": en vez de un input, se generan casillas clickeables (una
//   foto de personaje + su nombre) a partir de "opciones"; clickear la
//   que coincide con "respuestaCorrecta" avanza de sala, cualquier otra
//   no hace nada.
// - "despedida": la última sala. No es un reto, solo muestra "texto" y
//   un link para volver al mapa — ver mostrarSalaDespedida() más abajo.
// - las demás (sin "tipo"): el candado con código de toda la vida.
//
// Al terminar la sala 3 (la elección del asesino) se dispara
// CONVERSACIONES.finalEscape ANTES de mostrar la sala 4 (la despedida) —
// ver avanzarASiguienteSala().

const CLAVE_LOCALSTORAGE_ESCAPE = 'cumple_candela_escape_progreso';
const TOTAL_SALAS = SALAS_ESCAPE.length;

function cargarProgresoEscape() {
  try {
    const guardado = localStorage.getItem(CLAVE_LOCALSTORAGE_ESCAPE);
    if (!guardado) return { salaActual: 0, palabrasEncontradas: [] };
    const datos = JSON.parse(guardado);
    if (typeof datos.salaActual !== 'number') return { salaActual: 0, palabrasEncontradas: [] };
    if (!Array.isArray(datos.palabrasEncontradas)) datos.palabrasEncontradas = [];
    return datos;
  } catch (error) {
    console.error('No se pudo leer el progreso de la sala de escape:', error);
    return { salaActual: 0, palabrasEncontradas: [] };
  }
}

function guardarProgresoEscape(progresoEscape) {
  localStorage.setItem(CLAVE_LOCALSTORAGE_ESCAPE, JSON.stringify(progresoEscape));
}

let progresoEscape = cargarProgresoEscape();

// normalizarTexto() viene de js/normalizar.js (compartida con el mapa).

const elSalaTitulo = document.getElementById('sala-titulo');
const elSalaProgreso = document.getElementById('sala-progreso');
const elZonaCodigo = document.getElementById('zona-codigo');
const elSalaPista = document.getElementById('sala-pista');
const elInputCodigo = document.getElementById('input-codigo');
const elBtnAbrir = document.getElementById('btn-abrir-candado');
const elFeedback = document.getElementById('sala-feedback');
const elZonaEleccion = document.getElementById('zona-eleccion');
const elEleccionPista = document.getElementById('eleccion-pista');
const elEleccionOpciones = document.getElementById('eleccion-opciones');
const elZonaDespedida = document.getElementById('zona-despedida');
const elDespedidaTexto = document.getElementById('despedida-texto');
const elZonaSopaLetras = document.getElementById('zona-sopa-letras');
const elSopaIntro = document.getElementById('sopa-intro-texto');
const elSopaGrilla = document.getElementById('sopa-grilla');
const elSopaPalabras = document.getElementById('sopa-palabras');
const elZona2048 = document.getElementById('zona-2048');
const elIntro2048 = document.getElementById('intro-2048-texto');
const elPuntuacion2048 = document.getElementById('puntuacion-2048');
const elObjetivo2048 = document.getElementById('objetivo-2048');
const elTiempo2048 = document.getElementById('tiempo-2048');
const elBtnJugar2048 = document.getElementById('btn-jugar-2048');
const elTablero2048 = document.getElementById('tablero-2048');
const elZonaJuego = document.getElementById('zona-juego');

// Estado de la sopa de letras actualmente en pantalla (se recalcula cada
// vez que se entra a una sala de este tipo, ver mostrarSalaSopaDeLetras).
let posicionesSopaActual = {}; // palabra original -> [{ fila, columna }, ...]
let celdasSopaPorClave = {}; // "fila-columna" -> elemento <span> de la grilla
let palabrasEncontradasSopa = new Set();

// Estado del juego 2048 actualmente en pantalla (se resetea cada vez que
// se entra a una sala de este tipo o se reinicia tras fallar, ver
// mostrarSala2048).
let tablero2048Actual = null;
let puntuacion2048Actual = 0;
let objetivoPuntuacion2048Actual = 0;
let intervaloTiempo2048 = null;
let segundosRestantes2048 = 0;
let juego2048EnCurso = false; // true solo entre apretar "Jugar" y ganar/fallar

function mostrarSalaActual() {
  detenerTemporizador2048(); // por si se venía de un 2048 a mitad de partida

  // por si queda guardado un salaActual fuera de rango (ej. de una
  // versión anterior del juego con otra cantidad de salas)
  progresoEscape.salaActual = Math.min(Math.max(progresoEscape.salaActual, 0), SALAS_ESCAPE.length - 1);

  const sala = SALAS_ESCAPE[progresoEscape.salaActual];
  elSalaTitulo.textContent = sala.titulo;
  elSalaProgreso.textContent = `Sala ${progresoEscape.salaActual + 1} de ${TOTAL_SALAS}`;

  const esSopaDeLetras = sala.tipo === 'sopa-letras';
  const esJuego2048 = sala.tipo === 'juego-1024';
  const esEleccion = sala.tipo === 'eleccion';
  const esDespedida = sala.tipo === 'despedida';
  elZonaCodigo.classList.toggle('oculto', esSopaDeLetras || esJuego2048 || esEleccion || esDespedida);
  elZonaEleccion.classList.toggle('oculto', !esEleccion);
  elZonaDespedida.classList.toggle('oculto', !esDespedida);
  elZonaSopaLetras.classList.toggle('oculto', !esSopaDeLetras);
  elZona2048.classList.toggle('oculto', !esJuego2048);

  if (esSopaDeLetras) {
    mostrarSalaSopaDeLetras(sala);
  } else if (esJuego2048) {
    mostrarSala2048(sala);
  } else if (esEleccion) {
    mostrarSalaEleccion(sala);
  } else if (esDespedida) {
    elDespedidaTexto.textContent = sala.texto;
  } else {
    elSalaPista.textContent = sala.pista;
    elInputCodigo.value = '';
    elFeedback.textContent = '';
  }

  elZonaJuego.classList.remove('oculto');
}

function intentarAbrirCandado() {
  const sala = SALAS_ESCAPE[progresoEscape.salaActual];
  if (!sala || sala.tipo === 'sopa-letras' || sala.tipo === 'juego-1024' || sala.tipo === 'eleccion') return;

  if (normalizarTexto(elInputCodigo.value) !== normalizarTexto(sala.respuesta)) {
    elFeedback.textContent = '❌ Código incorrecto, prueba de nuevo.';
    return;
  }

  avanzarASiguienteSala();
}

// La sala 4 (despedida) es la última: nunca hay que pasar de ahí, así
// que salaActual queda "clampeado" al último índice válido en vez de
// poder salirse del array (evitaría un crash si se sigue apretando
// "pasar sala" estando ya en la despedida).
function avanzarASiguienteSala() {
  progresoEscape.salaActual = Math.min(progresoEscape.salaActual + 1, SALAS_ESCAPE.length - 1);
  progresoEscape.palabrasEncontradas = [];
  guardarProgresoEscape(progresoEscape);

  // Al llegar justo a la despedida (sala 4), primero se muestra la
  // conversación final; recién al cerrarla se dibuja la sala.
  const siguienteSala = SALAS_ESCAPE[progresoEscape.salaActual];
  if (siguienteSala.tipo === 'despedida') {
    mostrarDialogo(CONVERSACIONES.finalEscape, mostrarSalaActual);
  } else {
    mostrarSalaActual();
  }
}

elBtnAbrir.addEventListener('click', intentarAbrirCandado);
elInputCodigo.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') intentarAbrirCandado();
});

// ============================================
// SALA TIPO "SOPA DE LETRAS"
// ============================================
function mostrarSalaSopaDeLetras(sala) {
  elSopaIntro.textContent = sala.textoIntro;

  const { grilla, posiciones } = generarSopaDeLetras(sala.palabras, sala.filas, sala.columnas);
  posicionesSopaActual = posiciones;
  // solo se conservan como "encontradas" las que de verdad existen en
  // esta sala (por si el localStorage quedó de otra sala vieja)
  palabrasEncontradasSopa = new Set(
    (progresoEscape.palabrasEncontradas || []).filter((palabra) => posiciones[palabra])
  );

  renderizarGrillaSopa(grilla);
  renderizarFilasDePalabras(sala.palabras.length);
  palabrasEncontradasSopa.forEach(pintarPalabraEnGrilla);
}

function renderizarGrillaSopa(grilla) {
  elSopaGrilla.innerHTML = '';
  elSopaGrilla.style.gridTemplateColumns = `repeat(${grilla[0].length}, 1fr)`;
  celdasSopaPorClave = {};

  grilla.forEach((fila, indiceFila) => {
    fila.forEach((letra, indiceColumna) => {
      const elCelda = document.createElement('span');
      elCelda.className = 'celda-sopa';
      elCelda.textContent = letra;
      elSopaGrilla.appendChild(elCelda);
      celdasSopaPorClave[`${indiceFila}-${indiceColumna}`] = elCelda;
    });
  });
}

function renderizarFilasDePalabras(cantidad) {
  elSopaPalabras.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    elSopaPalabras.appendChild(crearFilaDePalabra(i));
  }
}

function crearFilaDePalabra(indice) {
  const fila = document.createElement('div');
  fila.className = 'fila-palabra-sopa';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = `Palabra ${indice + 1}`;

  const boton = document.createElement('button');
  boton.textContent = 'Comprobar';
  boton.addEventListener('click', () => comprobarPalabraSopa(input));

  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') comprobarPalabraSopa(input);
  });

  fila.appendChild(input);
  fila.appendChild(boton);
  return fila;
}

// Si lo que se escribió coincide con alguna palabra de la sopa que
// todavía no se había encontrado, la pinta de rojo en la grilla. Si no
// coincide con ninguna (o ya estaba encontrada), no hace nada — a
// propósito, sin mensaje de error.
function comprobarPalabraSopa(input) {
  const valor = input.value;
  if (!valor.trim()) return;

  const palabraAcertada = Object.keys(posicionesSopaActual).find(
    (palabra) => !palabrasEncontradasSopa.has(palabra) && normalizarTexto(palabra) === normalizarTexto(valor)
  );
  if (!palabraAcertada) return;

  palabrasEncontradasSopa.add(palabraAcertada);
  pintarPalabraEnGrilla(palabraAcertada);

  progresoEscape.palabrasEncontradas = [...palabrasEncontradasSopa];
  guardarProgresoEscape(progresoEscape);

  const seEncontraronTodas = palabrasEncontradasSopa.size === Object.keys(posicionesSopaActual).length;
  if (seEncontraronTodas) {
    avanzarASiguienteSala();
  }
}

function pintarPalabraEnGrilla(palabra) {
  const celdas = posicionesSopaActual[palabra] || [];
  celdas.forEach(({ fila, columna }) => {
    const elCelda = celdasSopaPorClave[`${fila}-${columna}`];
    if (elCelda) elCelda.classList.add('encontrada');
  });
}

// ============================================
// SALA TIPO "ELECCION" (casillas con foto para tocar)
// ============================================
function mostrarSalaEleccion(sala) {
  elEleccionPista.textContent = sala.pista;
  elEleccionOpciones.innerHTML = '';

  sala.opciones.forEach((opcion) => {
    elEleccionOpciones.appendChild(crearCasillaEleccion(opcion, sala));
  });
}

function crearCasillaEleccion(opcion, sala) {
  const elCasilla = document.createElement('button');
  elCasilla.type = 'button';
  elCasilla.className = 'casilla-eleccion';

  const elImagen = document.createElement('img');
  elImagen.src = `multimedia/${opcion.personaje}/${opcion.expresion}.png`;
  elImagen.alt = opcion.personaje;

  const elNombre = document.createElement('span');
  elNombre.textContent = opcion.personaje;

  elCasilla.appendChild(elImagen);
  elCasilla.appendChild(elNombre);

  // si no coincide con la respuesta correcta, no pasa nada — mismo
  // criterio que la sopa de letras con una palabra que no encaja
  elCasilla.addEventListener('click', () => {
    if (normalizarTexto(opcion.personaje) === normalizarTexto(sala.respuestaCorrecta)) {
      avanzarASiguienteSala();
    }
  });

  return elCasilla;
}

// ============================================
// SALA TIPO "JUEGO 2048"
// ============================================
function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// Deja la sala lista para jugar (botón "Jugar" visible, tablero oculto),
// sin arrancar todavía el cronómetro — arranca al apretar el botón. Se
// usa tanto al entrar a la sala como al reiniciar después de fallar.
function mostrarSala2048(sala) {
  detenerTemporizador2048();

  objetivoPuntuacion2048Actual = sala.objetivoPuntuacion;
  segundosRestantes2048 = sala.duracionSegundos;
  puntuacion2048Actual = 0;
  tablero2048Actual = null;

  elIntro2048.textContent = sala.textoIntro;
  elObjetivo2048.textContent = `Objetivo: ${objetivoPuntuacion2048Actual} puntos`;
  elPuntuacion2048.textContent = 'Puntuación: 0';
  elTiempo2048.textContent = `Tiempo: ${formatearTiempo(segundosRestantes2048)}`;
  elTablero2048.classList.add('oculto');
  elBtnJugar2048.classList.remove('oculto');
}

function iniciarJuego2048() {
  const sala = SALAS_ESCAPE[progresoEscape.salaActual];
  if (!sala || sala.tipo !== 'juego-1024') return;

  tablero2048Actual = crearTableroInicial(4, 4);
  puntuacion2048Actual = 0;
  segundosRestantes2048 = sala.duracionSegundos;
  juego2048EnCurso = true;

  elBtnJugar2048.classList.add('oculto');
  elTablero2048.classList.remove('oculto');
  crearCeldas2048();
  elPuntuacion2048.textContent = 'Puntuación: 0';
  elTiempo2048.textContent = `Tiempo: ${formatearTiempo(segundosRestantes2048)}`;

  intervaloTiempo2048 = setInterval(() => {
    segundosRestantes2048--;
    elTiempo2048.textContent = `Tiempo: ${formatearTiempo(Math.max(segundosRestantes2048, 0))}`;
    if (segundosRestantes2048 <= 0) {
      fallarJuego2048();
    }
  }, 1000);
}

function detenerTemporizador2048() {
  if (intervaloTiempo2048) {
    clearInterval(intervaloTiempo2048);
    intervaloTiempo2048 = null;
  }
  juego2048EnCurso = false;
}

// Las 16 celdas se crean UNA sola vez por partida (no se recrean en cada
// movimiento) para poder animarlas: si se recrearan de cero cada vez,
// cada número "nacería" ya en su valor final, sin transición visible
// (mismo motivo por el que el mapa dejó de usar renderizarMapa() en cada
// movimiento, ver aplicarTransicionDeNivelCompletado() en js/script.js).
let celdas2048 = [];

function crearCeldas2048() {
  elTablero2048.innerHTML = '';
  celdas2048 = tablero2048Actual.flat().map(() => {
    const elCelda = document.createElement('div');
    elCelda.className = 'celda-2048';
    elTablero2048.appendChild(elCelda);
    return elCelda;
  });
  pintarValoresTablero2048(null);
}

// Pinta los valores actuales del tablero en las celdas ya creadas. Si se
// pasan los valores de ANTES del movimiento, a las celdas que cambiaron
// (ficha que se movió hasta ahí, se fusionó, o apareció nueva) se les
// agrega brevemente la clase "actualizada" — animación mínima con la que
// se nota que algo se movió, sin tener que rastrear cada ficha
// individualmente por el tablero.
function pintarValoresTablero2048(valoresAnteriores) {
  const valoresActuales = tablero2048Actual.flat();

  valoresActuales.forEach((valor, indice) => {
    const elCelda = celdas2048[indice];
    elCelda.textContent = valor === 0 ? '' : valor;

    const cambio = valoresAnteriores && valoresAnteriores[indice] !== valor;
    if (cambio && valor !== 0) {
      // se saca y se vuelve a poner la clase (con un reflow forzado en el
      // medio) para que la animación se reinicie aunque ya se le hubiera
      // aplicado en el movimiento anterior — mismo truco que usa
      // animarCandelaCayendo() en js/script.js con la transición de Candela
      elCelda.classList.remove('actualizada');
      void elCelda.offsetWidth;
      elCelda.classList.add('actualizada');
    }
  });
}

// Flechas del teclado -> función de movimiento de js/juego-2048.js.
const MOVIMIENTOS_2048 = {
  ArrowLeft: moverIzquierda,
  ArrowRight: moverDerecha,
  ArrowUp: moverArriba,
  ArrowDown: moverAbajo,
};

document.addEventListener('keydown', (evento) => {
  if (!juego2048EnCurso) return; // solo escucha mientras esta sala está activa y en juego
  const mover = MOVIMIENTOS_2048[evento.key];
  if (!mover) return;

  evento.preventDefault(); // que las flechas no scrolleen la página
  const { tablero, puntuacionGanada, seMovio } = mover(tablero2048Actual);
  if (!seMovio) return; // movimiento inválido (no cambió nada): no cuenta como turno

  const valoresAntesDelMovimiento = tablero2048Actual.flat();
  tablero2048Actual = tablero;
  puntuacion2048Actual += puntuacionGanada;
  agregarFichaAleatoria(tablero2048Actual);
  pintarValoresTablero2048(valoresAntesDelMovimiento);
  elPuntuacion2048.textContent = `Puntuación: ${puntuacion2048Actual}`;

  if (puntuacion2048Actual >= objetivoPuntuacion2048Actual) {
    ganarJuego2048();
  } else if (!hayMovimientosPosibles(tablero2048Actual)) {
    fallarJuego2048();
  }
});

function ganarJuego2048() {
  if (!juego2048EnCurso) return;
  detenerTemporizador2048();
  avanzarASiguienteSala();
}

// Se acabó el tiempo, o el tablero se trabó sin más movimientos
// posibles, sin llegar al objetivo: se muestra la conversación de fallo
// (sin texto todavía, ver CONVERSACIONES.fallo2048) y al cerrarla se
// reinicia esta misma sala desde cero.
function fallarJuego2048() {
  if (!juego2048EnCurso) return;
  detenerTemporizador2048();
  mostrarDialogo(CONVERSACIONES.fallo2048, () => {
    mostrarSala2048(SALAS_ESCAPE[progresoEscape.salaActual]);
  });
}

elBtnJugar2048.addEventListener('click', iniciarJuego2048);

document.getElementById('btn-reiniciar-escape').addEventListener('click', () => {
  progresoEscape = { salaActual: 0, palabrasEncontradas: [] };
  guardarProgresoEscape(progresoEscape);
  mostrarSalaActual();
});

mostrarSalaActual();
