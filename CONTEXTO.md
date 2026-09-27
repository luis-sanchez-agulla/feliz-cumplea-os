# Contexto del proyecto — App "Feliz Cumpleaños Candela"

## Qué es esto
Una aplicación web (página web) hecha para Candela, como sorpresa/regalo de cumpleaños.

## Requisito clave (no negociable salvo que el usuario lo cambie)
La persona que abre esto **no tiene conocimientos de tecnología**. Tiene que poder
abrir la app con un solo doble clic, sin instalar nada, sin terminal, sin servidor.
Por eso elegimos una **web estática pura** (HTML + CSS + JS, sin frameworks, sin
build, sin `npm install`, sin Node, sin nada que requiera pasos previos).

## Cómo se abre la app
Candela usa **Mac**. Doble clic en `Abrir Aplicación.command` (recomendado).
Eso abre `intro.html` — **ya no `index.html` directo** — que reproduce un
video de intro y, al terminar, pasa solo al mapa (`index.html`).

Flujo completo: `intro.html` (video) → termina el video → `index.html`
(mapa) → al abrirse, la página hace un scroll automático de ~5 segundos
que recorre todo el camino de niveles antes de quedar quieta.

Nota técnica sobre el `.command`: es un script de shell. macOS necesita el
bit de ejecución (`chmod +x`) para poder abrirlo con doble clic; ya quedó
seteado. Al abrirse, aparece brevemente una ventana de Terminal (es normal,
así funcionan los `.command` en Mac) y se abre la página en el navegador.
Si en algún momento se pasa el proyecto por un medio que no conserve
permisos (por ejemplo, un zip mal armado), puede que haya que volver a
correr `chmod +x "Abrir Aplicación.command"`.

## Cómo probar en un navegador real desde este entorno (WSL)
Durante mucho tiempo se asumió en este documento que "no hay navegador
disponible en este entorno de desarrollo" — **eso ya no es cierto, hay
una forma**. El entorno de desarrollo es WSL (Windows Subsystem for
Linux) sobre un Windows real, y ese Windows sí tiene navegadores
instalados, accesibles desde WSL. Se puede lanzar Chrome de Windows en
modo headless para renderizar cualquier página del proyecto y sacarle
screenshot o volcar el DOM ya con el JS ejecutado — así se pudo
encontrar y confirmar el bug de los fondos de escenario más abajo, en
vez de solo revisar el código a ojo.

Comando base (ejemplo, ajustar rutas):
```bash
WIN_PATH=$(wslpath -w "$(pwd)/index.html")
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless --disable-gpu --virtual-time-budget=3000 \
  --screenshot="C:\\Users\\luis\\AppData\\Local\\Temp\\captura.png" \
  --window-size=800,3000 \
  "file:///$WIN_PATH"
```
La imagen queda en `/mnt/c/Users/luis/AppData/Local/Temp/captura.png`
(ruta de WSL), se puede leer con la herramienta de lectura de archivos.
También sirve `--dump-dom` en vez de `--screenshot` para volcar el HTML
ya renderizado (con los estilos inline que puso el JS) a stdout — útil
para inspeccionar valores calculados sin depender de leer una imagen.
Para depurar valores internos de JS que no quedan en el DOM, se puede
copiar el proyecto a una carpeta temporal (scratchpad) y agregarle un
`<script>` al final del HTML que llame a las funciones y vuelque el
resultado en un `<pre>` visible (así aparece en el `--dump-dom`) — eso
fue lo que permitió ver los números exactos que causaban el bug de los
fondos, sin tocar el proyecto real.

Limitación encontrada: `npx playwright` no funciona en este WSL (le
faltan librerías del sistema como `libnspr4`/`libnss3`, y no hay sudo
sin contraseña para instalarlas) — por eso se terminó usando
directamente el Chrome de Windows vía interop de WSL (`chrome.exe`) en
vez de Playwright.

**Las notas de "no se probó en un navegador real" que quedan repartidas
por este documento son de ANTES de descubrir esto** — quedaron como
estaban porque en su momento eran ciertas, pero de ahora en más
conviene probar así antes de asumir que algo funciona.

## Estructura de carpetas creada

```
feliz-cumpleaños/
├── intro.html                 # Punto de entrada REAL: video intro → redirige a index.html
├── index.html                 # El mapa de niveles
├── Abrir Aplicación.command   # Lanzador amigable para Mac (abre intro.html)
├── CONTEXTO.md                # Este archivo
├── DIALOGOS.md                # Fuente de los 3 diálogos reales (ya migrados a js/conversaciones.js)
├── css/
│   └── styles.css             # Sin usar por ahora (CSS va inline en index.html)
├── escape.html                # Mini-juego final: sala de escape (tras completar los 20 niveles)
├── js/
│   ├── script.js               # Lógica del mapa (estado, render, scroll de bienvenida, reto)
│   ├── preguntas.js            # Array PREGUNTAS: reto (pregunta/respuesta) de cada nivel
│   ├── dialogo.js              # Motor genérico de diálogo/cutscenes (mostrarDialogo)
│   ├── conversaciones.js       # Contenido real de las 3 conversaciones (migrado de DIALOGOS.md)
│   ├── normalizar.js           # normalizarTexto(), compartida entre el mapa y la sala de escape
│   ├── escape-salas.js         # Array SALAS_ESCAPE: contenido de cada sala (hoy de ejemplo, 2 tipos)
│   ├── sopa-letras.js          # Motor de la sopa de letras (sala 1 del escape), sin DOM
│   ├── juego-2048.js           # Motor del 2048 (sala 2 del escape), sin DOM
│   └── escape.js               # Lógica de escape.html (candado, sopa de letras o 2048, según la sala)
├── multimedia/                # Videos del proyecto
│   ├── Intro.mp4               # Video de intro, se reproduce en intro.html
│   ├── 1.mp4, 2.mp4, 3.mp4      # Sin usar todavía (destino por definir)
│   └── personajes.png          # Sin usar todavía
└── assets/
    ├── imagenes/               # Fotos, íconos, etc. (vacía por ahora)
    └── audio/                  # Música, sonidos (vacía por ahora)
```

## Estado actual
`index.html` ahora tiene el **mapa de niveles funcional** (estilo Candy Crush).
El CSS sigue inline en `<style>` dentro de `index.html` (decisión original:
"todo-en-uno" para simplicidad). El JS **ya se separó** a `js/script.js`
(enlazado con `<script src="js/script.js"></script>`) — `css/styles.css`
sigue sin usarse por ahora, se puede separar el CSS también más adelante
si se decide.

### Qué hace el mapa hoy
- `TOTAL_NIVELES = 20`, agrupados en `CANTIDAD_ESCENARIOS = 2` escenarios de
  `NIVELES_POR_ESCENARIO = 10` niveles cada uno (array `ESCENARIOS` en
  `js/script.js`, con `nivelInicial`/`nivelFinal` calculados). La función
  `obtenerEscenarioDeNivel(id)` devuelve a qué escenario pertenece un nivel.
  (Antes eran 50 niveles / 5 escenarios; se redujo a pedido del usuario.)
