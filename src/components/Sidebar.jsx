import { IcDashboard, IcTasks, IcReports, IcUsers, IcSettings, IcLogout, IcSun, IcMoon, IcX, IcFolder } from './Icons'
import { roleLabel } from '../lib/helpers'

export default function Sidebar({ current, onNav, user, theme, onToggleTheme, onLogout, onClose }) {
  const canSeeReports = user?.role === 'owner' || user?.role === 'secretary' || user?.role === 'admin'
  const canSeeUsers   = user?.role === 'owner' || user?.role === 'admin'

  const canManageCases = user?.role === 'owner' || user?.role === 'admin'

  const items = [
    { id: 'dashboard',  label: 'מסך ראשי',      icon: IcDashboard },
    { id: 'tasks',      label: 'המשימות שלי',   icon: IcTasks     },
    { id: 'cases-mgmt', label: 'ניהול תיקים',   icon: IcFolder,   show: canManageCases },
    { id: 'reports',    label: 'דוחות',         icon: IcReports,  show: canSeeReports  },
    { id: 'users',      label: 'ניהול משתמשים', icon: IcUsers,    show: canSeeUsers    },
  ].filter(it => it.show !== false)

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="crest">א</div>
        <div style={{ flex: 1 }}>
          <div className="name">Erez Legal</div>
          <div className="tag">CASE MANAGEMENT</div>
        </div>
        <button className="icon-btn" onClick={onClose} title="סגור תפריט">
          <IcX size={14} />
        </button>
      </div>

      <div className="sidebar-section">ניווט</div>
      {items.map(({ id, label, icon: I }) => (
        <button
          key={id}
          className={'nav-item' + (current === id ? ' active' : '')}
          onClick={() => onNav(id)}
        >
          <I size={16} />
          <span>{label}</span>
        </button>
      ))}

      <div className="sidebar-section">חשבון</div>
      <button className={'nav-item' + (current === 'settings' ? ' active' : '')} onClick={() => onNav('settings')}>
        <IcSettings size={16} />
        <span>הגדרות</span>
      </button>
      <button className="nav-item" onClick={onLogout}>
        <IcLogout size={16} />
        <span>התנתקות</span>
      </button>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div className="avatar">{user?.initials || user?.full_name?.slice(0, 2) || '?'}</div>
        <div className="who">
          <div className="name">{user?.name || user?.full_name || '—'}</div>
          <div className="role">{roleLabel(user?.role)}</div>
        </div>
        <button className="icon-btn" onClick={onToggleTheme} title="החלפת מצב יום/לילה">
          {theme === 'dark' ? <IcSun size={14} /> : <IcMoon size={14} />}
        </button>
      </div>
    </aside>
  )
}
