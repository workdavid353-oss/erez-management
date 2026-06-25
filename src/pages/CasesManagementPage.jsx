import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STATUS_CLASS, fmtDateTime, fmtDate } from '../lib/helpers'
import { IcPlus, IcEdit, IcX, IcTrash, IcSearch, IcTable, IcGrid } from '../components/Icons'

const CATEGORIES    = ['אזרחי', 'פלילי', 'מסחרי', 'משפחה', 'נדל"ן', 'עבודה']
const STATUS_OPTIONS = ['חדש', 'בטיפול', 'דחוף', 'ממתין', 'הושלם', 'סגור']

const fmtILS = (v) => v != null && v !== '' ? Number(v).toLocaleString('he-IL') + ' ₪' : '—'
const fmtH  = (v) => v != null && v !== '' ? Number(v).toLocaleString('he-IL') + ' שע׳' : '—'

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>מחיקת תיק</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" style={{ background: 'var(--status-urgent)', borderColor: 'var(--status-urgent)' }} onClick={onConfirm}>
            מחק תיק
          </button>
        </div>
      </div>
    </div>
  )
}

function CaseModal({ caseData, employees, userId, onClose, onSaved }) {
  const isEdit = !!caseData
  const [form, setForm] = useState(isEdit ? { ...caseData } : {
    name: '', court_case_number: '', category: '', status: 'חדש',
    subject: '', assigned_employee_id: '',
    initial_price: '', total_case_value: '', work_hours: '',
    client_offer: '', total_used: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name?.trim()) return
    setSaving(true)
    const payload = {
      name:                 form.name?.trim(),
      court_case_number:    form.court_case_number   || null,
      category:             form.category            || null,
      status:               form.status              || 'חדש',
      subject:              form.subject             || null,
      assigned_employee_id: form.assigned_employee_id || null,
      initial_price:        form.initial_price !== '' ? Number(form.initial_price)    : null,
      total_case_value:     form.total_case_value !== '' ? Number(form.total_case_value) : null,
      work_hours:           form.work_hours !== '' ? Number(form.work_hours)          : null,
      client_offer:         form.client_offer !== '' ? Number(form.client_offer)      : null,
      total_used:           form.total_used !== '' ? Number(form.total_used)          : null,
      notes:                form.notes               || null,
      updated_by:           userId,
    }
    let error
    if (isEdit) {
      ;({ error } = await supabase.from('cases').update(payload).eq('id', caseData.id))
    } else {
      ;({ error } = await supabase.from('cases').insert(payload))
    }
    setSaving(false)
    if (!error) { onSaved(); onClose() }
  }

  const numField = (k, label, placeholder = '') => (
    <div className="field">
      <span className="label">{label}</span>
      <input
        className="field-input-el"
        type="number"
        min="0"
        placeholder={placeholder}
        value={form[k] ?? ''}
        onChange={e => set(k, e.target.value)}
      />
    </div>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{isEdit ? `עריכת תיק — ${caseData.name}` : 'תיק חדש'}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body">
          <div className="field-grid">
            {/* שורה 1 */}
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">שם תיק *</span>
              <input className="field-input-el" placeholder="לדוגמה: לוי נ. כהן" value={form.name || ''} onChange={e => set('name', e.target.value)} />
            </div>
            {/* שורה 2 */}
            <div className="field">
              <span className="label">מס׳ תיק בבית משפט</span>
              <input className="field-input-el" placeholder="1234/2026" value={form.court_case_number || ''} onChange={e => set('court_case_number', e.target.value)} />
            </div>
            <div className="field">
              <span className="label">קטגוריה</span>
              <select className="field-input-el" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                <option value="">— בחר —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* שורה 3 */}
            <div className="field">
              <span className="label">סטטוס</span>
              <select className="field-input-el" value={form.status || 'חדש'} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">עובד מוקצה</span>
              <select className="field-input-el" value={form.assigned_employee_id || ''} onChange={e => set('assigned_employee_id', e.target.value)}>
                <option value="">— ללא —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            {/* שורה 4 */}
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">נושא תיק</span>
              <input className="field-input-el" value={form.subject || ''} onChange={e => set('subject', e.target.value)} />
            </div>
            {/* שורה 5 — שדות כספיים */}
            {numField('initial_price',    'הצעת מחיר ראשונית (₪)', '0')}
            {numField('total_case_value', 'שווי תיק כולל (₪)',     '0')}
            {numField('client_offer',     'הצעת לקוח (₪)',         '0')}
            {numField('total_used',       'סה"כ נוצל (₪)',         '0')}
            {numField('work_hours',       'זמן עבודה (שע׳)',        '0')}
            {/* שורה 6 */}
            <div className="field" style={{ gridColumn: '1/-1' }}>
              <span className="label">הערות</span>
              <textarea className="field-input-el" rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" onClick={handleSave} disabled={saving || !form.name?.trim()}>
            {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'צור תיק'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CasesManagementPage({ onOpenCase }) {
  const { user, profile, updatePreference } = useAuth()
  const [cases,     setCases]     = useState([])
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [q,         setQ]         = useState('')
  const [editing,   setEditing]   = useState(null)
  const [creating,  setCreating]  = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [view,      setView]      = useState(() => localStorage.getItem('cases-view') || 'table')

  // סנכרון תצוגה מה-DB כשהפרופיל נטען
  useEffect(() => {
    if (profile?.preferences?.casesView) {
      setView(profile.preferences.casesView)
    }
  }, [profile?.id])

  const switchView = (v) => {
    setView(v)
    localStorage.setItem('cases-view', v)
    updatePreference('casesView', v)
  }

  async function load() {
    const [casesRes, empRes] = await Promise.all([
      supabase.from('cases')
        .select('*, assigned_employee:assigned_employee_id(id, full_name), updater:updated_by(id, full_name)')
        .order('serial_number'),
      supabase.from('profiles').select('id, full_name').in('role', ['employee', 'admin', 'sysadmin', 'owner']).order('full_name'),
    ])
    setCases(casesRes.data || [])
    setEmployees(empRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    await supabase.from('cases').delete().eq('id', id)
    setCases(prev => prev.filter(c => c.id !== id))
    setConfirmId(null)
  }

  const filtered = cases.filter(c => {
    if (!q.trim()) return true
    const s = q.toLowerCase()
    return (
      c.name?.toLowerCase().includes(s) ||
      c.subject?.toLowerCase().includes(s) ||
      c.court_case_number?.toLowerCase().includes(s) ||
      c.assigned_employee?.full_name?.toLowerCase().includes(s)
    )
  })

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען תיקים...</div>

  return (
    <div className="page">
      {creating && (
        <CaseModal employees={employees} userId={user?.id} onClose={() => setCreating(false)} onSaved={load} />
      )}
      {editing && (
        <CaseModal caseData={editing} employees={employees} userId={user?.id} onClose={() => setEditing(null)} onSaved={load} />
      )}
      {confirmId && (
        <ConfirmModal
          message={`האם למחוק את התיק "${cases.find(c => c.id === confirmId)?.name}"? פעולה זו תמחק גם את כל המשימות ואינה ניתנת לביטול.`}
          onConfirm={() => handleDelete(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}

      <div className="page-header">
        <div>
          <div className="eyebrow">מנהלים ובעלים בלבד</div>
          <h1>ניהול תיקים</h1>
          <div className="sub">כל התיקים עם פרטים פיננסיים מלאים — {cases.length} תיקים במערכת</div>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <IcPlus size={14} /> תיק חדש
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <input placeholder={"חיפוש לפי שם, נושא, מספר ביהמ\"ש, עובד…"} value={q} onChange={e => setQ(e.target.value)} />
          <IcSearch className="search-icon" size={15} />
        </div>
        <span style={{ color: 'var(--text-dim)', fontSize: 12, marginRight: 'auto' }}>
          מציג <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> מתוך {cases.length}
        </span>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-2)', borderRadius: 6, padding: 2 }}>
          <button
            className={'icon-btn' + (view === 'table' ? ' active' : '')}
            title="תצוגת טבלה"
            onClick={() => switchView('table')}
            style={view === 'table' ? { background: 'var(--bg)', borderRadius: 4 } : {}}
          ><IcTable size={15} /></button>
          <button
            className={'icon-btn' + (view === 'cards' ? ' active' : '')}
            title="תצוגת כרטיסים"
            onClick={() => switchView('cards')}
            style={view === 'cards' ? { background: 'var(--bg)', borderRadius: 4 } : {}}
          ><IcGrid size={15} /></button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="cases">
              <thead>
                <tr>
                  <th style={{ minWidth: 50 }}>מס׳</th>
                  <th style={{ minWidth: 110 }}>מס׳ ביהמ"ש</th>
                  <th style={{ minWidth: 200 }}>שם תיק</th>
                  <th style={{ minWidth: 160 }}>נושא</th>
                  <th style={{ minWidth: 120 }}>עובד מוקצה</th>
                  <th style={{ minWidth: 80 }}>סטטוס</th>
                  <th style={{ minWidth: 130 }}>הצעה ראשונית</th>
                  <th style={{ minWidth: 130 }}>שווי תיק</th>
                  <th style={{ minWidth: 100 }}>זמן עבודה</th>
                  <th style={{ minWidth: 130 }}>הצעת לקוח</th>
                  <th style={{ minWidth: 120 }}>סה"כ נוצל</th>
                  <th style={{ minWidth: 130 }}>עודכן</th>
                  <th style={{ minWidth: 160 }}>הערות</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>לא נמצאו תיקים</td>
                  </tr>
                ) : filtered.map(c => {
                  const cls = STATUS_CLASS[c.status] || 'pending'
                  return (
                    <tr key={c.id} onClick={() => onOpenCase?.(c.id)} className={c.status === 'דחוף' ? 'urgent-row' : ''} style={{ cursor: 'pointer' }}>
                      <td><span className="mono" style={{ fontSize: 12 }}>{c.serial_number}</span></td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{c.court_case_number || '—'}</span></td>
                      <td><div className="case-name">{c.name}</div></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 180 }}>{c.subject || '—'}</td>
                      <td style={{ fontSize: 13 }}>{c.assigned_employee?.full_name || '—'}</td>
                      <td><span className={'status-cell ' + cls}><span className="dot" />{c.status}</span></td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmtILS(c.initial_price)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmtILS(c.total_case_value)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmtH(c.work_hours)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmtILS(c.client_offer)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmtILS(c.total_used)}</td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(c.updated_at)}</span></td>
                      <td style={{ color: 'var(--text-dim)', fontSize: 12, maxWidth: 180 }}>{c.notes || '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="row-actions">
                          <button className="icon-btn" title="ערוך" onClick={() => setEditing(c)}><IcEdit size={13} /></button>
                          <button className="icon-btn" title="מחק" style={{ color: 'var(--status-urgent)' }} onClick={() => setConfirmId(c.id)}><IcTrash size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-dim)' }}>לא נמצאו תיקים</div>
          ) : filtered.map(c => {
            const cls = STATUS_CLASS[c.status] || 'pending'
            return (
              <div
                key={c.id}
                className="card"
                onClick={() => onOpenCase?.(c.id)}
                style={{ cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column' }}
              >
                <div className="card-head" style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>#{c.serial_number}</span>
                      {c.court_case_number && <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>· {c.court_case_number}</span>}
                    </div>
                    <div className="case-name" style={{ fontSize: 14 }}>{c.name}</div>
                  </div>
                  <span className={'status-cell ' + cls} style={{ flexShrink: 0 }}><span className="dot" />{c.status}</span>
                </div>

                <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, fontSize: 12 }}>
                  {c.subject && (
                    <div style={{ color: 'var(--text-muted)' }}>{c.subject}</div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                    {c.assigned_employee?.full_name && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: 'var(--text-dim)' }}>עובד מוקצה: </span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.assigned_employee.full_name}</span>
                      </div>
                    )}
                    {c.category && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: 'var(--text-dim)' }}>קטגוריה: </span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.category}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>הצעה ראשונית</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{fmtILS(c.initial_price)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>שווי תיק כולל</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{fmtILS(c.total_case_value)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>הצעת לקוח</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{fmtILS(c.client_offer)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>סה"כ נוצל</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{fmtILS(c.total_used)}</div>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>זמן עבודה</div>
                      <div className="mono" style={{ color: 'var(--text-muted)' }}>{fmtH(c.work_hours)}</div>
                    </div>
                  </div>

                  {c.notes && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <div style={{ color: 'var(--text-dim)', marginBottom: 2 }}>הערות</div>
                      <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{c.notes}</div>
                    </div>
                  )}
                </div>

                <div
                  className="modal-footer"
                  style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>עודכן: {fmtDateTime(c.updated_at)}</div>
                    {c.updater?.full_name && (
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>על ידי: {c.updater.full_name}</div>
                    )}
                  </div>
                  <button className="icon-btn" title="ערוך" onClick={() => setEditing(c)}><IcEdit size={13} /></button>
                  <button className="icon-btn" title="מחק" style={{ color: 'var(--status-urgent)' }} onClick={() => setConfirmId(c.id)}><IcTrash size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
