# Changelog

All notable changes to AgentFi SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-11-07

### 🚀 Initial Release

AgentFi SDK v1.0.0 is production-ready and has been tested on mainnet with successful swap execution.

### Added

#### Core Features
- Cross-chain token swap API via NEAR Intents protocol
- RESTful API with Express.js + TypeScript
- NEP-413 intent signing and verification
- OneClick API integration for solver network coordination
- PostgreSQL database with Prisma ORM
- Background worker for swap status monitoring
- Webhook notification system (foundation)

#### API Endpoints
- `POST /v1/swap` - Execute cross-chain swap
- `GET /v1/swap/:id` - Get swap status
- `GET /v1/tokens` - List supported tokens
- `GET /v1/chains` - List supported chains
- `POST /v1/auth/api-key` - Generate API key (foundation)
- `GET /health` - Health check endpoint

#### Documentation
- Comprehensive User Guide
- Complete API Reference
- System Architecture documentation
- Production Deployment Guide
- Step-by-step Integration Guide
- Contributing guidelines
- MIT License

#### Developer Tools
- TypeScript client library
- Test client for local development
- Docker Compose configuration
- Database migration scripts
- Environment configuration templates

### Technical Specifications

#### Platform Fee
- 15 basis points (0.15%) flat fee on all swaps
- Competitive with industry standards
- Transparent fee calculation

#### Supported Networks
- NEAR Protocol (mainnet)
- Additional chains via NEAR Intents (Ethereum, Solana, Bitcoin)

#### Infrastructure
- Node.js 20 LTS runtime
- PostgreSQL 16 database
- Redis 7 caching layer
- PM2 process management
- Nginx reverse proxy support

### Verified

#### Mainnet Testing
- **Date:** November 7, 2025
- **Swap:** 0.01 wNEAR → 0.023256 USDC
- **Execution Time:** ~10 seconds
- **Status:** ✅ Completed
- **Transaction:** [3H6hfJHaWb3bpgBWxLuRt6ey37aCH7juzwoUWqSsRUCr](https://nearblocks.io/txns/3H6hfJHaWb3bpgBWxLuRt6ey37aCH7juzwoUWqSsRUCr)

### Security

- Non-custodial architecture
- NEP-413 signed intents
- No private key storage
- Environment variable configuration
- Input validation on all endpoints
- GitHub secret scanning enabled

### Known Limitations

- API key authentication not yet enforced (foundation in place)
- Webhook notifications require manual configuration
- Rate limiting not yet implemented
- Single-region deployment only

---

## [Unreleased]

### Planned Features

#### Phase 2 (Q1 2026)
- [ ] API key authentication and authorization
- [ ] Rate limiting per API key
- [ ] Webhook notifications with signature verification
- [ ] Error retry logic with exponential backoff
- [ ] Comprehensive logging and monitoring
- [ ] Admin dashboard

#### Phase 3 (Q2 2026)
- [ ] Multi-region deployment
- [ ] SDK libraries (TypeScript, Python, Go)
- [ ] Advanced analytics and reporting
- [ ] White-label API options
- [ ] Volume-based fee discounts
- [ ] Premium support tier

#### Phase 4 (Q3 2026)
- [ ] Additional blockchain integrations
- [ ] Limit order support
- [ ] DCA (Dollar Cost Averaging) strategies
- [ ] Portfolio management features
- [ ] Mobile SDK

---

## Version History

- **1.0.0** (2025-11-07) - Initial production release

---

## Links

- [GitHub Repository](https://github.com/jimindi/agentfi)
- [Documentation](https://github.com/jimindi/agentfi/tree/main/api/docs)
- [Issues](https://github.com/jimindi/agentfi/issues)
- [Releases](https://github.com/jimindi/agentfi/releases)

---

## Support

For questions, issues, or feature requests:
- Open an [issue](https://github.com/jimindi/agentfi/issues)
- Email: support@agentfi.io
- Discord: https://discord.gg/agentfi
