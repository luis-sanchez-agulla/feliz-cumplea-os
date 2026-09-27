// ============================================
// MOTOR DEL JUEGO 2048 (usado por la sala 2 de escape.html)
// ============================================
// Sin nada de DOM acá (igual que js/sopa-letras.js): solo el estado del
// tablero y las reglas de movimiento/fusión, para poder probarlo aparte.
// Reglas estándar del "1024"/2048: tablero de NxN, cada casilla vacía o
// con un número (potencia de 2); al mover en una dirección, todas las
// fichas se deslizan hacia ese lado y dos fichas iguales que quedan
// juntas se fusionan en una del doble de valor (una sola vez por ficha y
// por movimiento); después de cada movimiento que cambió algo, aparece
// una ficha nueva (2, casi siempre, o 4) en una casilla vacía al azar.

function crearTableroVacio(filas, columnas) {
  return Array.from({ length: filas }, () => Array(columnas).fill(0));
}

// Agrega una ficha (2 el 90% de las veces, 4 el 10%) en una casilla vacía
// al azar. Devuelve false si no había ninguna casilla vacía.
function agregarFichaAleatoria(tablero) {
  const vacias = [];
  tablero.forEach((fila, f) => {
    fila.forEach((valor, c) => {
      if (valor === 0) vacias.push({ fila: f, columna: c });
    });
  });
  if (vacias.length === 0) return false;

  const { fila, columna } = vacias[Math.floor(Math.random() * vacias.length)];
  tablero[fila][columna] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function crearTableroInicial(filas, columnas) {
  const tablero = crearTableroVacio(filas, columnas);
  agregarFichaAleatoria(tablero);
  agregarFichaAleatoria(tablero);
  return tablero;
}

// Desliza una fila hacia la izquierda y fusiona fichas iguales
// consecutivas. Devuelve la fila resultante (mismo largo, rellena con
// 0 a la derecha) y los puntos ganados por las fusiones.
function deslizarYFusionarFila(fila) {
  const valores = fila.filter((v) => v !== 0);
  const resultado = [];
  let puntuacionGanada = 0;

  let i = 0;
  while (i < valores.length) {
    if (i + 1 < valores.length && valores[i] === valores[i + 1]) {
      const fusionado = valores[i] * 2;
      resultado.push(fusionado);
      puntuacionGanada += fusionado;
      i += 2;
    } else {
      resultado.push(valores[i]);
      i += 1;
    }
  }
  while (resultado.length < fila.length) resultado.push(0);

  return { fila: resultado, puntuacionGanada };
}

function moverIzquierda(tablero) {
  let puntuacionGanada = 0;
  const tableroNuevo = tablero.map((fila) => {
    const resultado = deslizarYFusionarFila(fila);
    puntuacionGanada += resultado.puntuacionGanada;
    return resultado.fila;
  });
  const seMovio = JSON.stringify(tableroNuevo) !== JSON.stringify(tablero);
  return { tablero: tableroNuevo, puntuacionGanada, seMovio };
}

function invertirFilas(tablero) {
  return tablero.map((fila) => [...fila].reverse());
}

function transponer(tablero) {
  return tablero[0].map((_, c) => tablero.map((fila) => fila[c]));
}

function moverDerecha(tablero) {
  const resultado = moverIzquierda(invertirFilas(tablero));
  return { ...resultado, tablero: invertirFilas(resultado.tablero) };
}

// Mover "arriba" en el tablero normal equivale a mover "izquierda" en el
// tablero transpuesto (las columnas pasan a ser filas); análogo para
// "abajo" con "derecha". Así se reutiliza la misma lógica de fusión de
// filas para las 4 direcciones sin repetirla.
function moverArriba(tablero) {
  const resultado = moverIzquierda(transponer(tablero));
  return { ...resultado, tablero: transponer(resultado.tablero) };
}

function moverAbajo(tablero) {
  const resultado = moverDerecha(transponer(tablero));
  return { ...resultado, tablero: transponer(resultado.tablero) };
}

// true si queda alguna casilla vacía, o alguna ficha igual a una vecina
// (horizontal o vertical) — o sea, si todavía hay algún movimiento
// posible. Si da false, el tablero está trabado: no se puede seguir.
function hayMovimientosPosibles(tablero) {
  for (let f = 0; f < tablero.length; f++) {
    for (let c = 0; c < tablero[f].length; c++) {
      if (tablero[f][c] === 0) return true;
      if (c + 1 < tablero[f].length && tablero[f][c] === tablero[f][c + 1]) return true;
      if (f + 1 < tablero.length && tablero[f][c] === tablero[f + 1][c]) return true;
    }
  }
  return false;
}
