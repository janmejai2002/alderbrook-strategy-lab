// Hand-drawn SVG chart helpers. Every chart is rendered at its container's real
// pixel width (no stretched viewBox), so text and hairlines stay crisp.
import { fmt } from './format.js';

const C = {
  ink: '#0E1116', ink2: '#454C59', ink3: '#5B6270', ink4: '#9AA0AA', lab: '#6A717E',
  rule: '#DDE0E5', rule2: '#C3C8D0', ground: '#F2F3F5', sheet: '#FFFFFF',
  board: '#0B3A8C', boardWash: '#EAF0FA', boardWash2: '#D6E2F5',
  pass: '#177245', fail: '#B42318', plan: '#9A5B00', planWash: '#FCF2E2', failWash: '#FBEAE8',
  w: ['#0B3A8C', '#4A78CF', '#A9BCE3'],
};
export const COLORS = C;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const svg = (w, h, body, label) => w < 40 ? '' :
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size || 11}" fill="${o.fill || C.ink3}" text-anchor="${o.anchor || 'start'}" font-weight="${o.weight || 450}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.data ? ` ${o.data}` : ''}>${esc(s)}</text>`;
const L = (x1, y1, x2, y2, stroke, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${o.w || 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cap ? ' stroke-linecap="round"' : ''}/>`;
const R = (x, y, w, h, fill, o = {}) =>
  `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${o.rx ?? 0}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}"` : ''}${o.data ? ` ${o.data}` : ''}/>`;
const scale = (d0, d1, r0, r1) => (v) => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
const hatch = (id, color) =>
  `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${C.sheet}"/><line x1="0" y1="0" x2="0" y2="6" stroke="${color}" stroke-width="2.2" opacity=".35"/></pattern>`;

/* ---------------------------------------------------------------- tile ruler
   A short engraved scale: ticks, the board's threshold, a marker at the value. */
export function tileRuler(w, o) {
  const { min, max, step, value, target, better, status, major = 5 } = o;
  const h = 40, pad = 2, x = scale(min, max, pad, w - pad);
  let b = '';
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i++) {
    const v = min + i * step, xx = x(v);
    b += L(xx, 14, xx, i % major === 0 ? 22 : 18, i % major === 0 ? C.ink4 : C.rule2);
  }
  // pass zone
  const zx0 = better === 'up' ? x(target) : pad, zx1 = better === 'up' ? w - pad : x(target);
  b += R(zx0, 10, zx1 - zx0, 3, status === 'fail' ? C.rule : (status === 'plan' ? C.planWash : '#CFE6D8'), { rx: 1.5 });
  b += R(better === 'up' ? pad : x(target), 10, better === 'up' ? x(target) - pad : w - pad - x(target), 3, C.rule, { rx: 1.5 });
  b += L(x(target), 4, x(target), 24, C.ink, { w: 1.5, dash: '2 2' });
  const vx = Math.max(pad + 4, Math.min(w - pad - 4, x(value)));
  const col = status === 'pass' ? C.pass : status === 'plan' ? C.plan : C.fail;
  b += `<path d="M${vx - 5} 2 L${vx + 5} 2 L${vx} 9 Z" fill="${col}"/>`;
  b += L(vx, 9, vx, 14, col, { w: 2 });
  if (o.tlabel) b += T(x(target), 36, o.tlabel, { anchor: 'middle', size: 10.5, fill: C.ink, weight: 640 });
  return svg(w, h, b, 'scale');
}

