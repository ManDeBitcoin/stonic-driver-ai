import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData, emptyData, filterData, parseBackup, parseData, summarize, validDate, validFuel, validShift } from '../src/domain.ts';
import type { Shift } from '../src/domain.ts';

const shift: Shift = { id: 'one', date: '2026-10-19', hours: 5, km: 100, trips: 12, income: 50.10, otherCosts: 2.20, notes: '' };
test('suma dinero en centavos y evita dividir para cero', () => {
  const result = summarize({ version: 1, shifts: [shift], fuel: [{ id: 'two', date: shift.date, gallons: 3, cost: 10.30, odometer: 20000, notes: '' }] });
  assert.equal(result.balance, 37.60);
  assert.equal(result.perHour, 10.02);
  assert.equal(summarize(emptyData()).perHour, null);
});
test('conserva saldos negativos; una carga sin jornadas no inventa ingresos', () => {
  const result = summarize({ ...emptyData(), fuel: [{ id: 'f', date: shift.date, gallons: 4, cost: 20, odometer: 100, notes: '' }] });
  assert.equal(result.balance, -20);
  assert.equal(result.perHour, null);
});
test('rango de fechas inclusivo y aplicado también al combustible', () => {
  const data = { version: 1 as const, shifts: [shift, { ...shift, id: 'old', date: '2026-10-18' }], fuel: [{ id: 'f', date: '2026-10-18', gallons: 3, cost: 10, odometer: 100, notes: '' }] };
  const filtered = filterData(data, '2026-10-19', '2026-10-19');
  assert.deepEqual(filtered.shifts, [shift]);
  assert.deepEqual(filtered.fuel, []);
});
test('rechaza fechas imposibles, cifras negativas e infinitas y viajes fraccionarios', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('19/10/2026'), false);
  assert.equal(validShift({ ...shift, income: -1 }), false);
  assert.equal(validShift({ ...shift, km: Infinity }), false);
  assert.equal(validShift({ ...shift, hours: 25 }), false);
  assert.equal(validShift({ ...shift, trips: 1.5 }), false);
  assert.equal(validFuel({ id: 'f', date: shift.date, gallons: 0, cost: 2, odometer: 0, notes: '' }), false);
});
test('el respaldo real completa un ciclo sin perder datos', () => {
  const data = demoData();
  assert.deepEqual(parseBackup(JSON.stringify({ app: 'stonic-driver-ai', mode: 'real', data })), data);
});
test('no permite importar una demostración como registros reales', () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: 'stonic-driver-ai', mode: 'demo', data: demoData() })), /reales/);
});
test('rechaza archivos rotos, versiones desconocidas e identificadores duplicados', () => {
  assert.throws(() => parseBackup('{'));
  assert.throws(() => parseData({ version: 2, shifts: [], fuel: [] }));
  assert.throws(() => parseData({ version: 1, shifts: [shift, shift], fuel: [] }), /duplicados/);
  assert.throws(() => parseData({ version: 1, shifts: [{ ...shift, income: '50' }], fuel: [] }));
});
test('los datos de ejemplo son válidos, independientes y suman correctamente', () => {
  const data = demoData();
  assert.deepEqual(parseData(data), data);
  assert.equal(summarize(data).income, 626.50);
  assert.equal(summarize(data).balance, 568);
  assert.equal(summarize(data).hours, 45);
  data.shifts.pop();
  assert.equal(demoData().shifts.length, 7);
});
