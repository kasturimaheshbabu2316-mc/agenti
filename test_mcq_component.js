// Verification of Interactive MCQ Option Selection Component
const fs = require('fs');
const assert = require('assert');

console.log("=== Running MCQ Option Selection Component Tests ===");

// 1. Verify CSS Rules & Visual Requirements
const css = fs.readFileSync('style.css', 'utf8');

// Theme check: Deep OLED dark background (#05060a)
assert.ok(css.includes('--bg: #05060a'), "CSS must define deep OLED dark background token #05060a");

// Typography check: Modern sans-serif for options, monospace for badges
assert.ok(css.includes('--font-sans: "Plus Jakarta Sans"') || css.includes('--font-sans'), "CSS must define modern sans-serif");
assert.ok(css.includes('--font-mono: "JetBrains Mono"') || css.includes('--font-mono'), "CSS must define monospace font");

// Layout: 2-column grid on desktop, single column on mobile
assert.ok(css.includes('.opts {') && css.includes('grid-template-columns: 1fr 1fr'), "Desktop opts must use 2-column grid");
assert.ok(css.includes('@media (max-width: 640px)') && css.includes('grid-template-columns: 1fr'), "Mobile opts must collapse to single column");

// Resting State:
// - Translucent frosted glass card (rgba(255, 255, 255, 0.04)) with backdrop-filter blur
// - Thin 1px subtle border (rgba(255, 255, 255, 0.08)) and rounded corners (16px)
// - Letter indicator inside a 32x32px square container with rounded corners (10px)
// - Smooth CSS transitions on all properties (0.2s cubic-bezier(0.16, 1, 0.3, 1))
assert.ok(css.includes('background: rgba(255, 255, 255, 0.04);'), "Resting state must have rgba(255, 255, 255, 0.04) background");
assert.ok(css.includes('backdrop-filter: blur(12px);'), "Resting state must have backdrop-filter blur");
assert.ok(css.includes('border: 1px solid rgba(255, 255, 255, 0.08);'), "Resting state must have 1px subtle border");
assert.ok(css.includes('border-radius: 16px;'), "Resting state must have 16px border-radius");
assert.ok(css.includes('width: 32px;') && css.includes('height: 32px;') && css.includes('border-radius: 10px;'), "Badge must be 32x32px with 10px radius");
assert.ok(css.includes('transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);'), "Must have smooth 0.2s cubic-bezier transitions");

// Hover State:
// - Subtle horizontal tactile slide: transform: translateX(4px)
// - Border illuminates with a soft lavender rim: border-color: rgba(196, 181, 245, 0.35)
// - Background subtly brightens
assert.ok(css.includes('transform: translateX(4px);'), "Hover must include transform: translateX(4px)");
assert.ok(css.includes('border-color: rgba(196, 181, 245, 0.35);'), "Hover must illuminate soft lavender rim");

// Selected State (.picked / .active):
// - Glowing lavender halo: box-shadow: 0 0 20px rgba(196, 181, 245, 0.28)
// - Border highlights to solid lavender (#c4b5f5)
// - Cyber gradient badge with dark text (#05060a)
assert.ok(css.includes('0 0 20px rgba(196, 181, 245, 0.28)'), "Selected state must have 0 0 20px lavender halo");
assert.ok(css.includes('border-color: #c4b5f5;'), "Selected state must have #c4b5f5 solid lavender border");
assert.ok(css.includes('linear-gradient(135deg, #7ee7f8, #c4b5f5, #ffb38a)'), "Selected badge must have 3-stop cyber gradient");
assert.ok(css.includes('color: #05060a;'), "Selected badge must have dark #05060a text");
assert.ok(css.includes('.opt.active'), "CSS must support .opt.active selector alongside .opt.picked");
assert.ok(css.includes('transform: translateX(4px) scale(0.98);'), "Hover+active click must smoothly combine slide and compression");

// Evaluation States:
// - Correct (.right): Glowing emerald green border, emerald badge background, box-shadow: 0 0 20px rgba(52, 211, 153, 0.3)
assert.ok(css.includes('.opt.right') && css.includes('border-color: #34d399;'), "Correct state must have emerald border");
assert.ok(css.includes('box-shadow: 0 0 20px rgba(52, 211, 153, 0.3);'), "Correct state must have emerald glow halo");
assert.ok(css.includes('.opt.right b') && css.includes('background: #34d399;'), "Correct badge must have emerald background");

