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
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}
