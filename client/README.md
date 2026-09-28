# Ahmedabad Metro Asset Operations

React operations console for browsing infrastructure assets, inspecting per-asset audit history, reporting issues, and recording completed repairs.

## Run locally

1. Install client dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend API URL, including `/api`.
3. Start the backend, then run `npm run dev` from this directory.

The default API URL is `http://localhost:5000/api`.

## Deploy to Vercel

Set `VITE_API_BASE_URL` in the Vercel project's Environment Variables to the deployed API URL, including `/api`, then redeploy. Configure the backend CORS allowlist to include the deployed frontend origin before exposing the service publicly.

The identity panel accepts an existing bearer token in memory for the current page session. It is not persisted in local storage. The Citizen, Technician, and Admin selector previews workflows only; the API remains responsible for verifying token identity and role authorization.

## Checks

- `npm run lint`
- `npm run build`
