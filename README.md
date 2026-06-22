# Shared Weekly Planner

This is a Vercel-ready version of the weekly planner. It replaces browser-only `localStorage` saving with a shared backend API, so both people can open the same deployed link and see the same edits.

## How it works

- The front end is a Next.js page based on the original HTML planner.
- The backend is `/api/plan`.
- Shared data is stored in Upstash Redis through Vercel environment variables.
- The page refreshes from the shared backend every 4 seconds, so changes made by someone else appear shortly after.

## Deploy on Vercel

1. Unzip this folder.
2. Push it to a GitHub repository.
3. Import the repository into Vercel.
4. In Vercel, add an Upstash Redis database from the Marketplace.
5. Make sure these environment variables are present in the Vercel project:

```bash
KV_REST_API_URL=your_upstash_rest_url
KV_REST_API_TOKEN=your_upstash_rest_token
```

Some Upstash setups use these names instead, and the code supports them too:

```bash
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

6. Redeploy the project.
7. Send the Vercel URL to the other person.

## Run locally

```bash
npm install
npm run dev
```

Without Redis environment variables, the app will open but shared saving will not work. Once the variables are added, edits save through the backend.

## Important note

Anyone with the link can edit the planner. For a private version, add authentication before sharing broadly.
# Omesi-and-Mia-Scheduler
