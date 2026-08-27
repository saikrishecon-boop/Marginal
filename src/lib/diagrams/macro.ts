import { businessCycle, lorenz, resolveLabels, type DiagramSpec, type Pt } from "./spec";
import type { DiagramEntry } from "./types";

/* Shared macro geometry so every AD/AS diagram uses identical conventions. */
const AD1: Pt[] = [
  [6, 92],
  [86, 10],
];
const AD2_RIGHT: Pt[] = [
  [24, 92],
  [96, 17],
];
const AD2_LEFT: Pt[] = [
  [0, 84],
  [72, 4],
];
const SRAS: Pt[] = [
  [6, 12],
  [90, 88],
];
const SRAS_LEFT: Pt[] = [
  [0, 26],
  [78, 96],
];
const SRAS_RIGHT: Pt[] = [
  [20, 4],
  [98, 78],
];

/** Keynesian LRAS: horizontal, then rising, then vertical at full employment. */
const KEYNES_LRAS: Pt[] = [
  [6, 22],
  [40, 22],
  [58, 36],
  [70, 60],
  [74, 96],
];

const PLY = { xLabel: "Real output (Y)", yLabel: "Price level (PL)" };
const WL = { xLabel: "Quantity of labour (L)", yLabel: "Wage rate (W)" };

type Draft = Omit<DiagramEntry, "labels" | "section"> & {
  labelKeys: string[];
  labelOverrides?: Record<string, string>;
};

function build(drafts: Draft[]): DiagramEntry[] {
  return drafts.map(({ labelKeys, labelOverrides, ...rest }) => ({
    ...rest,
    section: "Macroeconomics" as const,
    labels: resolveLabels(labelKeys, labelOverrides),
  }));
}

const adas = (extra: Partial<DiagramSpec> = {}): DiagramSpec => ({
  ...PLY,
  curves: [
    { points: AD1, label: "AD", tone: "demand" },
    { points: SRAS, label: "SRAS", tone: "supply", labelAt: [91, 86] },
  ],
  ...extra,
});

