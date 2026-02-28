MASTER PRODUCT CONTEXT — READ THIS BEFORE WRITING ANY CODE

You are helping build a production-grade AI security product called 
"Adaptive LLM Firewall with Teaming." This product intercepts every 
message sent to an LLM and runs it through 9 security layers before 
the LLM sees it, and checks the LLM's response before the user sees it.

WHAT THIS PRODUCT IS:
A middleware security system that sits between any user/agent and an LLM.
It detects prompt injection, jailbreaks, memory poisoning, tool supply 
chain attacks, multi-turn social engineering, and cross-agent hijacking.

WHAT THIS PRODUCT IS NOT:
- Not a demo. Not a prototype. Not a mockup.
- Not a chatbot. Not a standalone AI assistant.
- Not a frontend-only app with fake backend responses.

ABSOLUTE RULES FOR EVERY LINE OF CODE YOU WRITE:
1. No hardcoded responses. Every response must come from a real function 
   processing real input.
2. No TODO comments left in delivered code. Every function must be 
   implemented, not stubbed.
3. No fake data in the UI. Every number, event, and message in the 
   frontend must come from the backend via a real API call or WebSocket.
4. No silent failures. If something fails, raise an exception with a 
   clear message. Never return a default "safe" value when a function 
   crashes — that would make the security product lie about threats.
5. No mock responses in tests. Tests must call real functions with real 
   inputs and assert on real outputs.
6. Fail secure not fail open. If any security layer throws an exception, 
   the default response is BLOCKED, never PASSED.

TECH STACK:
- Backend: Python 3.11, FastAPI, Uvicorn
- Frontend: React 18, Tailwind CSS, Vite
- Database: Supabase (Postgres + realtime subscriptions)
- Primary LLM: Groq API (llama-3.3-70b-versatile model)
- Honeypot LLM: Ollama running phi3:mini locally, 
  or Groq with a different system prompt if Ollama unavailable
- Embeddings: sentence-transformers (all-MiniLM-L6-v2)
- ML Models: HuggingFace transformers
- Agent Framework: LangGraph
- Deployment: Backend on Railway, Frontend on Vercel

REPOSITORY STRUCTURE:
/backend
  /classifiers        ← Hemach owns this entire folder
  /api                ← Nishun owns this entire folder  
  /integration        ← Siddharth owns this entire folder
  main.py             ← Siddharth assembles this
  requirements.txt
/frontend-user        ← Nishun owns this entire folder
/frontend-admin       ← Nishun owns this entire folder
/tests                ← Siddharth owns this entire folder

LAYER SUMMARY (reference for all tasks):
Layer 1: Indic language normalization + IndicBERT threat classifier + 
         role-based policy thresholds
Layer 2: MCP tool metadata scanner + RAG chunk injection detector
Layer 3: Persistent memory integrity checker + SHA-256 baseline + 
         semantic diff for logic bombs
Layer 4: Stateful multi-turn risk graph + semantic drift velocity engine
Layer 5: Output PII detector + system prompt leakage checker + 
         exfiltration pattern detector
Layer 6: Adversarial honeypot tarpit with safety circuit breaker
Layer 7: Cross-agent zero-trust message interceptor with scope validation
Layer 8: Feedback-loop adaptive rule engine (updates rules from 
         confirmed attacks)
Layer 9: Observability dashboard + shared threat intel feed

INTERFACES BETWEEN TEAM MEMBERS:
Hemach delivers Python functions with exact signatures.
Nishun builds API endpoints and frontend that call those signatures.
Siddharth wires Hemach's functions into Nishun's endpoints and 
verifies everything works end to end.

DO NOT change function signatures without telling the whole team.
DO NOT import from another person's module without confirming the 
interface is finalized.