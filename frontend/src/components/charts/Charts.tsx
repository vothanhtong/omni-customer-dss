/**
 * Bộ biểu đồ SVG nhẹ (không phụ thuộc thư viện) cho Dashboard BI.
 * Màu sắc theo vai trò (CSS variables trong .viz-root, xem index.css) — tự đổi theo theme sáng/tối.
 * Mọi biểu đồ: tooltip khi hover, nhãn trực tiếp chọn lọc, và bảng số liệu (<details>) cho truy cập.
 */
import React, { useState } from 'react';

export const SERIES_VARS = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5'];
export const seriesColor = (i: number) => `var(${SERIES_VARS[i % SERIES_VARS.length]})`;

export const fmtInt = (v: number) => v.toLocaleString('vi-VN');
export const fmtPct = (v: number | null | undefined, d = 1) =>
  v === null || v === undefined ? '—' : `${(v * 100).toFixed(d)}%`;
export const fmtVnd = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(2)} tỷ` : v >= 1e6 ? `${(v / 1e6).toFixed(1)} tr` : fmtInt(Math.round(v));

/* ------------------------------------------------------------------ Tooltip */
interface TipState { x: number; y: number; lines: React.ReactNode[] }

const useTooltip = () => {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (e: React.MouseEvent, lines: React.ReactNode[]) => {
    const box = (e.currentTarget as Element).closest('.viz-root')!.getBoundingClientRect();
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, lines });
  };
  const node = tip ? (
    <div className="viz-tooltip" style={{ left: tip.x + 12, top: tip.y + 12 }}>
      {tip.lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  ) : null;
  return { show, hide: () => setTip(null), node };
};

/* -------------------------------------------------------------- Data table */
export const DataTable: React.FC<{ headers: string[]; rows: (string | number)[][] }> = ({ headers, rows }) => (
  <details className="viz-table">
    <summary>Bảng số liệu</summary>
    <table>
      <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  </details>
);

/* ------------------------------------------------------- Horizontal bars */
export interface HBarItem {
  label: string;
  value: number;
  valueLabel: string;
  color?: string;          // mặc định series-1 (một chuỗi dữ liệu)
  tooltip: React.ReactNode[];
}

export const HBarChart: React.FC<{ items: HBarItem[]; max?: number; labelWidth?: number }> = ({ items, max, labelWidth = 150 }) => {
  const { show, hide, node } = useTooltip();
  const top = max ?? Math.max(...items.map((i) => i.value), 1e-9);
  const rowH = 30, barH = 14, valueW = 104, W = 560;
  const plotW = W - labelWidth - valueW;
  return (
    <div className="viz-root viz-rel">
      <svg viewBox={`0 0 ${W} ${items.length * rowH}`} width="100%" role="img">
        {items.map((it, i) => {
          const y = i * rowH;
          const w = Math.max((it.value / top) * plotW, it.value > 0 ? 2 : 0);
          return (
            <g key={it.label}>
              <text x={labelWidth - 10} y={y + rowH / 2} className="viz-label" textAnchor="end" dominantBaseline="middle">{it.label}</text>
              <rect x={labelWidth} y={y + (rowH - barH) / 2} width={plotW} height={barH} className="viz-track" rx={4} />
              <rect x={labelWidth} y={y + (rowH - barH) / 2} width={w} height={barH} rx={4} fill={it.color ?? seriesColor(0)} />
              <text x={labelWidth + plotW + 8} y={y + rowH / 2} className="viz-value" dominantBaseline="middle">{it.valueLabel}</text>
              {/* vùng hover lớn hơn mark */}
              <rect x={0} y={y} width={W} height={rowH} fill="transparent"
                onMouseMove={(e) => show(e, it.tooltip)} onMouseLeave={hide} />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
};

/* ------------------------------------------------- Stacked column chart */
export const StackedColumnChart: React.FC<{
  categories: string[];
  series: string[];
  values: number[][];          // values[categoryIdx][seriesIdx]
}> = ({ categories, series, values }) => {
  const { show, hide, node } = useTooltip();
  const W = 560, H = 230, padL = 52, padB = 26, padT = 10;
  const plotH = H - padB - padT, plotW = W - padL - 8;
  const totals = values.map((r) => r.reduce((a, b) => a + b, 0));
  const top = niceMax(Math.max(...totals, 1));
  const slot = plotW / categories.length, barW = Math.min(44, slot * 0.6);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  return (
    <div className="viz-root viz-rel">
      <Legend items={series.map((s, i) => ({ label: s, color: seriesColor(i) }))} />
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} className="viz-grid" />
            <text x={padL - 8} y={y(t)} className="viz-axis" textAnchor="end" dominantBaseline="middle">{compact(t)}</text>
          </g>
        ))}
        {categories.map((c, ci) => {
          const x = padL + ci * slot + (slot - barW) / 2;
          let acc = 0;
          const segs = values[ci].map((v, si) => {
            const y0 = y(acc), y1 = y(acc + v);
            acc += v;
            const h = y0 - y1;
            if (h <= 0) return null;
            // khe 2px giữa các đoạn (trừ khi quá mỏng)
            const gap = h > 3 ? 2 : 0;
            return <rect key={si} x={x} y={y1} width={barW} height={Math.max(h - gap, 0.8)} fill={seriesColor(si)} />;
          });
          return (
            <g key={c}>
              {segs}
              <text x={x + barW / 2} y={H - 8} className="viz-axis" textAnchor="middle">{c}</text>
              <text x={x + barW / 2} y={y(totals[ci]) - 6} className="viz-value" textAnchor="middle">{compact(totals[ci])}</text>
              <rect x={padL + ci * slot} y={padT} width={slot} height={plotH} fill="transparent"
                onMouseMove={(e) => show(e, [
                  <strong>{c} · {fmtInt(totals[ci])} đơn</strong>,
                  ...series.map((s, si) => <span><i className="viz-swatch" style={{ background: seriesColor(si) }} />{s}: {fmtInt(values[ci][si])}</span>),
                ])}
                onMouseLeave={hide} />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
};

/* ------------------------------------------------------------ Line chart */
export const LineChart: React.FC<{
  points: { x: string; y: number; extra: string }[];
  yLabel: (v: number) => string;
  yMin?: number;
  yMax?: number;
}> = ({ points, yLabel, yMin = 0, yMax = 1 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 220, padL = 52, padB = 26, padT = 14, padR = 16;
  const plotW = W - padL - padR, plotH = H - padB - padT;
  const x = (i: number) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.y)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - r.left) / r.width) * plotW;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round((rel / plotW) * (points.length - 1)))));
  };
  const last = points.length - 1;
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="viz-root viz-rel">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="viz-grid" />
            <text x={padL - 8} y={y(t)} className="viz-axis" textAnchor="end" dominantBaseline="middle">{yLabel(t)}</text>
          </g>
        ))}
        {points.map((p, i) => (i % Math.ceil(points.length / 6) === 0 || i === last) && (
          <text key={p.x} x={x(i)} y={H - 8} className="viz-axis" textAnchor="middle">{p.x.slice(5)}</text>
        ))}
        <path d={d} fill="none" stroke={seriesColor(0)} strokeWidth={2} strokeLinejoin="round" />
        <circle cx={x(last)} cy={y(points[last].y)} r={4} fill={seriesColor(0)} className="viz-ring" />
        <text x={x(last) - 6} y={y(points[last].y) - 10} className="viz-value" textAnchor="end">{yLabel(points[last].y)}</text>
        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} className="viz-crosshair" />
            <circle cx={x(hover)} cy={y(h.y)} r={4} fill={seriesColor(0)} className="viz-ring" />
          </g>
        )}
        <rect x={padL} y={padT} width={plotW} height={plotH} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {h && hover !== null && (
        <div className="viz-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: 8, transform: hover > last / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}>
          <div><strong>Mốc {h.x}</strong></div>
          <div>Tỷ lệ churn: {yLabel(h.y)}</div>
          <div>{h.extra}</div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- Legend */
export const Legend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
  <div className="viz-root viz-legend">
    {items.map((i) => (
      <span key={i.label}><i className="viz-swatch" style={{ background: i.color }} />{i.label}</span>
    ))}
  </div>
);

/* --------------------------------------------------------------- helpers */
function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}
function compact(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `${Math.round(v)}`;
}
