# paper-checker

A teacher-facing web app that turns a **question paper** + a **handwritten answer sheet** into a side-by-side, interactive mapping of every question to its answer region on the sheet with AI grading and feedback.

<img width="1354" height="602" alt="image" src="https://github.com/user-attachments/assets/63fcd896-6d5e-4fc9-87d8-05b37b75371c" />
<img width="1353" height="602" alt="image" src="https://github.com/user-attachments/assets/13511fe5-ead0-45d4-85a8-1790280467dd" />

---

## What it does

1. **Upload** a question paper and one (or more) student handwritten answer sheets — PDF or images, up to 10 MB each.
2. **Extract** every question in printed order, preserving the original numbering.
3. **Extract** every student answer with its exact screen position (bounding box) on the answer sheet.
4. **Map** answers to questions, handling out-of-order answers, unanswered questions, and unmatchable answers.
5. **Highlight** the exact answer region on the answer sheet when a question is clicked.
6. **Grade** each answer with marks, per-question AI feedback, and an estimated distinction.

### Example workflow

A teacher uploads **Question Paper A** and **Student Sheet 1** → sees every question listed on the left, clicks a question → the answer region is highlighted on the answer sheet image/PDF on the right, with the question number badged on the box. Switch pages, zoom, and grade each response.

---

## Key features & improvements over the brief

- **Re-evaluate against the same question paper with a NEW answer sheet** — after the first analysis, a teacher can swap in another student's answer sheet and re-run the full pipeline (extraction → mapping → grading) *without re-uploading the question paper*. Each run gets a fresh session, while the question set is preserved (`ChangeAnswerSheetDialog` → `/loading?session=…`).
- **Sub-part questions kept as distinct entries** — `11 (a)` and `11 (b)` are separate, individually selectable questions (sub-parts are not collapsed).
- **Unmatched answers section** — any answer that doesn't fit a question is surfaced separately in an amber "Unmatched Answers" panel instead of being silently dropped.
- **Question-number badge on the highlighted box** — both the image renderer *and* the PDF/canvas renderer draw a Q-label on each highlighted answer region so you always know which question a box belongs to.
- **Resolution-independent highlighting** — bounding boxes are stored as fractions (0–1) of page dimensions, so they stay accurate regardless of image/PDF resolution or zoom.
- **Live progress/status pipeline** — the loading screen reports `uploading → extracting → mapping → grading` stages by polling server status.
- **Session persistence in the browser** — analysis results are cached in `localStorage` so revisiting a session loads instantly without re-calling the API (with a server refetch fallback).
- **Grading distinct from ground truth** — when no answer key is provided, grades are clearly labelled **"AI-estimated"** in the UI and never presented as factual.
- **Resizable split-panel question list** — drag the handle to adjust left/right panel widths; responsive mobile tab switching.

---

## Tech stack & AI

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, React 19, TypeScript, Tailwind 4) — deployed on **Vercel** |
| **Backend** | Express 4 (TypeScript, `tsx` dev, compiled to `dist`) — deployed on **Render** (needs native binaries for PDF→image) |
| **Shared** | `packages/shared-types` — shared TypeScript interfaces via npm workspaces |
| **AI model** | **Google Gemini Flash** (`gemini-3.6-flash`) via `@google/generative-ai`, with automatic **exponential backoff + retry** on rate limits |
| **PDF rendering** | `pdfjs-dist` (web) + `pdf2pic`/`poppler` (API, native binaries) |
| **File upload** | `multer` (10 MB limit, client + server enforced) |

### What the AI does
- **Reads the question paper** and extracts every question (with numbering/sub-parts).
- **Extracts** each handwritten answer **plus its bounding-box region** and page from the answer sheet.
- **Maps** answers to the correct questions (handles out-of-order answers and unanswered items).
- **Grades** each answer with marks and per-question feedback, flagging whether the grade is estimate-based.

All AI calls go through the backend (`/api/…`) — the frontend never talks to Gemini directly, so the API key stays server-side.

---

## Monorepo layout

```
apps/web       Next.js frontend (Vercel)
apps/api       Express backend, Gemini + mapping/grading pipeline (Render)
packages/shared-types   Shared TS types
```

### API routes (`apps/api`)
- `GET /api/health` — liveness
- `POST /api/upload` — multipart upload → starts extraction
- `GET /api/status/:id` — progress polling (`uploading/extracting/mapping/grading/done/error`)
- `GET /api/mapping/:id` — questions + mappings + unmatched answers + image URLs
- `GET /api/grading/:id` — per-question marks, feedback, estimated flag

### Frontend flow (`apps/web`)
- `/` — upload both files
- `/loading?session=…` — stage-by-stage progress
- `/mapping?session=…` — side-by-side question list + answer sheet highlighter

All fetch calls go through `apps/web/src/lib/api-client.ts` using `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

---

## Running locally

```bash
npm install          # root — installs all workspaces
npm run dev          # starts both api (port 4000) and web (port 3000)
npm run dev:api      # Express only — tsx watch src/index.ts
npm run dev:web      # Next.js only
npm run build        # web then api
npm run start        # api production: node dist/index.js
```

### Env setup
- `apps/api/.env` — copy from `.env.example`. Required: `GEMINI_API_KEY`. Also used: `PORT`, `ALLOWED_ORIGIN`, `RENDER_EXTERNAL_URL`.
- `apps/web/.env.local` — copy from `.env.local.example`. Optional: `NEXT_PUBLIC_API_URL`.

### Verifying changes
```bash
npm run lint --workspace=apps/web              # ESLint
npm run typecheck --workspace=apps/api         # tsc --noEmit
```

---

## Deployment
- **Web** → Vercel (`apps/web`).
- **API** → Render (`apps/api` as root directory; needs native binaries for PDF→image). Set `GEMINI_API_KEY` and `RENDER_EXTERNAL_URL` (the API's public HTTPS URL) so generated image URLs use HTTPS — this avoids browser **mixed-content** blocking when the page is served over HTTPS.
- Note: the API uses an in-memory `Map` for sessions (no database). Render's free tier clears it when the instance idles, so in-flight sessions are not durable across restarts (a keepalive pings `/api/health` every 10 minutes to reduce this).

---

## Edge cases handled
- Questions answered **out of order** (mapped to the correct question regardless of sheet order)
- **Unanswered** questions (no answer found → flagged)
- **Unmatched** answers (answer present but no matching question → surfaced in a separate panel)
- **Multi-page** answers (highlighted across pages)
- **Sub-parts** (`11 (a)`, `11 (b)`) as separate entries
- **Rate limits** on Gemini (exponential backoff + retry)
- **Mixed-content** / HTTPS image URLs on Render

## Assumptions & limitations
- No authentication or database (per the brief) — sessions are in-memory and localStorage-cached.
- Grading is **AI-estimated** unless an answer key is provided; estimates may vary.
- Accurate handwritten ROI highlighting depends on Gemini's box extraction and the quality/rotation of the uploaded sheet.
- 10 MB per-file upload limit.

---

## Submission details
- **AI model/API used:** Google Gemini (`gemini-3.6-flash`) with automatic rate-limit retries.
- **Approach:** back-end pipeline (extraction → mapping → grading) orchestrated by Express, driven by Gemini vision calls; frontend renders results with resolution-independent overlays, per-question highlighting, and progress-polled UX.
