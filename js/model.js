// Alderbrook Strategy Lab - calculation engine.
// Line-by-line port of engine/engine.py. Pure functions, no DOM.
// All money in $M. Years: t=0 FY25 (close), t=1 FY26 ... t=4 FY29.
//
// The team's Board-Ready Excel model was not supplied in reference/, so this
// port keeps the engine's constant reconciliation offsets (see docs/05_model_spec.md).
// Offsets are constant in every lever: sliders move NPV through the formulas only.

// ---------------------------------------------------------------- CASE FACTS
export const ALD_REV_FY25 = 1800.0;
export const SEGMENTS = {               // FY25 revenue, growth a year (case p.4)
  juice: [684.0, -0.03],
  iced_tea: [432.0, 0.0],
  sparkling: [468.0, 0.07],
  hydration_ex_vital: [194.0, 0.11],    // 12% share = $216M, less Vital $22M
};
export const VITAL_FY25 = 22.0;
export const ALD_EBITDA_M = 0.15;
export const ALD_OP_M = 0.11;
export const ALD_NET_DEBT = 324.0;
export const ALD_EBITDA_FY25 = 270.0;
export const BOARD_LEV = 2.5;
export const COVENANT_LEV = 3.5;
export const TARGET_GROWTH = 0.05;
export const TARGET_MIX = 0.12;
export const TARGET_OM = 0.11;

export const BW_REV_FY25 = 95.0;
export const BW_EBITDA_M_FY25 = -0.02;
export const PRICE_ASK = 450.0;
export const TXN_COSTS = 12.0;
export const INTEGRATION = 30.0;
export const GROSS_MARGIN = 0.44;

// ---------------------------------------------------------------- ASSUMPTIONS
export const WACC = 0.09;
export const TAX = 0.25;
export const CAPEX_PCT = 0.04;
export const NWC_PCT = 0.10;
export const BW_DA_PCT = 0.03;
export const PAYDOWN_PCT = 0.45;
export const COGS_PCT = 1 - GROSS_MARGIN;
export const INHOUSE_SAVING = 0.1525;
export const VOLUME_MOVED = [0.25, 0.60, 0.80, 0.80];
export const ROUTED = [0.0, 0.25, 0.4375, 0.50];
export const DSD_CAPTURE = 0.16;
export const T2_MULTIPLE = 2.75;

export const SCENARIOS = {
  bear: { growth: [0.25, 0.18, 0.12, 0.10], margin: [-0.02, 0.01, 0.03, 0.06] },
  base: { growth: [0.35, 0.28, 0.22, 0.18], margin: [-0.01, 0.03, 0.06, 0.09] },
  mgmt: { growth: [0.45, 0.35, 0.25, 0.18], margin: [0.00, 0.04, 0.08, 0.11] },
};
const OFFSET_STAGED = { bear: -139.2, base: 16.0, mgmt: 145.8 };
const OFFSET_FULL_BASE_DECK = -17.8;

export const DEFAULTS = Object.freeze({
  scenario: 'base', stake: 0.60, price: 450.0, realisation: 1.0, exit_multiple: 12.0,
  cogs_eligible: 0.75, seller_carry: 0.0, exit_cost: 0.0, vital_growth: 0.0,
});

const range = (n) => Array.from({ length: n }, (_, i) => i);
const sum = (a) => a.reduce((x, y) => x + y, 0);

export function organic(vital_growth = 0.0) {
  const rev = [], vital = [];
  for (let t = 0; t < 5; t++) {
    const v = VITAL_FY25 * (1 + vital_growth) ** t;
    const r = sum(Object.values(SEGMENTS).map(([b, g]) => b * (1 + g) ** t)) + v;
    rev.push(r); vital.push(v);
  }
  return [rev, vital];
}

/** Organic revenue split by category, FY25 and FY29 (for the bridge). */
export function organicByCategory(vital_growth = 0.0) {
  const out = {};
  for (const [k, [b, g]] of Object.entries(SEGMENTS)) out[k] = [b, b * (1 + g) ** 4];
  out.vital = [VITAL_FY25, VITAL_FY25 * (1 + vital_growth) ** 4];
  return out;
}

