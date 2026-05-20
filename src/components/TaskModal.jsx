import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { IcX } from './Icons'

const STATUS_OPTIONS   = ['חדש', 'בטיפול', 'בוצע', 'ממתין']
const PRIORITY_OPTIONS = ['גבוהה', 'בינונית', 'נמוכה']

export default function TaskModal({ caseItem, employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: '',
    task_type:   '',
    general_info: '',
    charges:     '',
    status:      'חדש',
    priority:    'בינונית',
    target_date: '',
    notes:       '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.employee_id) { setError('יש לבחור עובד'); return }
    setSaving(true)
    setError('')

    const { error } = await supabase.from('case_assignments').upsert({
      case_id:          caseItem.id,
      employee_id:      form.employee_id,
      task_type:        form.task_type    || null,
      general_info:     form.general_info || null,
      charges:          form.charges ? Number(form.charges) : null,
      status:           form.status,
      priority:         form.priority     || null,
      target_date:      form.target_date  || null,
      notes:            form.notes        || null,
      assigned_by_note: `הוקצה ע"י מנהל – ${new Date().toLocaleDateString('he-IL')}`,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'case_id,employee_id' })

    setSaving(false)
    if (error) { setError(error.message) } else { onSaved(); onClose() }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        <div className="card-head">
          <div>
            <h3>הוספת משימה</h3>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>תיק: {caseItem.name}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* עובד */}
          <div className="field-input">
            <label>עובד <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
            <select className="field-input-el" value={form.employee_id} onChange={e => set('employee_id', e.target.value)}>
              <option value="">בחר עובד...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          {/* שורה: סוג משימה + חיובים */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-input">
              <label>סוג משימה</label>
              <input className="field-input-el" placeholder='נדל"ן, חוזים...' value={form.task_type} onChange={e => set('task_type', e.target.value)} />
            </div>
            <div className="field-input">
              <label>חיובים (₪)</label>
              <input className="field-input-el" type="number" min="0" placeholder="0" value={form.charges} onChange={e => set('charges', e.target.value)} />
            </div>
          </div>

          {/* שורה: סטטוס + עדיפות */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-input">
              <label>סטטוס</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} type="button" className={'chip' + (form.status === s ? ' active' : '')} onClick={() => set('status', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="field-input">
              <label>עדיפות</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p} type="button" className={'chip' + (form.priority === p ? ' active' : '')} onClick={() => set('priority', p)}>{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* תאריך יעד */}
          <div className="field-input">
            <label>תאריך יעד</label>
            <input
              className="field-input-el"
              type="date"
              value={form.target_date}
              onChange={e => set('target_date', e.target.value)}
              style={{ colorScheme: 'var(--color-scheme, light)' }}
            />
          </div>

          {/* מידע כללי */}
          <div className="field-input">
            <label>מידע כללי</label>
            <textarea className="field-input-el" rows={2} placeholder="פרטים נוספים על המשימה..." value={form.general_info} onChange={e => set('general_info', e.target.value)} />
          </div>

          {/* הערות */}
          <div className="field-input">
            <label>הערות</label>
            <textarea className="field-input-el" rows={2} placeholder="הערות פנימיות..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--status-urgent)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--status-urgent)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>ביטול</button>
          <button className="btn primary" type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? 'שומר...' : 'הוסף משימה'}
          </button>
        </div>
      </div>
    </div>
  )
}