- Entre cada bloque de 10 niveles se inserta un separador visual funcional
  (`.divisor-escenario`, línea punteada + texto "— Escenario X —"), todavía
  sin estética real, solo para marcar el corte.
- Cada nodo y su fila tienen `data-escenario="N"` en el DOM. Esto ya se
  usa para pintar el fondo temático de cada escenario (ver más abajo).
- Los nombres de escenario son placeholders (`Escenario 1`, `Escenario 2`)
  — **falta que el usuario defina las 2 temáticas reales** (ver abajo).
  Cuando se definan, hay que actualizar el campo `nombre` de cada objeto
  en el array `ESCENARIOS`.
- El título del modal ahora muestra `Nivel X — Escenario Y` para poder
  verificar fácilmente el agrupamiento.
- Círculos numerados en zigzag (clases `fila-izquierda/centro/derecha`
  puestas por JS, ya no por `nth-child` de CSS — se cambió porque los
  divisores rompían el conteo de hijos), conectados por líneas SVG
  dibujadas dinámicamente con JS (`getBoundingClientRect`), no son
  posiciones fijas a mano.
- Estado de cada nivel, calculado en tiempo real:
  - **Bloqueado** (gris): no se pasó el nivel anterior.
  - **Desbloqueado** (azul): disponible para jugar.
  - **Completado** (verde): ya se pasó.
- El nivel 1 siempre está desbloqueado; el resto se desbloquea al completar
  el anterior (`estaDesbloqueado()` en el JS).
- Click en cualquier nodo (incluso bloqueado) abre un modal que dice
  "Nivel X" y el estado. Si está desbloqueado y sin completar, aparece el
  **reto**: una pregunta con un input para responder (ver sección
  "Reto de cada nivel" más abajo).
- Progreso guardado en `localStorage` bajo la clave
  `cumple_candela_progreso`, como `{ nivelesCompletados: [1,2,3] }`.
- Botón de debug "Reiniciar progreso" abajo del mapa, para poder probar
  el flujo completo sin tener que borrar `localStorage` a mano desde
  las herramientas del navegador.
- Las líneas del camino se pintan de verde en el tramo ya recorrido
  (cuando el nivel de origen está completado) y gris en el resto — esto
  es indicador de estado funcional, no un tema de diseño final.

### Fondo temático por escenario
Los 2 escenarios ya tienen fondo real: escenario 1 (niveles 1-10)
`multimedia/Mapas/mapa-0-10.jpg`, escenario 2 (niveles 11-20)
`multimedia/Mapas/mapa-11-20.jpg` (agregada por el usuario). Se
implementó con un `<div>` por escenario dentro de `#fondos-escenarios`
(el primer hijo de `#mapa-wrapper` en `index.html`, para quedar siempre
detrás de las líneas/niveles/Candela):

- **Alto**: medido y posicionado en JS (`posicionarFondosEscenarios()` +
  `calcularRangoVerticalEscenario()` en `js/script.js`) para cubrir todo
  el alto que ocupan los niveles de ese escenario **más su separador**
  (`.divisor-escenario`, al que también se le agregó `data-escenario`
  para poder incluirlo en el cálculo) — no todo el `#mapa-wrapper`. Se
  recalcula en cada `renderizarMapa()` y en cada resize de ventana (mismo
  patrón que ya usa `dibujarLineas()`).
- **Sin espacio en blanco entre dos fondos consecutivos** (a pedido del
  usuario, al agregar el segundo): `calcularRangoVerticalEscenario()`
  por sí sola mide solo el alto de las filas/separador de ESE escenario,
  sin contar el `gap: 50px` de `#camino` que separa la última fila de un
  escenario de la primera del siguiente — con eso, entre los dos fondos
  quedaba una franja gris de 50px sin imagen. Se agregó
  `calcularLimitesFondoEscenario()`, que envuelve a la anterior y estira
  el `top`/`bottom` hasta la MITAD de ese hueco con el escenario vecino
  — así los dos fondos se tocan exactamente en el mismo punto, sin
  superposición ni espacio de por medio.
  `posicionarFondosEscenarios()` ahora usa esta función en vez de la
  original.
  - **Bug real que esto causó y ya se arregló**: la primera versión de
    `calcularLimitesFondoEscenario()` asumía que el escenario "siguiente"
    (id+1, más adelante en el array `ESCENARIOS`) queda visualmente
    ABAJO del actual — pero `#camino` usa
    `flex-direction: column-reverse`, así que en realidad el escenario
    con id más alto se dibuja MÁS ARRIBA en la pantalla (Y más chica).
    Con la relación al revés, el escenario 1 calculaba su `top` contra
    el `top` del escenario 2 (que está en la otra punta del mapa, no al
    lado) en vez de contra su `bottom`, dando una altura **negativa**
    (`height: -25px`). Un alto negativo es un valor de CSS inválido, así
    que el navegador lo ignoraba en silencio y el `<div>` se quedaba sin
    `height` — invisible, como si no existiera. Pasaba con LOS DOS
    fondos, no solo con el nuevo, por eso el usuario reportó "no veo
    ninguno de los dos mapas". Se encontró renderizando el proyecto de
    verdad (ver sección "Cómo probar en un navegador real" más arriba)
    y comparando los números calculados — no se hubiera encontrado solo
    leyendo el código. Ya está arreglado: ahora el `top` de un escenario
    se calcula contra el `bottom` del escenario de id+1 (su vecino de
    ARRIBA), y su `bottom` contra el `top` del de id-1 (su vecino de
    ABAJO). Confirmado con captura de pantalla que los dos fondos se ven
    completos y se empalman sin espacio en blanco.
  - Sigue funcionando igual de bien si en el futuro hay escenarios sin
    fondo entre dos que sí lo tienen (solo estira hasta el escenario
    vecino más cercano, tenga o no fondo configurado) — el fix no cambió
    esa parte de la lógica, solo corrigió qué vecino va con qué lado.
- **Ancho**: "full-bleed", cubre TODO el ancho de la pantalla, no solo
  la columna centrada de 500px de `#mapa-wrapper` — si no, en pantallas
  más anchas que 500px la imagen se veía como una franja angosta pegada
  a los números en vez de un fondo completo. Se logra con el truco CSS
  clásico en `.fondo-escenario`: `left: 50%; width: 100vw;
  transform: translateX(-50%);` (recentra un elemento de 100vw respecto
  al centro de la PANTALLA en vez de respecto a su contenedor angosto).
  Por eso también se agregó `overflow-x: hidden` al `body`: sin eso,
  `100vw` puede quedar un pelo más ancho que el viewport visible (por el
  ancho del scrollbar) y aparecer una barra de scroll horizontal.

Para agregarle fondo a un escenario nuevo (si en el futuro hay más de
2) alcanza con sumar una línea al objeto `FONDOS_ESCENARIOS` en
`js/script.js` — no hace falta tocar nada más, el ajuste de límites de
arriba ya lo contempla automáticamente.

### Video de intro (`intro.html`)
- Reproduce `multimedia/Intro.mp4` a pantalla completa.
- **Requiere un toque/click en "▶ Toca para comenzar"** antes de reproducir:
  es a propósito, los navegadores bloquean el autoplay con sonido si no
  hubo un gesto del usuario en la página, así que esto garantiza que el
  audio del video se escuche. No es un bug ni algo que haya que sacar.
