// ============================================
// CONTENIDO DE LA SALA DE ESCAPE FINAL
// ============================================
// Se juega en escape.html, después de completar los 20 niveles del mapa.
// Cada objeto es una "sala". Se resuelven en orden: la primera es la
// sala 1, la última es la puerta de salida.
//
// Tres tipos de sala (el motor de cada uno vive en un archivo propio):
// - "sopa-letras" (js/sopa-letras.js + la parte de escape.js que arma
//   #zona-sopa-letras): una grilla de "filas" x "columnas" con las
//   "palabras" escondidas en horizontal (izquierda a derecha) o vertical
//   (arriba a abajo) — nunca al revés ni en diagonal. "textoIntro" es el
//   texto que va arriba de la grilla. Abajo se generan tantas filas de
//   input como palabras haya; al escribir una palabra que encaje, sus
//   letras se pintan de rojo en la grilla. Si no encaja (o ya estaba
//   encontrada), no pasa nada.
// - "juego-1024" (js/juego-2048.js + la parte de escape.js que arma
//   #zona-2048 — los nombres internos del motor quedaron en "2048", es
//   cosmético): un 4x4 estilo "1024"/2048, con botón "Jugar" que arranca
//   el tablero y un cronómetro de "duracionSegundos". "textoIntro" es el
//   texto que va arriba, antes de apretar "Jugar". Hay que llegar a
//   "objetivoPuntuacion" de puntuación (sumando lo que se gana en cada
//   fusión de fichas, no el valor de una sola ficha) antes de que se
//   acabe el tiempo. Si se acaba el tiempo, o el tablero se traba sin
//   más movimientos posibles, se dispara `CONVERSACIONES.fallo2048` (ver
//   js/conversaciones.js) y al cerrarla el juego se reinicia (mismo
//   tablero limpio, mismo cronómetro completo, hay que apretar "Jugar"
//   de nuevo).
// - "eleccion" (la parte de escape.js que arma #zona-eleccion): "pista"
//   se muestra igual que en el candado de código, pero en vez de un
//   input hay una casilla clickeable por cada elemento de "opciones"
//   ({ personaje, expresion }, con la imagen
//   multimedia/<personaje>/<expresion>.png y el nombre debajo). Si se
//   clickea la casilla cuyo "personaje" coincide con
//   "respuestaCorrecta", se pasa de sala; si no, no pasa nada.
// - "despedida" (la parte de escape.js que arma #zona-despedida): no es
//   un reto, no tiene solución que escribir ni que tocar — solo muestra
//   "texto" (un mensaje real, sin personaje de por medio) y un link para
//   volver al mapa. Es la última sala: al llegar acá termina el juego
//   de verdad, no hay sala siguiente. Por eso avanzarASiguienteSala()
//   en js/escape.js nunca deja que salaActual pase de la última sala
//   (clamp), y ya no existe una pantalla de "victoria" genérica aparte
//   — esta sala ES esa pantalla final.
// - sin "tipo" (las demás salas, de toda la vida): un enigma con su
//   código, comparado con normalizarTexto() como el resto del proyecto.
//
// Las 4 salas ya tienen su contenido real (nada de EJEMPLO).
const SALAS_ESCAPE = [
  {
    tipo: 'sopa-letras',
    titulo: 'Sala 1 — La pared grabada',
    textoIntro: 'Vamos a ver que tan rapido haces esto. Vas a tener que buscar 8 palabras en esta sopa de letras. Te lo he copiado, lo sé, pero como me critiques mato a tu novio, ten cuidado. Termina esto rapido que tengo las espectativas muy altas en ti.',
    // 10x10: se achicó desde el 20x20 original (a pedido del usuario, para
    // que no cueste tanto encontrar las palabras) pero sin pasarse de
    // fácil — con estas 8 palabras (46 letras en total) llena ~46% de la
    // grilla, y la más larga ("risotto", 7 letras) ocupa casi toda una
    // fila/columna. Probado con 300 generaciones al azar: 100% de éxito
    // ubicando las 8 palabras en este tamaño.
    filas: 10,
    columnas: 10,
    palabras: ['koldo', 'iloveu', 'abrazo', 'acotar', 'vuelve', 'twerk', 'peque', 'risotto'],
  },
  {
    tipo: 'juego-1024',
    titulo: 'Sala 2 — Tu juego favorito',
    textoIntro: 'Para este segundo juego, vamos a ver qué tan buena eres en el 1024, tu juego favorito. Desde el primer día llevas fardando de que eres la mejor, que si no te gana nadie. Perfecto, vamos a ver qué tan verdad es eso. Tienes 5 minutos para llegar a 2048 puntos, si no llegas. Eres inútil. Mucha suerte.',
    objetivoPuntuacion: 2048,
    duracionSegundos: 5 * 60, // 5 minutos, a pedido del usuario
  },
  {
    tipo: 'eleccion',
    titulo: 'Sala 3 — ¿Quién es el asesino?',
    pista:
      'Ha aparecido un cuerpo y hay que averiguar quién es el asesino: ¿Candela, Luis, o el Demonio?\n\n' +
      'Pista 1: el asesino mató a alguien más joven que él. Sabemos que el Demonio es mayor que Luis, y que Luis es mayor que Candela — así que Candela queda descartada: no hay nadie más joven que ella a quien pudiera haber matado.\n\n' +
      'Pista 2: en la escena no se encontró ni una garra ni una cola, solo un par de huellas de dedos normales — así que tampoco fue el Demonio.\n\n' +
      'Pista 3: entre el barro quedó marcada una huella de zapatilla. Esa noche, el Demonio y Candela estaban descalzos — solo una persona llevaba puestas zapatillas.\n\n' +
      'Tocá en quién creés que es.',
    opciones: [
      { personaje: 'Luis', expresion: 'triste' },
      { personaje: 'Candela', expresion: 'feliz' },
      { personaje: 'Demonio', expresion: 'diabolico' },
    ],
    respuestaCorrecta: 'Luis',
  },
  {
    tipo: 'despedida',
    titulo: 'Sala 4 — Despedida',
    // Texto real, tal cual DESPEDIDA.md, con dos correcciones de tildes
    // ("no sé qué" y "más") y un typo ("par que" -> "para que"). El resto
    // se dejó tal cual está escrito.
    texto:
      'Hola, Candelaria,\n\n' +
      'Lo primero, muchas felicidades, no sé qué estarás haciendo ahora mismo, igual no es ni tu cumple. Hace ya unas semanas que has empezado a salir con un grupo nuevo de chicas. Parecen super majas y estoy seguro de que te van a mejorar mucho la experiencia en San Diego.\n\n' +
      'Siento no poder estar ahí para pasar tu cumpleaños contigo, me habría encantado. Pero solo faltan 8 meses para que vuelvas. Y cuando llegue ese momento, voy a pasar todos tus cumpleaños a tu lado, intentando que sean lo más perfectos posibles :)\n\n' +
      'Solo quería agradecerte todos estos meses que he estado a tu lado. Me has enseñado la pedazo de persona que eres. Y te mereces un regalo a la altura.\n\n' +
      'Espero que lo hayas disfrutado.\n\n' +
      'Te quiero mucho Candelaria,\n\n' +
      'Muchísimas felicidades :)\n\n' +
      'Luis',
  },
];
