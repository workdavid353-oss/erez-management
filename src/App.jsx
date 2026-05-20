import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import { IcMenu } from './components/Icons'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CaseDetailPage from './pages/CaseDetailPage'
import TasksPage from './pages/TasksPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import CasesManagementPage from './pages/CasesManagementPage'
import SettingsPage from './pages/SettingsPage'

function AppShell() {
  const { user, profile, loading, updatePreference } = useAuth()

  const [screen, setScreen]       = useState('dashboard')
  const [openCaseId, setCaseId]   = useState(null)
  const [theme, setTheme]         = useState(() => localStorage.getItem('el-theme') || 'light')
  const [sidebarOpen, setSidebar] = useState(true)

  // סנכרון תמה מה-DB כשהפרופיל נטען
  useEffect(() => {
    if (profile?.preferences?.theme) {
      setTheme(profile.preferences.theme)
    }
  }, [profile?.id])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('el-theme', theme)
  }, [theme])

  function handleThemeChange(newTheme) {
    setTheme(newTheme)
    updatePreference('theme', newTheme)
  }

  if (loading) {
    return <div className="app-loading">טוען...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  const goto = (id) => { setScreen(id); setCaseId(null) }
  const openCase = (id) => { setCaseId(id); setScreen('case') }

  const sidebarUser = profile
    ? { ...profile, name: profile.full_name, initials: profile.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?' }
    : { name: '...', initials: '?', role: 'employee' }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app">
      <main className={'main' + (sidebarOpen ? '' : ' sidebar-closed')}>
        {!sidebarOpen && (
          <button className="sidebar-open-btn" onClick={() => setSidebar(true)} title="פתח תפריט">
            <IcMenu size={16} />
          </button>
        )}
        {screen === 'dashboard' && <DashboardPage onOpenCase={openCase} />}
        {screen === 'case'      && <CaseDetailPage caseId={openCaseId} onBack={() => goto('dashboard')} />}
        {screen === 'tasks'     && <TasksPage onOpenCase={openCase} />}
        {screen === 'cases-mgmt' && <CasesManagementPage onOpenCase={openCase} />}
        {screen === 'reports'   && <ReportsPage />}
        {screen === 'users'     && <UsersPage />}
        {screen === 'settings'  && <SettingsPage theme={theme} onTheme={handleThemeChange} />}
      </main>

      <div className={'sidebar-wrap' + (sidebarOpen ? '' : ' collapsed')}>
        <Sidebar
          current={screen}
          onNav={goto}
          user={sidebarUser}
          theme={theme}
          onToggleTheme={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
          onClose={() => setSidebar(false)}
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
