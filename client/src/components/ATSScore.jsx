import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle, XCircle, Lightbulb, AlertTriangle } from 'lucide-react';

const ScoreCircle = ({ score }) => {
  const [animated, setAnimated] = useState(0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const label = score >= 80 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Weak Match';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={7} />
        <circle cx={45} cy={45} r={radius} fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }} />
      </svg>
      <div style={{ position: 'relative', marginTop: -70, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>/ 100</div>
      </div>
      <span style={{ background: color + '20', color, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700, marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
};

const ScoreBar = ({ label, value, max = 100, color = '#2563eb' }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: '#4b5563', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{value}%</span>
    </div>
    <div style={{ background: '#e5e7eb', borderRadius: 100, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`, height: '100%',
        background: value >= 70 ? '#16a34a' : value >= 45 ? '#d97706' : '#dc2626',
        borderRadius: 100, transition: 'width 1s ease-in-out',
      }} />
    </div>
  </div>
);

export default function ATSScore({ data }) {
  if (!data) return null;
  const { score, matchedKeywords = [], missingKeywords = [], improvements = [], breakdown = {} } = data;

  const checks = [
    { label: 'Quantified achievements (numbers/percentages)', pass: breakdown.hasQuantified },
    { label: 'Strong action verbs in bullet points',          pass: breakdown.hasActionVerbs },
    { label: '6+ skills listed',                             pass: breakdown.hasEnoughSkills },
    { label: '5+ detailed bullet points',                    pass: (breakdown.bulletCount || 0) >= 5 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingUp size={16} color="#2563eb" />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>ATS Score Analysis</span>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <AlertTriangle size={13} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
          <strong>Content match score.</strong> Measures keyword alignment with the job description — not how an ATS parses your PDF.
        </p>
      </div>

      {/* Score circle */}
      <div className="card" style={{ border: `2px solid ${score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'}20`, marginBottom: 12 }}>
        <ScoreCircle score={score} />
      </div>

      {/* Score breakdown bars */}
      <div className="card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Score Breakdown</p>
        <ScoreBar label="Keyword match (freq-weighted)"    value={breakdown.keywordMatch || 0} />
        <ScoreBar label="Keywords in skills section"       value={breakdown.skillsMatch  || 0} />
        <ScoreBar label="Content quality"                  value={Math.round(((breakdown.qualityScore || 0) / 15) * 100)} />
      </div>

      {/* Quality checklist */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quality Checks</p>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {c.pass
              ? <CheckCircle size={13} color="#16a34a" />
              : <XCircle    size={13} color="#dc2626" />}
            <span style={{ fontSize: 11, color: c.pass ? '#15803d' : '#b91c1c' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Keywords */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <CheckCircle size={13} color="#16a34a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>MATCHED ({matchedKeywords.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {matchedKeywords.slice(0, 12).map((kw) => (
              <span key={kw} style={{ background: '#f0fdf4', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>{kw}</span>
            ))}
            {matchedKeywords.length > 12 && <span style={{ fontSize: 10, color: '#9ca3af' }}>+{matchedKeywords.length - 12} more</span>}
          </div>
        </div>
        <div className="card" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <XCircle size={13} color="#dc2626" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>MISSING ({missingKeywords.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {missingKeywords.slice(0, 12).map((kw) => (
              <span key={kw} style={{ background: '#fef2f2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500 }}>{kw}</span>
            ))}
            {missingKeywords.length > 12 && <span style={{ fontSize: 10, color: '#9ca3af' }}>+{missingKeywords.length - 12} more</span>}
          </div>
        </div>
      </div>

      {/* AI improvements */}
      {improvements.length > 0 && (
        <div className="card" style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Lightbulb size={13} color="#d97706" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Changes Made</span>
          </div>
          <ul style={{ paddingLeft: 14 }}>
            {improvements.map((imp, i) => (
              <li key={i} style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.5, marginBottom: 2 }}>{imp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
