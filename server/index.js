import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const PDFParser = _require('pdf2json');
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── AI Clients ───────────────────────────────────────────────────────────────
function validKey(key) {
  return !!(key && !key.startsWith('your_') && key.length > 10);
}

const groqClient   = validKey(process.env.GROQ_API_KEY)       ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const geminiClient = validKey(process.env.GEMINI_API_KEY)     ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const anthropic    = validKey(process.env.ANTHROPIC_API_KEY)  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

console.log('─── AI Providers ──────────────────────────');
console.log('Groq:        ', groqClient   ? '✓ active (primary)'   : '✗ no key');
console.log('Gemini:      ', geminiClient ? '✓ active (fallback 1)' : '✗ no key');
console.log('Anthropic:   ', anthropic    ? '✓ active (fallback 2)' : '✗ no key');
console.log('───────────────────────────────────────────');

// ─── Shared text AI (Groq → Gemini → Claude) ─────────────────────────────────
async function aiText(prompt) {
  // 1. Groq (free, fast, Llama 3.3 70B)
  if (groqClient) {
    try {
      const res = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.3,
      });
      console.log('AI provider: Groq (Llama 3.3 70B)');
      return res.choices[0].message.content;
    } catch (err) {
      console.warn('Groq failed:', err.message);
    }
  }

  // 2. Gemini (free tier)
  if (geminiClient) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      console.log('AI provider: Gemini');
      return result.response.text();
    } catch (err) {
      console.warn('Gemini failed:', err.message);
    }
  }

  // 3. Claude (paid fallback)
  if (anthropic) {
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    console.log('AI provider: Claude');
    return msg.content[0].text;
  }

  throw new Error('No AI provider available. Add GROQ_API_KEY to server/.env (free at console.groq.com) or reach out to Shubham.');
}

// ─── PDF text extractor + AI (Groq → Gemini → Claude) ────────────────────────
async function aiPDF(fileBuffer, prompt) {
  // Extract raw text from PDF using pdf2json
  let pdfText = '';
  try {
    pdfText = await new Promise((resolve, reject) => {
      const parser = new PDFParser(null, 1);
      parser.on('pdfParser_dataReady', () => resolve(parser.getRawTextContent()));
      parser.on('pdfParser_dataError', (err) => reject(err.parserError));
      parser.parseBuffer(fileBuffer);
    });
  } catch (err) {
    console.warn('pdf2json extraction failed:', err.message);
  }

  // If we got enough text, send to Groq
  if (pdfText.trim().length > 100) {
    const fullPrompt = `${prompt}\n\n## Extracted Resume Text:\n${pdfText}`;
    return aiText(fullPrompt);
  }

  // Not enough text — likely an image-based or scanned PDF
  if (pdfText.trim().length > 0 && pdfText.trim().length <= 100) {
    throw new Error('Could not extract enough text from this PDF. This usually happens with image-based PDFs. Please upload a text-based PDF resume (one where you can select/copy text).');
  }

  // If pdf2json got nothing, fall back to Gemini native PDF support
  if (geminiClient) {
    try {
      const base64 = fileBuffer.toString('base64');
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: 'application/pdf' } },
        { text: prompt },
      ]);
      console.log('AI provider: Gemini (native PDF)');
      return result.response.text();
    } catch (err) {
      console.warn('Gemini PDF failed:', err.message);
    }
  }

  // Claude native PDF fallback
  if (anthropic) {
    const base64 = fileBuffer.toString('base64');
    const msg = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });
    console.log('AI provider: Claude (native PDF)');
    return msg.content[0].text;
  }

  throw new Error('No AI provider available. Add GROQ_API_KEY to server/.env (free at console.groq.com).');
}

