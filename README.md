# ATS Resume Builder — AI Powered

A full-stack resume builder that tailors your resume to any job description using AI, with real-time ATS score analysis.

**Stack:** React + Vite · Node.js + Express · Groq (Llama 3.3 70B) · Google Gemini fallback

---

## Features

- **Import existing resume** — upload your PDF and auto-fill the form via AI
- **AI Tailoring** — paste a job description and rewrite your resume to match it
- **ATS Score** — frequency-weighted keyword analysis with section-specific scoring
- **PDF Download** — print-to-PDF produces a text-based, ATS-readable file
- **Undo tailoring** — revert to original content in one click

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A free **Groq API key** → [console.groq.com](https://console.groq.com)
- *(Optional)* Gemini API key as fallback → [aistudio.google.com](https://aistudio.google.com)

---

## Setup

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd "resume builder"
```

---

### Step 2 — Install server dependencies

```bash
cd server
npm install
```

---

### Step 3 — Install client dependencies

```bash
cd ../client
npm install
```

---

### Step 4 — Configure environment variables

Inside the `server/` folder, create a `.env` file:

```bash
cd ../server
cp .env.example .env
```

Open `server/.env` and fill in your keys:

```env
GROQ_API_KEY=gsk_your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here   # optional fallback
ANTHROPIC_API_KEY=your_claude_key_here  # optional fallback
PORT=5000
```

> **Get a free Groq key (required):**
> 1. Go to [console.groq.com](https://console.groq.com)
> 2. Sign in with Google
> 3. Click **API Keys → Create API Key**
> 4. Copy and paste into `.env`

---

### Step 5 — Run the backend server

Open a terminal in the `server/` folder:

```bash
cd server
npm start
```

You should see:

```
─── AI Providers ──────────────────────────
Groq:         ✓ active (primary)
Gemini:       ✓ active (fallback 1)
───────────────────────────────────────────
Resume Builder Server running on port 5000
```

---

### Step 6 — Run the frontend

Open a **second terminal** in the `client/` folder:

```bash
cd client
npm run dev
```

You should see:

```
VITE v5.x  ready in 2s
➜  Local:   http://localhost:3000/
```

---

### Step 7 — Open the app

Visit **http://localhost:3000** in your browser.

---

## How to Use

### Option A — Fill the form manually
1. Go to the **Editor** tab
2. Fill in Contact Info, Summary, Work Experience, Education, Skills
3. Paste the **job description** in the right panel
4. Click **Tailor with AI** — AI rewrites your resume to match the JD
5. Check the **ATS Score** panel for keyword analysis
6. Switch to **Preview** tab → Click **Download PDF**

### Option B — Import existing resume
1. Click **Import Resume PDF** in the header
2. Select a text-based PDF resume (not a scanned image)
3. AI extracts all sections and auto-fills the form
4. Continue with step 3 above

---

## Project Structure

```
resume builder/
├── server/
│   ├── index.js          # Express API + AI provider logic
│   ├── package.json
│   └── .env.example      # Copy to .env and add your keys
└── client/
    ├── src/
    │   ├── App.jsx               # Main layout + state
    │   └── components/
    │       ├── ResumeForm.jsx    # All resume input sections
    │       ├── JobDescription.jsx
    │       ├── ResumePreview.jsx # ATS-safe resume template + PDF export
    │       └── ATSScore.jsx      # Score circle + breakdown + keywords
    ├── index.html
    ├── vite.config.js    # Proxies /api → localhost:5000
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tailor-resume` | Rewrites resume JSON to match job description |
| POST | `/api/ats-score` | Calculates keyword-match ATS score locally |
| POST | `/api/parse-resume-pdf` | Extracts resume data from uploaded PDF |

---

## AI Provider Priority

The server tries providers in this order and falls back automatically:

1. **Groq** (Llama 3.3 70B) — free, fast, no daily limits
2. **Google Gemini** (1.5 Flash) — free tier fallback
3. **Anthropic Claude** (Opus 4.6) — paid fallback

---

## Notes on ATS Score

The score shown in the app is a **content match score** — it measures keyword alignment between your resume and the job description. It is **not** the score an external ATS tool gives your PDF file. For best results with real ATS systems:

- Download as PDF using **print-to-PDF** (browser dialog → Save as PDF)
- Avoid image-based PDFs (scanned documents)
- Make sure all relevant skills from the JD appear in your **Skills** section
