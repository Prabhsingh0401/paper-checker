# paper-checker

Teacher-facing web app: upload a question paper + handwritten answer sheet, extract questions and answers via Gemini Flash, map answers to questions, and optionally grade.

## Running locally

```bash
npm install
npm run dev:api   # Express on port 4000
npm run dev:web   # Next.js on port 3000
```

The Next.js homepage calls the Express `/api/health` endpoint to verify connectivity.
