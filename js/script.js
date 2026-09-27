// ============================================
// CONFIGURACION BASE
// ============================================
const NIVELES_POR_ESCENARIO = 10;
const CANTIDAD_ESCENARIOS = 2;
const TOTAL_NIVELES = NIVELES_POR_ESCENARIO * CANTIDAD_ESCENARIOS;
const CLAVE_LOCALSTORAGE = 'cumple_candela_progreso';

// Cada escenario agrupa 10 niveles y va a tener una ambientación estética
// distinta (fondo, colores, etc.) que todavía no está definida — el
// "nombre" es un placeholder hasta que se elijan las 2 temáticas.
const ESCENARIOS = Array.from({ length: CANTIDAD_ESCENARIOS }, (_, indice) => {
  const numero = indice + 1;
  return {
    id: numero,
    nombre: `Escenario ${numero}`,
    nivelInicial: indice * NIVELES_POR_ESCENARIO + 1,
    nivelFinal: numero * NIVELES_POR_ESCENARIO,
  };
});

function obtenerEscenarioDeNivel(idNivel) {
  return ESCENARIOS.find(
    (escenario) => idNivel >= escenario.nivelInicial && idNivel <= escenario.nivelFinal
  );
}

// ============================================
// ESTADO / PERSISTENCIA
// ============================================
function cargarProgreso() {
  try {
    const guardado = localStorage.getItem(CLAVE_LOCALSTORAGE);
    if (!guardado) return { nivelesCompletados: [] };
    const datos = JSON.parse(guardado);
    if (!Array.isArray(datos.nivelesCompletados)) return { nivelesCompletados: [] };
    return datos;
  } catch (error) {
    console.error('No se pudo leer el progreso guardado:', error);
    return { nivelesCompletados: [] };
  }
}

function guardarProgreso(progreso) {
  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(progreso));
}

let progreso = cargarProgreso();

function estaCompletado(idNivel) {
  return progreso.nivelesCompletados.includes(idNivel);
}

function estaDesbloqueado(idNivel) {
  if (idNivel === 1) return true; // el primer nivel siempre está disponible
  return estaCompletado(idNivel - 1); // se desbloquea al pasar el anterior
}

// ============================================
// RENDER DEL MAPA
// ============================================
const elCamino = document.getElementById('camino');
const elProgresoTexto = document.getElementById('progreso-texto');

const PATRON_ZIGZAG = ['fila-izquierda', 'fila-centro', 'fila-derecha'];

function renderizarMapa() {
  elCamino.innerHTML = '';

  for (let id = 1; id <= TOTAL_NIVELES; id++) {
    const escenario = obtenerEscenarioDeNivel(id);

    // Separador funcional entre escenarios: se inserta uno antes del
    // primer nivel de cada bloque de 10 (incluido el primero).
    if (id === escenario.nivelInicial) {
      const divisor = document.createElement('div');
      divisor.className = 'divisor-escenario';
      divisor.dataset.escenario = escenario.id; // así su fondo lo puede incluir en el cálculo de alto
      divisor.textContent = `— ${escenario.nombre} (niveles ${escenario.nivelInicial}-${escenario.nivelFinal}) —`;
      elCamino.appendChild(divisor);
    }

    const fila = document.createElement('div');
    fila.className = `fila-nivel ${PATRON_ZIGZAG[(id - 1) % PATRON_ZIGZAG.length]}`;
    fila.dataset.escenario = escenario.id;

    const nodo = document.createElement('div');
    nodo.classList.add('nivel');
    nodo.dataset.id = id;
    nodo.dataset.escenario = escenario.id;
    nodo.textContent = id;

    if (estaCompletado(id)) {
      nodo.classList.add('completado');
    } else if (estaDesbloqueado(id)) {
      nodo.classList.add('desbloqueado');
    } else {
      nodo.classList.add('bloqueado');
    }

    nodo.addEventListener('click', () => abrirModal(id));

    fila.appendChild(nodo);

    // el demonio con casita marca el desafío final, al lado del último nivel
    if (id === TOTAL_NIVELES) {
      const imgDemonio = document.createElement('img');
      imgDemonio.id = 'img-demonio-final';
      imgDemonio.src = 'multimedia/demonio con casita.png';
      imgDemonio.alt = 'Demonio con casita';
      fila.appendChild(imgDemonio);
    }

    elCamino.appendChild(fila);
  }

  elProgresoTexto.textContent =
    `Completaste ${progreso.nivelesCompletados.length} de ${TOTAL_NIVELES} niveles`;

  // se dibuja en el próximo frame para que el navegador ya haya
  // calculado las posiciones reales de los nodos
  requestAnimationFrame(() => {
    dibujarLineas();
    posicionarFondosEscenarios();
  });
}

