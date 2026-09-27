// ============================================
// CONTENIDO DE LAS CONVERSACIONES (CUTSCENES)
// ============================================
// Cada conversación es un array de líneas { personaje, expresion, texto }.
// - personaje: nombre EXACTO de la carpeta en multimedia/ ('Candela',
//   'Luis' o 'Demonio'), porque js/dialogo.js arma la ruta de la imagen
//   como `multimedia/${personaje}/${expresion}.png`.
// - expresion: nombre del archivo sin extensión. Expresiones que existen
//   hoy por personaje:
//     Candela -> normal, feliz, triste, enfadado
//     Luis    -> normal, feliz, triste, enfadado
//     Demonio -> diabolico, enfadado, triste   (no tiene normal ni feliz)
//   Si se usa una que no existe, js/dialogo.js cae sola a la expresión
//   por defecto de ese personaje en vez de romperse.
//
// Contenido real, migrado desde DIALOGOS.md (fuente de verdad del texto y
// del orden de las líneas). Cada guion "-" de DIALOGOS.md es una línea de
// diálogo separada (se muestra una por vez, con "Siguiente ▶"), y todas
// las líneas seguidas del mismo personaje comparten su expresión hasta que
// aparece otro encabezado "Personaje(expresión):". Dos ajustes al migrar:
//   - Luis(llorando) -> 'triste' (Luis no tiene "llorando" como archivo).
//   - Demonio(Demonio con casita): no es una expresión de cara, sino la
//     acotación de que se mete en la caseta. Esa imagen
//     ("demonio con casita.png") está suelta en multimedia/, no dentro de
//     multimedia/Demonio/, así que esa línea usa "imagen" (ruta completa)
//     en vez de "expresion" — js/dialogo.js le da prioridad.
const CONVERSACIONES = {
  // Se dispara cuando Candela termina de caer al abrir/recargar el mapa.
  inicio: [
    { personaje: 'Luis', expresion: 'triste', texto: 'Candelaaaaaa' },
    { personaje: 'Luis', expresion: 'triste', texto: 'Me han secuestrado' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Hola, Candela,' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Veo que nos has seguido' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Que esta pasando aquí' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Por que secuestras al amor de mi vida' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: '¿Tu sabes el lache que me habéis dado durante toda la relación?' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Voy a darte la oportunidad de irte ahora que puedes' },
    { personaje: 'Candela', expresion: 'enfadado', texto: '¿Lache?' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Lache das tu con esas mallitas' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Son las únicas que tengo ¿vale?' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Bueno, ya me he cansado' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Si quieres recuperar a tu querido novio' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Vas a tener que superar una serie de retos' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Vamos a ver que tan bien os conocéis' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Veo que has venido con los dos libros' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Vas a tener que buscar las fechas de los acontecimientos que salgan en las preguntas' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Si tienes alguna duda de aguantas' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Si eres tan lista podrás hacer todo esto solita sin ayuda' },
    { personaje: 'Luis', expresion: 'triste', texto: 'Candela, sálvame por favor' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Cállate y metete en la caseta' },
    { personaje: 'Demonio', imagen: 'multimedia/demonio con casita.png', texto: 'Ahora quédate ahí y no salgas' },
  ],

  // Se dispara al completar el nivel 10 (fin del primer escenario).
  nivel10: [
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Veo que no vas por tan mal camino' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Para sorpresa de todos' },
    { personaje: 'Candela', expresion: 'feliz', texto: 'Lo sé' },
    { personaje: 'Candela', expresion: 'feliz', texto: 'Si es que soy la mejor' },
    { personaje: 'Luis', expresion: 'feliz', texto: 'Mi novia es la mejor' },
    { personaje: 'Luis', expresion: 'feliz', texto: 'Mi novia es la mejor' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Que asco dais de verdad' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Cállate' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Tienes mucha envidia' },
    { personaje: 'Candela', expresion: 'triste', texto: 'No te preocupes mi turroncito de chocolate' },
    { personaje: 'Candela', expresion: 'triste', texto: 'Ahora mismo voy a por ti' },
  ],

  // Se dispara al completar el último nivel (hoy el 20).
  final: [
    { personaje: 'Candela', expresion: 'feliz', texto: 'Por fin he llegado' },
    { personaje: 'Candela', expresion: 'feliz', texto: 'Luis, ya estoy aquí!!!!' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Tu' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Rojo de mierda' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Quítale las manos de encima a mi novio' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Que asco dais de verdad' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Pero no creerás que va a ser tan fácil no?' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Esto es solo el principio' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Ahora viene el juego de verdad' },
    { personaje: 'Candela', expresion: 'enfadado', texto: 'Que estas diciendo' },
    { personaje: 'Candela', expresion: 'enfadado', texto: '¿Esto no ha terminado todavía?' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Ni mucho menos' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Ahora viene un scape room' },
    { personaje: 'Demonio', expresion: 'diabolico', texto: 'Pasa las siguientes prueba y igual vuelves a ver a tu novio' },
    { personaje: 'Luis', expresion: 'triste', texto: 'Candela, por favor, ayúdame' },
  ],

  // Se dispara en escape.html al fallar el 2048 de la sala 2 (se acaba el
  // tiempo, o el tablero se traba sin más movimientos posibles), justo
  // antes de reiniciar ese juego. TODO: sin texto todavía a propósito (el
  // usuario pidió no escribirlo por ahora) — mostrarDialogo() con un
  // array vacío no muestra nada y pasa directo al reinicio, así que el
  // mecanismo ya funciona; cuando se defina el texto, alcanza con llenar
  // este array.
  fallo2048: [],

  // Se dispara en escape.html al resolver la sala 3 (la adivinanza del
  // asesino), antes de mostrar la sala 4 (la despedida, ver
  // js/escape-salas.js) — "Conversación final" en DIALOGOS.md.
  finalEscape: [
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Parece que le quieres de verdad' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'No os voy a hacer perder mas el tiempo' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Estáis destinados a estar juntos' },
    { personaje: 'Candela', expresion: 'feliz', texto: 'Ya se' },
    { personaje: 'Candela', expresion: 'feliz', texto: 'Devuelve a mi brownie de chocolate' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Que si, pesada' },
    { personaje: 'Demonio', expresion: 'enfadado', texto: 'Aquí lo tienes' },
    { personaje: 'Luis', expresion: 'feliz', texto: 'Candelaaaaa' },
    { personaje: 'Luis', expresion: 'feliz', texto: 'Lo has conseguido' },
  ],
};
