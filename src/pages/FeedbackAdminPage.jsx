import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDateTime } from '../lib/helpers'
import { IcMail } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

const TYPE_LABEL   = { bug: '🐛 באג', feature: '✨ פיצ\'ר' }
const STATUS_OPTIONS = ['חדש', 'בטיפול', 'נפתר', 'נדחה']
const STATUS_COLOR = {
  'חדש':    'pending',
  'בטיפול': 'progress',
  'נפתר':   'done',
  'נדחה':   'blocked',
}

export default function FeedbackAdminPage() {
  const { profile } = useAuth()
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [statFilter,  setStatFilter]  = useState('all')
  const [expanded,    setExpanded]    = useState(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved,  setEmailSaved]  = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('feedback').select('*').order('created_at', { ascending: false }),
      supabase.from('app_settings').select('value').eq('key', 'feedback_email').single(),
    ]).then(([fbRes, settingRes]) => {
      setItems(fbRes.data || [])
      setNotifyEmail(settingRes.data?.value || '')
      setLoading(false)
    })
  }, [])

  async function saveEmail() {
    setEmailSaving(true)
    await supabase.from('app_settings').upsert({ key: 'feedback_email', value: notifyEmail.trim() })
    setEmailSaving(false)
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2500)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id)
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const filtered = items.filter(i => {
    if (typeFilter !== 'all' && i.type !== typeFilter) return false
    if (statFilter !== 'all' && i.status !== statFilter) return false
    return true
  })

  const countBug     = items.filter(i => i.type === 'bug'     && i.status === 'חדש').length
  const countFeature = items.filter(i => i.type === 'feature' && i.status === 'חדש').length

  if (profile?.role !== 'admin') return (
    <div className="page">
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>אין לך הרשאה לצפות בדף זה.</div>
    </div>
  )

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען פניות...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">מנהלים ובעלים בלבד</div>
          <h1>פניות משתמשים</h1>
          <div className="sub">באגים ובקשות פיצ'רים שנשלחו על ידי המשתמשים</div>
        </div>
      </div>

      {/* הגדרת מייל התראות */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcMail size={15} />
            <h3>מייל התראות</h3>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 480 }}>
            <input
              className="field-input-el"
              type="email"
              placeholder="admin@example.com"
              value={notifyEmail}
              onChange={e => { setNotifyEmail(e.target.value); setEmailSaved(false) }}
              style={{ flex: 1 }}
              dir="ltr"
            />
            <button className="btn primary" onClick={saveEmail} disabled={emailSaving} style={{ flexShrink: 0 }}>
              {emailSaving ? 'שומר...' : emailSaved ? '✓ נשמר' : 'שמור'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
            כתובת זו תקבל התראה בכל פנייה חדשה. השאר ריק כדי לבטל שליחת מיילים.
          </div>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'באגים חדשים',    value: countBug,     color: 'var(--status-urgent)'   },
          { label: 'פיצ\'רים חדשים', value: countFeature, color: 'var(--brass)'            },
          { label: 'סה"כ פניות',     value: items.length, color: 'var(--text-muted)'       },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* פילטרים */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>סוג:</span>
          {[['all', 'הכל'], ['bug', '🐛 באג'], ['feature', "✨ פיצ'ר"]].map(([k, l]) => (
            <button key={k} className={'chip' + (typeFilter === k ? ' active' : '')} onClick={() => setTypeFilter(k)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginRight: 'auto' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 4 }}>סטטוס:</span>
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} className={'chip' + (statFilter === s ? ' active' : '')} onClick={() => setStatFilter(s)}>
              {s === 'all' ? 'הכל' : s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="table-wrap" style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          אין פניות להצגה
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="cases">
              <thead>
                <tr>
                  <th style={{ minWidth: 80 }}>סוג</th>
                  <th style={{ minWidth: 260 }}>כותרת</th>
                  <th style={{ minWidth: 130 }}>מאת</th>
                  <th style={{ minWidth: 130 }}>תאריך</th>
                  <th style={{ minWidth: 120 }}>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <>
                    <tr
                      key={item.id}
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span style={{ fontSize: 12 }}>{TYPE_LABEL[item.type] || item.type}</span>
                      </td>
                      <td>
                        <div className="case-name">{item.title}</div>
                        {item.description && (
                          <div className="case-meta" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.user_name || '—'}</td>
                      <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(item.created_at)}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className="field-input-el"
                          style={{ fontSize: 12, padding: '3px 8px' }}
                          value={item.status}
                          onChange={e => updateStatus(item.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>

                    {expanded === item.id && item.description && (
                      <tr key={item.id + '-expanded'}>
                        <td colSpan={5} style={{ padding: '12px 20px', background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>תיאור מפורט:</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {item.description}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