// ============================================
// LINEAS QUE CONECTAN LOS NIVELES (SVG)
// ============================================
const elWrapper = document.getElementById('mapa-wrapper');
const elSvg = document.getElementById('rutas');

function dibujarLineas() {
  const rectWrapper = elWrapper.getBoundingClientRect();

  elSvg.setAttribute('width', elWrapper.scrollWidth);
  elSvg.setAttribute('height', elWrapper.scrollHeight);
  elSvg.innerHTML = '';

  const nodos = [...document.querySelectorAll('.nivel')];
  const puntos = nodos.map((nodo) => {
    const r = nodo.getBoundingClientRect();
    return {
      id: Number(nodo.dataset.id),
      x: r.left - rectWrapper.left + r.width / 2,
      y: r.top - rectWrapper.top + r.height / 2,
    };
  });

  for (let i = 0; i < puntos.length - 1; i++) {
    const desde = puntos[i];
    const hasta = puntos[i + 1];

    const linea = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linea.dataset.desde = desde.id; // permite encontrarla después para animarla a verde
    linea.setAttribute('x1', desde.x);
    linea.setAttribute('y1', desde.y);
    linea.setAttribute('x2', hasta.x);
    linea.setAttribute('y2', hasta.y);
    linea.setAttribute('stroke-width', '5');
    linea.setAttribute('stroke-linecap', 'round');
    // tramo ya recorrido (verde) si el nivel de origen está completado
    linea.setAttribute('stroke', estaCompletado(desde.id) ? '#22c55e' : '#bbb');

    elSvg.appendChild(linea);
  }
}

// ============================================
// FONDOS TEMÁTICOS POR ESCENARIO
// ============================================
// Escenarios sin entrada acá no tienen fondo propio (queda el gris por
// defecto de #mapa-wrapper). Para agregarle fondo a un escenario nuevo
// alcanza con sumar una línea acá, no hace falta tocar nada más.
const FONDOS_ESCENARIOS = {
  1: 'multimedia/Mapas/mapa-0-10.jpg',
  2: 'multimedia/Mapas/mapa-11-20.jpg',
};

const elFondosEscenarios = document.getElementById('fondos-escenarios');

// Alto (relativo a #mapa-wrapper) que ocupan los niveles de un escenario
// (incluido su separador ".divisor-escenario"), para que su fondo cubra
// toda esa franja y no se corte justo en el borde de un círculo.
function calcularRangoVerticalEscenario(idEscenario) {
  const elementos = [
    ...document.querySelectorAll(
      `.fila-nivel[data-escenario="${idEscenario}"], .divisor-escenario[data-escenario="${idEscenario}"]`
    ),
  ];
  if (elementos.length === 0) return null;

  const rectWrapper = elWrapper.getBoundingClientRect();
  const rects = elementos.map((el) => el.getBoundingClientRect());

  return {
    top: Math.min(...rects.map((r) => r.top)) - rectWrapper.top,
    bottom: Math.max(...rects.map((r) => r.bottom)) - rectWrapper.top,
  };
}

