import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { dateLabel, demoData, emptyData, filterData, money, number, parseBackup, parseData, STORAGE_KEY, summarize, today, validFuel, validShift } from './domain.ts';
import type { Backup, Data, Fuel, Shift } from './domain.ts';
import { parseUberCsv } from './uberCsv.ts';
import type { UberImportResult } from './uberCsv.ts';

type Tab = 'Resumen' | 'Jornadas' | 'Combustible' | 'Mis datos';
function load() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? parseData(JSON.parse(raw)) : emptyData(), raw, error: '' };
  } catch {
    return { data: emptyData(), raw, error: 'No se pudieron leer tus datos. No los sobrescribiremos. Descarga el archivo de recuperación en Mis datos o restaura un respaldo válido.' };
  }
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Icon({ kind }: { kind: string }) {
  const paths: Record<string, ReactNode> = {
    Resumen: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    Jornadas: <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16m-12 5h3"/></>,
    Combustible: <><path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M2 21h14M4 10h10m0 3h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9l-4-4"/><path d="M19 6v4h3"/></>,
    'Mis datos': <><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></>,
    car: <><path d="m4 10 2-6h12l2 6M3 17v3m18-3v3M2 10h20v7H2zM5 13h3m8 0h3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></>,
  };
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] || paths.Resumen}</svg>;
}
function Field({ label, name, value, min = 0, max, step = '0.01', type = 'number', hint }: { label: string; name: string; value?: string | number; min?: number; max?: number; step?: string; type?: string; hint?: string }) {
  return <label className="field">{label}<input name={name} type={type} defaultValue={value} required min={type === 'number' ? min : undefined} max={type === 'number' ? max : today()} step={step}/>{hint && <small>{hint}</small>}</label>;
}

