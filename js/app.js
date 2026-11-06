// Alderbrook Strategy Lab: screens, navigation, simulator.
// Static numbers come from data/final_numbers.json (FN); live numbers from js/model.js (M).
import * as M from './model.js';
import { fmt } from './format.js';
import * as CH from './charts.js';

const VERSION = 'v1.0';
const DATE = '6 Nov 2026';
const SCREENS = [
  { id: 1, nav: 'Brief', kicker: 'Board recommendation' },
  { id: 2, nav: 'Why act', kicker: 'Why act' },
  { id: 3, nav: 'Options', kicker: 'Five paths compared' },
  { id: 4, nav: 'Deal simulator', kicker: 'Deal simulator' },
  { id: 5, nav: 'AI & outlets', kicker: 'AI and outlet data' },
  { id: 6, nav: 'Execution', kicker: 'Execution and conditions' },
];

let FN, OW, OC, OS = null;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* ---------------------------------------------------------------- provenance */
// Our assumptions: blue, dotted underline, one-line source on hover / focus / tap.
const SRC = {
  synergy: 'Team assumption. Manufacturing: 15.25% saving (the case’s 18% co-pack premium, 18/118) on eligible cost of goods. Delivery: Alderbrook keeps 16% of routed revenue after its own delivery cost.',
  exit: 'Team assumption. Recent functional-beverage deals trade at ~12–19x EBITDA; we stay at the conservative end.',
  wacc: 'Team assumption: 9% discount rate, 25% cash tax, 12x FY29 EBITDA exit.',
  t2: 'Proposed term, not agreed with the seller: tranche 2 = 40% × MIN(price, 2.75 × audited FY27 revenue).',
  base: 'Team base case: Brightwater grows 35%, 28%, 22%, 18% a year FY26–29, below management’s $260–300M forecast.',
  cogs: 'Diligence question. 75% of Brightwater’s cost of goods assumed eligible for the in-house saving.',
  vital: 'Mix plan: Vital grows 7.15% a year on Brightwater’s engine, reaching ~$29M by FY29.',
  partner: 'Team model: risk-adjusted for a 50% chance Brightwater is sold after FY27; includes ~$53.6M terminal value at 8x contract EBITDA.',
  stance: 'Our negotiating stance, not a case fact.',
  stake: 'Below 50% Alderbrook loses control.',
  carry: 'A seller may charge for waiting. The base case assumes none.',
  exitcost: 'Celsius and KDP paid large sums to exit distributors. Diligence item; the base case assumes none.',
  paydown: 'Team assumption: 45% of Alderbrook EBITDA repays debt each year.',
  gates: 'Our proposal, not a case fact: scale at ≥ 1.0x category velocity; stop under 0.7x for two quarters.',
  real: 'McKinsey: about 70% of deals miss their revenue synergies.',
  roadmap: 'The roadmap, gates and capability plan are our proposals, not case facts.',
  model: 'Team financial model output, built on case data and the labelled assumptions.',
};
const A = (text, key) => `<span class="asm" tabindex="0" data-src="${esc(SRC[key])}">${text}</span>`;

