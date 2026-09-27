// ============================================
// MOTOR DE SOPA DE LETRAS (usado por la sala 1 de escape.html)
// ============================================
// Genera una grilla de letras y coloca cada palabra en línea recta, SOLO
// en dos direcciones (a pedido del usuario): horizontal de izquierda a
// derecha, o vertical de arriba a abajo. Nada de diagonales ni palabras
// al revés.
//
// normalizarTexto() viene de js/normalizar.js (se carga antes que este
// archivo en escape.html) — se usa acá para limpiar cada palabra a
// mayúsculas sin tildes antes de dibujarla en la grilla, así la grilla
// queda consistente con cómo se compara lo que escribe el jugador.

const ALFABETO_RELLENO_SOPA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function limpiarPalabraParaGrilla(palabra) {
  return normalizarTexto(palabra).toUpperCase().replace(/[^A-ZÑ]/g, '');
}

// Intenta ubicar cada palabra en la grilla (horizontal u vertical, al
// azar) sin pisar letras ya puestas que no coincidan. Si una palabra no
// entra después de varios intentos, se avisa por consola y se la deja
// sin ubicar (para no romper el resto del mecanismo).
function colocarPalabrasEnGrilla(palabras, filas, columnas) {
  const grilla = Array.from({ length: filas }, () => Array(columnas).fill(null));
  const posiciones = {}; // palabra original -> [{ fila, columna }, ...] en orden de lectura
  const INTENTOS_MAXIMOS = 300;

  palabras.forEach((palabraOriginal) => {
    const palabra = limpiarPalabraParaGrilla(palabraOriginal);
    if (!palabra) return;

    for (let intento = 0; intento < INTENTOS_MAXIMOS; intento++) {
      const horizontal = Math.random() < 0.5;
      const largo = palabra.length;

      if (horizontal && largo > columnas) continue;
      if (!horizontal && largo > filas) continue;

      const fila = horizontal
        ? Math.floor(Math.random() * filas)
        : Math.floor(Math.random() * (filas - largo + 1));
      const columna = horizontal
        ? Math.floor(Math.random() * (columnas - largo + 1))
        : Math.floor(Math.random() * columnas);

      const celdas = [];
      let cabe = true;
      for (let i = 0; i < largo; i++) {
        const f = horizontal ? fila : fila + i;
        const c = horizontal ? columna + i : columna;
        const letraActual = grilla[f][c];
        if (letraActual !== null && letraActual !== palabra[i]) {
          cabe = false;
          break;
        }
        celdas.push({ fila: f, columna: c });
      }

      if (!cabe) continue;

      celdas.forEach((celda, i) => {
        grilla[celda.fila][celda.columna] = palabra[i];
      });
      posiciones[palabraOriginal] = celdas;
      return;
    }

    console.warn(
      `Sopa de letras: no se pudo ubicar "${palabraOriginal}" (¿demasiado larga para ${filas}x${columnas}, o la grilla está muy llena?).`
    );
  });

  return { grilla, posiciones };
}

function rellenarHuecosDeGrilla(grilla) {
  for (let f = 0; f < grilla.length; f++) {
    for (let c = 0; c < grilla[f].length; c++) {
      if (grilla[f][c] === null) {
        grilla[f][c] = ALFABETO_RELLENO_SOPA[Math.floor(Math.random() * ALFABETO_RELLENO_SOPA.length)];
      }
    }
  }
}

// Genera una sopa de letras nueva de "filas" x "columnas". Devuelve la
// grilla ya completa (para dibujar) y un mapa palabra -> celdas (para
// poder pintarla de rojo cuando el jugador la acierte).
function generarSopaDeLetras(palabras, filas, columnas) {
  const { grilla, posiciones } = colocarPalabrasEnGrilla(palabras, filas, columnas);
  rellenarHuecosDeGrilla(grilla);
  return { grilla, posiciones };
}
