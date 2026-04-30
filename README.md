# Exist Count — Steal a Brainrot Dashboard

A Vercel-deployable admin dashboard that displays live animal statistics pulled directly from the Roblox game.

## Features

- 🔐 Login with Game ID + Password
- 🔑 Force password change on first login
- 👥 Admin can create/delete accounts
- 📊 Per-animal stats: Total Exists, Avg Rebirth, Avg Coins, Base Gen/s, Total Gen/s
- 🏆 Highest value owner (username, display name, avatar)
- 🧬 Mutation & trait breakdowns with progress bars
- 🖼️ Animal images fetched from the Steal a Brainrot wiki
- 🔄 Data pushed from the game every 5 minutes via `ExistCountService`

## Default Credentials

| Game ID | Password |
|---------|----------|
| `0`     | `admin`  |

**You will be forced to change the password on first login.**

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Import the repo in [vercel.com](https://vercel.com)
3. Add **Vercel Blob** storage to your project (Storage tab → Create → Blob)
4. Add environment variable: `JWT_SECRET=<any long random string>`
5. Deploy

## Connect the Game

In `ServerScriptService.Services.ExistCountService`, update:

```lua
local REPORT_URL = "https://your-project.vercel.app/api/report"
local GAME_ID    = "0"
local PASSWORD   = "your-new-admin-password"  -- after you change it
```

Then make sure `ExistCountService:Start()` is called from your game loader (e.g. `GameLoader`).

Also enable **HTTP Requests** in Roblox Studio:  
`Game Settings → Security → Allow HTTP Requests ✓`

## API Endpoints

All endpoints (except `/api/report`) require a JWT Bearer token obtained from `/api/auth/login`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/change-password` | Change password (Bearer) |
| `GET`  | `/api/stats` | List all animal names (Bearer) |
| `GET`  | `/api/stats/[animal]` | Get stats for one animal (Bearer) |
| `GET`  | `/api/accounts` | List accounts — admin only (Bearer) |
| `POST` | `/api/accounts` | Create account — admin only (Bearer) |
| `DELETE` | `/api/accounts` | Delete account — admin only (Bearer) |
| `POST` | `/api/report` | Push stats from game (Basic auth: gameId:password) |

## Local Development

```bash
cd "exist count"
cp .env.example .env.local
# Fill in KV_REST_API_URL, KV_REST_API_TOKEN, JWT_SECRET
npm install
npm run dev
```

Without KV env vars, an in-memory store is used (data resets on restart).
