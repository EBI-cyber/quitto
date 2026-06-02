import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { syncAll, pullBelege } from './lib/cloud'
import Nav from './components/Nav'
import Home from './screens/Home'
import EinnahmeFlow from './screens/EinnahmeFlow'
import AusgabeFlow from './screens/AusgabeFlow'
import Kassenbuch from './screens/Kassenbuch'
import Cockpit from './screens/Cockpit'
import SettingsScreen from './screens/SettingsScreen'
import Login from './screens/Login'
import MeineZahlungen from './screens/MeineZahlungen'

function Splash() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
}

function Shell() {
  const { loading, user, isCloudReady } = useAuth()
  const [role, setRole] = useState(null) // 'owner' | 'payee'

  useEffect(() => {
    let active = true
    if (!user) { setRole(null); return }
    ;(async () => {
      try { await syncAll() } catch { /* offline */ }
      const email = (user.email || '').toLowerCase()
      let isPayee = false
      try {
        const cloud = await pullBelege()
        if (cloud.length) {
          const ownsAny = cloud.some((b) => b.owner === user.id)
          isPayee = !ownsAny && cloud.some((b) => (b.payeeEmail || '').toLowerCase() === email)
        }
      } catch { /* im Zweifel Owner */ }
      if (active) setRole(isPayee ? 'payee' : 'owner')
    })()
    return () => { active = false }
  }, [user])

  if (loading) return <Splash />
  if (isCloudReady && !user) return <Login />
  if (user && role === null) return <Splash />
  if (role === 'payee') return <MeineZahlungen />

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/einnahme" element={<EinnahmeFlow />} />
          <Route path="/ausgabe" element={<AusgabeFlow />} />
          <Route path="/kassenbuch" element={<Kassenbuch />} />
          <Route path="/cockpit" element={<Cockpit />} />
          <Route path="/einstellungen" element={<SettingsScreen />} />
        </Routes>
      </div>
      <Nav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AuthProvider>
  )
}
