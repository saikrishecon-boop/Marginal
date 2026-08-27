/**
 * Declarative geometry for Cambridge 9708 economics diagrams.
 *
 * Every diagram is described in a 0-100 x 0-100 space (y measured upwards, as
 * on a real graph) and rendered to SVG by <EconomicsDiagram />. Keeping the
 * geometry as data means the same diagram can be shown in the diagram library,
 * inside a generated MCQ, or inside a generated essay.
 */

export type Pt = [number, number];

export type CurveTone =
  | "demand"
  | "supply"
  | "cost"
  | "revenue"
  | "neutral"
  | "accent"
  | "warn";

export type Curve = {
  points: Pt[];
  label?: string;
  tone?: CurveTone;
  dashed?: boolean;
  /** Where the label sits relative to the curve end. */
  labelAt?: Pt;
  arrow?: boolean;
};

export type Marker = {
  at: Pt;
  label?: string;
  /** Drop dotted guide lines to the axes. */
  guides?: "x" | "y" | "both" | "none";
  labelOffset?: Pt;
};

export type Shade = {
  points: Pt[];
  label?: string;
  tone?: "primary" | "warn" | "muted" | "danger";
  labelAt?: Pt;
};

export type Arrow = { from: Pt; to: Pt; label?: string };

export type Note = { at: Pt; text: string; align?: "start" | "middle" | "end" };

export type AxisTick = { at: number; label: string };

export type DiagramSpec = {
  xLabel: string;
  yLabel: string;
  curves: Curve[];
  markers?: Marker[];
  shades?: Shade[];
  arrows?: Arrow[];
  notes?: Note[];
  xTicks?: AxisTick[];
  yTicks?: AxisTick[];
};

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

export const line = (from: Pt, to: Pt): Pt[] => [from, to];

/** Standard downward-sloping demand line. */
export const demandLine = (shift = 0): Pt[] => [
  [8 + shift, 88],
  [88 + shift, 10],
];

/** Standard upward-sloping supply line. */
export const supplyLine = (shift = 0): Pt[] => [
  [8 + shift, 10],
  [88 + shift, 88],
];

export const horizontal = (y: number, from = 8, to = 92): Pt[] => [
  [from, y],
  [to, y],
];

export const vertical = (x: number, from = 8, to = 92): Pt[] => [
  [x, from],
  [x, to],
];

/** U-shaped average-cost style curve. */
export const uShape = (minX: number, minY: number, spread = 34, height = 46): Pt[] => {
  const points: Pt[] = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = -1 + (2 * i) / 12;
    const x = minX + t * spread;
    const y = minY + height * t * t;
    points.push([x, y]);
  }
  return points;
};

/** Concave-to-origin production possibility curve. */
export const ppcCurve = (scale = 1): Pt[] => {
  const points: Pt[] = [];
  const r = 76 * scale;
  for (let i = 0; i <= 14; i += 1) {
    const t = (Math.PI / 2) * (i / 14);
    points.push([10 + r * Math.sin(t), 10 + r * Math.cos(t)]);
  }
  return points;
};

/** Convex decreasing curve (Phillips curve, indifference-style shapes). */
export const convexFalling = (offset = 0): Pt[] => {
  const points: Pt[] = [];
  for (let i = 0; i <= 14; i += 1) {
    const x = 14 + (72 * i) / 14;
    const y = 12 + offset + 900 / (x + 4);
    points.push([x, Math.min(92, y)]);
  }
  return points;
};

/** Concave rising curve (Lorenz curve style). */
export const lorenz = (bow = 1): Pt[] => {
  const points: Pt[] = [];
  for (let i = 0; i <= 14; i += 1) {
    const t = i / 14;
    points.push([10 + 80 * t, 10 + 80 * Math.pow(t, 1 + 1.6 * bow)]);
  }
  return points;
};

/** Smooth S-shaped business cycle wave around a rising trend. */
export const businessCycle = (): Pt[] => {
  const points: Pt[] = [];
  for (let i = 0; i <= 40; i += 1) {
    const x = 10 + (80 * i) / 40;
    const trend = 25 + 0.55 * (x - 10);
    points.push([x, trend + 13 * Math.sin(((x - 10) / 80) * Math.PI * 3.2)]);
  }
  return points;
};