/* ---------------------------------------------------------------- price ruler (screen 1) */
export function priceRuler(w, { bid, walk, beats, npvBid, npvWalk }) {
  const h = 72, min = 375, max = 470, padL = 4, padR = 4;
  const x = scale(min, max, padL, w - padR);
  let b = `<defs>${hatch('hw', C.fail)}</defs>`;
  // walk-away zone
  b += R(x(walk), 24, x(max) - x(walk), 12, 'url(#hw)', { rx: 2 });
  // negotiating range
  b += R(x(bid), 24, x(walk) - x(bid), 12, C.boardWash2, { rx: 2 });
  b += R(x(bid), 24, x(beats) - x(bid), 12, C.board, { rx: 2 });
  for (let v = 380; v <= 470; v += 5) {
    const maj = v % 10 === 0;
    b += L(x(v), 40, x(v), maj ? 47 : 44, maj ? C.ink4 : C.rule2);
    if (v % 20 === 0) b += T(x(v), 60, `$${v}M`, { anchor: 'middle', size: 10.5, fill: C.lab });
  }
  b += L(x(bid), 16, x(bid), 40, C.board, { w: 2 });
  b += L(x(walk), 16, x(walk), 40, C.fail, { w: 2 });
  b += T(x(bid) - 1, 11, 'Open', { anchor: 'start', size: 11, fill: C.board, weight: 650, ls: '.02em' });
  b += T(x(walk) + 1, 11, 'Walk away', { anchor: 'end', size: 11, fill: C.fail, weight: 650, ls: '.02em' });
  b += L(x(beats), 22, x(beats), 38, '#fff', { w: 1.5 });
  return svg(w, h, b, `Price range: open at ${bid}, walk away above ${walk}`);
}

