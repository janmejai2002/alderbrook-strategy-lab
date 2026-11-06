// Number formatting. Copy rules: one decimal for percentages, two for leverage,
// $M with one decimal for NPV. A true minus sign (−) for negatives.
const MINUS = '−';
const sign = (v) => (v < 0 ? MINUS : '+');
const grp = (v, d) => Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
// Round half away from zero at d decimals, avoiding "-0.0".
const rnd = (v, d) => { const f = 10 ** d; const r = Math.round(Math.abs(v) * f + 1e-9) / f; return (v < 0 && r !== 0) ? -r : r; };

export const fmt = {
  int: (v) => grp(v, 0),
  pct1: (v) => `${(rnd(v * 100, 1)).toFixed(1)}%`,
  pct0: (v) => `${Math.round(v * 100)}%`,
  lev: (v) => `${rnd(v, 2).toFixed(2)}x`,
  money0: (v) => `${v < 0 ? MINUS : ''}$${grp(rnd(v, 0), 0)}M`,
  money1: (v) => `${v < 0 ? MINUS : ''}$${grp(rnd(v, 1), 1)}M`,
  money2: (v) => `${v < 0 ? MINUS : ''}$${grp(rnd(v, 2), 2)}M`,
  signedMoney1: (v) => { const r = rnd(v, 1); return `${r === 0 ? '+' : sign(r)}$${grp(r, 1)}M`; },
  signed1: (v) => { const r = rnd(v, 1); return `${r === 0 ? '+' : sign(r)}${grp(r, 1)}`; },
  mult: (v) => `${Number.isInteger(v) ? v : v.toFixed(1)}x`,
  minus: MINUS,
};