/* ---------------------------------------------------------------- icons */
const I = {
  check: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.2 4.7-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cross: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 3.2l5.6 5.6M8.8 3.2l-5.6 5.6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  plan: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6h6M6.5 3.5L9 6l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowR: '<svg class="arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowL: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M12 7H2M6 3L2 7l4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7a4.5 4.5 0 1 0 1.4-3.3M2.5 2v2.6h2.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5L8 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex:none;margin-top:2px"><path d="M7 1.8l5.6 9.8H1.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 5.6v2.6M7 10v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};
const mark = (state) => `<span class="mark mark--${state}">${state === 'y' ? I.check : state === 'n' ? I.cross : I.plan}</span>`;
const pill = (status) => {
  const s = status.toUpperCase();
  if (s === 'PASS') return `<span class="pill pill--pass">${I.check}Pass</span>`;
  if (s === 'ON PLAN') return `<span class="pill pill--plan">${I.plan}On plan</span>`;
  return `<span class="pill pill--fail">${I.cross}Fail</span>`;
};

/* ---------------------------------------------------------------- shell pieces */
const head = (n, headline, sub, extra = '') => `
  <div class="screen-head"><div>
    <div class="kicker"><span class="count">${String(n).padStart(2, '0')} / 06</span>${SCREENS[n - 1].kicker}</div>
    <h1 class="headline${n === 3 || n === 5 ? ' headline--wide' : ''}" id="h-${n}">${headline}</h1>
    ${sub ? `<p class="subhead">${sub}</p>` : ''}
  </div>${extra}</div>`;

const pager = (n) => {
  const prev = n > 1 ? `<a class="btn btn--ghost" href="#screen-${n - 1}">${I.arrowL}${SCREENS[n - 2].nav}</a>` : '<span></span>';
  const next = n < 6
    ? `<a class="btn btn--primary" href="#screen-${n + 1}">Next: ${SCREENS[n].nav}${I.arrowR}</a>`
    : `<a class="btn btn--ghost" href="#screen-4">Open the deal simulator</a>`;
  return `<div class="pager">${prev}<span class="pager__hint"><span class="kbd">←</span><span class="kbd">→</span> to move between screens</span>${next}</div>`;
};

const footer = () => `
  <footer class="foot">
    <span class="legend"><span class="c-case">Case data in black</span> · <span class="c-asm">our assumptions in blue</span> · <span class="c-syn">outlet data synthetic</span></span>
    <span class="ver">${VERSION} · ${DATE} · Team financial model; Deloitte case pp. 3–5</span>
  </footer>`;

/* ================================================================ SCREEN 1 */
function s1() {
  const bt = FN.board_tests_at_ask, rec = FN.recommendation;
  const p400 = FN.npv_by_scenario.price_400.base, p450 = FN.npv_by_scenario.price_450.base;
  const mixFrom = fmt.pct1(bt.mix.value), mixTo = fmt.pct1(FN.mix_plan.mix_with_plan);
  const tiles = [
    { k: 'growth', label: 'FY25–29 revenue growth', value: bt.growth.display, target: 'Board floor ≥ 5% a year', r: { min: 0.02, max: 0.07, step: 0.005, major: 2, value: bt.growth.value, target: 0.05, better: 'up', tlabel: '5%' } },
    { k: 'leverage', label: 'Peak net debt / EBITDA', value: bt.leverage.display, target: 'Board limit ≤ 2.5x', r: { min: 1, max: 4, step: 0.1, major: 5, value: bt.leverage.value, target: 2.5, better: 'down', tlabel: '2.5x' } },
    { k: 'margin', label: 'FY29 operating margin', value: bt.margin.display, target: 'Board floor ≥ 11%', r: { min: 0.09, max: 0.13, step: 0.0025, major: 4, value: bt.margin.value, target: 0.11, better: 'up', tlabel: '11%' } },
    { k: 'mix', label: 'Functional mix, FY29', value: `${mixFrom}<span class="arr">→</span><span class="to">${mixTo}</span>`, target: `Board target ≥ 12% · ${A(esc(bt.mix.note), 'vital')}`, r: { min: 0.08, max: 0.14, step: 0.0025, major: 4, value: bt.mix.value, target: 0.12, better: 'up', tlabel: '12%' } },
  ];
  const statusOf = (k) => bt[k].status === 'PASS' ? 'pass' : bt[k].status === 'ON PLAN' ? 'plan' : 'fail';
  return `
  <div class="brief">
    <div>
      <div class="kicker"><span class="count">01 / 06</span>Board recommendation · Project Orchard</div>
      <h1 class="headline" id="h-1">${rec.tagline.split('. ').map((l) => `<span class="l">${l.replace(/\.$/, '')}.</span>`).join('')}</h1>
      <p class="subhead mt-s">${esc(rec.one_liner)}</p>
    </div>
    <dl class="term" aria-label="Proposed terms">
      <div class="term__h"><span class="section-label">Proposed offer</span><span class="pill pill--rec">Recommended</span></div>
      <div class="term__row"><dt>At close</dt><dd>Buy 60% for ${fmt.money0(FN.deal.cash_at_close)} cash<small>${fmt.money0(FN.deal.tranche1_equity)} equity + ${fmt.money0(FN.deal.transaction_costs)} deal costs + ${fmt.money0(FN.deal.integration)} integration</small></dd></div>
      <div class="term__row"><dt>End of FY27</dt><dd>Buy the other 40%, ${A('priced on audited FY27 revenue', 't2')}<small>${esc(FN.deal.tranche2_formula.replace(', paid at end of FY27', '').replace(/ x /g, ' × '))}</small></dd></div>
      <div class="term__row"><dt>Price</dt><dd>${A(`Open at ${fmt.money0(rec.opening_bid)}`, 'stance')} · walk away above ${fmt.money0(rec.walk_away)}<small>${fmt.money0(rec.walk_away)} is the seller’s indicated price for 100%</small></dd></div>
    </dl>
  </div>

  <div class="tests-caption">
    <div class="section-label">Four board tests · at the full ${fmt.money0(rec.walk_away)} ask</div>
    <span class="section-label"><em>3 pass · 1 on plan</em></span>
  </div>
  <div class="grid g-4 mt-s">
    ${tiles.map((t) => `
      <div class="tile">
        <div class="tile__top"><span class="tile__label">${t.label}</span>${pill(bt[t.k].status)}</div>
        <div class="tile__value${t.k === 'mix' ? ' tile__value--pair' : ''}">${t.value}</div>
        <div class="ruler" data-ruler='${JSON.stringify({ ...t.r, status: statusOf(t.k) })}'></div>
        <div class="tile__note">${t.target}</div>
      </div>`).join('')}
  </div>

  <div class="price-row">
    <div class="card price-card">
      <div class="section-label">Price discipline</div>
      <div class="grid g-2 mt-s" style="gap:12px">
        <div><div class="tile__label">Opening bid</div><div class="tile__value" style="font-size:28px;color:var(--board)">${fmt.money0(rec.opening_bid)}</div><div class="tile__note">NPV <b style="color:var(--pass)">${fmt.signedMoney1(p400)}</b></div></div>
        <div><div class="tile__label">Walk-away</div><div class="tile__value" style="font-size:28px">${fmt.money0(rec.walk_away)}</div><div class="tile__note">NPV <b style="color:var(--pass)">${fmt.signedMoney1(p450)}</b></div></div>
      </div>
      <div class="pricebar" data-pricebar></div>
      <div class="tile__note">Dark blue: at ${fmt.money0(rec.price_beats_partnership_at_or_below)} or less, owning Brightwater beats the ${A('partnership', 'partner')} on NPV too.</div>
    </div>
    <div class="card">
      <div class="section-label">Why this answer</div>
      <ol class="reasons">
        <li class="reason"><span class="ri">Board tests</span><p>The only path that passes 3 of 4 board tests.</p></li>
        <li class="reason"><span class="ri">Staging</span><p>Pays the second 40% only for proven FY27 revenue.</p></li>
        <li class="reason"><span class="ri">Capability</span><p>Buys a 90-day innovation engine and 5 AI specialists; Alderbrook’s outlet data decides where it sells.</p></li>
      </ol>
    </div>
  </div>

  <div class="cta-row">
    <a class="btn btn--primary" href="#screen-2">Start the 4-minute walk-through${I.arrowR}</a>
    <a class="btn" href="#screen-4">Jump to the deal simulator</a>
    <span class="meta">Six screens · use <span class="kbd">←</span> <span class="kbd">→</span></span>
  </div>
  ${footer()}`;
}
function s1charts(root) {
  $$('[data-ruler]', root).forEach((el) => { el.innerHTML = CH.tileRuler(el.clientWidth, JSON.parse(el.dataset.ruler)); });
  const pb = $('[data-pricebar]', root);
  const rec = FN.recommendation;
  pb.innerHTML = CH.priceRuler(pb.clientWidth, { bid: rec.opening_bid, walk: rec.walk_away, beats: FN.breakevens.price_equal_to_partnership_npv });
}

/* ================================================================ SCREEN 2 */
let gapTarget = 5;
function s2() {
  const ob = FN.organic_bridge;
  const gapRange = `${fmt.money0(ob.gap_5pct).replace('M', '')}–${fmt.money0(ob.gap_6pct).replace('$', '')}`;
  const diag = [
    { t: 'Aging revenue base', e: 'Juice is 38% of FY25 sales and declines 3% a year; iced tea is 24% and flat.', r: 'Shift capital toward fast-growing functional and better-for-you drinks.' },
    { t: 'Innovation lag', e: 'Vital: $22M revenue, 60% sold on promotion, 14 months concept-to-shelf vs Brightwater’s 90 days.', r: 'Acquire faster trend-sensing and product-testing capability while protecting brand autonomy.' },
    { t: 'Underused network', e: 'Four plants at 68% utilisation; two can lines compatible; delivery to 110,000 outlets.', r: 'Use distribution selectively; move production in-house only after capacity and cost checks.' },
    { t: 'Data without commercial use', e: 'Weekly outlet-level sales used mainly for route planning; no commercial AI or data-science team.', r: 'Build one loop across outlet, velocity, promotion and consumer data.' },
  ];
  return `
  ${head(2, `Organic growth leaves a <span style="white-space:nowrap">${gapRange}</span> revenue shortfall by FY29.`, `On its own, Alderbrook grows ${fmt.pct1(ob.organic_cagr)} a year. Its route-to-market strength cannot offset shrinking juice, flat tea and slow innovation, so an acquisition must bring growth <i>and</i> a repeatable commercial capability, not just another brand.`)}
  <div class="why-grid">
    <div class="card">
      <div class="section-label">FY25–FY29 organic revenue bridge <em>$M · case category growth rates</em></div>
      <div class="mt-s" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="tile__note">Board ambition: grow revenue</span>
        <div class="seg" role="group" aria-label="Board growth target">
          <button type="button" data-target="5" aria-pressed="${gapTarget === 5}">5% a year</button>
          <button type="button" data-target="6" aria-pressed="${gapTarget === 6}">6% a year</button>
        </div>
      </div>
      <div class="chart-wrap mt-s" data-waterfall></div>
      <p class="chart-note">Axis starts at $1,600M. ${esc(ob.note)}.</p>
    </div>
    <div class="grid" style="align-content:start">
      <div class="card">
        <div class="section-label">Concept-to-shelf speed</div>
        <div class="speed">
          <div class="speed__row"><div class="speed__lab"><span>Vital (Alderbrook)</span><b>14 months</b></div><div class="speed__track"><i class="speed__fill" style="width:100%;background:var(--ink-3)"></i></div></div>
          <div class="speed__row"><div class="speed__lab"><span>Brightwater</span><b style="color:var(--board)">90 days</b></div><div class="speed__track"><i class="speed__fill" style="width:${(3 / 14 * 100).toFixed(1)}%;background:var(--board)"></i></div></div>
          <div class="speed__ticks"><span>0</span><span>3</span><span>6</span><span>9</span><span>12</span><span>14 mo</span></div>
        </div>
        <p class="tile__note mt-s">Brightwater gets a product to shelf in about a fifth of the time.</p>
      </div>
      <div class="card">
        <div class="section-label">What the shortfall means</div>
        <dl class="term mt-s" style="border:0;border-radius:0">
          <div class="term__row" style="padding:8px 0"><dt>FY29 organic</dt><dd class="num">${fmt.money1(ob.fy29_organic)}</dd></div>
          <div class="term__row" style="padding:8px 0"><dt>Needed at 5%</dt><dd class="num">${fmt.money1(ob.fy29_at_5pct)} <small>gap ${fmt.money1(ob.gap_5pct)}</small></dd></div>
          <div class="term__row" style="padding:8px 0"><dt>Needed at 6%</dt><dd class="num">${fmt.money1(ob.fy29_at_6pct)} <small>gap ${fmt.money1(ob.gap_6pct)}</small></dd></div>
        </dl>
      </div>
    </div>
  </div>
  <div class="card diag-card mt-s" style="margin-top:16px">
    <div class="section-label">Four structural constraints, and what each one asks of the deal</div>
    <table class="dt">
      <thead><tr><th scope="col">Constraint</th><th scope="col">Case evidence</th><th scope="col">Strategic response</th></tr></thead>
      <tbody>${diag.map((d) => `<tr><th scope="row">${d.t}</th><td>${d.e}</td><td class="resp">${d.r}</td></tr>`).join('')}</tbody>
    </table>
  </div>
  <p class="footnote">Strategic implication: Alderbrook should buy innovation speed and proven consumer demand, not another brand that needs years of promotion to reach scale. Source: Deloitte case pp. 3–4.</p>
  ${pager(2)}${footer()}`;
}
function s2charts(root) {
  const el = $('[data-waterfall]', root);
  el.innerHTML = CH.waterfall(el.clientWidth, FN.organic_bridge, gapTarget);
}
function s2bind(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-target]');
    if (!b) return;
    gapTarget = +b.dataset.target;
    $$('[data-target]', root).forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.target === gapTarget)));
    s2charts(root);
    live(`Target ${gapTarget}% a year: short by ${fmt.money1(gapTarget === 6 ? FN.organic_bridge.gap_6pct : FN.organic_bridge.gap_5pct)}`);
  });
}

