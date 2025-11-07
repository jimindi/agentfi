# AgentFi SDK

**Cross-Chain Token Swaps for AI Trading Bots**

[![Version](https://img.shields.io/github/v/release/jimindi/agentfi?color=blue)](https://github.com/jimindi/agentfi/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![NEAR](https://img.shields.io/badge/NEAR-Protocol-black)](https://near.org)
[![Status](https://img.shields.io/badge/status-production-green)](https://github.com/jimindi/agentfi)

AgentFi is a B2B API that enables AI trading bots and applications to execute cross-chain cryptocurrency swaps using NEAR Intents protocol.

---

## 🚀 Quick Start

    # 1. Get API key
    curl -X POST https://api.agentfi.io/v1/auth/api-key \
      -H "Content-Type: application/json" \
      -d '{"email":"your@email.com","name":"My Bot"}'

    # 2. Execute swap (see docs for full example)
    curl -X POST https://api.agentfi.io/v1/swap \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -d @swap-request.json

---

## ✨ Features

- ✅ **Non-custodial** - Users always control their funds
- ✅ **Fast** - Swaps complete in 20-60 seconds  
- ✅ **Simple API** - One endpoint to execute swaps
- ✅ **Multi-chain** - NEAR, Ethereum, Solana, Bitcoin
- ✅ **No bridges** - Direct cross-chain execution via intents
- ✅ **15 bps fee** - Competitive platform fee (0.15%)

---

## 📖 Documentation

- [**User Guide**](api/docs/USER_GUIDE.md) - Complete API documentation
- [**Integration Guide**](api/docs/INTEGRATION.md) - Step-by-step integration
- [**Architecture**](api/docs/ARCHITECTURE.md) - System design
- [**API Reference**](api/docs/API_REFERENCE.md) - Endpoint documentation
- [**Deployment**](api/docs/DEPLOYMENT.md) - Production deployment guide

---

## 🎯 Use Cases

- **Trading Bots** - Automated arbitrage and trading strategies
- **DeFi Dashboards** - Cross-chain portfolio management
- **Wallet Applications** - Seamless cross-chain transfers
- **Market Makers** - Multi-chain liquidity provision

---

## 🏗️ Architecture

    Client → AgentFi API → OneClick API → NEAR Intents → Solver Network

AgentFi abstracts the complexity of:
- NEP-413 intent signing
- OneClick API integration
- Deposit address management
- Status monitoring
- Error handling

---

## ✅ Verified Working

Successfully executed mainnet swap on November 7, 2025:
- **Input:** 0.01 wNEAR
- **Output:** 0.023256 USDC  
- **Time:** 10 seconds (execution)
- **Transaction:** [View on Explorer](https://nearblocks.io/txns/3H6hfJHaWb3bpgBWxLuRt6ey37aCH7juzwoUWqSsRUCr)

---

## 🛠️ Technology Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Blockchain:** NEAR Protocol (via near-api-js)
- **Intents:** OneClick API integration

---

## 📦 Installation

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 16
- Redis 7
- NEAR account (mainnet)
- OneClick API JWT token

### Setup

    # Clone repository
    git clone https://github.com/jimindi/agentfi.git
    cd agentfi/api

    # Install dependencies
    npm install

    # Configure environment
    cp .env.example .env
    # Edit .env with your configuration

    # Setup database
    npx prisma generate
    npx prisma migrate deploy

    # Start API
    npm run dev

    # Start worker (separate terminal)
    npm run worker

---

## 🔑 Environment Variables

    # Node
    NODE_ENV=production
    PORT=3000

    # Database
    DATABASE_URL=postgresql://user:pass@localhost:5432/agentfi

    # Redis
    REDIS_URL=redis://localhost:6379

    # NEAR
    NEAR_NETWORK=mainnet
    NEAR_ACCOUNT_ID=your-account.near
    NEAR_PRIVATE_KEY=ed25519:...

    # OneClick API
    ONECLICK_JWT_TOKEN=your-jwt-token

    # Security
    JWT_SECRET=random-32-char-string
    WEBHOOK_SECRET=random-32-char-string

---

## 📊 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/swap` | POST | ✅ | Execute swap |
| `/v1/swap/:id` | GET | ❌ | Get status |
| `/v1/tokens` | GET | ❌ | List tokens |
| `/v1/chains` | GET | ❌ | List chains |
| `/v1/auth/api-key` | POST | ❌ | Create API key |
| `/health` | GET | ❌ | Health check |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Documentation:** https://docs.agentfi.io
- **Email:** support@agentfi.io
- **Discord:** https://discord.gg/agentfi
- **Issues:** [GitHub Issues](https://github.com/jimindi/agentfi/issues)

---

## 🗺️ Roadmap

- [x] Core swap functionality
- [x] NEP-413 signing
- [x] OneClick API integration
- [x] Mainnet testing
- [ ] API authentication
- [ ] Webhook notifications
- [ ] Rate limiting
- [ ] SDK libraries (TypeScript, Python)
- [ ] Advanced monitoring

---

## 🙏 Acknowledgments

- [NEAR Protocol](https://near.org) - Blockchain infrastructure
- [Defuse Protocol](https://defuse.io) - OneClick API
- [NEAR Intents](https://docs.near-intents.org) - Intent protocol

---

**Built with ❤️ for the future of cross-chain DeFi**
