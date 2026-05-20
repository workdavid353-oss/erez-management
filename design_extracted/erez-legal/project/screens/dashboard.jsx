// Dashboard — main cases table with stats
const Dashboard = ({ data, onOpenCase }) => {
  const { cases, workerCols, users, categories } = data;

  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('updated');

  const userById = (id) => users.find(u => u.id === id);

  const filtered = cases.filter(c => {
    if (cat !== 'all' && c.category !== cat) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!c.name.toLowerCase().includes(s) && !c.subject.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  // Stats
  const openCases = cases.filter(c => c.status !== 'הושלם').length;
  const weekly = cases.filter(c => c.updatedAt.includes('05/2026') || c.updatedAt.includes('18/05')).length;
  const urgent = cases.filter(c => c.priority === 'high').length;
  // Worker with most open tasks
  const taskCount = {};
  cases.forEach(c => Object.entries(c.tasks).forEach(([uid, st]) => {
    if (st !== 'done') taskCount[uid] = (taskCount[uid] || 0) + 1;
  }));
  const topUid = Object.entries(taskCount).sort((a,b) => b[1]-a[1])[0]?.[0];
  const topUser = userById(topUid);

  const statusLabel = { done:'הושלם', progress:'בטיפול', urgent:'דחוף', pending:'ממתין', blocked:'תקוע' };

  return (
    <div className="page" data-screen-label="01 Dashboard">
      <div className="page-header">
        <div>
          <div className="eyebrow">תיקי המשרד · יום שני, 18 במאי 2026</div>
          <h1>לוח בקרה</h1>
          <div className="sub">כל התיקים הפעילים, סטטוס המשימות לכל עורך דין, ועדכון אחרון.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn"><IcDownload size={14}/> ייצוא</button>
          <button className="btn primary"><IcPlus size={14}/> תיק חדש</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <StatCard icon={IcBriefcase} label="תיקים פתוחים"   value={openCases} delta="+2 השבוע" up />
        <StatCard icon={IcClock}     label="עודכנו השבוע"  value={weekly}    delta="פעילות תקינה" />
        <StatCard icon={IcAlert}     label="תיקים דחופים"  value={urgent}    delta="דורש עין" down />
        <StatCard icon={IcAward}     label="עומס הכי גבוה" value={topUser?.initials || '—'}
                  delta={`${topUser?.name || ''} · ${taskCount[topUid] || 0} משימות פתוחות`} />
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <input placeholder="חיפוש לפי שם תיק, נושא או מספר…" value={q} onChange={e=>setQ(e.target.value)} />
          <IcSearch className="icon" size={15}/>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          <button className={"chip" + (cat==='all'?' active':'')} onClick={()=>setCat('all')}>הכל</button>
          {categories.map(c => (
            <button key={c} className={"chip" + (cat===c?' active':'')} onClick={()=>setCat(c)}>{c}</button>
          ))}
        </div>
        <div style={{marginRight:'auto', display:'flex', gap:8, alignItems:'center'}}>
          <button className="btn"><IcFilter size={14}/> סינון מתקדם</button>
          <span style={{color:'var(--text-dim)', fontSize:12}}>
            מציג <strong style={{color:'var(--text)'}}>{filtered.length}</strong> מתוך {cases.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="cases">
            <thead>
              <tr>
                <th style={{minWidth:240}}>תיק / נושא</th>
                <th>קטגוריה</th>
                <th style={{minWidth:160}}>מידע נוסף</th>
                {workerCols.map(w => (
                  <th key={w.id} title={w.name}>
                    <div style={{display:'flex', alignItems:'center', gap:6, justifyContent:'flex-start'}}>
                      <span className="avatar" style={{width:20, height:20, fontSize:10}}>{w.initials}</span>
                      <span style={{textTransform:'none', letterSpacing:0, fontSize:11}}>{w.name.replace(/^עו"ד /,'').split(' ')[0]}</span>
                    </div>
                  </th>
                ))}
                <th>עודכן</th>
                <th>ע"י</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const updater = userById(c.updatedBy);
                return (
                  <tr key={c.id} onClick={()=>onOpenCase(c.id)} className={c.priority==='high'?'urgent-row':''}>
                    <td>
                      <div className="case-name">{c.name}</div>
                      <div className="case-meta">{c.subject} · <span className="mono">{c.courtId}</span></div>
                    </td>
                    <td><span className="cat-tag">{c.category}</span></td>
                    <td style={{color:'var(--text-muted)', fontSize:12, maxWidth:200}}>{c.info}</td>
                    {workerCols.map(w => {
                      const st = c.tasks[w.id];
                      if (!st) return <td key={w.id}><span className="empty-cell">— לא מוקצה</span></td>;
                      return <td key={w.id}>
                        <span className={"status-cell " + st}><span className="dot"/>{statusLabel[st]}</span>
                      </td>;
                    })}
                    <td><span className="mono" style={{fontSize:12, color:'var(--text-muted)'}}>{c.updatedAt}</span></td>
                    <td>
                      {updater && <span className="user-cell">
                        <span className="avatar">{updater.initials}</span>
                        {updater.name.replace(/^עו"ד /,'').split(' ')[0]}
                      </span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: I, label, value, delta, up, down }) => (
  <div className="stat-card">
    <div className="accent-bar"/>
    <div className="label"><I size={13}/> {label}</div>
    <div className="value">{value}</div>
    <div className={"delta" + (up?' up':'') + (down?' down':'')}>{delta}</div>
  </div>
);

Object.assign(window, { Dashboard });
