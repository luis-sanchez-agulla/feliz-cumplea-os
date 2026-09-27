// ============================================
// NORMALIZACION DE TEXTO (compartida entre el mapa y la sala de escape)
// ============================================
// Compara respuestas/codigos ignorando mayusculas/minusculas, tildes y
// espacios de mas, para no fallar por detalles de tipeo que no hacen a
// la respuesta en si.
//
// Nota tecnica: los caracteres especiales (enie, tildes) se arman acá
// con String.fromCharCode / codigos numericos en vez de escribirlos
// literales en el archivo, para evitar problemas de codificacion al
// guardar el archivo.
function normalizarTexto(texto) {
  const ENIE = String.fromCharCode(241); // 'ñ'
  const MARCADOR = String.fromCharCode(1); // caracter de control, no aparece en texto normal
  // Combining Diacritical Marks: U+0300 a U+036F (rango de tildes que
  // deja 'normalize NFD' al separar una letra de su tilde)
  const RANGO_TILDES = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');

  return texto
    .toString()
    .trim()
    .toLowerCase()
    // la enie se protege antes de sacar tildes: al pasar por NFD se
    // descompone en "n" + tilde combinada, y el replace de abajo se la
    // comia, convirtiendo cualquier enie en n por error
    .split(ENIE).join(MARCADOR)
    .normalize('NFD')
    .replace(RANGO_TILDES, '')
    .split(MARCADOR).join(ENIE)
    .replace(/\s+/g, ' ');
}
