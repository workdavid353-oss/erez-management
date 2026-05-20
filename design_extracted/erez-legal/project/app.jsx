// Main app — router + tweaks bindings
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "primaryHue": 255,
  "accentHue": 75,
  "density": "comfortable"
}/*EDITMODE-END*/;

const App = () => {
  const [t, setTweak] = (typeof useTweaks === 'function')
    ? useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const [loggedIn, setLoggedIn] = useState(true);
  const [route, setRoute]       = useState({ screen: 'dashboard' });

  const data = window.EREZ_DATA;
  const currentUser = data.users[0];

  // Apply tweaks → CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    const s = document.documentElement.style;
    s.setProperty('--ink',         `oklch(0.30 0.04 ${t.primaryHue})`);
    s.setProperty('--ink-2',       `oklch(0.38 0.04 ${t.primaryHue})`);
    s.setProperty('--brass',       `oklch(0.62 0.10 ${t.accentHue})`);
    s.setProperty('--brass-soft',  `oklch(0.85 0.05 ${t.accentHue})`);
  }, [t.theme, t.primaryHue, t.accentHue]);

  // Apply density on every render
  useEffect(() => {
    document.querySelectorAll('table.cases td').forEach(r => {
      r.style.padding = t.density === 'compact' ? '7px 14px'
                       : t.density === 'spacious' ? '16px 14px'
                       : '12px 14px';
    });
  });

  const onToggleTheme = () => setTweak('theme', t.theme === 'dark' ? 'light' : 'dark');

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} theme={t.theme} />;

  const screen = route.screen;
  const goto = (id) => setRoute({ screen: id });
  const openCase = (id) => setRoute({ screen: 'case', caseId: id });

  return (
    <div className="app">
      <main className="main">
        {screen === 'dashboard' && <Dashboard data={data} onOpenCase={openCase} />}
        {screen === 'case'      && <CaseDetail data={data} caseId={route.caseId} onBack={() => goto('dashboard')} />}
        {screen === 'my-tasks'  && <MyTasks data={data} onOpenCase={openCase} />}
        {screen === 'reports'   && <Reports data={data} />}
        {screen === 'users'     && <UsersScreen data={data} />}
        {screen === 'settings'  && <Settings user={currentUser} theme={t.theme} onTheme={(v)=>setTweak('theme', v)} />}
      </main>

      <Sidebar
        current={screen}
        onNav={goto}
        user={currentUser}
        theme={t.theme}
        onToggleTheme={onToggleTheme}
        onLogout={() => setLoggedIn(false)}
      />

      {typeof TweaksPanel === 'function' && (
        <TweaksPanel title="Tweaks — עיצוב">
          <TweakSection label="ערכת נושא">
            <TweakRadio label="מצב תצוגה" value={t.theme} onChange={(v)=>setTweak('theme', v)}
              options={[{value:'light', label:'יום'}, {value:'dark', label:'לילה'}]} />
            <TweakSlider label="גוון Primary" min={0} max={360} step={5}
              value={t.primaryHue} onChange={(v)=>setTweak('primaryHue', v)} />
            <TweakSlider label="גוון Accent" min={0} max={360} step={5}
              value={t.accentHue} onChange={(v)=>setTweak('accentHue', v)} />
          </TweakSection>
          <TweakSection label="צפיפות טבלה">
            <TweakRadio label="צפיפות" value={t.density} onChange={(v)=>setTweak('density', v)}
              options={[
                {value:'compact',     label:'צפוף'},
                {value:'comfortable', label:'רגיל'},
                {value:'spacious',    label:'מרווח'},
              ]} />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
