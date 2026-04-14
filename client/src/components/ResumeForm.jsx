import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div
        className="card-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span className="card-title">
          <span>{icon}</span>
          {title}
        </span>
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </div>
      {open && <div className="card-body">{children}</div>}
    </div>
  );
};

export default function ResumeForm({ resume, onChange }) {
  const update = (field, value) => onChange({ ...resume, [field]: value });

  // Experience helpers
  const addExp = () =>
    update('experience', [
      ...resume.experience,
      { id: Date.now(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] },
    ]);
  const removeExp = (id) => update('experience', resume.experience.filter((e) => e.id !== id));
  const updateExp = (id, field, value) =>
    update('experience', resume.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  const addBullet = (id) =>
    update('experience', resume.experience.map((e) => (e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e)));
  const updateBullet = (id, idx, value) =>
    update('experience', resume.experience.map((e) =>
      e.id === id ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) } : e));
  const removeBullet = (id, idx) =>
    update('experience', resume.experience.map((e) =>
      e.id === id ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e));

  // Education helpers
  const addEdu = () =>
    update('education', [
      ...resume.education,
      { id: Date.now(), degree: '', field: '', school: '', location: '', graduationDate: '', gpa: '' },
    ]);
  const removeEdu = (id) => update('education', resume.education.filter((e) => e.id !== id));
  const updateEdu = (id, field, value) =>
    update('education', resume.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  // Skills
  const [skillInput, setSkillInput] = useState('');
  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      const skills = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
      update('skills', [...new Set([...resume.skills, ...skills])]);
      setSkillInput('');
    }
  };
  const removeSkill = (skill) => update('skills', resume.skills.filter((s) => s !== skill));

  // Certifications
  const addCert = () =>
    update('certifications', [...resume.certifications, { id: Date.now(), name: '', issuer: '', date: '' }]);
  const removeCert = (id) => update('certifications', resume.certifications.filter((c) => c.id !== id));
  const updateCert = (id, field, value) =>
    update('certifications', resume.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)));

  // Projects
  const addProject = () =>
    update('projects', [...resume.projects, { id: Date.now(), name: '', description: '', technologies: '', link: '' }]);
  const removeProject = (id) => update('projects', resume.projects.filter((p) => p.id !== id));
  const updateProject = (id, field, value) =>
    update('projects', resume.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  return (
    <div>
      {/* Contact Info */}
      <Section title="Contact Information" icon="👤" defaultOpen>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="John Smith" value={resume.name}
              onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" placeholder="john@email.com" value={resume.email}
              onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="+1 (555) 000-0000" value={resume.phone}
              onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" placeholder="San Francisco, CA" value={resume.location}
              onChange={(e) => update('location', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input className="form-input" placeholder="linkedin.com/in/johnsmith" value={resume.linkedin}
              onChange={(e) => update('linkedin', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Portfolio / Website</label>
            <input className="form-input" placeholder="johnsmith.dev" value={resume.portfolio}
              onChange={(e) => update('portfolio', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Summary */}
      <Section title="Professional Summary" icon="📝">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Summary (ATS Tip: Include keywords from job description)</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: 120 }}
            placeholder="Results-driven Software Engineer with 5+ years of experience building scalable web applications..."
            value={resume.summary}
            onChange={(e) => update('summary', e.target.value)}
          />
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
          {resume.summary.length} characters · Recommended: 200-400
        </p>
      </Section>

      {/* Work Experience */}
      <Section title="Work Experience" icon="💼">
        {resume.experience.map((exp, index) => (
          <div
            key={exp.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Position {index + 1}
              </span>
              {resume.experience.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={() => removeExp(exp.id)}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input className="form-input" placeholder="Senior Software Engineer" value={exp.title}
                  onChange={(e) => updateExp(exp.id, 'title', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input className="form-input" placeholder="Google LLC" value={exp.company}
                  onChange={(e) => updateExp(exp.id, 'company', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Mountain View, CA" value={exp.location}
                  onChange={(e) => updateExp(exp.id, 'location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" placeholder="Jan 2022" value={exp.startDate}
                  onChange={(e) => updateExp(exp.id, 'startDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" placeholder="Present" value={exp.current ? 'Present' : exp.endDate}
                  disabled={exp.current}
                  onChange={(e) => updateExp(exp.id, 'endDate', e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input type="checkbox" id={`current-${exp.id}`} checked={exp.current}
                  onChange={(e) => updateExp(exp.id, 'current', e.target.checked)}
                  style={{ width: 16, height: 16 }} />
                <label htmlFor={`current-${exp.id}`} style={{ fontSize: 13, color: '#4b5563', cursor: 'pointer' }}>
                  Currently working here
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Bullet Points (ATS Tip: Use action verbs + numbers)
              </label>
              {exp.bullets.map((bullet, bIdx) => (
                <div key={bIdx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: '#9ca3af', marginTop: 8, flexShrink: 0 }}>•</span>
                  <input
                    className="form-input"
                    placeholder="Led development of microservices architecture, reducing API response time by 40%"
                    value={bullet}
                    onChange={(e) => updateBullet(exp.id, bIdx, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {exp.bullets.length > 1 && (
                    <button className="btn btn-sm btn-ghost" onClick={() => removeBullet(exp.id, bIdx)}
                      style={{ padding: '6px 8px', flexShrink: 0 }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button className="btn btn-sm btn-ghost" onClick={() => addBullet(exp.id)} style={{ marginTop: 4 }}>
                <Plus size={12} /> Add Bullet
              </button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={addExp} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Add Work Experience
        </button>
      </Section>

      {/* Education */}
      <Section title="Education" icon="🎓">
        {resume.education.map((edu, index) => (
          <div
            key={edu.id}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Education {index + 1}</span>
              {resume.education.length > 1 && (
                <button className="btn btn-sm btn-danger" onClick={() => removeEdu(edu.id)}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Degree *</label>
                <input className="form-input" placeholder="Bachelor of Science" value={edu.degree}
                  onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Field of Study *</label>
                <input className="form-input" placeholder="Computer Science" value={edu.field}
                  onChange={(e) => updateEdu(edu.id, 'field', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">School / University *</label>
                <input className="form-input" placeholder="MIT" value={edu.school}
                  onChange={(e) => updateEdu(edu.id, 'school', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Cambridge, MA" value={edu.location}
                  onChange={(e) => updateEdu(edu.id, 'location', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Graduation Date</label>
                <input className="form-input" placeholder="May 2020" value={edu.graduationDate}
                  onChange={(e) => updateEdu(edu.id, 'graduationDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GPA (optional)</label>
                <input className="form-input" placeholder="3.8/4.0" value={edu.gpa}
                  onChange={(e) => updateEdu(edu.id, 'gpa', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={addEdu} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Add Education
        </button>
      </Section>

      {/* Skills */}
      <Section title="Skills" icon="⚡">
        <div className="form-group">
          <label className="form-label">Add Skills (press Enter or use commas)</label>
          <input
            className="form-input"
            placeholder="React, Node.js, Python, AWS..."
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {resume.skills.map((skill) => (
            <span
              key={skill}
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                padding: '4px 10px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
              onClick={() => removeSkill(skill)}
              title="Click to remove"
            >
              {skill} ×
            </span>
          ))}
        </div>
        {resume.skills.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
            No skills added yet. Type and press Enter.
          </p>
        )}
      </Section>

      {/* Certifications */}
      <Section title="Certifications" icon="🏆" defaultOpen={false}>
        {resume.certifications.map((cert) => (
          <div key={cert.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Certification</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeCert(cert.id)}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="grid-3">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Name</label>
                <input className="form-input" placeholder="AWS Solutions Architect" value={cert.name}
                  onChange={(e) => updateCert(cert.id, 'name', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Issuer</label>
                <input className="form-input" placeholder="Amazon" value={cert.issuer}
                  onChange={(e) => updateCert(cert.id, 'issuer', e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-input" placeholder="2023" value={cert.date}
                  onChange={(e) => updateCert(cert.id, 'date', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={addCert} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Add Certification
        </button>
      </Section>

      {/* Projects */}
      <Section title="Projects" icon="🚀" defaultOpen={false}>
        {resume.projects.map((proj) => (
          <div key={proj.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Project</span>
              <button className="btn btn-sm btn-danger" onClick={() => removeProject(proj.id)}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-input" placeholder="E-Commerce Platform" value={proj.name}
                  onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Technologies</label>
                <input className="form-input" placeholder="React, Node.js, MongoDB" value={proj.technologies}
                  onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" style={{ minHeight: 60 }}
                placeholder="Built a full-stack e-commerce platform serving 10,000+ daily active users..."
                value={proj.description}
                onChange={(e) => updateProject(proj.id, 'description', e.target.value)} />
            </div>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={addProject} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Add Project
        </button>
      </Section>
    </div>
  );
}
