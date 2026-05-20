// Sidebar — right-side nav (RTL)
const Sidebar = ({ current, onNav, user, theme, onToggleTheme, onLogout }) => {
  const isOwner = user.role === 'owner';
  const isSecretary = user.role === 'secretary';

  const items = [
    { id: 'dashboard',  label: 'מסך ראשי',       icon: IcDashboard, badge: '12' },
    { id: 'my-tasks',   label: 'המשימות שלי',    icon: IcTasks,     badge: '5'  },
    { id: 'reports',    label: 'דוחות',          icon: IcReports,   show: isOwner || isSecretary },
    { id: 'users',      label: 'ניהול משתמשים',  icon: IcUsers,     show: isOwner },
  ].filter(it => it.show !== false);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="crest">א</div>
        <div>
          <div className="name">Erez Legal</div>
          <div className="tag">CASE MANAGEMENT</div>
        </div>
      </div>

      <div className="sidebar-section">ניווט</div>
      {items.map(it => {
        const I = it.icon;
        return (
          <button
            key={it.id}
            className={"nav-item" + (current === it.id ? " active" : "")}
            onClick={() => onNav(it.id)}>
            <I size={16} />
            <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </button>
        );
      })}

      <div className="sidebar-section">חשבון</div>
      <button className={"nav-item" + (current === 'settings' ? " active" : "")} onClick={() => onNav('settings')}>
        <IcSettings size={16} />
        <span>הגדרות</span>
      </button>
      <button className="nav-item" onClick={onLogout}>
        <IcLogout size={16} />
        <span>התנתקות</span>
      </button>

      <div className="sidebar-spacer" />

      <div className="sidebar-user">
        <div className="avatar">{user.initials}</div>
        <div className="who">
          <div className="name">{user.name}</div>
          <div className="role">{roleLabel(user.role)}</div>
        </div>
        <button className="icon-btn" onClick={onToggleTheme} title="החלפת מצב יום/לילה">
          {theme === 'dark' ? <IcSun size={14}/> : <IcMoon size={14}/>}
        </button>
      </div>
    </aside>
  );
};

const roleLabel = (r) => ({ owner: 'בעלים', secretary: 'מזכירה', employee: 'עו"ד / עובד' }[r] || r);

Object.assign(window, { Sidebar, roleLabel });