- Al terminar el video (evento `ended`) o si falla la carga (evento
  `error`, para no dejar a Candela trabada en pantalla negra), redirige
  automáticamente a `index.html`.
- Quedan sin usar todavía `1.mp4`, `2.mp4`, `3.mp4` y `personajes.png`
  (están en `multimedia/`) — falta definir para qué son (¿videos por
  escenario? ¿mini-juegos? ¿personajes del mapa?).

### Scroll de bienvenida en el mapa (`animarScrollDeBienvenida` en script.js)
- Al cargar `index.html`, después de renderizar el mapa, anima el scroll
  de la página desde arriba (el último nivel) hasta abajo (nivel 1,
  el primero) en ~5 segundos, con una curva suave (ease-in-out), usando
  `requestAnimationFrame` — no `scroll-behavior: smooth` de CSS, porque
  necesitábamos controlar la duración exacta.
- Se ejecuta siempre que se abre/recarga `index.html` (no solo la primera
  vez ni solo viniendo de `intro.html`).
- Si el mapa completo ya entra en la pantalla sin necesidad de scroll
  (pantallas muy altas), la función no hace nada.

### Demonio con casita, al lado del último nivel
`multimedia/demonio con casita.png` se renderiza dentro de la fila del
último nivel (`TOTAL_NIVELES`, hoy el 20 — el desafío final), como
`<img id="img-demonio-final">`, en el mismo bloque
`if (id === TOTAL_NIVELES)` de `renderizarMapa()` en `js/script.js`.
No tiene animación, es estático — marca visualmente cuál es el "jefe
final" del mapa. Al depender de `TOTAL_NIVELES` en vez de un número fijo,
se movió solo del nivel 50 al nivel 20 cuando se redujo el mapa. (Antes
estaba arriba del todo de la página con un fundido al abrir; se sacó de
ahí a pedido del usuario y se movió al lado del último nivel).

### Secuencia de apertura del mapa (`iniciarSecuenciaDeApertura` en script.js)
Al abrir `index.html`, además del scroll de bienvenida, pasa esto en
simultáneo (misma duración, `DURACION_APERTURA_MS = 5000`):

- **Candela cayendo** (`multimedia/Candela/triste.png`, `#img-candela-
  cayendo`, posicionada `fixed` respecto a la **pantalla**, no al
  documento): arranca en `top:0` y cae girando (transición CSS de `top` +
  `transform: rotate(1080deg)`, 3 vueltas) hasta la posición exacta de su
  "casilla actual" — calculada con `obtenerNivelActual()`: el primer nivel
  desbloqueado que todavía no completó (o el último nivel si ya completó
  todo).
  - **Dos sistemas de coordenadas, a propósito** (`js/script.js`):
    - Durante la caída inicial usa `position: fixed` (coordenadas de
      PANTALLA) gracias a la clase `.cayendo-desde-arriba` — necesario
      porque si usara coordenadas del mapa mientras el scroll automático
      se mueve con su propio ritmo, las dos animaciones se desincronizan
      y Candela se sale de la pantalla (bug que ya pasó). El destino se
      calcula con `calcularYObjetivoCandela()`, a partir del mismo
      `destinoScrollY` que usa el scroll (`calcularDestinoScroll()`), así
      las dos siempre convergen juntas al final.
    - Apenas aterriza (evento `transitionend` de `top`), cambia la imagen
      a `multimedia/Candela/normal.png` y llama a
      `fijarCandelaEnCoordenadaDelMapa()`, que le saca la clase
      `.cayendo-desde-arriba` (vuelve a `position: absolute`, relativa a
      `#mapa-wrapper`) y fija su `top` en coordenadas del MAPA
      (`calcularYEnMapa()`, la misma lógica que usa `dibujarLineas()`
      para ubicar los nodos) — el cambio de sistema de coordenadas es
      instantáneo (`transitionDuration: 0s`) para que no se note el
      salto. A partir de acá, Candela queda pegada a su nivel: si el
      usuario scrollea manualmente, se mueve junto con el resto del mapa
      en vez de perseguir la pantalla.
    - `subirCandelaHastaNivel()` (usada al pasar de nivel, ver más abajo)
      ya trabaja siempre en coordenadas del mapa — no hace falta el truco
      de `position: fixed` ahí porque no hay scroll automático simultáneo.
  - El modal tiene `z-index: 100` (Candela tiene `z-index: 20`) para que,
    al abrir un nivel, el modal quede siempre por encima y no se solapen.
- Esta secuencia solo se dispara una vez al abrir/recargar `index.html`,
  no se repite si después el jugador pasa un nivel y el mapa se
  re-renderiza (`renderizarMapa()` no la vuelve a llamar). Si más adelante
  se quiere que Candela "camine" hacia la nueva casilla cada vez que se
  pasa un nivel, habría que llamar a `animarCandelaCayendo()` también ahí
  (con otra duración, más corta, para que no tarde 5s cada vez).
- Quedan sin usar en `multimedia/`: `1.mp4`, `2.mp4`, `3.mp4`,
  `personajes.png`, `casita de perro.png`, y dentro de las carpetas
  `Candela/` (`enfadado.png`, `feliz.png`, `normal.png`), `Demonio/`
  (`diabolico.png`, `enfadado.png`, `triste.png`,
  `Gemini_Generated_Image_ml44aaml44aaml44.png`) y `Luis/` (`enfadado.png`,
  `feliz.png`, `normal.png`, `triste.png`) — parece haber personajes
  "Candela", "Demonio" y "Luis", cada uno con varias expresiones
  (feliz/triste/enfadado/normal), pensados probablemente para reaccionar
  según el progreso del juego. Falta definir dónde se usa cada uno.

### Transición al pasar un nivel (sin recargar todo el mapa)
Antes, al tocar "Pasar nivel" se llamaba a `renderizarMapa()`, que destruye
y vuelve a crear TODO el DOM del mapa — eso hacía imposible animar nada
(los elementos nuevos ya nacen con su color final, sin transición visible).
Se cambió por una actualización puntual, en `aplicarTransicionDeNivelCompletado(idCompletado)`:

- El nodo recién completado cambia de clase (`desbloqueado` → `completado`)
  en el DOM existente (no se recrea), así el cambio de color de fondo
  anima solo gracias a `transition: background-color 0.5s ease;` puesto
  en `.nivel` (index.html).
- La línea del camino que sale de ese nodo se busca por
  `line[data-desde="ID"]` (cada `<line>` ahora lleva `data-desde` con el
  id del nivel de origen, agregado en `dibujarLineas()`) y se le cambia
  el atributo `stroke` a verde — anima gracias a
  `transition: stroke 0.5s ease;` en `#rutas line`.
- El siguiente nivel pasa de `bloqueado` a `desbloqueado` (mismo
  mecanismo de transición de color).
