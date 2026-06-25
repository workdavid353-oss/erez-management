import { useState, useEffect, Fragment } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TABLE_LABELS = { cases: 'תיקים', case_assignments: 'משימות', profiles: 'פרופילים' }
const OP_LABEL     = { UPDATE: 'שינוי', DELETE: 'מחיקה', RESTORE: 'שחזור' }
const OP_COLOR     = { UPDATE: 'var(--brass)', DELETE: '#c0392b', RESTORE: 'var(--status-progress)' }
const SKIP_FIELDS  = new Set(['updated_at', 'created_at', 'work_start', 'work_end', 'work_hours'])
const SHOW_KEYS    = ['name', 'case_number', 'task_type', 'status', 'priority', 'notes', 'full_name', 'email', 'role']

function fmt(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function rowSummary(log) {
  const d = log.old_data || log.new_data || {}
  if (log.table_name === 'cases')            return d.name || d.case_number || `#${log.row_id.slice(0, 8)}`
  if (log.table_name === 'case_assignments') return d.task_type || `#${log.row_id.slice(0, 8)}`
  if (log.table_name === 'profiles')         return d.full_name || d.email || `#${log.row_id.slice(0, 8)}`
  return `#${log.row_id.slice(0, 8)}`
}

function getChangedFields(log) {
  if (!log.old_data || !log.new_data) return []
  return Object.keys(log.old_data).filter(k =>
    !SKIP_FIELDS.has(k) &&
    JSON.stringify(log.old_data[k]) !== JSON.stringify(log.new_data[k])
  )
}

function fmtTs(ts) {
  return new Date(ts).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function DiffPanel({ log }) {
  if (log.operation === 'UPDATE') {
    const fields = getChangedFields(log)
    if (!fields.length) return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>אין שינויים משמעותיים</div>
    return (
      <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '3px 20px 3px 0', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>שדה</th>
            <th style={{ padding: '3px 20px', textAlign: 'right', color: '#c0392b', fontWeight: 500 }}>לפני</th>
            <th style={{ padding: '3px 20px', textAlign: 'right', color: 'var(--status-progress)', fontWeight: 500 }}>אחרי</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(f => (
            <tr key={f}>
              <td style={{ padding: '3px 20px 3px 0', fontFamily: 'monospace' }}>{f}</td>
              <td style={{ padding: '3px 20px', color: '#c0392b' }}>{fmt(log.old_data[f])}</td>
              <td style={{ padding: '3px 20px', color: 'var(--status-progress)' }}>{fmt(log.new_data[f])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const d = log.old_data || {}
  const keys = SHOW_KEYS.filter(k => d[k] != null)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px', fontSize: 12 }}>
      {keys.map(k => (
        <span key={k}><span style={{ color: 'var(--text-muted)' }}>{k}: </span>{fmt(d[k])}</span>
      ))}
    </div>
  )
}

export default function AuditLogPage() {
  const { profile } = useAuth()
  const [logs,      setLogs]      = useState([])
  const [userMap,   setUserMap]   = useState({})
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)
  const [restoring, setRestoring] = useState(null)
  const [msgs,      setMsgs]      = useState({})
  const [filterTbl, setFilterTbl] = useState('')
  const [filterOp,  setFilterOp]  = useState('')

  async function load() {
    const [logsRes, profRes] = await Promise.all([
      supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('id, full_name'),
    ])
    setLogs(logsRes.data || [])
    const m = {}
    for (const p of (profRes.data || [])) m[p.id] = p.full_name
    setUserMap(m)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRestore(log) {
    setRestoring(log.id)
    const res = await fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:      'restore',
        table:       log.table_name,
        row_id:      log.row_id,
        old_data:    log.old_data,
        operation:   log.operation,
        restored_by: profile?.id,
      }),
    })
    const data = await res.json()
    setRestoring(null)
    if (data.error) {
      setMsgs(prev => ({ ...prev, [log.id]: { error: data.error } }))
    } else {
      setMsgs(prev => ({ ...prev, [log.id]: { ok: true } }))
      await load()
    }
  }

  const visible = logs.filter(l =>
    (!filterTbl || l.table_name === filterTbl) &&
    (!filterOp  || l.operation  === filterOp)
  )

  if (loading) return <div className="page"><div style={{ padding: 40, color: 'var(--text-muted)' }}>טוען...</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">סיסאדמין</div>
          <h1>לוג שינויים</h1>
          <div className="sub">כל שינוי ומחיקה שבוצעו על ידי משתמשים — ניתן לשחזר כל פעולה.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['', 'הכל'], ['cases', 'תיקים'], ['case_assignments', 'משימות'], ['profiles', 'פרופילים']].map(([v, l]) => (
          <button key={v} className={'chip' + (filterTbl === v ? ' active' : '')} onClick={() => setFilterTbl(v)}>{l}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />
        {[['', 'כל פעולות'], ['UPDATE', 'שינוי'], ['DELETE', 'מחיקה'], ['RESTORE', 'שחזור']].map(([v, l]) => (
          <button key={v} className={'chip' + (filterOp === v ? ' active' : '')} onClick={() => setFilterOp(v)}>{l}</button>
        ))}
        <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{visible.length} רשומות</span>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>אין רשומות</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  {['זמן', 'משתמש', 'טבלה', 'פעולה', 'רשומה', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(log => (
                  <Fragment key={log.id}>
                    <tr
                      style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer', background: expanded === log.id ? 'var(--bg-3)' : undefined }}
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtTs(log.changed_at)}</td>
                      <td style={{ padding: '10px 14px' }}>{log.changed_by ? (userMap[log.changed_by] || '—') : 'מערכת'}</td>
                      <td style={{ padding: '10px 14px' }}>{TABLE_LABELS[log.table_name] || log.table_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: (OP_COLOR[log.operation] || '#888') + '22', color: OP_COLOR[log.operation] || '#888' }}>
                          {OP_LABEL[log.operation] || log.operation}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{rowSummary(log)}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-muted)', fontSize: 11 }}>{expanded === log.id ? '▲' : '▼'}</td>
                    </tr>
                    {expanded === log.id && (
                      <tr style={{ background: 'var(--bg-3)' }}>
                        <td colSpan={6} style={{ padding: '14px 16px 16px' }}>
                          <DiffPanel log={log} />
                          {log.operation !== 'RESTORE' && (
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                              <button
                                className="btn"
                                style={{ fontSize: 12 }}
                                disabled={restoring === log.id}
                                onClick={e => { e.stopPropagation(); handleRestore(log) }}
                              >
                                {restoring === log.id ? 'משחזר...' : 'שחזר שינוי זה'}
                              </button>
                              {msgs[log.id]?.ok    && <span style={{ fontSize: 12, color: 'var(--status-progress)' }}>✓ שוחזר בהצלחה</span>}
                              {msgs[log.id]?.error && <span style={{ fontSize: 12, color: '#c0392b' }}>שגיאה: {msgs[log.id].error}</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