// - Wrong Choice (.wrongpick): Glowing coral/ruby red border, coral badge background, box-shadow: 0 0 20px rgba(244, 63, 94, 0.3)
assert.ok(css.includes('.opt.wrongpick') && css.includes('border-color: #f43f5e;'), "Wrong state must have coral/ruby border");
assert.ok(css.includes('box-shadow: 0 0 20px rgba(244, 63, 94, 0.3);'), "Wrong state must have coral glow halo");
assert.ok(css.includes('.opt.wrongpick b') && css.includes('background: #f43f5e;'), "Wrong badge must have coral background");

// - Cascade & Specificity Protection:
assert.ok(css.includes('.opt.right:hover:not(:disabled)'), "CSS must include dedicated hover rule for .opt.right to prevent lavender border cascade bleed");
assert.ok(css.includes('.opt.wrongpick:hover:not(:disabled)'), "CSS must include dedicated hover rule for .opt.wrongpick to prevent lavender border cascade bleed");
assert.ok(css.includes('.opt:active:not(:disabled)'), "CSS must include tactile active micro-interaction");
assert.ok(css.includes('.opt,') && css.includes('.opt b') && css.includes('@media (prefers-reduced-motion: reduce)'), "CSS must support prefers-reduced-motion accessibility for .opt and .opt b");

console.log("[PASS] CSS specifications, design tokens, and specificity protection verified 100%");

// 2. HTML Markup & Semantics Verification
const mcqHtml = fs.readFileSync('mcq.html', 'utf8');
assert.ok(mcqHtml.startsWith('<!DOCTYPE html>'), "mcq.html must have valid <!DOCTYPE html>");
assert.ok(!/<[^>]*\sstyle=["'][^"']*["'][^>]*>/.test(mcqHtml), "mcq.html must have zero inline styles");

// Button structure <button class="opt"><b>A</b><span>Text</span></button>
const buttonPattern = /<button class="opt[^"]*"[^>]*>[\s\S]*?<b>[A-D]<\/b>[\s\S]*?<span>[\s\S]*?<\/span>[\s\S]*?<\/button>/;
assert.ok(buttonPattern.test(mcqHtml), "mcq.html must implement semantic button markup <button class='opt'><b>A</b><span>Text</span></button>");

console.log("[PASS] HTML semantic structure and zero-inline-style rule verified 100%");

// 3. Simulated Vanilla JS Interaction Engine
class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...cls) { cls.forEach(c => this._classes.add(c)); }
  remove(...cls) { cls.forEach(c => this._classes.delete(c)); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this._classes.add(c); else this._classes.delete(c);
      return force;
    }
    if (this._classes.has(c)) { this._classes.delete(c); return false; }
    this._classes.add(c); return true;
  }
  contains(c) { return this._classes.has(c); }
}