/* ================================================================ SCREEN 3 */
let selOption = 'Brightwater 60% / 40%';
function s3() {
  const rows = FN.scorecard_at_ask;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.npv)));
  const t = (ok, plan) => mark(ok ? 'y' : plan ? 'p' : 'n');
  const body = rows.map((r) => {
    const g = r.cagr >= 0.05 - 1e-9, l = r.peak_leverage <= 2.5, m = r.op_margin >= 0.11, x = r.mix >= 0.12 - 1e-9;
    const w = Math.abs(r.npv) / maxAbs * 50;
    const bar = `<span class="npvbar"><i style="${r.npv >= 0 ? `left:50%;width:${w}%;background:var(--pass)` : `right:50%;width:${w}%;background:var(--fail)`}"></i></span>`;
    const npvNote = r.recommended ? `<small>${fmt.signedMoney1(FN.npv_by_scenario.price_400.base)} at ${fmt.money0(FN.recommendation.opening_bid)}</small>` : (r.npv_note ? '<small>contract value*</small>' : '');
    const npvTxt = r.npv_note && !r.recommended ? A(fmt.signedMoney1(r.npv), 'partner') : fmt.signedMoney1(r.npv);
    return `<tr class="${r.recommended ? 'rec' : ''}${r.option === selOption ? ' sel' : ''}" tabindex="0" data-opt="${esc(r.option)}" aria-label="${esc(r.option)}: ${r.tests} of 4 tests. Show rationale">
      <td><span class="opt">${I.chev}${esc(r.option)}</span></td>
      <td class="xcol"><span class="cell-t">${fmt.pct1(r.cagr)}${t(g)}</span></td>
      <td class="xcol"><span class="cell-t">${fmt.lev(r.peak_leverage)}${t(l)}</span></td>
      <td class="xcol"><span class="cell-t">${fmt.pct1(r.op_margin)}${t(m)}</span></td>
      <td class="xcol"><span class="cell-t">${fmt.pct1(r.mix)}${t(x, r.recommended)}</span></td>
      <td><span class="npvcell">${bar}<span class="v">${npvTxt}${npvNote}</span></span></td>
      <td><span class="tests-dots" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<i class="${i < r.tests ? 'on' : ''}"></i>`).join('')}</span><b>${r.tests}</b> / 4</td>
      <td class="xcol vcol"><span class="verdict">${r.recommended ? '<span class="pill pill--rec">Recommended</span>' : esc(r.verdict)}</span></td>
    </tr>`;
  }).join('');
  const partner = rows.find((r) => r.option === 'Distribution partnership');
  return `
  ${head(3, `Only the staged Brightwater deal passes 3 of 4 board tests, and at ${fmt.money0(FN.recommendation.price_beats_partnership_at_or_below)} or less it also wins on value.`, 'Five paths assessed against the same four board tests. A partnership costs less up front, but it buys no brand, no capability, and can end if Brightwater is sold to a rival.')}
  <div class="card score" id="score">
    <div class="table-scroll">
      <table class="sc">
        <caption class="sr-only">Strategic decision scorecard at the $450M ask</caption>
        <thead><tr>
          <th scope="col">Option</th>
          <th scope="col" class="xcol">FY25–29 growth<small>≥ 5%</small></th>
          <th scope="col" class="xcol">Peak leverage<small>≤ 2.5x</small></th>
          <th scope="col" class="xcol">FY29 op. margin<small>≥ 11%</small></th>
          <th scope="col" class="xcol">Functional mix<small>≥ 12%</small></th>
          <th scope="col">NPV<small>$M at the ${fmt.money0(FN.recommendation.walk_away)} ask</small></th>
          <th scope="col">Tests met</th>
          <th scope="col" class="xcol">Verdict</th>
        </tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="more-toggle"><button class="btn btn--sm" type="button" data-more aria-expanded="false">More columns</button></div>
    <div class="rationale" id="rationale" aria-live="polite"></div>
  </div>
  <p class="footnote">Click a row for the reasoning. ✓ meets the board test, ✗ misses it; the amber arrow marks the mix gap that the Vital plan closes (${fmt.pct1(FN.mix_plan.mix_with_plan)}).</p>

  <div class="callout mt">
    <div class="callout__q">
      <div class="section-label">The board’s question</div>
      <p class="q">“Could a distribution partnership offer comparable benefits at lower cost?”</p>
    </div>
    <div class="callout__a">
      <div class="section-label">Our answer</div>
      <p class="mt-s" style="color:var(--ink);font-size:15.5px">It gives part of the distribution benefit, none of the capability, and passes ${partner.tests} of 4 tests. At ${fmt.money0(FN.recommendation.price_beats_partnership_at_or_below)} or below, ownership is worth more on NPV too.</p>
      <p>The partnership’s ${fmt.signedMoney1(partner.npv)} is a contract value: it ends if Brightwater is sold to a rival, and it buys no 90-day engine and no AI team.</p>
    </div>
  </div>
  <p class="footnote">* Partnership NPV ${esc(partner.npv_note)}. Alderbrook buys and resells Brightwater on its own trucks, booking the resale value as revenue. Marrow Lane, partnership and Vital rows are static outputs of the team financial model. Source: Deloitte case pp. 3–5.</p>
  ${pager(3)}${footer()}`;
}
function s3select(root, opt) {
  selOption = opt;
  $$('tbody tr', root).forEach((tr) => tr.classList.toggle('sel', tr.dataset.opt === opt));
  $('#rationale', root).innerHTML = `<span class="who">${esc(opt)}</span><p>${esc(FN.option_rationales[opt])}</p>`;
}
function s3bind(root) {
  s3select(root, selOption);
  root.addEventListener('click', (e) => {
    const tr = e.target.closest('tbody tr');
    if (tr && !e.target.closest('.asm')) s3select(root, tr.dataset.opt);
    const m = e.target.closest('[data-more]');
    if (m) { const on = $('#score', root).classList.toggle('show-more'); m.setAttribute('aria-expanded', on); m.textContent = on ? 'Fewer columns' : 'More columns'; }
  });
  root.addEventListener('keydown', (e) => {
    const tr = e.target.closest('tbody tr');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); s3select(root, tr.dataset.opt); }
  });
}

/* ================================================================ SCREEN 4 · simulator */
const SL = {
  stake:         { label: 'Stake bought at close', unit: (v) => `${v}%`, min: 50, max: 100, step: 5, def: 60, to: (v) => v / 100, from: (v) => Math.round(v * 100), src: 'stake' },
  price:         { label: 'Headline price for 100%', unit: (v) => `$${v}M`, min: 380, max: 450, step: 5, def: 450, to: (v) => v, from: (v) => v },
  realisation:   { label: 'Synergies delivered', sub: 'share of planned', unit: (v) => `${v}%`, min: 50, max: 100, step: 5, def: 100, to: (v) => v / 100, from: (v) => Math.round(v * 100), src: 'synergy' },
  exit_multiple: { label: 'Exit multiple', sub: 'FY29 EBITDA', unit: (v) => `${(v / 10).toFixed(1)}x`, min: 100, max: 140, step: 5, def: 120, to: (v) => v / 10, from: (v) => Math.round(v * 10), src: 'exit' },
  cogs_eligible: { label: 'Cost of goods eligible', sub: 'for the in-house saving', unit: (v) => `${v}%`, min: 50, max: 75, step: 5, def: 75, to: (v) => v / 100, from: (v) => Math.round(v * 100), src: 'cogs' },
  seller_carry:  { label: 'Seller carry on tranche 2', sub: 'a year', unit: (v) => `${v}%`, min: 0, max: 9, step: 1, def: 0, to: (v) => v / 100, from: (v) => Math.round(v * 100), src: 'carry' },
  exit_cost:     { label: 'Distributor / co-packer exit cost', unit: (v) => `$${v}M`, min: 0, max: 60, step: 5, def: 0, to: (v) => v, from: (v) => v, src: 'exitcost' },
};
const VITAL_PLAN = () => FN.mix_plan.vital_growth_needed;
const PRESETS_FN = () => [
  { id: 'rec', label: 'Recommended', sub: () => `60% · ${fmt.money0(FN.recommendation.walk_away)}`, set: {} },
  { id: 'bid', label: 'Opening bid', sub: () => `60% · ${fmt.money0(FN.recommendation.opening_bid)}`, set: { price: FN.recommendation.opening_bid } },
  { id: 'full', label: 'Buy 100% now', sub: () => `100% · ${fmt.money0(FN.recommendation.walk_away)}`, set: { stake: 1 } },
  { id: 'sceptic', label: 'Board-sceptic', sub: () => '70% of synergies', set: { realisation: 0.7 } },
];
let inp = { ...M.DEFAULTS };
let lastKey = null;
const REC = () => M.run(M.DEFAULTS);
let shown = null; // currently displayed (animated) outputs

const isDefault = (k) => (k === 'scenario' ? inp.scenario === 'base' : k === 'vital_growth' ? inp.vital_growth === 0 : Math.abs(inp[k] - M.DEFAULTS[k]) < 1e-9);
const presetMatch = () => {
  for (const p of PRESETS_FN()) {
    const want = { ...M.DEFAULTS, ...p.set };
    if (Object.keys(want).every((k) => (typeof want[k] === 'number' ? Math.abs(want[k] - inp[k]) < 1e-9 : want[k] === inp[k]))) return p.id;
  }
  return null;
};
const sceptic = () => inp.realisation === 0.7 && inp.scenario === 'base';

function sliderHTML(key) {
  const s = SL[key], v = s.from(inp[key]);
  const n = Math.round((s.max - s.min) / s.step);
  const pct = (x) => ((x - s.min) / (s.max - s.min) * 100).toFixed(3);
  let ticks = '';
  for (let i = 0; i <= n; i++) ticks += `<i class="${i === 0 || i === n ? 'maj' : ''}" style="left:${(i / n * 100).toFixed(3)}%"></i>`;
  const lab = s.src ? A(s.label, s.src) : s.label;
  return `<div class="ctl" data-ctl="${key}">
    <div class="ctl__top"><label class="ctl__lab" for="in-${key}">${lab}${s.sub ? `<small>${s.sub}</small>` : ''}</label><output class="ctl__val" for="in-${key}" id="out-${key}">${s.unit(v)}</output></div>
    <div class="rs-row"><span class="rs__end">${s.unit(s.min)}</span>
    <div class="rs" data-rs="${key}">
      <div class="rs__track"></div><div class="rs__fill" style="width:${pct(v)}%"></div>
      <div class="rs__ticks">${ticks}</div>
      <span class="rs__rec" style="left:${pct(s.def)}%"></span>
      <input type="range" id="in-${key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${v}" aria-valuetext="${s.unit(v)}">
      <span class="rs__thumb" style="left:${pct(v)}%"></span>
    </div><span class="rs__end">${s.unit(s.max)}</span></div>
  </div>`;
}

function s4() {
  return `
  <div class="sim-head">${head(4, '<span id="sim-headline"></span>', '<span id="sim-sub"></span>')}</div>
  <div class="sim">
    <aside class="card controls" aria-label="Deal levers">
      <div class="controls__head">
        <span class="section-label">Deal levers</span>
        <span style="display:flex;gap:6px"><button class="btn btn--sm btn--ghost" type="button" id="share" title="Copy a link to this exact scenario">Copy link</button><button class="btn btn--sm" type="button" id="reset" title="Reset to recommended (R)">${I.reset}<span class="hide-sm">Reset to recommended</span><span class="show-sm">Reset</span></button></span>
      </div>
      <div class="coach" id="coach" hidden></div>
      <div class="presets" role="group" aria-label="Presets">
        ${PRESETS_FN().map((p) => `<button type="button" class="preset" data-preset="${p.id}" aria-pressed="false">${p.label}<small>${p.sub()}</small></button>`).join('')}
      </div>
      <div class="controls__body">
        <div class="ctl-group-label">Deal structure</div>
        ${sliderHTML('stake')}
        ${sliderHTML('price')}
        <div class="ctl-group-label">Value drivers</div>
        <div class="ctl" data-ctl="scenario">
          <div class="ctl__top"><span class="ctl__lab">${A('Brightwater growth case', 'base')}</span><output class="ctl__val" id="out-scenario"></output></div>
          <div class="seg seg--full" role="group" aria-label="Brightwater growth case">
            <button type="button" data-scn="bear">Bear</button><button type="button" data-scn="base">Base</button><button type="button" data-scn="mgmt">Management</button>
          </div>
        </div>
        ${sliderHTML('realisation')}
        <div class="ctl" data-ctl="sceptic">
          <div class="switch-row">
            <span class="ctl__lab" id="lab-sceptic">Board-sceptic<small>${A('70% of synergies', 'real')}, base case</small></span>
            <button type="button" class="switch" role="switch" id="sw-sceptic" aria-checked="false" aria-labelledby="lab-sceptic"></button>
          </div>
        </div>
        ${sliderHTML('exit_multiple')}
        ${sliderHTML('cogs_eligible')}
        <div class="ctl-group-label">Deal risks</div>
        ${sliderHTML('seller_carry')}
        ${sliderHTML('exit_cost')}
        <div class="ctl" data-ctl="vital_growth">
          <div class="ctl__top"><span class="ctl__lab">${A('Vital growth', 'vital')}<small>mix plan</small></span><output class="ctl__val" id="out-vital_growth"></output></div>
          <div class="seg seg--full" role="group" aria-label="Vital growth">
            <button type="button" data-vital="0">Flat</button><button type="button" data-vital="1">+${fmt.pct1(VITAL_PLAN())} a year</button>
          </div>
        </div>
      </div>
    </aside>

    <div class="outputs">
      <div class="card gauge-card">
        <div class="gauge-top">
          <div>
            <div class="section-label">Net debt / EBITDA at close</div>
            <div class="big mt-s" id="o-lev"></div>
            <div class="delta" id="o-lev-d"></div>
          </div>
          <dl class="gauge-stats">
            <div><dt>Headroom to 2.5x</dt><dd id="o-head"></dd><dd class="sub" id="o-head-tag"></dd></div>
            <div><dt>Peak, FY25–29</dt><dd id="o-peak"></dd><dd class="sub" id="o-peak-tag"></dd></div>
          </dl>
        </div>
        <div class="gauge" id="o-gauge"></div>
      </div>

      <div class="row-2">
        <div class="card npv-card">
          <div class="section-label">NPV to Alderbrook <em>${A('9% discount rate', 'wacc')}</em></div>
          <div class="big mt-s" id="o-npv"></div>
          <div class="delta" id="o-npv-d"></div>
          <div class="npv-ref"><span>vs ${A('partnership', 'partner')}</span><b id="o-npv-ref"></b></div>
        </div>
        <div class="card tests-card">
          <div class="section-label">FY29 board tests <span class="score-n"><b id="o-tests"></b> of 4 <span class="delta" id="o-tests-d" style="display:inline;margin-left:4px"></span></span></div>
          <div class="tstrip" id="o-strip"></div>
        </div>
      </div>

      <div class="card cash">
        <div><div class="cl">Cash at close</div><div class="cv" id="o-cash"></div><div class="cs" id="o-cash-s"></div></div>
        <div><div class="cl">Tranche 2 · end of FY27</div><div class="cv" id="o-t2"></div><div class="cs" id="o-t2-s"></div></div>
      </div>

      <div class="row-3">
        <div class="card mini-chart">
          <div class="section-label">Leverage path <em>dashed = recommended</em></div>
          <div class="mt-s" id="o-path"></div>
        </div>
        <div class="card mini-chart">
          <div class="section-label">NPV across the price range <em>other levers held</em></div>
          <div class="mt-s" id="o-curve"></div>
        </div>
      </div>
      <p class="small-print">Tranche 2 = 40% × MIN(price, 2.75 × FY27 revenue). ${A('Synergies', 'synergy')} and ${A('exit multiple', 'exit')} are team assumptions; debt is repaid from ${A('45% of Alderbrook EBITDA', 'paydown')} a year. Keys: <span class="kbd">R</span> resets.</p>
    </div>
  </div>
  <div class="sim-dock" aria-hidden="true"><div><span>Leverage</span><b id="d-lev"></b></div><div><span>NPV</span><b id="d-npv"></b></div><div><span>Tests</span><b id="d-tests"></b></div></div>
  ${pager(4)}${footer()}`;
}

function headline(o) {
  const lev = fmt.lev(o.leverage_close), stake = `${Math.round(inp.stake * 100)}%`;
  const npv = fmt.signedMoney1(o.npv);
  const npvSpan = `<span class="${o.npv >= 0 ? 'hot' : 'bad'}">${npv}</span>`;
  const levClause = o.leverage_close > M.BOARD_LEV
    ? `${stake} now pushes leverage to <span class="bad">${lev}</span>, above the board’s 2.5x`
    : `${stake} now keeps leverage at <span class="hot">${lev}</span>, under the board’s 2.5x`;
  const price = fmt.money0(inp.price);
  switch (lastKey) {
    case 'price':
      return inp.price < M.PRICE_ASK ? `At ${price}, NPV rises to ${npvSpan}` : `At the ${price} ask, NPV is ${npvSpan}`;
    case 'realisation': case 'sceptic':
      return o.npv < 0 ? `At ${Math.round(inp.realisation * 100)}% of planned synergies, the deal loses value: NPV ${npvSpan}` : `At ${Math.round(inp.realisation * 100)}% of planned synergies, NPV is ${npvSpan}`;
    case 'scenario':
      return inp.scenario === 'bear' ? `In the bear case NPV falls to ${npvSpan}, and tranche 2 drops to ${fmt.money1(o.tranche2)} by formula`
        : inp.scenario === 'mgmt' ? `On management’s forecast NPV rises to ${npvSpan}` : `${levClause}`;
    case 'exit_multiple': return `At ${fmt.mult(inp.exit_multiple)} FY29 EBITDA, NPV is ${npvSpan}`;
    case 'cogs_eligible': return `With ${Math.round(inp.cogs_eligible * 100)}% of cost of goods eligible, NPV is ${npvSpan}`;
    case 'seller_carry': return `A ${Math.round(inp.seller_carry * 100)}% seller carry lifts tranche 2 to ${fmt.money1(o.tranche2)}; NPV ${npvSpan}`;
    case 'exit_cost': return `A ${fmt.money0(inp.exit_cost)} exit cost takes NPV to ${npvSpan} and leverage to <span class="${o.leverage_close > 2.5 ? 'bad' : 'hot'}">${lev}</span>`;
    case 'vital_growth': return inp.vital_growth > 0 ? `Vital at +${fmt.pct1(inp.vital_growth)} a year lifts mix to ${fmt.pct1(o.mix29)}: ${o.tests_passed} of 4 tests pass` : `With Vital flat, mix is ${fmt.pct1(o.mix29)}: ${o.tests_passed} of 4 tests pass`;
    default: return levClause;
  }
}

function setDelta(el, v, rv, f, goodDir) {
  const d = v - rv;
  if (Math.abs(d) < 1e-6 || f(Math.abs(d)) === f(0)) { el.textContent = 'Recommended case'; el.className = 'delta'; return; }
  const good = goodDir === 'up' ? d > 0 : d < 0;
  el.textContent = `${d > 0 ? '▲' : '▼'} ${f(Math.abs(d))} vs recommended`;
  el.className = `delta ${good ? 'good' : 'bad'}`;
}

function renderOutputs(o, root, final) {
  const rec = REC();
  const levEl = $('#o-lev', root);
  levEl.innerHTML = `${o.leverage_close.toFixed(2)}<span class="u">x</span>`;
  levEl.className = `big ${o.leverage_close <= 2.5 + 1e-9 ? 'pass' : o.leverage_close <= 3.5 ? 'amber' : 'red'}`;
  const npvEl = $('#o-npv', root);
  npvEl.textContent = fmt.signedMoney1(o.npv);
  npvEl.className = `big ${o.npv >= 0 ? 'pos' : 'neg'}`;
  const g = $('#o-gauge', root);
  g.innerHTML = CH.gauge(g.clientWidth, { value: o.leverage_close, rec: rec.leverage_close });
  $('#o-head', root).textContent = fmt.money2(o.headroom_close);
  $('#o-head', root).style.color = o.headroom_close < 0 ? 'var(--fail)' : '';
  $('#o-cash', root).textContent = fmt.money0(o.cash_at_close);
  $('#o-t2', root).textContent = inp.stake >= 1 ? 'None' : fmt.money1(o.tranche2).replace('.0M', 'M');
  const dl = $('#d-lev', root); dl.textContent = fmt.lev(o.leverage_close); dl.style.color = o.leverage_close > 2.5 ? '#FFB4A8' : '';
  const dn = $('#d-npv', root); dn.textContent = fmt.signedMoney1(o.npv); dn.style.color = o.npv < 0 ? '#FFB4A8' : '#A8E2BF';
  $('#d-tests', root).textContent = `${o.tests_passed} of 4`;
  if (!final) return;

  $('#o-head-tag', root).innerHTML = o.headroom_close < 0 ? '<span style="color:var(--fail)">over the limit</span>' : o.headroom_close < 50 ? '<span style="color:var(--plan)">tight</span>' : 'comfortable';
  $('#o-peak', root).textContent = fmt.lev(o.peak_leverage);
  $('#o-peak', root).style.color = o.peak_leverage > 2.5 ? 'var(--fail)' : '';
  const pk = o.leverage_path.indexOf(o.peak_leverage);
  $('#o-peak-tag', root).textContent = pk === 0 ? 'at close' : `in FY${25 + pk}`;
  setDelta($('#o-lev-d', root), o.leverage_close, rec.leverage_close, (x) => `${x.toFixed(2)}x`, 'down');
  setDelta($('#o-npv-d', root), o.npv, rec.npv, (x) => `$${x.toFixed(1)}M`, 'up');
  const partner = FN.scorecard_at_ask.find((r) => r.option === 'Distribution partnership').npv;
  const diff = o.npv - partner;
  $('#o-npv-ref', root).innerHTML = `${fmt.signedMoney1(partner)} <span style="color:${diff >= 0 ? 'var(--pass)' : 'var(--ink-3)'};font-weight:560">(${diff >= 0 ? 'ownership ahead by ' + fmt.money1(diff) : 'behind by ' + fmt.money1(-diff)})</span>`;
  $('#o-tests', root).textContent = o.tests_passed;
  const td = $('#o-tests-d', root), dt = o.tests_passed - rec.tests_passed;
  td.textContent = dt ? `${dt > 0 ? '▲' : '▼'} ${Math.abs(dt)}` : '';
  td.className = `delta ${dt > 0 ? 'good' : dt < 0 ? 'bad' : ''}`;

  const T = [
    { k: 'growth', l: 'Growth', s: '≥ 5% a year', v: fmt.pct1(o.cagr) },
    { k: 'leverage', l: 'Leverage', s: 'peak ≤ 2.5x', v: fmt.lev(o.peak_leverage) },
    { k: 'margin', l: 'Margin', s: '≥ 11%', v: fmt.pct1(o.op_margin29) },
    { k: 'mix', l: 'Mix', s: '≥ 12%', v: fmt.pct1(o.mix29) },
  ];
  const strip = $('#o-strip', root);
  const prev = strip.dataset.state ? JSON.parse(strip.dataset.state) : {};
  strip.innerHTML = T.map((t) => `<div class="tpill ${o.tests[t.k] ? 'y' : 'n'}${prev[t.k] !== undefined && prev[t.k] !== o.tests[t.k] ? ' flash' : ''}">${mark(o.tests[t.k] ? 'y' : 'n')}<span class="tl">${t.l}<small>${t.s}</small></span><span class="tv">${t.v}</span></div>`).join('');
  strip.dataset.state = JSON.stringify(o.tests);

  $('#o-cash-s', root).textContent = `${Math.round(inp.stake * 100)}% × ${fmt.money0(inp.price)} + ${fmt.money0(M.TXN_COSTS)} deal + ${fmt.money0(M.INTEGRATION)} integration`;
  $('#o-t2-s', root).textContent = inp.stake >= 1 ? 'None: 100% bought at close' : `${Math.round((1 - inp.stake) * 100)}% × MIN(${fmt.money0(inp.price)}, 2.75 × ${fmt.money1(o.bw_rev[2])})${inp.seller_carry ? ` + ${Math.round(inp.seller_carry * 100)}% carry` : ''}${o.tranche2_ev < inp.price - 1e-9 ? ' · set by revenue' : ' · at the cap'}`;

  const p = $('#o-path', root);
  p.innerHTML = CH.levPath(p.clientWidth, { path: o.leverage_path, rec: rec.leverage_path });
  const c = $('#o-curve', root);
  const curve = [];
  for (let pr = 380; pr <= 450; pr += 5) curve.push({ p: pr, v: M.run({ ...inp, price: pr }).npv });
  const partnerNpv = FN.scorecard_at_ask.find((r) => r.option === 'Distribution partnership').npv;
  const beats = M.solve('price', partnerNpv, 380, 450, inp);
  c.innerHTML = CH.npvPrice(c.clientWidth, { curve, price: inp.price, npv: o.npv, partnership: partnerNpv, beats });

  const hl = headline(o);
  const hEl = $('#sim-headline', root);
  if (hEl.innerHTML !== hl) hEl.innerHTML = hl;
  $('#sim-sub', root).innerHTML = `${o.tests_passed} of 4 board tests · NPV ${fmt.signedMoney1(o.npv)} at ${fmt.money0(inp.price)} · cash at close ${fmt.money0(o.cash_at_close)}. Drag any lever; every number below recalculates.`;
}

const LERP_KEYS = ['leverage_close', 'npv', 'headroom_close', 'cash_at_close', 'tranche2'];
let anim = 0;
/* ---- scenario links: #screen-4?st=100&pr=400 reproduces a scenario exactly */
const QK = { stake: 'st', price: 'pr', realisation: 'sy', exit_multiple: 'em', cogs_eligible: 'cg', seller_carry: 'ca', exit_cost: 'ex' };
function encodeScenario() {
  const q = [];
  for (const [k, short] of Object.entries(QK)) if (!isDefault(k)) q.push(`${short}=${SL[k].from(inp[k])}`);
  if (inp.scenario !== 'base') q.push(`sc=${inp.scenario}`);
  if (inp.vital_growth > 0) q.push('vg=1');
  return q.join('&');
}
function applyScenario(hash) {
  const i = hash.indexOf('?');
  if (i < 0) return false;
  const P = new URLSearchParams(hash.slice(i + 1));
  let any = false;
  for (const [k, short] of Object.entries(QK)) {
    if (!P.has(short)) continue;
    const s = SL[k], v = Math.round(+P.get(short) / s.step) * s.step;
    if (Number.isFinite(v)) { inp[k] = s.to(Math.min(s.max, Math.max(s.min, v))); any = true; }
  }
  if (['bear', 'base', 'mgmt'].includes(P.get('sc'))) { inp.scenario = P.get('sc'); any = true; }
  if (P.get('vg') === '1') { inp.vital_growth = VITAL_PLAN(); any = true; }
  return any;
}

function update(root, { animate = true } = {}) {
  if (current === 4 || !current) { const q = encodeScenario(); history.replaceState(null, '', `#screen-4${q ? `?${q}` : ''}`); }
  const target = M.run(inp);
  syncControls(root);
  const from = shown;
  shown = target;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!animate || !from || reduce) { renderOutputs(target, root, true); afterUpdate(root, target); return; }
  cancelAnimationFrame(anim);
  const t0 = performance.now(), dur = 260;
  renderOutputs(target, root, true);
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
    if (k < 1) {
      const mid = { ...target };
      for (const key of LERP_KEYS) mid[key] = from[key] + (target[key] - from[key]) * e;
      renderOutputs(mid, root, false);
      anim = requestAnimationFrame(step);
    } else renderOutputs(target, root, false);
  };
  anim = requestAnimationFrame(step);
  afterUpdate(root, target);
}

