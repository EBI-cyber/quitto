import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { syncAll } from './lib/cloud'
import Nav from './components/Nav'
import Home from './screens/Home'
import EinnahmeFlow from './screens/EinnahmeFlow'
import Kassenbuch from './screens/Kassenbuch'
import Cockpit from './screens/Cockpit'
import SettingsScreen from './screens/SettingsScreen'
import Login from './screens/Login'

function Splash() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
}

function Shell() {
  const { loading, user, isCloudReady } = useAuth()
  useEffect(() => { if (user) syncAll() }, [user])

  if (loading) return <Splash />
  if (isCloudReady && !user) return <Login />

  return (
    <div className="min-h-[100dvh] flex flex-col max-w-md mx-auto">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/einnahme" element={<EinnahmeFlow />} />
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