/* ---------------------------------------------------------------- waterfall (screen 2) */
export function waterfall(w, ob, target) {
  const h = 340, padL = 54, padR = 16, padT = 36, padB = 58;
  const yMin = 1600, yMax = 2320;
  const y = scale(yMin, yMax, h - padB, padT);
  const steps = [
    { k: 'FY25', lab: ['FY25', 'revenue'], v: ob.fy25, type: 'total' },
    { k: 'juice', lab: ['Juice', '−3% a year'], v: ob.juice, type: 'delta' },
    { k: 'tea', lab: ['Iced tea', 'flat'], v: ob.iced_tea, type: 'delta' },
    { k: 'spark', lab: ['Sparkling', '+7% a year'], v: ob.sparkling, type: 'delta' },
    { k: 'hyd', lab: ['Hydration', '& other'], v: ob.hydration_other, type: 'delta' },
    { k: 'FY29', lab: ['FY29', 'organic'], v: ob.fy29_organic, type: 'total' },
    { k: 'gap', lab: ['Board', 'ambition'], v: 0, type: 'gap' },
  ];
  const n = steps.length, slot = (w - padL - padR) / n, bw = Math.min(64, slot * 0.58);
  const cx = (i) => padL + slot * i + slot / 2;
  const t5 = ob.fy29_at_5pct, t6 = ob.fy29_at_6pct, tgt = target === 6 ? t6 : t5;
  const gap = target === 6 ? ob.gap_6pct : ob.gap_5pct;
  let b = `<defs>${hatch('hb', C.board)}</defs>`;
  // grid
  for (let v = 1600; v <= 2300; v += 100) {
    b += L(padL, y(v), w - padR, y(v), v === 1600 ? C.rule2 : C.rule, { dash: v === 1600 ? '' : '' });
    b += T(padL - 8, y(v) + 4, fmt.int(v), { anchor: 'end', size: 10.5, fill: C.lab });
  }
  // axis break mark: the scale does not start at zero
  b += `<path d="M${padL - 5} ${y(1600) - 3} l5 -4 l5 4 l5 -4" fill="none" stroke="${C.ink3}" stroke-width="1.2" transform="translate(-2 ${10})"/>`;
  // board ambition band (5%–6%) across the plot
  b += R(padL, y(t6), w - padR - padL, y(t5) - y(t6), C.boardWash, {});
  b += L(padL, y(t5), w - padR, y(t5), C.board, { dash: '4 3', w: 1 });
  b += L(padL, y(t6), w - padR, y(t6), C.board, { dash: '4 3', w: 1 });
  b += T(padL + 6, y(t6) - 6, `Board ambition: 5% a year ${fmt.money1(t5)} · 6% a year ${fmt.money1(t6)}`, { size: 11, fill: C.board, weight: 600 });

  let run = 0;
  steps.forEach((s, i) => {
    const x0 = cx(i) - bw / 2;
    if (s.type === 'total') {
      run = s.v;
      b += R(x0, y(s.v), bw, y(yMin) - y(s.v), i === 0 ? C.ink3 : C.ink2, { rx: 3, data: `data-tip="${esc(s.lab.join(' '))}: ${fmt.money1(s.v)}"` });
      b += T(cx(i), y(s.v) - 8, fmt.money1(s.v), { anchor: 'middle', size: 12, fill: C.ink, weight: 650 });
    } else if (s.type === 'delta') {
      const a = run, z = run + s.v;
      const top = Math.max(a, z), bot = Math.min(a, z);
      const col = s.v < 0 ? C.fail : s.v > 0 ? C.pass : C.ink4;
      if (s.v === 0) b += L(x0, y(a), x0 + bw, y(a), C.ink3, { w: 2 });
      else b += R(x0, y(top), bw, Math.max(2, y(bot) - y(top)), col, { rx: 3, data: `data-tip="${esc(s.lab.join(' '))}: ${fmt.signedMoney1(s.v)}"` });
      b += T(cx(i), y(top) - 8, fmt.signedMoney1(s.v), { anchor: 'middle', size: 12, fill: C.ink, weight: 600 });
      // connector
      run = z;
    }
    if (i < n - 2) b += L(cx(i) + bw / 2, y(run), cx(i + 1) - bw / 2, y(run), C.ink4, { dash: '2 2' });
    b += T(cx(i), h - padB + 18, s.lab[0], { anchor: 'middle', size: 11.5, fill: s.type === 'gap' ? C.board : C.ink2, weight: 560 });
    b += T(cx(i), h - padB + 33, s.lab[1], { anchor: 'middle', size: 10.5, fill: C.lab });
  });
  // the gap bracket
  const gi = n - 1, gx = cx(gi);
  b += R(gx - bw / 2, y(tgt), bw, y(ob.fy29_organic) - y(tgt), 'url(#hb)', { rx: 3, stroke: C.board });
  b += L(cx(5) + bw / 2, y(ob.fy29_organic), gx - bw / 2, y(ob.fy29_organic), C.ink4, { dash: '2 2' });
  b += L(gx + bw / 2 + 6, y(tgt), gx + bw / 2 + 6, y(ob.fy29_organic), C.board, { w: 1.5 });
  b += L(gx + bw / 2 + 2, y(tgt), gx + bw / 2 + 6, y(tgt), C.board, { w: 1.5 });
  b += L(gx + bw / 2 + 2, y(ob.fy29_organic), gx + bw / 2 + 6, y(ob.fy29_organic), C.board, { w: 1.5 });
  const my = (y(tgt) + y(ob.fy29_organic)) / 2;
  b += `<g class="gap-label">${R(gx - 52, my - 20, 104, 38, C.board, { rx: 5 })}${T(gx, my - 5, 'Short by', { anchor: 'middle', size: 10.5, fill: '#C9D8F4', weight: 560 })}${T(gx, my + 11, fmt.money1(gap), { anchor: 'middle', size: 14, fill: '#fff', weight: 700 })}</g>`;
  return svg(w, h, b, `Organic bridge: FY25 ${ob.fy25} to FY29 ${ob.fy29_organic}; short of the ${target}% ambition by ${gap}`);
}

