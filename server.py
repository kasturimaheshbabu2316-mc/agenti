"""
Pharmaceutics Mastery Matrix 3 (PMM 3) – Production API & WebSocket Server
Zero-overhead FastAPI gateway with real-time multi-device WebSocket synchronization,
RAG semantic search, autonomous agent endpoints, and static file hosting.
"""

import os
import time
import json
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# 1. State Model & Server-Side In-Memory Persistence
# -----------------------------------------------------------------------------

APP_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(APP_DIR, "server_state.json")

def default_state() -> Dict[str, Any]:
    return {
        "nextId": 1,
        "startPts": 1000,
        "lots": [],
        "bids": [],
        "answers": [],
        "base": {},
        "epoch": int(time.time() * 1000),
        "roster": [],
        "renamed": [],
        "removed": {},
        "drafts": [],
        "nextDraft": 1
    }

def load_server_state() -> Dict[str, Any]:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                base = default_state()
                base.update(loaded)
                return base
        except Exception:
            pass
    return default_state()

def persist_server_state(state: Dict[str, Any]) -> bool:
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        return True
    except Exception:
        return False

server_state = load_server_state()

# -----------------------------------------------------------------------------
# 2. WebSocket Connection Manager for Multi-Device Real-Time Sync
# -----------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

manager = ConnectionManager()

# -----------------------------------------------------------------------------
# 3. FastAPI App Initialization & Middleware
# -----------------------------------------------------------------------------