function raw(scenario, stake, price, realisation, exit_multiple, cogs_eligible, seller_carry, exit_cost) {
  const s = SCENARIOS[scenario];
  const rev = [BW_REV_FY25];
  for (const g of s.growth) rev.push(rev[rev.length - 1] * (1 + g));
  const sa = [BW_REV_FY25 * BW_EBITDA_M_FY25, ...range(4).map((i) => rev[i + 1] * s.margin[i])];
  const mfg = [0, ...range(4).map((i) => rev[i + 1] * COGS_PCT * cogs_eligible * INHOUSE_SAVING * VOLUME_MOVED[i] * realisation)];
  const dsd = [0, ...range(4).map((i) => rev[i + 1] * ROUTED[i] * DSD_CAPTURE * realisation)];
  const syn = mfg.map((m, i) => m + dsd[i]);
  const ebitda = sa.map((a, i) => a + syn[i]);
  const sa_fcf = [0, ...range(4).map((i) => { const t = i + 1; return sa[t] * (1 - TAX) - CAPEX_PCT * rev[t] - NWC_PCT * (rev[t] - rev[t - 1]); })];
  const syn_fcf = [0, ...range(4).map((i) => syn[i + 1] * (1 - TAX))];
  const t2_ev = Math.min(price, T2_MULTIPLE * rev[2]);
  const t2 = (1 - stake) * t2_ev * (1 + seller_carry) ** 2;
  const df = range(5).map((t) => 1 / (1 + WACC) ** t);
  let npv = -(stake * price + TXN_COSTS + INTEGRATION + exit_cost);
  for (let t = 1; t < 5; t++) {
    const own = t <= 2 ? stake : 1.0;
    const cf = syn_fcf[t] + own * sa_fcf[t] - (t === 2 ? t2 : 0);
    npv += cf * df[t];
  }
  npv += ebitda[4] * exit_multiple * df[4];
  return { rev, sa, mfg, dsd, syn, ebitda, sa_fcf, syn_fcf, t2, t2_ev, df, npv_raw: npv };
}

const rawFrom = (sc, d) => raw(sc, d.stake, d.price, d.realisation, d.exit_multiple, d.cogs_eligible, d.seller_carry, d.exit_cost);

const offsetCache = {};
function offsets(scenario) {
  if (offsetCache[scenario]) return offsetCache[scenario];
  const d = { ...DEFAULTS };
  const d100 = { ...d, stake: 1.0 };
  const off60 = OFFSET_STAGED[scenario] - rawFrom(scenario, d).npv_raw;
  let off100;
  if (scenario === 'base') {
    off100 = OFFSET_FULL_BASE_DECK - rawFrom(scenario, d100).npv_raw;
  } else {
    const b60 = OFFSET_STAGED.base - rawFrom('base', d).npv_raw;
    const b100 = OFFSET_FULL_BASE_DECK - rawFrom('base', d100).npv_raw;
    off100 = off60 + (b100 - b60);
  }
  return (offsetCache[scenario] = [off60, off100]);
}

export function run(kw = {}) {
  const p = { ...DEFAULTS, ...kw };
  const sc = p.scenario;
  const r = rawFrom(sc, p);
  const [off60, off100] = offsets(sc);
  const off = off60 + (p.stake - 0.6) / 0.4 * (off100 - off60);
  const npv = r.npv_raw + off;

  // ---- leverage path (consolidated from close)
  const [org, vital] = organic(p.vital_growth);
  const ald_ebitda = [ALD_EBITDA_FY25, ...range(4).map((i) => org[i + 1] * ALD_EBITDA_M)];
  const cons_ebitda = range(5).map((t) => ald_ebitda[t] + r.ebitda[t]);
  const nd = [ALD_NET_DEBT + p.stake * p.price + TXN_COSTS + INTEGRATION + p.exit_cost];
  for (let t = 1; t < 5; t++) {
    const fcf = r.sa_fcf[t] + r.syn_fcf[t];
    nd.push(nd[t - 1] - PAYDOWN_PCT * ald_ebitda[t] - fcf + (t === 2 ? r.t2 : 0));
  }
  const lev = range(5).map((t) => nd[t] / cons_ebitda[t]);

  // ---- FY29 board tests
  const rev29 = org[4] + r.rev[4];
  const cagr = (rev29 / ALD_REV_FY25) ** 0.25 - 1;
  const rev28 = org[3] + r.rev[3];
  const yoy29 = rev29 / rev28 - 1;
  const op = (ALD_OP_M * org[4] + r.ebitda[4] - BW_DA_PCT * r.rev[4]) / rev29;
  const mix = (r.rev[4] + vital[4]) / rev29;
  const peak = Math.max(...lev);
  const tests = {
    growth: cagr >= TARGET_GROWTH,
    leverage: peak <= BOARD_LEV,
    margin: op >= TARGET_OM,
    mix: mix >= TARGET_MIX - 1e-9,
  };
  return {
    npv, leverage_close: lev[0], leverage_path: lev, peak_leverage: peak,
    net_debt_path: nd,
    headroom_close: BOARD_LEV * cons_ebitda[0] - nd[0],
    cash_at_close: p.stake * p.price + TXN_COSTS + INTEGRATION,
    tranche2: r.t2, tranche2_ev: r.t2_ev, bw_rev: r.rev, bw_ebitda29: r.ebitda[4],
    bw_standalone29: r.sa[4], mfg29: r.mfg[4], dsd29: r.dsd[4],
    organic_rev: org, combined_rev29: rev29, cagr, yoy29,
    op_margin29: op, mix29: mix, tests,
    tests_passed: Object.values(tests).filter(Boolean).length,
  };
}

/** Find the input value (by bisection) where NPV crosses zero / a target. */
export function solve(key, target, lo, hi, base = {}) {
  const f = (x) => run({ ...base, [key]: x }).npv - target;
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (fm * flo <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}
