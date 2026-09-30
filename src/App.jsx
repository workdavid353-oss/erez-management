import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import { normalizeFontSize, FONT_SIZE_DEFAULT } from './lib/helpers'
import Sidebar from './components/Sidebar'
import FeedbackModal from './components/FeedbackModal'
import { IcMenu } from './components/Icons'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CaseDetailPage from './pages/CaseDetailPage'
import TasksPage from './pages/TasksPage'
import AllTasksPage from './pages/AllTasksPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import CasesManagementPage from './pages/CasesManagementPage'
import SettingsPage from './pages/SettingsPage'
import FeedbackAdminPage from './pages/FeedbackAdminPage'
import AuditLogPage from './pages/AuditLogPage'

function AppShell() {
  const { user, profile, loading, updatePreference } = useAuth()

  const [screen,       setScreen]      = useState('dashboard')
  const [openCaseId,   setCaseId]      = useState(null)
  const [theme,        setTheme]       = useState(() => localStorage.getItem('el-theme') || 'light')
  const [fontSize,     setFontSize]    = useState(() => normalizeFontSize(localStorage.getItem('el-font-size') ?? FONT_SIZE_DEFAULT))
  const [sidebarOpen,  setSidebar]     = useState(true)
  const [feedbackOpen, setFeedback]    = useState(false)

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

  // גודל טקסט — מוחל כ-zoom על כל הממשק (כל הגדלים ב-CSS הם px)
  useEffect(() => {
    if (profile?.preferences?.fontSize != null) {
      setFontSize(normalizeFontSize(profile.preferences.fontSize))
    }
  }, [profile?.id])

  useEffect(() => {
    document.documentElement.style.setProperty('--ui-zoom', fontSize / 100)
    localStorage.setItem('el-font-size', fontSize)
  }, [fontSize])

  function handleFontSizeChange(newSize) {
    const size = normalizeFontSize(newSize)
    if (size === fontSize) return
    setFontSize(size)
    updatePreference('fontSize', size)
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
      {feedbackOpen && <FeedbackModal user={profile} onClose={() => setFeedback(false)} />}
        {!sidebarOpen && (
          <button className="sidebar-open-btn" onClick={() => setSidebar(true)} title="פתח תפריט">
            <IcMenu size={16} />
          </button>
        )}
        {screen === 'dashboard' && <DashboardPage onOpenCase={openCase} />}
        {screen === 'case'      && <CaseDetailPage caseId={openCaseId} onBack={() => goto('dashboard')} />}
        {screen === 'tasks'     && <TasksPage onOpenCase={openCase} />}
        {screen === 'all-tasks' && <AllTasksPage onOpenCase={openCase} />}
        {screen === 'calendar'  && <CalendarPage onOpenCase={openCase} />}
        {screen === 'cases-mgmt' && <CasesManagementPage onOpenCase={openCase} />}
        {screen === 'reports'   && <ReportsPage />}
        {screen === 'users'     && <UsersPage />}
        {screen === 'settings'  && <SettingsPage theme={theme} onTheme={handleThemeChange} fontSize={fontSize} onFontSize={handleFontSizeChange} />}
        {screen === 'feedback'  && <FeedbackAdminPage />}
        {screen === 'audit'     && <AuditLogPage />}
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
          onFeedback={() => setFeedback(true)}
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
