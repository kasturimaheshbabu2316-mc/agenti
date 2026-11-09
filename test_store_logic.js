// Verification of store logic invariants
const fs = require('fs');
const assert = require('assert');

// Mock localStorage and window/DOM
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};
global.document = { querySelector: () => null };

const vm = require('vm');

// Load store.js into global context
const code = fs.readFileSync('store.js', 'utf8');
vm.runInThisContext(code);

console.log("=== Running Store.js Invariant Tests ===");

// Test 1: Blank state
const s = blank();
assert.strictEqual(s.startPts, 1000);
assert.deepStrictEqual(s.lots, []);
console.log("[PASS] Blank state initialized properly");

// Test 2: Text Normalization and isRight
const lotText = {
  id: 1,
  mode: "text",
  accept: ["Disintegration", "Disintegration time", "DT test."]
};

assert.strictEqual(isRight(lotText, { choice: "disintegration" }), true);
assert.strictEqual(isRight(lotText, { choice: "   DISINTEGRATION TIME.  " }), true);
assert.strictEqual(isRight(lotText, { choice: "dt test" }), true);
assert.strictEqual(isRight(lotText, { choice: "dissolution" }), false);
console.log("[PASS] Text normalization evaluation works with punctuation and casing resilience");

// Test 3: Matching Question format
const lotMatch = {
  id: 2,
  mode: "match",
  pairs: [
    { l: "Binder", r: "PVP" },
    { l: "Disintegrant", r: "Sodium Starch Glycolate" },
    { l: "Lubricant", r: "Magnesium Stearate" }
  ]
};
assert.strictEqual(isRight(lotMatch, { choice: [0, 1, 2] }), true);
assert.strictEqual(isRight(lotMatch, { choice: [1, 0, 2] }), false);
console.log("[PASS] Matching pairs deterministic validation works");

// Test 4: Economics & Solvency invariants
state.startPts = 1000;
state.roster = ["Team Alpha", "Team Beta"];
state.lots = [
  { id: 1, start: 50, inc: 10, endsAt: Date.now() + 60000, answerSecs: 60 } // live bidding lot
];
state.bids = [
  { lotId: 1, name: "Team Alpha", amount: 150, at: Date.now() }
];

// Team Alpha has 1000 pts, 150 committed in lot 1
assert.strictEqual(points("Team Alpha"), 1000);
assert.strictEqual(committed("Team Alpha", -1), 150);
assert.strictEqual(available("Team Alpha", -1), 850);
// Excepting lot 1 (when raising their own bid)
assert.strictEqual(available("Team Alpha", 1), 1000);

console.log("[PASS] Solvency calculation and point commitment invariants pass");

// Test 5: Phase transitions and outcomes
// 5a. Active bidding
assert.strictEqual(phase(state.lots[0]), "bidding");

// 5b. Answering window
state.lots[0].endsAt = Date.now() - 5000; // bidding ended 5s ago
assert.strictEqual(phase(state.lots[0]), "answering");

// 5c. Correct answer submission
state.answers.push({ lotId: 1, name: "Team Alpha", choice: 0, at: Date.now() });
state.lots[0].correct = 0;
assert.strictEqual(phase(state.lots[0]), "correct");
assert.strictEqual(outcome(state.lots[0]), 150);
assert.strictEqual(settled("Team Alpha"), 150);
assert.strictEqual(points("Team Alpha"), 1150);

// 5d. Wrong answer
state.answers[0].choice = 1;
assert.strictEqual(phase(state.lots[0]), "wrong");
assert.strictEqual(outcome(state.lots[0]), -150);
assert.strictEqual(settled("Team Alpha"), -150);
assert.strictEqual(points("Team Alpha"), 850);

console.log("[PASS] Phase transitions (bidding -> answering -> correct/wrong) and economic scoring pass");

// Test 6: Leaderboard sorting
const ranked = teams();
assert.strictEqual(ranked.length >= 2, true);
assert.strictEqual(ranked[0].pts >= ranked[1].pts, true);
console.log("[PASS] Leaderboard ranking invariants pass");

console.log("\nALL FUNCTIONAL TESTS PASSED (100%)");