function syncControls(root) {
  for (const key of Object.keys(SL)) {
    const s = SL[key], v = s.from(inp[key]);
    const el = $(`#in-${key}`, root);
    if (+el.value !== v) el.value = v;
    el.setAttribute('aria-valuetext', s.unit(v));
    const pct = ((v - s.min) / (s.max - s.min) * 100).toFixed(3);
    const rs = $(`[data-rs="${key}"]`, root);
    $('.rs__fill', rs).style.width = `${pct}%`;
    $('.rs__thumb', rs).style.left = `${pct}%`;
    rs.classList.toggle('is-rec', v === s.def);
    const out = $(`#out-${key}`, root);
    out.textContent = s.unit(v);
    out.classList.toggle('changed', v !== s.def);
  }
  $$('[data-scn]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scn === inp.scenario)));
  $('#out-scenario', root).textContent = { bear: 'Bear', base: 'Base', mgmt: 'Management' }[inp.scenario];
  $('#out-scenario', root).classList.toggle('changed', inp.scenario !== 'base');
  $$('[data-vital]', root).forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.vital === '1') === (inp.vital_growth > 0))));
  $('#out-vital_growth', root).textContent = inp.vital_growth > 0 ? `+${fmt.pct1(inp.vital_growth)}` : 'Flat';
  $('#out-vital_growth', root).classList.toggle('changed', inp.vital_growth > 0);
  $('#sw-sceptic', root).setAttribute('aria-checked', String(sceptic()));
  const pm = presetMatch();
  $$('[data-preset]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === pm)));
  $('#reset', root).disabled = pm === 'rec';
  $('#reset', root).style.opacity = pm === 'rec' ? '.5' : '';
}