// ─── Parse JSON safely ────────────────────────────────────────────────────────
function parseJSON(text) {
  // Strip markdown fences if present
  const clean = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Tailor resume to job description
app.post('/api/tailor-resume', async (req, res) => {
  const { resume, jobDescription } = req.body;
  if (!resume || !jobDescription)
    return res.status(400).json({ error: 'Resume and job description are required.' });

  const prompt = `You are an expert resume writer and ATS optimization specialist. Tailor the resume below to the job description, targeting a 92+ ATS score.

## Job Description:
${jobDescription}

## Current Resume (JSON):
${JSON.stringify(resume, null, 2)}

## Instructions:
1. Extract all keywords, skills, and technologies from the job description and integrate them naturally.
2. Rewrite the summary to directly address the role using JD keywords in the first 2 sentences.
3. Rewrite bullet points to: start with strong action verbs, quantify achievements, mirror JD language, focus on impact.
4. Reorder skills to prioritize those mentioned in the JD.
5. Follow ATS rules: standard section headers, no tables/graphics, spell out abbreviations.

## Output:
Return a JSON object with the EXACT same structure as the input resume, plus ONE extra field:
- "improvements": array of 3-5 short strings describing the key changes you made

Do NOT include atsScore, matchedKeywords, or missingKeywords — those are calculated separately.
Return ONLY valid JSON. No markdown fences, no explanation outside the JSON.`;

  try {
    const text = await aiText(prompt);
    res.json({ success: true, data: parseJSON(text) });
  } catch (err) {
    console.error('Tailor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Local ATS score (no AI needed)
app.post('/api/ats-score', (req, res) => {
  const { resume, jobDescription } = req.body;
  if (!resume || !jobDescription)
    return res.status(400).json({ error: 'Resume and job description are required.' });

  // ── Section-specific resume text ──
  const skillsText  = (resume.skills || []).join(' ').toLowerCase();
  const summaryText = (resume.summary || '').toLowerCase();
  const bulletsText = (resume.experience || []).flatMap(e => e.bullets || []).join(' ').toLowerCase();
  const fullText    = buildResumeText(resume).toLowerCase();

  // ── Extract JD keywords with frequency weighting ──
  const { keywords: jdKeywords, freq } = extractJDKeywords(jobDescription);

  // ── Match keywords, weight by frequency and section ──
  const matchedKeywords = [];
  const missingKeywords = [];

  for (const kw of jdKeywords) {
    const kwLower = kw.toLowerCase();
    if (fullText.includes(kwLower)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  // ── Weighted keyword score (freq-weighted) ──
  let totalWeight = 0, matchedWeight = 0;
  for (const kw of jdKeywords) {
    const w = freq.get(kw.toLowerCase()) || 1;
    totalWeight += w;
    if (fullText.includes(kw.toLowerCase())) matchedWeight += w;
  }
  const keywordScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;

  // ── Skills section match (are JD keywords in the skills section?) ──
  const skillsMatched = jdKeywords.filter(kw => skillsText.includes(kw.toLowerCase()));
  const skillsScore = jdKeywords.length > 0 ? (skillsMatched.length / jdKeywords.length) * 100 : 0;

  // ── Content quality score (max 15 pts) ──
  let quality = 0;
  const quantifiedRx = /\d+\s?%|\$[\d,]+|\d+x\b|\d+\s?(users|clients|projects|million|thousand|team members|engineers)/i;
  const actionVerbRx  = /\b(led|spearheaded|architected|engineered|built|developed|designed|launched|deployed|scaled|optimized|reduced|increased|delivered|achieved|automated|migrated|mentored|managed|grew|drove|established|streamlined)\b/i;
  const hasQuantified   = quantifiedRx.test(bulletsText);
  const hasActionVerbs  = actionVerbRx.test(bulletsText);
  const hasSummary      = summaryText.length > 80;
  const hasEnoughSkills = (resume.skills || []).length >= 6;
  const hasExp          = (resume.experience || []).filter(e => e.title).length > 0;
  const hasEdu          = (resume.education  || []).filter(e => e.degree).length > 0;
  const bulletCount     = (resume.experience || []).flatMap(e => (e.bullets || []).filter(b => b.trim().length > 10)).length;

  if (hasQuantified)   quality += 4;
  if (hasActionVerbs)  quality += 3;
  if (hasSummary)      quality += 2;
  if (hasEnoughSkills) quality += 2;
  if (hasExp && hasEdu) quality += 2;
  if (bulletCount >= 5) quality += 2;

  // ── Final weighted score ──
  // 60% keyword match, 25% skills section match, 15% quality
  const finalScore = Math.min(95, Math.round(
    keywordScore  * 0.60 +
    skillsScore   * 0.25 +
    quality
  ));

  res.json({
    score: finalScore,
    matchedKeywords,
    missingKeywords,
    breakdown: {
      keywordMatch:   Math.round(keywordScore),
      skillsMatch:    Math.round(skillsScore),
      qualityScore:   quality,
      hasQuantified,
      hasActionVerbs,
      hasEnoughSkills,
      bulletCount,
    },
  });
});

// Parse uploaded resume PDF
app.post('/api/parse-resume-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'File must be a PDF.' });

  const prompt = `Extract all information from this resume and return a single JSON object with exactly this structure. Fill every field you can find; leave unknown fields as empty string or empty array.

{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "portfolio": "",
  "summary": "",
  "experience": [{ "id": 1, "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "current": false, "bullets": [""] }],
  "education": [{ "id": 1, "degree": "", "field": "", "school": "", "location": "", "graduationDate": "", "gpa": "" }],
  "skills": [],
  "certifications": [{ "id": 1, "name": "", "issuer": "", "date": "" }],
  "projects": [{ "id": 1, "name": "", "description": "", "technologies": "", "link": "" }]
}

Rules:
- Each entry must have a unique numeric id (1, 2, 3...)
- bullets is an array of strings, one per bullet point
- skills is a flat array of strings
- current is true only if the person is still in that role
- Return ONLY valid JSON, no markdown fences, no explanation.`;

  try {
    const text = await aiPDF(req.file.buffer, prompt);
    res.json({ success: true, data: parseJSON(text) });
  } catch (err) {
    console.error('PDF parse error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildResumeText(r) {
  return [
    r.name, r.email, r.phone, r.location, r.linkedin, r.summary,
    ...(r.experience || []).map((e) => `${e.title} ${e.company} ${(e.bullets || []).join(' ')}`),
    ...(r.education || []).map((e) => `${e.degree} ${e.school} ${e.field}`),
    ...(r.skills || []),
    ...(r.certifications || []).map((c) => `${c.name} ${c.issuer}`),
    ...(r.projects || []).map((p) => `${p.name} ${p.description}`),
  ].filter(Boolean).join(' ');
}

// Extracts meaningful keywords from a job description with frequency counts.
// Returns deduped keywords (phrases supersede their component words).
function extractJDKeywords(jd) {
  const stop = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','have','has','had','do','does',
    'did','will','would','could','should','may','might','shall','can','need',
    'we','you','our','your','their','this','that','these','those','it','its',
    'as','if','so','not','also','all','any','more','other','than','then',
    'into','over','such','about','what','which','when','where','who','how',
    'must','well','very','just','use','using','used','work','working','strong',
    'good','great','team','role','join','help','able','new','make','get',
    'experience','years','year','least','plus','skills','knowledge','ability',
  ]);

  const text = jd.toLowerCase();
  const freq = new Map();

  // Step 1 — extract 2–3 word phrases first (higher specificity)
  const phraseSet = new Set();
  const phraseRx = /\b([a-z][a-z0-9+#.]*(?:\s+[a-z][a-z0-9+#.]*){1,2})\b/g;
  let m;
  while ((m = phraseRx.exec(text)) !== null) {
    const phrase = m[1].trim();
    const words  = phrase.split(/\s+/);
    // skip if all words are stop words or phrase is too short
    if (words.every(w => stop.has(w))) continue;
    if (phrase.length < 4) continue;
    freq.set(phrase, (freq.get(phrase) || 0) + 1);
    phraseSet.add(phrase);
  }

  // Step 2 — single words (only if NOT already covered by a matched phrase)
  const wordRx = /\b([a-z][a-z0-9+#.]{2,})\b/g;
  const coveredByPhrase = (word) => [...phraseSet].some(p => p.includes(word));
  while ((m = wordRx.exec(text)) !== null) {
    const word = m[1];
    if (stop.has(word)) continue;
    if (word.length < 4) continue;
    if (coveredByPhrase(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Step 3 — sort by frequency desc, take top 50
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([kw]) => kw);

  return { keywords, freq };
}

app.listen(PORT, () => console.log(`\nResume Builder Server running on port ${PORT}, published by Shubham\n`));
