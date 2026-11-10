// Test suite for RAG engine and Multi-Agent AI System
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};
global.sessionStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.document = { querySelector: () => null };

// Load store.js, rag.js, agents.js, sfx.js
vm.runInThisContext(fs.readFileSync('store.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('rag.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('agents.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('sfx.js', 'utf8'));

console.log("=== Running RAG & Multi-Agent AI System Tests ===");

// 1. RAG Knowledge Corpus Invariants
const corpus = PMM_RAG.corpus;
assert.ok(Array.isArray(corpus) && corpus.length >= 10, "Corpus must have at least 10 vetted documents");
corpus.forEach((doc) => {
  assert.ok(doc.id && doc.unit && doc.topic && doc.content, `Document ${doc.id} missing required core fields`);
  assert.ok(doc.clinicalTakeaway, `Document ${doc.id} missing clinicalTakeaway`);
  assert.ok(doc.reference, `Document ${doc.id} missing reference`);
});
console.log(`[PASS] RAG Knowledge Corpus validated (${corpus.length} vetted pharmaceutics chunks)`);

// 2. BM25 Search Engine
const search1 = PMM_RAG.search("Noyes Whitney dissolution", 3);
assert.ok(search1.length > 0);
assert.strictEqual(search1[0].doc.id, "rag-01");
assert.ok(search1[0].score > 0);

const search2 = PMM_RAG.search("capping lamination trapped air", 2);
assert.ok(search2.length > 0);
assert.strictEqual(search2[0].doc.id, "rag-07");

const searchEmpty = PMM_RAG.search("", 2);
assert.strictEqual(searchEmpty.length, 2);
console.log("[PASS] BM25 lexical & semantic retrieval correctly ranks domain queries");

// 3. RAG Explanation Synthesis
const sampleLot = {
  id: 10,
  topic: "Noyes-Whitney Dissolution",
  subject: "Physical Pharmaceutics",
  q: "Under sink conditions, what governs dissolution rate?"
};
const explanation = PMM_RAG.explain(sampleLot, null);
assert.ok(explanation.corePrinciple.includes("Noyes-Whitney"));
assert.ok(explanation.formula.includes("dM/dt"));
assert.ok(explanation.confidence >= 50);
console.log("[PASS] RAG explanation synthesis produces formula, core principle and citations");

// 4. Authoring Agent Auditing
const validLot = {
  topic: "Tablet Friability",
  subject: "Quality Control",
  type: "blank",
  mode: "text",
  q: "Tablet friability test requires weight loss less than ____ percent.",
  accept: ["1", "one", "1%"],
  start: 50,
  inc: 10,
  mins: 2,
  answerSecs: 30
};
const auditPass = PMM_AGENTS.AuthoringAgent.audit(validLot);
assert.strictEqual(auditPass.valid, true);
assert.strictEqual(auditPass.issues.length, 0);

const invalidBlankLot = Object.assign({}, validLot, { q: "No blank marker in this question" });
const auditFail = PMM_AGENTS.AuthoringAgent.audit(invalidBlankLot);
assert.strictEqual(auditFail.valid, false);
assert.ok(auditFail.issues.some((i) => i.includes("____")));

const invalidMatchLot = {
  topic: "Matching",
  subject: "Subject",
  type: "matching",
  mode: "match",
  pairs: [{ l: "Left 1", r: "Duplicate" }, { l: "Left 2", r: "Duplicate" }],
  start: 50,
  inc: 10,
  mins: 2,
  answerSecs: 30
};
const matchAuditFail = PMM_AGENTS.AuthoringAgent.audit(invalidMatchLot);
assert.strictEqual(matchAuditFail.valid, false);
assert.ok(matchAuditFail.issues.some((i) => i.includes("distinct")));
console.log("[PASS] Authoring Agent audits schema invariants and rejects malformed lots");

// 5. Authoring Agent Draft Pack Generation
const testState = blank();
const addedCount = PMM_AGENTS.AuthoringAgent.generateDraftPack(testState, { count: 5 });
assert.strictEqual(addedCount, 5);
assert.strictEqual(testState.drafts.length, 5);
testState.drafts.forEach((d) => {
  assert.ok(d.did, "Draft must have auto-incremented did");
  assert.ok(d.topic && d.subject && d.q, "Draft must have topic, subject and prompt");
});
console.log("[PASS] Authoring Agent generates balanced draft packs for Quiz Master");

// 6. PharmaTutor Agent Query Answering
const tutorAnswer = PMM_AGENTS.PharmaTutorAgent.answerQuery("BCS Classification");
assert.ok(tutorAnswer.includes("Biopharmaceutics"));
assert.ok(tutorAnswer.includes("Takeaway"));
assert.ok(tutorAnswer.includes("Reference"));
console.log("[PASS] PharmaTutor Agent provides structured conceptual tutoring with citations");

// 7. Bid Strategist Agent Invariants
state = blank();
state.startPts = 1000;
state.roster = ["Team Alpha", "Team Beta"];
state.lots = [
  { id: 1, start: 100, inc: 10, endsAt: Date.now() + 60000, answerSecs: 60 }
];

// 7a. No bids placed: Balanced/Aggressive advice
const advice1 = PMM_AGENTS.BidStrategistAgent.analyze(state.lots[0], "Team Alpha", state);
assert.ok(advice1.tier === "aggressive" || advice1.tier === "balanced");
assert.ok(advice1.suggestedBid >= 100);

// 7b. Team Alpha bids 100: becomes leader
state.bids.push({ lotId: 1, name: "Team Alpha", amount: 100, at: Date.now() });
const adviceLeader = PMM_AGENTS.BidStrategistAgent.analyze(state.lots[0], "Team Alpha", state);
assert.strictEqual(adviceLeader.tier, "safe");
assert.strictEqual(adviceLeader.recommendation, "Hold Position");

// 7c. Team Beta with only 50 available points tries to bid on a lot requiring 200
const highLot = { id: 2, start: 200, inc: 20, endsAt: Date.now() + 60000, answerSecs: 60 };
state.base = { "team beta": 50 }; // override Team Beta to 50 pts
const adviceInsolvent = PMM_AGENTS.BidStrategistAgent.analyze(highLot, "Team Beta", state);
assert.strictEqual(adviceInsolvent.tier, "danger");
assert.strictEqual(adviceInsolvent.recommendation, "Insufficient Balance");
console.log("[PASS] Bid Strategist Agent solvency invariants and risk tiers pass");

// 8. SFX Synthesizer
assert.strictEqual(PMM_SFX.isEnabled(), true);
const toggled = PMM_SFX.toggle();
assert.strictEqual(toggled, false);
assert.strictEqual(localStorage.getItem("pmm3-sound"), "0");
PMM_SFX.toggle(); // restore
assert.strictEqual(PMM_SFX.isEnabled(), true);
console.log("[PASS] Procedural SFX synthesizer toggles and state persistence work");

console.log("\nALL RAG & MULTI-AGENT TESTS PASSED (100%)");
