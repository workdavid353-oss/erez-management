// Reports & statistics screen
const Reports = ({ data }) => {
  const { cases, users, categories } = data;
  const [period, setPeriod] = React.useState('quarter');

  // Bar: cases per category
  const catCounts = categories.map(c => ({
    name: c,
    count: cases.filter(x => x.category === c).length,
  }));
  const maxCat = Math.max(...catCounts.map(c => c.count), 1);

  // Pie: status distribution
  const statusGroups = [
    { key:'בטיפול',  count: cases.filter(c => c.status === 'בטיפול').length,  color: 'var(--status-progress)' },
    { key:'דחוף',    count: cases.filter(c => c.status === 'דחוף').length,    color: 'var(--status-urgent)' },
    { key:'ממתין',   count: cases.filter(c => c.status === 'ממתין').length,   color: 'var(--status-pending)' },
    { key:'הושלם',   count: cases.filter(c => c.status === 'הושלם').length,   color: 'var(--status-done)' },
  ];
  const totalStatus = statusGroups.reduce((s, g) => s + g.count, 0);

  // Workload table
  const workers = users.filter(u => u.active);
  const workload = workers.map(u => {
    let open = 0, total = 0;
    cases.forEach(c => {
      const st = c.tasks[u.id];
      if (st) { total++; if (st !== 'done') open++; }
    });
    return { u, open, total };
  }).sort((a,b) => b.open - a.open);
  const maxWl = Math.max(...workload.map(w => w.open), 1);

  return (
    <div className="page" data-screen-label="04 Reports">
      <div className="page-header">
        <div>
          <div className="eyebrow">דוחות וניתוחים · {periodLabel(period)}</div>
          <h1>דוחות וסטטיסטיקות</h1>
          <div className="sub">תמונת מצב של פעילות המשרד — לפי קטגוריות, סטטוסים ועומס עובדים.</div>
        </div>
        <div style={{display:'flex', gap:6}}>
          {[['week','שבוע'],['month','חודש'],['quarter','רבעון'],['year','שנה']].map(([k,l]) => (
            <button key={k} className={"chip" + (period===k?' active':'')} onClick={()=>setPeriod(k)}>{l}</button>
          ))}
          <button className="btn"><IcCalendar size={14}/> טווח מותאם</button>
        </div>
      </div>

      <div className="chart-grid">
        {/* Bar chart card */}
        <div className="card">
          <div className="card-head"><h3>תיקים לפי קטגוריה</h3><span style={{fontSize:11, color:'var(--text-dim)'}}>סה"כ {cases.length} תיקים</span></div>
          <div className="card-body">
            <BarChart data={catCounts} max={maxCat} />
          </div>
        </div>

        {/* Pie chart card */}
        <div className="card">
          <div className="card-head"><h3>התפלגות סטטוסים</h3><span style={{fontSize:11, color:'var(--text-dim)'}}>{totalStatus} תיקים</span></div>
          <div className="card-body" style={{display:'flex', alignItems:'center', gap:18}}>
            <PieChart data={statusGroups} total={totalStatus} />
            <div className="legend" style={{flexDirection:'column', flex:1}}>
              {statusGroups.map(g => (
                <div className="legend-item" key={g.key} style={{justifyContent:'space-between', width:'100%'}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="sw" style={{background:g.color}}/>{g.key}
                  </div>
                  <span style={{color:'var(--text)', fontWeight:600}}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workload */}
      <div className="card">
        <div className="card-head">
          <h3>עומס עובדים — משימות פתוחות</h3>
          <button className="btn sm"><IcDownload size={12}/> ייצוא CSV</button>
        </div>
        <div className="card-body">
          {workload.map(w => (
            <div className="workload-row" key={w.u.id}>
              <div className="who">
                <span className="avatar">{w.u.initials}</span>
                <div>
                  <div style={{fontWeight:600, fontSize:13}}>{w.u.name}</div>
                  <div style={{fontSize:11, color:'var(--text-dim)'}}>{roleLabel(w.u.role)} · סה"כ {w.total} משימות בתיקים</div>
                </div>
              </div>
              <div className="workload-bar">
                <div className="fill" style={{width: (w.open/maxWl*100)+'%'}}/>
              </div>
              <div className="num">{w.open}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const periodLabel = (p) => ({week:'7 ימים אחרונים', month:'חודש אחרון', quarter:'רבעון אחרון', year:'שנה אחרונה'}[p]);

const BarChart = ({ data, max }) => {
  const w = 540, h = 220, padL = 50, padR = 12, padT = 14, padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const bw = innerW / data.length;
  const ticks = 4;

  return (
    <svg className="bar-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {/* gridlines */}
      {Array.from({length: ticks+1}).map((_,i) => {
        const y = padT + (innerH / ticks) * i;
        const val = Math.round(max - (max/ticks)*i);
        return (
          <g key={i}>
            <line x1={padL} x2={w-padR} y1={y} y2={y} stroke="var(--line)" strokeDasharray={i===ticks?'':'2 3'} />
            <text x={padL-8} y={y+4} textAnchor="end" fontSize="10" fill="var(--text-dim)" fontFamily="JetBrains Mono">{val}</text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const barH = (d.count / max) * innerH;
        const x = padL + i * bw + bw * 0.18;
        const y = padT + innerH - barH;
        const bwActual = bw * 0.64;
        return (
          <g key={d.name}>
            <rect x={x} y={y} width={bwActual} height={barH} rx="2"
                  fill="var(--brass)" opacity="0.85" />
            <rect x={x} y={y} width={bwActual} height={3} rx="1" fill="var(--ink)" />
            <text x={x + bwActual/2} y={y - 6} textAnchor="middle" fontSize="12"
                  fill="var(--text)" fontFamily="Frank Ruhl Libre" fontWeight="600">{d.count}</text>
            <text x={x + bwActual/2} y={h - 14} textAnchor="middle" fontSize="11"
                  fill="var(--text-muted)">{d.name}</text>
          </g>
        );
      })}
    </svg>
  );
};

const PieChart = ({ data, total }) => {
  const size = 220, r = 80, cx = size/2, cy = size/2;
  let acc = 0;
  const slices = data.map(d => {
    const start = acc / total * Math.PI * 2;
    acc += d.count;
    const end = acc / total * Math.PI * 2;
    return { ...d, start, end };
  });

  const arc = (start, end, R) => {
    const x1 = cx + Math.sin(start) * R, y1 = cy - Math.cos(start) * R;
    const x2 = cx + Math.sin(end)   * R, y2 = cy - Math.cos(end)   * R;
    const large = end - start > Math.PI ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
  };

  return (
    <svg className="pie-chart" viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0, width:220, height:220}}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s.start, s.end, r)} fill={s.color} stroke="var(--surface)" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r={r*0.55} fill="var(--surface)" />
      <text x={cx} y={cy-2} textAnchor="middle" fontFamily="Frank Ruhl Libre" fontSize="28" fontWeight="700" fill="var(--text)">{total}</text>
      <text x={cx} y={cy+16} textAnchor="middle" fontSize="11" fill="var(--text-dim)">תיקים פעילים</text>
    </svg>
  );
};

Object.assign(window, { Reports });
