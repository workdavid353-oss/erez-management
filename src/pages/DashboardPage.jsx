import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, fmtDateTime, fmtDate, initials } from '../lib/helpers'
import { IcBriefcase, IcClock, IcAlert, IcAward, IcSearch, IcPlus, IcFilter, IcDownload, IcX, IcTrash } from '../components/Icons'

const CATEGORIES = ['אזרחי', 'פלילי', 'מסחרי', 'משפחה', 'נדל"ן', 'עבודה']
const STATUS_OPTIONS = ['חדש', 'בטיפול', 'דחוף', 'ממתין', 'הושלם', 'סגור']

const STATUS_COLOR = {
  'חדש':    'var(--brass)',
  'בטיפול': 'var(--status-progress)',
  'דחוף':   'var(--status-urgent)',
  'ממתין':  'var(--status-pending)',
  'בוצע':   'var(--status-done)',
  'הושלם':  'var(--status-done)',
  'סגור':   'var(--status-done)',
  'תקוע':   'var(--status-urgent)',
}

function ConfirmModal({ title, message, confirmLabel = 'אישור', onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button
            className="btn primary"
            style={{ background: 'var(--status-urgent)', borderColor: 'var(--status-urgent)' }}
            onClick={onConfirm}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function NewCaseModal({ onClose, onSaved, userId }) {
  const [form, setForm] = useState({ name: '', court_case_number: '', category: '', status: 'חדש', subject: '', additional_info: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('cases').insert({
      name: form.name,
      court_case_number: form.court_case_number || null,
      category: form.category || null,
      status: form.status,
      subject: form.subject || null,
      additional_info: form.additional_info || null,
      updated_by: userId,
    })
    setSaving(false)
    if (!error) { onSaved(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>תיק חדש</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body">
          <div className="field-grid">
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">שם התיק *</span>
              <input className="field-input-el" placeholder="לדוגמה: ישראלי נ. כהן" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">מספר בית משפט</span>
              <input className="field-input-el" placeholder="1234/2026" value={form.court_case_number} onChange={e => set('court_case_number', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">קטגוריה</span>
              <select className="field-input-el" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">— בחר —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">סטטוס</span>
              <select className="field-input-el" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">נושא</span>
              <input className="field-input-el" value={form.subject} onChange={e => set('subject', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">מידע נוסף / הערות</span>
              <textarea className="field-input-el" rows={3} value={form.additional_info} onChange={e => set('additional_info', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'שומר...' : 'צור תיק'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: I, label, value, delta, up, down }) {
  return (
    <div className="stat-card">
      <div className="accent-bar" />
      <div className="label"><I size={13} /> {label}</div>
      <div className="value">{value}</div>
      <div className={'delta' + (up ? ' up' : '') + (down ? ' down' : '')}>{delta}</div>
    </div>
  )
}

export default function DashboardPage({ onOpenCase }) {
  const { user, isAdmin } = useAuth()
  const [cases,       setCases]       = useState([])
  const [employees,   setEmployees]   = useState([])
  const [assignments, setAssignments] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [q,           setQ]           = useState('')
  const [cat,         setCat]         = useState('all')
  const [newCase,         setNewCase]         = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function load() {
    const [casesRes, empRes, assignRes] = await Promise.all([
      supabase.from('cases').select('*, updater:updated_by(id, full_name)').order('serial_number'),
      supabase.from('profiles').select('id, full_name').eq('role', 'employee'),
      supabase.from('case_assignments').select('case_id, employee_id, status, priority, task_type, updated_at'),
    ])
    setCases(casesRes.data || [])
    setEmployees((empRes.data || []).map(e => ({ ...e, initials: initials(e.full_name) })))
    const map = {}
    ;(assignRes.data || []).forEach(a => {
      if (!map[a.case_id]) map[a.case_id] = {}
      const existing = map[a.case_id][a.employee_id]
      if (!existing || new Date(a.updated_at) > new Date(existing.updated_at)) {
        map[a.case_id][a.employee_id] = a
      }
    })
    setAssignments(map)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleExport() {
    const rows = filtered.map(c => {
      const row = {
        'מס׳ סידורי':    c.serial_number,
        'שם התיק':       c.name,
        'נושא':          c.subject        || '',
        'מספר ביהמ"ש':   c.court_case_number || '',
        'קטגוריה':       c.category       || '',
        'סטטוס':         c.status         || '',
        'מידע נוסף':     c.additional_info || '',
        'עודכן בתאריך':  fmtDate(c.updated_at),
        'עודכן ע"י':     c.updater?.full_name || '',
      }
      employees.forEach(e => {
        const a = assignments[c.id]?.[e.id]
        row[e.full_name + ' — סטטוס']  = a?.status    || ''
        row[e.full_name + ' — משימה']  = a?.task_type || ''
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'תיקים')

    // column widths
    ws['!cols'] = Object.keys(rows[0] || {}).map(k =>
      ({ wch: Math.max(k.length, 14) })
    )

    const date = new Date().toLocaleDateString('he-IL').replace(/\//g, '-')
    XLSX.writeFile(wb, `תיקי-משרד-${date}.xlsx`)
  }

  async function handleDelete(id) {
    await supabase.from('cases').delete().eq('id', id)
    setCases(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
  }

  const filtered = cases.filter(c => {
    if (cat !== 'all' && c.category !== cat) return false
    if (q.trim()) {
      const s = q.toLowerCase()
      if (!c.name?.toLowerCase().includes(s) && !c.subject?.toLowerCase().includes(s)) return false
    }
    return true
  })

  const openCases = cases.filter(c => c.status !== 'הושלם' && c.status !== 'סגור').length
  const urgent    = cases.filter(c => c.status === 'דחוף').length

  const taskCount = {}
  Object.values(assignments).forEach(caseMap =>
    Object.entries(caseMap).forEach(([empId, a]) => {
      if (a.status !== 'בוצע' && a.status !== 'סגור' && a.status !== 'הושלם')
        taskCount[empId] = (taskCount[empId] || 0) + 1
    })
  )
  const topEmpId = Object.entries(taskCount).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topEmp   = employees.find(e => e.id === topEmpId)

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען נתונים...</div>

  return (
    <div className="page">
      {newCase && <NewCaseModal userId={user?.id} onClose={() => setNewCase(false)} onSaved={load} />}
      {confirmDeleteId && (
        <ConfirmModal
          title="מחיקת תיק"
          message={`האם למחוק את התיק "${cases.find(c => c.id === confirmDeleteId)?.name}"? פעולה זו תמחק גם את כל המשימות המשויכות ואינה ניתנת לביטול.`}
          confirmLabel="מחק תיק"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
      <div className="page-header">
        <div>
          <div className="eyebrow">תיקי המשרד · {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1>לוח בקרה</h1>
          <div className="sub">כל התיקים הפעילים, סטטוס המשימות לכל עורך דין, ועדכון אחרון.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleExport}><IcDownload size={14} /> ייצוא Excel</button>
          <button className="btn primary" onClick={() => setNewCase(true)}><IcPlus size={14} /> תיק חדש</button>
        </div>
      </div>

      <div className="stats">
        <StatCard icon={IcBriefcase} label="תיקים פתוחים"  value={openCases} delta={`מתוך ${cases.length} תיקים`} />
        <StatCard icon={IcClock}     label="סה״כ תיקים"    value={cases.length} delta="במערכת" />
        <StatCard icon={IcAlert}     label="תיקים דחופים"  value={urgent} delta={urgent > 0 ? 'דורש עין' : 'הכל תקין'} down={urgent > 0} />
        <StatCard icon={IcAward}     label="עומס הכי גבוה" value={topEmp?.initials || '—'}
          delta={topEmp ? `${topEmp.full_name} · ${taskCount[topEmpId] || 0} משימות` : 'אין משימות פתוחות'} />
      </div>

      <div className="toolbar">
        <div className="search">
          <input placeholder="חיפוש לפי שם תיק, נושא…" value={q} onChange={e => setQ(e.target.value)} />
          <IcSearch className="search-icon" size={15} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={'chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>הכל</button>
          {CATEGORIES.map(c => (
            <button key={c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn"><IcFilter size={14} /> סינון מתקדם</button>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            מציג <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> מתוך {cases.length}
          </span>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="cases">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>תיק / נושא</th>
                <th>סטטוס</th>
                <th>קטגוריה</th>
                <th style={{ minWidth: 160 }}>מידע נוסף</th>
                {employees.map(e => (
                  <th key={e.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="avatar" style={{ width: 20, height: 20, fontSize: 10 }}>{e.initials}</span>
                      <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
                        {e.full_name.split(' ')[0]}
                      </span>
                    </div>
                  </th>
                ))}
                <th>עודכן</th>
                <th>ע"י</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5 + employees.length + (isAdmin ? 1 : 0)} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>לא נמצאו תיקים</td></tr>
              ) : filtered.map(c => {
                const caseStatus = STATUS_CLASS[c.status] || 'pending'
                return (
                  <tr key={c.id} onClick={() => onOpenCase(c.id)} className={c.status === 'דחוף' ? 'urgent-row' : ''}>
                    <td>
                      <div className="case-name">{c.name}</div>
                      <div className="case-meta">{c.subject} · <span className="mono">{c.court_case_number || '—'}</span></div>
                    </td>
                    <td><span className={'status-cell ' + caseStatus}><span className="dot" />{c.status}</span></td>
                    <td><span className="cat-tag">{c.category || '—'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 200 }}>{c.additional_info || '—'}</td>
                    {employees.map(e => {
                      const a = assignments[c.id]?.[e.id]
                      if (!a) return <td key={e.id}><span className="empty-cell">— לא מוקצה</span></td>
                      const color = STATUS_COLOR[a.status] || 'var(--text-dim)'
                      return (
                        <td key={e.id}>
                          <div style={{
                            borderRight: `3px solid ${color}`,
                            paddingRight: 8, paddingLeft: 4,
                            paddingTop: 3, paddingBottom: 3,
                            borderRadius: 4,
                            background: 'var(--bg-2)',
                            display: 'inline-block',
                            minWidth: 80, maxWidth: 130,
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.3 }}>{a.status}</div>
                            {a.task_type && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                                {a.task_type}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td><span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDateTime(c.updated_at)}</span></td>
                    <td>
                      {c.updater && (
                        <span className="user-cell">
                          <span className="avatar">{initials(c.updater.full_name)}</span>
                          {c.updater.full_name.split(' ')[0]}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            title="מחק תיק"
                            style={{ color: 'var(--status-urgent)' }}
                            onClick={() => setConfirmDeleteId(c.id)}
                          ><IcTrash size={13} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
