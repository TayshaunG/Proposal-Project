import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Shield, LayoutDashboard, Zap, Clock, BarChart2, Menu, X } from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import Classify  from './pages/Classify.jsx'
import History   from './pages/History.jsx'
import Stats     from './pages/Stats.jsx'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/classify', icon: Zap,             label: 'Classify'   },
  { to: '/history',  icon: Clock,           label: 'History'    },
  { to: '/stats',    icon: BarChart2,       label: 'Stats'      },
]

const S = {
  app:     { display:'flex', height:'100vh', overflow:'hidden' },
  sidebar: (open) => ({
    width: open ? 220 : 64, minWidth: open ? 220 : 64,
    background:'#0f172a', borderRight:'1px solid #1e293b',
    display:'flex', flexDirection:'column',
    transition:'width .2s', overflow:'hidden',
  }),
  logo:    { display:'flex', alignItems:'center', gap:10, padding:'20px 14px',
             borderBottom:'1px solid #1e293b' },
  logoTxt: { fontWeight:700, fontSize:16, color:'#38bdf8', whiteSpace:'nowrap' },
  nav:     { flex:1, padding:'12px 0' },
  link:    (active) => ({
    display:'flex', alignItems:'center', gap:12,
    padding:'10px 14px', color: active ? '#38bdf8' : '#94a3b8',
    background: active ? '#1e3a5f' : 'transparent',
    borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
    textDecoration:'none', whiteSpace:'nowrap', fontSize:14,
    transition:'all .15s',
  }),
  toggle:  { padding:'12px 14px', cursor:'pointer', color:'#94a3b8',
             background:'none', border:'none', display:'flex' },
  main:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden',
             background:'#0f172a' },
  topbar:  { background:'#0f172a', borderBottom:'1px solid #1e293b',
             padding:'14px 24px', display:'flex', alignItems:'center',
             justifyContent:'space-between' },
  content: { flex:1, overflowY:'auto', padding:24 },
}

export default function App() {
  const [open, setOpen] = useState(true)

  return (
    <BrowserRouter>
      <div style={S.app}>
        {/* ── Sidebar ── */}
        <aside style={S.sidebar(open)}>
          <div style={S.logo}>
            <Shield size={22} color="#38bdf8" />
            {open && <span style={S.logoTxt}>NetGuard</span>}
          </div>
          <nav style={S.nav}>
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => S.link(isActive)}>
                <Icon size={18} />
                {open && label}
              </NavLink>
            ))}
          </nav>
          <button style={S.toggle} onClick={() => setOpen(o => !o)}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </aside>

        {/* ── Main ── */}
        <div style={S.main}>
          <header style={S.topbar}>
            <span style={{ color:'#94a3b8', fontSize:13 }}>
              ML-Based Network Anomaly Detection System
            </span>
            <span style={{ fontSize:11, color:'#475569' }}>
              Tayshaun Gitonga · 193637 · Strathmore University
            </span>
          </header>
          <main style={S.content}>
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/classify" element={<Classify  />} />
              <Route path="/history"  element={<History   />} />
              <Route path="/stats"    element={<Stats     />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
