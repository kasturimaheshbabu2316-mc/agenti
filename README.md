# PMM 3 – Pharmaceutics Mastery Matrix 3 (Quiz Bidding & Evaluation Platform)

High-performance, multi-view real-time quiz auction engine and AI-augmented assessment platform for Pharmaceutics Mastery Matrix 3 (PMM 3).

## Core Architecture & Views
- **Team Bidding Terminal (`index.html`)**: Interactive bidding, spendable wallet tracking, pre-briefing metadata secrecy, winner-exclusive answering portal, live activity feed, leaderboard, and embedded **Pharma AI Study Tutor (RAG)**.
- **Quiz Master Management (`admin.html`)**: Passcode security gate (`MrKrsna`), question authoring across 8 formats, team ledger management, draft staging, draft editing/preview, 1-click **AI Question Pack Generation**, and JSON question bank import/export.
- **Projector & Hall Display (`live.html`)**: High-visibility hall display, live visual bid ladder, leader highlights, synchronized countdown timers, audio chimes, and full post-settlement solution reveals.
- **Interactive MCQ Option Showcase (`mcq.html`)**: Live component demonstration of the high-fidelity dark-mode option selection card with evaluation states, keyboard navigation, and audio feedback.
- **Standalone Option Card Component (`option-card.html`)**: Zero-dependency, portable single-file reference implementation of the glassmorphic option selection card for external projects.
- **RAG Knowledge Engine (`rag.js`)**: Embedded BM25 retrieval engine with 15 vetted domain knowledge chunks covering Physical Pharmacy, Biopharmaceutics, Pharmacokinetics, Tableting defects, USP dissolution apparatus, and Disperse systems.
- **Multi-Agent AI System (`agents.js`)**:
  - `AuthoringAgent`: Validates question schemas and auto-generates balanced question packs for Quiz Masters.
  - `PharmaTutorAgent`: Real-time conceptual study mentor and post-answer RAG explainer.
  - `BidStrategistAgent`: Analyzes auction solvency, point escrow limits, and provides tactical bid recommendations.
- **Real-Time Multi-Device Sync Engine (`sync.js`)**: Bidirectional WebSocket synchronization (`/ws`) with auto-reconnect, exponential backoff, keepalive pings, cross-client broadcast, and graceful offline `localStorage` fallback with live sync status badge.
- **Web Audio SFX Synthesizer (`sfx.js`)**: Pure procedural oscillator synthesis for bid chimes, outbid notifications, countdown ticks, and win/loss feedback with zero external audio assets.
- **Production Server (`server.py`)**: FastAPI gateway with real-time multi-device WebSocket broadcast (`/ws`), REST API, RAG endpoints, and static file hosting.
- **PWA Ready**: Offline caching via Service Worker (`sw.js`) and Web App Manifest (`manifest.json`) with vector SVG branding (`icon.svg`), registered across all client views.

## Verification & Testing
Run the complete automated verification suite:
```bash
# 1. HTML, CSS, and JS template linter and design system invariants
python verify_design.py

# 2. Store logic and economic solvency invariants
node test_store_logic.js

# 3. Comprehensive edge case & Unicode robustness tests
node test_comprehensive_edge_cases.js

# 4. RAG engine and Multi-Agent AI system tests
node test_rag_agents.js

# 5. Real-time WebSocket sync engine tests
node test_sync_engine.js

# 6. Interactive MCQ option selection component tests
node test_mcq_component.js

# 7. Production FastAPI server, WebSocket, and REST endpoint tests
python -m pytest test_server.py
```

## Running the Production Server
```bash
# Start FastAPI server on port 8000
python server.py
# Or via uvicorn:
uvicorn server:app --host 0.0.0.0 --port 8000
```
Open `http://localhost:8000` for the Team Terminal, `http://localhost:8000/admin` for Quiz Master, and `http://localhost:8000/live` for the Hall Projector.
