import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { roleLabel, initials } from '../lib/helpers'
import { IcPlus, IcEdit, IcX, IcTrash } from '../components/Icons'

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-box" onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="card-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><IcX size={14} /></button>
        </div>
        <div className="card-body" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>ביטול</button>
          <button className="btn primary" style={{ background: 'var(--status-urgent)', borderColor: 'var(--status-urgent)' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateUserModal({ onClose, onSaved, isOwner }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', role: 'employee' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('יש למלא שם, אימייל וסיסמה')
      return
    }
    if (form.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    if (form.password !== form.confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    setSaving(true)
    setError('')

    const res = await fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: form.role,
      }),
    })
    const result = await res.json()
    if (result.error) {
      setSaving(false)
      setError(result.error === 'User already registered' ? 'האימייל כבר קיים במערכת' : result.error)
      return
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal title="משתמש חדש" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>ביטול</button>
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'יוצר...' : 'צור משתמש'}
        </button>
      </>
    }>
      <div className="field-input">
        <label>שם מלא *</label>
        <input placeholder="ישראל ישראלי" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
      </div>
      <div className="field-input" style={{ marginTop: 12 }}>
        <label>אימייל *</label>
        <input type="email" placeholder="user@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
      <div className="field-input" style={{ marginTop: 12 }}>
        <label>סיסמה ראשונית *</label>
        <input type="password" placeholder="לפחות 6 תווים" value={form.password} onChange={e => set('password', e.target.value)} />
      </div>
      <div className="field-input" style={{ marginTop: 12 }}>
        <label>אימות סיסמה *</label>
        <input
          type="password"
          placeholder="הזן סיסמה שנית"
          value={form.confirm}
          onChange={e => set('confirm', e.target.value)}
          style={form.confirm && form.confirm !== form.password ? { borderColor: 'var(--status-urgent)' } : {}}
        />
        {form.confirm && form.confirm !== form.password && (
          <div style={{ fontSize: 12, color: 'var(--status-urgent)', marginTop: 4 }}>הסיסמאות אינן תואמות</div>
        )}
      </div>
      <div className="field-input" style={{ marginTop: 12 }}>
        <label>תפקיד</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[['employee', 'עובד'], ['admin', 'מנהל'], ...(isOwner ? [['owner', 'בעלים']] : [])].map(([k, l]) => (
            <button key={k} className={'chip' + (form.role === k ? ' active' : '')} onClick={() => set('role', k)}>{l}</button>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--status-urgent)', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--status-urgent)' }}>
          {error}
        </div>
      )}
    </Modal>
  )
}

function EditUserModal({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role)
  const [name, setName] = useState(user.full_name)

  async function handleSave() {
    await supabase.from('profiles').update({ full_name: name, role }).eq('id', user.id)
    onSaved()
    onClose()
  }

  return (
    <Modal title={`עריכת משתמש — ${user.full_name}`} onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>סגור</button>
        <button className="btn primary" onClick={handleSave}>שמור שינויים</button>
      </>
    }>
      <div className="field-input">
        <label>שם מלא</label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="field-input" style={{ marginTop: 12 }}>
        <label>תפקיד</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {[['employee', 'עובד'], ['admin', 'מנהל'], ['owner', 'בעלים']].map(([k, l]) => (
            <button key={k} className={'chip' + (role === k ? ' active' : '')} onClick={() => setRole(k)}>{l}</button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default function UsersPage() {
  const { user: currentUser, isOwner } = useAuth()
  const [users,           setUsers]           = useState([])
  const [counts,          setCounts]          = useState({})
  const [loading,         setLoading]         = useState(true)
  const [editing,         setEditing]         = useState(null)
  const [creating,        setCreating]        = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function load() {
    const [profilesRes, assignRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('case_assignments').select('employee_id, status'),
    ])
    setUsers(profilesRes.data || [])
    const cnt = {}
    ;(assignRes.data || []).forEach(a => {
      if (a.status !== 'בוצע' && a.status !== 'סגור')
        cnt[a.employee_id] = (cnt[a.employee_id] || 0) + 1
    })
    setCounts(cnt)
    setLoading(false)
  }

  async function handleDelete(userId) {
    await fetch('/api/admin-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', userId }),
    })
    setUsers(prev => prev.filter(u => u.id !== userId))
    setConfirmDeleteId(null)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="app-loading" style={{ minHeight: 'unset', padding: 60 }}>טוען משתמשים...</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">הרשאות מנהל בלבד</div>
          <h1>ניהול משתמשים</h1>
          <div className="sub">{users.length} משתמשים רשומים במערכת</div>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <IcPlus size={14} /> משתמש חדש
        </button>
      </div>

      <div className="table-wrap">
        <table className="cases">
          <thead>
            <tr>
              <th style={{ minWidth: 240 }}>שם</th>
              <th>תפקיד</th>
              <th>משימות פתוחות</th>
              <th>נוצר</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="avatar">{initials(u.full_name)}</span>
                    <div>
                      <div className="case-name">{u.full_name}</div>
                      <div className="case-meta mono">{u.id.slice(0, 8)}…</div>
                    </div>
                  </div>
                </td>
                <td><span className={'badge-role ' + u.role}>{roleLabel(u.role)}</span></td>
                <td><span className="mono" style={{ fontSize: 13 }}>{counts[u.id] || 0}</span></td>
                <td><span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('he-IL')}
                </span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="icon-btn" title="ערוך" onClick={() => setEditing(u)}><IcEdit size={13} /></button>
                    {isOwner && u.id !== currentUser?.id && (
                      <button className="icon-btn" title="מחק משתמש" style={{ color: 'var(--status-urgent)' }} onClick={() => setConfirmDeleteId(u.id)}>
                        <IcTrash size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && <CreateUserModal onClose={() => setCreating(false)} onSaved={load} isOwner={isOwner} />}
      {editing  && <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {confirmDeleteId && (
        <ConfirmModal
          title="מחיקת משתמש"
          message={`האם למחוק את המשתמש "${users.find(u => u.id === confirmDeleteId)?.full_name}"? פעולה זו תמחק גם את כל המשימות שלו ואינה ניתנת לביטול.`}
          confirmLabel="מחק משתמש"
          onConfirm={() => handleDelete(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