// Igual que calcularRangoVerticalEscenario(), pero estira el top/bottom
// hasta la mitad del hueco con el escenario vecino (el "gap" de #camino
// entre filas no le pertenece a ninguno de los dos). Sin esto, entre dos
// fondos consecutivos quedaba una franja gris sin imagen.
//
// OJO con el orden: #camino usa flex-direction: column-reverse, así que
// el escenario con id más ALTO queda dibujado más ARRIBA en la pantalla
// (coordenada Y más chica) — al revés de lo que parecería por el orden
// del array ESCENARIOS. Por eso el vecino que toca el TOP de un
// escenario es el de id+1 ("siguiente", visualmente arriba), y el que
// toca el BOTTOM es el de id-1 ("anterior", visualmente abajo).
function calcularLimitesFondoEscenario(idEscenario) {
  const indice = ESCENARIOS.findIndex((escenario) => escenario.id === Number(idEscenario));
  if (indice === -1) return null;

  const rangoPropio = calcularRangoVerticalEscenario(idEscenario);
  if (!rangoPropio) return null;

  const escenarioSiguiente = ESCENARIOS[indice + 1]; // visualmente arriba
  const rangoSiguiente = escenarioSiguiente && calcularRangoVerticalEscenario(escenarioSiguiente.id);
  const top = rangoSiguiente ? (rangoPropio.top + rangoSiguiente.bottom) / 2 : rangoPropio.top;

  const escenarioAnterior = ESCENARIOS[indice - 1]; // visualmente abajo
  const rangoAnterior = escenarioAnterior && calcularRangoVerticalEscenario(escenarioAnterior.id);
  const bottom = rangoAnterior ? (rangoPropio.bottom + rangoAnterior.top) / 2 : rangoPropio.bottom;

  return { top, bottom };
}

function posicionarFondosEscenarios() {
  Object.keys(FONDOS_ESCENARIOS).forEach((idEscenario) => {
    const rango = calcularLimitesFondoEscenario(idEscenario);
    if (!rango) return;

    let elFondo = elFondosEscenarios.querySelector(`.fondo-escenario[data-escenario="${idEscenario}"]`);
    if (!elFondo) {
      elFondo = document.createElement('div');
      elFondo.className = 'fondo-escenario';
      elFondo.dataset.escenario = idEscenario;
      elFondo.style.backgroundImage = `url('${FONDOS_ESCENARIOS[idEscenario]}')`;
      elFondosEscenarios.appendChild(elFondo);
    }

    elFondo.style.top = `${rango.top}px`;
    elFondo.style.height = `${rango.bottom - rango.top}px`;
  });
}

let temporizadorResize;
window.addEventListener('resize', () => {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(() => {
    dibujarLineas();
    posicionarFondosEscenarios();
    // los nodos pueden moverse al cambiar el tamaño de la ventana; si
    // Candela ya está en reposo (no en medio de la caída inicial) hay
    // que recalcular su posición para que no quede desalineada de su nivel
    if (!elCandela.classList.contains('cayendo-desde-arriba')) {
      fijarCandelaEnCoordenadaDelMapa(obtenerNivelActual());
    }
  }, 150);
});

// ============================================
// MODAL
// ============================================
const elModalOverlay = document.getElementById('modal-overlay');
const elModalTitulo = document.getElementById('modal-titulo');
const elModalEstado = document.getElementById('modal-estado');
const elZonaReto = document.getElementById('zona-reto');
const elModalPregunta = document.getElementById('modal-pregunta');
const elInputRespuesta = document.getElementById('input-respuesta');
const elModalFeedback = document.getElementById('modal-feedback');
const elBtnComprobarRespuesta = document.getElementById('btn-comprobar-respuesta');
const elBtnCerrarModal = document.getElementById('btn-cerrar-modal');

let idNivelAbierto = null;

// normalizarTexto() ahora vive en js/normalizar.js (archivo compartido
// con la sala de escape final, para no duplicar esta logica).

function esRespuestaCorrecta(id, respuestaDada) {
  const reto = PREGUNTAS[id - 1];
  if (!reto) return true; // failsafe: si un nivel no tiene pregunta cargada, no bloquea el avance
  return normalizarTexto(respuestaDada) === normalizarTexto(reto.respuesta);
}

function abrirModal(id) {
  idNivelAbierto = id;
  const escenario = obtenerEscenarioDeNivel(id);
  elModalTitulo.textContent = `Nivel ${id} — ${escenario.nombre}`;
  elModalFeedback.textContent = '';
  elInputRespuesta.value = '';

  if (!estaDesbloqueado(id)) {
    elModalEstado.textContent = '🔒 Nivel bloqueado. Completa el nivel anterior para desbloquearlo.';
    elZonaReto.style.display = 'none';
  } else if (estaCompletado(id)) {
    elModalEstado.textContent = '✅ Ya completaste este nivel.';
    elZonaReto.style.display = 'none';
  } else {
    const reto = PREGUNTAS[id - 1];
    elModalEstado.textContent = 'Responde correctamente para pasar el nivel:';
    elModalPregunta.textContent = reto ? reto.pregunta : '(sin pregunta cargada)';
    elZonaReto.style.display = 'block';
  }

  elModalOverlay.classList.remove('oculto');
}