/* ------------------------------------------------------------------ */
/* Shared label glossary — no label is ever left unexplained           */
/* ------------------------------------------------------------------ */

export const LABEL_GLOSSARY: Record<string, string> = {
  P: "Price — the money price per unit, always on the vertical axis of a micro market diagram. Cambridge expects the axis to be labelled 'Price' (or 'Price (\u0024)'), never just 'P'.",
  Q: "Quantity — the quantity traded per time period, on the horizontal axis. It is a flow, so 'per week/per year' is implied.",
  D: "Demand — the quantity consumers are willing and able to buy at each price, ceteris paribus. It slopes downwards because of the income and substitution effects and diminishing marginal utility.",
  D1: "The original demand curve, before the change described in the question.",
  D2: "The new demand curve after the shift. A rightward shift is an increase in demand at every price; a leftward shift is a decrease.",
  S: "Supply — the quantity producers are willing and able to sell at each price, ceteris paribus. It slopes upwards because higher prices cover rising marginal costs and raise profitability.",
  S1: "The original supply curve, before the change described in the question.",
  S2: "The new supply curve after the shift. Rightward = increase in supply (lower costs, better technology, more firms); leftward = decrease.",
  "S+tax":
    "Supply after the indirect tax. The tax is a cost of production, so supply shifts vertically upwards by the amount of the tax per unit.",
  "S+subsidy":
    "Supply after the subsidy. The subsidy lowers marginal cost, so supply shifts vertically downwards by the amount of the subsidy per unit.",
  E: "Equilibrium — the point where demand equals supply, so there is no excess demand or excess supply and there is no tendency for price to change.",
  E1: "The original equilibrium, giving the original equilibrium price and quantity.",
  E2: "The new equilibrium after the shift, giving the new price and quantity.",
  Pe: "Equilibrium price — the market-clearing price, read off the vertical axis at the intersection of demand and supply.",
  Qe: "Equilibrium quantity — the market-clearing quantity, read off the horizontal axis at the intersection of demand and supply.",
  P1: "The original price before the change.",
  P2: "The new price after the change.",
  Q1: "The original quantity before the change.",
  Q2: "The new quantity after the change.",
  Pmax: "Maximum price (price ceiling) — a legal maximum set below equilibrium, so it is binding and creates excess demand (a shortage).",
  Pmin: "Minimum price (price floor) — a legal minimum set above equilibrium, so it is binding and creates excess supply (a surplus).",
  CS: "Consumer surplus — the area under the demand curve and above the price paid. It measures the welfare consumers gain because they pay less than the maximum they were willing to pay.",
  PS: "Producer surplus — the area above the supply curve and below the price received. It measures the welfare producers gain because they receive more than their minimum acceptable price.",
  DWL: "Deadweight welfare loss — the loss of total surplus caused when output is not at the allocative optimum. It is the triangle between MSB and MSC over the units mis-allocated.",
  MPC: "Marginal private cost — the extra cost to the producer of making one more unit. It ignores costs imposed on third parties.",
  MSC: "Marginal social cost — MPC plus the marginal external cost. It is the full cost to society of one more unit.",
  MPB: "Marginal private benefit — the extra benefit the consumer receives from one more unit, which is what the private demand curve shows.",
  MSB: "Marginal social benefit — MPB plus the marginal external benefit. It is the full benefit to society of one more unit.",
  MEC: "Marginal external cost — the vertical gap between MSC and MPC: the cost imposed on third parties per extra unit.",
  MEB: "Marginal external benefit — the vertical gap between MSB and MPB: the benefit gained by third parties per extra unit.",
  Qp: "The private (free-market) equilibrium output, where MPB = MPC. This is the quantity the market actually produces.",
  Qs: "The socially optimum output, where MSB = MSC. This is the allocatively efficient quantity society would choose.",
  MC: "Marginal cost — the addition to total cost of producing one more unit. It cuts AC and AVC at their minimum points.",
  AC: "Average cost — total cost divided by output (cost per unit). It is U-shaped because of the law of variable proportions in the short run.",
  ATC: "Average total cost — the same as average cost: (fixed + variable cost) ÷ output. Cambridge uses AC and ATC interchangeably.",
  AVC: "Average variable cost — variable cost per unit. It lies below ATC and the gap between them is average fixed cost.",
  AFC: "Average fixed cost — fixed cost per unit. It falls continuously as output rises because the same fixed cost is spread over more units.",
  TC: "Total cost — fixed cost plus variable cost at each level of output.",
  SRAC: "Short-run average cost — average cost when at least one factor (usually capital) is fixed.",
  LRAC: "Long-run average cost — the lowest average cost achievable at each output when all factors are variable. It is the envelope of the short-run curves and shows economies then diseconomies of scale.",
  AR: "Average revenue — total revenue divided by output, which equals price. For a price taker AR is horizontal; for a price maker AR is the downward-sloping demand curve.",
  MR: "Marginal revenue — the addition to total revenue from selling one more unit. Under a straight-line demand curve MR falls at twice the gradient of AR.",
  TR: "Total revenue — price multiplied by quantity sold.",
  "AR=MR=D=P":
    "Under perfect competition the firm is a price taker, so it can sell any output at the market price: price, average revenue, marginal revenue and the firm's demand curve are the same horizontal line.",
  Qm: "The profit-maximising output, found where MC = MR.",
  Pm: "The profit-maximising price, read up from Qm to the AR (demand) curve — never off the MC = MR intersection itself.",
  "Profit": "Abnormal (supernormal) profit — the area between AR and AC over the profit-maximising output: (AR − AC) × Q.",
  AD: "Aggregate demand — total planned spending on domestic output at each price level: AD = C + I + G + (X − M).",
  AD1: "The original aggregate demand curve.",
  AD2: "Aggregate demand after the change in a component of C, I, G or (X − M).",
  AS: "Aggregate supply — total planned output of the economy at each price level.",
  SRAS: "Short-run aggregate supply — output supplied when money wages and other input prices are fixed, so it slopes upwards.",
  LRAS: "Long-run aggregate supply — the economy's productive capacity. Keynesian LRAS has a horizontal, rising and vertical range; the classical version is vertical at full employment.",
  PL: "Price level — the general (average) level of prices, on the vertical axis of every macro diagram. It is an index, not a price in dollars.",
  Y: "National income / real output — real GDP per period, on the horizontal axis of macro diagrams.",
  Yf: "Full-employment (potential) output — the level of real output at which the economy is using its resources fully; LRAS is vertical here.",
  Ye: "Equilibrium real output, where AD = AS.",
  W: "Wage rate — the price of labour, on the vertical axis of a labour market diagram.",
  L: "Quantity of labour — the number of workers or worker-hours employed.",
  DL: "Demand for labour — derived demand from firms; it equals the marginal revenue product of labour.",
  SL: "Supply of labour — the number of worker-hours offered at each wage rate.",
  MRP: "Marginal revenue product — the extra revenue a firm gains from employing one more worker (MPP × MR). It is the firm's demand curve for labour.",
  U: "Unemployment rate — the percentage of the labour force willing and able to work but without a job.",
  ER: "Exchange rate — the price of one currency in terms of another, on the vertical axis of a foreign exchange diagram.",
  "Q$": "Quantity of the currency traded on the foreign exchange market per period.",
  Cum: "Cumulative percentage — used on both axes of a Lorenz curve.",
  line45: "The 45° line of perfect equality: every x% of households receives exactly x% of income.",
};

export type DiagramLabel = { symbol: string; meaning: string };

/** Resolve label keys against the glossary, allowing per-diagram overrides. */
export function resolveLabels(
  keys: string[],
  overrides: Record<string, string> = {},
): DiagramLabel[] {
  return keys.map((key) => ({
    symbol: key,
    meaning: overrides[key] ?? LABEL_GLOSSARY[key] ?? "See the explanation above.",
  }));
}