export default function App() {
  const [initial] = useState(load);
  const [real, setReal] = useState(initial.data);
  const rawRef = useRef(initial.raw);
  const [loadError, setLoadError] = useState(initial.error);
  const [demo, setDemo] = useState(demoData);
  const [mode, setMode] = useState<'demo' | 'real'>(initial.raw ? 'real' : 'demo');
  const [tab, setTab] = useState<Tab>('Resumen');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Shift | Fuel | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const uberFileRef = useRef<HTMLInputElement>(null);
  const [uberPreview, setUberPreview] = useState<UberImportResult | null>(null);
  const [replaceConflicts, setReplaceConflicts] = useState(true);
  const data = mode === 'demo' ? demo : real;
  const invalidRange = Boolean(from && to && from > to);
  const filtered = filterData(data, from, to);
  const stats = summarize(filtered);
  const tabs: Tab[] = ['Resumen', 'Jornadas', 'Combustible', 'Mis datos'];
  const recent = [...filtered.shifts].sort((a, b) => b.date.localeCompare(a.date));
  const chartDates = [...new Set(filtered.shifts.map(s => s.date))].sort().slice(-7);
  const chart = chartDates.map(date => ({ date, income: summarize({ version: 1, shifts: filtered.shifts.filter(s => s.date === date), fuel: [] }).income }));
  const maxIncome = Math.max(1, ...chart.map(c => c.income));

  function navigate(next: Tab) { setTab(next); setEditing(null); setFormKey(k => k + 1); setMessage(''); setError(''); }
  function commit(next: Data, restoring = false) {
    setError(''); setMessage('');
    try {
      const validated = parseData(next);
      if (mode === 'demo') { setDemo(validated); return true; }
      if (loadError && !restoring) throw new Error(loadError);
      if (localStorage.getItem(STORAGE_KEY) !== rawRef.current) throw new Error('Tus datos cambiaron en otra pestaña. Recarga esta página antes de guardar para no perder esos cambios.');
      const raw = JSON.stringify(validated);
      localStorage.setItem(STORAGE_KEY, raw);
      rawRef.current = raw; setReal(validated); setLoadError('');
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Descarga un respaldo antes de cerrar.'); return false; }
  }
  function saveShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const s: Shift = { id: editing?.id ?? crypto.randomUUID(), date: String(form.get('date')), hours: Number(form.get('hours')), km: Number(form.get('km')), trips: Number(form.get('trips')), income: Number(form.get('income')), otherCosts: Number(form.get('otherCosts')), notes: String(form.get('notes')).trim() };
    if (!validShift(s)) { setError('Revisa las cifras y la fecha de la jornada.'); return; }
    if (commit({ ...data, shifts: editing ? data.shifts.map(r => r.id === s.id ? s : r) : [...data.shifts, s] })) { setEditing(null); setFormKey(k => k + 1); setMessage(mode === 'demo' ? 'Jornada de práctica guardada. No afecta tus datos reales.' : 'Jornada guardada en este navegador.'); }
  }
  function saveFuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const f: Fuel = { id: editing?.id ?? crypto.randomUUID(), date: String(form.get('date')), gallons: Number(form.get('gallons')), cost: Number(form.get('cost')), odometer: Number(form.get('odometer')), notes: String(form.get('notes')).trim() };
    if (!validFuel(f)) { setError('Revisa las cifras y la fecha de la carga.'); return; }
    if (commit({ ...data, fuel: editing ? data.fuel.map(r => r.id === f.id ? f : r) : [...data.fuel, f] })) { setEditing(null); setFormKey(k => k + 1); setMessage(mode === 'demo' ? 'Carga de práctica guardada. No afecta tus datos reales.' : 'Carga guardada en este navegador.'); }
  }
  function remove(id: string, kind: 'shifts' | 'fuel') {
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
    if (commit({ ...data, [kind]: data[kind].filter(r => r.id !== id) })) { setEditing(null); setFormKey(k => k + 1); setMessage('Registro eliminado.'); }
  }
  function edit(row: Shift | Fuel) { setEditing(row); setFormKey(k => k + 1); setMessage(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function exportBackup() {
    const backup: Backup = { app: 'stonic-driver-ai', mode, exportedAt: new Date().toISOString(), data };
    download(JSON.stringify(backup, null, 2), `stonic-respaldo-${mode}-${today()}.json`);
    setMessage('Respaldo descargado. Guárdalo en un lugar privado.');
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      if (mode !== 'real') throw new Error('Cambia a Mis registros para restaurar un respaldo.');
      if (file.size > 10000000) throw new Error('El respaldo supera el máximo de 10 MB.');
      const restored = parseBackup(await file.text());
      if (!window.confirm(`Este respaldo contiene ${restored.shifts.length} jornadas y ${restored.fuel.length} cargas. Reemplazará tus ${real.shifts.length} jornadas y ${real.fuel.length} cargas actuales. ¿Restaurar?`)) return;
      if (commit(restored, true)) setMessage('Respaldo restaurado correctamente.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo leer el respaldo.'); }
    finally { if (importRef.current) importRef.current.value = ''; }
  }
  async function handleUberFile(file: File | undefined) {
    if (!file) return;
    setError(''); setMessage('');
    try {
      if (file.size > 20000000) throw new Error('El archivo CSV supera el máximo de 20 MB.');
      const text = await file.text();
      const parsed = parseUberCsv(text);
      setUberPreview(parsed);
      setReplaceConflicts(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo CSV de Uber.');
    } finally {
      if (uberFileRef.current) uberFileRef.current.value = '';
    }
  }
  function confirmUberImport() {
    if (!uberPreview) return;
    const imported = uberPreview.shifts;
    const existing = data.shifts;
    let nextShifts: Shift[];
    if (replaceConflicts) {
      const importedDates = new Set(imported.map(s => s.date));
      const kept = existing.filter(s => !importedDates.has(s.date));
      nextShifts = [...kept, ...imported];
    } else {
      const existingDates = new Set(existing.map(s => s.date));
      const newOnly = imported.filter(s => !existingDates.has(s.date));
      nextShifts = [...existing, ...newOnly];
    }
    nextShifts.sort((a, b) => b.date.localeCompare(a.date));
    if (commit({ ...data, shifts: nextShifts })) {
      setMessage(`Se importaron ${imported.length} jornada(s) de Uber exitosamente.`);
      setUberPreview(null);
      navigate('Jornadas');
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('Resumen'); }}><span className="brand-icon"><Icon kind="car"/></span><span>stonic<span className="brand-sub">DRIVER AI</span></span></a>
      <p className="nav-label">TU ESPACIO DE CONDUCCIÓN</p>
      <nav aria-label="Navegación principal">{tabs.map((name, i) => <button key={name} className={tab === name ? 'nav-item active' : 'nav-item'} aria-current={tab === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon kind={name}/>{name}<span className="nav-index">0{i + 1}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="vehicle"><Icon kind="car"/><div><strong>Kia Stonic</strong><small>Guayaquil, Ecuador</small></div></div><div className="local-status"><span/> Proyecto local · v0.1</div></div>
    </aside>
    <main>
      <header className="topbar"><span>MI BITÁCORA <span className="slash">/</span> <strong>{tab}</strong></span><span className="location">Guayaquil <span>·</span> USD</span></header>
      <div className="content">
        <div className="page-heading"><div><p className="eyebrow">CADA JORNADA CUENTA</p><h1>{tab === 'Resumen' ? 'Tu camino, en números.' : tab === 'Jornadas' ? 'Registra tu jornada.' : tab === 'Combustible' ? 'Cada carga, bajo control.' : 'Tus datos, contigo.'}</h1><p className="subtitle">{tab === 'Resumen' ? 'Una mirada clara a tu trabajo y a tu Stonic.' : tab === 'Jornadas' ? 'Anota cómo te fue al terminar de conducir.' : tab === 'Combustible' ? 'Lleva un historial de tus compras de combustible.' : 'Guarda una copia y conoce los próximos pasos.'}</p></div><span className="version-tag">PRIMERA VERSIÓN</span></div>
        <section className={mode === 'demo' ? 'mode-banner' : 'mode-banner real'} aria-label="Modo de datos"><div><strong>{mode === 'demo' ? 'Estás explorando datos de ejemplo' : 'Estás usando tus registros personales'}</strong><p>{mode === 'demo' ? 'Practica con cifras ficticias. Los cambios de práctica se reinician al recargar.' : 'Guardados en este navegador. Descarga respaldos para conservar una copia.'}</p></div><button className="outline" onClick={() => { setMode(mode === 'demo' ? 'real' : 'demo'); setEditing(null); setFormKey(k => k + 1); setMessage(''); setError(''); setFrom(''); setTo(''); }}>{mode === 'demo' ? 'Usar mis registros' : 'Ver demostración'} <span aria-hidden="true">↗</span></button></section>
        {loadError && mode === 'real' && <p className="alert error" role="alert">{loadError}</p>}
        {message && <p className="alert" role="status">{message}</p>}{error && <p className="alert error" role="alert">{error}</p>}
        {tab !== 'Mis datos' && <div className="period"><span>PERÍODO <strong>{!from && !to ? 'Todos los registros' : 'Personalizado'}</strong></span><div className="date-filters"><label>Desde <input aria-label="Desde" type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>Hasta <input aria-label="Hasta" type="date" value={to} onChange={e => setTo(e.target.value)}/></label>{(from || to) && <button className="text-button" onClick={() => { setFrom(''); setTo(''); }}>Quitar filtro</button>}</div></div>}
        {invalidRange && <p className="alert error" role="alert">La fecha Desde debe ser anterior o igual a Hasta.</p>}
        {tab === 'Resumen' && !invalidRange && <>
          <div className="stats"><article className="stat featured"><span className="stat-label">Saldo registrado <span>↗</span></span><strong>{money(stats.balance)}</strong><small>Ingresos − combustible − otros gastos</small></article><article className="stat"><span className="stat-label">Ingresos del conductor</span><strong>{money(stats.income)}</strong><small>Después de la comisión de la plataforma</small></article><article className="stat"><span className="stat-label">Compras de combustible</span><strong>{money(stats.fuel)}</strong><small>{filtered.fuel.length} cargas registradas</small></article><article className="stat"><span className="stat-label">Ingresos por hora</span><strong>{stats.perHour === null ? '—' : money(stats.perHour)}</strong><small>Antes de combustible y otros gastos</small></article></div>
          <div className="dashboard-grid"><section className="panel chart-panel"><div className="section-heading"><div><p className="eyebrow">TU ACTIVIDAD</p><h2>Así van tus ingresos</h2></div><span className="chart-legend"><i/> Ingresos USD</span></div><p className="muted">Últimos 7 días con jornadas dentro del período</p>{chart.length ? <div className="chart" role="img" aria-label={chart.map(c => `${dateLabel(c.date)}: ${money(c.income)}`).join('; ')}>{chart.map(c => <div className="bar-group" key={c.date}><span className="bar-value">{money(c.income)}</span><div className="bar-track"><div className="bar" style={{ height: `${Math.max(2, c.income / maxIncome * 100)}%` }}/></div><span className="bar-date">{dateLabel(c.date)}</span></div>)}</div> : <div className="empty"><Icon kind="Jornadas"/><h3>Tu primera jornada empieza aquí</h3><p>Registra una jornada para ver tus ingresos.</p><button onClick={() => navigate('Jornadas')}>Registrar jornada</button></div>}<div className="activity-strip"><span><b>{number(stats.trips)}</b> viajes</span><span><b>{number(stats.km)}</b> km</span><span><b>{number(stats.hours)}</b> horas</span></div></section>
          <section className="panel next-panel"><span className="round-icon"><Icon kind="car"/></span><p className="eyebrow">TU COPILOTO DE REGISTRO</p><h2>Un pequeño hábito.<br/>Más claridad.</h2><p>Al terminar, anota tu jornada. Cuando cargues gasolina, guarda el recibo y registra la compra.</p><button onClick={() => navigate('Jornadas')}>+ Registrar jornada</button><button className="outline" onClick={() => navigate('Combustible')}>+ Registrar combustible</button><small>Usa la bitácora con el vehículo estacionado.</small></section></div>
          <section className="panel"><div className="section-heading"><h2>Últimas jornadas</h2><button className="text-button" onClick={() => navigate('Jornadas')}>Ver todas →</button></div>{recent.length ? <ShiftTable rows={recent.slice(0, 5)}/> : <p className="muted">Todavía no hay jornadas en este período.</p>}</section>
          <p className="calculation-note">El saldo registrado no es utilidad neta: resta compras de combustible, no consumo del período. No incluye depreciación, mantenimiento, seguros ni impuestos salvo que los anotes como otros gastos. Los resúmenes son cálculos locales; esta versión todavía no incorpora un modelo de IA.</p>
        </>}
        {tab === 'Jornadas' && <>
          <section className="panel"><div className="section-heading"><h2>{editing ? 'Editar jornada' : 'Nueva jornada'}</h2><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><button type="button" className="btn-import" onClick={() => uberFileRef.current?.click()}><Icon kind="upload"/> Importar de Uber (CSV)</button><span className="small-badge">REGISTRO MANUAL</span></div></div><form key={formKey} onSubmit={saveShift}><div className="form-grid"><Field label="Fecha de la jornada" name="date" type="date" value={editing?.date ?? today()}/><Field label="Horas trabajadas" name="hours" value={(editing as Shift)?.hours} min={0.01} max={24} hint="Incluye las esperas. Ejemplo: 6.5 = 6 h 30 min."/><Field label="Kilómetros recorridos" name="km" value={(editing as Shift)?.km} max={3000} hint="Incluye desplazamientos sin pasajero."/><Field label="Viajes completados" name="trips" value={(editing as Shift)?.trips} max={300} step="1"/><Field label="Ingresos del conductor (USD)" name="income" value={(editing as Shift)?.income} max={100000} hint="Después de comisión; incluye propinas y bonos una sola vez."/><Field label="Otros gastos (USD)" name="otherCosts" value={(editing as Shift)?.otherCosts ?? 0} max={100000} hint="Peajes, parqueo, etc. Excluye combustible."/></div><label className="field notes">Nota opcional<textarea name="notes" maxLength={500} defaultValue={editing?.notes} placeholder="Por ejemplo: jornada de la mañana"/></label><div className="form-actions"><button type="submit">{editing ? 'Guardar cambios' : 'Guardar jornada'}</button>{editing && <button type="button" className="outline" onClick={() => { setEditing(null); setFormKey(k => k + 1); }}>Cancelar edición</button>}<small>{mode === 'demo' ? 'Se guardará solo en la demostración.' : 'Se guardará en este navegador.'}</small></div></form></section>
          <section className="panel"><div className="section-heading"><h2>Historial de jornadas</h2><span className="muted">{recent.length} registros en el período</span></div>{recent.length && !invalidRange ? <ShiftTable rows={recent} onEdit={edit} onDelete={id => remove(id, 'shifts')}/> : <p className="muted">No hay jornadas para mostrar.</p>}</section>
        </>}
        {tab === 'Combustible' && <>
          <section className="panel"><div className="section-heading"><h2>{editing ? 'Editar carga' : 'Nueva carga'}</h2><span className="small-badge">REGISTRO MANUAL</span></div><form key={formKey} onSubmit={saveFuel}><div className="form-grid"><Field label="Fecha de la carga" name="date" type="date" value={editing?.date ?? today()}/><Field label="Galones estadounidenses" name="gallons" value={(editing as Fuel)?.gallons} min={0.001} max={100} step="0.001" hint="Copia la cantidad que figura en el recibo."/><Field label="Total pagado (USD)" name="cost" value={(editing as Fuel)?.cost} min={0.01} max={10000}/><Field label="Odómetro (km)" name="odometer" value={(editing as Fuel)?.odometer} max={2000000} hint="Kilometraje total que muestra tu vehículo."/></div><label className="field notes">Nota opcional<textarea name="notes" maxLength={500} defaultValue={editing?.notes} placeholder="Por ejemplo: estación y número de recibo"/></label><div className="form-actions"><button type="submit">{editing ? 'Guardar cambios' : 'Guardar carga'}</button>{editing && <button type="button" className="outline" onClick={() => { setEditing(null); setFormKey(k => k + 1); }}>Cancelar edición</button>}<small>El precio por galón se calcula con tu recibo.</small></div></form></section>
          <section className="panel"><div className="section-heading"><h2>Historial de combustible</h2><span className="muted">{filtered.fuel.length} cargas en el período</span></div>{filtered.fuel.length && !invalidRange ? <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Galones</th><th>Total</th><th>USD / galón</th><th>Odómetro</th><th>Nota</th><th>Acciones</th></tr></thead><tbody>{[...filtered.fuel].sort((a, b) => b.date.localeCompare(a.date)).map(f => <tr key={f.id}><td>{dateLabel(f.date)}<small>{f.date.slice(0, 4)}</small></td><td>{number(f.gallons)}</td><td><strong>{money(f.cost)}</strong></td><td>{money(f.cost / f.gallons)}</td><td>{number(f.odometer)} km</td><td className="note-cell">{f.notes || '—'}</td><td><div className="row-actions"><button className="text-button" onClick={() => edit(f)} aria-label={`Editar carga del ${f.date}`}>Editar</button><button className="text-button danger" onClick={() => remove(f.id, 'fuel')} aria-label={`Eliminar carga del ${f.date}`}>Eliminar</button></div></td></tr>)}</tbody></table></div> : <p className="muted">Todavía no hay cargas en este período.</p>}<p className="calculation-note">Estos registros muestran compras. El rendimiento en km/galón requiere un método de tanque lleno y se añadirá más adelante.</p></section>
        </>}
        {tab === 'Mis datos' && <div className="settings-grid"><section className="panel"><span className="round-icon"><Icon kind="Mis datos"/></span><h2>Una copia para estar tranquilo</h2><p>Descarga todos los registros del modo actual. Para restaurarlos, usa un respaldo de datos reales de esta aplicación.</p><p className="muted">{data.shifts.length} jornadas · {data.fuel.length} cargas · {mode === 'demo' ? 'Datos de ejemplo' : 'Datos reales'}</p><div className="stack"><button onClick={exportBackup} disabled={Boolean(loadError) && mode === 'real'}>Descargar respaldo {mode === 'demo' ? 'de ejemplo' : ''}</button><button className="outline" disabled={mode === 'demo'} onClick={() => importRef.current?.click()}>Restaurar respaldo real</button><input ref={importRef} type="file" accept=".json,application/json" hidden onChange={e => void restore(e.target.files?.[0])}/>{loadError && rawRef.current && <button className="outline" onClick={() => download(rawRef.current!, 'stonic-recuperacion.json')}>Descargar archivo de recuperación</button>}</div><p className="calculation-note">Restaurar reemplaza tus registros y pide confirmación. Descarga primero una copia de tus datos actuales.</p></section><section className="panel"><span className="badge-uber">UBER DRIVER</span><h2>Importar reporte de Uber</h2><p>Importa el archivo CSV oficial descargado desde <strong>drivers.uber.com</strong> (Extractos semanales o Actividad de viajes). Tu bitácora calculará viajes, ingresos, horas y km automáticamente.</p><div className="stack"><button onClick={() => uberFileRef.current?.click()}><Icon kind="upload"/> Seleccionar archivo CSV de Uber</button></div><p className="calculation-note">Tus datos se procesan 100% de manera local y privada en tu navegador. No se envían a ningún servidor externo.</p></section><section className="panel privacy-panel"><h2>¿Dónde están mis datos?</h2><p>En el almacenamiento de este navegador y esta dirección local. No hay cuenta, servidor remoto ni sincronización con tu iPhone. Borrar los datos del navegador puede borrar tus registros. Usa siempre la misma dirección y perfil de navegador; evita el modo incógnito.</p><p>La aplicación no envía tus registros a Uber ni a OpenAI. Las copias descargadas no están cifradas; consérvalas en una carpeta privada. El acceso depende de tu cuenta de Windows y del navegador.</p></section></div>}
        <input ref={uberFileRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={e => void handleUberFile(e.target.files?.[0])}/>
        {uberPreview && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="badge-uber">UBER DRIVER CSV</span>
                <h3 id="modal-title" style={{ marginTop: '6px' }}>Vista previa de importación</h3>
              </div>
              <button className="text-button" onClick={() => setUberPreview(null)} aria-label="Cerrar modal">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-stat"><span>Jornadas</span><strong>{uberPreview.shifts.length}</strong></div>
                <div className="modal-stat"><span>Viajes</span><strong>{number(uberPreview.totalTrips)}</strong></div>
                <div className="modal-stat"><span>Horas</span><strong>{number(uberPreview.totalHours)} h</strong></div>
                <div className="modal-stat"><span>Ingresos</span><strong>{money(uberPreview.totalIncome)}</strong></div>
              </div>
              {uberPreview.dateRange && <p className="muted" style={{ margin: 0 }}>Período detectado: <strong>{dateLabel(uberPreview.dateRange.from)}</strong> a <strong>{dateLabel(uberPreview.dateRange.to)}</strong> ({uberPreview.rawRowCount} filas procesadas).</p>}
              {(() => {
                const existingDates = new Set(data.shifts.map(s => s.date));
                const conflicts = uberPreview.shifts.filter(s => existingDates.has(s.date)).length;
                return conflicts > 0 && <div className="conflict-warning">
                  ⚠️ <strong>{conflicts} jornada(s)</strong> de este archivo coinciden con fechas ya registradas.
                  <div className="modal-options" style={{ marginTop: '8px' }}>
                    <label><input type="radio" name="conflict-choice" checked={replaceConflicts} onChange={() => setReplaceConflicts(true)}/> Reemplazar las jornadas existentes en esas fechas con el CSV</label>
                    <label><input type="radio" name="conflict-choice" checked={!replaceConflicts} onChange={() => setReplaceConflicts(false)}/> Conservar las existentes y solo importar fechas nuevas</label>
                  </div>
                </div>;
              })()}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#274b3d' }}>Jornadas a incorporar:</h4>
                <div className="table-scroll" style={{ maxHeight: '200px' }}>
                  <table>
                    <thead><tr><th>Fecha</th><th>Viajes</th><th>Horas</th><th>Km</th><th>Ingreso</th></tr></thead>
                    <tbody>
                      {uberPreview.shifts.map(s => <tr key={s.id}><td><strong>{dateLabel(s.date)}</strong></td><td>{s.trips}</td><td>{number(s.hours)} h</td><td>{number(s.km)} km</td><td className="income-cell">{money(s.income)}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline" onClick={() => setUberPreview(null)}>Cancelar</button>
              <button type="button" onClick={confirmUberImport}>Confirmar e importar ({uberPreview.shifts.length} jornadas)</button>
            </div>
          </div>
        </div>}
        <footer><span>STONIC DRIVER AI</span><span>Hecho para tu día a día en Guayaquil.</span><span>Local · Personal · A tu ritmo</span></footer>
      </div>
    </main>
  </div>;
}

function ShiftTable({ rows, onEdit, onDelete }: { rows: Shift[]; onEdit?: (s: Shift) => void; onDelete?: (id: string) => void }) {
  return <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Viajes</th><th>Horas</th><th>Kilómetros</th><th>Ingresos</th><th>Otros gastos</th>{onEdit && <><th>Nota</th><th>Acciones</th></>}</tr></thead><tbody>{rows.map(s => <tr key={s.id}><td><strong>{dateLabel(s.date)}</strong><small>{s.date.slice(0, 4)}</small></td><td>{s.trips}</td><td>{number(s.hours)} h</td><td>{number(s.km)} km</td><td className="income-cell">{money(s.income)}</td><td>{money(s.otherCosts)}</td>{onEdit && <><td className="note-cell">{s.notes || '—'}</td><td><div className="row-actions"><button className="text-button" onClick={() => onEdit(s)} aria-label={`Editar jornada del ${s.date}`}>Editar</button><button className="text-button danger" onClick={() => onDelete?.(s.id)} aria-label={`Eliminar jornada del ${s.date}`}>Eliminar</button></div></td></>}</tr>)}</tbody></table></div>;
}
