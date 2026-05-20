// User management screen (admin only)
const UsersScreen = ({ data }) => {
  const { users } = data;
  const [showAdd, setShowAdd] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  return (
    <div className="page" data-screen-label="05 Users">
      <div className="page-header">
        <div>
          <div className="eyebrow">הרשאות בעלים בלבד</div>
          <h1>ניהול משתמשים</h1>
          <div className="sub">הוספה, עריכה והשבתה של משתמשים. כל עובד פעיל מקבל עמודה משלו בטבלת התיקים.</div>
        </div>
        <button className="btn primary" onClick={()=>setShowAdd(true)}><IcPlus size={14}/> משתמש חדש</button>
      </div>

      <div className="table-wrap">
        <table className="cases">
          <thead>
            <tr>
              <th style={{minWidth:240}}>שם</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>תיקים פעילים</th>
              <th>סטטוס</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} onClick={()=>setEditing(u)} style={{opacity: u.active ? 1 : 0.55}}>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <span className="avatar">{u.initials}</span>
                    <div>
                      <div className="case-name">{u.name}</div>
                      <div className="case-meta mono">{u.id.toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mono" style={{fontSize:12, color:'var(--text-muted)'}}>{u.email}</span></td>
                <td><span className={"badge-role " + u.role}>{roleLabel(u.role)}</span></td>
                <td><span className="mono" style={{fontSize:13}}>{u.cases}</span></td>
                <td>
                  <span className={"status-cell " + (u.active?'done':'pending')}>
                    <span className="dot"/>{u.active?'פעיל':'מושבת'}
                  </span>
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <div className="row-actions">
                    <button className="icon-btn" title="ערוך"><IcEdit size={13}/></button>
                    <button className="icon-btn" title="איפוס סיסמה"><IcLock size={13}/></button>
                    <button className="icon-btn" title={u.active?'השבת':'הפעל'}><IcArchive size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddUserModal onClose={()=>setShowAdd(false)} />}
      {editing && <EditUserModal user={editing} onClose={()=>setEditing(null)} />}
    </div>
  );
};

const Modal = ({ title, onClose, children, footer }) => (
  <div style={{
    position:'fixed', inset:0, background:'oklch(0.20 0.02 255 / 0.55)',
    display:'grid', placeItems:'center', zIndex:50, backdropFilter:'blur(2px)',
  }} onClick={onClose}>
    <div className="card" style={{width:460, maxWidth:'92vw'}} onClick={e=>e.stopPropagation()}>
      <div className="card-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
      <div className="card-body">{children}</div>
      {footer && <div style={{padding:'12px 18px', borderTop:'1px solid var(--line)', display:'flex', justifyContent:'flex-end', gap:8, background:'var(--bg-2)'}}>{footer}</div>}
    </div>
  </div>
);

const AddUserModal = ({ onClose }) => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('employee');

  return (
    <Modal title="משתמש חדש" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose}>ביטול</button>
        <button className="btn primary" onClick={onClose}>הוסף משתמש</button>
      </>
    }>
      <div className="field-input">
        <label>שם מלא</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="למשל: עו״ד דנה גולן" />
      </div>
      <div className="field-input">
        <label>אימייל</label>
        <input dir="ltr" style={{textAlign:'right'}} value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@erez-legal.co.il" />
      </div>
      <div className="field-input">
        <label>תפקיד</label>
        <div style={{display:'flex', gap:6}}>
          {[['owner','בעלים'],['secretary','מזכירה'],['employee','עובד']].map(([k,l]) => (
            <button key={k} className={"chip" + (role===k?' active':'')} onClick={()=>setRole(k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{fontSize:12, color:'var(--text-dim)', marginTop:8}}>
        סיסמה חד-פעמית תישלח לאימייל. המשתמש יתבקש להחליפה בכניסה הראשונה.
      </div>
    </Modal>
  );
};

const EditUserModal = ({ user, onClose }) => (
  <Modal title={`עריכת משתמש — ${user.name}`} onClose={onClose} footer={
    <>
      <button className="btn" onClick={onClose}>סגור</button>
      <button className="btn primary" onClick={onClose}>שמור שינויים</button>
    </>
  }>
    <div className="field-input">
      <label>שם תצוגה</label>
      <input defaultValue={user.name} />
    </div>
    <div className="field-input">
      <label>אימייל</label>
      <input dir="ltr" style={{textAlign:'right'}} defaultValue={user.email} />
    </div>
    <div className="field-input">
      <label>תפקיד</label>
      <div style={{display:'flex', gap:6}}>
        {[['owner','בעלים'],['secretary','מזכירה'],['employee','עובד']].map(([k,l]) => (
          <span key={k} className={"chip" + (user.role===k?' active':'')}>{l}</span>
        ))}
      </div>
    </div>
    <div style={{display:'flex', gap:8, marginTop:14}}>
      <button className="btn sm"><IcLock size={12}/> איפוס סיסמה</button>
      <button className="btn sm"><IcArchive size={12}/> {user.active?'השבת חשבון':'הפעל מחדש'}</button>
    </div>
  </Modal>
);

Object.assign(window, { UsersScreen });