/* ---- coach marks: the three-step guided path */
const COACH_KEY = 'asl-coach-done';
let coach = { step: 0, phase: 0 }; // phase: 0 = asked, 1 = condition met
function coachSteps() {
  const full = M.run({ stake: 1 }), bid = M.run({ price: FN.recommendation.opening_bid }), sc = M.run({ realisation: 0.7 });
  return [
    { ctl: 'stake', ask: `Drag the stake to 100%. Leverage jumps to ${fmt.lev(full.leverage_close)}, over the board’s limit.`, met: () => inp.stake >= 1,
      after: 'Over the limit: 2 of 4 tests. Now drag it back to 60% and watch it recover.', done: () => Math.abs(inp.stake - 0.6) < 1e-9 },
    { ctl: 'price', ask: `Now try the opening bid: set the price to ${fmt.money0(FN.recommendation.opening_bid)}. NPV rises to ${fmt.signedMoney1(bid.npv)}.`, met: () => inp.price <= FN.recommendation.opening_bid, action: { label: `Apply opening bid`, set: { price: FN.recommendation.opening_bid } },
      after: `${fmt.signedMoney1(bid.npv)} and ${fmt.lev(bid.leverage_close)} at close. Every $1M off the price adds about $0.94M of NPV.`, done: null },
    { ctl: 'sceptic', ask: 'Switch on Board-sceptic. The deal needs its synergies: this is why integration is the critical path.', met: () => sceptic(), action: { label: 'Switch it on', sceptic: true },
      after: `At 70% of synergies NPV is ${fmt.signedMoney1(sc.npv)}. Value breaks even at about ${Math.round(FN.breakevens.synergy_realisation_at_450 * 20) * 5}% delivery at the ask, about ${Math.round(FN.breakevens.synergy_realisation_at_400 * 20) * 5}% at ${fmt.money0(FN.recommendation.opening_bid)}.`, done: null },
  ];
}
function coachRender(root) {
  const el = $('#coach', root);
  let done = false;
  try { done = localStorage.getItem(COACH_KEY) === '1'; } catch { /* storage blocked */ }
  $$('.ctl--hi', root).forEach((x) => x.classList.remove('ctl--hi'));
  if (done || coach.step > 2) { el.hidden = true; $('#coach-reopen', root)?.removeAttribute('hidden'); return; }
  const st = coachSteps()[coach.step];
  el.hidden = false;
  $(`[data-ctl="${st.ctl}"]`, root)?.classList.add('ctl--hi');
  const met = coach.phase === 1;
  const last = coach.step === 2;
  let primary = '';
  if (!met && st.action) primary = `<button type="button" class="go" data-coach="act">${st.action.label}</button>`;
  else if (met && (!st.done)) primary = `<button type="button" class="go" data-coach="next">${last ? 'Finish' : 'Next step'}</button>`;
  el.innerHTML = `
    <div class="coach__step"><span>Try this · step ${coach.step + 1} of 3</span><span class="coach__dots">${[0, 1, 2].map((i) => `<i class="${i <= coach.step ? 'on' : ''}"></i>`).join('')}</span></div>
    <p class="coach__text">${met ? `<b>${I.check.replace('<svg', '<svg width="12" height="12" style="display:inline;vertical-align:-1px;margin-right:4px"')}</b>${st.after}` : st.ask}</p>
    <div class="coach__actions"><button type="button" data-coach="skip">Hide guide</button>${primary}</div>`;
}
function coachCheck(root) {
  if (coach.step > 2) return;
  const st = coachSteps()[coach.step];
  if (coach.phase === 0 && st.met()) { coach.phase = 1; coachRender(root); return; }
  if (coach.phase === 1 && st.done && st.done()) { coach.step++; coach.phase = 0; coachRender(root); }
}
function coachFinishSilently() { coach.step = 3; }
function coachFinish(root) {
  coach.step = 3;
  try { localStorage.setItem(COACH_KEY, '1'); } catch { /* ignore */ }
  coachRender(root);
}