- Candela sube hasta ese siguiente nivel con `subirCandelaHastaNivel()`
  (500ms, sin rotación — a diferencia de la caída inicial de 5s con
  vueltas). Reutiliza `calcularYObjetivoCandela()`, la misma función que
  usa la caída inicial, para no duplicar la cuenta de posición.
- **Importante**: como ya no se llama a `renderizarMapa()` ni a
  `dibujarLineas()` en este flujo, si en el futuro se agrega algo que
  cambie el TAMAÑO o la POSICIÓN de los nodos (no solo el color), hay que
  revisar `aplicarTransicionDeNivelCompletado()` para que también
  reposicione lo que corresponda.
- `renderizarMapa()` se sigue usando tal cual para la carga inicial y para
  "Reiniciar progreso (debug)", donde SÍ queremos un reset instantáneo,
  no animado.

### Reto de cada nivel: pregunta y respuesta (`js/preguntas.js`)
En vez de un botón simple "Pasar nivel", cada nivel ahora tiene un reto real:
una pregunta con su respuesta, migradas desde el antiguo `Pregutnas.md`
(borrado) al array `PREGUNTAS` en `js/preguntas.js` — un objeto
`{ pregunta, respuesta }` por índice (el elemento `0` es el reto del
nivel 1, el `1` el del nivel 2, y así sucesivamente; hay 20, una por
nivel).

- Al abrir un nivel desbloqueado y no completado, `abrirModal()` (en
  `js/script.js`) muestra `PREGUNTAS[id - 1].pregunta` y un `<input>`
  para escribir la respuesta.
- El botón "Comprobar respuesta" (o tecla Enter en el input) llama a
  `intentarResponder()`, que compara lo escrito contra
  `PREGUNTAS[id - 1].respuesta` usando `esRespuestaCorrecta()` /
  `normalizarTexto()` — la comparación ignora mayúsculas/minúsculas,
  tildes y espacios de más, para no fallar por detalles de tipeo que no
  hacen a la respuesta en sí (fechas y horas se comparan tal cual están
  escritas, ej. `26/04/2026` o `15:20`).
- Si la respuesta es incorrecta, se muestra "❌ Respuesta incorrecta,
  probá de nuevo." y el nivel sigue sin pasar (se puede reintentar sin
  límite). Si es correcta, se llama a `marcarNivelCompletado(id)` (ya
  existía, guarda en localStorage y dispara la transición animada) igual
  que antes.
- Si en el futuro se quiere reemplazar esto por un mini-juego real en
  vez de preguntas de texto, el punto de enganche sigue siendo el mismo:
  cuando el jugador gane, llamar a `marcarNivelCompletado(id)` — no hace
  falta tocar la lógica de estado/desbloqueo/persistencia.

Sin diseño real todavía (colores planos, sin fuentes personalizadas, sin
fondo temático, sin animaciones) — eso queda para una etapa posterior,
a propósito, para no mezclar "que funcione" con "que se vea lindo".

### Sala de escape final, al completar los 20 niveles (`escape.html`)
Al terminar el nivel 20 (el desafío final), en vez de quedarse en el mapa
se abre un mini-juego nuevo: una sala de escape al estilo de los escape
rooms online gratuitos tipo "Cazadores de Escapes" (enigma → código →
"candado" que se abre, en varias salas seguidas hasta la puerta final).

- **Disparo**: `dispararConversacionSiCorresponde()` en `js/script.js`
  ahora le pasa un callback a `mostrarDialogo(CONVERSACIONES.final, cb)`
  — cuando el jugador cierra esa última conversación, el callback hace
  `window.location.href = 'escape.html'`. Es el mismo mecanismo de
  `alTerminar` que ya soportaba `js/dialogo.js`, no hizo falta tocarlo.
- **Sin acceso manual desde el mapa** (a pedido del usuario, se sacó): el
  único camino a `escape.html` es el automático, al cerrar la última
  conversación tras completar el nivel 20. Antes había un link
  `🔐 Ir a la Sala de Escape` en `index.html` para volver a entrar por si
  se cerraba el navegador a mitad de la sala de escape; se quitó junto
  con su CSS y `actualizarVisibilidadEscape()` en `js/script.js`. Si en
  algún momento hace falta poder reabrir la sala de escape sin rejugar
  el nivel 20 (por ejemplo, para probarla), habría que agregar de nuevo
  algún acceso manual.
- **`escape.html` tampoco tiene título propio** ("Sala de Escape") — a
  pedido del usuario, se sacó el `<header>` (quedó solo `<title>` en la
  pestaña del navegador).
- **Contenido y lógica, en archivos propios** (mismo patrón que
  `preguntas.js` + la lógica de reto en `script.js`, pero separados en
  su propia página en vez de vivir dentro del mapa). **Todo lo que
  sigue en este punto es el estado ORIGINAL, ya superado — las
  secciones "Sala 1/2/3/4 de la sala de escape" más abajo tienen el
  estado real y actualizado (5 tipos de sala, contenido real en las 4,
  sin `MENSAJE_FINAL_ESCAPE`, sin pantalla de "victoria" separada). Se
  deja este párrafo solo como registro de cómo arrancó, no como
  referencia:**
  - `js/escape-salas.js`: array `SALAS_ESCAPE`, una sala por objeto, en
    el orden en que se resuelven, y la constante `MENSAJE_FINAL_ESCAPE`
    (texto de la pantalla de victoria). Hay **dos tipos de sala**:
    - Sin `tipo` (las de toda la vida): `{ titulo, pista, respuesta }`,
      candado con código.
    - `tipo: 'sopa-letras'` (hoy solo la sala 1, a pedido del usuario):
      `{ tipo, titulo, textoIntro, filas, columnas, palabras }`. Ver
      sección "Sala 1: sopa de letras" más abajo.
    **Hoy son 4 salas de EJEMPLO** (marcadas "(Ejemplo a reemplazar)")
    para probar que el mecanismo funciona — todavía **no hay historia
    definida** para esta sala (ni las palabras reales de la sala 1),
    queda pendiente para otra sesión.
  - `js/escape.js`: motor de `escape.html`. Guarda en localStorage bajo
    la clave `cumple_candela_escape_progreso`
    (`{ salaActual: N, palabrasEncontradas: [...] }` — lo segundo solo
    es relevante mientras se está en una sala `sopa-letras`, se
    resetea al avanzar de sala). Muestra la sala actual y alterna entre
    dos bloques del HTML (`#zona-codigo` / `#zona-sopa-letras`) según
    `sala.tipo`. Para las salas de código: compara la respuesta con
    `normalizarTexto()` (mismo criterio de tolerancia que las preguntas
    del mapa). En ambos tipos, al completar la sala se llama a
    `avanzarASiguienteSala()`; al resolver la última, se muestra la
    pantalla de victoria con `MENSAJE_FINAL_ESCAPE` y un link para
    volver al mapa (`index.html`). Tiene su propio botón de debug
    "Reiniciar sala de escape".
  - `js/sopa-letras.js` (nuevo): motor de la sopa de letras, sin nada de
    DOM (solo genera datos) — así se puede probar/reusar aparte.
    `generarSopaDeLetras(palabras, filas, columnas)` devuelve
    `{ grilla, posiciones }`. Coloca cada palabra SOLO en dos
    direcciones (a pedido del usuario, nada de diagonales ni al revés):
    horizontal de izquierda a derecha, o vertical de arriba a abajo,
    elegido al azar por palabra, con reintentos si choca con una letra
    ya puesta que no coincide. Si una palabra no logra ubicarse (muy
    larga para la grilla, o la grilla ya muy llena), se avisa por
    `console.warn` y esa palabra queda sin colocar. Los huecos que
    quedan se rellenan con letras al azar. `js/escape.js` la usa para
    pintar la grilla y, cuando el jugador acierta una palabra, buscar
    sus celdas en `posiciones` para pintarlas de rojo (clase
    `.encontrada` en `escape.html`).
  - `js/normalizar.js`: la función `normalizarTexto()` se sacó de
    `js/script.js` a este archivo nuevo para que la usen tanto el mapa
    como `escape.html` sin duplicarla (antes solo la usaba el mapa). Los
    dos HTML la cargan antes de su script principal.

