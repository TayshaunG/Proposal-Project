import React, { useEffect, useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'

const API = '/api'

export default function History() {
  const [records, setRecords] = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const d = await fetch(`${API}/history?limit=200`).then(r => r.json())
      if (d.status === 'success') { setRecords(d.records); setTotal(d.total) }
    } finally { setLoading(false) }
  }

  const clear = async () => {
    await fetch(`${API}/history`, { method: 'DELETE' })
    setRecords([]); setTotal(0)
  }

  useEffect(() => { fetch_() }, [])

  const attacks = records.filter(r => r.label === 'ATTACK').length
  const benign  = records.filter(r => r.label === 'BENIGN').length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Classification History</h1>
          <p style={{ color:'#64748b', fontSize:14 }}>
            {total} total · <span style={{ color:'#f87171' }}>{attacks} attacks</span> ·{' '}
            <span style={{ color:'#4ade80' }}>{benign} benign</span>
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={fetch_}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                     background:'#1e293b', border:'1px solid #334155', borderRadius:8,
                     color:'#94a3b8', fontSize:13, cursor:'pointer' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={clear}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                     background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:8,
                     color:'#f87171', fontSize:13, cursor:'pointer' }}>
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      <div style={{ background:'#1e293b', borderRadius:12, border:'1px solid #334155', overflow:'hidden' }}>
        {records.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'#475569', fontSize:14 }}>
            No classification history yet. Go to Classify to start.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#0f172a', color:'#64748b' }}>
                  {['#','Timestamp','Final Label','Confidence','Isolation Forest','Random Forest','Anomaly Score','Agreement'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontWeight:500,
                                         borderBottom:'1px solid #334155', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const agree = r.if_label === r.rf_label
                  return (
                    <tr key={r.id} style={{ borderBottom:'1px solid #1e293b',
                                             background: i%2===0 ? '#1e293b' : '#172030' }}>
                      <td style={{ padding:'9px 14px', color:'#475569' }}>{r.id}</td>
                      <td style={{ padding:'9px 14px', color:'#64748b', whiteSpace:'nowrap' }}>
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        <Badge label={r.label} />
                      </td>
                      <td style={{ padding:'9px 14px', color:'#94a3b8' }}>
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding:'9px 14px' }}><Badge label={r.if_label} small /></td>
                      <td style={{ padding:'9px 14px' }}><Badge label={r.rf_label} small /></td>
                      <td style={{ padding:'9px 14px', color:'#94a3b8' }}>
                        {r.anomaly_score?.toFixed(4) ?? '—'}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{ fontSize:11, color: agree ? '#4ade80' : '#fb923c' }}>
                          {agree ? '✓ Agree' : '⚠ Split'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({ label, small }) {
  const isAtk = label === 'ATTACK'
  return (
    <span style={{
      background: isAtk ? '#450a0a' : '#052e16',
      color:      isAtk ? '#f87171' : '#4ade80',
      padding: small ? '1px 8px' : '3px 10px',
      borderRadius: 20, fontSize: small ? 11 : 12, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}
