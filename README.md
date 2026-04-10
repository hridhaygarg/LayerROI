# AgentCFO

AI agent financial control layer. Intercepts API calls to OpenAI/Anthropic, logs costs, tracks profitability per agent, and provides a CFO-readable P&L dashboard.

## What It Does

- 📊 **Cost Tracking**: Every API call is logged with actual dollar cost
- 🏷️ **Agent Tagging**: See which agents are profitable, which are burning money
- ⚠️ **Runaway Detection**: Block agents making 15+ calls in 90 seconds
- 📈 **Dashboard**: Real-time P&L, cost trends, ROI per agent
- 🚀 **One-Line Setup**: Customers change 1 line of code in their agent

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase free tier)
- **Frontend**: React + Recharts
- **Deployment**: Railway.app

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your credentials to .env (next step)
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Next Steps

1. Create Supabase account (free tier)
2. Get OpenAI API test key
3. Set up Railway for deployment
4. Update .env files with credentials
