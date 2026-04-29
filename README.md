# SAMP — Secure Access Management Platform

> **Enterprise-grade, multi-tenant authentication and authorization infrastructure with real-time risk intelligence.**

<div align="center">

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)

</div>

<br/>

<div align="center">
  <img src="docs/assets/risk-monitor.png" alt="SAMP Command Center & Threat Matrix" width="100%" />
  <br/>
  <em>SAMP Command Center — Real-Time Threat Matrix & Security Dashboard</em>
</div>

---

## 📋 Table of Contents

1. [About the Project](#-about-the-project)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture Overview](#-architecture-overview)
5. [Interface Showcase](#-interface-showcase)
6. [Installation Guide](#-installation-guide)
7. [Usage Instructions](#-usage-instructions)
8. [API Documentation](#-api-documentation)
9. [Environment Variables](#-environment-variables)
10. [Folder Structure](#-folder-structure)
11. [Deployment Guide](#-deployment-guide)
12. [Testing](#-testing)
13. [Roadmap](#-roadmap)
14. [Contributing](#-contributing)
15. [License](#-license)
16. [Author & Credits](#-author--credits)

---

## 🔍 About the Project

**SAMP** (Secure Access Management Platform) is a production-grade, multi-tenant identity and access management (IAM) system built for B2B environments. It provides a hardened, centralized authentication layer capable of supporting multiple isolated tenants — each with independently scoped users, roles, tokens, and policies.

Unlike monolithic auth solutions, SAMP is composed of three independent, purpose-built services: a React-powered command center for administrators, a Spring Boot authentication core handling identity lifecycle, and a Python-based real-time risk engine that continuously evaluates session telemetry to detect and respond to threats before they escalate.

**Core Design Philosophy:**
- **Zero-trust by default** — every request is evaluated against current risk state, not just session state.
- **Tenant-first isolation** — no token, policy, or user object crosses tenant boundaries.
- **Separation of concerns** — security-critical auth logic is cleanly decoupled from risk evaluation, enabling independent scaling and hardening of each service.

---

## 🔐 Key Features

### Identity & Authentication
- **Multi-Tenant Architecture** — Full B2B tenant isolation. Every token, user record, role binding, and audit log is scoped to a specific `tenant_id` with no possibility of cross-tenant data leakage.
- **JWT Lifecycle Management** — RSA-256 signed JWTs with configurable expiry, silent refresh flows, and token revocation via Redis-backed blocklists.
- **TOTP-Based MFA** — Full RFC 6238-compliant Time-Based One-Time Password provisioning, including QR code generation for authenticator app enrollment and server-side verification with clock-drift tolerance.
- **RBAC / ABAC Policy Enforcement** — Dual-mode authorization supporting both Role-Based and Attribute-Based Access Control, enabling fine-grained permission policies per tenant.

### Risk Intelligence
- **Continuous Session Risk Scoring** — The risk engine evaluates inbound session telemetry in real time, computing composite threat scores based on velocity ratios, IP reputation lookups, and geographic anomaly detection.
- **Step-Up Authentication Triggers** — When a session risk score exceeds configurable thresholds, the platform automatically escalates to additional verification challenges without disrupting low-risk sessions.
- **Geo-Mismatch Detection** — Flags sessions where the origin IP geolocation significantly deviates from a user's historical access patterns.

### Observability & Audit
- **Immutable Audit Trail** — Every authentication event, policy evaluation, and administrative action is recorded with full context (actor, tenant, timestamp, IP, outcome) and cannot be modified post-write.
- **Real-Time Threat Matrix** — 3D globe visualization (powered by Three.js / React-Globe.gl) mapping live anomaly events across geographies for at-a-glance threat situational awareness.
- **Interactive Security Dashboard** — Administrators can monitor active sessions, inspect risk scores, review policy violations, and revoke access in real time from a unified command center interface.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | Component-based UI framework |
| Vite | Ultra-fast build tooling and HMR |
| TypeScript | Type safety across the entire frontend codebase |
| TailwindCSS v4 | Utility-first styling with JIT compilation |
| Zustand | Lightweight global state management |
| Framer Motion | Declarative animation layer |
| Three.js / React-Globe.gl | Real-time 3D threat globe visualization |

### Authentication Service
| Technology | Purpose |
|---|---|
| Java 17 | Primary runtime (LTS) |
| Spring Boot 3.x | Application framework and auto-configuration |
| Spring Security | Authentication filters, security context, RBAC integration |
| Hibernate / JPA | ORM layer for tenant-scoped data access |
| JJWT | RSA-256 JWT generation and validation |

### Risk Engine
| Technology | Purpose |
|---|---|
| Python 3.11 | Primary runtime |
| FastAPI | High-throughput async HTTP service |
| Pydantic v2 | Schema validation and data serialization |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary relational data store (tenants, users, roles, audit logs) |
| Redis | JWT blocklist, session cache, rate-limit counters |
| Docker Compose | Local multi-service orchestration |

### Security Primitives
| Standard | Implementation |
|---|---|
| JWT | RSA-256 signed tokens via JJWT |
| TOTP | RFC 6238 compliant via Google Authenticator-compatible libraries |
| Password Hashing | Bcrypt with configurable cost factor |

---

## 🏗 Architecture Overview

SAMP follows a **decoupled, dual-backend microservices architecture** designed for horizontal scalability and strict security isolation between services.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│               React 18 + Vite + TypeScript SPA               │
└────────────────────────┬─────────────────────┬──────────────┘
                         │                     │
                  Auth Requests          Telemetry Events
                         │                     │
            ┌────────────▼──────┐   ┌──────────▼────────────┐
            │   AUTH SERVICE    │   │     RISK ENGINE        │
            │  Spring Boot 3.x  │   │  Python 3.11 / FastAPI │
            │  Java 17          │   │                        │
            │                   │   │  - Velocity analysis   │
            │  - Tenant Reg.    │   │  - IP reputation       │
            │  - JWT Issuance   │   │  - Geo-mismatch        │
            │  - TOTP / MFA     │   │  - Composite scoring   │
            │  - RBAC / ABAC    │   │  - Step-up triggers    │
            └────────┬──────────┘   └──────────┬─────────────┘
                     │                          │
            ┌────────▼──────────────────────────▼─────────────┐
            │                 INFRASTRUCTURE                    │
            │          PostgreSQL              Redis            │
            │    (users, tenants, audit)  (tokens, cache)      │
            └──────────────────────────────────────────────────┘
```

**Data Flow for a Protected Request:**
1. Client submits credentials to the Auth Service.
2. Auth Service validates identity, issues a signed JWT, and records the login event.
3. Client attaches JWT to subsequent requests and streams session telemetry to the Risk Engine.
4. Risk Engine scores the session in real time and signals the Auth Service if step-up is required.
5. Auth Service enforces the escalation policy — requiring MFA re-verification before proceeding.

---

## 📸 Interface Showcase

### Registration Protocol

<table align="center">
  <tr>
    <td align="center" width="33%">
      <img src="docs/assets/registration-step1.png" alt="Step 1: Tenant Identification" />
      <br/><em>[01] Tenant Identification</em>
    </td>
    <td align="center" width="33%">
      <img src="docs/assets/registration-step2.png" alt="Step 2: Root Authorization" />
      <br/><em>[02] Root Authorization</em>
    </td>
    <td align="center" width="33%">
      <img src="docs/assets/registration-step3.png" alt="Step 3: MFA Synchronization" />
      <br/><em>[03] MFA Synchronization</em>
    </td>
  </tr>
</table>

### Access Control & Policy Evaluation

<div align="center">
  <img src="docs/assets/access-matrix.png" alt="Access Matrix and Policy Auditing" width="100%" />
  <em>Access Matrix — Role Binding Visualization & Policy Audit Log</em>
</div>

---

## ⚙️ Installation Guide

### Prerequisites

Ensure the following are installed before proceeding:

| Tool | Minimum Version | Notes |
|---|---|---|
| Docker Desktop | 24.x | Required for PostgreSQL & Redis |
| Java (JDK) | 17 | LTS release required |
| Maven | 3.9+ | Or use the included `mvnw` wrapper |
| Python | 3.11 | Exact minor version recommended |
| Node.js | 18.x+ | LTS release |
| npm | 9.x+ | Bundled with Node.js |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/samp.git
cd samp
```

### Step 2 — Configure Environment Variables

Copy the example environment files for each service and fill in the required values:

```bash
cp auth-service/.env.example auth-service/.env
cp risk-engine/.env.example risk-engine/.env
cp frontend/.env.example frontend/.env
```

See [Environment Variables](#-environment-variables) for full configuration details.

### Step 3 — Start Infrastructure Services

Ensure Docker Desktop is running, then start the PostgreSQL and Redis containers:

```bash
docker compose up -d
```

Verify that both containers are healthy:

```bash
docker compose ps
```

### Step 4 — Launch the Auth Service (Spring Boot)

```bash
cd auth-service
mvn spring-boot:run
```

The Auth Service will be available at `http://localhost:8080`.

> **Note:** On first startup, Hibernate will auto-run the database migrations. Ensure `spring.jpa.hibernate.ddl-auto` is set appropriately (see env config).

### Step 5 — Launch the Risk Engine (FastAPI)

```bash
cd risk-engine

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python main.py
```

The Risk Engine will be available at `http://localhost:8001`.

### Step 6 — Launch the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access the SAMP command center interface.

---

## 🖥 Usage Instructions

### Tenant Registration Flow

1. Navigate to `http://localhost:5173`.
2. Complete the three-step registration protocol:
   - **Step 1 — Tenant Identification**: Provide your organization name and subdomain slug. This creates an isolated tenant namespace.
   - **Step 2 — Root Authorization**: Create the root administrator account (email + password) for this tenant.
   - **Step 3 — MFA Synchronization**: Scan the provisioned QR code using an authenticator app (Google Authenticator, Authy, etc.) and confirm with a valid TOTP code.
3. Upon successful registration, you are redirected to the command center dashboard.

### Authenticating as an Existing User

Send a `POST` request to the Auth Service login endpoint:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "email": "admin@acme.com",
    "password": "your-password",
    "totpCode": "123456"
  }'
```

A successful response returns a signed JWT:

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Using the Command Center

- **Threat Matrix**: The 3D globe on the dashboard maps real-time anomaly events by geolocation. Red clusters indicate active threat concentrations.
- **Session Inspector**: View all active sessions for your tenant, including risk scores, originating IPs, and last-seen timestamps.
- **Policy Manager**: Define and attach RBAC/ABAC policies to roles and user attributes under **Settings → Access Control**.
- **Audit Log**: Browse the immutable event log under **Monitoring → Audit Trail**, filterable by actor, event type, and time range.

---

## 📡 API Documentation

### Auth Service — Base URL: `http://localhost:8080/api/v1`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/tenants/register` | Register a new tenant and root admin | No |
| `POST` | `/auth/login` | Authenticate and receive a JWT | No |
| `POST` | `/auth/refresh` | Refresh an expiring access token | Yes (refresh token) |
| `POST` | `/auth/logout` | Revoke the current session token | Yes |
| `POST` | `/auth/mfa/verify` | Verify a TOTP code during step-up | Yes |
| `GET` | `/users` | List all users within the calling tenant | Yes (Admin) |
| `POST` | `/users` | Provision a new user in the calling tenant | Yes (Admin) |
| `GET` | `/audit/events` | Retrieve paginated audit log entries | Yes (Admin) |

### Risk Engine — Base URL: `http://localhost:8001/api/v1`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/risk/evaluate` | Submit session telemetry for risk scoring | Yes (Service Token) |
| `GET` | `/risk/score/{sessionId}` | Retrieve the current risk score for a session | Yes (Service Token) |
| `GET` | `/health` | Service health check | No |

> **Interactive Docs:** When running locally, FastAPI automatically generates interactive API documentation:
> - Swagger UI: `http://localhost:8001/docs`
> - ReDoc: `http://localhost:8001/redoc`

---

## 🔧 Environment Variables

### Auth Service (`auth-service/.env`)

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/samp_auth
SPRING_DATASOURCE_USERNAME=samp_user
SPRING_DATASOURCE_PASSWORD=your_db_password

# JPA
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# JWT (RSA key pair — generate with openssl)
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY_SECONDS=3600
JWT_REFRESH_TOKEN_EXPIRY_SECONDS=86400

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# TOTP
TOTP_ISSUER_NAME=SAMP
```

### Risk Engine (`risk-engine/.env`)

```env
# Service config
HOST=0.0.0.0
PORT=8001

# Inter-service auth
SERVICE_TOKEN_SECRET=your_shared_service_secret

# Database (read-only access to session store)
DATABASE_URL=postgresql://samp_user:your_db_password@localhost:5432/samp_auth

# Risk thresholds
RISK_SCORE_STEP_UP_THRESHOLD=0.75
RISK_SCORE_BLOCK_THRESHOLD=0.95
```

### Frontend (`frontend/.env`)

```env
VITE_AUTH_SERVICE_URL=http://localhost:8080
VITE_RISK_ENGINE_URL=http://localhost:8001
```

---

## 📁 Folder Structure

```
samp/
├── auth-service/               # Spring Boot authentication core
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/samp/
│   │   │   │   ├── audit/          # Audit logging subsystem
│   │   │   │   ├── auth/           # Authentication, MFA, and JWT logic
│   │   │   │   ├── common/         # Global exceptions and utils
│   │   │   │   ├── policy/         # RBAC/ABAC authorization rules
│   │   │   │   ├── risk/           # Risk engine integration client
│   │   │   │   ├── tenant/         # Multi-tenant provisioning
│   │   │   │   └── AuthServiceApplication.java
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── keys/                   # RSA key pair (gitignored)
│   ├── .env.example
│   └── pom.xml
│
├── risk-engine/                # Python real-time risk evaluation service
│   ├── Dockerfile
│   ├── features.py             # Feature extraction for telemetry
│   ├── main.py                 # FastAPI application and endpoints
│   ├── model.py                # Threat scoring models
│   ├── redis_client.py         # Redis caching for fast lookups
│   └── requirements.txt
│
├── frontend/                   # React SPA (command center)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── store/              # Zustand state slices
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API client functions
│   │   └── types/              # TypeScript type definitions
│   ├── public/
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
│
├── docs/
│   └── assets/                 # Screenshots and documentation images
│
├── docker-compose.yml          # PostgreSQL + Redis orchestration
└── README.md
```

---

## 🚀 Deployment Guide

### Docker Compose (Recommended for Staging)

A full production-like environment can be orchestrated using Docker Compose. Extend the base `docker-compose.yml` with a production override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Ensure your production environment file is correctly populated before starting.

### Auth Service — Production Build

```bash
cd auth-service
mvn clean package -DskipTests
java -jar target/samp-auth-service-*.jar --spring.config.location=file:./application-prod.yml
```

### Risk Engine — Production Deployment

Use `uvicorn` with multiple workers for production throughput:

```bash
cd risk-engine
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Frontend — Production Build

```bash
cd frontend
npm run build
```

The compiled static assets are output to `frontend/dist/`. Deploy this directory to any static hosting service (Vercel, Netlify, Nginx, AWS S3 + CloudFront).

### Production Checklist

- [ ] Generate a fresh RSA key pair for JWT signing (`openssl genrsa` / `openssl rsa`)
- [ ] Rotate all secrets from `.env.example` defaults
- [ ] Configure `spring.jpa.hibernate.ddl-auto=validate` (never `update` in production)
- [ ] Enable HTTPS / TLS termination at the reverse proxy layer
- [ ] Set `CORS` allowed origins to your specific frontend domain
- [ ] Configure PostgreSQL connection pooling (e.g., HikariCP settings)
- [ ] Enable Redis `requirepass` and update connection strings accordingly
- [ ] Set up log aggregation (e.g., Loki, ELK, Datadog)

---

## 🧪 Testing

### Auth Service Tests

```bash
cd auth-service
mvn test
```

Integration tests use an embedded H2 database and a Testcontainers-backed Redis instance where applicable. Test coverage reports are output to `target/site/jacoco/`.

### Risk Engine Tests

```bash
cd risk-engine
source .venv/bin/activate
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Frontend Tests

```bash
cd frontend
npm run test          # Run unit tests with Vitest
npm run test:coverage # Generate coverage report
```

---

## 🗺 Roadmap

| Status | Feature |
|---|---|
| ✅ Done | Multi-tenant registration and isolation |
| ✅ Done | JWT issuance, refresh, and revocation |
| ✅ Done | TOTP-based MFA provisioning and verification |
| ✅ Done | Real-time risk scoring with step-up triggers |
| ✅ Done | 3D threat globe visualization |
| ✅ Done | Immutable audit logging |
| 🔄 In Progress | SAML 2.0 / OIDC federation support |
| 🔄 In Progress | Webhook delivery for security events |
| 📋 Planned | Passkey / WebAuthn support (FIDO2) |
| 📋 Planned | Per-tenant branding and custom login pages |
| 📋 Planned | Admin CLI for tenant management |
| 📋 Planned | Kubernetes Helm chart for production deployments |
| 📋 Planned | SOC 2 Type II compliance documentation |

---

## 🤝 Contributing

Contributions are welcome. Please follow these guidelines to maintain code quality and consistency.

### Branching Model

```
main          ← stable, production-ready
develop       ← integration branch
feature/*     ← new features branching from develop
fix/*         ← bug fixes
hotfix/*      ← critical fixes branching directly from main
```

### Contribution Workflow

1. Fork the repository and clone your fork locally.
2. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name develop
   ```
3. Make your changes. Ensure all existing tests pass and add new tests where appropriate.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```
   feat(auth): add PKCE support to OAuth flow
   fix(risk): correct velocity threshold calculation
   ```
5. Push your branch and open a Pull Request targeting `develop`.
6. Ensure CI passes before requesting a review.

### Code Standards

- **Java**: Follow Google Java Style Guide. Run `mvn checkstyle:check` before committing.
- **Python**: Adhere to PEP 8. Use `ruff` for linting and `black` for formatting.
- **TypeScript/React**: Follow the ESLint configuration provided in `frontend/.eslintrc`.

---

## 📜 License

Copyright © 2026 SAMP Protocol. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without express written permission from the copyright holder.

---

## 👤 Author & Credits

**SAMP Protocol**

- GitHub: [@arsonic-dev](https://github.com/arsonic-dev)
- Portfolio: [Ankit Kumar](https://portfolio-ankit-kumar-cse.vercel.app/)

---

## 🙏 Acknowledgements

- [Spring Security](https://spring.io/projects/spring-security) — Authentication and authorization framework
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python async web framework
- [React-Globe.gl](https://github.com/vasturiano/react-globe.gl) — WebGL-based 3D globe component
- [JJWT](https://github.com/jwtk/jjwt) — Java JWT library
- [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) — TOTP standard specification
- [Framer Motion](https://www.framer.com/motion/) — React animation library