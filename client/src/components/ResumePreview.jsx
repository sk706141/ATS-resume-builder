import React, { useRef } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ResumePreview({ resume, isTailored, improvements }) {
  const previewRef = useRef(null);

  const handleDownloadPDF = () => {
    const el = previewRef.current;
    if (!el) return;

    // Use print-to-PDF — produces a real text-based PDF (selectable, importable)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resume.name || 'Resume'}_ATS_Optimized</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Merriweather', serif; font-size: 11pt; color: #1a1a1a; }
            @page { margin: 15mm 15mm 15mm 15mm; size: A4; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
    toast.success('Print dialog opened — save as PDF for a text-based file.');
  };

  const hasContent = resume.name || resume.email || resume.summary || resume.experience?.[0]?.title;

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1f2937' }}>Resume Preview</span>
          {isTailored && (
            <span className="badge badge-green">
              <Sparkles size={10} style={{ marginRight: 3 }} />
              AI Tailored
            </span>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={!hasContent}>
          <Download size={14} /> Download PDF
        </button>
      </div>

      {!hasContent ? (
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 60,
            textAlign: 'center',
            border: '2px dashed #e5e7eb',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: 16 }}>
            Fill in your resume details in the Editor tab to see a preview here.
          </p>
        </div>
      ) : (
        <div
          ref={previewRef}
          style={{
            background: 'white',
            maxWidth: 794,
            margin: '0 auto',
            padding: '40px 50px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
            borderRadius: 4,
            fontFamily: "'Merriweather', serif",
            fontSize: '11pt',
            color: '#1a1a1a',
            lineHeight: 1.5,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #1e40af', paddingBottom: 16 }}>
            <h1 style={{ fontSize: '22pt', fontWeight: 700, color: '#1e40af', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
              {resume.name || 'Your Name'}
            </h1>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '4px 16px',
                fontSize: '9pt',
                color: '#374151',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {resume.email && <span>{resume.email}</span>}
              {resume.phone && <span>| {resume.phone}</span>}
              {resume.location && <span>| {resume.location}</span>}
              {resume.linkedin && <span>| {resume.linkedin}</span>}
              {resume.portfolio && <span>| {resume.portfolio}</span>}
            </div>
          </div>

          {/* Summary */}
          {resume.summary && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Professional Summary</SectionHeader>
              <p style={{ fontSize: '10pt', color: '#374151', lineHeight: 1.6 }}>{resume.summary}</p>
            </section>
          )}

          {/* Work Experience */}
          {resume.experience?.some((e) => e.title || e.company) && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Work Experience</SectionHeader>
              {resume.experience
                .filter((e) => e.title || e.company)
                .map((exp) => (
                  <div key={exp.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11pt', color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>
                          {exp.title}
                        </div>
                        <div style={{ fontSize: '10pt', color: '#2563eb', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '9pt', color: '#6b7280', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}{exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {exp.bullets?.filter((b) => b.trim()).length > 0 && (
                      <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                        {exp.bullets.filter((b) => b.trim()).map((bullet, i) => (
                          <li key={i} style={{ fontSize: '10pt', color: '#374151', marginBottom: 3, lineHeight: 1.5 }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </section>
          )}

          {/* Education */}
          {resume.education?.some((e) => e.degree || e.school) && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Education</SectionHeader>
              {resume.education
                .filter((e) => e.degree || e.school)
                .map((edu) => (
                  <div key={edu.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11pt', fontFamily: 'Inter, sans-serif' }}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                        </div>
                        <div style={{ fontSize: '10pt', color: '#2563eb', fontFamily: 'Inter, sans-serif' }}>
                          {edu.school}{edu.location ? ` · ${edu.location}` : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '9pt', color: '#6b7280', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                        {edu.graduationDate}
                        {edu.gpa && <div>GPA: {edu.gpa}</div>}
                      </div>
                    </div>
                  </div>
                ))}
            </section>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Skills</SectionHeader>
              <p style={{ fontSize: '10pt', color: '#374151', lineHeight: 1.8 }}>
                {resume.skills.join(' · ')}
              </p>
            </section>
          )}

          {/* Certifications */}
          {resume.certifications?.some((c) => c.name) && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Certifications</SectionHeader>
              {resume.certifications
                .filter((c) => c.name)
                .map((cert) => (
                  <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '10pt', fontFamily: 'Inter, sans-serif' }}>{cert.name}</span>
                      {cert.issuer && <span style={{ fontSize: '10pt', color: '#6b7280' }}> · {cert.issuer}</span>}
                    </div>
                    {cert.date && <span style={{ fontSize: '9pt', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>{cert.date}</span>}
                  </div>
                ))}
            </section>
          )}

          {/* Projects */}
          {resume.projects?.some((p) => p.name) && (
            <section style={{ marginBottom: 20 }}>
              <SectionHeader>Projects</SectionHeader>
              {resume.projects
                .filter((p) => p.name)
                .map((proj) => (
                  <div key={proj.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '11pt', fontFamily: 'Inter, sans-serif' }}>{proj.name}</span>
                      {proj.technologies && (
                        <span style={{ fontSize: '9pt', color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                          — {proj.technologies}
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <p style={{ fontSize: '10pt', color: '#374151', marginTop: 2, lineHeight: 1.5 }}>
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div
      style={{
        fontSize: '11pt',
        fontWeight: 700,
        color: '#1e40af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        borderBottom: '1px solid #bfdbfe',
        paddingBottom: 4,
        marginBottom: 10,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
