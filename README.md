# TalkPH - Philippines Community Forum

A modern digital town hall for the Philippines. Connect, share, and engage with your community on topics that matter.

## Features

- 🏠 **Home Feed** - Browse posts from various categories
- 📝 **Create Posts** - Share discussions, questions, concerns, polls, and more
- 💬 **Comments** - Engage in conversations
- 🔔 **Notifications** - Stay updated on replies and reactions
- 👤 **Profiles** - Customize your profile with avatar and bio
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **PWA** - Install as a mobile app
- 🔒 **Authentication** - Secure login with NextAuth.js
- ⚡ **Real-time** - WebSocket support for live updates

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v4
- **Real-time**: Socket.io

---

## 🚀 Deploy to Render

### Option A: One-Click Deploy (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/talkph)

### Option B: Manual Deploy

#### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - TalkPH"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/talkph.git

# Push to GitHub
git push -u origin main
```

#### Step 2: Create PostgreSQL Database on Render

1. Go to [render.com](https://render.com) and sign up/login
2. Go to **Dashboard** → **New** → **PostgreSQL**
3. Configure:
   - **Name**: `talkph-db`
   - **Region**: Singapore (closest to Philippines)
   - **Plan**: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (used by services in same Render account)

#### Step 3: Create Main Web Service

1. Go to **Dashboard** → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `talkph`
   - **Region**: Singapore
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `bun install && bun run db:generate && bun run build`
   - **Start Command**: `bun run start`
   - **Plan**: Free

4. Add Environment Variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Paste the Internal Database URL from Step 2 |
   | `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://talkph.onrender.com` (your service URL) |
   | `WEBSOCKET_URL` | `https://talkph-ws.onrender.com` (for WebSocket service) |

5. Click **Create Web Service**

#### Step 4: Create WebSocket Service

1. Go to **Dashboard** → **New** → **Web Service**
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `talkph-ws`
   - **Region**: Singapore
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `cd mini-services/websocket-service && bun install`
   - **Start Command**: `cd mini-services/websocket-service && PORT=$PORT bun index.ts`
   - **Plan**: Free

4. Add Environment Variables:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |

5. Click **Create Web Service**

#### Step 5: Initialize Database

After the main service is deployed, run migrations:

1. Go to your `talkph` service → **Shell** tab
2. Run:
   ```bash
   bun run db:push
   bun run db:seed
   ```

Or use the **Prisma Studio** to manage your database.

---

## 🛠️ Local Development

```bash
# Install dependencies
bun install

# Setup database
cp .env.example .env
# Edit .env with your database URL
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── page.tsx           # Main page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
├── store/                # Zustand store
└── types/                # TypeScript types
mini-services/
└── websocket-service/    # Real-time WebSocket server
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Database seed data
public/
├── icons/                # PWA icons
├── uploads/              # User uploads
└── manifest.json         # PWA manifest
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | ✅ |
| `NEXTAUTH_URL` | Your app's canonical URL | ✅ |
| `WEBSOCKET_URL` | WebSocket service URL (for client) | ⚡ |

## 📝 License

MIT License - feel free to use this project for your own community!

---

Made with ❤️ for the Philippines 🇵🇭