function afterUpdate(root, o) {
  coachCheck(root);
  live(`Leverage ${fmt.lev(o.leverage_close)}, NPV ${fmt.signedMoney1(o.npv)}, ${o.tests_passed} of 4 tests`);
}

function setInput(root, key, value) {
  inp[key] = value; lastKey = key; update(root);
}
function resetSim(root) {
  inp = { ...M.DEFAULTS }; lastKey = null; update(root);
}

function s4bind(root) {
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.type !== 'range') return;
    const key = t.id.replace('in-', '');
    inp[key] = SL[key].to(+t.value); lastKey = key;
    update(root);
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'reset') return resetSim(root);
    if (b.id === 'share') {
      const done = (ok) => { b.textContent = ok ? 'Link copied' : 'Copy failed: use the address bar'; setTimeout(() => { b.textContent = 'Copy link'; }, 1800); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(location.href).then(() => done(true), () => done(false)); else done(false);
      return;
    }
    if (b.dataset.preset) {
      const p = PRESETS_FN().find((x) => x.id === b.dataset.preset);
      inp = { ...M.DEFAULTS, ...p.set };
      lastKey = { rec: null, bid: 'price', full: 'stake', sceptic: 'sceptic' }[p.id];
      return update(root);
    }
    if (b.dataset.scn) { inp.scenario = b.dataset.scn; lastKey = 'scenario'; return update(root); }
    if (b.dataset.vital !== undefined) { inp.vital_growth = b.dataset.vital === '1' ? VITAL_PLAN() : 0; lastKey = 'vital_growth'; return update(root); }
    if (b.id === 'sw-sceptic') {
      if (sceptic()) { inp.realisation = 1.0; } else { inp.realisation = 0.7; inp.scenario = 'base'; }
      lastKey = 'sceptic'; return update(root);
    }
    if (b.dataset.coach) {
      const st = coachSteps()[coach.step];
      if (b.dataset.coach === 'skip') return coachFinish(root);
      if (b.dataset.coach === 'act') {
        if (st.action.set) { Object.assign(inp, st.action.set); lastKey = 'price'; }
        if (st.action.sceptic) { inp.realisation = 0.7; inp.scenario = 'base'; lastKey = 'sceptic'; }
        return update(root);
      }
      if (b.dataset.coach === 'next') {
        if (coach.step === 2) return coachFinish(root);
        coach.step++; coach.phase = 0; coachRender(root); return coachCheck(root);
      }
    }
    if (b.id === 'coach-reopen') {
      try { localStorage.removeItem(COACH_KEY); } catch { /* ignore */ }
      coach = { step: 0, phase: 0 }; b.hidden = true; resetSim(root); coachRender(root);
    }
  });
  // guide re-open link under the presets
  const ph = $('.controls__head', root);
  ph.insertAdjacentHTML('afterend', '<div style="padding:8px 16px 0;text-align:right"><button type="button" class="coach-reopen" id="coach-reopen" hidden>Show the 3-step guide</button></div>');
  if (applyScenario(location.hash)) { lastKey = null; coachFinishSilently(); }
  coachRender(root);
  update(root, { animate: false });
}

