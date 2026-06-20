import React, { useEffect, useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis,
         BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
         CartesianGrid, Cell } from 'recharts'

const API = '/api'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/stats`).then(r => r.json()).then(d => {
      if (d.status === 'success') setStats(d)
      else setError(d.error)
    }).catch(() => setError('Cannot reach API'))
  }, [])

  if (error) return (
    <div style={{ background:'#450a0a', border:'1px solid #7f1d1d', borderRadius:10,
                  padding:'12px 16px', color:'#fca5a5', fontSize:13 }}>⚠ {error}</div>
  )
  if (!stats) return <div style={{ color:'#64748b' }}>Loading stats...</div>

  const rf = stats.model_metrics?.random_forest    ?? {}
  const iF = stats.model_metrics?.isolation_forest ?? {}

  const compareData = [
    { metric:'Accuracy',  RF: pct(rf.accuracy),  IF: pct(iF.accuracy)  },
    { metric:'Precision', RF: pct(rf.precision), IF: pct(iF.precision) },
    { metric:'Recall',    RF: pct(rf.recall),    IF: pct(iF.recall)    },
    { metric:'F1 Score',  RF: pct(rf.f1),        IF: pct(iF.f1)        },
    { metric:'ROC-AUC',   RF: pct(rf.roc_auc),   IF: pct(iF.roc_auc)  },
  ]

  const fprData = [
    { name:'Random Forest',    fpr: pct(rf.false_positive_rate) },
    { name:'Isolation Forest', fpr: pct(iF.false_positive_rate) },
  ]

  const cm_rf = rf.confusion_matrix ?? {}
  const cm_if = iF.confusion_matrix ?? {}

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Model Statistics</h1>
      <p style={{ color:'#64748b', fontSize:14, marginBottom:24 }}>
        Performance metrics from training — {stats.training_samples?.toLocaleString()} training samples ·{' '}
        {stats.feature_count} features
      </p>

      {/* Metrics table */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <MetricTable title="Random Forest"    metrics={rf} color="#38bdf8" />
        <MetricTable title="Isolation Forest" metrics={iF} color="#a78bfa" />
      </div>

      {/* Comparison bar chart */}
      <div style={{ background:'#1e293b', borderRadius:12, padding:20,
                    border:'1px solid #334155', marginBottom:24 }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:'#94a3b8', marginBottom:16 }}>
          Model Comparison
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compareData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="metric" style={{ fontSize:11 }} tick={{ fill:'#64748b' }} />
            <YAxis domain={[0,100]} tickFormatter={v => v+'%'} style={{ fontSize:11 }} tick={{ fill:'#64748b' }} />
            <Tooltip formatter={v => v.toFixed(1)+'%'} contentStyle={{ background:'#0f172a', border:'1px solid #334155' }} />
            <Bar dataKey="RF" name="Random Forest"    fill="#38bdf8" radius={[4,4,0,0]} />
            <Bar dataKey="IF" name="Isolation Forest" fill="#a78bfa" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FPR + Confusion Matrices */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'#1e293b', borderRadius:12, padding:20, border:'1px solid #334155' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#94a3b8', marginBottom:16 }}>
            False Positive Rate
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={fprData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" domain={[0,100]} tickFormatter={v=>v+'%'} tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fill:'#94a3b8', fontSize:11 }} />
              <Tooltip formatter={v => v.toFixed(2)+'%'} contentStyle={{ background:'#0f172a', border:'1px solid #334155' }} />
              <Bar dataKey="fpr" radius={[0,4,4,0]}>
                <Cell fill="#38bdf8" />
                <Cell fill="#a78bfa" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize:11, color:'#475569', marginTop:8 }}>
            Lower is better — fewer false alarms
          </p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <ConfusionMatrix title="Random Forest"    cm={cm_rf} color="#38bdf8" />
          <ConfusionMatrix title="Isolation Forest" cm={cm_if} color="#a78bfa" />
        </div>
      </div>
    </div>
  )
}

function pct(v) { return v !== undefined ? parseFloat((v * 100).toFixed(2)) : 0 }

function MetricTable({ title, metrics, color }) {
  const rows = [
    ['Accuracy',           metrics.accuracy],
    ['Precision',          metrics.precision],
    ['Recall (TPR)',       metrics.recall],
    ['F1 Score',           metrics.f1],
    ['ROC-AUC',            metrics.roc_auc],
    ['False Positive Rate',metrics.false_positive_rate],
  ]
  return (
    <div style={{ background:'#1e293b', borderRadius:12, padding:18, border:'1px solid #334155' }}>
      <h3 style={{ fontSize:14, fontWeight:600, color, marginBottom:14 }}>{title}</h3>
      {rows.map(([k,v]) => (
        <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                               padding:'7px 0', borderBottom:'1px solid #1e293b', fontSize:13 }}>
          <span style={{ color:'#64748b' }}>{k}</span>
          <span style={{ color:'#f1f5f9', fontWeight:600 }}>
            {v !== undefined ? (v * 100).toFixed(2)+'%' : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function ConfusionMatrix({ title, cm, color }) {
  const cells = [
    { label:'TN', val: cm.tn, bg:'#052e16', fg:'#4ade80' },
    { label:'FP', val: cm.fp, bg:'#450a0a', fg:'#f87171' },
    { label:'FN', val: cm.fn, bg:'#450a0a', fg:'#fbbf24' },
    { label:'TP', val: cm.tp, bg:'#052e16', fg:'#4ade80' },
  ]
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:14, border:'1px solid #334155', flex:1 }}>
      <div style={{ fontSize:12, fontWeight:600, color, marginBottom:10 }}>{title} — Confusion Matrix</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {cells.map(c => (
          <div key={c.label} style={{ background:c.bg, borderRadius:8, padding:'10px 8px',
                                       textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700, color:c.fg }}>{c.val?.toLocaleString() ?? '—'}</div>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, marginTop:6 }}>
        <div style={{ fontSize:10, color:'#475569', textAlign:'center' }}>Pred: BENIGN</div>
        <div style={{ fontSize:10, color:'#475569', textAlign:'center' }}>Pred: ATTACK</div>
      </div>
    </div>
  )
}