/* ---------------------------------------------------------------- leverage gauge (screen 4 hero) */
export function gauge(w, { value, rec, board = 2.5, covenant = 3.5 }) {
  const h = 92, padL = 2, padR = 2, max = 4;
  const x = scale(0, max, padL, w - padR);
  const vx = x(Math.min(max, value));
  const col = value <= board ? C.pass : value <= covenant ? C.plan : C.fail;
  let b = `<defs>${hatch('hg', C.plan)}${hatch('hr', C.fail)}</defs>`;
  const ty = 34, th = 18;
  b += R(x(0), ty, x(board) - x(0), th, C.ground, { rx: 3 });
  b += R(x(board), ty, x(covenant) - x(board), th, 'url(#hg)', {});
  b += R(x(covenant), ty, x(max) - x(covenant), th, 'url(#hr)', { rx: 0 });
  // value bar
  b += `<rect class="g-fill" x="${x(0)}" y="${ty + 4}" width="${vx - x(0)}" height="${th - 8}" rx="2" fill="${col}"/>`;
  // ticks
  for (let v = 0; v <= max * 10 + 0.001; v++) {
    const t = v / 10, maj = v % 5 === 0;
    b += L(x(t), ty + th + 3, x(t), ty + th + (maj ? 10 : 6), maj ? C.ink4 : C.rule2);
    if (v % (w < 520 ? 10 : 5) === 0) b += T(x(t), ty + th + 23, `${(t).toFixed(1)}x`, { anchor: v === 0 ? 'start' : v === 40 ? 'end' : 'middle', size: 10.5, fill: C.lab });
  }
  // threshold marks
  b += L(x(board), ty - 10, x(board), ty + th + 2, C.ink, { w: 1.5, dash: '3 2' });
  b += T(x(board) - 6, ty - 14, 'Board limit 2.5x', { anchor: 'end', size: 11, fill: C.ink, weight: 620 });
  b += L(x(covenant), ty - 10, x(covenant), ty + th + 2, C.ink, { w: 2 });
  b += T(x(max), ty - 14, 'Covenant 3.5x', { anchor: 'end', size: 11, fill: C.ink, weight: 620 });
  // recommended ghost
  if (rec != null && Math.abs(rec - value) > 0.004) {
    b += L(x(rec), ty - 2, x(rec), ty + th + 2, C.board, { w: 2 });
    b += `<circle cx="${x(rec)}" cy="${ty - 4}" r="3" fill="${C.board}"/>`;
  }
  // needle
  b += `<g class="g-needle" style="transform:translateX(${vx}px)"><path d="M-7 ${ty - 12} L7 ${ty - 12} L0 ${ty - 3} Z" fill="${col}"/>${L(0, ty - 3, 0, ty + th, col, { w: 2.5 })}</g>`;
  return svg(w, h, b, `Leverage at close ${value.toFixed(2)}x against the 2.5x board limit and 3.5x covenant`);
}

/* ---------------------------------------------------------------- leverage path (screen 4) */
export function levPath(w, { path, rec }) {
  const h = 170, padL = 34, padR = 44, padT = 14, padB = 26;
  const yMax = Math.max(3.5, Math.ceil(Math.max(...path, ...(rec || [])) * 2) / 2);
  const x = scale(0, 4, padL, w - padR), y = scale(0, yMax, h - padB, padT);
  let b = '';
  for (let v = 0; v <= yMax + 1e-9; v += 0.5) {
    b += L(padL, y(v), w - padR, y(v), v === 0 ? C.rule2 : C.rule);
    if (v % 1 === 0) b += T(padL - 6, y(v) + 4, `${v.toFixed(1)}x`, { anchor: 'end', size: 10, fill: C.lab });
  }
  b += R(padL, y(yMax), w - padR - padL, y(2.5) - y(yMax), 'rgba(180,35,24,.045)');
  b += L(padL, y(2.5), w - padR, y(2.5), C.ink, { dash: '3 2', w: 1.2 });
  b += T(w - padR + 4, y(2.5) + 4, '2.5x', { size: 10.5, fill: C.ink, weight: 640 });
  ['FY25', 'FY26', 'FY27', 'FY28', 'FY29'].forEach((l, i) => { b += T(x(i), h - 8, l, { anchor: 'middle', size: 10.5, fill: C.ink3 }); });
  // tranche 2 marker
  b += L(x(2), padT, x(2), h - padB, C.rule2, { dash: '2 3' });
  b += T(x(2) + 4, padT + 8, 'Tranche 2', { size: 10, fill: C.ink3 });
  const line = (p) => p.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  if (rec) b += `<path d="${line(rec)}" fill="none" stroke="${C.board}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".55"/>`;
  b += `<path d="${line(path)}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  path.forEach((v, i) => {
    const col = v > 2.5 ? C.fail : C.ink;
    b += `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${col}" stroke="#fff" stroke-width="2" data-tip="${['FY25 (close)', 'FY26', 'FY27', 'FY28', 'FY29'][i]}: ${v.toFixed(2)}x"/>`;
  });
  const pk = path.indexOf(Math.max(...path));
  b += T(x(pk) + (pk === 0 ? 8 : 0), y(path[pk]) - 10, `${path[pk].toFixed(2)}x peak`, { anchor: pk === 0 ? 'start' : 'middle', size: 11, fill: path[pk] > 2.5 ? C.fail : C.ink, weight: 650 });
  return svg(w, h, b, `Leverage path FY25 to FY29, peak ${Math.max(...path).toFixed(2)}x`);
}