app = FastAPI(
    title="Pharmaceutics Mastery Matrix 3 (PMM 3) Server",
    description="Real-time multi-view quiz auction engine with RAG knowledge search and agent orchestration.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# 4. RAG Knowledge Corpus & Search Engine
# -----------------------------------------------------------------------------

CORPUS = [
    {
        "id": "rag-01",
        "unit": "Unit I · Physical Pharmaceutics",
        "topic": "Noyes-Whitney Dissolution Kinetics",
        "formula": "dM/dt = (D * A / h) * (Cs - Cb)",
        "content": "The Noyes-Whitney equation governs solid dissolution rate: dM/dt = (D * A / h) * (Cs - Cb). Micronization elevates A; surfactants elevate saturation solubility Cs.",
        "takeaway": "Interfacial area A and boundary layer thickness h are primary kinetic levers."
    },
    {
        "id": "rag-02",
        "unit": "Unit I · Physical Pharmaceutics",
        "topic": "Henderson-Hasselbalch Ionization & Absorption",
        "formula": "pH = pKa + log([A-] / [HA])",
        "content": "Weakly acidic drugs remain unionized in stomach acid, favoring transcellular passive diffusion across lipid membranes.",
        "takeaway": "Un-ionized species cross enterocyte bilayers via passive lipophilic transport."
    },
    {
        "id": "rag-03",
        "unit": "Unit I · Physical Pharmaceutics",
        "topic": "Polymorphism and Crystal Habit in Drug Bioavailability",
        "formula": "G_metastable > G_stable | Solubility(metastable) > Solubility(stable)",
        "content": "Polymorphism produces distinct crystal lattice forms. Metastable polymorphs possess higher free energy and superior aqueous solubility compared to stable forms.",
        "takeaway": "Metastable polymorphs enhance oral bioavailability of BCS Class II compounds."
    },
    {
        "id": "rag-04",
        "unit": "Unit II · Biopharmaceutics",
        "topic": "Biopharmaceutics Classification System (BCS)",
        "formula": "Class I (High Sol/High Perm) to Class IV (Low Sol/Low Perm)",
        "content": "BCS Class II drugs are dissolution-limited (high permeability, low solubility). Class I drugs qualify for in vitro biowaivers.",
        "takeaway": "BCS Class II oral absorption is accelerated via solid dispersions and micronization."
    },
    {
        "id": "rag-05",
        "unit": "Unit II · Biopharmaceutics & Pharmacokinetics",
        "topic": "Higuchi and Korsmeyer-Peppas Release Kinetics",
        "formula": "Higuchi: Q = K_H * t^(1/2) | Peppas: Mt / M_inf = K * t^n",
        "content": "Higuchi governs planar diffusion-controlled matrix systems. Korsmeyer-Peppas exponent n determines Fickian vs anomalous relaxation release.",
        "takeaway": "Higuchi kinetics apply to non-swellable matrices; Peppas exponent n defines transport mechanism."
    },
    {
        "id": "rag-06",
        "unit": "Unit II · Biopharmaceutics & Pharmacokinetics",
        "topic": "Pharmacokinetic Invariants: Volume of Distribution and Clearance",
        "formula": "Vd = Dose / C0 | Cl = k_e * Vd = Dose_iv / AUC",
        "content": "Volume of distribution relates total drug to plasma concentration. Total clearance determines theoretical volume cleared per unit time.",
        "takeaway": "Altered plasma protein binding changes free fraction fu, volume of distribution, and hepatic clearance."
    },
    {
        "id": "rag-07",
        "unit": "Unit III · Tablet Technology",
        "topic": "Tablet Defects: Capping and Lamination",
        "formula": "Ejection Force = F_die * mu_wall",
        "content": "Capping and lamination result from air entrapment in dies and rapid decompression. Tapered dies and pre-compression dwell prevent it.",
        "takeaway": "Pre-compression dwell time evacuates air from interstitial voids."
    },
    {
        "id": "rag-08",
        "unit": "Unit III · Tablet Technology & Unit Operations",
        "topic": "Tablet Excipients & Functional Disintegrant Mechanisms",
        "formula": "Porosity (epsilon) = 1 - (Bulk Density / True Density)",
        "content": "Superdisintegrants promote rapid tablet breakup via wicking and swelling. Croscarmellose sodium swells 4-8 fold; crospovidone wicks rapidly without gelling.",
        "takeaway": "Excessive magnesium stearate blending time coats granules and retards disintegration."
    },
    {
        "id": "rag-09",
        "unit": "Unit III · Quality Control & Dissolution Testing",
        "topic": "USP Dissolution Testing Apparatus (USP 1 through 7)",
        "formula": "Apparatus 1 (Basket) | Apparatus 2 (Paddle) | Apparatus 4 (Flow-Through)",
        "content": "USP Apparatus 1 is rotating basket (100 rpm); Apparatus 2 is paddle (50/75 rpm); Apparatus 4 is flow-through cell optimal for poorly soluble drugs.",
        "takeaway": "Apparatus 4 flow-through cell preserves sink conditions for lipophilic BCS Class II/IV compounds."
    },
    {
        "id": "rag-10",
        "unit": "Unit IV · Disperse Systems",
        "topic": "Bancroft's Rule and HLB System",
        "formula": "HLB > 8 -> O/W | HLB < 6 -> W/O",
        "content": "The phase in which the emulsifier is most soluble becomes the continuous phase. Tween 80 yields O/W; Span 80 yields W/O.",
        "takeaway": "Hydrophilic surfactants produce Oil-in-Water emulsions."
    },
    {
        "id": "rag-11",
        "unit": "Unit IV · Disperse Systems & Colloids",
        "topic": "Colloidal Stability, DLVO Theory, and Zeta Potential",
        "formula": "V_total = V_attraction + V_repulsion | Zeta > |30 mV| = Stable",
        "content": "DLVO models colloidal stability as sum of van der Waals attraction and electrical double-layer repulsion. Zeta potential magnitude > 30 mV prevents coagulation.",
        "takeaway": "Controlled flocculation targeting secondary minimum prevents irreversible caking."
    },
    {
        "id": "rag-12",
        "unit": "Unit V · Sterilization & Quality Control",
        "topic": "Moist Heat Sterilization & F0 Equivalent",
        "formula": "F0 = Delta_t * 10^((T - 121.1) / z)",
        "content": "Autoclaving at 121.1 C targets F0 >= 12 minutes using Geobacillus stearothermophilus spores to guarantee SAL 10^-6.",
        "takeaway": "SAL 10^-6 represents one non-sterile unit per million."
    },
    {
        "id": "rag-13",
        "unit": "Unit V · Sterile Products & Parenterals",
        "topic": "Pyrogen & Bacterial Endotoxin Testing (BET / LAL)",
        "formula": "Endotoxin Limit (EL) = K / M",
        "content": "Endotoxins from Gram-negative bacterial lipopolysaccharide require depyrogenation at 250 C. LAL cascade forms gel clot in BET assay.",
        "takeaway": "Intrathecal injectables have a 25-fold stricter endotoxin tolerance (0.2 EU/kg)."
    },
    {
        "id": "rag-14",
        "unit": "Unit VI · Novel Drug Delivery Systems (NDDS)",
        "topic": "Osmotic Drug Delivery Systems (OROS Pumps)",
        "formula": "dM/dt = (A / h) * k * Delta_pi * C_sat",
        "content": "OROS pumps release drugs at zero-order delivery rate via semipermeable membrane and laser-drilled orifice independent of pH and motility.",
        "takeaway": "OROS pumps deliver zero-order in vivo plasma concentrations eliminating peak-to-trough fluctuations."
    },
    {
        "id": "rag-15",
        "unit": "Unit VI · Novel Drug Delivery Systems (NDDS)",
        "topic": "Liposomes, Nanosuspensions, and Targeted Nanocarriers",
        "formula": "EPR Effect | Zeta >= |30 mV|",
        "content": "Liposomes are phospholipid vesicles. PEGylated stealth liposomes evade reticuloendothelial system clearance and passively target tumors via the EPR effect.",
        "takeaway": "PEGylation creates steric hydration barrier extending circulation half-life."
    }
]

def lexical_search(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    tokens = [t.lower() for t in query.split() if len(t) > 2]
    scored = []
    for doc in CORPUS:
        score = 0
        doc_text = (doc["topic"] + " " + doc["unit"] + " " + doc["content"]).lower()
        for t in tokens:
            if t in doc_text:
                score += 1
        if score > 0:
            scored.append({"doc": doc, "score": score})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k] if scored else [{"doc": CORPUS[0], "score": 0.5}]

# -----------------------------------------------------------------------------
# 5. Pydantic Schemas for REST API
# -----------------------------------------------------------------------------

class BidPayload(BaseModel):
    lotId: int
    name: str
    amount: int

class AnswerPayload(BaseModel):
    lotId: int
    name: str
    choice: Any

class QueryPayload(BaseModel):
    query: str
    topK: Optional[int] = 3

class GeneratePayload(BaseModel):
    type: str = "aptitude"
    topic: str = "Noyes-Whitney Dissolution"
    difficulty: str = "Medium"

class ExplainPayload(BaseModel):
    topic: str
    question: Optional[str] = ""

# -----------------------------------------------------------------------------
# 6. REST API Endpoints
# -----------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "service": "Pharmaceutics Mastery Matrix 3 (PMM 3)",
        "connected_clients": len(manager.active_connections),
        "timestamp": int(time.time() * 1000)
    }

