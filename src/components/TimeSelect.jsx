const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export default function TimeSelect({ value, onChange, style }) {
  const [hh, mm] = value ? value.split(':') : ['', '']

  function emit(h, m) {
    if (!h && !m) { onChange(''); return }
    onChange(`${h || '00'}:${m || '00'}`)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, ...style }}>
      <select className="field-input-el" style={{ width: 62, padding: '8px 4px', textAlign: 'center' }} value={hh || ''} onChange={e => emit(e.target.value, mm)}>
        <option value="">--</option>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span style={{ color: 'var(--text-dim)' }}>:</span>
      <select className="field-input-el" style={{ width: 62, padding: '8px 4px', textAlign: 'center' }} value={mm || ''} onChange={e => emit(hh, e.target.value)}>
        <option value="">--</option>
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )
}
