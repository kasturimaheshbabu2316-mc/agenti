/* ==========================================================================
   Pharmaceutics Mastery Matrix 3 (PMM 3) – RAG Knowledge Engine (rag.js)
   Retrieval-Augmented Generation & Embedded Pharmaceutical Knowledge Base
   Supports: Offline BM25 Vectorized Search, Domain Chunking, Hybrid API Sync
   ========================================================================== */

(function (global) {
  "use strict";

  /* --------------------------------------------------------------------------
     1. Pharmaceutics Mastery Matrix Knowledge Repository (Curated Chunks)
     -------------------------------------------------------------------------- */
  const PHARMA_KNOWLEDGE_BASE = [
    {
      id: "rag-01",
      unit: "Unit I · Physical Pharmaceutics",
      topic: "Noyes-Whitney Dissolution Kinetics",
      formula: "dM/dt = (D * A / h) * (Cs - Cb)",
      keywords: ["noyes", "whitney", "dissolution", "solubility", "diffusion", "stagnant", "cs", "cb", "rate"],
      content: "The Noyes-Whitney equation governs the rate of solid drug dissolution in a solvent medium. Here, dM/dt is the dissolution rate, D is the diffusion coefficient of the solute, A is the effective surface area of dissolving particles, h is the thickness of the stagnant diffusion boundary layer, Cs is the saturation solubility of the drug in the boundary layer, and Cb is the concentration in the bulk dissolution medium. Under sink conditions (Cb < 0.1 to 0.2 * Cs), the gradient reduces to (Cs - Cb) ≈ Cs. Formulation strategies to accelerate dissolution include particle size reduction / micronization (increasing A), surfactant incorporation (increasing Cs and wetting), and vigorous agitation (reducing h).",
      clinicalTakeaway: "Micronization increases dissolution rate by maximizing interfacial surface area A; salt forms elevate saturation solubility Cs.",
      reference: "Martin's Physical Pharmacy and Pharmaceutical Sciences, 7th Ed.; USP <711> Dissolution."
    },
    {
      id: "rag-02",
      unit: "Unit I · Physical Pharmaceutics",
      topic: "Henderson-Hasselbalch Ionization & pH-Partition Hypothesis",
      formula: "pH = pKa + log([A-] / [HA]) (Acids) | pH = pKa + log([B] / [BH+]) (Bases)",
      keywords: ["henderson", "hasselbalch", "ionization", "pka", "ph", "partition", "absorption", "passive", "diffusion"],
      content: "The pH-partition hypothesis dictates that biological membranes are preferentially permeable to the unionized (lipid-soluble) fraction of weak electrolytes. According to the Henderson-Hasselbalch relationships: for weak acids, % Ionization = 100 / (1 + 10^(pKa - pH)); for weak bases, % Ionization = 100 / (1 + 10^(pH - pKa)). Weakly acidic drugs (e.g., aspirin, ibuprofen, pKa ~3.5) remain predominantly unionized in the acidic stomach lumen (pH 1.2–2.0) and favor passive lipophilic diffusion, though substantial absorption occurs in the small intestine due to enormous absorptive surface area. Weakly basic drugs (e.g., propranolol, diazepam) are ionized in the stomach and unionized in the neutral/alkaline intestinal lumen (pH 6.8–7.4).",
      clinicalTakeaway: "Only un-ionized species readily cross enterocyte apical lipid bilayers via transcellular passive diffusion.",
      reference: "Applied Biopharmaceutics & Pharmacokinetics, Shargel & Yu, 8th Ed."
    },
    {
      id: "rag-03",
      unit: "Unit I · Physical Pharmaceutics",
      topic: "Polymorphism and Crystal Habit in Drug Bioavailability",
      formula: "G_metastable > G_stable | Solubility(metastable) > Solubility(stable)",
      keywords: ["polymorphism", "crystal", "amorphous", "metastable", "chloramphenicol", "ritonavir", "solubility"],
      content: "Polymorphism is the ability of a solid chemical entity to exist in more than one crystalline lattice arrangement with distinct physical properties (melting point, solubility, stability, density, and dissolution rate). Metastable polymorphs possess higher free energy (G) and weaker intermolecular bonds, resulting in superior apparent aqueous solubility and faster dissolution compared to the thermodynamically stable form. Classic case: Chloramphenicol palmitate exists as polymorphs A, B, and C; only Form B produces therapeutic serum levels in vivo, whereas Form A is virtually unabsorbed. Amorphous states lack long-range three-dimensional lattice order, exhibiting the highest dissolution kinetic rate but susceptibility to recrystallization.",
      clinicalTakeaway: "Metastable polymorphs and amorphous dispersions enhance oral bioavailability of BCS Class II compounds but require polymeric crystallization inhibitors (e.g., HPMC, PVP-VA).",
      reference: "Aulton's Pharmaceutics: The Design and Manufacture of Medicines, 5th Ed."
    },
    {
      id: "rag-04",
      unit: "Unit II · Biopharmaceutics",
      topic: "Biopharmaceutics Classification System (BCS Classes I–IV)",
      formula: "D_0 = (M_0 / V_0) / C_s <= 1 (Dose Number) | An = P_eff * (t_res / R) >= 1 (Absorption Number)",
      keywords: ["bcs", "solubility", "permeability", "class", "dissolution", "biowaiver", "absorption"],
      content: "The BCS categorizes drug substances into four classes based on aqueous solubility and intestinal permeability: Class I (High Solubility, High Permeability; e.g., Metoprolol, Paracetamol); Class II (Low Solubility, High Permeability; e.g., Ketoconazole, Carbamazepine, Ibuprofen); Class III (High Solubility, Low Permeability; e.g., Atenolol, Cimetidine); Class IV (Low Solubility, Low Permeability; e.g., Paclitaxel, Hydrochlorothiazide, Furosemide). A drug is highly soluble when the highest single therapeutic dose dissolves in ≤ 250 mL of aqueous media across pH 1.0 to 6.8 at 37 ± 1 °C. A drug is highly permeable when systemic intestinal absorption reaches ≥ 85% of an administered dose.",
      clinicalTakeaway: "BCS Class I drugs qualify for in vitro dissolution biowaivers; BCS Class II rate of absorption is strictly dissolution-limited.",
      reference: "FDA Guidance for Industry: Waiver of In Vivo Bioavailability and Bioequivalence Studies (BCS)."
    },
    {
      id: "rag-05",
      unit: "Unit II · Biopharmaceutics & Pharmacokinetics",
      topic: "Higuchi and Korsmeyer-Peppas Release Kinetics",
      formula: "Higuchi: Q = K_H * t^(1/2) | Peppas: Mt / M_inf = K * t^n",
      keywords: ["higuchi", "peppas", "kinetics", "release", "diffusion", "fickian", "anomalous", "case-ii"],
      content: "The Higuchi model describes planar diffusion-controlled drug release from homogeneous insoluble matrix systems where drug release is proportional to the square root of time (Q vs. t^(1/2)). The Korsmeyer-Peppas power law characterizes polymeric drug release mechanisms: Mt / M_inf = K * t^n (valid for first 60% release). For cylindrical geometries: n = 0.45 indicates Fickian diffusion (Case-I transport); 0.45 < n < 0.89 indicates Anomalous (non-Fickian) transport where drug diffusion and polymer relaxation/swelling occur simultaneously; n = 0.89 indicates Case-II transport (zero-order relaxation-controlled release); n > 0.89 represents Super Case-II transport.",
      clinicalTakeaway: "Higuchi kinetics apply to non-swellable matrices; Korsmeyer-Peppas exponent n reveals whether diffusion or matrix relaxation controls delivery.",
      reference: "Journal of Controlled Release, Korsmeyer et al., 1983; Higuchi, J. Pharm. Sci., 1963."
    },
    {
      id: "rag-06",
      unit: "Unit II · Biopharmaceutics & Pharmacokinetics",
      topic: "Pharmacokinetic Invariants: Volume of Distribution and Clearance",
      formula: "Vd = Dose / C0 = (Dose * F) / (AUC * k_e) | Cl = k_e * Vd = Dose_iv / AUC",
      keywords: ["vd", "clearance", "auc", "half-life", "elimination", "ke", "bioavailability"],
      content: "Apparent Volume of Distribution (Vd) is the proportionality constant relating total amount of drug in the body to plasma concentration (Cp). A low Vd (~3 to 5 L) indicates confinement to vascular plasma (e.g., Evans blue, heparin, or highly protein-bound warfarin >99%). High Vd (>40 L up to 500+ L, e.g., digoxin, chloroquine) signifies extensive extravascular tissue binding. Total Systemic Clearance (Cl) represents the theoretical volume of blood/plasma cleared of drug per unit time. Elimination half-life relates as t_1/2 = 0.693 * Vd / Cl. Hepatic extraction ratio (ER = (Ca - Cv) / Ca) determines organ clearance: Cl_H = Q_H * ER.",
      clinicalTakeaway: "Protein binding alterations dramatically alter free fraction fu, hepatic clearance of low-extraction drugs, and Vd.",
      reference: "Applied Biopharmaceutics & Pharmacokinetics, Shargel, 8th Ed."
    },
    {
      id: "rag-07",
      unit: "Unit III · Tablet Technology & Compression Defects",
      topic: "Tablet Compression Defects: Capping, Lamination, and Sticking",
      formula: "Ejection Force = F_die * mu_wall | Tensile Strength = (2 * P) / (pi * D * T)",
      keywords: ["capping", "lamination", "picking", "sticking", "mottling", "compression", "tablet", "defects"],
      content: "Tablet manufacturing defects arise from mechanical tooling or formulation imbalances: 1. Capping: Partial or complete separation of the top or bottom tablet crown from the main body; primary causes are air entrapment in dies, excessive fines (<100 mesh), insufficient moisture in granules, and high compression speed. Remediation: Pre-compression dwell time, tapered dies, slowed turret. 2. Lamination: Separation into two or more distinct horizontal layers due to trapped air and rapid punch decompression. 3. Picking and Sticking: Granule adhesion to punch faces (picking logos) or die walls (sticking); remedies include adding colloidal silicon dioxide (Aerosil 200) and optimizing magnesium stearate lubricant. 4. Mottling: Unequal distribution of color on tablet faces due to dye migration during fluid-bed/tray drying.",
      clinicalTakeaway: "Pre-compression displacement expels interstitial air, eliminating capping and lamination during high-speed rotary tableting.",
      reference: "The Theory and Practice of Industrial Pharmacy, Lachman & Lieberman, 4th Ed."
    },
    {
      id: "rag-08",
      unit: "Unit III · Tablet Technology & Unit Operations",
      topic: "Tablet Excipients & Functional Disintegrant Mechanisms",
      formula: "Porosity (epsilon) = 1 - (Bulk Density / True Density)",
      keywords: ["superdisintegrants", "croscarmellose", "crospovidone", "sodium", "starch", "glycolate", "lubricants"],
      content: "Tablet formulations integrate specialized excipients: Superdisintegrants promote rapid tablet breakup through swelling, wicking (capillary action), and deformation recovery: 1. Croscarmellose sodium (cross-linked sodium carboxymethylcellulose, Ac-Di-Sol): Swells 4–8 fold in two dimensions with rapid wicking. 2. Sodium starch glycolate (SSG, Primojel, Explotab): Cross-linked potato starch swelling 7–12 fold in three dimensions. 3. Crospovidone (cross-linked PVP, Polyplasdone): Highly porous, non-ionic, wicks moisture rapidly without forming viscous gels, preserving dissolution in hydrophobic matrices. Lubricants: Magnesium stearate (boundary lubricant, 0.25–1.0%), hydrophobic; over-blending coats granule surfaces, retarding dissolution and reducing tablet hardness.",
      clinicalTakeaway: "Excessive magnesium stearate blending time generates a hydrophobic coating that impedes wetting and prolongs disintegration time.",
      reference: "Handbook of Pharmaceutical Excipients, Rowe et al., 9th Ed."
    },
    {
      id: "rag-09",
      unit: "Unit III · Quality Control & Dissolution Testing",
      topic: "USP Dissolution Testing Apparatus (USP 1 through 7)",
      formula: "Apparatus 1 (Basket) | Apparatus 2 (Paddle) | Apparatus 4 (Flow-Through)",
      keywords: ["usp", "apparatus", "dissolution", "basket", "paddle", "flow-through", "cylinder", "sinker"],
      content: "USP General Chapter <711> defines standard dissolution test apparatus: Apparatus 1: Rotating Basket (standard 100 rpm; preferred for capsules, floating dosage forms, suppositories). Apparatus 2: Paddle (standard 50 or 75 rpm; preferred for tablets; wire helix sinkers restrain floating capsules). Apparatus 3: Reciprocating Cylinder (dip rate controlled; optimal for extended-release beadlets and gastrointestinal pH-change profiles). Apparatus 4: Flow-Through Cell (continuous laminar flow; ideal for poorly soluble BCS Class II/IV drugs, implants, microspheres, and stents under sink conditions). Apparatus 5: Paddle over Disk (transdermal patches). Apparatus 6: Rotating Cylinder (transdermal delivery systems). Apparatus 7: Reciprocating Holder (implants, stents, osmotic systems).",
      clinicalTakeaway: "Apparatus 4 (Flow-Through Cell) avoids volume depletion artifacts and maintains infinite sink conditions for poorly soluble lipophilic compounds.",
      reference: "United States Pharmacopeia–National Formulary, USP <711> Dissolution."
    },
    {
      id: "rag-10",
      unit: "Unit IV · Disperse Systems & Colloids",
      topic: "Emulsion Formulation, Bancroft's Rule, and HLB System",
      formula: "HLB = 20 * (M_h / M_total) (Griffin) | HLB_blend = f_A * HLB_A + f_B * HLB_B",
      keywords: ["emulsion", "bancroft", "hlb", "surfactant", "creaming", "coalescence", "inversion"],
      content: "Bancroft's Rule establishes that the continuous external phase of an emulsion is dictated by the phase in which the emulsifying agent is preferentially soluble: Hydrophilic emulsifiers (high HLB >8) yield Oil-in-Water (O/W) emulsions; Lipophilic emulsifiers (low HLB <6) yield Water-in-Oil (W/O) emulsions. Griffin's HLB scale (0–20): 1–3 Antifoaming agents; 3–6 W/O emulsifiers (e.g., Span 80 / sorbitan monooleate, HLB 4.3); 7–9 Wetting agents; 8–16 O/W emulsifiers (e.g., Tween 80 / polysorbate 80, HLB 15.0); 13–15 Detergents; 16–18 Solubilizing agents. Emulsion instability modes: Creaming (reversible density sedimentation/flotation governed by Stokes' Law), Flocculation (reversible droplet aggregation), Coalescence (irreversible fusion into larger droplets), and Phase Inversion (transition between O/W and W/O).",
      clinicalTakeaway: "Stokes' law dictates that reducing droplet radius r (via microfluidization) and increasing external phase viscosity eta retard creaming velocity.",
      reference: "Physical Pharmacy, Alfred Martin; Ansel's Pharmaceutical Dosage Forms, 11th Ed."
    },
    {
      id: "rag-11",
      unit: "Unit IV · Disperse Systems & Colloids",
      topic: "Colloidal Stability, DLVO Theory, and Zeta Potential",
      formula: "V_total = V_attraction + V_repulsion | Zeta > +30 mV or < -30 mV = Stable",
      keywords: ["dlvo", "zeta", "potential", "colloid", "flocculation", "caking", "stern", "double-layer"],
      content: "DLVO (Derjaguin, Landau, Verwey, and Overbeek) theory models colloidal particle stability as a net sum of van der Waals attractive forces (V_A) and electrostatic electrical double layer repulsive forces (V_R). The Stern layer contains tightly bound counter-ions, followed by the diffuse Gouy-Chapman double layer. Zeta potential (electrokinetic potential at the shear plane) reflects repulsive magnitude: values exceeding |±30 mV| ensure sufficient repulsive barriers to prevent irreversible coagulation. In suspensions, controlled flocculation (targeting the shallow secondary minimum) produces loose, porous flocs that settle rapidly but redisperse easily upon mild agitation, avoiding irreversible cement-like 'caking' formed in deflocculated systems at the deep primary minimum.",
      clinicalTakeaway: "Targeting the secondary minimum via controlled flocculating electrolytes (e.g., potassium phosphate) prevents destructive caking.",
      reference: "Martin's Physical Pharmacy and Pharmaceutical Sciences, Chapter 15."
    },
    {
      id: "rag-12",
      unit: "Unit V · Sterile Products & Parenterals",
      topic: "Sterilization Kinetics, D-value, Z-value, and Sterility Assurance Level",
      formula: "D = t / (log N0 - log Nt) | z = (T2 - T1) / (log D1 - log D2) | F0 = Delta_t * 10^((T - 121.1) / 10)",
      keywords: ["sterilization", "d-value", "z-value", "f0", "autoclave", "pyrogens", "endotoxin", "lal"],
      content: "Sterilization parameters quantify microbial inactivation: D-value (Decimal Reduction Time) is the duration in minutes at a specified temperature required to kill 90% (1 log reduction) of a specific microbial population. Z-value is the temperature change (°C or °F) needed to produce a 10-fold (1 log) shift in the D-value. Standard moist heat sterilization (autoclave) operates at 121.1 °C (250 °F) under 15 psi steam for 15–20 minutes; biological indicator: Geobacillus stearothermophilus spores (D_121 ~ 1.5–2.0 min). Equivalent sterilization value F0 represents equivalent minutes at 121.1 °C with z = 10 °C. Sterility Assurance Level (SAL) target for terminally sterilized parenterals is 10^(-6) (one non-sterile unit per million).",
      clinicalTakeaway: "F0 integrates lethal temperature exposure over time; achieving F0 ≥ 12 minutes guarantees pharmaceutical SAL 10^(-6).",
      reference: "Parenteral Quality Control, Akers, 3rd Ed.; USP <55> Biological Indicators."
    },
    {
      id: "rag-13",
      unit: "Unit V · Sterile Products & Parenterals",
      topic: "Pyrogen & Bacterial Endotoxin Testing (BET / LAL)",
      formula: "Endotoxin Limit (EL) = K / M (where K = 5 EU/kg for parenterals, 0.2 EU/kg for intrathecal)",
      keywords: ["pyrogen", "endotoxin", "lal", "limulus", "tal", "depyrogenation", "lipopolysaccharide"],
      content: "Pyrogens are fever-inducing metabolic by-products of microorganisms, predominantly Gram-negative bacterial outer-membrane Lipopolysaccharides (endotoxins composed of Lipid A, core polysaccharide, and O-antigen). Endotoxins withstand standard autoclaving and require depyrogenation via dry heat at 250 °C for ≥30 min (achieving ≥3-log endotoxin reduction). The Bacterial Endotoxin Test (BET, USP <85>) utilizes Limulus Amebocyte Lysate (LAL) harvested from horseshoe crab blood cells. The lysate enzyme cascade (Factor C -> Factor B -> Proclotting enzyme -> Coagulogen to Coagulin) forms an opaque gel clot in the presence of endotoxins. Maximum Endotoxin Limit EL = K / M, where K = 5.0 EU/kg/hr for general parenterals and 0.2 EU/kg/hr for intrathecal formulations.",
      clinicalTakeaway: "Intrathecal injectables have a 25-fold stricter endotoxin tolerance (0.2 EU/kg) due to immediate proximity to meningeal receptors.",
      reference: "USP <85> Bacterial Endotoxins Test; Parenteral Technology, Avis & Lieberman."
    },
    {
      id: "rag-14",
      unit: "Unit VI · Novel Drug Delivery Systems (NDDS)",
      topic: "Osmotic Drug Delivery Systems (OROS Pumps)",
      formula: "dM/dt = (A / h) * k * Delta_pi * C_sat (Zero-order delivery rate)",
      keywords: ["oros", "osmotic", "pump", "semipermeable", "laser", "zero-order", "push-pull"],
      content: "Osmotic-controlled release oral delivery systems (OROS) deliver drugs at a constant zero-order rate independent of gastrointestinal pH, motility, food, and enzyme fluctuations. Elementary Osmotic Pump (Theeuwes, 1974): A drug core containing an osmogen (e.g., NaCl, mannitol) is surrounded by a rigid, water-permeable but drug-impermeable semipermeable membrane (cellulose acetate). A laser-drilled delivery orifice allows drug solution discharge driven by hydrostatic pressure generated as water permeates inward by osmosis. Push-Pull Osmotic Pump: Features a drug compartment and a separate polymeric expansion push layer (e.g., high molecular weight polyethylene oxide); swelling of the push compartment extrudes poorly soluble drugs as a fine suspension.",
      clinicalTakeaway: "OROS delivers strictly zero-order in vivo plasma concentrations, eliminating peak-to-trough fluctuations for cardiovascular agents like nifedipine and glipizide.",
      reference: "Drug Delivery: Engineering Principles for Drug Therapy, Mark Saltzman; J. Pharm. Sci., 1975."
    },
    {
      id: "rag-15",
      unit: "Unit VI · Novel Drug Delivery Systems (NDDS)",
      topic: "Liposomes, Nanosuspensions, and Targeted Nanocarriers",
      formula: "EPR Effect | Zeta >= |30 mV| | EE% = ((Total Drug - Free Drug) / Total Drug) * 100",
      keywords: ["liposomes", "doxorubicin", "stealth", "pegylated", "epr", "nanoparticles", "entrapment"],
      content: "Liposomes are concentric vesicles composed of phospholipid bilayers enclosing aqueous cores, capable of entrapping both hydrophilic compounds (within aqueous interior) and lipophilic drugs (intercalated in lipid bilayer). Conventional liposomes are rapidly cleared by the Reticuloendothelial System (RES / MPS in liver and spleen). PEGylated 'stealth' liposomes (e.g., Doxil / Caelyx) incorporate polyethylene glycol-grafted phospholipids, creating a steric hydration barrier that repels opsonins, prolonging systemic circulation half-life from hours to ~55 hours. In solid tumors, discontinuous fenestrated endothelial vasculature (100–700 nm pore gaps) and impaired lymphatic clearance mediate passive accumulation termed the Enhanced Permeation and Retention (EPR) effect.",
      clinicalTakeaway: "PEGylation suppresses opsonization and hepatic Kupffer cell uptake, permitting preferential extravasation into hyperpermeable neoplastic microenvironments.",
      reference: "Nanoparticulate Drug Delivery Systems, Thassu & Pathak; Nature Reviews Cancer, 2004."
    }
  ];

  /* --------------------------------------------------------------------------
     2. BM25 Inverted Index & Semantic Retrieval Engine
     -------------------------------------------------------------------------- */
  class RAGRetrievalEngine {
    constructor(corpus) {
      this.corpus = corpus || PHARMA_KNOWLEDGE_BASE;
      this.k1 = 1.2;
      this.b = 0.75;
      this.index = new Map();
      this.docLengths = new Map();
      this.avgDocLength = 0;
      this.buildIndex();
    }

    tokenize(text) {
      if (!text) return [];
      return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9_\-\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !this.isStopword(w));
    }

    isStopword(word) {
      const stops = new Set([
        "the", "and", "for", "are", "with", "that", "this", "from", "into", "can",
        "has", "have", "been", "which", "when", "where", "what", "such", "than", "were"
      ]);
      return stops.has(word);
    }

    buildIndex() {
      let totalWords = 0;
      this.corpus.forEach((doc) => {
        const text = [doc.topic, doc.unit, doc.content, doc.clinicalTakeaway, (doc.keywords || []).join(" ")].join(" ");
        const tokens = this.tokenize(text);
        this.docLengths.set(doc.id, tokens.length);
        totalWords += tokens.length;

        const termCounts = new Map();
        tokens.forEach((t) => termCounts.set(t, (termCounts.get(t) || 0) + 1));

        termCounts.forEach((tf, term) => {
          if (!this.index.has(term)) this.index.set(term, new Map());
          this.index.get(term).set(doc.id, tf);
        });
      });
      this.avgDocLength = totalWords / Math.max(1, this.corpus.length);
    }

    search(query, topK = 4) {
      const qTokens = this.tokenize(query);
      if (!qTokens.length) return this.corpus.slice(0, topK).map((doc) => ({ doc, score: 1.0, highlights: [] }));

      const scores = new Map();
      const matchedTermsPerDoc = new Map();
      const N = this.corpus.length;

      qTokens.forEach((term) => {
        const posting = this.index.get(term);
        if (!posting) return;
        const df = posting.size;
        // BM25 IDF
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

        posting.forEach((tf, docId) => {
          const docLen = this.docLengths.get(docId) || this.avgDocLength;
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
          const termScore = idf * (numerator / denominator);

          scores.set(docId, (scores.get(docId) || 0) + termScore);
          if (!matchedTermsPerDoc.has(docId)) matchedTermsPerDoc.set(docId, []);
          matchedTermsPerDoc.get(docId).push(term);
        });
      });

      // Sort descending by score
      const ranked = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topK)
        .map(([docId, score]) => {
          const doc = this.corpus.find((d) => d.id === docId);
          return {
            doc,
            score: Number(score.toFixed(3)),
            matchedTerms: matchedTermsPerDoc.get(docId) || []
          };
        });

      return ranked.length ? ranked : this.corpus.slice(0, topK).map((doc) => ({ doc, score: 0.5, matchedTerms: [] }));
    }

    /* Synthesize an authoritative pharmaceutical explanation for post-answer review */
    synthesizeExplanation(lot, answerChoice) {
      const query = [lot.topic, lot.subject, lot.q || "", (lot.accept || []).join(" ")].join(" ");
      const results = this.search(query, 2);
      const topMatch = results[0] ? results[0].doc : this.corpus[0];

      return {
        topic: topMatch.topic,
        unit: topMatch.unit,
        corePrinciple: topMatch.content,
        formula: topMatch.formula,
        clinicalTakeaway: topMatch.clinicalTakeaway,
        reference: topMatch.reference,
        confidence: results[0] ? Math.min(100, Math.round(results[0].score * 25)) : 85
      };
    }
  }

  // Export singleton engine instance to global
  const ragEngine = new RAGRetrievalEngine(PHARMA_KNOWLEDGE_BASE);

  global.PMM_RAG = {
    engine: ragEngine,
    corpus: PHARMA_KNOWLEDGE_BASE,
    search: (q, k) => ragEngine.search(q, k),
    explain: (lot, a) => ragEngine.synthesizeExplanation(lot, a),
  };
})(typeof window !== "undefined" ? window : global);