function cerrarModal() {
  elModalOverlay.classList.add('oculto');
  idNivelAbierto = null;
}

function marcarNivelCompletado(id) {
  if (!progreso.nivelesCompletados.includes(id)) {
    progreso.nivelesCompletados.push(id);
    guardarProgreso(progreso);
  }
}

function intentarResponder() {
  if (idNivelAbierto === null) return;
  const idIntentado = idNivelAbierto;

  if (!esRespuestaCorrecta(idIntentado, elInputRespuesta.value)) {
    elModalFeedback.textContent = '❌ Respuesta incorrecta, prueba de nuevo.';
    return;
  }

  marcarNivelCompletado(idIntentado);
  cerrarModal();
  aplicarTransicionDeNivelCompletado(idIntentado);
  dispararConversacionSiCorresponde(idIntentado);
}

// Conversación 2: al terminar el primer escenario (nivel 10).
// Conversación 3: al terminar todo el mapa (último nivel) — al cerrarse
// esta conversación, se abre la sala de escape final (escape.html).
function dispararConversacionSiCorresponde(idCompletado) {
  if (idCompletado === NIVELES_POR_ESCENARIO) {
    mostrarDialogo(CONVERSACIONES.nivel10);
  } else if (idCompletado === TOTAL_NIVELES) {
    mostrarDialogo(CONVERSACIONES.final, () => {
      window.location.href = 'escape.html';
    });
  }
}

elBtnComprobarRespuesta.addEventListener('click', intentarResponder);
elInputRespuesta.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') intentarResponder();
});

elBtnCerrarModal.addEventListener('click', cerrarModal);
elModalOverlay.addEventListener('click', (evento) => {
  if (evento.target === elModalOverlay) cerrarModal();
});

// ============================================
// DEBUG: reiniciar progreso
// ============================================
document.getElementById('btn-reiniciar-progreso').addEventListener('click', () => {
  progreso = { nivelesCompletados: [] };
  guardarProgreso(progreso);
  renderizarMapa();
  // sin esto, Candela se quedaba en la posición de donde iba antes de
  // reiniciar en vez de volver al nivel 1
  elCandela.src = 'multimedia/Candela/normal.png';
  fijarCandelaEnCoordenadaDelMapa(obtenerNivelActual());
});

// ============================================
// SCROLL DE BIENVENIDA: recorre todo el mapa en ~5 segundos al abrir
// ============================================
const DURACION_APERTURA_MS = 5000;

// Cuánto hay que scrollear para que quede a la vista el final del camino.
// Se calcula UNA sola vez y se comparte con la caída de Candela, para que
// las dos animaciones terminen sincronizadas en vez de usar cada una su
// propia cuenta y desincronizarse.
function calcularDestinoScroll() {
  const finDelMapa = elWrapper.getBoundingClientRect().bottom + window.scrollY;
  const maximoScroll = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(finDelMapa - window.innerHeight, maximoScroll);
}

function animarScrollDeBienvenida(destinoY, duracionMs = DURACION_APERTURA_MS) {
  if (destinoY <= 0) return; // el mapa entero ya entra en la pantalla, no hace falta animar

  const inicioTiempo = performance.now();

  function paso(ahora) {
    const progreso = Math.min((ahora - inicioTiempo) / duracionMs, 1);
    // suavizado ease-in-out: arranca y termina despacio
    const progresoSuavizado = progreso < 0.5
      ? 2 * progreso * progreso
      : 1 - Math.pow(-2 * progreso + 2, 2) / 2;

    window.scrollTo(0, destinoY * progresoSuavizado);

    if (progreso < 1) {
      requestAnimationFrame(paso);
    }
  }

  requestAnimationFrame(paso);
}

// ============================================
// CANDELA CAYENDO: baja dando vueltas desde arriba hasta su casilla actual
// ============================================
function obtenerNivelActual() {
  // la "casilla" en la que está Candela: el primer nivel desbloqueado
  // que todavía no completó
  for (let id = 1; id <= TOTAL_NIVELES; id++) {
    if (estaDesbloqueado(id) && !estaCompletado(id)) return id;
  }
  return TOTAL_NIVELES; // ya completó todo: la dejamos en el último nivel
}