### Sala 1 de la sala de escape: sopa de letras (`js/sopa-letras.js`)
A pedido del usuario, la primera sala del escape final ya no es un
candado con código: es una sopa de letras de **10x10** (achicada desde
el 20x20 original — ver nota de tamaño más abajo).

- Arriba de la grilla va `sala.textoIntro` (hoy un texto de EJEMPLO,
  falta el real).
- Las palabras se leen **solo** de izquierda a derecha o de arriba
  a abajo — nunca al revés, nunca en diagonal (requisito explícito).
- Abajo de la grilla se generan tantas filas de `<input>` +
  "Comprobar" como palabras tenga `sala.palabras`. **Las 8 palabras ya
  son las reales** (dadas por el usuario, no hace falta reemplazarlas):
  koldo, iloveu, abrazo, acotar, vuelve, twerk, peque, risotto. No
  importa en qué fila se escriba cada intento: se compara contra todas
  las palabras de la sala.
- Si lo escrito coincide (con `normalizarTexto()`, tolerante a
  mayúsculas/tildes) con una palabra de la sopa que no se había
  encontrado todavía, sus letras se pintan de rojo en la grilla
  (`.celda-sopa.encontrada`). Si no coincide con ninguna, o ya estaba
  encontrada, **no pasa nada** (sin mensaje de error — así lo pidió el
  usuario).
- Al encontrar todas las palabras de la sala, avanza sola a la sala 2
  (mismo mecanismo que acertar un candado).
- El progreso de palabras encontradas se guarda en localStorage, así
  que si se recarga la página a mitad de camino no hay que volver a
  buscarlas (eso sí: la grilla se vuelve a generar de cero en cada
  carga —las letras de relleno cambian—, pero las palabras ya
  encontradas se vuelven a pintar de rojo apenas se dibuja).
- **Tamaño de la grilla (10x10)**: el usuario pidió reducir el 20x20
  original porque quedaba demasiado difícil encontrar las palabras
  entre tanto relleno, pero sin perder toda la dificultad. Con estas 8
  palabras (46 letras en total) un 10x10 queda ~46% lleno de letras
  reales — probado con 300 generaciones al azar en Node: 100% de éxito
  ubicando las 8 (a partir de 9x9 empieza a fallar alguna vez, porque
  "risotto", de 7 letras, casi no entra). Si en algún momento se quiere
  ajustar el tamaño de nuevo, es el campo `filas`/`columnas` del objeto
  de la sala 1 en `js/escape-salas.js`.
- **Pendiente, a definir con el usuario**: solo el texto introductorio
  real (las palabras ya están definidas). El punto de enganche sigue
  siendo el mismo: editar `textoIntro` en el objeto de la sala 1 dentro
  de `js/escape-salas.js` — no hace falta tocar `js/escape.js` ni
  `js/sopa-letras.js`.
- **No se probó en un navegador real** (mismo motivo que el resto de la
  sala de escape): se validó con `node --check` y con scripts de prueba
  en Node (generación de sopas al azar verificando que cada palabra
  queda en línea recta válida y bien escrita, y comparando tasa de
  éxito de colocación en distintos tamaños de grilla) — pero conviene
  abrirlo una vez en Mac para confirmar que se ve y se usa bien (tamaño
  de letra de la grilla en pantallas chicas, etc.).
- **Sin diseño todavía**, a propósito, mismo criterio que el resto del
  proyecto: fondo oscuro plano y tipografía del sistema, para validar
  primero que el mecanismo (enigma → código → siguiente sala → victoria)
  funciona de punta a punta.