/* ---------------------------------------------------------------- NPV vs price (screen 4) */
export function npvPrice(w, { curve, price, npv, partnership, beats }) {
  const h = 170, padL = 40, padR = 12, padT = 14, padB = 26;
  const xs = curve.map((d) => d.p), ys = curve.map((d) => d.v);
  const lo = Math.min(-20, ...ys, partnership), hi = Math.max(80, ...ys, partnership);
  const yMin = Math.floor(lo / 20) * 20, yMax = Math.ceil(hi / 20) * 20;
  const x = scale(xs[0], xs[xs.length - 1], padL, w - padR), y = scale(yMin, yMax, h - padB, padT);
  let b = '';
  const stepY = (yMax - yMin) > 200 ? 50 : 20;
  for (let v = Math.ceil(yMin / stepY) * stepY; v <= yMax; v += stepY) {
    b += L(padL, y(v), w - padR, y(v), v === 0 ? C.ink3 : C.rule, { w: v === 0 ? 1 : 1 });
    b += T(padL - 6, y(v) + 4, v === 0 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v)}`, { anchor: 'end', size: 10, fill: C.lab });
  }
  [380, 400, 425, 450].forEach((p, i, a) => { b += T(x(p), h - 8, `$${p}M`, { anchor: i === 0 ? 'start' : i === a.length - 1 ? 'end' : 'middle', size: 10, fill: C.ink3 }); });
  b += L(padL, y(partnership), w - padR, y(partnership), C.ink3, { dash: '4 3' });
  b += T(w - padR, y(partnership) - 5, `Partnership ${fmt.signedMoney1(partnership)}`, { anchor: 'end', size: 10.5, fill: C.ink2, weight: 560 });
  const d = curve.map((c, i) => `${i ? 'L' : 'M'}${x(c.p).toFixed(1)} ${y(c.v).toFixed(1)}`).join(' ');
  b += `<path d="${d}" fill="none" stroke="${C.board}" stroke-width="2"/>`;
  if (beats != null) {
    b += L(x(beats), y(partnership), x(beats), h - padB, C.board, { dash: '2 2' });
  }
  const col = npv >= 0 ? C.pass : C.fail;
  b += L(x(price), padT, x(price), h - padB, C.rule2);
  b += `<circle cx="${x(price)}" cy="${y(npv)}" r="5.5" fill="${col}" stroke="#fff" stroke-width="2"/>`;
  const right = x(price) > w * 0.7;
  b += T(x(price) + (right ? -9 : 9), y(npv) + (npv > partnership ? -8 : 14), fmt.signedMoney1(npv), { anchor: right ? 'end' : 'start', size: 12, fill: col, weight: 700 });
  return svg(w, h, b, `NPV across headline price; at ${price} NPV is ${npv.toFixed(1)}`);
}

/* ---------------------------------------------------------------- velocity scale (screen 5 waves) */
export function velScale(w, { v, color }) {
  const h = 30, max = 1.3, x = scale(0, max, 1, w - 1);
  let b = '';
  b += R(x(0), 8, x(max) - x(0), 6, C.ground, { rx: 3 });
  b += R(x(0), 8, x(Math.min(v, max)) - x(0), 6, color, { rx: 3 });
  b += L(x(0.7), 3, x(0.7), 19, C.fail, { w: 1.5, dash: '2 2' });
  b += L(x(1.0), 3, x(1.0), 19, C.pass, { w: 1.5, dash: '2 2' });
  b += T(x(0.7), 29, '0.7x stop', { anchor: 'middle', size: 10, fill: C.fail, weight: 560 });
  b += T(x(1.0), 29, '1.0x scale', { anchor: 'middle', size: 10, fill: C.pass, weight: 560 });
  return svg(w, h, b, `Expected velocity ${v}x`);
}

/* ---------------------------------------------------------------- scatter (screen 5) */
export function scatter(w, outlets, { highlight } = {}) {
  const narrow = w < 500;
  const h = Math.round(narrow ? w * 0.95 : w / 1.45), padL = 52, padR = 14, padT = 14, padB = 40;
  const xMax = 1, yMin = 0.2, yMax = 1.6;
  const x = scale(0, xMax, padL, w - padR), y = scale(yMin, yMax, h - padB, padT);
  let b = '';
  for (let v = 0.2; v <= yMax + 1e-9; v += 0.2) {
    b += L(padL, y(v), w - padR, y(v), C.rule);
    b += T(padL - 6, y(v) + 4, `${v.toFixed(1)}x`, { anchor: 'end', size: 10, fill: C.lab });
  }
  for (let v = 0; v <= 1 + 1e-9; v += 0.2) b += T(x(v), h - padB + 16, v.toFixed(1), { anchor: 'middle', size: 10, fill: C.lab });
  b += T((padL + w - padR) / 2, h - 6, narrow ? 'Natural-shopper index' : 'Natural-shopper index (share of shoppers who buy natural / specialty)', { anchor: 'middle', size: 10.5, fill: C.ink3 });
  // points: wave 3 first so wave 1 sits on top
  const r = w < 420 ? 1.6 : 2.1;
  let pts = '';
  for (const wave of [3, 2, 1]) {
    let d = '';
    for (const o of outlets) {
      if (o.wave !== wave) continue;
      if (highlight && o.cluster !== highlight) continue;
      d += `M${x(o.natural_shopper_index).toFixed(1)} ${y(o.expected_bw_velocity).toFixed(1)}m-${r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 -${2 * r} 0`;
    }
    pts += `<path d="${d}" fill="${C.w[wave - 1]}" opacity="${highlight ? 0.9 : wave === 1 ? 0.75 : 0.6}"/>`;
  }
  if (highlight) {
    let d = '';
    for (const o of outlets) if (o.cluster !== highlight) d += `M${x(o.natural_shopper_index).toFixed(1)} ${y(o.expected_bw_velocity).toFixed(1)}h0.01`;
    b += `<path d="${d}" stroke="${C.rule2}" stroke-width="${r * 1.6}" stroke-linecap="round" opacity=".6"/>`;
  }
  b += pts;
  b += L(padL, y(1.0), w - padR, y(1.0), C.pass, { w: 1.5, dash: '5 3' });
  b += L(padL, y(0.7), w - padR, y(0.7), C.fail, { w: 1.5, dash: '5 3' });
  const lab = (yy, s, col) => `${R(w - padR - 112, yy - 17, 112, 16, 'rgba(255,255,255,.92)', { rx: 3 })}${T(w - padR - 4, yy - 5, s, { anchor: 'end', size: 10.5, fill: col, weight: 650 })}`;
  b += lab(y(1.0), 'Scale line 1.0x', C.pass);
  b += lab(y(0.7), 'Stop line 0.7x', C.fail);
  b += `<text x="12" y="${(padT + h - padB) / 2}" font-size="10.5" fill="${C.ink3}" text-anchor="middle" transform="rotate(-90 12 ${(padT + h - padB) / 2})">${narrow ? 'Expected velocity' : 'Expected Brightwater velocity (x category)'}</text>`;
  return svg(w, h, b, 'Scatter of 3,000 synthetic outlets: natural-shopper index against expected velocity, coloured by wave');
}
