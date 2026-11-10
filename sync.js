/* ==========================================================================
   Pharmaceutics Mastery Matrix 3 (PMM 3) – Real-Time Sync Engine (sync.js)
   Cross-device WebSocket synchronization with automatic reconnect,
   exponential backoff, keepalive pings, and graceful offline fallback.
   ========================================================================== */

(function (global) {
  "use strict";

  const subscribers = [];
  let socket = null;
  let isConnected = false;
  let reconnectTimer = null;
  let pingTimer = null;
  let reconnectDelay = 1500;
  const MAX_RECONNECT_DELAY = 12000;
  const clientId = "client_" + Math.random().toString(36).substring(2, 10);

  function getWsUrl() {
    if (typeof location === "undefined") return null;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${location.host}/ws`;
  }

  function updateStatusBadges(status) {
    if (typeof document === "undefined") return;
    const badges = document.querySelectorAll(".sync-badge, #syncBadge");
    badges.forEach((badge) => {
      badge.classList.remove("live", "offline", "connecting");
      const txt = badge.querySelector(".sync-text");
      if (status === "live") {
        badge.classList.add("live");
        badge.title = "Connected to live WebSocket server. Changes sync across devices.";
        if (txt) txt.textContent = "Live Sync";
      } else if (status === "connecting") {
        badge.classList.add("connecting");
        badge.title = "Connecting to real-time server...";
        if (txt) txt.textContent = "Connecting...";
      } else {
        badge.classList.add("offline");
        badge.title = "Offline / Local Mode. State is kept in local browser storage.";
        if (txt) txt.textContent = "Local Mode";
      }
    });
  }

  function notifySubscribers(message) {
    subscribers.forEach((fn) => {
      try {
        fn(message);
      } catch (err) {
        console.warn("[PMM Sync] Subscriber callback error:", err);
      }
    });
  }

  function connect() {
    if (typeof location === "undefined" || !location.protocol.startsWith("http")) {
      updateStatusBadges("offline");
      return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    clearTimeout(reconnectTimer);
    updateStatusBadges("connecting");

    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      isConnected = true;
      reconnectDelay = 1500;
      updateStatusBadges("live");

      // Start keepalive ping every 25 seconds
      clearInterval(pingTimer);
      pingTimer = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "PING" }));
        }
      }, 25000);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg || typeof msg !== "object") return;

        // Skip echo of our own change
        if (msg.clientId && msg.clientId === clientId) return;

        if (msg.type === "INIT") {
          // Compare server state with local state
          const serverState = msg.state;
          const localState = typeof load === "function" ? load() : null;

          if (serverState && localState) {
            const serverHasData = (serverState.lots && serverState.lots.length > 0) ||
                                  (serverState.drafts && serverState.drafts.length > 0) ||
                                  (serverState.roster && serverState.roster.length > 0);
            const localHasData = (localState.lots && localState.lots.length > 0) ||
                                 (localState.drafts && localState.drafts.length > 0);

            if (!serverHasData && localHasData) {
              // Local has existing quiz master questions, server is newly booted: push to server!
              pushState(localState);
              return;
            }

            // Adopt server state
            if (typeof state !== "undefined") {
              Object.assign(state, serverState);
            }
            if (typeof save === "function") {
              save(serverState, false); // don't echo back
            }
            notifySubscribers(msg);
          }
        } else if (msg.type === "SYNC" || msg.type === "BID_PLACED" || msg.type === "ANSWER_SUBMITTED") {
          if (msg.state) {
            if (typeof state !== "undefined") {
              Object.assign(state, msg.state);
            }
            if (typeof save === "function") {
              save(msg.state, false); // don't echo back
            }
          }
          notifySubscribers(msg);
        }
      } catch (e) {
        console.warn("[PMM Sync] Message parse error:", e);
      }
    };

    socket.onclose = () => {
      isConnected = false;
      clearInterval(pingTimer);
      updateStatusBadges("offline");
      scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch (_) {}
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connect();
      reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
    }, reconnectDelay);
  }

  function pushState(newState) {
    if (!newState) return;
    if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({
          type: "SYNC",
          state: newState,
          clientId: clientId
        }));
      } catch (e) {
        console.warn("[PMM Sync] Send failed:", e);
      }
    } else if (typeof location !== "undefined" && location.protocol.startsWith("http")) {
      // Fallback REST POST if websocket is briefly reconnecting
      try {
        fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newState)
        }).catch(() => {});
      } catch (_) {}
    }
  }

  const PMM_SYNC = {
    clientId,
    get isConnected() { return isConnected; },
    subscribe(fn) {
      if (typeof fn === "function" && !subscribers.includes(fn)) {
        subscribers.push(fn);
      }
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx !== -1) subscribers.splice(idx, 1);
      };
    },
    pushState,
    updateStatusBadges,
    init() {
      connect();
    }
  };

  global.PMM_SYNC = PMM_SYNC;

  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      PMM_SYNC.init();
    });
  }
})(typeof window !== "undefined" ? window : global);
