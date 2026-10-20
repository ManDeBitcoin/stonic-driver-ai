export type Shift = {
  id: string; date: string; hours: number; km: number; trips: number;
  income: number; otherCosts: number; notes: string;
};
export type Fuel = {
  id: string; date: string; gallons: number; cost: number; odometer: number; notes: string;
};
export type Data = { version: 1; shifts: Shift[]; fuel: Fuel[] };
export type Backup = { app: 'uber-driver-ai' | 'stonic-driver-ai'; mode: 'demo' | 'real'; exportedAt: string; data: Data };
export const STORAGE_KEY = 'uber-driver-ai:real:v1';
export const LEGACY_STORAGE_KEY = 'stonic-driver-ai:real:v1';
export const emptyData = (): Data => ({ version: 1, shifts: [], fuel: [] });
export const money = (n: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);
export const number = (n: number) => new Intl.NumberFormat('es-EC', { maximumFractionDigits: 3 }).format(n);
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const dateLabel = (date: string) => new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
function numeric(value: unknown, max: number, min = 0): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function base(value: Record<string, unknown>) {
  return typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 100 && validDate(value.date) && typeof value.notes === 'string' && value.notes.length <= 500;
}
export function validShift(value: unknown): value is Shift {
  return record(value) && base(value) && numeric(value.hours, 24, 0.01) && numeric(value.km, 3000) && numeric(value.trips, 300) && Number.isInteger(value.trips) && numeric(value.income, 100000) && numeric(value.otherCosts, 100000);
}
export function validFuel(value: unknown): value is Fuel {
  return record(value) && base(value) && numeric(value.gallons, 100, 0.001) && numeric(value.cost, 10000, 0.01) && numeric(value.odometer, 2000000);
}
export function parseData(value: unknown): Data {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.shifts) || !Array.isArray(value.fuel) || value.shifts.length > 20000 || value.fuel.length > 20000 || !value.shifts.every(validShift) || !value.fuel.every(validFuel)) throw new Error('El archivo no contiene registros válidos de Uber Driver AI.');
  const ids = [...value.shifts, ...value.fuel].map(r => r.id);
  if (new Set(ids).size !== ids.length) throw new Error('Hay registros duplicados en el respaldo.');
  return { version: 1, shifts: value.shifts.map(s => ({ id: s.id, date: s.date, hours: s.hours, km: s.km, trips: s.trips, income: s.income, otherCosts: s.otherCosts, notes: s.notes })), fuel: value.fuel.map(f => ({ id: f.id, date: f.date, gallons: f.gallons, cost: f.cost, odometer: f.odometer, notes: f.notes })) };
}
export function parseBackup(text: string): Data {
  const value: unknown = JSON.parse(text);
  if (!record(value) || (value.app !== 'uber-driver-ai' && value.app !== 'stonic-driver-ai') || value.mode !== 'real') throw new Error('Selecciona un respaldo de tus datos reales. Los ejemplos no se importan.');
  return parseData(value.data);
}
const cents = (n: number) => Math.round(n * 100);
export function summarize(data: Data) {
  const incomeCents = data.shifts.reduce((a, s) => a + cents(s.income), 0);
  const fuelCents = data.fuel.reduce((a, f) => a + cents(f.cost), 0);
  const otherCents = data.shifts.reduce((a, s) => a + cents(s.otherCosts), 0);
  const hours = data.shifts.reduce((a, s) => a + s.hours, 0);
  const km = data.shifts.reduce((a, s) => a + s.km, 0);
  const trips = data.shifts.reduce((a, s) => a + s.trips, 0);
  return { income: incomeCents / 100, fuel: fuelCents / 100, other: otherCents / 100, balance: (incomeCents - fuelCents - otherCents) / 100, hours, km, trips, perHour: hours ? incomeCents / 100 / hours : null };
}
export function filterData(data: Data, from: string, to: string): Data {
  const includes = (r: { date: string }) => (!from || r.date >= from) && (!to || r.date <= to);
  return { version: 1, shifts: data.shifts.filter(includes), fuel: data.fuel.filter(includes) };
}
export function demoData(): Data {
  const incomes = [68.50, 82.75, 73.20, 96.40, 112.80, 88.60, 104.25];
  const end = new Date(`${today()}T12:00:00Z`);
  const shifts = incomes.map((income, index) => {
    const date = new Date(end); date.setUTCDate(date.getUTCDate() - 6 + index);
    return { id: `demo-shift-${index}`, date: date.toISOString().slice(0, 10), income, hours: [5, 6, 5.5, 7, 8, 6, 7.5][index], km: [94, 118, 102, 140, 158, 124, 148][index], trips: [12, 16, 14, 19, 22, 17, 20][index], otherCosts: index % 2 ? 2.50 : 0, notes: 'Ejemplo ficticio · Guayaquil' };
  });
  return { version: 1, shifts, fuel: [1, 4].map((i) => ({ id: `demo-fuel-${i}`, date: shifts[i].date, gallons: 7.5, cost: 25.50, odometer: 20000 + i * 120, notes: 'Carga ficticia; no representa precios actuales.' })) };
}
