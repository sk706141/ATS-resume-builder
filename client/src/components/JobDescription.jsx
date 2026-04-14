import React from 'react';
import { Briefcase, Lightbulb } from 'lucide-react';

const tips = [
  'Paste the full job description including requirements and responsibilities',
  'AI extracts keywords and tailors your resume to match',
  'Target a 92+ ATS score to pass applicant tracking systems',
  'Include skills, tools, and technologies mentioned in the JD',
];

export default function JobDescription({ value, onChange }) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <Briefcase size={16} color="#2563eb" />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>Job Description</span>
        {wordCount > 0 && (
          <span className="badge badge-blue">{wordCount} words</span>
        )}
      </div>

      <textarea
        className="form-textarea"
        style={{
          minHeight: 220,
          fontSize: 13,
          lineHeight: 1.6,
          background: '#fafafa',
        }}
        placeholder="Paste the full job description here...

Example:
We are looking for a Senior Software Engineer with:
• 5+ years of experience in React and Node.js
• Experience with AWS, Docker, and Kubernetes
• Strong background in agile methodologies
• Experience building scalable microservices..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Tips */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Lightbulb size={13} color="#d97706" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ATS Tips
          </span>
        </div>
        {tips.map((tip, i) => (
          <p key={i} style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5, marginBottom: i < tips.length - 1 ? 2 : 0 }}>
            · {tip}
          </p>
        ))}
      </div>
    </div>
  );
}
