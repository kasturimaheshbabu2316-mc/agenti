// Automated unit tests for sync.js engine
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

const badgeClasses = new Set();
let badgeTitle = "";
let badgeText = "";

global.document = {
  querySelectorAll: (sel) => {
    if (sel.includes("sync-badge") || sel.includes("#syncBadge")) {
      return [{
        classList: {
          add: (c) => badgeClasses.add(c),
          remove: (...args) => args.forEach(c => badgeClasses.delete(c)),
          contains: (c) => badgeClasses.has(c)
        },
        set title(t) { badgeTitle = t; },
        get title() { return badgeTitle; },
        querySelector: (sub) => {
          if (sub === ".sync-text") {
            return {
              set textContent(v) { badgeText = v; },
              get textContent() { return badgeText; }
            };
          }
          return null;
        }
      }];
    }
    return [];
  },
  addEventListener: () => {}
};

global.location = {
  protocol: "http:",
  host: "localhost:8000"
};

// Mock WebSocket class
let lastCreatedSocket = null;
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.sentMessages = [];
    lastCreatedSocket = this;
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 5);
  }
  send(data) {
    this.sentMessages.push(data);
  }
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose();
  }
};
global.WebSocket.OPEN = 1;

// Load store.js & sync.js
vm.runInThisContext(fs.readFileSync('store.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('sync.js', 'utf8'));

console.log("=== Running Sync Engine Unit Tests ===");

// 1. Initialization and badge updates
assert.ok(global.PMM_SYNC, "PMM_SYNC must be exposed globally");
assert.ok(global.PMM_SYNC.clientId, "Must have non-empty client ID");

PMM_SYNC.updateStatusBadges("offline");
assert.ok(badgeClasses.has("offline"));
assert.strictEqual(badgeText, "Local Mode");

PMM_SYNC.updateStatusBadges("live");
assert.ok(badgeClasses.has("live"));
assert.strictEqual(badgeText, "Live Sync");

console.log("[PASS] Sync engine status badge updates work correctly");

// 2. Subscriber pattern
let receivedMsg = null;
const unsub = PMM_SYNC.subscribe((msg) => {
  receivedMsg = msg;
});

// Trigger connection
PMM_SYNC.init();
assert.ok(lastCreatedSocket, "Mock WebSocket should be instantiated");
assert.strictEqual(lastCreatedSocket.url, "ws://localhost:8000/ws");

// Wait for onopen
setTimeout(() => {
  assert.strictEqual(PMM_SYNC.isConnected, true);

  // 3. Message handling (INIT)
  const incomingInit = {
    type: "INIT",
    state: {
      nextId: 5,
      startPts: 1200,
      lots: [{ id: 1, topic: "Noyes-Whitney Dissolution", endsAt: Date.now() + 60000 }],
      bids: [],
      answers: [],
      base: {},
      epoch: 100,
      roster: ["Team Alpha"],
      drafts: []
    }
  };
  lastCreatedSocket.onmessage({ data: JSON.stringify(incomingInit) });
  assert.ok(receivedMsg, "Subscriber should receive INIT notification");
  assert.strictEqual(state.startPts, 1200);
  assert.strictEqual(state.lots.length, 1);
  console.log("[PASS] State adoption on WebSocket INIT message works");

  // 4. pushState via save() integration
  const outgoingState = Object.assign({}, state, { startPts: 2000 });
  save(outgoingState);

  assert.ok(lastCreatedSocket.sentMessages.length > 0, "pushState must send state over socket");
  const lastSent = JSON.parse(lastCreatedSocket.sentMessages[lastCreatedSocket.sentMessages.length - 1]);
  assert.strictEqual(lastSent.type, "SYNC");
  assert.strictEqual(lastSent.state.startPts, 2000);
  assert.strictEqual(lastSent.clientId, PMM_SYNC.clientId);
  console.log("[PASS] save() dispatch through WebSocket pushState works seamlessly");

  // 5. Echo prevention (skip messages originating from this client)
  let echoReceived = false;
  receivedMsg = null;
  const echoMsg = {
    type: "SYNC",
    clientId: PMM_SYNC.clientId, // same client
    state: Object.assign({}, state, { startPts: 9999 })
  };
  lastCreatedSocket.onmessage({ data: JSON.stringify(echoMsg) });
  assert.strictEqual(receivedMsg, null, "Should skip echo of own client changes");
  assert.notStrictEqual(state.startPts, 9999, "State should not be overwritten by self-echo");
  console.log("[PASS] Self-echo prevention guard blocks redundant re-renders");

  // 6. External change adoption
  const externalMsg = {
    type: "SYNC",
    clientId: "other_client_xyz",
    state: Object.assign({}, state, { startPts: 3000 })
  };
  lastCreatedSocket.onmessage({ data: JSON.stringify(externalMsg) });
  assert.ok(receivedMsg !== null, "Should process external changes");
  assert.strictEqual(state.startPts, 3000, "Should adopt external state update");
  console.log("[PASS] External multi-client state adoption works");

  // 7. Unsubscribe
  unsub();
  receivedMsg = null;
  lastCreatedSocket.onmessage({ data: JSON.stringify(externalMsg) });
  assert.strictEqual(receivedMsg, null, "Unsubscribed handler should not be called");
  console.log("[PASS] Subscriber unsubscribe cleanup works");

  console.log("\nALL SYNC ENGINE TESTS PASSED (100%)");
  process.exit(0);
}, 20);
