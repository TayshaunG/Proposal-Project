import React, { useState, useEffect } from 'react'
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react'

const API = '/api'

// Key features most useful for testing — user fills these in; rest default to 0
const KEY_FEATURES = [
  { name: 'Flow Duration',          hint: 'e.g. 500000',  desc: 'Duration of the flow in microseconds' },
  { name: 'Total Fwd Packets',      hint: 'e.g. 10',      desc: 'Packets sent in forward direction' },
  { name: 'Total Backward Packets', hint: 'e.g. 8',       desc: 'Packets sent in backward direction' },
  { name: 'Flow Bytes/s',           hint: 'e.g. 15000',   desc: 'Bytes transferred per second' },
  { name: 'Flow Packets/s',         hint: 'e.g. 50',      desc: 'Packets per second' },
  { name: 'Flow IAT Mean',          hint: 'e.g. 20000',   desc: 'Mean inter-arrival time (µs)' },
  { name: 'SYN Flag Count',         hint: 'e.g. 1',       desc: 'Number of SYN flags' },
  { name: 'ACK Flag Count',         hint: 'e.g. 3',       desc: 'Number of ACK flags' },
  { name: 'RST Flag Count',         hint: 'e.g. 0',       desc: 'Number of RST flags' },
  { name: 'Fwd Packet Length Mean', hint: 'e.g. 400',     desc: 'Average forward packet length (bytes)' },
  { name: 'Down/Up Ratio',          hint: 'e.g. 1.2',     desc: 'Download to upload ratio' },
  { name: 'Average Packet Size',    hint: 'e.g. 380',     desc: 'Average packet size (bytes)' },
]

// Quick presets
const PRESETS = {
  'Normal HTTP': { 'Flow Duration': 500000, 'Total Fwd Packets': 10, 'Total Backward Packets': 8,
    'Flow Bytes/s': 15000, 'Flow Packets/s': 50, 'Flow IAT Mean': 20000,
    'SYN Flag Count': 1, 'ACK Flag Count': 4, 'RST Flag Count': 0,
    'Fwd Packet Length Mean': 400, 'Down/Up Ratio': 1.2, 'Average Packet Size': 380 },
  'DDoS Attack': { 'Flow Duration': 3000, 'Total Fwd Packets': 500, 'Total Backward Packets': 1,
    'Flow Bytes/s': 2000000, 'Flow Packets/s': 5000, 'Flow IAT Mean': 200,
    'SYN Flag Count': 3, 'ACK Flag Count': 0, 'RST Flag Count': 0,
    'Fwd Packet Length Mean': 40, 'Down/Up Ratio': 0.01, 'Average Packet Size': 40 },
  'Port Scan': { 'Flow Duration': 800, 'Total Fwd Packets': 1, 'Total Backward Packets': 0,
    'Flow Bytes/s': 500, 'Flow Packets/s': 1000, 'Flow IAT Mean': 100,
    'SYN Flag Count': 1, 'ACK Flag Count': 0, 'RST Flag Count': 0,
    'Fwd Packet Length Mean': 40, 'Down/Up Ratio': 0, 'Average Packet Size': 40 },
  'Brute Force': { 'Flow Duration': 200000, 'Total Fwd Packets': 15, 'Total Backward Packets': 10,
    'Flow Bytes/s': 8000, 'Flow Packets/s': 200, 'Flow IAT Mean': 5000,
    'SYN Flag Count': 1, 'ACK Flag Count': 2, 'RST Flag Count': 1,
    'Fwd Packet Length Mean': 200, 'Down/Up Ratio': 0.8, 'Average Packet Size': 180 },
}

