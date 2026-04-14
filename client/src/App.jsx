import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import ResumeForm from './components/ResumeForm';
import JobDescription from './components/JobDescription';
import ResumePreview from './components/ResumePreview';
import ATSScore from './components/ATSScore';
import { FileText, Zap, RotateCcw, Upload } from 'lucide-react';

const defaultResume = {
  name: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  summary: '',
  experience: [
    {
      id: 1,
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    },
  ],
  education: [
    {
      id: 1,
      degree: '',
      field: '',
      school: '',
      location: '',
      graduationDate: '',
      gpa: '',
    },
  ],
  skills: [],
  certifications: [],
  projects: [],
};

// Strip Claude metadata fields before storing as resume content
function extractResumeContent(data) {
  const { atsScore, matchedKeywords, missingKeywords, improvements, ...content } = data;
  return content;
}

export default function App() {
  const [resume, setResume] = useState(defaultResume);
  const [originalResume, setOriginalResume] = useState(null); // snapshot before AI tailor
  const [atsData, setAtsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [isTailored, setIsTailored] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const fileInputRef = React.useRef(null);

  const handlePDFUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/parse-resume-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResume(res.data.data);
      setIsTailored(false);
      setOriginalResume(null);
      setAtsData(null);
      toast.success('Resume imported successfully!');
      setActiveTab('editor');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to parse PDF.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, []);

  const handleTailor = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description first.');
      return;
    }
    const hasContent = resume.name || resume.experience?.[0]?.title || resume.summary;
    if (!hasContent) {
      toast.error('Please fill in your resume details first.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/tailor-resume', { resume, jobDescription });
      const data = res.data.data;

      // Snapshot original so user can undo
      setOriginalResume(resume);

      // Write tailored content back into the form — same template, updated content
      const tailored = extractResumeContent(data);
      const updatedResume = { ...resume, ...tailored };
      setResume(updatedResume);
      setIsTailored(true);

      // Always calculate ATS score locally for consistency — never trust the AI's estimate
      const atsRes = await axios.post('/api/ats-score', {
        resume: updatedResume,
        jobDescription,
      });

      setAtsData({
        score: atsRes.data.score,
        matchedKeywords: atsRes.data.matchedKeywords || [],
        missingKeywords: atsRes.data.missingKeywords || [],
        improvements: data.improvements || [],
      });

      toast.success(`Resume tailored! ATS Score: ${atsRes.data.score}/100`);
      setActiveTab('preview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to tailor resume. Check your API key.');
    } finally {
      setLoading(false);
    }
  }, [resume, jobDescription]);

  const handleUndo = useCallback(() => {
    if (originalResume) {
      setResume(originalResume);
      setOriginalResume(null);
      setIsTailored(false);
      setAtsData(null);
      toast.success('Reverted to original resume.');
    }
  }, [originalResume]);

  const handleLocalATS = useCallback(async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description to calculate ATS score.');
      return;
    }
    try {
      const res = await axios.post('/api/ats-score', { resume, jobDescription });
      setAtsData(res.data);
      toast.success(`ATS Score: ${res.data.score}/100`);
    } catch (err) {
      toast.error('Failed to calculate ATS score.');
    }
  }, [resume, jobDescription]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: 'white',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={22} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>ATS Resume Builder</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handlePDFUpload}
            onClick={(e) => { e.target.value = ''; }}
          />
          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13 }}
          >
            {uploading ? <><span className="spinner" /> Importing...</> : <><Upload size={13} /> Import Resume PDF</>}
          </button>
          {atsData && (
            <div
              style={{
                background: atsData.score >= 92 ? '#16a34a' : atsData.score >= 75 ? '#d97706' : '#dc2626',
                padding: '4px 12px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ATS: {atsData.score}/100
            </div>
          )}
          {isTailored && (
            <button className="btn" onClick={handleUndo}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13 }}>
              <RotateCcw size={13} /> Undo
            </button>
          )}
          <button className="btn" onClick={handleLocalATS}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 13 }}>
            Check ATS Score
          </button>
          <button
            className="btn btn-lg"
            onClick={handleTailor}
            disabled={loading}
            style={{ background: '#f59e0b', color: '#1f2937', fontWeight: 700 }}
          >
            {loading ? (
              <><span className="spinner" style={{ borderTopColor: '#1f2937' }} /> Tailoring...</>
            ) : (
              <><Zap size={16} /> Tailor with AI</>
            )}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          padding: '0 24px',
        }}
      >
        {['editor', 'preview'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: activeTab === tab ? '#2563eb' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'editor' ? '✏️ Editor' : '👁️ Preview'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'editor' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 380px',
              gap: 0,
              flex: 1,
              overflow: 'hidden',
            }}
          >
            {/* Left: Resume Form */}
            <div style={{ overflowY: 'auto', padding: 24 }}>
              <ResumeForm resume={resume} onChange={setResume} />
            </div>
            {/* Right: Job Description + ATS */}
            <div
              style={{
                overflowY: 'auto',
                borderLeft: '1px solid #e5e7eb',
                background: 'white',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <JobDescription value={jobDescription} onChange={setJobDescription} />
              {atsData && <ATSScore data={atsData} />}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f3f4f6' }}>
            <ResumePreview resume={resume} isTailored={isTailored} improvements={atsData?.improvements} />
          </div>
        )}
      </div>
      {/* Footer */}
      <footer style={{
        background: '#1e293b',
        color: '#94a3b8',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        fontSize: 13,
        flexShrink: 0,
      }}>
        <span style={{ color: '#64748b' }}>Built by <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Shubham</span> · Need help?</span>
        <a
          href="mailto:sk706141@gmail.com"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#60a5fa', textDecoration: 'none', fontWeight: 500,
          }}
          onMouseOver={e => e.currentTarget.style.color = '#93c5fd'}
          onMouseOut={e => e.currentTarget.style.color = '#60a5fa'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          sk706141@gmail.com
        </a>
        <a
          href="https://wa.me/917070002753"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#4ade80', textDecoration: 'none', fontWeight: 500,
          }}
          onMouseOver={e => e.currentTarget.style.color = '#86efac'}
          onMouseOut={e => e.currentTarget.style.color = '#4ade80'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          +91-7070002753
        </a>
      </footer>

      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}
