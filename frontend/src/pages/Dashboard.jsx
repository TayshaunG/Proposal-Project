import React, { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const API = '/api'

const card = (bg='#1e293b') => ({
  background: bg, borderRadius: 12, padding: 20,
  border: '1px solid #334155',
})

export default function Dashboard() {
  const [stats,   setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [error,   setError]   = useState(null)

  const fetchAll = async () => {
    try {
      const [s, h] = await Promise.all([
        fetch(`${API}/stats`).then(r => r.json()),
        fetch(`${API}/history?limit=50`).then(r => r.json()),
      ])
      if (s.status === 'success')  setStats(s)
      if (h.status === 'success')  setHistory(h.records)
      setError(null)
    } catch (e) {
      setError('Cannot reach API — is the Flask server running?')
    }
  }

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 5000); return () => clearInterval(t) }, [])

  // Build sparkline data from last 20 records
  const sparkData = [...history].reverse().slice(-20).map((r, i) => ({
    i, attack: r.label === 'ATTACK' ? 1 : 0,
  }))

  const session = stats?.session ?? {}
  const rfM     = stats?.model_metrics?.random_forest ?? {}
  const ifM     = stats?.model_metrics?.isolation_forest ?? {}

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Dashboard</h1>
      <p style={{ color:'#64748b', marginBottom:24, fontSize:14 }}>
        Live overview of network traffic classifications
      </p>

      {error && (
        <div style={{ background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:10,
                      padding:'12px 16px', marginBottom:20, color:'#fca5a5', fontSize:13 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        <StatCard icon={Activity}      color="#38bdf8" label="Total Classified"  value={session.total_classified ?? 0} />
        <StatCard icon={AlertTriangle} color="#f87171" label="Attacks Detected"  value={session.attacks_detected  ?? 0} />
        <StatCard icon={CheckCircle}   color="#4ade80" label="Benign Traffic"    value={session.benign_traffic    ?? 0} />
        <StatCard icon={Shield}        color="#fb923c" label="Attack Rate"       value={`${session.attack_rate ?? 0}%`} />
      </div>

      {/* ── Sparkline + Model Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
        <div style={card()}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16, color:'#94a3b8' }}>
            Recent Traffic Activity
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sparkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="i" hide />
              <YAxis domain={[0,1]} ticks={[0,1]} tickFormatter={v => v ? 'Attack':'Normal'} style={{fontSize:11}} />
              <Tooltip formatter={v => v ? '🔴 ATTACK' : '🟢 BENIGN'} contentStyle={{background:'#1e293b',border:'none'}} />
              <Line type="stepAfter" dataKey="attack" dot={false} stroke="#f87171" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <ModelCard title="Random Forest" metrics={rfM}    color="#38bdf8" />
          <ModelCard title="Isolation Forest" metrics={ifM} color="#a78bfa" />
        </div>
      </div>

      {/* ── Recent Records ── */}
      <div style={card()}>
        <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14, color:'#94a3b8' }}>
          Recent Classifications
        </h3>
        {history.length === 0 ? (
          <p style={{ color:'#475569', fontSize:13 }}>No classifications yet. Go to Classify to start.</p>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ color:'#64748b', borderBottom:'1px solid #334155' }}>
                {['#','Time','Label','Confidence','IF','RF','Score'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'6px 8px', fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map(r => (
                <tr key={r.id} style={{ borderBottom:'1px solid #1e293b' }}>
                  <td style={{ padding:'7px 8px', color:'#475569' }}>{r.id}</td>
                  <td style={{ padding:'7px 8px', color:'#64748b' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding:'7px 8px' }}>
                    <span style={{ background: r.label==='ATTACK'?'#450a0a':'#052e16',
                                   color: r.label==='ATTACK'?'#f87171':'#4ade80',
                                   padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>
                      {r.label}
                    </span>
                  </td>
                  <td style={{ padding:'7px 8px', color:'#94a3b8' }}>{(r.confidence*100).toFixed(1)}%</td>
                  <td style={{ padding:'7px 8px', color: r.if_label==='ATTACK'?'#f87171':'#4ade80', fontSize:11 }}>{r.if_label}</td>
                  <td style={{ padding:'7px 8px', color: r.rf_label==='ATTACK'?'#f87171':'#4ade80', fontSize:11 }}>{r.rf_label}</td>
                  <td style={{ padding:'7px 8px', color:'#94a3b8' }}>{r.anomaly_score?.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <div style={{ background:'#1e293b', borderRadius:12, padding:18,
                  border:'1px solid #334155', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ background: color+'22', borderRadius:10, padding:10 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:700, color:'#f1f5f9' }}>{value}</div>
        <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

function ModelCard({ title, metrics, color }) {
  return (
    <div style={{ background:'#1e293b', borderRadius:12, padding:14,
                  border:'1px solid #334155', flex:1 }}>
      <div style={{ fontSize:13, fontWeight:600, color, marginBottom:8 }}>{title}</div>
      {['accuracy','f1','roc_auc'].map(k => (
        <div key={k} style={{ display:'flex', justifyContent:'space-between',
                               fontSize:12, color:'#94a3b8', marginBottom:4 }}>
          <span style={{ textTransform:'capitalize' }}>{k.replace('_',' ')}</span>
          <span style={{ color:'#f1f5f9' }}>{metrics[k] !== undefined ? (metrics[k]*100).toFixed(1)+'%' : '—'}</span>
        </div>
      ))}
    </div>
  )
}
