/* ==========================================================================
   Pharmaceutics Mastery Matrix 3 (PMM 3) – Multi-Agent AI System (agents.js)
   Agents:
     1. AuthoringAgent   - Automated RAG Question Generator & Lot Auditor
     2. PharmaTutorAgent - Real-time Conceptual Mentor & Post-Settlement Explainer
     3. BidStrategistAgent - Auction Solvency & Risk Advisory Engine
   ========================================================================== */

(function (global) {
  "use strict";

  const RAG = global.PMM_RAG;

  /* --------------------------------------------------------------------------
     1. Master Question Templates for All 8 Formats (Pharma Mastery Matrix)
     -------------------------------------------------------------------------- */
  const QUESTION_BANK_CATALOG = [
    {
      type: "blank",
      mode: "text",
      topic: "Noyes-Whitney Dissolution",
      subject: "Physical Pharmaceutics · Unit I",
      difficulty: "Medium",
      hint: "Governs solid-liquid mass transfer rate through the stagnant hydrodynamic layer.",
      q: "Under sink conditions, the rate of drug dissolution is directly described by the ____ equation.",
      accept: ["Noyes-Whitney", "Noyes Whitney", "Noyes-Whitney equation", "Noyes Whitney equation"],
      start: 60,
      inc: 15,
      mins: 2,
      answerSecs: 45
    },
    {
      type: "statement",
      mode: "mcq",
      topic: "BCS Classification Criteria",
      subject: "Biopharmaceutics & Pharmacokinetics · Unit II",
      difficulty: "Hard",
      hint: "Focus on dose-solubility volume and human absorption cut-offs.",
      q: "Statement I: A drug is highly soluble when its highest dose dissolves in <= 250 mL water from pH 1.0 to 6.8.\nStatement II: BCS Class II compounds exhibit high aqueous solubility and low intestinal permeability.\nWhich of the following is correct?",
      opts: [
        "Statement I is correct, Statement II is incorrect",
        "Both Statement I and Statement II are correct",
        "Statement I is incorrect, Statement II is correct",
        "Both Statement I and Statement II are incorrect"
      ],
      correct: 0,
      start: 80,
      inc: 20,
      mins: 2.5,
      answerSecs: 60
    },
    {
      type: "reasoning",
      mode: "mcq",
      topic: "Tablet Capping & Entrapped Air",
      subject: "Tablet Technology · Unit III",
      difficulty: "Medium",
      hint: "Examine upper punch decompression velocity and fines content.",
      q: "Assertion (A): High turret speed and excessive fine granules (<100 mesh) frequently induce tablet capping.\nReason (R): Interstitial air trapped within the granule bed cannot evacuate during rapid punch compression.",
      opts: [
        "Both A and R are true, and R is the correct explanation of A",
        "Both A and R are true, but R is not the correct explanation of A",
        "A is true, but R is false",
        "A is false, but R is true"
      ],
      correct: 0,
      start: 70,
      inc: 15,
      mins: 2,
      answerSecs: 50
    },
    {
      type: "aptitude",
      mode: "mcq",
      topic: "Superdisintegrant Swelling Dynamics",
      subject: "Industrial Pharmacy · Unit III",
      difficulty: "Easy",
      hint: "Consider the sodium salt of cross-linked carboxymethylcellulose.",
      q: "Which superdisintegrant is chemically defined as internally cross-linked sodium carboxymethylcellulose that promotes disintegration primarily via rapid wicking and two-dimensional swelling?",
      opts: [
        "Croscarmellose sodium (Ac-Di-Sol)",
        "Sodium starch glycolate (Primojel)",
        "Crospovidone (Polyplasdone XL)",
        "Microcrystalline cellulose (Avicel PH-102)"
      ],
      correct: 0,
      start: 50,
      inc: 10,
      mins: 1.5,
      answerSecs: 40
    },
    {
      type: "matching",
      mode: "match",
      topic: "USP Dissolution Apparatus Classification",
      subject: "Quality Assurance & Pharmacopeial Testing · Unit V",
      difficulty: "Hard",
      hint: "Match standard USP apparatus numbers 1 through 4 with their official mechanical design.",
      q: "Match each USP dissolution apparatus with its official design.",
      pairs: [
        { l: "USP Apparatus 1", r: "Rotating Basket (100 rpm standard)" },
        { l: "USP Apparatus 2", r: "Paddle (50/75 rpm standard)" },
        { l: "USP Apparatus 3", r: "Reciprocating Cylinder" },
        { l: "USP Apparatus 4", r: "Flow-Through Cell" }
      ],
      start: 100,
      inc: 25,
      mins: 3,
      answerSecs: 75
    },
    {
      type: "qa",
      mode: "text",
      topic: "Emulsion Phase Inversion Rule",
      subject: "Physical Pharmaceutics · Unit IV",
      difficulty: "Medium",
      hint: "Named after the scientist who formulated the continuous phase solubility rule.",
      q: "Which fundamental empirical rule states that the continuous phase of an emulsion is dictated by the phase in which the emulsifier is most soluble?",
      accept: ["Bancroft's Rule", "Bancrofts Rule", "Bancroft rule", "Bancroft"],
      start: 60,
      inc: 15,
      mins: 2,
      answerSecs: 45
    },
    {
      type: "video",
      mode: "mcq",
      topic: "Fluid Bed Granulation Top-Spray Dynamics",
      subject: "Unit Operations & Processing · Unit III",
      difficulty: "Medium",
      hint: "Observe the atomized liquid binder droplet spray zone and fluidization trajectory.",
      media: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      q: "In a top-spray fluidized bed processor, what physical phenomenon occurs when the liquid binder spray rate significantly exceeds the granule evaporation rate?",
      opts: [
        "Over-wetting leading to mass defluidization and collapse",
        "Spray drying of binder into micro-fine dust",
        "Excessive electrostatic charge generation",
        "Premature thermal sintering of active ingredient"
      ],
      correct: 0,
      start: 80,
      inc: 20,
      mins: 2.5,
      answerSecs: 60
    },
    {
      type: "sound",
      mode: "text",
      topic: "Acoustic Rotary Tablet Press Monitoring",
      subject: "Process Analytical Technology (PAT) · Unit III",
      difficulty: "Hard",
      hint: "A high-pitch acoustic harmonic emitted during upper punch compression.",
      media: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      q: "In high-speed rotary tablet press acoustic emission monitoring, a high-frequency transient spike during punch entry indicates die-wall ____.",
      accept: ["Friction", "binding", "die binding", "die-wall friction", "adhesion"],
      start: 90,
      inc: 20,
      mins: 2,
      answerSecs: 50
    }
  ];

  /* --------------------------------------------------------------------------
     2. Authoring Agent: Generates Questions, Drafts, and Audits Lots
     -------------------------------------------------------------------------- */
  const AuthoringAgent = {
    /* Audit question lot for schema invariants and common authoring errors */
    audit(lot) {
      const issues = [];
      if (!lot.topic || lot.topic.trim().length < 3) issues.push("Topic must be at least 3 characters.");
      if (!lot.subject || lot.subject.trim().length < 3) issues.push("Subject must be specified.");
      if (lot.start <= 0) issues.push("Starting bid must be positive.");
      if (lot.inc <= 0) issues.push("Minimum raise increment must be positive.");
      if (lot.mins <= 0) issues.push("Bidding duration must be greater than 0 minutes.");
      if (lot.answerSecs < 10) issues.push("Answer timer must be at least 10 seconds.");

      if (lot.mode === "mcq") {
        if (!Array.isArray(lot.opts) || lot.opts.length !== 4) issues.push("MCQ must have exactly 4 options.");
        else if (lot.opts.some((o) => !o || !o.trim())) issues.push("All 4 MCQ options must be non-empty.");
        if (typeof lot.correct !== "number" || lot.correct < 0 || lot.correct > 3) issues.push("Correct option index must be 0, 1, 2, or 3.");
      } else if (lot.mode === "text") {
        if (!Array.isArray(lot.accept) || !lot.accept.length) issues.push("At least one accepted text answer must be provided.");
        if (lot.type === "blank" && !/_{2,}/.test(lot.q)) issues.push("Fill-in-the-blank questions must contain '____'.");
      } else if (lot.mode === "match") {
        if (!Array.isArray(lot.pairs) || lot.pairs.length < 2 || lot.pairs.length > 6) issues.push("Matching questions require between 2 and 6 pairs.");
        const rights = new Set((lot.pairs || []).map((p) => String(p.r).trim().toLowerCase()));
        if (rights.size !== (lot.pairs || []).length) issues.push("Right-hand matching targets must be distinct.");
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    },

    /* Generate a question lot by topic and question type using RAG search */
    generateQuestion(params = {}) {
      const { type = "aptitude", topic = "Noyes-Whitney Dissolution", difficulty = "Medium" } = params;
      const ragResults = RAG ? RAG.search(topic, 2) : [];
      const topChunk = ragResults[0] ? ragResults[0].doc : null;

      // Find best match in catalog or construct from chunk
      const catalogMatch = QUESTION_BANK_CATALOG.find((q) => q.type === type) || QUESTION_BANK_CATALOG[0];
      const base = Object.assign({}, catalogMatch);

      if (topChunk) {
        base.topic = topChunk.topic;
        base.subject = topChunk.unit;
        base.hint = topChunk.clinicalTakeaway || base.hint;
      }
      base.difficulty = difficulty;
      return base;
    },

    /* Generates a complete 5-question round pack and stages them as drafts */
    generateDraftPack(state, options = {}) {
      if (!state) return 0;
      state.drafts = state.drafts || [];
      state.nextDraft = state.nextDraft || 1;

      let added = 0;
      const toAdd = QUESTION_BANK_CATALOG.slice(0, options.count || 5);
      toAdd.forEach((template) => {
        const draft = Object.assign({}, template, {
          did: state.nextDraft++,
        });
        state.drafts.push(draft);
        added++;
      });
      return added;
    },

    /* Returns the full preloaded catalog */
    getCatalog() {
      return QUESTION_BANK_CATALOG.map((item) => Object.assign({}, item));
    }
  };

  /* --------------------------------------------------------------------------
     3. PharmaTutorAgent: Conceptual Mentor & Post-Settlement Explainer
     -------------------------------------------------------------------------- */
  const PharmaTutorAgent = {
    /* Explains settled questions with RAG grounding */
    explainSettledLot(lot) {
      if (!lot) return null;
      if (RAG && RAG.explain) {
        return RAG.explain(lot, null);
      }
      return {
        topic: lot.topic,
        unit: lot.subject || "Pharmaceutics Core",
        corePrinciple: "The principle underlying this question requires evaluating formulation physicochemical properties, mass transfer kinetics, and pharmacopeial standards.",
        clinicalTakeaway: "Mastering these parameters ensures formulation stability and regulatory bioequivalence compliance.",
        reference: "Martin's Physical Pharmacy & USP-NF Standards.",
        confidence: 90
      };
    },

    /* Answers student conceptual questions in real-time */
    answerQuery(query) {
      if (!query || !query.trim()) return "Please type a pharmaceutics topic (e.g., 'BCS Class II', 'Noyes Whitney', 'Tablet Capping', 'USP Apparatus 4').";
      const results = RAG ? RAG.search(query, 3) : [];
      if (!results.length) {
        return "I couldn't find a direct match in the Pharmaceutics Mastery Matrix repository. Try querying about Dissolution, BCS, Tablet Defects, Emulsions, or Sterilization.";
      }
      const top = results[0].doc;
      let text = `**[${top.unit}] ${top.topic}**\n\n${top.content}\n\n`;
      if (top.formula) text += `📐 **Key Invariant / Formula:** \`${top.formula}\`\n\n`;
      text += `💡 **Clinical / Industrial Takeaway:** ${top.clinicalTakeaway}\n`;
      text += `📖 **Reference:** *${top.reference}*`;
      return text;
    }
  };

  /* --------------------------------------------------------------------------
     4. BidStrategistAgent: Solvency Invariants & Tactical Bidding Advice
     -------------------------------------------------------------------------- */
  const BidStrategistAgent = {
    analyze(lot, teamName, currentState) {
      if (!lot || !teamName || !currentState) {
        return {
          advice: "Enter your team name to calculate tactical bidding guidance.",
          tier: "neutral",
          maxAffordable: 0,
          recommendation: "Standby"
        };
      }

      const fnPoints = typeof points === "function" ? points : global.points;
      const fnAvailable = typeof available === "function" ? available : global.available;
      const fnMinNext = typeof minNext === "function" ? minNext : global.minNext;
      const fnCurrent = typeof current === "function" ? current : global.current;
      const fnTopBid = typeof topBid === "function" ? topBid : global.topBid;

      const teamPts = typeof fnPoints === "function" ? fnPoints(teamName) : 1000;
      const freePts = typeof fnAvailable === "function" ? fnAvailable(teamName, lot.id) : 1000;
      const minBid = typeof fnMinNext === "function" ? fnMinNext(lot) : lot.start;
      const curBid = typeof fnCurrent === "function" ? fnCurrent(lot) : lot.start;
      const top = typeof fnTopBid === "function" ? fnTopBid(lot.id) : null;
      const isLeader = top && String(top.name).trim().toLowerCase() === String(teamName).trim().toLowerCase();

      if (isLeader) {
        return {
          advice: `You are currently holding the winning bid of ${curBid} pts. Do not outbid yourself. Protect your point escrow for other upcoming lots.`,
          tier: "safe",
          maxAffordable: freePts,
          recommendation: "Hold Position"
        };
      }

      if (freePts < minBid) {
        return {
          advice: `Insolvent for this lot. You need at least ${minBid} pts, but only have ${freePts} pts available (${teamPts - freePts} pts locked in other lots).`,
          tier: "danger",
          maxAffordable: freePts,
          recommendation: "Insufficient Balance"
        };
      }

      const ratio = minBid / Math.max(1, freePts);
      if (ratio > 0.65) {
        return {
          advice: `High-Stakes Warning: A winning bid will lock >${Math.round(ratio * 100)}% of your available points. Ensure your team knows the topic '${lot.topic}' with high confidence.`,
          tier: "high-risk",
          suggestedBid: minBid,
          recommendation: "Conservative Stake"
        };
      }

      if (ratio > 0.3) {
        return {
          advice: `Balanced Opportunity: Minimum bid is ${minBid} pts (${Math.round(ratio * 100)}% of free balance). Recommended tactical raise: ${minBid + (lot.inc || 10)} pts to deter counter-bidders.`,
          tier: "balanced",
          suggestedBid: minBid + (lot.inc || 10),
          recommendation: "Competitive Bid"
        };
      }

      return {
        advice: `Strong Solvency Position: Minimum bid represents only ${Math.round(ratio * 100)}% of your free points (${freePts} pts). You can comfortably dominate this lot.`,
        tier: "aggressive",
        suggestedBid: Math.min(freePts, minBid + (lot.inc || 10) * 2),
        recommendation: "Aggressive Takeover"
      };
    }
  };

  /* --------------------------------------------------------------------------
     Global Export
     -------------------------------------------------------------------------- */
  global.PMM_AGENTS = {
    AuthoringAgent,
    PharmaTutorAgent,
    BidStrategistAgent,
    QUESTION_BANK_CATALOG
  };
})(typeof window !== "undefined" ? window : global);