- **No se probó en un navegador real** (ver nota al final de "Próximos
  pasos posibles"): se validó revisando el código y con
  `node --check` sobre los `.js` nuevos/modificados, pero conviene
  abrirlo una vez en Mac para confirmar que se ve y clickea bien.

**Este párrafo quedó viejo**: ya HAY historia (sopa de letras → 1024 →
adivinanza del asesino → conversación final → despedida, las 4 salas
con contenido real) — ver las secciones "Sala 1/2/3/4 de la sala de
escape" más abajo para el estado actual real. Ya no existe
`MENSAJE_FINAL_ESCAPE` (se sacó, ver sección de la sala 4).

### Sala 2 de la sala de escape: juego 2048 (`js/juego-2048.js`)
A pedido del usuario, la sala 2 dejó de ser un candado con código: es un
1024/2048 de toda la vida (tablero 4x4, se juega con las flechas del
teclado, fichas iguales que se tocan se fusionan al doble).

- **Sobre el nombre**: el `tipo` del objeto en `js/escape-salas.js` es
  `'juego-1024'` (y el título de la sala es "Tu juego favorito") — en
  algún momento se editó así por fuera de esta conversación, coincide
  con cómo el usuario llama al juego desde el principio ("quiero hacer
  un 1024"). El resto de los nombres internos (funciones, clases CSS,
  IDs, la clave `CONVERSACIONES.fallo2048`) quedaron con "2048" en vez
  de "1024" — es solo cosmético/interno, no afecta el funcionamiento,
  pero si en algún momento se quiere prolijidad total habría que
  renombrarlos también (búsqueda simple de "2048" en `js/escape.js`,
  `js/juego-2048.js`, `escape.html` y `js/conversaciones.js`).

- Arriba del todo va `sala.textoIntro` (`#intro-2048`) — **ya tiene el
  texto real** (dado por el usuario, con un par de tildes corregidas:
  "qué tan" en vez de "que tan", "día" e "inútil"). A diferencia de la
  sala 1, acá no hay imagen del demonio (no se pidió).
- Debajo se ve un botón **"Jugar"** (nada arranca solo). Al apretarlo,
  arranca un tablero nuevo y un **cronómetro de 5 minutos**
  (`sala.duracionSegundos`) que cuenta hacia atrás en `#tiempo-2048`.
- **Animación mínima al mover** (a pedido del usuario): las 16 celdas
  del tablero se crean una sola vez por partida (no se recrean en cada
  movimiento, mismo motivo por el que el mapa dejó de usar
  `renderizarMapa()` en cada movimiento — ver
  `aplicarTransicionDeNivelCompletado()` en `js/script.js`). En cada
  movimiento, `pintarValoresTablero2048()` compara los valores de antes
  y de después; a toda celda que cambió de valor (una ficha se movió
  hasta ahí, se fusionó, o apareció una nueva) se le agrega brevemente
  la clase `.actualizada` (`js/escape.js`), que dispara un "pop" en CSS
  (`@keyframes destacar-celda-2048` en `escape.html`, `scale(1.15)` →
  `scale(1)` en 0.15s). Es una animación aproximada (no sigue a cada
  ficha individual por su recorrido real como el 2048 original, solo
  destaca las celdas que cambiaron) — se eligió así por ser "mínima",
  tal como lo pidió el usuario; si más adelante se quiere el
  deslizamiento real ficha por ficha, hay que repensar el motor de
  `js/juego-2048.js` para que las funciones de mover devuelvan también
  de qué celda vino cada ficha, no solo el tablero final.
- El objetivo es llegar a una **puntuación** (`sala.objetivoPuntuacion`,
  hoy 2048) antes de que se acabe el tiempo. Ojo: es la puntuación
  acumulada del juego (se suma el valor de cada fusión, como en el 2048
  real), **no** el valor de una sola ficha — llegar a una ficha de 2048
  es mucho más difícil que llegar a 2048 puntos de puntuación
  acumulada.
- Si se llega al objetivo a tiempo, se pasa a la sala 3 (misma función
  `avanzarASiguienteSala()` que usan las demás salas al resolverse).
- **Si se falla** (se acaba el tiempo, o el tablero se traba sin
  ningún movimiento posible) se dispara `CONVERSACIONES.fallo2048`
  (ver `js/dialogo.js`/`js/conversaciones.js`) y, al cerrarse esa
  conversación, el juego se reinicia desde cero (tablero nuevo, cronómetro
  completo, hay que volver a apretar "Jugar"). **A pedido explícito del
  usuario, todavía no hay texto en `CONVERSACIONES.fallo2048` (queda
  `[]`)** — para que esto funcionara igual sin texto, se ajustó
  `mostrarDialogo()` en `js/dialogo.js`: si el array de líneas está
  vacío, ya no se queda sin hacer nada, llama directo al callback
  (`alTerminar`) como si el jugador hubiese cerrado la conversación. Ni
  bien se defina el texto real, alcanza con llenar ese array — no hace
  falta tocar nada de la lógica.
- **`escape.html` ahora también carga `js/dialogo.js` y
  `js/conversaciones.js`** (antes solo los cargaba `index.html`), y
  tiene su propia copia del overlay de diálogo (`#dialogo-overlay` y
  el resto de los IDs, mismo CSS que en `index.html`) — así la
  conversación de fallo se puede mostrar ahí también.
- **Sobre el objetivo de 2048 puntos** (el usuario pidió avisar si lo
  veía muy grande): con movimientos completamente al azar (sin ninguna
  estrategia) una simulación en Node llegó a 3024 puntos en una
  partida — así que un jugador real, prestando algo de atención,
  debería llegar a 2048 bastante antes de que se acaben los 5 minutos.
  Si en la práctica (jugándolo en el navegador real) resulta demasiado
  fácil, lo lógico sería subir el objetivo o acortar el tiempo; si
  resultara difícil, bajar el objetivo. Es un solo número
  (`objetivoPuntuacion`) y `duracionSegundos` en `js/escape-salas.js`,
  fácil de ajustar.
- **Motor puro en `js/juego-2048.js`** (sin nada de DOM, igual que
  `js/sopa-letras.js`): `crearTableroInicial`, `moverIzquierda/
  Derecha/Arriba/Abajo` (mover arriba/abajo se resuelve transponiendo
  el tablero y reusando la lógica de mover izquierda/derecha, para no
  repetir la fusión de filas 4 veces), `agregarFichaAleatoria`,
  `hayMovimientosPosibles`. Probado en Node simulando 200 partidas
  completas al azar hasta que el tablero se traba, verificando que la
  suma total del tablero nunca cambia por un movimiento en sí (solo por
  la ficha nueva que aparece después) — no se detectó ninguna
  inconsistencia.
- **No se probó en un navegador real**: no hay uno disponible en este
  entorno de desarrollo. Se validó con `node --check` y con la
  simulación de partidas en Node mencionada arriba, pero antes de
  darlo por terminado conviene jugarlo de verdad en la Mac (controles
  con las flechas, que el cronómetro y el reinicio tras fallar se
  sientan bien, tamaño de las fichas en pantalla chica).

### Sala 3 de la sala de escape: adivinanza "¿Quién es el asesino?"
Nueva sala tipo `'eleccion'` (antes era un candado con código de toda la
vida — se cambió a pedido del usuario): la pista es la misma adivinanza
de lógica que antes, pero en vez de escribir la respuesta en un input,
abajo aparecen 3 casillas clickeables, una por sospechoso (foto +
nombre), y hay que tocar la que se cree correcta. Los 3 sospechosos son
los mismos 3 personajes del juego (Candela, Luis, Demonio) — es un
mini-misterio independiente de la trama principal, no pretende ser
canónico con el resto de la historia.

- **Pista 1** (dada por el usuario): el asesino mató a alguien más
  joven que él. Con el orden de edad que dio el usuario (Demonio >
  Luis > Candela), descarta a Candela — no hay nadie más joven que
  ella entre los tres.
- **Pista 2** (inventada): en la escena no hay garras ni cola, solo
  huellas de dedos normales — descarta al Demonio.
- **Pista 3** (inventada): una huella de zapatilla en el barro; esa
  noche el Demonio y Candela estaban descalzos — apunta a Luis.
- Con las 3 pistas se llega a **Luis** por descarte + una pista
  positiva, tal como pidió el usuario.
- **Las 3 casillas** (`sala.opciones`, un `{ personaje, expresion }`
  por casilla): Luis(triste), Candela(feliz), Demonio(diabolico) — las
  expresiones que pidió el usuario. La imagen de cada casilla sale de
  `multimedia/<personaje>/<expresion>.png` (mismo patrón que
  `js/dialogo.js`). Al clickear una, si su `personaje` coincide con
  `sala.respuestaCorrecta` (`'Luis'`, comparado con `normalizarTexto()`)
  se pasa de sala; si no, **no pasa nada** — mismo criterio que la sopa
  de letras con una palabra que no encaja (sin mensaje de error, se
  puede reintentar sin límite).
- El campo `pista` sigue teniendo varios párrafos separados con `\n\n`,
  mostrados arriba de las casillas con el mismo `white-space: pre-line`
  que ya tenía `#sala-pista` (ahora también en `#eleccion-pista`).
- Motor en `js/escape.js`: `mostrarSalaEleccion()` +
  `crearCasillaEleccion()`. Casillas creadas con `<button>` (no `<div>`)
  para que sean accesibles por teclado/foco, no solo con el mouse.
- **No se probó en un navegador real**: se validó con `node --check`,
  pero conviene abrirlo en la Mac para confirmar que las 3 casillas se
  ven bien una al lado de la otra en pantalla chica y que las imágenes
  cargan.

### Botón de debug "Pasar sala" — sacado
Se había agregado un botón "Pasar sala (debug)" en `escape.html` (junto
a "Reiniciar sala de escape (debug)") que llamaba directo a
`avanzarASiguienteSala()` sin resolver la sala actual, para probar el
recorrido completo sin jugar cada sala. **El usuario pidió sacarlo** y
ya se quitó (`#btn-pasar-sala` del HTML y su listener en
`js/escape.js`). Sigue quedando "Reiniciar sala de escape (debug)"
(reinicia todo el progreso del escape, no salta salas).

### Sala 4: ya no es un reto, es la despedida final
A pedido explícito del usuario ("no quiero que sea un reto, mas una
despedida"), la sala 4 dejó de ser un candado de ejemplo — ahora es
`tipo: 'despedida'`, la ÚLTIMA sala de verdad, sin ningún enigma que
resolver.

- **Contenido real**, tomado de `DESPEDIDA.md` (mensaje real de Luis a
  Candela, no de personaje del juego — rompe la cuarta pared a
  propósito, es la sorpresa/carta de cumpleaños de verdad). Se migró a
  `sala.texto` en `js/escape-salas.js` con 3 correcciones de tipeo/tilde
  ("no se que" → "no sé qué", "par que" → "para que", "lo mas
  perfectos" → "lo más perfectos") — el resto del texto quedó tal cual
  lo escribió el usuario, sin tocar estilo ni frases.
- Al mostrarla (`#zona-despedida` en `escape.html`), solo aparece el
  texto (con `white-space: pre-line` para respetar los párrafos) y un
  link "← Volver al mapa" — nada de input, botón de responder, ni
  candado.
- **Antes de mostrarla se dispara la "Conversación final"** que el
  usuario agregó a `DIALOGOS.md` (distinta de la que ya existía para el
  nivel 20 del mapa) — migrada a `CONVERSACIONES.finalEscape` en
  `js/conversaciones.js`. El disparo está en `avanzarASiguienteSala()`
  (`js/escape.js`): al pasar de la sala 3 a la sala 4, en vez de dibujar
  la sala directamente, primero llama a
  `mostrarDialogo(CONVERSACIONES.finalEscape, mostrarSalaActual)` — la
  sala 4 recién se dibuja cuando el jugador cierra esa conversación.
- **La sala 4 es un callejón sin salida a propósito**: no hay forma de
  "resolverla" ni de avanzar a una sala 5 (no existe). Por eso
  `avanzarASiguienteSala()` ahora "clampea" `salaActual` al último
  índice del array en vez de dejarlo crecer sin límite — es una
  protección defensiva (hoy no hay ningún botón que pueda llamarla
  estando ya en la despedida, pero si en el futuro se agrega uno) para
  que nada se rompa (`SALAS_ESCAPE[progresoEscape.salaActual]` nunca
  queda `undefined`), solo se volvería a mostrar la misma sala (y a
  repetir la
  conversación final, que es inofensivo).
- **Se eliminó la pantalla de "victoria" genérica que existía antes**
  (el "🎉 ¡Escapaste!" con `MENSAJE_FINAL_ESCAPE` de ejemplo, que se
  mostraba al pasar la última sala del array): quedó redundante, porque
  ahora la sala 4 ES esa pantalla final. Se borraron `mostrarVictoria()`,
  `elZonaVictoria`/`elMensajeVictoria` de `js/escape.js`,
  `MENSAJE_FINAL_ESCAPE` de `js/escape-salas.js`, y el bloque
  `#zona-victoria`/`#mensaje-victoria` de `escape.html` (su CSS y su
  link "Volver al mapa" se reaprovecharon tal cual en `#zona-despedida`).
- **No se probó en un navegador real**: se validó con `node --check` y
  revisando a mano la estructura de `SALAS_ESCAPE` (4 salas, la última
  `despedida`, con su texto) desde Node — pero conviene abrirlo en la
  Mac para sentir el recorrido completo: sala 3 → conversación final →
  despedida, y confirmar que el texto de la carta se lee bien.

### Conversaciones / cutscenes (`js/dialogo.js` + `js/conversaciones.js`)
Sistema genérico para mostrar conversaciones en 3 puntos clave de la
partida, con el fondo oscurecido y una viñeta central de bordes redondos
que va cambiando de personaje y expresión según quién habla.

- **`js/dialogo.js`** es el motor, reutilizable para cualquier
  conversación: expone `mostrarDialogo(lineas, alTerminar)`, donde
  `lineas` es un array de `{ personaje, expresion, texto }` (ver el
  formato exacto en el comentario de cabecera de `conversaciones.js`) y
  `alTerminar` es un callback opcional que se dispara al cerrar el
  diálogo (hoy no se usa desde ningún disparador, pero queda disponible).
  Internamente va mostrando una línea a la vez; el botón cambia de
  "Siguiente ▶" a "Cerrar" en la última línea.
- **`js/conversaciones.js`** tiene el contenido: hoy son **líneas de
  ejemplo marcadas "(Ejemplo a reemplazar)"**, puestas para poder probar
  el mecanismo — falta reemplazarlas por la conversación real, que se
  va a definir en otra sesión. El objeto exportado es
  `CONVERSACIONES = { inicio, nivel10, final }`.
- `personaje` en cada línea tiene que ser el nombre EXACTO de la carpeta
  en `multimedia/` (`Candela`, `Luis` o `Demonio`), porque la ruta de la
  imagen se arma como `multimedia/${personaje}/${expresion}.png`.
  Expresiones (archivos) que existen hoy por personaje:
  - `Candela` y `Luis`: `normal`, `feliz`, `triste`, `enfadado`.
  - `Demonio`: `diabolico`, `enfadado`, `triste` (no tiene `normal` ni
    `feliz`). Si una línea pide una expresión que no existe, `dialogo.js`
    cae sola a la expresión por defecto de ese personaje
    (`EXPRESION_POR_DEFECTO_PERSONAJE` en `js/dialogo.js`) en vez de
    mostrar una imagen rota.
- **Los 3 disparadores, en `js/script.js`**:
  1. **Al aterrizar Candela tras la caída/scroll inicial**: dentro de
     `animarCandelaCayendo()`, en el mismo handler `alTerminarDeCaer` que
     ya cambiaba la cara triste por la normal, se llama a
     `mostrarDialogo(CONVERSACIONES.inicio)`. **Se dispara cada vez que
     se abre o recarga `index.html`** (decisión tomada con el usuario:
     no se guarda ningún flag de "ya la vi", a diferencia de lo que se
     podría hacer con `progreso`).
  2. **Al completar el nivel 10** (fin del primer escenario): en
     `intentarResponder()`, después de `aplicarTransicionDeNivelCompletado()`,
     se llama a `dispararConversacionSiCorresponde(idIntentado)`, que
     compara contra `NIVELES_POR_ESCENARIO` (no un `10` hardcodeado) y
     muestra `CONVERSACIONES.nivel10`.
  3. **Al completar el último nivel** (hoy el 20): la misma función
     compara contra `TOTAL_NIVELES` y muestra `CONVERSACIONES.final`.
  Estos dos últimos son naturalmente "de una sola vez": solo se disparan
  en el momento exacto de completar ese nivel (no se re-evalúan al
  recargar la página), así que no hace falta ningún flag extra.
- El overlay del diálogo tiene `z-index: 200` (por encima del modal de
  nivel, que tiene 100), así que mientras hay una conversación abierta
  tapa todo lo demás, incluido el botón de debug "Reiniciar progreso".

**Pendiente**: reemplazar las líneas de ejemplo de `js/conversaciones.js`
por la conversación real (texto, personajes y expresiones en cada punto).

### Bugs corregidos (revisión de código)
- **"Reiniciar progreso" no movía a Candela**: el botón de debug reseteaba
  el progreso y re-renderizaba el mapa, pero Candela se quedaba en la
  posición (de pantalla) de donde estaba antes. Ahora, al reiniciar,
  también se la reposiciona al nivel 1 con `fijarCandelaEnCoordenadaDelMapa()`
  y se le vuelve a poner la cara `normal.png`.
- **Candela nunca se alineaba en horizontal**: solo existían funciones para
  calcular su coordenada Y (`calcularYEnMapa`, `calcularYObjetivoCandela`);
  la X quedaba siempre fija al centro por CSS (`left: 50%`), así que en
  los niveles en zigzag (`fila-izquierda`/`fila-derecha`) Candela no caía
  realmente sobre su nivel, ni siquiera en el nivel 1 (que es
  `fila-izquierda`). Se agregaron `calcularXEnMapa()` y
  `calcularXObjetivoCandela()`, análogas a las de Y, y ahora
  `animarCandelaCayendo()`, `fijarCandelaEnCoordenadaDelMapa()` y
  `subirCandelaHastaNivel()` también fijan `style.left`. La transición CSS
  de `#img-candela-cayendo` ahora incluye `left` además de `top`/`transform`.
- **Redimensionar la ventana no reposicionaba a Candela**: el listener de
  `resize` solo volvía a llamar a `dibujarLineas()`. Ahora, si Candela no
  está en medio de la caída inicial (sin la clase `.cayendo-desde-arriba`),
  también se recalcula su posición con `fijarCandelaEnCoordenadaDelMapa()`.
- **`normalizarTexto()` rompía la "ñ"**: al usar `normalize('NFD')` para
  sacar tildes, la "ñ" se descomponía en "n" + tilde combinada y el
  siguiente `replace` se la comía, convirtiendo cualquier "ñ" en "n". Ahora
  se protege la "ñ" antes de normalizar y se restaura después. No afectaba
  a las 20 preguntas actuales (ninguna respuesta tiene "ñ"), pero sí a
  cualquier pregunta futura que la use.
- **`intro.html`**: si `video.play()` fallaba tras el toque inicial (la
  promesa se rechaza), el botón "Toca para comenzar" ya se había ocultado,
  dejando a Candela con la pantalla en negro sin salida. Ahora el botón
  solo se oculta si `play()` confirma que arrancó; si falla, se pasa
  directo a `index.html`.

## Decisiones tomadas
- **Sin frameworks ni build tools**: para que "abrir y ya funciona" sea literal.
  No usamos React/Vite/etc. porque eso obligaría a instalar Node y correr comandos.
- **No es un repositorio git todavía**. Se puede iniciar si el usuario lo pide
  (por ejemplo para tener historial de cambios o subirlo a algún lado).
- El proyecto se desarrolla desde Windows (accedido vía WSL en
  `/mnt/c/Users/luis/Documents/Personal/Candela/feliz-cumpleaños`), pero
  **Candela lo va a abrir en una Mac**, por eso el lanzador es `.command`
  y no `.bat`.

## Prompt para generar los fondos de los 2 escenarios (Gemini)
El usuario va a definir el tema de cada uno de los 2 escenarios y generar
las imágenes con Gemini. Plantilla ya armada y entregada (pendiente que el
usuario complete los temas y genere las imágenes, y que después las
guardemos en `assets/imagenes/`):

**Instrucciones fijas (iguales en las 2):**
- Resolución 1080x1920px (vertical, 9:16). Si la herramienta solo deja
  elegir aspect ratio, usar 9:16.
- PNG o JPG de alta calidad.
- Estilo ilustración digital 2D tipo videojuego casual (Candy Crush /
  Candy Camp), colores vibrantes.
- Sin texto, sin logos, sin marcas de agua, sin personajes, sin interfaz
  de usuario (eso lo pone la app encima).
- Interés visual repartido de arriba a abajo (se va a usar con
  `background-size: cover`), evitar detalles clave pegados a los bordes.
- Las 2 imágenes deben sentirse parte de la misma "aventura" (mismo estilo
  de ilustración) pero cada una con paleta/elementos propios.

**Prompt por escenario** (repetir por cada uno, reemplazando `[ TEMA ]`):
> "Fondo vertical de videojuego casual estilo Candy Crush, [ TEMA ],
> iluminación suave y cálida, colores vibrantes, ilustración digital 2D,
> sin texto ni personajes ni interfaz, composición equilibrada de arriba
> a abajo, resolución 1080x1920px (9:16)."

- Escenario 1 (niveles 1-10): tema pendiente de definir por el usuario.
- Escenario 2 (niveles 11-20): tema pendiente.

Cuando el usuario defina los 2 temas, actualizar esta sección con los
temas reales y también el campo `nombre` en el array `ESCENARIOS` de
`js/script.js`.

## Próximos pasos posibles (a definir con el usuario)
- La historia de la sala de escape ya está definida y con contenido
  real (ver secciones "Sala 1/2/3/4 de la sala de escape" más arriba).
  El botón de debug "Pasar sala" ya se sacó (a pedido del usuario);
  falta probar el recorrido completo en un navegador real.
- Definir las 2 temáticas de los escenarios (ver sección de arriba) y
  generar las imágenes con Gemini.
- El reto de cada nivel ya está resuelto con preguntas de texto
  (`js/preguntas.js`); si más adelante se quiere un mini-juego real en
  vez de preguntas, ver la sección "Reto de cada nivel" de arriba para
  el punto de enganche.
- Definir el contenido real: mensaje personalizado, fotos, video, música,
  cuenta regresiva, sorpresa final al completar todos los niveles, etc.
- Agregar imágenes a `assets/imagenes/` y audio a `assets/audio/`.
- Diseño visual real del mapa (fondo temático, iconos por nivel, estrellas,
  animaciones) — a propósito se dejó para después de tener la base
  funcional andando.
- Si en algún momento se quiere compartir por internet (no solo local),
  ahí sí habría que evaluar opciones (ej. hosting gratuito), pero por ahora
  el objetivo es que funcione localmente en la computadora.
- Nota: como no hay navegador disponible en este entorno de desarrollo,
  el mapa se validó revisando el código y comprobando que el JS no tiene
  errores de sintaxis (`node --check`), pero conviene abrirlo una vez en
  el navegador real para confirmar que se ve y clickea como se espera.

## Cómo retomar en otra conversación
Decile a Claude: "Seguimos con la app de cumpleaños de Candela, mirá
CONTEXTO.md en la carpeta del proyecto" y con eso ya tiene todo el contexto.