@app.get("/api/state")
def get_state():
    return server_state

@app.post("/api/state")
async def update_state(state: Dict[str, Any] = Body(...)):
    global server_state
    server_state = state
    persist_server_state(server_state)
    await manager.broadcast({"type": "SYNC", "state": server_state})
    return {"ok": True, "epoch": server_state.get("epoch")}

@app.post("/api/bid")
async def place_bid(bid: BidPayload):
    global server_state
    lot = next((l for l in server_state["lots"] if l["id"] == bid.lotId), None)
    if not lot:
        raise HTTPException(status_code=404, detail="Question lot not found")
    
    now = int(time.time() * 1000)
    if lot["endsAt"] <= now:
        raise HTTPException(status_code=400, detail="Bidding has concluded for this question")
    
    # Calculate min next bid and check existing bids
    lot_bids = [b for b in server_state["bids"] if b["lotId"] == bid.lotId]
    if lot_bids:
        top_bid = max(lot_bids, key=lambda b: b["amount"])
        if top_bid["name"].strip().lower() == bid.name.strip().lower():
            raise HTTPException(status_code=400, detail="You are already leading this question")
        min_required = top_bid["amount"] + lot.get("inc", 10)
    else:
        min_required = lot.get("start", 10)

    if bid.amount < min_required:
        raise HTTPException(status_code=400, detail=f"Bid must be at least {min_required} points")

    # Anti-sniping: +30s if under 30s
    if lot["endsAt"] - now < 30000:
        lot["endsAt"] += 30000

    new_bid = {
        "lotId": bid.lotId,
        "name": bid.name.strip(),
        "amount": bid.amount,
        "at": now
    }
    server_state["bids"].append(new_bid)
    persist_server_state(server_state)

    await manager.broadcast({
        "type": "BID_PLACED",
        "bid": new_bid,
        "lotEndsAt": lot["endsAt"],
        "lotId": lot["id"],
        "state": server_state
    })
    return {"ok": True, "bid": new_bid}

