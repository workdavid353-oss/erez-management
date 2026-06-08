export const roleLabel = (r) =>
  ({ owner: 'בעלים', admin: 'מנהל', employee: 'עו"ד / עובד', member: 'עובד' }[r] || r)

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('')

export const STATUS_LABEL = {
  done: 'הושלם', progress: 'בטיפול', urgent: 'דחוף',
  pending: 'ממתין', blocked: 'תקוע',
}

export const PRIORITY_LABEL = { high: 'גבוהה', med: 'בינונית', low: 'נמוכה' }

// מיפוי סטטוס עברי → מפתח CSS
export const STATUS_ORDER = {
  'דחוף':   0,
  'חדש':    1,
  'בטיפול': 2,
  'ממתין':  3,
  'בוצע':   4,
  'סגור':   5,
}

export const STATUS_CLASS = {
  'חדש':    'pending',
  'בטיפול': 'progress',
  'בוצע':   'done',
  'הושלם':  'done',
  'ממתין':  'pending',
  'סגור':   'done',
  'דחוף':   'urgent',
  'תקוע':   'blocked',
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const fmtDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