export const MACRO_DIAGRAMS: DiagramEntry[] = build([
  /* ----------------------------- AD / AS ----------------------------- */
  {
    id: "ad-as-equilibrium",
    title: "AD/AS Macroeconomic Equilibrium",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "AS",
    spec: adas({
      markers: [{ at: [47, 52], label: "E", labelOffset: [2.5, 3.5] }],
      xTicks: [{ at: 47, label: "Ye" }],
      yTicks: [{ at: 52, label: "PL1" }],
    }),
    represents:
      "The equilibrium price level and equilibrium level of real national output, found where aggregate demand equals aggregate supply.",
    whyUsed:
      "It is the single most important macro diagram: inflation, growth, unemployment and every demand-side or supply-side policy is explained as a shift of AD or AS from this starting point.",
    whenToDraw:
      "At the start of any macro question that asks about the effect of a change in spending, costs, taxation, interest rates or productive capacity.",
    howToRead: [
      "The vertical axis is the general price level (an index), not the price of one good; the horizontal axis is real output, not the quantity of one good.",
      "Equilibrium E is where AD cuts SRAS: planned spending equals planned output, so there is no unplanned change in stocks.",
      "Read across from E to get the equilibrium price level PL1 and down to get equilibrium real output Ye.",
      "Above E there is excess supply and firms cut prices and output; below E there is excess demand and prices and output are bid up.",
    ],
    labelKeys: ["PL", "Y", "AD", "SRAS", "Ye", "E"],
    mistakes: [
      "Labelling the axes 'Price' and 'Quantity' — macro axes are price LEVEL and REAL OUTPUT.",
      "Treating AD as downward sloping 'because of diminishing marginal utility'; it slopes down because of the wealth, interest-rate and international-trade effects.",
      "Forgetting to mark the equilibrium point and its coordinates before analysing a shift.",
    ],
    tips: [
      "Draw the starting equilibrium first and label PL1 and Y1 before you shift anything — examiners award the diagram mark for correct initial labelling.",
      "State AD = C + I + G + (X − M) in your written analysis so the shift is justified by a named component.",
    ],
    realWorld: [
      "The 2020 pandemic hit both AD (lockdown cuts C and I) and AS (supply-chain disruption) simultaneously.",
      "Post-2021 stimulus in the US shifted AD right while SRAS was constrained, raising both output and inflation.",
    ],
    related: ["ad-increase-demand-pull", "sras-shift-cost-push", "keynesian-lras"],
    examQuestions: [
      "Using an AD/AS diagram, explain how macroeconomic equilibrium is determined. [8]",
      "Assess the likely effects of an increase in aggregate demand on an economy. [12]",
    ],
  },
  {
    id: "ad-increase-demand-pull",
    title: "Increase in AD (Demand-Pull Inflation)",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "AS",
    spec: {
      ...PLY,
      curves: [
        { points: AD1, label: "AD1", tone: "demand" },
        { points: AD2_RIGHT, label: "AD2", tone: "demand", labelAt: [90, 22] },
        { points: SRAS, label: "SRAS", tone: "supply", labelAt: [91, 86] },
      ],
      markers: [
        { at: [47, 52], label: "E1" },
        { at: [60, 65], label: "E2" },
      ],
      xTicks: [
        { at: 47, label: "Y1" },
        { at: 60, label: "Y2" },
      ],
      yTicks: [
        { at: 52, label: "PL1" },
        { at: 65, label: "PL2" },
      ],
      arrows: [{ from: [30, 78], to: [46, 78], label: "AD shifts right" }],
    },
    represents:
      "A rightward shift of aggregate demand raising both the equilibrium price level and real output along an upward-sloping SRAS.",
    whyUsed:
      "It is the standard explanation of demand-pull inflation and of the short-run output gain from expansionary fiscal or monetary policy.",
    whenToDraw:
      "Whenever a question involves a rise in consumption, investment, government spending, exports, a tax cut or an interest-rate cut.",
    howToRead: [
      "Identify which component of AD = C + I + G + (X − M) has risen and say so explicitly.",
      "AD shifts right from AD1 to AD2; equilibrium moves from E1 to E2 along SRAS.",
      "Real output rises Y1 → Y2, so unemployment falls; the price level rises PL1 → PL2, which is demand-pull inflation.",
      "The steeper SRAS is (the closer to capacity), the more of the shift shows up as inflation rather than output.",
    ],
    labelKeys: ["PL", "Y", "AD1", "AD2", "SRAS", "PL1", "PL2"],
    labelOverrides: {
      PL1: "The original equilibrium price level, before aggregate demand rises.",
      PL2: "The higher price level after the rightward shift in AD — the measure of demand-pull inflation on the diagram.",
    },
    mistakes: [
      "Shifting SRAS instead of AD when the cause is a spending change.",
      "Claiming output rises with no inflation, which is only true on the horizontal Keynesian range.",
      "Drawing the new AD curve non-parallel to the original.",
    ],
    tips: [
      "Shift the curve parallel and by a clear, visible distance; then mark BOTH new coordinates.",
      "Link the size of the output effect to the multiplier and to how close the economy is to Yf.",
    ],
    realWorld: [
      "UK 'Eat Out to Help Out' and furlough spending boosted consumption in 2020–21.",
      "India's large infrastructure capital expenditure programme raising G and hence AD.",
    ],
    related: ["ad-as-equilibrium", "keynesian-lras", "multiplier-effect"],
    examQuestions: [
      "Explain, using an AD/AS diagram, how a cut in income tax may cause demand-pull inflation. [8]",
      "Discuss whether an increase in aggregate demand always increases real output. [12]",
    ],
  },
  {
    id: "sras-shift-cost-push",
    title: "Fall in SRAS (Cost-Push Inflation)",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "AS",
    spec: {
      ...PLY,
      curves: [
        { points: AD1, label: "AD", tone: "demand" },
        { points: SRAS, label: "SRAS1", tone: "supply", labelAt: [91, 86] },
        { points: SRAS_LEFT, label: "SRAS2", tone: "warn", labelAt: [79, 96] },
      ],
      markers: [
        { at: [47, 52], label: "E1" },
        { at: [36, 63], label: "E2" },
      ],
      xTicks: [
        { at: 36, label: "Y2" },
        { at: 47, label: "Y1" },
      ],
      yTicks: [
        { at: 52, label: "PL1" },
        { at: 63, label: "PL2" },
      ],
      arrows: [{ from: [56, 82], to: [42, 88], label: "costs rise" }],
    },
    represents:
      "A leftward (upward) shift of short-run aggregate supply caused by higher costs of production, raising the price level while cutting real output.",
    whyUsed:
      "It is the only correct way to show cost-push inflation and stagflation — rising prices with falling output — which a demand-side diagram cannot show.",
    whenToDraw:
      "For oil or commodity price shocks, wage rises above productivity, currency depreciation raising import costs, or higher indirect taxes.",
    howToRead: [
      "Name the cost shock: it raises firms' costs at every level of output, so SRAS shifts left/up to SRAS2.",
      "Equilibrium moves E1 → E2 along the unchanged AD curve.",
      "Real output falls Y1 → Y2, so unemployment rises; the price level rises PL1 → PL2 — this combination is stagflation.",
      "Because both targets worsen together, demand-side policy faces a genuine conflict.",
    ],
    labelKeys: ["PL", "Y", "AD", "SRAS", "PL1", "PL2"],
    mistakes: [
      "Shifting AD left as well, which wrongly removes the inflation.",
      "Describing the result as 'demand-pull' inflation.",
      "Drawing SRAS2 crossing SRAS1 rather than shifting it cleanly.",
    ],
    tips: [
      "Say explicitly 'SRAS shifts left because unit costs of production have risen' — the mechanism earns the AO2 mark.",
      "Follow with evaluation on why interest rate rises are a poor cure for a supply-side shock.",
    ],
    realWorld: [
      "The 1973 OPEC oil shock produced classic stagflation across advanced economies.",
      "2022 European gas prices after the invasion of Ukraine raised energy costs and inflation while slowing growth.",
    ],
    related: ["ad-as-equilibrium", "ad-increase-demand-pull", "lras-growth"],
    examQuestions: [
      "Using a diagram, explain how a rise in world oil prices can cause cost-push inflation. [8]",
      "Assess policies a government could use to respond to stagflation. [12]",
    ],
  },
  {
    id: "keynesian-lras",
    title: "Keynesian LRAS (Three Ranges)",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "A Level",
    spec: {
      ...PLY,
      curves: [
        { points: KEYNES_LRAS, label: "LRAS", tone: "supply", labelAt: [76, 90] },
        {
          points: [
            [6, 60],
            [56, 6],
          ],
          label: "AD1",
          tone: "demand",
          labelAt: [40, 26],
        },
        {
          points: [
            [30, 92],
            [84, 22],
          ],
          label: "AD2",
          tone: "accent",
          labelAt: [85, 26],
        },
      ],
      markers: [
        { at: [26, 22], label: "a", guides: "none" },
        { at: [64, 46], label: "b", guides: "none" },
      ],
      notes: [
        { at: [10, 14], text: "Spare capacity: output rises, prices flat" },
        { at: [52, 84], text: "Near capacity: mostly inflation" },
      ],
      xTicks: [{ at: 74, label: "Yf" }],
    },
    represents:
      "The Keynesian long-run aggregate supply curve: horizontal when there is mass unemployment, upward sloping as bottlenecks appear, and vertical at full-employment output Yf.",
    whyUsed:
      "It shows that the effect of a rise in AD depends entirely on where the economy is operating — the key evaluative point in almost every A Level macro essay.",
    whenToDraw:
      "When a question asks whether expansionary policy will raise output or only prices, or asks you to evaluate the effectiveness of demand management.",
    howToRead: [
      "On the horizontal range there is large spare capacity: a rise in AD raises output with no inflation.",
      "On the intermediate range resources become scarce, so a rise in AD raises both output and the price level.",
      "At Yf the curve is vertical: the economy is at full capacity, so extra AD is purely inflationary.",
      "Compare a and b to show that the same size AD shift has completely different effects depending on the starting point.",
    ],
    labelKeys: ["PL", "Y", "LRAS", "AD1", "AD2", "Yf"],
    mistakes: [
      "Drawing the vertical section sloping slightly — it must be exactly vertical at Yf.",
      "Using a classical vertical LRAS then claiming output rises after an AD shift.",
      "Failing to state which range the economy is in before analysing the shift.",
    ],
    tips: [
      "Draw two AD curves in different ranges — it instantly earns evaluation marks about the size of the output gap.",
      "Mark Yf clearly on the quantity axis; unlabelled full-employment output loses the key mark.",
    ],
    realWorld: [
      "2009–2012 eurozone recovery: large output gaps meant stimulus raised output with little inflation.",
      "2022 US labour market at capacity: further stimulus fed almost entirely into inflation.",
    ],
    related: ["ad-as-equilibrium", "classical-lras", "output-gaps"],
    examQuestions: [
      "Explain the shape of the Keynesian long-run aggregate supply curve. [8]",
      "Discuss whether an increase in government spending will always reduce unemployment. [12]",
    ],
  },
  {
    id: "classical-lras",
    title: "Classical LRAS and an AD Shift",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "A Level",
    spec: {
      ...PLY,
      curves: [
        {
          points: [
            [56, 4],
            [56, 96],
          ],
          label: "LRAS",
          tone: "supply",
          labelAt: [58, 94],
        },
        { points: AD1, label: "AD1", tone: "demand" },
        { points: AD2_RIGHT, label: "AD2", tone: "accent", labelAt: [90, 22] },
      ],
      markers: [
        { at: [56, 42], label: "E1", guides: "y" },
        { at: [56, 68], label: "E2", guides: "y" },
      ],
      yTicks: [
        { at: 42, label: "PL1" },
        { at: 68, label: "PL2" },
      ],
      xTicks: [{ at: 56, label: "Yf" }],
    },
    represents:
      "The classical (monetarist) view that long-run aggregate supply is vertical at full-employment output, so demand-side policy affects only the price level in the long run.",
    whyUsed:
      "It is the standard counter-argument in evaluation: it shows that only supply-side improvement can raise long-run output.",
    whenToDraw:
      "When assessing the long-run effectiveness of fiscal or monetary expansion, or when contrasting Keynesian and classical schools.",
    howToRead: [
      "LRAS is vertical at Yf because in the long run wages and prices are fully flexible and the economy returns to its natural level of output.",
      "A rightward AD shift moves equilibrium from E1 to E2 straight up the vertical LRAS.",
      "Real output is unchanged at Yf; only the price level rises PL1 → PL2 — the shift is purely inflationary.",
      "To raise Yf the whole LRAS must shift right through supply-side policy.",
    ],
    labelKeys: ["PL", "Y", "LRAS", "AD1", "AD2", "Yf"],
    mistakes: [
      "Showing output rising along a vertical LRAS.",
      "Confusing SRAS (upward sloping) with LRAS (vertical) on the same diagram without labelling both.",
    ],
    tips: [
      "Pair this with the Keynesian diagram to argue 'it depends on the time horizon and the size of the output gap'.",
      "State that in the short run output may rise before wages adjust, then returns to Yf.",
    ],
    realWorld: [
      "Monetarist critiques of 1970s UK demand management, which produced inflation rather than lasting growth.",
      "Hyperinflation episodes where huge monetary expansion produced no lasting real output gain.",
    ],
    related: ["keynesian-lras", "lras-growth", "long-run-phillips-curve"],
    examQuestions: [
      "Explain why the classical long-run aggregate supply curve is vertical. [8]",
      "Evaluate the view that demand-side policies cannot raise long-run economic growth. [12]",
    ],
  },
  {
    id: "lras-growth",
    title: "Long-Run Economic Growth (LRAS Shift)",
    topic: "Economic Growth",
    level: "A Level",
    spec: {
      ...PLY,
      curves: [
        {
          points: [
            [46, 4],
            [46, 96],
          ],
          label: "LRAS1",
          tone: "supply",
          labelAt: [34, 94],
        },
        {
          points: [
            [70, 4],
            [70, 96],
          ],
          label: "LRAS2",
          tone: "accent",
          labelAt: [72, 94],
        },
        { points: AD1, label: "AD", tone: "demand" },
      ],
      markers: [
        { at: [46, 50], label: "E1", guides: "y" },
        { at: [70, 28], label: "E2", guides: "y" },
      ],
      yTicks: [
        { at: 28, label: "PL2" },
        { at: 50, label: "PL1" },
      ],
      xTicks: [
        { at: 46, label: "Yf1" },
        { at: 70, label: "Yf2" },
      ],
      arrows: [{ from: [50, 88], to: [66, 88], label: "capacity rises" }],
    },
    represents:
      "An increase in the productive capacity of the economy, shown as a rightward shift of long-run aggregate supply and therefore of potential output.",
    whyUsed:
      "It is the only way to show actual long-run (potential) growth rather than a temporary recovery of spare capacity, and it shows growth without inflation.",
    whenToDraw:
      "For supply-side policies, investment, education and training, immigration, technological progress or discovery of resources.",
    howToRead: [
      "Name the cause: better education, investment in capital, technology, or labour market reform raises productive potential.",
      "LRAS shifts right from LRAS1 to LRAS2, so full-employment output rises Yf1 → Yf2.",
      "With AD unchanged the price level falls PL1 → PL2, so growth is non-inflationary.",
      "This is potential growth; actual growth also needs AD to rise to use the new capacity.",
    ],
    labelKeys: ["PL", "Y", "LRAS", "AD", "Yf"],
    mistakes: [
      "Shifting AD instead of LRAS when the cause is a supply-side improvement.",
      "Claiming supply-side policy works instantly — the time lag is a key evaluation point.",
    ],
    tips: [
      "Show a rightward AD shift as well to argue that both actual and potential growth are needed to avoid deflationary pressure.",
      "Use the PPC as a complementary diagram: potential growth is an outward shift of the PPC.",
    ],
    realWorld: [
      "Singapore's sustained investment in education and infrastructure raising potential output.",
      "AI and automation raising productivity across service sectors.",
    ],
    related: ["classical-lras", "business-cycle", "output-gaps"],
    examQuestions: [
      "Using a diagram, explain the difference between actual and potential economic growth. [8]",
      "Assess the effectiveness of supply-side policies in promoting economic growth. [12]",
    ],
  },
  {
    id: "output-gaps",
    title: "Deflationary and Inflationary Gaps",
    topic: "Economic Growth",
    level: "A Level",
    spec: {
      ...PLY,
      curves: [
        {
          points: [
            [58, 4],
            [58, 96],
          ],
          label: "LRAS",
          tone: "supply",
          labelAt: [59, 94],
        },
        {
          points: [
            [0, 66],
            [58, 4],
          ],
          label: "AD1",
          tone: "demand",
          labelAt: [30, 22],
        },
        { points: SRAS, label: "SRAS", tone: "supply", labelAt: [91, 86] },
        { points: AD2_RIGHT, label: "AD2", tone: "accent", labelAt: [90, 22] },
      ],
      markers: [
        { at: [34, 38], label: "a", guides: "x" },
        { at: [69, 72], label: "b", guides: "x" },
      ],
      notes: [
        { at: [22, 92], text: "Negative (deflationary) gap" },
        { at: [78, 92], text: "Positive (inflationary) gap", align: "end" },
      ],
      xTicks: [{ at: 58, label: "Yf" }],
    },
    represents:
      "The difference between actual real output and the full-employment level of output: a negative output gap when actual output is below Yf and a positive gap when it is above.",
    whyUsed:
      "It links AD/AS analysis directly to unemployment and inflationary pressure, and it justifies the choice between expansionary and contractionary policy.",
    whenToDraw:
      "In questions about recession, cyclical unemployment, overheating, or the appropriate stance of fiscal and monetary policy.",
    howToRead: [
      "Draw vertical LRAS at Yf and locate actual equilibrium output on SRAS.",
      "At a, actual output is left of Yf: the horizontal distance is the negative output gap, associated with cyclical unemployment and downward pressure on inflation.",
      "At b, actual output is right of Yf: this positive gap is unsustainable, generating demand-pull inflation as resources are over-utilised.",
      "The size of the gap tells you how large the required policy change is.",
    ],
    labelKeys: ["PL", "Y", "AD1", "AD2", "SRAS", "LRAS", "Yf"],
    mistakes: [
      "Measuring the gap vertically — it is a horizontal (output) distance.",
      "Saying a positive output gap is always good; it signals unsustainable overheating.",
    ],
    tips: [
      "Always mark Yf first, then the actual equilibrium, then shade or arrow the gap between them.",
      "Connect the gap to the type of unemployment: cyclical unemployment sits in a negative gap.",
    ],
    realWorld: [
      "Large negative output gaps across the eurozone after 2009.",
      "The UK's positive output gap in the late 1980s Lawson boom.",
    ],
    related: ["keynesian-lras", "business-cycle", "phillips-curve"],
    examQuestions: [
      "Explain what is meant by a negative output gap and how it may be closed. [8]",
      "Discuss whether a positive output gap is desirable for an economy. [12]",
    ],
  },
  {
    id: "multiplier-effect",
    title: "The Multiplier Effect",
    topic: "Aggregate Demand & Aggregate Supply",
    level: "A Level",
    spec: {
      ...PLY,
      curves: [
        { points: AD1, label: "AD1", tone: "demand" },
        {
          points: [
            [14, 92],
            [92, 12],
          ],
          label: "AD2",
          tone: "neutral",
          dashed: true,
          labelAt: [86, 8],
        },
        { points: AD2_RIGHT, label: "AD3", tone: "accent", labelAt: [92, 20] },
        { points: SRAS, label: "SRAS", tone: "supply", labelAt: [91, 86] },
      ],
      markers: [
        { at: [47, 52], label: "E1" },
        { at: [60, 65], label: "E2" },
      ],
      arrows: [
        { from: [26, 80], to: [34, 80], label: "initial injection" },
        { from: [36, 88], to: [50, 88], label: "multiplied effect" },
      ],
      xTicks: [
        { at: 47, label: "Y1" },
        { at: 60, label: "Y2" },
      ],
    },
    represents:
      "How an initial injection into the circular flow leads to a final rise in national income that is larger than the injection itself.",
    whyUsed:
      "It explains why the final AD shift exceeds the initial one, and the size of the multiplier (k = 1 ÷ MPW) is a decisive evaluation point on fiscal policy.",
    whenToDraw:
      "In questions on government spending, investment, export growth, or the effectiveness of fiscal stimulus.",
    howToRead: [
      "The initial injection shifts AD from AD1 to the dashed AD2 — that is the first-round effect only.",
      "Recipients of that spending have higher incomes and spend a proportion (the MPC) again, shifting AD further to AD3.",
      "Equilibrium output rises from Y1 to Y2 by more than the initial injection.",
      "The multiplier k = 1 ÷ (MPS + MPT + MPM); the larger the leakages, the smaller the final shift.",
    ],
    labelKeys: ["PL", "Y", "AD1", "AD2", "SRAS"],
    labelOverrides: {
      AD2: "The first-round shift caused by the injection alone, shown dashed; AD3 is the final position after successive rounds of induced spending.",
    },
    mistakes: [
      "Showing only one AD shift and still calling it the multiplier.",
      "Assuming a large multiplier in an open economy with high import propensity.",
    ],
    tips: [
      "Quote the formula and calculate k if the question gives you MPC or the withdrawals.",
      "Evaluate with crowding out and with the position of the economy relative to Yf.",
    ],
    realWorld: [
      "IMF estimates of fiscal multipliers above 1 during deep recessions but below 1 in normal times.",
      "Small open economies such as Singapore have low multipliers because of high import leakage.",
    ],
    related: ["ad-increase-demand-pull", "keynesian-lras", "output-gaps"],
    examQuestions: [
      "Explain how the multiplier magnifies the effect of an increase in government spending. [8]",
      "Assess the importance of the size of the multiplier for fiscal policy. [12]",
    ],
  },
  /* ----------------------------- Cycles, unemployment, inflation ----------------------------- */
  {
    id: "business-cycle",
    title: "The Business (Trade) Cycle",
    topic: "Economic Growth",
    level: "AS",
    spec: {
      xLabel: "Time",
      yLabel: "Real GDP",
      curves: [
        { points: businessCycle(), label: "Actual GDP", tone: "accent", labelAt: [78, 84] },
        {
          points: [
            [10, 25],
            [90, 69],
          ],
          label: "Trend growth",
          tone: "neutral",
          dashed: true,
          labelAt: [60, 44],
        },
      ],
      notes: [
        { at: [28, 92], text: "Boom" },
        { at: [52, 8], text: "Recession / trough" },
      ],
    },
    represents:
      "The short-run fluctuations of actual real GDP around the long-run trend rate of growth, through boom, slowdown, recession and recovery.",
    whyUsed:
      "It distinguishes actual from potential growth over time and provides the context for counter-cyclical fiscal and monetary policy.",
    whenToDraw:
      "In questions on recessions, booms, output gaps, automatic stabilisers or the stance of macroeconomic policy.",
    howToRead: [
      "The straight dashed line is the trend (potential) growth path determined by LRAS.",
      "The wave is actual GDP: above the trend is a boom with a positive output gap; below is a recession with a negative gap.",
      "A recession is conventionally two consecutive quarters of falling real GDP — the downward-sloping section.",
      "The vertical distance between the wave and the trend at any point is the output gap.",
    ],
    labelKeys: ["Y", "Yf"],
    labelOverrides: {
      Y: "Real GDP — real national output measured over time on the vertical axis.",
      Yf: "Trend or potential output — the sustainable growth path set by the economy's productive capacity.",
    },
    mistakes: [
      "Drawing the trend line horizontal — long-run trend growth is positive.",
      "Calling any fall in the growth rate a recession; output must actually fall.",
    ],
    tips: [
      "Label boom, recession, trough and recovery explicitly on the curve.",
      "Link each phase to unemployment and inflation to earn analysis marks.",
    ],
    realWorld: [
      "The 2008–09 global financial crisis recession and the slow subsequent recovery.",
      "The sharp 2020 pandemic trough followed by an unusually rapid rebound.",
    ],
    related: ["output-gaps", "lras-growth", "phillips-curve"],
    examQuestions: [
      "Using a diagram, describe the phases of the business cycle. [8]",
      "Discuss how a government might reduce fluctuations in the business cycle. [12]",
    ],
  },
  {
    id: "phillips-curve",
    title: "Short-Run Phillips Curve",
    topic: "Unemployment & Inflation",
    level: "A Level",
    spec: {
      xLabel: "Unemployment rate (%)",
      yLabel: "Inflation rate (%)",
      curves: [
        {
          points: [
            [12, 92],
            [18, 68],
            [26, 48],
            [38, 32],
            [54, 22],
            [72, 16],
            [90, 13],
          ],
          label: "SRPC",
          tone: "demand",
          labelAt: [86, 20],
        },
      ],
      markers: [
        { at: [26, 48], label: "a" },
        { at: [60, 20], label: "b" },
      ],
      notes: [{ at: [46, 92], text: "Trade-off: lower U ↔ higher inflation" }],
    },
    represents:
      "The short-run inverse relationship between the rate of unemployment and the rate of inflation.",
    whyUsed:
      "It is the classic illustration of a policy conflict: a government cannot reduce unemployment and inflation simultaneously using demand-side policy alone in the short run.",
    whenToDraw:
      "In any question about policy conflicts, trade-offs between macroeconomic objectives, or the costs of reducing inflation.",
    howToRead: [
      "Moving from b to a, expansionary demand policy cuts unemployment but raises the inflation rate.",
      "The mechanism: tighter labour markets raise wage demands, which raise costs and prices.",
      "Moving from a to b, disinflation is achieved only at the cost of higher unemployment — the sacrifice ratio.",
      "The curve is drawn for a given set of inflation expectations; if expectations change, the whole curve shifts.",
    ],
    labelKeys: ["U"],
    labelOverrides: {
      U: "Unemployment rate — the percentage of the labour force willing and able to work but without a job; measured on the horizontal axis.",
    },
    mistakes: [
      "Putting unemployment on the vertical axis.",
      "Treating the short-run trade-off as permanent — this ignores the expectations-augmented long-run curve.",
      "Confusing the price LEVEL with the inflation RATE on the vertical axis.",
    ],
    tips: [
      "Always evaluate by adding the vertical long-run Phillips curve at the natural rate.",
      "Reference stagflation in the 1970s as evidence the simple trade-off broke down.",
    ],
    realWorld: [
      "The stable UK trade-off observed in the 1950s and 1960s.",
      "The 1970s breakdown when high inflation and high unemployment occurred together.",
    ],
    related: ["long-run-phillips-curve", "output-gaps", "sras-shift-cost-push"],
    examQuestions: [
      "Explain, using a Phillips curve, the trade-off between inflation and unemployment. [8]",
      "Discuss whether governments still face a trade-off between inflation and unemployment. [12]",
    ],
  },
  {
    id: "long-run-phillips-curve",
    title: "Long-Run Phillips Curve and the NAIRU",
    topic: "Unemployment & Inflation",
    level: "A Level",
    spec: {
      xLabel: "Unemployment rate (%)",
      yLabel: "Inflation rate (%)",
      curves: [
        {
          points: [
            [46, 4],
            [46, 96],
          ],
          label: "LRPC",
          tone: "supply",
          labelAt: [48, 94],
        },
        {
          points: [
            [16, 60],
            [28, 38],
            [46, 24],
            [72, 16],
          ],
          label: "SRPC1",
          tone: "demand",
          labelAt: [74, 20],
        },
        {
          points: [
            [24, 90],
            [38, 66],
            [56, 52],
            [82, 44],
            [92, 42],
          ],
          label: "SRPC2",
          tone: "accent",
          labelAt: [88, 48],
        },
      ],
      markers: [
        { at: [46, 24], label: "a" },
        { at: [32, 34], label: "b" },
        { at: [46, 52], label: "c" },
      ],
      xTicks: [{ at: 46, label: "NAIRU" }],
    },
    represents:
      "The expectations-augmented Phillips curve: in the long run unemployment returns to the natural rate (NAIRU) whatever the rate of inflation.",
    whyUsed:
      "It is the decisive evaluation of the simple trade-off, showing that demand expansion buys lower unemployment only temporarily and at the cost of permanently higher inflation.",
    whenToDraw:
      "When assessing whether demand-side policy can permanently reduce unemployment, or when explaining why inflation targeting is credible.",
    howToRead: [
      "Start at a on SRPC1, at the natural rate with low inflation.",
      "Expansionary policy moves the economy to b: unemployment falls below the NAIRU because workers are fooled by higher money wages.",
      "As workers realise real wages have not risen, expectations adjust and SRPC shifts up to SRPC2, returning the economy to the natural rate at c with higher inflation.",
      "The LRPC is therefore vertical at the NAIRU: only supply-side policy can shift it left.",
    ],
    labelKeys: ["U"],
    labelOverrides: {
      U: "Unemployment rate. NAIRU is the non-accelerating inflation rate of unemployment — the rate consistent with stable inflation.",
    },
    mistakes: [
      "Drawing the LRPC sloping or at the origin instead of vertical at the NAIRU.",
      "Forgetting to shift the SRPC upwards when expectations adjust.",
    ],
    tips: [
      "Number the sequence a → b → c on the diagram and explain each step in order.",
      "Conclude that reducing the NAIRU requires supply-side measures such as retraining and better job matching.",
    ],
    realWorld: [
      "The Volcker disinflation of the early 1980s: sharp temporary unemployment to reset expectations.",
      "Modern independent central banks anchoring expectations to keep the SRPC low.",
    ],
    related: ["phillips-curve", "classical-lras", "labour-market-equilibrium"],
    examQuestions: [
      "Explain why the long-run Phillips curve is vertical. [8]",
      "Evaluate the view that unemployment can only be reduced permanently by supply-side policy. [12]",
    ],
  },
  /* ----------------------------- Labour market ----------------------------- */
  {
    id: "labour-market-equilibrium",
    title: "Labour Market Equilibrium",
    topic: "Labour Market",
    level: "A Level",
    spec: {
      ...WL,
      curves: [
        {
          points: [
            [4, 92],
            [92, 8],
          ],
          label: "DL = MRP",
          tone: "demand",
          labelAt: [70, 14],
        },
        {
          points: [
            [4, 8],
            [92, 92],
          ],
          label: "SL",
          tone: "supply",
          labelAt: [93, 88],
        },
      ],
      markers: [{ at: [48, 50], label: "E" }],
      xTicks: [{ at: 48, label: "Le" }],
      yTicks: [{ at: 50, label: "We" }],
    },
    represents:
      "The determination of the equilibrium wage rate and level of employment in a competitive labour market where demand for labour equals supply of labour.",
    whyUsed:
      "It is the base diagram for every wage question: minimum wages, trade unions, immigration, and wage differentials all start from it.",
    whenToDraw:
      "In any A Level question on wage determination, labour market failure, or the effects of a national minimum wage.",
    howToRead: [
      "Demand for labour is a derived demand equal to the marginal revenue product of labour, so it slopes down as MPP falls.",
      "Supply of labour slopes up: higher wages attract more workers and more hours as the opportunity cost of leisure rises.",
      "Equilibrium E gives the market-clearing wage We and employment Le.",
      "Any wage above We creates excess supply of labour (unemployment); below We there is a shortage of workers.",
    ],
    labelKeys: ["W", "L", "DL", "SL", "MRP"],
    mistakes: [
      "Labelling the vertical axis 'Price' rather than 'Wage rate'.",
      "Saying demand for labour falls because of diminishing returns to scale rather than diminishing marginal product.",
    ],
    tips: [
      "Write 'DL = MRP' on the demand curve — it earns the AO1 mark for the derived-demand concept.",
      "Note that wage elasticity of demand for labour determines how big the employment effect of any wage change is.",
    ],
    realWorld: [
      "Shortages of nurses and HGV drivers pushing wages up in tight labour markets.",
      "Migration inflows shifting SL right in construction and agriculture.",
    ],
    related: ["minimum-wage-labour", "trade-union-wage", "long-run-phillips-curve"],
    examQuestions: [
      "Using a diagram, explain how wages are determined in a competitive labour market. [8]",
      "Discuss why wage differentials exist between occupations. [12]",
    ],
  },
  {
    id: "minimum-wage-labour",
    title: "National Minimum Wage",
    topic: "Labour Market",
    level: "A Level",
    spec: {
      ...WL,
      curves: [
        {
          points: [
            [4, 92],
            [92, 8],
          ],
          label: "DL",
          tone: "demand",
          labelAt: [70, 14],
        },
        {
          points: [
            [4, 8],
            [92, 92],
          ],
          label: "SL",
          tone: "supply",
          labelAt: [93, 88],
        },
        {
          points: [
            [4, 68],
            [92, 68],
          ],
          label: "NMW",
          tone: "warn",
          labelAt: [93, 68],
        },
      ],
      markers: [
        { at: [48, 50], label: "E", guides: "none" },
        { at: [30, 68], label: "a", guides: "x" },
        { at: [66, 68], label: "b", guides: "x" },
      ],
      shades: [
        {
          points: [
            [30, 68],
            [66, 68],
            [66, 71],
            [30, 71],
          ],
          label: "Excess supply of labour",
          tone: "danger",
          labelAt: [48, 76],
        },
      ],
      xTicks: [
        { at: 30, label: "L2" },
        { at: 66, label: "L3" },
      ],
      yTicks: [{ at: 68, label: "NMW" }],
    },
    represents:
      "A legal minimum wage set above the market equilibrium wage, creating excess supply of labour in a competitive labour market.",
    whyUsed:
      "It shows the central trade-off of minimum wage policy: higher pay for those in work against the risk of unemployment for the least productive workers.",
    whenToDraw:
      "For any question about the national minimum wage, living wage, or government intervention in labour markets.",
    howToRead: [
      "The NMW is a horizontal line above We, so it is binding.",
      "At NMW firms demand only L2 workers because labour is more expensive relative to MRP.",
      "Supply rises to L3 as more people are attracted into the labour market.",
      "The horizontal gap L3 − L2 is excess supply of labour, i.e. the unemployment created.",
    ],
    labelKeys: ["W", "L", "DL", "SL", "Pmin"],
    labelOverrides: {
      Pmin: "Here the price floor is the national minimum wage: a legal minimum price for labour set above equilibrium, so it is binding and creates excess supply.",
    },
    mistakes: [
      "Drawing the NMW below equilibrium, where it has no effect.",
      "Measuring unemployment vertically instead of horizontally.",
      "Ignoring monopsony, where a minimum wage can raise both wages and employment.",
    ],
    tips: [
      "Evaluate using the elasticity of demand for labour: inelastic DL means a small employment loss.",
      "Mention monopsony employers as the key counter-argument for a strong evaluation mark.",
    ],
    realWorld: [
      "The UK National Living Wage: research finds limited employment effects in most sectors.",
      "Large minimum wage rises in some US states raising incomes but reducing hours in low-margin retail.",
    ],
    related: ["labour-market-equilibrium", "trade-union-wage"],
    examQuestions: [
      "Using a diagram, explain the likely effects of a national minimum wage on employment. [8]",
      "Assess whether a national minimum wage reduces poverty. [12]",
    ],
  },
  {
    id: "trade-union-wage",
    title: "Trade Union Effect on Wages",
    topic: "Labour Market",
    level: "A Level",
    spec: {
      ...WL,
      curves: [
        {
          points: [
            [4, 92],
            [92, 8],
          ],
          label: "DL",
          tone: "demand",
          labelAt: [70, 14],
        },
        {
          points: [
            [4, 8],
            [92, 92],
          ],
          label: "SL",
          tone: "supply",
          labelAt: [93, 88],
        },
        {
          points: [
            [24, 8],
            [92, 96],
          ],
          label: "SL (union)",
          tone: "accent",
          labelAt: [80, 96],
        },
      ],
      markers: [
        { at: [48, 50], label: "E1" },
        { at: [38, 60], label: "E2" },
      ],
      xTicks: [
        { at: 38, label: "L2" },
        { at: 48, label: "L1" },
      ],
      yTicks: [
        { at: 50, label: "W1" },
        { at: 60, label: "W2" },
      ],
      arrows: [{ from: [40, 88], to: [30, 92], label: "union restricts supply" }],
    },
    represents:
      "How a trade union raises the wage rate by restricting the supply of labour or by collectively bargaining a wage above the competitive level.",
    whyUsed:
      "It shows the classic union trade-off — higher wages for members but fewer jobs — and is the standard A Level labour market failure diagram.",
    whenToDraw:
      "In questions on trade union power, collective bargaining, professional licensing or closed shops.",
    howToRead: [
      "The union restricts entry or bargains a wage floor, shifting SL left to SL (union).",
      "The wage rises from W1 to W2 for those who keep their jobs.",
      "Employment falls from L1 to L2 as firms move up the unchanged DL curve.",
      "The employment loss depends on the wage elasticity of demand for labour, which is lower where labour is a small share of costs.",
    ],
    labelKeys: ["W", "L", "DL", "SL"],
    mistakes: [
      "Shifting DL instead of SL when the union restricts entry.",
      "Ignoring that in a monopsony a union can raise both the wage and employment.",
    ],
    tips: [
      "Use elasticity of DL for evaluation, and note that unions can raise productivity through better training and lower turnover.",
      "Mention union density and legal restrictions as determinants of union power.",
    ],
    realWorld: [
      "Medical and legal professional bodies restricting entry and maintaining high pay.",
      "Declining union density in the UK reducing bargaining power since the 1980s.",
    ],
    related: ["labour-market-equilibrium", "minimum-wage-labour"],
    examQuestions: [
      "Using a diagram, explain how a trade union may raise the wages of its members. [8]",
      "Discuss the effects of trade unions on the labour market. [12]",
    ],
  },
  /* ----------------------------- Distribution & development ----------------------------- */
  {
    id: "lorenz-curve",
    title: "Lorenz Curve and the Gini Coefficient",
    topic: "Income Distribution",
    level: "A Level",
    spec: {
      xLabel: "Cumulative % of households",
      yLabel: "Cumulative % of income",
      curves: [
        {
          points: [
            [10, 10],
            [90, 90],
          ],
          label: "45° line of equality",
          tone: "neutral",
          dashed: true,
          labelAt: [40, 66],
        },
        { points: lorenz(1), label: "Lorenz curve", tone: "demand", labelAt: [62, 20] },
      ],
      shades: [
        {
          points: [
            [10, 10],
            [40, 40],
            [70, 70],
            [90, 90],
            [70, 34],
            [40, 14],
          ],
          label: "A",
          tone: "warn",
          labelAt: [56, 46],
        },
      ],
      notes: [{ at: [76, 12], text: "B" }],
    },
    represents:
      "The cumulative distribution of income across households, compared with a line of perfect equality; the Gini coefficient is A ÷ (A + B).",
    whyUsed:
      "It is the standard way to measure and compare income (or wealth) inequality between countries or over time.",
    whenToDraw:
      "In questions about inequality, redistribution, progressive taxation, or economic development indicators.",
    howToRead: [
      "The 45° line shows perfect equality: the poorest 20% of households would receive 20% of income.",
      "The actual Lorenz curve bows below it; the further it bows, the greater the inequality.",
      "Area A is between the 45° line and the Lorenz curve; area B is below the Lorenz curve.",
      "Gini = A ÷ (A + B), between 0 (perfect equality) and 1 (perfect inequality). Redistribution moves the curve towards the 45° line and lowers the Gini.",
    ],
    labelKeys: ["Cum", "line45"],
    mistakes: [
      "Drawing the Lorenz curve above the 45° line — it can never lie above it.",
      "Saying the Gini is measured in per cent without stating it is a ratio between 0 and 1 (or 0 and 100).",
      "Confusing income inequality with poverty; a country can be equal and poor.",
    ],
    tips: [
      "Label both areas A and B clearly and state the Gini formula on the diagram.",
      "Show a second, less-bowed curve to illustrate the effect of progressive taxation and benefits.",
    ],
    realWorld: [
      "South Africa has one of the highest Gini coefficients in the world (around 0.63).",
      "Nordic countries have Ginis near 0.27 after extensive tax and transfer redistribution.",
    ],
    related: ["kuznets-curve", "business-cycle"],
    examQuestions: [
      "Explain how a Lorenz curve and Gini coefficient measure income inequality. [8]",
      "Discuss whether reducing income inequality should be a government priority. [12]",
    ],
  },
  {
    id: "kuznets-curve",
    title: "The Kuznets Curve",
    topic: "Income Distribution",
    level: "A Level",
    spec: {
      xLabel: "Income per head",
      yLabel: "Inequality",
      curves: [
        {
          points: [
            [10, 22],
            [22, 46],
            [34, 66],
            [46, 74],
            [58, 68],
            [72, 50],
            [88, 30],
          ],
          label: "Kuznets curve",
          tone: "accent",
          labelAt: [62, 62],
        },
      ],
      markers: [{ at: [46, 74], label: "peak inequality", labelOffset: [3, 5] }],
      notes: [
        { at: [18, 90], text: "Early industrialisation" },
        { at: [88, 90], text: "Mature economy", align: "end" },
      ],
    },
    represents:
      "The hypothesis that inequality first rises and then falls as an economy develops, giving an inverted-U relationship between income per head and inequality.",
    whyUsed:
      "It provides the standard development-economics framework for discussing whether growth automatically reduces inequality.",
    whenToDraw:
      "In questions on economic development, the relationship between growth and inequality, or the need for redistribution policy.",
    howToRead: [
      "In early industrialisation, urban industrial incomes rise faster than rural incomes, so inequality rises.",
      "Inequality peaks partway through the development process.",
      "As education spreads, labour becomes scarcer and welfare states develop, inequality falls.",
      "The relationship is a hypothesis, not a law: policy, not development alone, determines the downward leg.",
    ],
    labelKeys: ["Cum"],
    labelOverrides: {
      Cum: "The vertical axis measures inequality (for example the Gini coefficient); the horizontal axis measures real income per head as the economy develops.",
    },
    mistakes: [
      "Drawing a U shape rather than an inverted U.",
      "Presenting Kuznets as proven — recent evidence from advanced economies shows inequality rising again.",
    ],
    tips: [
      "Evaluate using the rise in inequality in the US and UK since 1980, which contradicts the simple curve.",
      "Link back to the Lorenz curve as the measurement tool behind the vertical axis.",
    ],
    realWorld: [
      "China's inequality rose sharply during rapid industrialisation after 1980.",
      "Rising top-income shares in advanced economies question the downward leg of the curve.",
    ],
    related: ["lorenz-curve", "lras-growth"],
    examQuestions: [
      "Explain the Kuznets curve hypothesis. [8]",
      "Discuss whether economic growth inevitably reduces income inequality. [12]",
    ],
  },
  /* ----------------------------- International ----------------------------- */
  {
    id: "exchange-rate-market",
    title: "Foreign Exchange Market (Appreciation)",
    topic: "Exchange Rates",
    level: "A Level",
    spec: {
      xLabel: "Quantity of the currency",
      yLabel: "Exchange rate",
      curves: [
        {
          points: [
            [4, 92],
            [88, 8],
          ],
          label: "D$1",
          tone: "demand",
          labelAt: [66, 14],
        },
        {
          points: [
            [20, 92],
            [96, 18],
          ],
          label: "D$2",
          tone: "accent",
          labelAt: [90, 22],
        },
        {
          points: [
            [4, 8],
            [92, 92],
          ],
          label: "S$",
          tone: "supply",
          labelAt: [93, 88],
        },
      ],
      markers: [
        { at: [48, 50], label: "E1" },
        { at: [60, 62], label: "E2" },
      ],
      yTicks: [
        { at: 50, label: "ER1" },
        { at: 62, label: "ER2" },
      ],
      arrows: [{ from: [30, 82], to: [44, 82], label: "demand for currency rises" }],
    },
    represents:
      "The determination of a floating exchange rate by the demand for and supply of a currency, and an appreciation caused by rising demand for the currency.",
    whyUsed:
      "It explains exchange rate changes from first principles and links directly to the balance of payments, inflation and competitiveness.",
    whenToDraw:
      "In questions on floating exchange rates, hot money flows, interest rate changes, export demand or currency appreciation/depreciation.",
    howToRead: [
      "Demand for the currency comes from foreigners buying exports and investing in the country; supply comes from residents buying imports and investing abroad.",
      "A rise in exports or in interest rates raises demand for the currency, shifting D$ right.",
      "The exchange rate appreciates from ER1 to ER2.",
      "Appreciation makes exports dearer and imports cheaper (SPICED), worsening the current account but reducing imported inflation.",
    ],
    labelKeys: ["ER", "Q$"],
    mistakes: [
      "Labelling the vertical axis 'Price' rather than the exchange rate with the currencies specified (e.g. USD per GBP).",
      "Using 'appreciation' for a fixed rate — that is a revaluation.",
      "Forgetting that the diagram is for the currency itself, not for goods.",
    ],
    tips: [
      "Write the axis as '$ per £' so the direction of appreciation is unambiguous.",
      "Use SPICED (Strong Pound, Imports Cheap, Exports Dear) to structure the consequences.",
    ],
    realWorld: [
      "US dollar appreciation in 2022 as the Fed raised interest rates faster than other central banks.",
      "Sterling depreciation after the 2016 referendum raising import prices.",
    ],
    related: ["j-curve", "tariff-diagram", "sras-shift-cost-push"],
    examQuestions: [
      "Using a diagram, explain how an increase in interest rates may cause a currency to appreciate. [8]",
      "Assess the effects of a depreciation of the exchange rate on an economy. [12]",
    ],
  },
  {
    id: "j-curve",
    title: "The J-Curve Effect",
    topic: "Balance of Payments",
    level: "A Level",
    spec: {
      xLabel: "Time after depreciation",
      yLabel: "Current account balance",
      curves: [
        {
          points: [
            [12, 54],
            [22, 40],
            [32, 30],
            [42, 30],
            [54, 42],
            [68, 60],
            [86, 78],
          ],
          label: "Current account",
          tone: "accent",
          labelAt: [70, 84],
        },
        {
          points: [
            [8, 54],
            [92, 54],
          ],
          label: "Balance = 0",
          tone: "neutral",
          dashed: true,
          labelAt: [8, 58],
        },
      ],
      markers: [{ at: [12, 54], label: "depreciation", guides: "none", labelOffset: [2, 6] }],
      notes: [
        { at: [30, 16], text: "Short run: deficit worsens" },
        { at: [88, 90], text: "Long run: improves", align: "end" },
      ],
    },
    represents:
      "How a depreciation of the currency first worsens the current account and only later improves it, tracing a J shape over time.",
    whyUsed:
      "It is the standard time-lag qualification to the claim that depreciation cures a current account deficit, and it applies the Marshall–Lerner condition.",
    whenToDraw:
      "In questions on depreciation, devaluation, or expenditure-switching policies to correct a deficit.",
    howToRead: [
      "Immediately after depreciation, contracts are fixed and demand is price-inelastic, so import bills rise in domestic currency terms and the deficit worsens.",
      "Over time consumers and firms switch away from dearer imports and foreign buyers respond to cheaper exports.",
      "Once PEDx + PEDm > 1 (the Marshall–Lerner condition), the current account improves and moves back above the starting level.",
      "The horizontal axis is time, not quantity — this is a time-path diagram, not a market diagram.",
    ],
    labelKeys: ["ER"],
    labelOverrides: {
      ER: "The exchange rate change (a depreciation) occurs at the start of the time period shown; the vertical axis measures the current account balance.",
    },
    mistakes: [
      "Drawing the curve as a market diagram with quantity on the horizontal axis.",
      "Omitting the Marshall–Lerner condition when explaining the upward leg.",
    ],
    tips: [
      "State the Marshall–Lerner condition explicitly: the sum of the price elasticities of demand for exports and imports must exceed one.",
      "Mark the moment of depreciation on the time axis so the two phases are clearly separated.",
    ],
    realWorld: [
      "The UK current account after the 2016 sterling depreciation improved only slowly.",
      "The 1992 ERM exit depreciation eventually boosted UK export competitiveness.",
    ],
    related: ["exchange-rate-market", "tariff-diagram"],
    examQuestions: [
      "Using the J-curve, explain why a depreciation may not immediately improve the current account. [8]",
      "Discuss whether depreciation is an effective way to correct a current account deficit. [12]",
    ],
  },
  {
    id: "tariff-diagram",
    title: "Effect of a Tariff on Imports",
    topic: "International Trade",
    level: "A Level",
    spec: {
      xLabel: "Quantity",
      yLabel: "Price",
      curves: [
        {
          points: [
            [0, 95],
            [92, 6],
          ],
          label: "D (domestic)",
          tone: "demand",
          labelAt: [70, 14],
        },
        {
          points: [
            [0, 3],
            [92, 92],
          ],
          label: "S (domestic)",
          tone: "supply",
          labelAt: [93, 88],
        },
        {
          points: [
            [4, 26],
            [92, 26],
          ],
          label: "Pw",
          tone: "neutral",
          labelAt: [93, 26],
        },
        {
          points: [
            [4, 42],
            [92, 42],
          ],
          label: "Pw + tariff",
          tone: "warn",
          labelAt: [93, 42],
        },
      ],
      markers: [
        { at: [24, 26], label: "a", guides: "x" },
        { at: [72, 26], label: "d", guides: "x" },
        { at: [40, 42], label: "b", guides: "x" },
        { at: [58, 42], label: "c", guides: "x" },
      ],
      shades: [
        {
          points: [
            [40, 26],
            [58, 26],
            [58, 42],
            [40, 42],
          ],
          label: "Tariff revenue",
          tone: "primary",
          labelAt: [49, 34],
        },
      ],
      notes: [{ at: [49, 92], text: "Imports fall from a→d to b→c" }],
    },
    represents:
      "A tax on imports which raises the domestic price above the world price, increasing domestic production, reducing consumption and cutting imports.",
    whyUsed:
      "It is the core protectionism diagram, showing the winners (domestic producers, government) and losers (consumers) and the welfare loss from protection.",
    whenToDraw:
      "In any question on protectionism, trade wars, infant industry protection, or free trade agreements.",
    howToRead: [
      "At the world price Pw the country consumes at d and produces at a, so imports are the distance a to d.",
      "The tariff raises the price to Pw + tariff: domestic supply extends to b and demand contracts to c.",
      "Imports fall to the distance b to c.",
      "The shaded rectangle is government tariff revenue: the tariff per unit multiplied by the remaining imports. Consumer surplus falls and there are two deadweight welfare loss triangles either side of the revenue rectangle.",
    ],
    labelKeys: ["P", "Q", "D", "S", "DWL", "CS"],
    labelOverrides: {
      DWL: "Deadweight welfare loss — the two triangles beside the tariff-revenue rectangle: production inefficiency (higher-cost domestic output) and consumption inefficiency (units no longer consumed).",
    },
    mistakes: [
      "Shifting the domestic supply curve instead of raising the world price line.",
      "Shading the whole area between the two price lines as government revenue — revenue is only on the units still imported.",
      "Forgetting to show that imports shrink rather than disappear.",
    ],
    tips: [
      "Label the four points a, b, c, d and describe imports as horizontal distances — examiners look for this.",
      "Evaluate with retaliation, the infant industry argument, and the effect on consumer welfare.",
    ],
    realWorld: [
      "US steel and aluminium tariffs from 2018 and the retaliation that followed.",
      "EU Common External Tariff on agricultural imports.",
    ],
    related: ["exchange-rate-market", "j-curve"],
    examQuestions: [
      "Using a diagram, explain the effects of imposing a tariff on imports. [8]",
      "Assess whether protectionism can ever be justified. [12]",
    ],
  },
  {
    id: "money-market-interest",
    title: "The Money Market and Interest Rates",
    topic: "Monetary Policy",
    level: "A Level",
    spec: {
      xLabel: "Quantity of money",
      yLabel: "Rate of interest",
      curves: [
        {
          points: [
            [8, 92],
            [24, 56],
            [46, 34],
            [70, 24],
            [92, 20],
          ],
          label: "MD (liquidity preference)",
          tone: "demand",
          labelAt: [50, 20],
        },
        {
          points: [
            [44, 4],
            [44, 96],
          ],
          label: "MS1",
          tone: "supply",
          labelAt: [33, 94],
        },
        {
          points: [
            [66, 4],
            [66, 96],
          ],
          label: "MS2",
          tone: "accent",
          labelAt: [68, 94],
        },
      ],
      markers: [
        { at: [44, 35], label: "r1", guides: "y" },
        { at: [66, 25], label: "r2", guides: "y" },
      ],
      arrows: [{ from: [48, 84], to: [62, 84], label: "money supply rises" }],
    },
    represents:
      "The determination of the equilibrium rate of interest where the demand for money (liquidity preference) equals the supply of money set by the central bank.",
    whyUsed:
      "It underpins monetary policy: it shows precisely how an expansion of the money supply lowers interest rates and therefore raises AD.",
    whenToDraw:
      "For questions on monetary policy, quantitative easing, money supply changes or the transmission mechanism.",
    howToRead: [
      "Money demand slopes down: at high interest rates the opportunity cost of holding cash is high, so people hold bonds instead.",
      "The money supply is drawn vertical because it is set by the central bank, independent of the interest rate.",
      "An increase in the money supply shifts MS right from MS1 to MS2, cutting the interest rate from r1 to r2.",
      "Lower interest rates raise investment and consumption, so AD shifts right — the monetary transmission mechanism.",
    ],
    labelKeys: ["ER"],
    labelOverrides: {
      ER: "The vertical axis is the nominal rate of interest, the price of money; the horizontal axis is the quantity of money in the economy.",
    },
    mistakes: [
      "Drawing the money supply curve upward sloping.",
      "Confusing this with the loanable funds diagram, or with the AD/AS diagram.",
      "Stopping at the interest rate change without completing the link to AD.",
    ],
    tips: [
      "Always finish the chain: MS↑ → r↓ → I and C↑ → AD↑ → output and price level.",
      "Evaluate with the liquidity trap, where MD is horizontal and further MS rises do not cut rates.",
    ],
    realWorld: [
      "Quantitative easing after 2009 expanding the money supply to hold long rates down.",
      "Central bank rate rises in 2022–23 tightening monetary conditions to curb inflation.",
    ],
    related: ["ad-increase-demand-pull", "phillips-curve", "exchange-rate-market"],
    examQuestions: [
      "Using a diagram, explain how an increase in the money supply affects the rate of interest. [8]",
      "Discuss the effectiveness of monetary policy in controlling inflation. [12]",
    ],
  },
]);