export default function Classify() {
  const [values,    setValues]    = useState({})
  const [allNames,  setAllNames]  = useState([])
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    fetch(`${API}/features`).then(r => r.json()).then(d => {
      if (d.status === 'success') setAllNames(d.features)
    }).catch(() => {})
  }, [])

  const applyPreset = (name) => setValues({ ...PRESETS[name] })

  const handleChange = (name, val) => setValues(prev => ({ ...prev, [name]: val }))

  const handleClassify = async () => {
    if (allNames.length === 0) { setError('Could not load feature list from API.'); return }
    setLoading(true); setResult(null); setError(null)
    try {
      const named = {}
      allNames.forEach(n => { named[n] = parseFloat(values[n] ?? 0) || 0 })
      const res = await fetch(`${API}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ named_features: named }),
      })
      const data = await res.json()
      if (data.status === 'success') setResult(data.result)
      else setError(data.error)
    } catch (e) { setError('Cannot reach API — is the Flask server running?') }
    finally { setLoading(false) }
  }

  const isAttack = result?.final_label === 'ATTACK'

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Classify Traffic</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>
        Enter network flow features to classify as BENIGN or ATTACK.
      </p>

      {/* Presets */}
      <div style={{ marginBottom:20 }}>
        <p style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>Quick Presets:</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {Object.keys(PRESETS).map(p => (
            <button key={p} onClick={() => applyPreset(p)}
              style={{ padding:'6px 14px', background:'#1e293b', border:'1px solid #334155',
                       borderRadius:20, color:'#94a3b8', fontSize:12, cursor:'pointer' }}>
              {p}
            </button>
          ))}
          <button onClick={() => setValues({})}
            style={{ padding:'6px 14px', background:'transparent', border:'1px solid #334155',
                     borderRadius:20, color:'#475569', fontSize:12, cursor:'pointer' }}>
            Clear
          </button>
        </div>
      </div>

      {/* Feature inputs */}
      <div style={{ background:'#1e293b', borderRadius:12, padding:20,
                    border:'1px solid #334155', marginBottom:20 }}>
        <p style={{ fontSize:13, color:'#94a3b8', marginBottom:16 }}>
          Key Features <span style={{ color:'#475569' }}>(unspecified features default to 0)</span>
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
          {KEY_FEATURES.map(({ name, hint, desc }) => (
            <div key={name}>
              <label style={{ fontSize:12, color:'#94a3b8', display:'block', marginBottom:4 }}>
                {name}
                <span style={{ color:'#475569', marginLeft:6, fontSize:11 }}>({desc})</span>
              </label>
              <input type="number" placeholder={hint}
                value={values[name] ?? ''}
                onChange={e => handleChange(name, e.target.value)}
                style={{ width:'100%', background:'#0f172a', border:'1px solid #334155',
                         borderRadius:8, padding:'8px 12px', color:'#f1f5f9', fontSize:13,
                         outline:'none' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Classify button */}
      <button onClick={handleClassify} disabled={loading}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 24px',
                 background: loading ? '#334155' : '#0284c7', border:'none', borderRadius:8,
                 color:'#fff', fontSize:14, fontWeight:600, cursor: loading?'not-allowed':'pointer',
                 marginBottom:24 }}>
        <Zap size={16} />
        {loading ? 'Classifying...' : 'Classify Flow'}
      </button>

      {error && (
        <div style={{ background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:10,
                      padding:'12px 16px', color:'#fca5a5', fontSize:13, marginBottom:16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ background: isAttack ? '#1a0505' : '#052e16',
                      border: `1px solid ${isAttack ? '#7f1d1d' : '#14532d'}`,
                      borderRadius:12, padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            {isAttack
              ? <AlertTriangle size={28} color="#f87171" />
              : <CheckCircle  size={28} color="#4ade80" />}
            <div>
              <div style={{ fontSize:22, fontWeight:700,
                             color: isAttack ? '#f87171' : '#4ade80' }}>
                {result.final_label}
              </div>
              <div style={{ fontSize:13, color:'#64748b' }}>
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ModelResult title="Isolation Forest" data={result.isolation_forest}
              extra={`Anomaly Score: ${result.isolation_forest.anomaly_score}`} />
            <ModelResult title="Random Forest"    data={result.random_forest}
              extra={`Confidence: ${(result.random_forest.confidence*100).toFixed(1)}%`} />
          </div>
        </div>
      )}
    </div>
  )
}

function ModelResult({ title, data, extra }) {
  const isAtk = data.label === 'ATTACK'
  return (
    <div style={{ background:'#0f172a', borderRadius:10, padding:14,
                  border:`1px solid ${isAtk ? '#7f1d1d' : '#14532d'}` }}>
      <div style={{ fontSize:12, color:'#64748b', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:16, fontWeight:700,
                     color: isAtk ? '#f87171' : '#4ade80', marginBottom:4 }}>
        {data.label}
      </div>
      <div style={{ fontSize:12, color:'#94a3b8' }}>{extra}</div>
    </div>
  )
}
