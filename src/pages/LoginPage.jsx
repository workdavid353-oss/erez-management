import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [forgot, setForgot]     = useState(false)

  const isSuccess = error.startsWith('✓')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (forgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (err) throw err
        setError('✓ נשלח קישור לאיפוס סיסמה — בדוק את תיבת הדואר')
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-pane">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="crest">א</div>
          <h1>Erez Legal</h1>
          <div className="lead">
            {forgot ? 'הזן את האימייל שלך לאיפוס הסיסמה.' : 'מערכת ניהול תיקים — היכנס כדי להמשיך.'}
          </div>

          <div className="field-input">
            <label htmlFor="lg-email">אימייל</label>
            <input
              id="lg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              dir="ltr"
              style={{ textAlign: 'right' }}
              placeholder="user@erez-legal.co.il"
            />
          </div>

          {!forgot && (
            <div className="field-input">
              <label htmlFor="lg-pass">סיסמה</label>
              <input
                id="lg-pass"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="לפחות 8 תווים"
              />
            </div>
          )}

          {error && (
            <div className={isSuccess ? 'success-msg' : 'error-msg'}>{error}</div>
          )}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'טוען...' : forgot ? 'שלח קישור לאיפוס' : 'כניסה למערכת'}
          </button>

          <span
            className="forgot"
            onClick={() => { setForgot(!forgot); setError('') }}
          >
            {forgot ? 'חזרה לכניסה' : 'שכחתי סיסמה'}
          </span>
        </form>
      </div>

      <div className="login-art">
        <div className="columns">
          <div className="col" style={{ height: '70vh' }} />
          <div className="col" style={{ height: '60vh' }} />
          <div className="col" style={{ height: '78vh' }} />
          <div className="col" style={{ height: '52vh' }} />
          <div className="col" style={{ height: '66vh' }} />
        </div>
        <div className="quote">
          <div className="mark">״</div>
          <div className="text">המשפט הוא הסדר, והסדר הוא הצדק.</div>
          <div className="attr">EDMUND BURKE</div>
        </div>
      </div>
    </div>
  )
}
