import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('הקישור פג תוקף או אינו תקין. בקש קישור חדש.')
        } else {
          setReady(true)
        }
      })
    } else {
      // fallback לטוקן ישן בסגנון hash
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">איפוס סיסמה</h1>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-lg font-medium mb-2">הסיסמה עודכנה בהצלחה!</div>
            <p className="text-gray-500 text-sm">מועבר לדף הכניסה...</p>
          </div>
        ) : !ready ? (
          <div className="text-center py-4">
            {error
              ? <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              : <p className="text-gray-400 text-sm">מאמת קישור...</p>
            }
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לפחות 8 תווים"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="הכנס שוב את הסיסמה"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'מעדכן...' : 'עדכן סיסמה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
