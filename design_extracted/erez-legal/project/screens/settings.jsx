// Personal settings
const Settings = ({ user, theme, onTheme }) => {
  const [section, setSection] = React.useState('profile');
  const [displayName, setDisplayName] = React.useState(user.name);

  return (
    <div className="page" data-screen-label="06 Settings">
      <div className="page-header">
        <div>
          <div className="eyebrow">חשבון אישי</div>
          <h1>הגדרות</h1>
          <div className="sub">העדפות התצוגה והפרופיל שלך. ההגדרות נשמרות אוטומטית.</div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-nav">
          {[
            ['profile','פרופיל'],
            ['security','אבטחה וסיסמה'],
            ['appearance','תצוגה — יום/לילה'],
            ['notifications','התראות'],
          ].map(([k,l]) => (
            <button key={k} className={section===k?'active':''} onClick={()=>setSection(k)}>{l}</button>
          ))}
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:18}}>
          {section === 'profile' && (
            <div className="card">
              <div className="card-head"><h3>פרופיל</h3></div>
              <div className="card-body">
                <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:22}}>
                  <div className="avatar" style={{width:64, height:64, fontSize:22, borderRadius:8}}>{user.initials}</div>
                  <div>
                    <div style={{fontFamily:'Frank Ruhl Libre, serif', fontWeight:700, fontSize:20}}>{user.name}</div>
                    <div style={{fontSize:13, color:'var(--text-muted)'}}>{roleLabel(user.role)} · {user.email}</div>
                  </div>
                </div>
                <div className="field-input">
                  <label>שם תצוגה</label>
                  <input value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                </div>
                <div className="field-input">
                  <label>אימייל</label>
                  <input value={user.email} dir="ltr" style={{textAlign:'right'}} disabled />
                </div>
                <button className="btn primary" style={{marginTop:8}}>שמור שינויים</button>
              </div>
            </div>
          )}

          {section === 'security' && (
            <div className="card">
              <div className="card-head"><h3>אבטחה וסיסמה</h3></div>
              <div className="card-body">
                <div className="field-input">
                  <label>סיסמה נוכחית</label>
                  <input type="password" placeholder="••••••••" />
                </div>
                <div className="field-input">
                  <label>סיסמה חדשה</label>
                  <input type="password" placeholder="לפחות 8 תווים" />
                </div>
                <div className="field-input">
                  <label>אישור סיסמה</label>
                  <input type="password" />
                </div>
                <button className="btn primary" style={{marginTop:8}}>עדכן סיסמה</button>

                <div style={{marginTop:24, padding:14, background:'var(--bg-2)', borderRadius:6, fontSize:12, color:'var(--text-muted)'}}>
                  <strong style={{color:'var(--text)'}}>אימות דו-שלבי</strong><br/>
                  לא מופעל כרגע. מומלץ להפעיל לחשבונות בעלי הרשאת בעלים. <a href="#" onClick={e=>e.preventDefault()} style={{color:'var(--brass)'}}>הפעלה</a>
                </div>
              </div>
            </div>
          )}

          {section === 'appearance' && (
            <div className="card">
              <div className="card-head"><h3>מצב תצוגה</h3></div>
              <div className="card-body">
                <div style={{fontSize:13, color:'var(--text-muted)', marginBottom:8}}>
                  בחר את מצב התצוגה המועדף. הבחירה נשמרת לפי משתמש ותחול בכל מכשיר.
                </div>
                <div className="theme-picker">
                  <button className={"theme-card day" + (theme==='light'?' selected':'')} onClick={()=>onTheme('light')}>
                    <div className="preview"/>
                    <div className="title">יום</div>
                    <div className="desc">נייר חם — לעבודה רגילה במשרד</div>
                  </button>
                  <button className={"theme-card night" + (theme==='dark'?' selected':'')} onClick={()=>onTheme('dark')}>
                    <div className="preview"/>
                    <div className="title">לילה</div>
                    <div className="desc">דיו עמוק — לעבודה בערב ובשעות מאוחרות</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'notifications' && (
            <div className="card">
              <div className="card-head"><h3>התראות</h3></div>
              <div className="card-body">
                {[
                  ['משימות שעבר תאריך היעד שלהן', true],
                  ['עדכון בתיק שאני משויך אליו',     true],
                  ['תיק חדש נפתח במשרד',           false],
                  ['דוח שבועי לבעלים',              true],
                ].map(([label, on], i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--line)'}}>
                    <div style={{fontSize:14}}>{label}</div>
                    <Toggle on={on} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ on: initial }) => {
  const [on, setOn] = React.useState(initial);
  return (
    <button onClick={()=>setOn(!on)} style={{
      width:38, height:22, borderRadius:11, border:'none', cursor:'pointer',
      background: on ? 'var(--ink)' : 'var(--bg-3)',
      position:'relative', transition:'background 0.15s',
    }}>
      <span style={{
        position:'absolute', top:2, [on?'left':'right']: 2,
        width:18, height:18, borderRadius:'50%',
        background: on ? 'var(--brass)' : 'var(--surface)',
        boxShadow:'0 1px 2px rgba(0,0,0,0.2)', transition:'all 0.15s',
      }}/>
    </button>
  );
};

Object.assign(window, { Settings });
