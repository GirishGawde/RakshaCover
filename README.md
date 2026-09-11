# RakshaCover

A Next.js 14 (App Router, TypeScript, Tailwind CSS) project.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Routes

| Route | File |
|---|---|
| `/check` | `app/check/page.tsx` |
| `/report` | `app/report/page.tsx` |
| `/report/status` | `app/report/status/page.tsx` |
| `/report/result` | `app/report/result/page.tsx` |
| `/graph` | `app/graph/page.tsx` |

Each route currently contains a **"Coming soon"** placeholder — replace with your own implementation.

## Project Structure

```
RakshaCover/
├── app/                  # Next.js App Router pages
│   ├── check/
│   ├── report/
│   │   ├── status/
│   │   └── result/
│   └── graph/
├── components/           # Shared React components (add yours here)
└── lib/
    ├── api/              # Backend API call modules — one file per route/feature
    └── types.ts          # Shared TypeScript types
```

### `lib/api/`

Each team member should add their own API module here (e.g. `lib/api/check.ts`, `lib/api/report.ts`) containing all the backend calls for their respective route.
