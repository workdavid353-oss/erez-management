import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { IcX } from './Icons'

export default function FeedbackModal({ user, onClose }) {
  const [type,        setType]        = useState('bug')
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit() {
    if (!title.trim()) { setError('יש להזין כותרת'); return }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('feedback').insert({
      user_id:     user?.id          || null,
      user_name:   user?.full_name   || null,
      type,
      title:       title.trim(),
      description: description.trim() || null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }

    // send email notification (fire and forget)
    fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:      'sendFeedbackEmail',
        type,
        title:       title.trim(),
        description: description.trim() || null,
        userName:    user?.full_name || null,
      }),
    }).catch(() => {})

    setDone(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box card" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <div>
            <h3>{type === 'bug' ? '🐛 דיווח על באג' : '✨ בקשת פיצ\'ר'}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>שלח לנו משוב ונחזור אליך</div>
          </div>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>

        {done ? (
          <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>תודה! הפנייה נשלחה בהצלחה</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>נבדוק את הפנייה ונעדכן בהקדם.</div>
            <button className="btn primary" style={{ marginTop: 20 }} onClick={onClose}>סגור</button>
          </div>
        ) : (
          <>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* סוג */}
              <div className="field-input">
                <label>סוג פנייה</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className={'chip' + (type === 'bug' ? ' active' : '')}
                    onClick={() => setType('bug')}
                  >🐛 דיווח על באג</button>
                  <button
                    type="button"
                    className={'chip' + (type === 'feature' ? ' active' : '')}
                    onClick={() => setType('feature')}
                  >✨ בקשת פיצ'ר</button>
                </div>
              </div>

              {/* כותרת */}
              <div className="field-input">
                <label>כותרת <span style={{ color: 'var(--status-urgent)' }}>*</span></label>
                <input
                  className="field-input-el"
                  placeholder={type === 'bug' ? 'תאר בקצרה את הבעיה...' : 'תאר בקצרה מה תרצה להוסיף...'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              {/* תיאור */}
              <div className="field-input">
                <label>תיאור מפורט</label>
                <textarea
                  className="field-input-el"
                  rows={4}
                  placeholder={type === 'bug'
                    ? 'מה עשית? מה קרה? מה ציפית שיקרה?'
                    : 'למה הפיצ\'ר יועיל? איך תרצה שיפעל?'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ fontSize: 13, color: 'var(--status-urgent)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--status-urgent)' }}>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={onClose}>ביטול</button>
              <button className="btn primary" onClick={handleSubmit} disabled={saving || !title.trim()}>
                {saving ? 'שולח...' : 'שלח פנייה'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