/* ================================================================ SCREEN 5 */
let selCluster = null;
function majorityWave(c) { const a = [c.wave1_outlets, c.wave2_outlets, c.wave3_outlets]; return a.indexOf(Math.max(...a)) + 1; }
function s5() {
  const waves = OW.waves;
  const W = OW.meta.fit_weights;
  const wl = { current_functional_velocity: 'Current functional velocity', natural_shopper_index: 'Natural-shopper index', store_size: 'Store size', promotion_dependence: 'Promotion dependence' };
  const maxW = Math.max(...Object.values(W).map(Math.abs));
  const clusters = [...OC.clusters].sort((a, b) => b.avg_fit - a.avg_fit);
  return `
  ${head(5, 'Alderbrook’s own outlet data decides where Brightwater goes first, and where it should not go.', `Rank all ${fmt.int(OW.meta.network_outlets)} outlets by fit, launch in the best fifth, and release each further wave only when the one before it sells. ${A('Gates', 'gates')}: scale at ≥ 1.0x category velocity, stop under 0.7x.`,
    '<div class="badge-synth" role="note">Synthetic data <span>· illustrates the method, not case data</span></div>')}
  <div class="card waves">
    ${waves.map((w) => `
      <div class="wave">
        <div class="wave__h"><span class="wave__name"><i class="wave__sw" style="background:var(--w${w.wave})"></i>Wave ${w.wave}</span><span class="wave__months">Months ${w.months.replace('-', '–')}</span></div>
        <div class="wave__stats">
          <div><div class="k">Outlets</div><div class="v">${fmt.int(w.outlets)}</div><div class="k">${fmt.pct0(w.share_of_network)} of network</div></div>
          <div><div class="k">Expected velocity</div><div class="v${w.expected_bw_velocity < 0.7 ? ' low' : ''}">${w.expected_bw_velocity.toFixed(2)}x</div><div class="k">avg fit ${w.avg_fit.toFixed(1)}</div></div>
        </div>
        <div class="velbar" data-vel="${w.expected_bw_velocity}" data-wave="${w.wave}"></div>
        <div class="wave__gate"><b>Gate</b>${esc(w.gate.replace('>=', '≥'))}</div>
        ${w.expected_bw_velocity < 0.7 ? `<div class="wave__warn">${I.warn}Below the 0.7x stop line: release only clusters that clear it.</div>` : ''}
      </div>`).join('')}
  </div>

  <div class="ai-grid">
    <div class="card">
      <div class="section-label">Outlet clusters ranked by fit <em>bar = average fit · colour = majority wave</em></div>
      <div class="clusters" id="clusters">
        ${clusters.map((c) => { const mw = majorityWave(c); return `<button type="button" class="cl-row" data-cl="${esc(c.cluster)}" aria-pressed="false">
          <span class="cn">${esc(c.cluster)}</span>
          <span class="cb"><i style="width:${c.avg_fit}%;background:var(--w${mw})"></i><em>${c.avg_fit.toFixed(1)}</em></span>
          <span class="co">${fmt.int(c.outlets)}</span></button>`; }).join('')}
      </div>
      <div class="legend-row mt-s"><span><i style="background:var(--w1)"></i>Wave 1</span><span><i style="background:var(--w2)"></i>Wave 2</span><span><i style="background:var(--w3)"></i>Wave 3</span><span style="margin-left:auto;color:var(--ink-3)">right: outlets</span></div>
      <div class="cl-detail" id="cl-detail"></div>
    </div>
    <div class="card">
      <div class="section-label">3,000 sampled outlets <em id="sc-cap">click a cluster to isolate it</em></div>
      <div class="legend-row mt-s"><span><i class="dot" style="background:var(--w1)"></i>Wave 1</span><span><i class="dot" style="background:var(--w2)"></i>Wave 2</span><span><i class="dot" style="background:var(--w3)"></i>Wave 3</span></div>
      <div class="scatter mt-s" id="scatter"><div style="aspect-ratio:1.45;display:grid;place-items:center;color:var(--ink-4);font-size:13px">Loading outlet sample…</div></div>
    </div>
  </div>

  <div class="ai-grid">
    <div class="card">
      <div class="section-label">How the fit score works</div>
      <div class="weights">
        ${Object.entries(W).map(([k, v]) => `<div class="wt"><span>${wl[k] || k}</span><span class="wb"><i style="${v >= 0 ? `left:20%;width:${(v / maxW * 80).toFixed(1)}%;background:var(--board)` : `right:80%;width:${(-v / maxW * 20 * 1).toFixed(1)}%;background:var(--fail)`}"></i></span><span class="wv">${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}</span></div>`).join('')}
      </div>
      <p class="tile__note mt">In production this runs on Alderbrook’s weekly outlet sales joined with SPINS and Circana data.</p>
    </div>
    <div class="card">
      <div class="section-label">AI and data · phased, each phase pays before the next</div>
      <div class="road3">
        <div><div class="ph">Phase 1</div><h4>Outlet targeting</h4><p>Rank 110,000 outlets by fit; sequence the Brightwater rollout.</p><p class="gate">Wave-1 velocity ≥ 1.0x</p></div>
        <div><div class="ph">Phase 2</div><h4>Trend sensing</h4><p>Extend Brightwater’s AI tools across the portfolio; cut 14 months concept-to-shelf toward ~6.</p><p class="gate">Two launches in under 6 months</p></div>
        <div><div class="ph">Phase 3</div><h4>Promotion optimisation</h4><p>Separate real demand from promotion-bought volume (Vital: 60% on promotion today).</p><p class="gate">Promotion share of volume falling</p></div>
      </div>
      <div class="caps"><span class="cap">Acquire <b>5</b> AI specialists</span><span class="cap">Build a <b>~10-person</b> analytics team</span><span class="cap">Buy <b>SPINS</b> + <b>Circana</b> data</span></div>
    </div>
  </div>
  <p class="anchors">Real-world anchors: PepsiCo uses store-level AI to recommend products that sell nearby but are not yet stocked; published benefits for this kind of tool are 2–6% sales uplift and about 20% fewer out-of-stocks. All outlet figures on this screen are synthetic (seed ${OW.meta.seed}).</p>
  ${pager(5)}${footer()}`;
}
function s5cluster(root, name) {
  selCluster = selCluster === name ? null : name;
  $$('.cl-row', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cl === selCluster)));
  const c = OC.clusters.find((x) => x.cluster === (selCluster || [...OC.clusters].sort((a, b) => b.avg_fit - a.avg_fit)[0].cluster));
  const tot = c.wave1_outlets + c.wave2_outlets + c.wave3_outlets;
  $('#cl-detail', root).innerHTML = `
    <div class="t"><span>${esc(c.cluster)}</span><span class="tile__note">${selCluster ? 'selected' : 'top-ranked'} · ${fmt.int(c.outlets)} outlets</span></div>
    <dl>
      <div><dt>Natural-shopper index</dt><dd>${c.natural_shopper_index.toFixed(2)}</dd></div>
      <div><dt>Current functional velocity</dt><dd>${c.current_functional_velocity.toFixed(2)}x</dd></div>
      <div><dt>Promotion share</dt><dd>${fmt.pct0(c.promo_share)}</dd></div>
      <div><dt>Expected Brightwater velocity</dt><dd style="color:${c.expected_bw_velocity < 0.7 ? 'var(--fail)' : c.expected_bw_velocity >= 1 ? 'var(--pass)' : 'var(--ink)'}">${c.expected_bw_velocity.toFixed(2)}x</dd></div>
    </dl>
    <div style="display:flex;height:8px;gap:2px;margin-top:12px" aria-label="Wave split">${[1, 2, 3].map((w) => `<i style="flex:${c[`wave${w}_outlets`]};background:var(--w${w});border-radius:2px"></i>`).join('')}</div>
    <div class="legend-row mt-s" style="font-size:11.5px">${[1, 2, 3].map((w) => `<span>Wave ${w}: ${fmt.int(c[`wave${w}_outlets`])} (${fmt.pct0(c[`wave${w}_outlets`] / tot)})</span>`).join('')}</div>`;
  $('#sc-cap', root).textContent = selCluster ? `showing ${selCluster} · click again to show all` : 'click a cluster to isolate it';
  s5scatter(root);
}
function s5scatter(root) {
  const el = $('#scatter', root);
  if (!OS) return;
  el.innerHTML = CH.scatter(el.clientWidth, OS.outlets, { highlight: selCluster });
}
function s5charts(root) {
  $$('[data-vel]', root).forEach((el) => { el.innerHTML = CH.velScale(el.clientWidth, { v: +el.dataset.vel, color: CH.COLORS.w[+el.dataset.wave - 1] }); });
  s5scatter(root);
}
function s5bind(root) {
  root.addEventListener('click', (e) => { const b = e.target.closest('.cl-row'); if (b) s5cluster(root, b.dataset.cl); });
  s5cluster(root, null);
  if (!OS) {
    fetch('data/outlets_sample.json').then((r) => r.json()).then((d) => { OS = d; s5scatter(root); })
      .catch(() => { $('#scatter', root).innerHTML = '<p class="tile__note">The outlet sample could not load. Refresh the page to try again.</p>'; });
  }
}

