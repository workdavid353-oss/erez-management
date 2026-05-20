// Case detail page
const CaseDetail = ({ data, caseId, onBack }) => {
  const { cases, users, timeline } = data;
  const c = cases.find(x => x.id === caseId) || cases[0];
  const userById = (id) => users.find(u => u.id === id);

  const assignedUsers = Object.keys(c.tasks).map(userById).filter(Boolean);
  const [activeTab, setActiveTab] = React.useState(assignedUsers[0]?.id);

  const statusLabel = { done:'הושלם', progress:'בטיפול', urgent:'דחוף', pending:'ממתין', blocked:'תקוע' };

  return (
    <div className="page" data-screen-label="02 Case Detail">
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12, fontSize:13, color:'var(--text-muted)'}}>
        <button className="btn ghost sm" onClick={onBack}><IcChevron size={13}/> חזרה ללוח הבקרה</button>
        <span style={{color:'var(--text-dim)'}}>/</span>
        <span>תיק <span className="mono">{c.id}</span></span>
      </div>

      <div className="page-header">
        <div>
          <div className="eyebrow">{c.category} · נפתח {c.opened}</div>
          <h1>{c.name}</h1>
          <div className="sub">{c.subject}</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className={"status-cell " + (c.priority==='high'?'urgent':c.status==='הושלם'?'done':'progress')}>
            <span className="dot"/>{c.status}
          </span>
          <button className="btn"><IcEdit size={14}/> ערוך פרטים</button>
          <button className="btn"><IcMore size={14}/></button>
        </div>
      </div>

      <div className="detail-grid">
        <div style={{display:'flex', flexDirection:'column', gap:18, minWidth:0}}>

          {/* Case details */}
          <div className="card">
            <div className="card-head">
              <h3>פרטי תיק</h3>
              <span style={{fontSize:11, color:'var(--text-dim)'}}>הרשאות עריכה: בעלים, מזכירה</span>
            </div>
            <div className="card-body">
              <div className="field-grid">
                <div className="field"><span className="label">שם התיק</span><span className="value">{c.name}</span></div>
                <div className="field"><span className="label">מספר בית משפט</span><span className="value mono">{c.courtId}</span></div>
                <div className="field"><span className="label">קטגוריה</span><span className="value">{c.category}</span></div>
                <div className="field"><span className="label">תאריך פתיחה</span><span className="value mono">{c.opened}</span></div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <span className="label">נושא</span>
                  <span className="value">{c.subject}</span>
                </div>
                <div className="field" style={{gridColumn:'1/-1'}}>
                  <span className="label">מידע נוסף / הערות</span>
                  <span className="value">{c.info}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task tabs */}
          <div className="card">
            <div className="card-head">
              <h3>משימות עובדים</h3>
              <button className="btn sm"><IcPlus size={12}/> שייך עובד</button>
            </div>
            <div className="tabs">
              {assignedUsers.map(u => (
                <button key={u.id} className={activeTab===u.id?'active':''} onClick={()=>setActiveTab(u.id)}>
                  <span className="avatar">{u.initials}</span>
                  {u.name}
                  <span className={"status-cell " + c.tasks[u.id]} style={{padding:'1px 6px', fontSize:10}}>
                    {statusLabel[c.tasks[u.id]]}
                  </span>
                </button>
              ))}
            </div>
            <div className="card-body">
              <CaseTaskPanel user={userById(activeTab)} caseObj={c} status={c.tasks[activeTab]} />
            </div>
          </div>
        </div>

        {/* Side column: timeline */}
        <div className="card">
          <div className="card-head">
            <h3>לוג עדכונים</h3>
            <span style={{fontSize:11, color:'var(--text-dim)'}}>{timeline.length} רשומות</span>
          </div>
          <ul className="timeline">
            {timeline.map((ev, i) => {
              const u = userById(ev.user);
              return (
                <li key={i}>
                  <span className="dot"/>
                  <div className="content">
                    <div className="head"><strong>{u?.name}</strong> {ev.action}</div>
                    <div className="meta mono">{ev.date}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

const CaseTaskPanel = ({ user, caseObj, status }) => {
  if (!user) return null;
  const taskTypes = {
    u1: 'אסטרטגיה משפטית · ניהול תיק',
    u2: 'מעקב מזכירותי · תיוק ולו"ז',
    u3: 'הכנת כתבי טענות · ייצוג בדיון',
    u4: 'בדיקת מסמכים · ניסוח חוזים',
    u5: 'תחקיר משפטי · פסיקה רלוונטית',
    u6: 'תיעוד והעתקה · עבודת מתמחה',
  };
  const dueDate = { urgent:'22/05/2026', progress:'02/06/2026', pending:'10/06/2026', blocked:'—', done:'—' }[status];
  const priority = { urgent:'high', progress:'med', pending:'med', blocked:'high', done:'low' }[status];
  const priorityLabel = { high:'גבוהה', med:'בינונית', low:'נמוכה' };
  const statusLabel = { done:'הושלם', progress:'בטיפול', urgent:'דחוף', pending:'ממתין', blocked:'תקוע' };

  return (
    <div className="field-grid">
      <div className="field"><span className="label">סוג המשימה</span><span className="value">{taskTypes[user.id]}</span></div>
      <div className="field"><span className="label">סטטוס</span>
        <span className="value">
          <span className={"status-cell " + status}><span className="dot"/>{statusLabel[status]}</span>
        </span>
      </div>
      <div className="field"><span className="label">עדיפות</span>
        <span className="value">
          <span className={"priority-cell " + priority}><span className="flag"/>{priorityLabel[priority]}</span>
        </span>
      </div>
      <div className="field"><span className="label">תאריך יעד</span>
        <span className="value mono">{dueDate}</span>
      </div>
      <div className="field" style={{gridColumn:'1/-1'}}>
        <span className="label">הערות</span>
        <span className="value" style={{
          padding:'10px 12px', background:'var(--bg-2)', borderRadius:6, border:'1px solid var(--line)',
          minHeight:60, color:'var(--text-muted)'
        }}>
          {status === 'urgent' && 'תאריך יעד מתקרב — לוודא שהמסמכים מוכנים. נדרש אישור של עו"ד ארז לפני הגשה.'}
          {status === 'progress' && 'התקדמות תקינה. עדכון אחרון נמסר בישיבת הצוות ביום ראשון.'}
          {status === 'pending' && 'ממתין לקבלת מסמכים מהלקוח. שלחתי תזכורת.'}
          {status === 'blocked' && 'תקוע — ממתינים להחלטת בית משפט בבקשה שהוגשה. אין מה לעשות עד שתתקבל.'}
          {status === 'done' && 'המשימה הושלמה והתיעוד הועלה לתיקייה הראשית.'}
        </span>
      </div>
      <div className="field" style={{gridColumn:'1/-1', display:'flex', flexDirection:'row', justifyContent:'flex-end', gap:8}}>
        <button className="btn sm"><IcCheck size={12}/> סמן כהושלם</button>
        <button className="btn sm primary"><IcEdit size={12}/> עדכן משימה</button>
      </div>
    </div>
  );
};

Object.assign(window, { CaseDetail });
