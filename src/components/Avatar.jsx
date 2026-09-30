import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { initials as toInitials } from '../lib/helpers'

// צבעי אווטאר — ברירת מחדל נבחרת לפי hash של ה-id, המשתמש יכול לשנות בהגדרות
export const AVATAR_COLORS = [
  '#1f3a5f', '#8a5a1c', '#2e6b4f', '#7a2e3a', '#4b3f8c',
  '#1d6a78', '#9a4a1f', '#5b6b1e', '#8c2f6b', '#3d4a57',
]

export function defaultAvatarColor(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// מפת {id: {color, photo}} לכל המשתמשים — נטענת פעם אחת, כדי לא למשוך תמונות בכל join
const AvatarContext = createContext({ avatars: {}, reload: () => {} })

export function AvatarProvider({ children }) {
  const { user, profile } = useAuth()
  const [avatars, setAvatars] = useState({})

  const reload = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, preferences')
    const map = {}
    for (const p of data || []) {
      map[p.id] = { color: p.preferences?.avatarColor, photo: p.preferences?.avatarPhoto }
    }
    setAvatars(map)
  }, [])

  useEffect(() => { if (user) reload() }, [user?.id, reload])

  // המשתמש המחובר — תמיד מהפרופיל העדכני, כך ששינוי בהגדרות מוצג מיד
  const merged = profile
    ? { ...avatars, [profile.id]: { color: profile.preferences?.avatarColor, photo: profile.preferences?.avatarPhoto } }
    : avatars

  return <AvatarContext.Provider value={{ avatars: merged, reload }}>{children}</AvatarContext.Provider>
}

export const useAvatars = () => useContext(AvatarContext)

export default function Avatar({ id, name, size, className = '', style }) {
  const { avatars } = useAvatars()
  const a = (id && avatars[id]) || {}
  const bg = a.color || defaultAvatarColor(id || name || '')
  const dims = size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } : {}
  return (
    <span
      className={'avatar ' + className}
      style={{ background: bg, color: '#fff', overflow: 'hidden', ...dims, ...style }}
      title={name}
    >
      {isValidAvatarPhoto(a.photo)
        ? <img src={a.photo} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : (toInitials(name || '') || '?')}
    </span>
  )
}

// בדיקות תמונה — הקובץ תמיד מצויר מחדש ל-JPEG, כך שהבייטים המקוריים לא נשמרים לעולם
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_STORED_LENGTH = 100_000 // 160×160 JPEG יוצא ~10-20KB, זה מרווח ביטחון

export function validateAvatarFile(file) {
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) return 'ניתן להעלות רק תמונות JPG, PNG, WEBP או GIF'
  if (file.size > MAX_UPLOAD_BYTES) return 'הקובץ גדול מדי (מקסימום 10MB)'
  return null
}

// מוצג רק ערך שנוצר ע"י resizeImageToDataUrl — הגנה מפני ערך שנכתב ישירות ל-DB
export function isValidAvatarPhoto(v) {
  return typeof v === 'string' && v.startsWith('data:image/jpeg;base64,') && v.length <= MAX_STORED_LENGTH
}

// מקטין ומחתך לריבוע, מחזיר data URL קטן (~10KB) לשמירה ב-preferences
export function resizeImageToDataUrl(file, px = 160) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      if (!img.width || !img.height) { URL.revokeObjectURL(url); reject(new Error('קובץ התמונה אינו תקין')); return }
      const s = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, px, px)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('קובץ התמונה אינו תקין')) }
    img.src = url
  })
}