const elCandela = document.getElementById('img-candela-cayendo');

// Coordenada DEL MAPA (relativa a #mapa-wrapper) de un nivel — la misma
// idea que usa dibujarLineas() para ubicar los nodos. Esta es la posición
// "de reposo" de Candela: al usarla con position:absolute, se queda
// pegada a su nivel y scrollea junto con el resto del mapa.
function calcularYEnMapa(idNivel) {
  const nodo = document.querySelector(`.nivel[data-id="${idNivel}"]`);
  if (!nodo) return null;

  const rectWrapper = elWrapper.getBoundingClientRect();
  const rectNodo = nodo.getBoundingClientRect();
  return rectNodo.top - rectWrapper.top + rectNodo.height / 2 - elCandela.offsetHeight / 2;
}

// Coordenada DE PANTALLA de un nivel para un scroll final concreto — solo
// se usa durante la caída inicial, mientras Candela está con
// position:fixed (clase .cayendo-desde-arriba), para no desincronizarse
// del scroll automático de bienvenida.
function calcularYObjetivoCandela(idNivel, scrollFinalY) {
  const nodo = document.querySelector(`.nivel[data-id="${idNivel}"]`);
  if (!nodo) return null;

  const rectNodo = nodo.getBoundingClientRect();
  const centroNodoEnDocumento = rectNodo.top + window.scrollY + rectNodo.height / 2;
  return centroNodoEnDocumento - Math.max(scrollFinalY, 0) - elCandela.offsetHeight / 2;
}

// Coordenada X DEL MAPA (relativa a #mapa-wrapper) de un nivel — análoga a
// calcularYEnMapa. Hace falta porque los niveles hacen zigzag (izquierda/
// centro/derecha): sin esto Candela solo se movía en vertical y quedaba
// siempre centrada en horizontal, sin importar en qué columna estuviera
// su nivel real.
function calcularXEnMapa(idNivel) {
  const nodo = document.querySelector(`.nivel[data-id="${idNivel}"]`);
  if (!nodo) return null;

  const rectWrapper = elWrapper.getBoundingClientRect();
  const rectNodo = nodo.getBoundingClientRect();
  return rectNodo.left - rectWrapper.left + rectNodo.width / 2 - elCandela.offsetWidth / 2;
}

// Coordenada X DE PANTALLA de un nivel — a diferencia de la Y, la página
// nunca scrollea en horizontal, así que no hace falta restar ningún scroll.
function calcularXObjetivoCandela(idNivel) {
  const nodo = document.querySelector(`.nivel[data-id="${idNivel}"]`);
  if (!nodo) return null;

  const rectNodo = nodo.getBoundingClientRect();
  return rectNodo.left + rectNodo.width / 2 - elCandela.offsetWidth / 2;
}

function animarCandelaCayendo(destinoScrollY, duracionMs = DURACION_APERTURA_MS) {
  const idNivelDestino = obtenerNivelActual();
  const yObjetivoEnPantalla = calcularYObjetivoCandela(idNivelDestino, destinoScrollY);
  const xObjetivoEnPantalla = calcularXObjetivoCandela(idNivelDestino);
  if (yObjetivoEnPantalla === null || xObjetivoEnPantalla === null) return;

  // mientras cae, se fija a la PANTALLA (no al mapa) para no
  // desincronizarse del scroll automático, que tiene su propio ritmo
  elCandela.classList.add('cayendo-desde-arriba');
  elCandela.style.transitionDuration = `${duracionMs}ms`;

  // fuerza un reflow para que el navegador registre la posición inicial
  // (top: 0) antes de animar hacia la posición final
  void elCandela.offsetHeight;

  elCandela.style.top = `${yObjetivoEnPantalla}px`;
  elCandela.style.left = `${xObjetivoEnPantalla}px`;
  elCandela.style.transform = 'translateX(-50%) rotate(1080deg)'; // 3 vueltas completas

  // al aterrizar, cambia la cara triste por la normal y deja de
  // perseguir la pantalla: pasa a quedarse pegada a su nivel en el mapa
  const alTerminarDeCaer = (evento) => {
    if (evento.propertyName !== 'top') return;
    elCandela.removeEventListener('transitionend', alTerminarDeCaer);
    elCandela.src = 'multimedia/Candela/normal.png';
    fijarCandelaEnCoordenadaDelMapa(idNivelDestino);
    // Conversación 1: apenas Candela aterriza tras la caída/scroll inicial
    mostrarDialogo(CONVERSACIONES.inicio);
  };
  elCandela.addEventListener('transitionend', alTerminarDeCaer);
}

