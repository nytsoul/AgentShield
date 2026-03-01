# 🛡️ AgentShield

> **Production-grade 9-layer AI security middleware with real-time WebSocket events and adaptive defensive protocols.**

AgentShield is an advanced AI firewall designed to secure Large Language Model (LLM) applications against adversarial attacks, prompt injections, data exfiltration, and unauthorized agent communication. It implements a complete zero-trust architecture specifically tailored for multi-agent systems and enterprise AI pipelines.

---

## 🏗️ The 9-Layer Security Architecture

AgentShield utilizes a multi-layered defense-in-depth approach exactly mirroring enterprise network security, but adapted for neural pathways and context windows:

1. **Ingestion Pipeline** (`Layer 1`): Validates and sanitizes incoming user prompts before they reach the LLM.
2. **MCP Scanner** (`Layer 2`): Pre-execution scanning of Model Context Protocol payloads and tool definitions to prevent malicious tool usage.
3. **Memory Firewall** (`Layer 3`): Prevents injection attacks and unauthorized data extraction from the agent's long-term vector memory.
4. **Conversation Intelligence** (`Layer 4`): Real-time analysis of session context and risks using contextual heuristics.
5. **Output Validation** (`Layer 5`): Scans the LLM's raw response for PII, API keys, or leaked system prompts before showing them to the user.
6. **Honeypot Tarpit** (`Layer 6`): Deploys deceptive environments and honeypot tokens to trap automated adversarial attacks.
7. **Adversarial Response** (`Layer 7`): Creates dynamic defensive responses against red-teaming, jailbreaks, and sophisticated social engineering.
8. **Zero Trust Network** (`Layer 8`): Enforces permission boundaries and secures communication between multiple interacting AI agents.
9. **Adaptive Config** (`Layer 9`): Continuous learning module that dynamically adjusts security policies based on active threat intelligence.

---

## 🛠️ Technology Stack

**Frontend (Dashboard):**
- React 18 & TypeScript
- Vite
- Tailwind CSS & Framer Motion (Animations)
- Recharts (Data Visualization)
- Lucide React (Icons)
- Supabase Auth & Google OAuth

**Backend (API & Firewall Engine):**
- Python 3.x
- FastAPI
- WebSockets (Real-time telemetry)
- MongoDB (Log and Session storage)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Atlas cluster (or local instance)
- Supabase Project & Google OAuth Credentials

### 1. Clone the Repository
```bash
git clone https://github.com/nytsoul/AgentShield.git
cd AgentShield
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=your_mongodb_connection_string
```

Run the API:
```bash
python -m uvicorn main:app --port 8080 --reload
```

### 3. Frontend Setup
```bash
# From the project root
npm install
```

Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Run the development server:
```bash
npm run dev
```

### 4. Access the Dashboard
Navigate to `http://localhost:5173` in your browser.

---

## 🔑 Authentication

AgentShield supports dual-layer authentication:
1. **Google OAuth (Primary):** Seamless SSO integration with role mapping.
2. **Supabase Auth (Fallback):** Email and password authentication.

Roles are designated as `admin` (full dashboard access) and `user` (sandboxed chat access).

---

## 📜 License
*Proprietary / Closed Source* - Internal enterprise use only unless otherwise specified.
