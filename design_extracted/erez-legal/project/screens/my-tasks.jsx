// My Tasks screen
const MyTasks = ({ data, onOpenCase }) => {
  const { myTasks } = data;
  const [status, setStatus] = React.useState('all');
  const [priority, setPriority] = React.useState('all');

  const filtered = myTasks.filter(t => {
    if (status !== 'all' && t.status !== status) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    return true;
  });

  const statusLabel = { done:'הושלם', progress:'בטיפול', urgent:'דחוף', pending:'ממתין', blocked:'תקוע' };
  const priorityLabel = { high:'גבוהה', med:'בינונית', low:'נמוכה' };

  // overdue check (mock: today = 18/05/2026)
  const isOverdue = (dueStr) => {
    if (!dueStr || dueStr === '—') return false;
    const [d, m, y] = dueStr.split('/').map(Number);
    const due = new Date(y, m - 1, d);
    return due < new Date(2026, 4, 18);
  };

  const open = myTasks.filter(t => t.status !== 'done').length;
  const overdue = myTasks.filter(t => isOverdue(t.due) && t.status !== 'done').length;
  const urgent = myTasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <div className="page" data-screen-label="03 My Tasks">
      <div className="page-header">
        <div>
          <div className="eyebrow">שלום, ארז · יום שני, 18 במאי</div>
          <h1>המשימות שלי</h1>
          <div className="sub">משימות המשויכות אליך בלבד, מכל התיקים הפעילים במשרד.</div>
        </div>
      </div>

      <div className="stats" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
        <StatCard icon={IcTasks} label="פתוחות"     value={open} delta="מתוך 8 משימות" />
        <StatCard icon={IcAlert} label="באיחור"    value={overdue} delta="עברו תאריך יעד" down={overdue>0} />
        <StatCard icon={IcClock} label="עדיפות גבוהה" value={urgent} delta="נדרש טיפול מיידי" />
      </div>

      <div className="toolbar">
        <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center'}}>
          <span style={{fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginLeft:4}}>סטטוס:</span>
          {['all','urgent','progress','pending','blocked','done'].map(s => (
            <button key={s} className={"chip" + (status===s?' active':'')} onClick={()=>setStatus(s)}>
              {s==='all' ? 'הכל' : statusLabel[s]}
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', marginRight:'auto'}}>
          <span style={{fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginLeft:4}}>עדיפות:</span>
          {['all','high','med','low'].map(p => (
            <button key={p} className={"chip" + (priority===p?' active':'')} onClick={()=>setPriority(p)}>
              {p==='all' ? 'הכל' : priorityLabel[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="cases">
            <thead>
              <tr>
                <th style={{minWidth:240}}>תיק</th>
                <th>סוג המשימה</th>
                <th>סטטוס</th>
                <th>עדיפות</th>
                <th>תאריך יעד</th>
                <th>הערות</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const over = isOverdue(t.due) && t.status !== 'done';
                return (
                  <tr key={i} onClick={()=>onOpenCase(t.caseId)} className={over?'urgent-row':''}>
                    <td>
                      <div className="case-name">{t.caseName}</div>
                      <div className="case-meta mono">{t.caseId}</div>
                    </td>
                    <td style={{color:'var(--text-muted)'}}>{t.type}</td>
                    <td><span className={"status-cell " + t.status}><span className="dot"/>{statusLabel[t.status]}</span></td>
                    <td><span className={"priority-cell " + t.priority}><span className="flag"/>{priorityLabel[t.priority]}</span></td>
                    <td><span className={"due mono" + (over?' overdue':'')}>{t.due}</span></td>
                    <td style={{color:'var(--text-dim)', fontSize:12, maxWidth:220}}>{t.notes || '—'}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="icon-btn" title="עדכן"><IcEdit size={13}/></button>
                        <button className="icon-btn" title="סמן כהושלם"><IcCheck size={13}/></button>
                      </div>
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

Object.assign(window, { MyTasks });
