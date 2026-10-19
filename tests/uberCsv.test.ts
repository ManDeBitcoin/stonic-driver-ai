import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUberCsv, parseDateString, parseNumericValue, parseDurationToHours, detectDelimiter } from '../src/uberCsv.ts';

test('detectDelimiter detecta comas, punto y coma y tabulaciones', () => {
  assert.equal(detectDelimiter('Fecha,Viajes,Ingresos'), ',');
  assert.equal(detectDelimiter('Fecha;Viajes;Ingresos'), ';');
  assert.equal(detectDelimiter('Fecha\tViajes\tIngresos'), '\t');
});

test('parseDateString maneja ISO y formato latino DD/MM/YYYY', () => {
  assert.equal(parseDateString('2026-10-18'), '2026-10-18');
  assert.equal(parseDateString('2026-10-18 14:32:00'), '2026-10-18');
  assert.equal(parseDateString('18/10/2026'), '2026-10-18');
  assert.equal(parseDateString('05/10/2026'), '2026-10-05');
  assert.equal(parseDateString('invalid-date'), null);
});

test('parseNumericValue maneja símbolos de dólar, espacios y comas decimales', () => {
  assert.equal(parseNumericValue('$12.50'), 12.50);
  assert.equal(parseNumericValue('USD 12,50'), 12.50);
  assert.equal(parseNumericValue('1.250,50'), 1250.50);
  assert.equal(parseNumericValue('1,250.50'), 1250.50);
  assert.equal(parseNumericValue(''), 0);
});

test('parseDurationToHours maneja HH:MM:SS y minutos numéricos', () => {
  assert.equal(parseDurationToHours('01:30:00'), 1.5);
  assert.equal(parseDurationToHours('45', true), 0.75); // 45 min
  assert.equal(parseDurationToHours('120'), 2); // >24 treated as minutes
});

test('parseUberCsv procesa reporte de viajes individuales en español y los agrupa por fecha', () => {
  const csv = `ID de viaje,Fecha de solicitud,Tu pago,Distancia (km),Duración (min)
trip-1,2026-10-18 08:30:00,$4.50,5.2,15
trip-2,2026-10-18 09:15:00,$6.25,7.8,25
trip-3,2026-10-19 14:00:00,$8.00,10.0,30`;

  const result = parseUberCsv(csv);
  assert.equal(result.shifts.length, 2);
  assert.equal(result.totalTrips, 3);
  assert.equal(result.totalIncome, 18.75);
  assert.equal(result.totalKm, 23.0);
  assert.equal(result.dateRange?.from, '2026-10-18');
  assert.equal(result.dateRange?.to, '2026-10-19');

  const shift18 = result.shifts.find(s => s.date === '2026-10-18');
  assert.ok(shift18);
  assert.equal(shift18.trips, 2);
  assert.equal(shift18.income, 10.75);
  assert.equal(shift18.km, 13.0);
  assert.equal(shift18.hours, 0.67); // 40 min = ~0.67 h
});

test('parseUberCsv procesa reporte diario con punto y coma y comas decimales', () => {
  const csv = `Fecha;Viajes completados;Horas en línea;Pago neto;Distancia (km)
18/10/2026;15;6,5;68,50;94
19/10/2026;18;7,0;82,75;118`;

  const result = parseUberCsv(csv);
  assert.equal(result.shifts.length, 2);
  assert.equal(result.totalTrips, 33);
  assert.equal(result.totalIncome, 151.25);
  assert.equal(result.totalHours, 13.5);
  assert.equal(result.totalKm, 212);
});

test('parseUberCsv procesa reporte en inglés con millas', () => {
  const csv = `Trip ID,Request Time,Your Earnings,Trip Distance (miles),Duration (min)
u1,2026-10-18 10:00:00,10.00,10.0,30`;

  const result = parseUberCsv(csv);
  assert.equal(result.shifts.length, 1);
  assert.equal(result.shifts[0].km, 16.1); // 10 miles * 1.60934 = 16.1 km
  assert.equal(result.shifts[0].income, 10.0);
});

test('parseUberCsv lanza error si no hay columnas requeridas o archivo vacío', () => {
  assert.throws(() => parseUberCsv(''), /vacío/);
  assert.throws(() => parseUberCsv('Columna1,Columna2\n1,2'), /columna de fecha/);
  assert.throws(() => parseUberCsv('Fecha,Columna2\n2026-10-18,2'), /columna de ingresos/);
});
