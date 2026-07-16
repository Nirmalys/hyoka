export const CHART = { width: 720, height: 280, padX: 40, padTop: 10, padBottom: 24 };

const PLOT_W = CHART.width - CHART.padX - 10;
const PLOT_H = CHART.height - CHART.padTop - CHART.padBottom;

export function buildSmoothPath(values, maxY) {
  const n = values.length;
  if (n === 0) return "";
  const safeMax = maxY > 0 ? maxY : 1;
  const pts = values.map((v, i) => [
    CHART.padX + (n > 1 ? (i / (n - 1)) * PLOT_W : 0),
    CHART.padTop + PLOT_H - (v / safeMax) * PLOT_H,
  ]);
  if (pts.length < 2) return `M ${pts[0][0]},${pts[0][1]}`;
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function shouldShowChartLabel(index, total) {
  if (total <= 14) return true;
  if (total <= 30) return index % 2 === 0 || index === total - 1;
  return index % 10 === 0 || index === total - 1;
}

export const CHART_PLOT_W = PLOT_W;
export const CHART_PLOT_H = PLOT_H;