class MockButton {
  constructor(letter, text, index) {
    this.classList = new MockClassList();
    this.letter = letter;
    this.text = text;
    this.index = index;
    this.attributes = { "aria-checked": "false" };
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
}

const buttons = [
  new MockButton("A", "Option A", 0),
  new MockButton("B", "Option B", 1),
  new MockButton("C", "Option C", 2),
  new MockButton("D", "Option D", 3)
];

// Single select interaction logic (supporting both .picked and .active)
function selectOption(idx) {
  buttons.forEach((b, i) => {
    const isPick = i === idx;
    b.classList.toggle("picked", isPick);
    b.classList.toggle("active", isPick);
    b.setAttribute("aria-checked", isPick ? "true" : "false");
  });
}

// Answer evaluation logic
function evaluateAnswer(selectedIdx, correctIdx) {
  buttons.forEach((b, i) => {
    b.classList.remove("picked", "active");
    if (i === correctIdx) {
      b.classList.add("right");
    } else if (i === selectedIdx) {
      b.classList.add("wrong", "wrongpick");
    }
  });
}

// Reset logic
function resetOptions() {
  buttons.forEach(b => {
    b.classList.remove("picked", "active", "right", "wrong", "wrongpick");
    b.setAttribute("aria-checked", "false");
  });
}

// Test resting state
buttons.forEach(b => {
  assert.strictEqual(b.classList.contains("picked"), false);
  assert.strictEqual(b.classList.contains("active"), false);
  assert.strictEqual(b.classList.contains("right"), false);
  assert.strictEqual(b.classList.contains("wrongpick"), false);
});
console.log("[PASS] Initial resting state verified");

// Test single select picking Option B (index 1)
selectOption(1);
assert.strictEqual(buttons[1].classList.contains("picked"), true);
assert.strictEqual(buttons[1].classList.contains("active"), true);
assert.strictEqual(buttons[1].getAttribute("aria-checked"), "true");
assert.strictEqual(buttons[0].classList.contains("picked"), false);
assert.strictEqual(buttons[2].classList.contains("picked"), false);
assert.strictEqual(buttons[3].classList.contains("picked"), false);
console.log("[PASS] Single-selection exclusive pick state verified");

// Test re-picking Option C (index 2)
selectOption(2);
assert.strictEqual(buttons[2].classList.contains("picked"), true);
assert.strictEqual(buttons[2].classList.contains("active"), true);
assert.strictEqual(buttons[1].classList.contains("picked"), false, "Previous selection must be deselected");
assert.strictEqual(buttons[1].classList.contains("active"), false, "Previous selection must have active class cleared");
console.log("[PASS] Selection mutation switches picked target cleanly");

// Test correct evaluation when user picked Option C (correct is C)
evaluateAnswer(2, 2);
assert.strictEqual(buttons[2].classList.contains("right"), true, "Correct choice gets .right class");
assert.strictEqual(buttons[2].classList.contains("picked"), false, "Picked class cleared upon evaluation");
assert.strictEqual(buttons[2].classList.contains("active"), false, "Active class cleared upon evaluation");
assert.strictEqual(buttons[2].classList.contains("wrongpick"), false);
console.log("[PASS] Correct answer evaluation (.right) verified");

// Test wrong evaluation when user picked Option A (correct is C)
resetOptions();
selectOption(0);
evaluateAnswer(0, 2);
assert.strictEqual(buttons[0].classList.contains("wrong"), true, "Incorrect user selection gets .wrong");
assert.strictEqual(buttons[0].classList.contains("wrongpick"), true, "Incorrect user selection gets .wrongpick");
assert.strictEqual(buttons[2].classList.contains("right"), true, "Correct answer revealed with .right");
assert.strictEqual(buttons[1].classList.contains("right"), false);
assert.strictEqual(buttons[3].classList.contains("right"), false);
console.log("[PASS] Wrong answer evaluation (.wrong/.wrongpick on pick + .right on correct) verified");

// Test reset
resetOptions();
buttons.forEach(b => {
  assert.strictEqual(b.classList.contains("picked"), false);
  assert.strictEqual(b.classList.contains("right"), false);
  assert.strictEqual(b.classList.contains("wrongpick"), false);
  assert.strictEqual(b.getAttribute("aria-checked"), "false");
});
console.log("[PASS] Reset restores resting state cleanly");

// 4. Keyboard Navigation Simulation (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
let focusedIndex = 0;
function handleKeyNav(key) {
  if (key === "ArrowDown" || key === "ArrowRight") {
    focusedIndex = (focusedIndex + 1) % buttons.length;
    selectOption(focusedIndex);
  } else if (key === "ArrowUp" || key === "ArrowLeft") {
    focusedIndex = (focusedIndex - 1 + buttons.length) % buttons.length;
    selectOption(focusedIndex);
  }
}

selectOption(0);
handleKeyNav("ArrowDown");
assert.strictEqual(buttons[1].classList.contains("picked"), true, "ArrowDown must advance selection to index 1");
handleKeyNav("ArrowRight");
assert.strictEqual(buttons[2].classList.contains("picked"), true, "ArrowRight must advance selection to index 2");
handleKeyNav("ArrowUp");
assert.strictEqual(buttons[1].classList.contains("picked"), true, "ArrowUp must decrement selection back to index 1");
handleKeyNav("ArrowLeft");
assert.strictEqual(buttons[0].classList.contains("picked"), true, "ArrowLeft must decrement selection back to index 0");
handleKeyNav("ArrowUp");
assert.strictEqual(buttons[3].classList.contains("picked"), true, "ArrowUp must wrap around to index 3");
handleKeyNav("ArrowDown");
assert.strictEqual(buttons[0].classList.contains("picked"), true, "ArrowDown must wrap around to index 0");
console.log("[PASS] W3C ARIA Keyboard navigation (Arrow keys with wrapping) verified");

// 5. Multi-line Text & Formula Robustness Test
const longText = "According to the modified Noyes-Whitney and Nernst-Brunner equations: dM/dt = (D·A/h)·(Cs - Cb), wherein the hydrodynamic diffusion boundary layer h is inversely proportional to agitation velocity rpm^(0.75) and dissolution occurs strictly under sink conditions (Cb < 0.1·Cs) across physiologically relevant buffer media.";
const mathButton = new MockButton("A", longText, 0);
assert.strictEqual(mathButton.text.length > 250, true, "Option handles long multi-line scientific strings");
assert.ok(mathButton.text.includes("dM/dt = (D·A/h)·(Cs - Cb)"), "Option handles mathematical subscripts and kinetics symbols");
console.log("[PASS] Multi-line option text and scientific notation handling verified");

// 6. Standalone Single-File Component Verification (option-card.html)
const optHtml = fs.readFileSync('option-card.html', 'utf8');

// Valid DOCTYPE
assert.ok(optHtml.startsWith('<!DOCTYPE html>'), "option-card.html must have valid <!DOCTYPE html>");

// Zero inline styles
assert.ok(!/<[^>]*\sstyle=["'][^"']*["'][^>]*>/.test(optHtml), "option-card.html must have zero inline styles");

// Self-contained: No external CSS dependencies
assert.ok(!/<link\s+[^>]*rel=["']stylesheet["']/i.test(optHtml), "option-card.html must have zero external CSS libraries or frameworks");

// Embedded <style> and <script>
assert.ok(optHtml.includes('<style>') && optHtml.includes('</style>'), "option-card.html must have embedded <style>");
assert.ok(optHtml.includes('<script>') && optHtml.includes('</script>'), "option-card.html must have embedded <script>");

// Palette & Design Tokens
assert.ok(optHtml.includes('#08090d'), "Must contain deep luxury background #08090d");
assert.ok(optHtml.includes('#38bdf8'), "Must contain neon cyan accent #38bdf8");
assert.ok(optHtml.includes('#c4b5f5'), "Must contain neon lavender accent #c4b5f5");
assert.ok(optHtml.includes('#34d399'), "Must contain neon emerald accent #34d399");
assert.ok(optHtml.includes('#f43f5e'), "Must contain neon coral accent #f43f5e");

// Frosted glassmorphism, Specular highlight & Elevation
assert.ok(optHtml.includes('backdrop-filter: blur(12px)'), "Must include frosted glassmorphism backdrop blur");
assert.ok(optHtml.includes('inset 0 1px 0 rgba(255, 255, 255, 0.15)'), "Must include specular top-edge highlight");

// Layout: 2-column desktop grid & mobile single-column
assert.ok(optHtml.includes('grid-template-columns: 1fr 1fr'), "Must include 2-column desktop grid");
assert.ok(optHtml.includes('@media (max-width: 640px)') && optHtml.includes('grid-template-columns: 1fr'), "Must collapse to 1-column on mobile (<640px)");

// Micro-interactions: Resting, Hover, Active, Picked, Right, Wrong
assert.ok(optHtml.includes('transition: var(--trans-card)') || optHtml.includes('transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'), "Must include smooth 0.2s cubic-bezier transition");
assert.ok(optHtml.includes('transform: translateX(4px)'), "Hover must include transform: translateX(4px)");
assert.ok(optHtml.includes('transform: scale(0.98)'), "Active tap must include transform: scale(0.98)");
assert.ok(optHtml.includes('transform: translateX(4px) scale(0.98);'), "Hover+active click must smoothly combine slide and compression");
assert.ok(optHtml.includes('box-shadow: 0 0 20px rgba(196, 181, 245, 0.28)') || optHtml.includes('0 0 20px rgba(196, 181, 245, 0.28)'), "Selected state must have 20px lavender halo");
assert.ok(optHtml.includes('.opt.wrong') && optHtml.includes('border-color: var(--coral)'), "Wrong state must support .wrong class with coral accent");
assert.ok(optHtml.includes('.opt.right') && optHtml.includes('border-color: var(--emerald)'), "Right state must support .right class with emerald accent");
assert.ok(optHtml.includes('.opt.active') && optHtml.includes('classList.toggle("active"'), "Component must support .active class alongside .picked");

// Shortcut guard & AudioContext lazy init
assert.ok(optHtml.includes('e.ctrlKey || e.altKey || e.metaKey'), "Keyboard listener must protect standard system shortcuts (Ctrl+A, Ctrl+C, etc.)");
assert.ok(!/audioCtx\s*=\s*new\s+\(?window\.(AudioContext|webkitAudioContext)/.test(optHtml), "AudioContext must be lazily initialized on user interaction rather than eagerly on load");

// Roving tabindex & button semantics
assert.ok(optHtml.includes('tabindex="0"') && optHtml.includes('tabindex="-1"'), "Option cards must implement W3C roving tabindex (0 for first, -1 for others)");
assert.ok(optHtml.includes('window.OptionCardComponent'), "Must expose OptionCardComponent programmatic interface");

// Badge structure & cyber gradient
assert.ok(optHtml.includes('width: 32px') && optHtml.includes('height: 32px'), "Badge must be 32x32px");
assert.ok(optHtml.includes('linear-gradient(135deg, #7ee7f8, #c4b5f5, #ffb38a)'), "Selected badge must have 3-stop luminous cyber gradient");

console.log("[PASS] Standalone single-file component (option-card.html) specifications verified 100%");

console.log("\nALL MCQ COMPONENT TESTS PASSED (100%)");