@app.post("/api/answer")
async def submit_answer(ans: AnswerPayload):
    global server_state
    lot = next((l for l in server_state["lots"] if l["id"] == ans.lotId), None)
    if not lot:
        raise HTTPException(status_code=404, detail="Question lot not found")
    
    existing = next((a for a in server_state["answers"] if a["lotId"] == ans.lotId), None)
    if existing:
        raise HTTPException(status_code=400, detail="Answer already submitted for this lot")

    record = {
        "lotId": ans.lotId,
        "name": ans.name.strip(),
        "choice": ans.choice,
        "at": int(time.time() * 1000)
    }
    server_state["answers"].append(record)
    persist_server_state(server_state)

    await manager.broadcast({
        "type": "ANSWER_SUBMITTED",
        "answer": record,
        "lotId": lot["id"],
        "state": server_state
    })
    return {"ok": True, "answer": record}

@app.post("/api/reset")
async def reset_event():
    global server_state
    old_start = server_state.get("startPts", 1000)
    old_drafts = server_state.get("drafts", [])
    old_next_draft = server_state.get("nextDraft", 1)
    server_state = default_state()
    server_state["startPts"] = old_start
    server_state["drafts"] = old_drafts
    server_state["nextDraft"] = old_next_draft
    server_state["epoch"] = int(time.time() * 1000)
    persist_server_state(server_state)
    await manager.broadcast({"type": "SYNC", "state": server_state})
    return {"ok": True, "epoch": server_state["epoch"]}

@app.post("/api/rag/search")
def search_rag(payload: QueryPayload):
    results = lexical_search(payload.query, payload.topK or 3)
    return {"query": payload.query, "results": results}

@app.post("/api/agent/generate")
def agent_generate_question(payload: GeneratePayload):
    hits = lexical_search(payload.topic, 1)
    doc = hits[0]["doc"] if hits else CORPUS[0]

    question_lot = {
        "type": payload.type,
        "mode": "mcq" if payload.type in ["statement", "reasoning", "aptitude", "video"] else "text",
        "topic": doc["topic"],
        "subject": doc["unit"],
        "difficulty": payload.difficulty,
        "hint": doc["takeaway"],
        "q": f"Regarding {doc['topic']}, which principle governs the rate-limiting step?",
        "opts": [
            doc["takeaway"],
            "Zero-order mass precipitation in gastric acid",
            "Passive lipophilic paracellular convective transport",
            "Non-sink saturation of stagnant hydrodynamic layer"
        ],
        "correct": 0,
        "start": 60,
        "inc": 15,
        "mins": 2,
        "answerSecs": 45
    }
    return {"generated": question_lot, "source": doc}

@app.post("/api/agent/explain")
def agent_explain(payload: ExplainPayload):
    hits = lexical_search(payload.topic + " " + payload.question, 1)
    doc = hits[0]["doc"] if hits else CORPUS[0]
    return {
        "topic": doc["topic"],
        "unit": doc["unit"],
        "explanation": doc["content"],
        "formula": doc.get("formula"),
        "takeaway": doc["takeaway"]
    }

# -----------------------------------------------------------------------------
# 7. WebSocket Real-Time Channel
# -----------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global server_state
    await manager.connect(websocket)
    try:
        # Send initial full state on connect
        await websocket.send_json({"type": "INIT", "state": server_state})
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle incoming messages
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "t": int(time.time() * 1000)})
                elif msg.get("type") == "SYNC":
                    server_state = msg.get("state", server_state)
                    persist_server_state(server_state)
                    await manager.broadcast({
                        "type": "SYNC",
                        "state": server_state,
                        "clientId": msg.get("clientId")
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# -----------------------------------------------------------------------------
# 8. Static File Hosting (Serves index.html, admin.html, live.html, etc.)
# -----------------------------------------------------------------------------

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(APP_DIR, "index.html"))

@app.get("/admin")
def serve_admin():
    return FileResponse(os.path.join(APP_DIR, "admin.html"))

@app.get("/live")
def serve_live():
    return FileResponse(os.path.join(APP_DIR, "live.html"))

@app.get("/hub")
@app.get("/all")
def serve_hub():
    return FileResponse(os.path.join(APP_DIR, "hub.html"))

# Mount remaining static assets
app.mount("/", StaticFiles(directory=APP_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