// ============================================
// TRANSICIÓN AL COMPLETAR UN NIVEL (sin recargar todo el mapa)
// ============================================
const DURACION_SUBIDA_NIVEL_MS = 500;

// Cambia a Candela de coordenadas de PANTALLA (usadas solo durante la
// caída) a coordenadas del MAPA, sin que se note el salto — el cambio de
// sistema de coordenadas es instantáneo (sin transición) porque
// visualmente ella ya está exactamente ahí.
function fijarCandelaEnCoordenadaDelMapa(idNivel) {
  const yMapa = calcularYEnMapa(idNivel);
  const xMapa = calcularXEnMapa(idNivel);
  if (yMapa === null || xMapa === null) return;

  elCandela.style.transitionDuration = '0s';
  elCandela.classList.remove('cayendo-desde-arriba'); // vuelve a position: absolute
  elCandela.style.top = `${yMapa}px`;
  elCandela.style.left = `${xMapa}px`;

  // se restaura la duración normal para la próxima vez que se mueva
  void elCandela.offsetHeight;
  elCandela.style.transitionDuration = `${DURACION_SUBIDA_NIVEL_MS}ms`;
}

function subirCandelaHastaNivel(idNivel, duracionMs = DURACION_SUBIDA_NIVEL_MS) {
  const yMapa = calcularYEnMapa(idNivel);
  const xMapa = calcularXEnMapa(idNivel);
  if (yMapa === null || xMapa === null) return;

  elCandela.style.transitionDuration = `${duracionMs}ms`;
  elCandela.style.top = `${yMapa}px`;
  elCandela.style.left = `${xMapa}px`;
  // esta vez no rota: solo "sube" al siguiente nivel, en coordenadas del mapa
}

function aplicarTransicionDeNivelCompletado(idCompletado) {
  // el nodo recién pasado se pinta de verde (transición CSS por el
  // cambio de clase, ver estilos de .nivel en mapa.html)
  const nodoCompletado = document.querySelector(`.nivel[data-id="${idCompletado}"]`);
  if (nodoCompletado) {
    nodoCompletado.classList.remove('desbloqueado');
    nodoCompletado.classList.add('completado');
  }

  // la línea que sale de ese nodo también pasa a verde (transición CSS
  // del atributo stroke, ver estilos de "#rutas line")
  const lineaSiguiente = elSvg.querySelector(`line[data-desde="${idCompletado}"]`);
  if (lineaSiguiente) {
    lineaSiguiente.setAttribute('stroke', '#22c55e');
  }

  const idSiguiente = idCompletado + 1;

  if (idSiguiente <= TOTAL_NIVELES) {
    // se desbloquea el siguiente nivel (también anima su color)
    const nodoSiguiente = document.querySelector(`.nivel[data-id="${idSiguiente}"]`);
    if (nodoSiguiente) {
      nodoSiguiente.classList.remove('bloqueado');
      nodoSiguiente.classList.add('desbloqueado');
    }

    // y Candela sube dinámicamente hasta ahí
    subirCandelaHastaNivel(idSiguiente);
  }

  elProgresoTexto.textContent =
    `Completaste ${progreso.nivelesCompletados.length} de ${TOTAL_NIVELES} niveles`;
}

// ============================================
// SECUENCIA DE APERTURA
// ============================================
function iniciarSecuenciaDeApertura() {
  window.scrollTo(0, 0);
  const destinoScrollY = calcularDestinoScroll();
  animarCandelaCayendo(destinoScrollY);
  animarScrollDeBienvenida(destinoScrollY);
}

// ============================================
// INICIO
// ============================================
renderizarMapa();

// pequeño delay para asegurarnos de que el mapa y las líneas ya se
// terminaron de dibujar antes de medir posiciones para el scroll
setTimeout(iniciarSecuenciaDeApertura, 150);