/* ================================================================ SCREEN 6 */
function s6() {
  const phases = [
    { k: 'SIGN', m: '0–3', a: 'Diligence on distributor exit costs, co-packer savings, can-line capacity, governance, founder and AI-team retention.', g: 'No close without verified cash flow and leverage headroom; FY27 revenue formula and seller-carry terms agreed.' },
    { k: 'PROVE', m: '3–6', a: 'Trial production on the two can lines; keep the natural channel; join weekly outlet sales with store, promotion and retailer data.', g: 'Quality, unit cost, throughput and seasonal flexibility confirmed before moving more volume.' },
    { k: 'PILOT', m: '6–12', a: 'Launch in targeted grocery and convenience clusters, ranked by AI on outlet fit; run controlled velocity pilots.', g: 'Scale a wave only at ≥ 1.0x category velocity; pause any wave under 0.7x for two quarters.' },
    { k: 'SCALE', m: '12–18', a: 'Expand winning clusters; run 90-day innovation cycles across the portfolio, starting with Vital; embed analytics in sales.', g: 'Recompute NPV and leverage headroom before each capital release.' },
    { k: 'BUY OUT', m: '18–24', a: 'Audit FY27 revenue; pay tranche 2.', g: `Recompute NPV and leverage on audited FY27 revenue; pay ${esc(FN.deal.tranche2_formula.replace(', paid at end of FY27', '').replace(/ x /g, ' × '))}.` },
  ];
  const qs = ['Distributor exit costs', 'Founder and AI-team retention', 'Brightwater’s velocity in well-placed conventional stores', 'Whether 46% repeat purchase holds outside the natural channel', 'Can-line capacity and co-pack exit costs', 'The basis of management’s $260–300M forecast', 'The board’s definition of “functional and better-for-you”', 'Seller acceptance of staging', `Whether “5–6% annual growth” means the FY25–29 average (${fmt.pct1(FN.growth_definition.fy25_29_cagr)}) or the FY29 rate (${fmt.pct1(FN.growth_definition.fy29_yoy)})`];
  const cmm = [
    ['Seller insists on 100% now at $450M', 'Plan B: partnership with a right of first refusal'],
    ['Exit costs come in above headroom', 'Reprice or walk away'],
    ['Founder or AI team won’t sign retention', 'Walk away'],
    ['Wave-1 velocity under 0.7x', 'Stop the rollout at outlets that work; the formula cuts tranche 2'],
  ];
  let scale = '';
  for (let m = 0; m <= 24; m++) scale += `<i class="${[0, 3, 6, 12, 18, 24].includes(m) ? 'maj' : ''}" style="left:${(m / 24 * 100).toFixed(3)}%"></i>${[0, 3, 6, 12, 18, 24].includes(m) ? `<span style="left:${(m / 24 * 100).toFixed(3)}%">${m === 24 ? '24 mo' : m}</span>` : ''}`;
  return `
  ${head(6, 'Protect the brand, put the outlet data to work, and release capital only at gates.', `A 24-month plan from signing to buy-out. Each phase has a measurable gate, and the second payment is made only on audited FY27 revenue. ${A('Roadmap and gates are our proposals', 'roadmap')}.`)}
  <div class="card roadmap">
    <div class="section-label">24-month operating roadmap <em>scale only when verified</em></div>
    <div class="rm-gantt mt" aria-hidden="true">
      ${phases.map((p, i) => { const [a, z] = p.m.split('–').map(Number); return `<div class="rm-bar${i === 4 ? ' final' : ''}" style="left:${(a / 24 * 100).toFixed(3)}%;width:calc(${((z - a) / 24 * 100).toFixed(3)}% - 3px)"><b>${p.k}</b></div>`; }).join('')}
      <span class="rm-dia" title="Tranche 2"></span>
    </div>
    <div class="rm-scale" aria-hidden="true">${scale}</div>
    <div class="rm-row">
      ${phases.map((p, i) => `<div class="rm-band${i === 4 ? ' final' : ''}"><div class="ph"><b>${p.k}</b><span>months ${p.m}</span></div><p class="act">${p.a}</p><p class="gt">${p.g}</p></div>`).join('')}
    </div>
    <div class="diamond-wrap"><span class="diamond" aria-hidden="true"></span>Month 24: tranche 2 paid on audited FY27 revenue</div>
  </div>

  <div class="card mt-s not-again" style="margin-top:16px">
    <div class="yrs"><div class="yr"><b>2016</b><small>$40M brand</small></div><div class="yr"><b>2019</b><small>$65M brand</small></div></div>
    <div><h3>Why this is not 2016 or 2019 again</h3><p class="mt-s" style="font-size:14.5px">Both earlier acquisitions now sell less than in their acquisition year. This time we pay 40% only on proven FY27 revenue, the founder keeps 40% at risk until then, and the brand runs standalone under a written charter.</p></div>
  </div>

  <div class="exec-grid">
    <div class="card">
      <div class="section-label">Questions to answer before signing</div>
      <ul class="checklist">${qs.map((q) => `<li><span class="box" aria-hidden="true"></span><span>${q}</span></li>`).join('')}</ul>
    </div>
    <div class="card">
      <div class="section-label">What would change our mind</div>
      <div class="cmm">${cmm.map(([a, b]) => `<div><span class="if">${a}</span><span class="ar">${I.arrowR}</span><span class="then">${b}</span></div>`).join('')}</div>
      <div class="section-label mt-l">Three non-negotiable board gates</div>
      <div class="cmm">
        <div><span class="if"><b>Economics</b></span><span class="ar"></span><span>Verify ${A('75% eligible cost of goods', 'cogs')}, the ${A('16% delivery margin', 'synergy')} and exit charges; reprice if not supported.</span></div>
        <div><span class="if"><b>Contract / capital</b></span><span class="ar"></span><span>Seller accepts 60/40 terms, founder retention and controls; total cash stays within 2.5x.</span></div>
        <div><span class="if"><b>Board targets</b></span><span class="ar"></span><span>Close the mix gap: ${fmt.pct1(FN.board_tests_at_ask.mix.value)} vs 12% needs ~${fmt.money1(FN.mix_plan.qualifying_revenue_needed)} of qualifying revenue, from ${A(`Vital growing ${fmt.pct1(FN.mix_plan.vital_growth_needed)} a year`, 'vital')}.</span></div>
      </div>
    </div>
  </div>

  <div class="closing">
    <div><div class="k">The decision requested</div><h2>Approve a staged 60/40 offer: open at ${fmt.money0(FN.recommendation.opening_bid)}, walk away above ${fmt.money0(FN.recommendation.walk_away)}.</h2></div>
    <a class="btn" href="#screen-1">${I.arrowL}Back to the brief</a>
  </div>
  ${pager(6)}${footer()}`;
}

/* ================================================================ router */
const VIEWS = {
  1: { html: s1, charts: s1charts },
  2: { html: s2, charts: s2charts, bind: s2bind },
  3: { html: s3, bind: s3bind },
  4: { html: s4, bind: s4bind, charts: (r) => { if (shown) renderOutputs(shown, r, true); } },
  5: { html: s5, charts: s5charts, bind: s5bind },
  6: { html: s6 },
};
const rendered = new Set();
let current = 0;
const visited = new Set();

function show(n) {
  n = Math.max(1, Math.min(6, n | 0 || 1));
  const root = $(`#screen-${n}`);
  const prev = current;
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s === root));
  if (!rendered.has(n)) {
    root.innerHTML = VIEWS[n].html();
    rendered.add(n);
    VIEWS[n].bind?.(root);
  } else if (n === 4) {
    current = 4; update(root, { animate: false });
  }
  requestAnimationFrame(() => {
    VIEWS[n].charts?.(root);
    if (prev && prev !== n) { const h = $(`#h-${n}`); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  });
  if (prev !== n) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  current = n; visited.add(n);
  $$('#nav a').forEach((a, i) => {
    if (i + 1 === n) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    a.classList.toggle('done', visited.has(i + 1) && i + 1 !== n);
  });
  document.title = `${SCREENS[n - 1].nav} · Alderbrook Strategy Lab`;
}
const fromHash = () => { const m = location.hash.match(/screen-(\d)/); return m ? +m[1] : 1; };

let liveT;
function live(msg) { clearTimeout(liveT); liveT = setTimeout(() => { $('#live').textContent = msg; }, 500); }

/* ---- tooltip for assumptions and chart marks */
function tooltips() {
  const tip = $('#tip');
  let anchor = null;
  const place = (el, text, ev) => {
    tip.innerHTML = text; tip.classList.add('on');
    const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = ev && ev.clientX ? ev.clientX - tw / 2 : r.left + r.width / 2 - tw / 2;
    let y = r.top - th - 8;
    if (y < 64) y = r.bottom + 8;
    x = Math.max(8, Math.min(innerWidth - tw - 8, x));
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  };
  const showFor = (el, ev) => {
    if (el.classList.contains('asm')) place(el, `<b>Our assumption</b>${esc(el.dataset.src)}`, null);
    else if (el.dataset.tip) place(el, esc(el.dataset.tip), ev);
    anchor = el;
  };
  const hide = () => { tip.classList.remove('on'); anchor = null; };
  document.addEventListener('pointerover', (e) => { const el = e.target.closest('.asm,[data-tip]'); if (el && e.pointerType === 'mouse') showFor(el, e); });
  document.addEventListener('pointerout', (e) => { const el = e.target.closest('.asm,[data-tip]'); if (el && el === anchor) hide(); });
  document.addEventListener('focusin', (e) => { if (e.target.classList?.contains('asm')) showFor(e.target); });
  document.addEventListener('focusout', (e) => { if (e.target === anchor) hide(); });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.asm');
    if (el) { e.preventDefault(); if (anchor === el) hide(); else showFor(el); } else if (anchor && !e.target.closest('[data-tip]')) hide();
  }, true);
  addEventListener('scroll', hide, { passive: true });
}

function keys() {
  $('.skip')?.addEventListener('click', (e) => {
    e.preventDefault();
    const h = $(`#h-${current}`);
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    const typing = t.closest?.('input, select, textarea, [contenteditable]');
    if (typing) return;
    if (e.key === 'ArrowRight' && current < 6) { location.hash = `screen-${current + 1}`; e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && current > 1) { location.hash = `screen-${current - 1}`; e.preventDefault(); }
    else if ((e.key === 'r' || e.key === 'R') && current === 4) resetSim($('#screen-4'));
  });
}

async function boot() {
  const get = (p) => fetch(p).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });
  try {
    [FN, OW, OC] = await Promise.all([get('data/final_numbers.json'), get('data/outlet_waves.json'), get('data/outlet_clusters.json')]);
  } catch (err) {
    $('#main').innerHTML = `<div style="padding:60px 0"><h1 class="headline">The data files did not load.</h1><p class="subhead">Open this page from its web address (not as a local file), then refresh. Missing: ${esc(err.message)}</p></div>`;
    return;
  }
  $('#nav').innerHTML = SCREENS.map((s) => `<a href="#screen-${s.id}"><span class="n">${s.id}</span><span class="t">${s.nav}</span></a>`).join('');
  $('#bar-ask').innerHTML = `<b>60 / 40</b> · open <b>${fmt.money0(FN.recommendation.opening_bid)}</b> · walk above <b>${fmt.money0(FN.recommendation.walk_away)}</b>`;
  tooltips(); keys();
  if (!location.hash) history.replaceState(null, '', '#screen-1');
  addEventListener('hashchange', () => show(fromHash()));
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const r = $(`#screen-${current}`); VIEWS[current].charts?.(r); }, 120); });
  show(fromHash());
  // warm the outlet sample in the background once the brief is on screen
  setTimeout(() => { if (!OS) fetch('data/outlets_sample.json').then((r) => r.json()).then((d) => { OS = d; if (rendered.has(5)) s5scatter($('#screen-5')); }).catch(() => {}); }, 1500);
}
boot();
