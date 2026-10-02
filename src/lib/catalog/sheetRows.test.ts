import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planificarBorrado, primeraFilaCambiada, ubicarFila } from './sheetRows.ts';

test('encuentra la fila y suma el encabezado al indice', () => {
  const hoja = ['0006', '0012', '0013'];
  const { filas } = planificarBorrado(hoja, ['0012']);

  assert.equal(filas.length, 1);
  // '0012' esta en la posicion 1 del array, o sea la fila 2 de la hoja.
  assert.equal(filas[0].indice, 2);
  assert.equal(filas[0].codigo, '0012');
});

test('ordena de mayor a menor indice', () => {
  const hoja = ['A', 'B', 'C', 'D', 'E'];
  const { filas } = planificarBorrado(hoja, ['B', 'D', 'A']);

  assert.deepEqual(
    filas.map((f) => f.indice),
    [4, 2, 1]
  );
});

test('reporta los codigos que no estan en la hoja', () => {
  const hoja = ['0006', '0012'];
  const { filas, noEncontrados } = planificarBorrado(hoja, ['0012', 'FANTASMA']);

  assert.equal(filas.length, 1);
  assert.deepEqual(noEncontrados, ['FANTASMA']);
});

test('ignora los ceros a la izquierda en los dos lados', () => {
  const hoja = ['12', '0075'];
  const { filas, noEncontrados } = planificarBorrado(hoja, ['0012', '75']);

  assert.equal(filas.length, 2);
  assert.deepEqual(noEncontrados, []);
});

test('la hoja reordenada no cambia el resultado, solo los indices', () => {
  const { filas } = planificarBorrado(['0013', '0012', '0006'], ['0012']);

  assert.equal(filas[0].indice, 2);
  assert.equal(filas[0].codigo, '0012');
});

test('sin codigos a borrar no planifica nada', () => {
  const { filas, noEncontrados } = planificarBorrado(['A', 'B'], []);

  assert.deepEqual(filas, []);
  assert.deepEqual(noEncontrados, []);
});

test('hoja vacia reporta todo como no encontrado', () => {
  const { filas, noEncontrados } = planificarBorrado([], ['A', 'B']);

  assert.deepEqual(filas, []);
  assert.deepEqual(noEncontrados, ['A', 'B']);
});

test('un codigo repetido en la hoja marca las dos filas', () => {
  const { filas } = planificarBorrado(['A', 'B', 'A'], ['A']);

  assert.deepEqual(
    filas.map((f) => f.indice),
    [3, 1]
  );
});

test('ignora espacios y mayusculas', () => {
  const { filas } = planificarBorrado(['  test0001 '], ['TEST0001']);

  assert.equal(filas.length, 1);
  assert.equal(filas[0].indice, 1);
});

test('primeraFilaCambiada: la hoja releida igual a la planificada deja borrar', () => {
  const columna = ['A1', 'B2', 'C3'];
  const plan = planificarBorrado(columna, ['B2', 'C3']);
  assert.equal(primeraFilaCambiada(columna, plan), null);
});

test('primeraFilaCambiada: si el dueno inserto una fila arriba, frena', () => {
  const plan = planificarBorrado(['A1', 'B2', 'C3'], ['C3']);
  // Entre la lectura y el borrado alguien inserto una fila arriba de todo.
  assert.deepEqual(primeraFilaCambiada(['NUEVA', 'A1', 'B2', 'C3'], plan), plan.filas[0]);
});

test('primeraFilaCambiada: si borraron filas y el indice ya no existe, frena', () => {
  const plan = planificarBorrado(['A1', 'B2', 'C3'], ['C3']);
  assert.notEqual(primeraFilaCambiada(['A1'], plan), null);
});

test('ubicarFila: devuelve la posicion, sin ceros a la izquierda', () => {
  assert.equal(ubicarFila(['0006', '12', '0013'], '0012'), 1);
});

test('ubicarFila: sin fila', () => {
  assert.equal(ubicarFila(['0006', '0013'], '0012'), 'sin_fila');
});

test('ubicarFila: un codigo en dos filas no se escribe', () => {
  assert.equal(ubicarFila(['0012', '0006', '12'], '0012'), 'repetido');
});
