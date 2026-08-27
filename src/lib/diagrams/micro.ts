import { resolveLabels, uShape, type DiagramSpec, type Pt } from "./spec";
import type { DiagramEntry } from "./types";

/* Shared geometry so every market diagram uses identical conventions. */
const D: Pt[] = [
  [0, 95],
  [92, 6],
];
const S: Pt[] = [
  [0, 3],
  [92, 92],
];
const E: Pt = [48, 49];
const D_RIGHT: Pt[] = [
  [16, 95],
  [92, 21],
];
const D_LEFT: Pt[] = [
  [0, 80],
  [80, 3],
];
const S_RIGHT: Pt[] = [
  [16, 3],
  [92, 77],
];
const S_LEFT: Pt[] = [
  [0, 19],
  [79, 95],
];
const E_HIGH: Pt = [56, 57];
const E_LOWQ: Pt = [40, 41];
const E_CHEAP: Pt = [56, 41];
const E_DEAR: Pt = [40, 57];

const PQ = { xLabel: "Quantity", yLabel: "Price" };

type Draft = Omit<DiagramEntry, "labels" | "section"> & {
  labelKeys: string[];
  labelOverrides?: Record<string, string>;
};

function build(drafts: Draft[]): DiagramEntry[] {
  return drafts.map(({ labelKeys, labelOverrides, ...rest }) => ({
    ...rest,
    section: "Microeconomics" as const,
    labels: resolveLabels(labelKeys, labelOverrides),
  }));
}

const market = (extra: Partial<DiagramSpec> = {}): DiagramSpec => ({
  ...PQ,
  curves: [
    { points: D, label: "D", tone: "demand" },
    { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
  ],
  ...extra,
});

export const MICRO_DIAGRAMS: DiagramEntry[] = build([
  /* ------------------------------- Demand & Supply ------------------------------- */
  {
    id: "demand-curve",
    title: "Demand Curve",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [{ points: D, label: "D", tone: "demand" }],
      markers: [
        { at: [24, 72], label: "a" },
        { at: [66, 31], label: "b" },
      ],
      notes: [{ at: [40, 92], text: "Lower price → higher quantity demanded" }],
    },
    represents:
      "The quantity of a good consumers are willing and able to buy at each possible price over a period of time, holding all other influences constant.",
    whyUsed:
      "It is the foundation of every microeconomic market diagram: without a correctly drawn demand curve no equilibrium, tax, subsidy or externality analysis can be shown.",
    whenToDraw:
      "Whenever a question asks about consumer behaviour, the law of demand, or any change in a market. Cambridge expects it in almost every AS micro data-response and essay.",
    howToRead: [
      "Read across from a price on the vertical axis to the curve, then down to the quantity axis: that is quantity demanded at that price.",
      "The negative gradient shows the inverse relationship between price and quantity demanded.",
      "A move from a to b is a movement along the curve caused only by a change in the good's own price — an extension of demand.",
      "Everything else (income, tastes, other prices) is held constant: ceteris paribus.",
    ],
    labelKeys: ["P", "Q", "D"],
    mistakes: [
      "Calling a movement along the curve an 'increase in demand' — it is an extension of quantity demanded.",
      "Leaving axes labelled only P and Q with no words.",
      "Drawing demand upward sloping or curving the wrong way.",
    ],
    tips: [
      "Always label the curve D (or D1 if a shift follows) and use a ruler-straight line unless the question needs a curve.",
      "Write 'per week' or 'per year' in your explanation to show demand is a flow concept.",
    ],
    realWorld: [
      "Airline seats: as fares fall in the off season, quantity demanded of flights rises.",
      "Streaming subscriptions: price cuts raise sign-ups along the same demand curve.",
    ],
    related: ["supply-curve", "market-equilibrium", "price-elasticity-of-demand"],
    examQuestions: [
      "Explain, using a diagram, why the demand curve for a normal good slopes downwards. [8]",
      "Distinguish between a movement along and a shift in the demand curve. [4]",
    ],
  },
  {
    id: "supply-curve",
    title: "Supply Curve",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [{ points: S, label: "S", tone: "supply", labelAt: [93, 88] }],
      markers: [
        { at: [24, 26], label: "a" },
        { at: [66, 67], label: "b" },
      ],
      notes: [{ at: [10, 92], text: "Higher price → higher quantity supplied" }],
    },
    represents:
      "The quantity producers are willing and able to offer for sale at each price over a period of time, ceteris paribus.",
    whyUsed:
      "It shows producer behaviour and, with demand, determines the market price. It is also the curve that shifts in every tax, subsidy or cost-shock question.",
    whenToDraw:
      "In any question about producers, costs of production, or a change in market conditions on the supply side.",
    howToRead: [
      "Read from a price across to the curve and down: that is quantity supplied at that price.",
      "The positive gradient reflects rising marginal cost and higher profitability at higher prices.",
      "A move from a to b is an extension of supply caused by the good's own price only.",
    ],
    labelKeys: ["P", "Q", "S"],
    mistakes: [
      "Shifting supply when only the good's own price has changed.",
      "Drawing supply through the origin when there is a minimum price at which firms will supply.",
    ],
    tips: [
      "Say explicitly why supply slopes upward — rising marginal cost and the profit motive — rather than just asserting it.",
    ],
    realWorld: [
      "Oil producers bring higher-cost shale wells online when the world oil price rises.",
      "Farmers plant more of a crop after a season of high prices.",
    ],
    related: ["demand-curve", "market-equilibrium", "price-elasticity-of-supply"],
    examQuestions: [
      "Explain why the supply curve of a good normally slopes upwards. [6]",
      "Analyse the effect of a fall in the cost of raw materials on the supply of a good. [8]",
    ],
  },
  {
    id: "market-equilibrium",
    title: "Market Equilibrium",
    topic: "Demand & Supply",
    level: "AS",
    spec: market({
      markers: [{ at: E, label: "E", labelOffset: [2.5, 3] }],
      yTicks: [{ at: 49, label: "Pe" }],
      xTicks: [{ at: 48, label: "Qe" }],
      notes: [
        { at: [18, 84], text: "Excess supply above Pe" },
        { at: [46, 12], text: "Excess demand below Pe" },
      ],
    }),
    represents:
      "The market-clearing price and quantity, where the plans of buyers and sellers coincide so quantity demanded equals quantity supplied.",
    whyUsed:
      "It shows how the price mechanism rations, signals and provides incentives, and gives the starting point from which every change is analysed.",
    whenToDraw:
      "As the base diagram for any market question. Always establish equilibrium before showing a shift.",
    howToRead: [
      "Where D cuts S there is neither shortage nor surplus, so price has no tendency to change.",
      "Above Pe, quantity supplied exceeds quantity demanded: the surplus forces price down.",
      "Below Pe, quantity demanded exceeds quantity supplied: the shortage bids price up.",
      "The market therefore self-corrects back to E.",
    ],
    labelKeys: ["P", "Q", "D", "S", "E", "Pe", "Qe"],
    mistakes: [
      "Failing to label Pe and Qe with dotted lines to the axes.",
      "Describing a shortage as 'demand is greater than supply' rather than 'quantity demanded exceeds quantity supplied'.",
    ],
    tips: [
      "Use dotted guide lines and label both axes' values; examiners award marks for a fully labelled diagram.",
      "Explain the adjustment process, not just the end point.",
    ],
    realWorld: [
      "Wholesale electricity markets clear every half hour at the price where supply meets demand.",
    ],
    related: ["increase-in-demand", "increase-in-supply", "consumer-surplus"],
    examQuestions: [
      "Using a demand and supply diagram, explain how equilibrium price is determined. [8]",
      "Explain how the price mechanism eliminates a shortage in a market. [6]",
    ],
  },
  {
    id: "increase-in-demand",
    title: "Increase in Demand",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D1", tone: "demand" },
        { points: D_RIGHT, label: "D2", tone: "demand", dashed: true, labelAt: [93, 24] },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_HIGH, label: "E2" },
      ],
      arrows: [{ from: [30, 68], to: [46, 68], label: "shift right" }],
    },
    represents:
      "A rightward shift of demand: consumers buy more at every price because of a change in a non-price determinant.",
    whyUsed:
      "It shows how changes in income, tastes, population, the price of substitutes or complements, and expectations feed through to price and quantity.",
    whenToDraw:
      "Whenever a question describes something other than the good's own price raising demand — rising incomes, a successful advertising campaign, a dearer substitute.",
    howToRead: [
      "D shifts from D1 to D2 at every price.",
      "At the original price there is now excess demand, so price is bid up.",
      "The market moves along S to the new equilibrium E2: both price and quantity rise.",
      "The size of the price rise depends on the price elasticity of supply.",
    ],
    labelKeys: ["P", "Q", "D1", "D2", "S", "E1", "E2"],
    mistakes: [
      "Shifting the supply curve as well, when supply has not changed.",
      "Saying 'supply increases too' instead of 'there is an extension of supply along S'.",
    ],
    tips: [
      "Name the specific determinant that caused the shift; unexplained shifts earn no analysis marks.",
      "Always show both the new price and the new quantity with dotted lines.",
    ],
    realWorld: [
      "Demand for electric vehicles rose as incomes and environmental awareness increased.",
    ],
    related: ["decrease-in-demand", "market-equilibrium", "price-elasticity-of-supply"],
    examQuestions: [
      "Analyse, using a diagram, the effect of an increase in consumer income on the market for a normal good. [8]",
    ],
  },
  {
    id: "decrease-in-demand",
    title: "Decrease in Demand",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D1", tone: "demand" },
        { points: D_LEFT, label: "D2", tone: "demand", dashed: true, labelAt: [81, 6] },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_LOWQ, label: "E2", labelOffset: [-12, 3] },
      ],
      arrows: [{ from: [46, 68], to: [30, 68], label: "shift left" }],
    },
    represents:
      "A leftward shift of demand: less is demanded at every price because of a change in a non-price determinant.",
    whyUsed:
      "It models recessions, negative publicity, cheaper substitutes and falling population in a single, precise picture.",
    whenToDraw:
      "When incomes fall for a normal good, a substitute becomes cheaper, tastes move away from the good, or a complement becomes dearer.",
    howToRead: [
      "Demand shifts left from D1 to D2.",
      "At the old price there is excess supply, so price falls.",
      "There is a contraction of supply along S to E2, so both price and quantity fall.",
    ],
    labelKeys: ["P", "Q", "D1", "D2", "S", "E1", "E2"],
    mistakes: [
      "Confusing an inferior good (demand rises when income falls) with a normal good.",
      "Shifting demand downwards vertically rather than leftwards, which loses precision.",
    ],
    tips: [
      "State the direction of change of BOTH price and quantity in your written answer.",
    ],
    realWorld: [
      "Demand for petrol cars in Norway fell sharply as EV incentives changed consumer tastes.",
    ],
    related: ["increase-in-demand", "market-equilibrium"],
    examQuestions: [
      "Using a diagram, explain the effect on the market for restaurant meals of a fall in real incomes. [8]",
    ],
  },
  {
    id: "increase-in-supply",
    title: "Increase in Supply",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S1", tone: "supply", labelAt: [93, 88] },
        { points: S_RIGHT, label: "S2", tone: "supply", dashed: true, labelAt: [93, 74] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_CHEAP, label: "E2" },
      ],
      arrows: [{ from: [30, 30], to: [46, 30], label: "shift right" }],
    },
    represents:
      "A rightward shift of supply: firms offer more at every price because production has become cheaper or easier.",
    whyUsed:
      "It is the standard way to show improved technology, lower input costs, subsidies, better productivity or new entrants.",
    whenToDraw:
      "Whenever costs of production fall, technology improves, or the number of firms rises.",
    howToRead: [
      "Supply shifts right from S1 to S2.",
      "At the old price there is excess supply, so price falls.",
      "Demand extends along D to E2: price falls and quantity rises.",
      "How far price falls depends on the price elasticity of demand.",
    ],
    labelKeys: ["P", "Q", "D", "S1", "S2", "E1", "E2"],
    mistakes: [
      "Saying demand increases when it only extends along the curve.",
      "Drawing the new supply curve non-parallel without justification.",
    ],
    tips: ["Link the shift to a named cost or technology change for AO2 credit."],
    realWorld: [
      "Falling solar panel costs shifted the supply of solar electricity sharply right.",
    ],
    related: ["decrease-in-supply", "subsidy", "market-equilibrium"],
    examQuestions: [
      "Analyse, with the aid of a diagram, the effect of an improvement in technology on a competitive market. [8]",
    ],
  },
  {
    id: "decrease-in-supply",
    title: "Decrease in Supply",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S1", tone: "supply", labelAt: [93, 88] },
        { points: S_LEFT, label: "S2", tone: "supply", dashed: true, labelAt: [72, 96] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_DEAR, label: "E2", labelOffset: [-13, 3] },
      ],
      arrows: [{ from: [46, 30], to: [30, 30], label: "shift left" }],
    },
    represents:
      "A leftward shift of supply: less is offered at every price because production has become more costly or more difficult.",
    whyUsed:
      "It models cost-push shocks, bad harvests, higher wages, indirect taxes and firms leaving the industry.",
    whenToDraw:
      "For supply-side shocks: energy price spikes, poor weather, new regulation, higher taxes on producers.",
    howToRead: [
      "Supply shifts left from S1 to S2.",
      "Excess demand at the old price pushes price up.",
      "Demand contracts along D to E2: price rises, quantity falls.",
    ],
    labelKeys: ["P", "Q", "D", "S1", "S2", "E1", "E2"],
    mistakes: [
      "Shifting demand left as well because 'people buy less' — that is a contraction, not a shift.",
    ],
    tips: ["Quantify where the data allows: examiners reward use of the source figures."],
    realWorld: [
      "The 2022 European gas supply shock raised wholesale energy prices sharply.",
    ],
    related: ["increase-in-supply", "indirect-tax"],
    examQuestions: [
      "Using a diagram, analyse the impact of a poor harvest on the market for wheat. [8]",
    ],
  },
  {
    id: "movement-along-demand",
    title: "Movement Along Demand",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [{ points: D, label: "D", tone: "demand" }],
      markers: [
        { at: [24, 72], label: "a" },
        { at: [66, 31], label: "b" },
      ],
      arrows: [{ from: [28, 68], to: [62, 36], label: "extension of demand" }],
    },
    represents:
      "A change in quantity demanded caused only by a change in the good's own price — the curve itself does not move.",
    whyUsed:
      "Cambridge tests the distinction between movements and shifts almost every session; getting it wrong destroys the rest of the analysis.",
    whenToDraw:
      "When the good's own price changes, for example after a tax, a supply shift, or a price control.",
    howToRead: [
      "From a to b price has fallen, so quantity demanded extends.",
      "From b to a price has risen, so quantity demanded contracts.",
      "Only price and quantity change; all other determinants are unchanged.",
    ],
    labelKeys: ["P", "Q", "D"],
    mistakes: [
      "Using the words 'increase in demand' for an extension.",
      "Shifting the curve when the own price changes.",
    ],
    tips: ["Use the precise vocabulary: extension/contraction for movements, increase/decrease for shifts."],
    realWorld: ["A supermarket price cut on bananas causes an extension of demand, not a new demand curve."],
    related: ["demand-curve", "movement-along-supply"],
    examQuestions: [
      "Explain the difference between an extension of demand and an increase in demand. [4]",
    ],
  },
  {
    id: "movement-along-supply",
    title: "Movement Along Supply",
    topic: "Demand & Supply",
    level: "AS",
    spec: {
      ...PQ,
      curves: [{ points: S, label: "S", tone: "supply", labelAt: [93, 88] }],
      markers: [
        { at: [24, 26], label: "a" },
        { at: [66, 67], label: "b" },
      ],
      arrows: [{ from: [28, 31], to: [62, 62], label: "extension of supply" }],
    },
    represents:
      "A change in quantity supplied caused only by a change in the good's own price.",
    whyUsed:
      "It separates price-induced responses from genuine changes in supply conditions.",
    whenToDraw:
      "Whenever a demand shift changes the market price and you must describe what happens on the supply side.",
    howToRead: [
      "A higher price makes extra output profitable, so supply extends from a to b.",
      "A lower price makes marginal units unprofitable, so supply contracts.",
    ],
    labelKeys: ["P", "Q", "S"],
    mistakes: ["Writing 'supply increases' when demand has risen — supply only extends."],
    tips: ["Pair this with elasticity: the flatter the supply curve the larger the extension."],
    realWorld: ["Ride-hailing drivers log on when surge pricing raises the fare per trip."],
    related: ["supply-curve", "movement-along-demand"],
    examQuestions: [
      "Distinguish, using a diagram, between a movement along and a shift in the supply curve. [6]",
    ],
  },

  /* --------------------------------- Elasticity --------------------------------- */
  {
    id: "price-elasticity-of-demand",
    title: "Price Elasticity of Demand",
    topic: "Elasticity",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        {
          points: [
            [34, 95],
            [58, 6],
          ],
          label: "D (inelastic)",
          tone: "demand",
          labelAt: [58, 12],
        },
        {
          points: [
            [4, 66],
            [92, 30],
          ],
          label: "D (elastic)",
          tone: "accent",
          labelAt: [66, 22],
        },
      ],
      notes: [{ at: [6, 92], text: "Same price fall, very different quantity response" }],
    },
    represents:
      "The responsiveness of quantity demanded to a change in the good's own price: PED = %ΔQd ÷ %ΔP.",
    whyUsed:
      "It determines what happens to total revenue, who bears a tax, and how effective a price change or price control will be.",
    whenToDraw:
      "In questions on pricing decisions, indirect taxes, revenue, primary product price volatility, and exchange rate effects.",
    howToRead: [
      "The steeper curve is price inelastic (PED between 0 and −1): quantity changes proportionately less than price.",
      "The flatter curve is price elastic (PED more negative than −1): quantity changes proportionately more.",
      "For an inelastic good, a price rise raises total revenue; for an elastic good it lowers total revenue.",
      "Determinants: substitutes available, necessity vs luxury, proportion of income, time period, habit/addiction.",
    ],
    labelKeys: ["P", "Q", "D"],
    mistakes: [
      "Saying a curve 'is elastic' rather than 'is more price elastic over this range' — PED varies along a straight line.",
      "Ignoring the negative sign or misinterpreting its meaning.",
    ],
    tips: [
      "Always link PED to a decision: revenue, tax incidence, or the size of a price change.",
      "Quote the numerical value if the data gives one.",
    ],
    realWorld: [
      "Cigarettes are price inelastic, which is why tobacco taxes raise substantial revenue.",
      "A single airline's economy seats are price elastic because rivals are close substitutes.",
    ],
    related: ["indirect-tax", "income-elasticity-of-demand", "price-elasticity-of-supply"],
    examQuestions: [
      "Explain why knowledge of PED is useful to a firm setting price. [8]",
      "Discuss whether an indirect tax on a price inelastic good is an effective way to raise revenue. [12]",
    ],
  },
  {
    id: "income-elasticity-of-demand",
    title: "Income Elasticity of Demand",
    topic: "Elasticity",
    level: "AS",
    spec: {
      xLabel: "Quantity demanded",
      yLabel: "Income",
      curves: [
        {
          points: [
            [8, 8],
            [86, 90],
          ],
          label: "Normal good (YED > 0)",
          tone: "supply",
          labelAt: [46, 88],
        },
        {
          points: [
            [8, 90],
            [70, 20],
          ],
          label: "Inferior good (YED < 0)",
          tone: "warn",
          labelAt: [46, 18],
        },
      ],
    },
    represents:
      "The responsiveness of demand to a change in real income: YED = %ΔQd ÷ %ΔY.",
    whyUsed:
      "It classifies goods as normal, luxury or inferior and lets firms and governments forecast demand over the trade cycle.",
    whenToDraw:
      "In questions on economic growth, recession, living standards, and business planning.",
    howToRead: [
      "A positively sloped line is a normal good: demand rises with income.",
      "YED greater than +1 is income elastic — a luxury; between 0 and +1 is a necessity.",
      "A negatively sloped line is an inferior good: demand falls as income rises.",
    ],
    labelKeys: ["Q"],
    labelOverrides: {
      Q: "Quantity demanded per period — here plotted against income rather than price, because the own price is held constant.",
    },
    mistakes: [
      "Putting price on the vertical axis: for YED the vertical axis is income.",
      "Treating 'inferior' as 'poor quality' — it is defined only by the sign of YED.",
    ],
    tips: ["Use YED to evaluate: a firm selling luxuries is far more exposed to a recession."],
    realWorld: [
      "Long-haul holidays have a high positive YED; supermarket own-brand basics are inferior goods.",
    ],
    related: ["price-elasticity-of-demand", "cross-elasticity-of-demand"],
    examQuestions: [
      "Explain how YED can be used to classify goods, giving examples. [8]",
    ],
  },
  {
    id: "cross-elasticity-of-demand",
    title: "Cross Elasticity of Demand",
    topic: "Elasticity",
    level: "AS",
    spec: {
      xLabel: "Quantity demanded of good A",
      yLabel: "Price of good B",
      curves: [
        {
          points: [
            [8, 8],
            [86, 90],
          ],
          label: "Substitutes (XED > 0)",
          tone: "supply",
          labelAt: [40, 88],
        },
        {
          points: [
            [8, 90],
            [70, 20],
          ],
          label: "Complements (XED < 0)",
          tone: "warn",
          labelAt: [40, 16],
        },
      ],
    },
    represents:
      "The responsiveness of demand for one good to a change in the price of another: XED = %ΔQd of A ÷ %ΔP of B.",
    whyUsed:
      "It measures how closely goods are related, which matters for pricing strategy, competition policy and market definition.",
    whenToDraw:
      "In questions about rival products, joint demand, or the market power of a firm.",
    howToRead: [
      "A positive XED means the goods are substitutes: B dearer, more of A demanded.",
      "A negative XED means the goods are complements: B dearer, less of A demanded.",
      "The larger the absolute value, the closer the relationship.",
    ],
    labelKeys: ["Q", "P"],
    labelOverrides: {
      P: "Price of the OTHER good (good B) — the whole point of XED is that the causing price is not the good's own price.",
      Q: "Quantity demanded of good A, the good whose demand is being measured.",
    },
    mistakes: [
      "Using the good's own price instead of the other good's price.",
      "Ignoring the sign, which is what identifies the relationship.",
    ],
    tips: ["A near-zero XED means unrelated goods — useful evidence in a monopoly question."],
    realWorld: [
      "Coffee and tea are substitutes (positive XED); printers and ink cartridges are complements (negative XED).",
    ],
    related: ["price-elasticity-of-demand", "monopoly"],
    examQuestions: [
      "Explain how a firm could use XED when deciding whether to change its price. [6]",
    ],
  },
  {
    id: "price-elasticity-of-supply",
    title: "Price Elasticity of Supply",
    topic: "Elasticity",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        {
          points: [
            [30, 6],
            [52, 95],
          ],
          label: "S (inelastic)",
          tone: "supply",
          labelAt: [52, 92],
        },
        {
          points: [
            [6, 26],
            [92, 62],
          ],
          label: "S (elastic)",
          tone: "accent",
          labelAt: [70, 66],
        },
      ],
    },
    represents:
      "The responsiveness of quantity supplied to a change in price: PES = %ΔQs ÷ %ΔP.",
    whyUsed:
      "It determines how much of a demand increase shows up as higher prices rather than higher output, and how quickly markets adjust.",
    whenToDraw:
      "In questions on primary commodities, housing, agriculture, spare capacity, and short run versus long run.",
    howToRead: [
      "The steeper curve is price inelastic supply: output responds little, so demand shocks mainly move price.",
      "The flatter curve is elastic supply: output responds strongly, so price moves little.",
      "Determinants: spare capacity, stocks, mobility of factors, time period, ease of entry.",
    ],
    labelKeys: ["P", "Q", "S"],
    mistakes: [
      "Assuming supply is always inelastic in the short run without justifying it with capacity or production lags.",
    ],
    tips: ["Use PES to evaluate price volatility in agricultural and commodity markets."],
    realWorld: [
      "Housing supply is highly price inelastic in the short run because building takes years.",
    ],
    related: ["price-elasticity-of-demand", "increase-in-demand"],
    examQuestions: [
      "Explain why the supply of agricultural products tends to be price inelastic in the short run. [6]",
    ],
  },

  /* --------------------------- Government intervention --------------------------- */
  {
    id: "indirect-tax",
    title: "Indirect Tax",
    topic: "Government Intervention",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
        { points: S_LEFT, label: "S+tax", tone: "warn", dashed: true, labelAt: [66, 96] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_DEAR, label: "E2", labelOffset: [-13, 3] },
      ],
      shades: [
        {
          points: [
            [0, 41],
            [40, 41],
            [40, 57],
            [0, 57],
          ],
          label: "Tax revenue",
          tone: "warn",
          labelAt: [20, 48],
        },
      ],
      yTicks: [
        { at: 57, label: "P2" },
        { at: 49, label: "P1" },
        { at: 41, label: "P2−tax" },
      ],
      xTicks: [{ at: 40, label: "Q2" }],
    },
    represents:
      "A per-unit (specific) tax on producers, shown as a vertical upward shift of supply equal to the tax.",
    whyUsed:
      "It shows the effect on price, output, tax revenue and the split of the tax burden between consumers and producers.",
    whenToDraw:
      "For questions on taxes on demerit goods, revenue raising, or correcting negative externalities.",
    howToRead: [
      "Supply shifts up vertically by the tax per unit to S+tax.",
      "Price rises from P1 to P2, but by less than the full tax; quantity falls to Q2.",
      "Consumers bear P2 − P1 per unit; producers bear P1 − (P2 − tax).",
      "Tax revenue is the shaded rectangle: tax per unit × Q2.",
      "Incidence depends on relative elasticities: the more inelastic side bears more.",
    ],
    labelKeys: ["P", "Q", "D", "S", "S+tax", "P1", "P2", "Q2"],
    mistakes: [
      "Shifting demand instead of supply for a tax on producers.",
      "Showing price rising by the full amount of the tax.",
      "Drawing the shift as a rotation instead of a parallel shift for a specific tax.",
    ],
    tips: [
      "An ad valorem tax pivots supply (a widening gap); a specific tax shifts it in parallel — say which you have drawn.",
      "Always shade and label the tax revenue rectangle.",
    ],
    realWorld: [
      "Excise duties on tobacco, alcohol and fuel; sugar levies on soft drinks.",
    ],
    related: ["subsidy", "negative-externalities", "price-elasticity-of-demand", "deadweight-welfare-loss"],
    examQuestions: [
      "Using a diagram, analyse how the burden of an indirect tax is shared between consumers and producers. [8]",
      "Discuss whether indirect taxation is the best way to reduce consumption of a demerit good. [12]",
    ],
  },
  {
    id: "subsidy",
    title: "Subsidy",
    topic: "Government Intervention",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
        { points: S_RIGHT, label: "S+subsidy", tone: "accent", dashed: true, labelAt: [86, 74] },
      ],
      markers: [
        { at: E, label: "E1" },
        { at: E_CHEAP, label: "E2" },
      ],
      shades: [
        {
          points: [
            [0, 41],
            [56, 41],
            [56, 57],
            [0, 57],
          ],
          label: "Cost to government",
          tone: "primary",
          labelAt: [26, 48],
        },
      ],
      yTicks: [
        { at: 57, label: "P+sub" },
        { at: 49, label: "P1" },
        { at: 41, label: "P2" },
      ],
      xTicks: [{ at: 56, label: "Q2" }],
    },
    represents:
      "A per-unit payment to producers, shown as a vertical downward shift of supply equal to the subsidy.",
    whyUsed:
      "It shows how governments raise consumption of merit goods or support producers, and what it costs the taxpayer.",
    whenToDraw:
      "For merit goods, positive externalities, infant industries, or affordability questions.",
    howToRead: [
      "Supply shifts down by the subsidy per unit; price falls to P2 and quantity rises to Q2.",
      "Consumers gain P1 − P2 per unit; producers receive P2 + subsidy.",
      "The shaded rectangle is total government spending: subsidy per unit × Q2.",
      "The more inelastic demand is, the more of the benefit goes to producers.",
    ],
    labelKeys: ["P", "Q", "D", "S", "S+subsidy", "P1", "P2", "Q2"],
    mistakes: [
      "Shifting demand right instead of supply down.",
      "Forgetting the opportunity cost of the subsidy in evaluation.",
    ],
    tips: [
      "Show the vertical distance of the shift equals the subsidy and label it clearly.",
      "Evaluate with opportunity cost, producer inefficiency, and whether the subsidy reaches the target group.",
    ],
    realWorld: [
      "Solar feed-in tariffs, agricultural support under the CAP, subsidised public transport fares.",
    ],
    related: ["indirect-tax", "positive-externalities", "merit-goods"],
    examQuestions: [
      "Analyse, using a diagram, the effects of a subsidy on the market for public transport. [8]",
    ],
  },
  {
    id: "maximum-price",
    title: "Maximum Price",
    topic: "Government Intervention",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
        {
          points: [
            [0, 34],
            [92, 34],
          ],
          label: "Pmax",
          tone: "warn",
          labelAt: [93, 34],
        },
      ],
      markers: [{ at: E, label: "E" }],
      arrows: [{ from: [32, 26], to: [63, 26], label: "shortage" }],
      xTicks: [
        { at: 32, label: "Qs" },
        { at: 63, label: "Qd" },
      ],
      yTicks: [{ at: 49, label: "Pe" }],
    },
    represents:
      "A legally imposed price ceiling set below the free-market equilibrium price.",
    whyUsed:
      "It shows the affordability gain and the resulting shortage, rationing problem and possible parallel market.",
    whenToDraw: "For rent controls, food price caps, energy price caps, and fare caps.",
    howToRead: [
      "At Pmax quantity demanded is Qd but quantity supplied is only Qs.",
      "The horizontal distance Qs to Qd is excess demand — a shortage.",
      "Price cannot rise to clear the market, so non-price rationing (queues, waiting lists) or a black market appears.",
      "The policy only binds if Pmax lies below Pe.",
    ],
    labelKeys: ["P", "Q", "D", "S", "Pmax", "Pe"],
    mistakes: [
      "Drawing the maximum price above equilibrium, where it has no effect.",
      "Labelling the shortage vertically instead of horizontally.",
    ],
    tips: [
      "Evaluate: who gains (those who can buy at the low price) and who loses (those rationed out).",
    ],
    realWorld: ["Rent controls in Berlin and New York; the UK domestic energy price cap."],
    related: ["minimum-price", "market-equilibrium", "consumer-surplus"],
    examQuestions: [
      "Discuss whether a maximum price is an effective way of making housing affordable. [12]",
    ],
  },
  {
    id: "minimum-price",
    title: "Minimum Price",
    topic: "Government Intervention",
    level: "AS",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D", tone: "demand" },
        { points: S, label: "S", tone: "supply", labelAt: [93, 88] },
        {
          points: [
            [0, 64],
            [92, 64],
          ],
          label: "Pmin",
          tone: "warn",
          labelAt: [93, 64],
        },
      ],
      markers: [{ at: E, label: "E" }],
      arrows: [{ from: [32, 72], to: [63, 72], label: "surplus" }],
      xTicks: [
        { at: 32, label: "Qd" },
        { at: 63, label: "Qs" },
      ],
      yTicks: [{ at: 49, label: "Pe" }],
    },
    represents: "A legally imposed price floor set above the free-market equilibrium price.",
    whyUsed:
      "It shows guaranteed incomes or reduced consumption, and the surplus the government may have to buy or store.",
    whenToDraw:
      "For minimum wages, agricultural price support, and minimum unit pricing of alcohol.",
    howToRead: [
      "At Pmin quantity supplied Qs exceeds quantity demanded Qd.",
      "The horizontal gap is excess supply — a surplus.",
      "The government may buy the surplus (a further cost) or the surplus is wasted.",
      "It only binds if Pmin lies above Pe.",
    ],
    labelKeys: ["P", "Q", "D", "S", "Pmin", "Pe"],
    mistakes: [
      "Setting Pmin below equilibrium so the policy does nothing.",
      "Forgetting that a minimum wage creates excess supply of labour, i.e. unemployment.",
    ],
    tips: ["Evaluate using elasticity: an inelastic demand means only a small fall in quantity."],
    realWorld: ["Minimum unit pricing of alcohol in Scotland; EU intervention prices for dairy."],
    related: ["maximum-price", "labour-market", "wage-determination"],
    examQuestions: [
      "Using a diagram, explain the likely consequences of a minimum price for alcohol. [8]",
    ],
  },
  {
    id: "consumer-surplus",
    title: "Consumer Surplus",
    topic: "Government Intervention",
    level: "AS",
    spec: market({
      markers: [{ at: E, label: "E" }],
      shades: [
        {
          points: [
            [0, 95],
            [48, 49],
            [0, 49],
          ],
          label: "CS",
          tone: "primary",
          labelAt: [13, 66],
        },
      ],
      yTicks: [{ at: 49, label: "Pe" }],
      xTicks: [{ at: 48, label: "Qe" }],
    }),
    represents:
      "The difference between the maximum consumers were willing to pay and what they actually pay, shown as the area under D and above price.",
    whyUsed:
      "It is the standard welfare measure for consumers and is needed for any discussion of efficiency, taxes, subsidies or monopoly.",
    whenToDraw:
      "Whenever a question asks about consumer welfare, the effect of a price change, or deadweight loss.",
    howToRead: [
      "Each point on D shows a consumer's maximum willingness to pay.",
      "All units up to Qe are bought at Pe, so every consumer above Pe gains.",
      "The triangle between D and the price line is total consumer surplus.",
      "A lower price enlarges the triangle; a higher price shrinks it.",
    ],
    labelKeys: ["P", "Q", "D", "S", "CS", "Pe", "Qe"],
    mistakes: [
      "Shading below the price line instead of above it.",
      "Confusing consumer surplus with total expenditure.",
    ],
    tips: ["Shade neatly and label CS; examiners often award a mark for correct identification."],
    realWorld: ["Cheap flights generate large consumer surplus for travellers who would have paid far more."],
    related: ["producer-surplus", "deadweight-welfare-loss", "monopoly"],
    examQuestions: ["Explain, using a diagram, what is meant by consumer surplus. [6]"],
  },
  {
    id: "producer-surplus",
    title: "Producer Surplus",
    topic: "Government Intervention",
    level: "AS",
    spec: market({
      markers: [{ at: E, label: "E" }],
      shades: [
        {
          points: [
            [0, 3],
            [48, 49],
            [0, 49],
          ],
          label: "PS",
          tone: "warn",
          labelAt: [13, 28],
        },
      ],
      yTicks: [{ at: 49, label: "Pe" }],
      xTicks: [{ at: 48, label: "Qe" }],
    }),
    represents:
      "The difference between the price producers receive and the minimum they would have accepted, shown as the area above S and below price.",
    whyUsed:
      "It measures producer welfare and, with consumer surplus, gives total community surplus — the basis of allocative efficiency.",
    whenToDraw:
      "In welfare analysis of taxes, subsidies, price controls and market structures.",
    howToRead: [
      "The supply curve shows the minimum acceptable price for each unit (its marginal cost).",
      "All units are sold at Pe, so producers gain on every unit whose marginal cost is below Pe.",
      "The triangle between the price line and S is total producer surplus.",
    ],
    labelKeys: ["P", "Q", "D", "S", "PS", "Pe", "Qe"],
    mistakes: [
      "Shading above the price line (that is consumer surplus).",
      "Calling producer surplus 'profit' — it is revenue minus variable cost, not minus total cost.",
    ],
    tips: ["CS + PS = community surplus; maximised at the allocatively efficient output."],
    realWorld: ["Low-cost oil producers earn very large producer surplus when world prices spike."],
    related: ["consumer-surplus", "deadweight-welfare-loss"],
    examQuestions: ["Using a diagram, explain how a subsidy affects producer surplus. [8]"],
  },
  {
    id: "deadweight-welfare-loss",
    title: "Deadweight Welfare Loss",
    topic: "Government Intervention",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "D = MSB", tone: "demand" },
        { points: S, label: "S = MSC", tone: "supply", labelAt: [93, 88] },
        { points: S_LEFT, label: "S+tax", tone: "warn", dashed: true, labelAt: [66, 96] },
      ],
      markers: [{ at: E, label: "E (optimum)", labelOffset: [2, 4] }],
      shades: [
        {
          points: [
            [40, 57],
            [48, 49],
            [40, 41],
          ],
          label: "DWL",
          tone: "danger",
          labelAt: [30, 49],
        },
      ],
      xTicks: [
        { at: 40, label: "Q2" },
        { at: 48, label: "Qe" },
      ],
    },
    represents:
      "The loss of community surplus when output is pushed away from the allocatively efficient level where MSB = MSC.",
    whyUsed:
      "It is the standard way to show the efficiency cost of taxes, subsidies, price controls, monopoly and externalities.",
    whenToDraw:
      "Whenever an intervention or market failure moves output away from the social optimum.",
    howToRead: [
      "At the optimum Qe, MSB = MSC and community surplus is maximised.",
      "Restricting output to Q2 means units between Q2 and Qe valued above their cost are no longer produced.",
      "The welfare triangle between MSB and MSC over those units is the deadweight loss.",
      "Its size grows with the size of the distortion and with elasticity.",
    ],
    labelKeys: ["P", "Q", "D", "S", "MSB", "MSC", "DWL"],
    mistakes: [
      "Shading a rectangle instead of a triangle.",
      "Confusing deadweight loss with tax revenue — revenue is a transfer, not a loss.",
    ],
    tips: ["Say explicitly which units are lost and why society valued them above their cost."],
    realWorld: ["Studies of monopoly pricing in pharmaceuticals estimate substantial deadweight losses."],
    related: ["indirect-tax", "monopoly", "negative-externalities"],
    examQuestions: [
      "Explain, using a diagram, what is meant by deadweight welfare loss. [8]",
    ],
  },

  /* -------------------------------- Market failure -------------------------------- */
  {
    id: "negative-externalities",
    title: "Negative Externalities",
    topic: "Market Failure",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MPB = MSB", tone: "demand" },
        { points: S, label: "MPC", tone: "supply", labelAt: [93, 88] },
        { points: S_LEFT, label: "MSC", tone: "warn", dashed: true, labelAt: [70, 96] },
      ],
      markers: [
        { at: E, label: "Qp", labelOffset: [2, 3] },
        { at: E_DEAR, label: "Qs", labelOffset: [-11, 3] },
      ],
      shades: [
        {
          points: [
            [40, 57],
            [48, 49],
            [48, 65],
          ],
          label: "Welfare loss",
          tone: "danger",
          labelAt: [62, 62],
        },
      ],
      arrows: [{ from: [20, 22], to: [20, 38], label: "MEC" }],
      xTicks: [
        { at: 40, label: "Qs" },
        { at: 48, label: "Qp" },
      ],
    },
    represents:
      "A negative externality in production: MSC lies above MPC because third parties bear an external cost.",
    whyUsed:
      "It is the core market-failure diagram, showing over-production and the resulting welfare loss.",
    whenToDraw:
      "For pollution, congestion, and any question asking why a free market over-produces a good.",
    howToRead: [
      "The free market equilibrium is at Qp where MPB = MPC — firms ignore the external cost.",
      "The social optimum is Qs where MSB = MSC.",
      "Because Qp > Qs there is over-production and over-consumption.",
      "The shaded triangle between MSC and MSB over the excess units is the welfare loss.",
      "The vertical gap between MSC and MPC is the marginal external cost.",
    ],
    labelKeys: ["P", "Q", "MPC", "MSC", "MPB", "MSB", "MEC", "Qp", "Qs"],
    mistakes: [
      "Drawing MSC below MPC.",
      "Placing the welfare loss triangle on the wrong side of the optimum.",
      "Confusing external costs in production with external costs in consumption.",
    ],
    tips: [
      "Say which units are over-produced and by how much, then link to the policy remedy (tax equal to MEC at Qs).",
    ],
    realWorld: ["Coal-fired power generation, road congestion, industrial water pollution."],
    related: ["positive-externalities", "indirect-tax", "demerit-goods", "deadweight-welfare-loss"],
    examQuestions: [
      "Using a diagram, explain how negative externalities cause market failure. [8]",
      "Discuss the effectiveness of taxation in correcting negative externalities. [12]",
    ],
  },
  {
    id: "positive-externalities",
    title: "Positive Externalities",
    topic: "Market Failure",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MPB", tone: "demand" },
        { points: D_RIGHT, label: "MSB", tone: "accent", dashed: true, labelAt: [93, 24] },
        { points: S, label: "MPC = MSC", tone: "supply", labelAt: [93, 88] },
      ],
      markers: [
        { at: E, label: "Qp" },
        { at: E_HIGH, label: "Qs" },
      ],
      shades: [
        {
          points: [
            [48, 49],
            [56, 57],
            [48, 65],
          ],
          label: "Welfare gain forgone",
          tone: "primary",
          labelAt: [66, 70],
        },
      ],
      arrows: [{ from: [24, 62], to: [24, 78], label: "MEB" }],
      xTicks: [
        { at: 48, label: "Qp" },
        { at: 56, label: "Qs" },
      ],
    },
    represents:
      "A positive externality in consumption: MSB lies above MPB because third parties gain an external benefit.",
    whyUsed:
      "It shows why free markets under-provide goods such as education, healthcare and vaccination.",
    whenToDraw:
      "For merit goods, vaccination, training, R&D spillovers and any under-consumption question.",
    howToRead: [
      "The market settles at Qp where MPB = MPC, ignoring the external benefit.",
      "The social optimum is Qs where MSB = MSC, so the market under-produces.",
      "The shaded triangle is the potential welfare gain that is lost.",
      "The vertical gap between MSB and MPB is the marginal external benefit.",
    ],
    labelKeys: ["P", "Q", "MPB", "MSB", "MPC", "MSC", "MEB", "Qp", "Qs"],
    mistakes: [
      "Shifting MSC instead of MSB for an externality in consumption.",
      "Saying the market 'over-produces' — with positive externalities it under-produces.",
    ],
    tips: ["Link the size of the subsidy needed to the MEB at the social optimum."],
    realWorld: ["Vaccination programmes, state education, employer training schemes."],
    related: ["negative-externalities", "merit-goods", "subsidy"],
    examQuestions: [
      "Explain, using a diagram, why a good with positive externalities is under-consumed. [8]",
    ],
  },
  {
    id: "merit-goods",
    title: "Merit Goods",
    topic: "Market Failure",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MPB (perceived)", tone: "demand" },
        { points: D_RIGHT, label: "MSB (true)", tone: "accent", dashed: true, labelAt: [93, 24] },
        { points: S, label: "MSC", tone: "supply", labelAt: [93, 88] },
      ],
      markers: [
        { at: E, label: "Qp" },
        { at: E_HIGH, label: "Qs" },
      ],
      notes: [{ at: [4, 92], text: "Information failure: consumers undervalue the benefit" }],
      xTicks: [
        { at: 48, label: "Qp" },
        { at: 56, label: "Qs" },
      ],
    },
    represents:
      "A good that is under-consumed because consumers undervalue its private benefit (information failure) and because it generates external benefits.",
    whyUsed:
      "It separates the value judgement about merit goods from the technical externality argument.",
    whenToDraw:
      "For education, healthcare, pensions, insurance and any 'people don't realise how good it is for them' question.",
    howToRead: [
      "Perceived MPB lies below true MSB, so consumption stops at Qp.",
      "The socially desirable level is Qs where MSB = MSC.",
      "Government responds with subsidy, direct provision, regulation or information campaigns.",
    ],
    labelKeys: ["P", "Q", "MPB", "MSB", "MSC", "Qp", "Qs"],
    mistakes: [
      "Treating merit goods as public goods — merit goods are rival and excludable.",
      "Ignoring the value-judgement element, which is a strong evaluation point.",
    ],
    tips: ["Evaluate paternalism: who decides what is 'meritorious'?"],
    realWorld: ["Free school meals, subsidised dental check-ups, compulsory education."],
    related: ["positive-externalities", "demerit-goods", "public-goods", "subsidy"],
    examQuestions: [
      "Explain why merit goods are under-consumed in a free market. [8]",
      "Discuss whether governments should provide merit goods free of charge. [12]",
    ],
  },
  {
    id: "demerit-goods",
    title: "Demerit Goods",
    topic: "Market Failure",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MPB (perceived)", tone: "demand" },
        { points: D_LEFT, label: "MSB (true)", tone: "warn", dashed: true, labelAt: [81, 6] },
        { points: S, label: "MSC", tone: "supply", labelAt: [93, 88] },
      ],
      markers: [
        { at: E, label: "Qp" },
        { at: E_LOWQ, label: "Qs", labelOffset: [-11, 3] },
      ],
      notes: [{ at: [4, 92], text: "Consumers overvalue the private benefit" }],
      xTicks: [
        { at: 40, label: "Qs" },
        { at: 48, label: "Qp" },
      ],
    },
    represents:
      "A good that is over-consumed because consumers overvalue its private benefit and it generates external costs.",
    whyUsed:
      "It underpins every question on tobacco, alcohol, gambling, junk food and sugar taxes.",
    whenToDraw:
      "When a question involves harmful consumption, addiction or imperfect information.",
    howToRead: [
      "Perceived MPB lies above true MSB, so consumption is Qp, above the optimum Qs.",
      "The market therefore over-allocates resources to the good.",
      "Policy remedies: indirect taxes, minimum pricing, advertising bans, education.",
    ],
    labelKeys: ["P", "Q", "MPB", "MSB", "MSC", "Qp", "Qs"],
    mistakes: [
      "Drawing MSB above MPB for a demerit good — it is below.",
      "Ignoring addiction, which makes demand price inelastic and weakens taxation.",
    ],
    tips: ["Combine with PED: inelastic demand means a tax raises revenue but cuts consumption little."],
    realWorld: ["Tobacco duty, the UK soft drinks industry levy, gambling restrictions."],
    related: ["merit-goods", "negative-externalities", "indirect-tax"],
    examQuestions: [
      "Discuss whether taxation is the most effective policy for reducing consumption of demerit goods. [12]",
    ],
  },
  {
    id: "public-goods",
    title: "Public Goods",
    topic: "Market Failure",
    level: "AS & A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MSB (true social value)", tone: "accent" },
        {
          points: [
            [0, 3],
            [0, 95],
          ],
          label: "Market D = 0",
          tone: "warn",
          labelAt: [3, 92],
        },
        { points: S, label: "MSC", tone: "supply", labelAt: [93, 88] },
      ],
      notes: [
        { at: [16, 40], text: "Free-rider problem: no effective market demand" },
        { at: [16, 32], text: "Qmarket = 0, so the state must provide" },
      ],
    },
    represents:
      "A good that is non-rival and non-excludable, so private firms cannot charge and the free market provides none of it.",
    whyUsed:
      "It explains complete market failure and the case for state provision funded by taxation.",
    whenToDraw:
      "For national defence, street lighting, flood defences, lighthouses and policing.",
    howToRead: [
      "Non-rivalry means one person's consumption does not reduce the amount available to others.",
      "Non-excludability means free riders cannot be prevented from consuming.",
      "Because no one will pay voluntarily, effective market demand is zero and output is zero.",
      "Society still values the good (MSB), so the optimum is positive and government must provide it.",
    ],
    labelKeys: ["P", "Q", "MSB", "MSC"],
    mistakes: [
      "Calling any government-provided good a public good — health and education are merit goods.",
      "Forgetting to state both characteristics (non-rival AND non-excludable).",
    ],
    tips: ["Use quasi-public goods (roads, beaches) as an excellent evaluation point."],
    realWorld: ["National defence, sea walls, street lighting, public broadcasting signals."],
    related: ["merit-goods", "common-access-resources"],
    examQuestions: [
      "Explain why public goods are not provided by the free market. [8]",
    ],
  },
  {
    id: "common-access-resources",
    title: "Common Access Resources",
    topic: "Market Failure",
    level: "A Level",
    spec: {
      ...PQ,
      curves: [
        { points: D, label: "MPB = MSB", tone: "demand" },
        { points: S, label: "MPC (private)", tone: "supply", labelAt: [93, 88] },
        { points: S_LEFT, label: "MSC (incl. depletion)", tone: "warn", dashed: true, labelAt: [64, 96] },
      ],
      markers: [
        { at: E, label: "Q actual" },
        { at: E_DEAR, label: "Q sustainable", labelOffset: [-30, 4] },
      ],
      notes: [{ at: [6, 12], text: "Tragedy of the commons: over-extraction" }],
    },
    represents:
      "Resources that are rival but non-excludable — ocean fisheries, rainforests, the atmosphere — which are over-exploited because users ignore the depletion cost.",
    whyUsed:
      "It formalises the tragedy of the commons and links market failure to sustainability.",
    whenToDraw:
      "For fishing, deforestation, groundwater, and climate questions at A Level.",
    howToRead: [
      "Each user faces only MPC, so extraction settles where MPB = MPC.",
      "MSC includes the cost of depleting the stock for everyone else, so the sustainable level is lower.",
      "The gap between the two outputs is over-extraction, which can destroy the resource entirely.",
      "Remedies: property rights, quotas, tradable permits, international agreements.",
    ],
    labelKeys: ["P", "Q", "MPC", "MSC", "MPB", "MSB"],
    mistakes: [
      "Treating common access resources as public goods — they ARE rival.",
      "Ignoring enforcement problems in evaluation.",
    ],
    tips: ["Property rights (Coase) is the strongest evaluation contrast with taxation."],
    realWorld: ["North Atlantic cod collapse; Amazon deforestation; global fish stocks."],
    related: ["public-goods", "negative-externalities"],
    examQuestions: [
      "Discuss policies to prevent the over-exploitation of common access resources. [12]",
    ],
  },

  /* -------------------------------- Market structure -------------------------------- */
  {
    id: "perfect-competition",
    title: "Perfect Competition",
    topic: "Market Structure",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Costs / Revenue",
      curves: [
        { points: uShape(52, 40, 40, 44), label: "AC", tone: "cost", labelAt: [92, 78] },
        {
          points: [
            [16, 22],
            [40, 30],
            [58, 46],
            [76, 84],
            [86, 96],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [86, 96],
        },
        {
          points: [
            [0, 55],
            [92, 55],
          ],
          label: "AR = MR = D = P",
          tone: "supply",
          labelAt: [46, 58],
        },
      ],
      markers: [{ at: [64, 55], label: "profit max: MC = MR", labelOffset: [-24, 8] }],
      xTicks: [{ at: 64, label: "Q" }],
      yTicks: [{ at: 55, label: "P" }],
      notes: [{ at: [4, 12], text: "Long run: AR = AC, so only normal profit" }],
    },
    represents:
      "A price-taking firm in a market with many buyers and sellers, a homogeneous product, perfect information and free entry and exit.",
    whyUsed:
      "It is the efficiency benchmark against which monopoly and other structures are judged.",
    whenToDraw:
      "For questions on price takers, efficiency, or long-run equilibrium and the role of entry and exit.",
    howToRead: [
      "The firm's demand curve is horizontal at the market price, so AR = MR = P.",
      "Output is set where MC = MR, and MC cuts AC at its minimum.",
      "In the long run entry competes away abnormal profit until AR = AC: only normal profit remains.",
      "P = MC gives allocative efficiency and production at minimum AC gives productive efficiency.",
    ],
    labelKeys: ["Q", "P", "MC", "AC", "AR", "MR", "AR=MR=D=P"],
    labelOverrides: {
      Q: "Output of the individual firm per period — note this is the firm, not the whole industry.",
      P: "The market price, which the firm takes as given because it is too small to influence it.",
    },
    mistakes: [
      "Drawing a downward-sloping AR for a perfectly competitive firm.",
      "Forgetting that MC must cut AC at AC's minimum point.",
      "Showing abnormal profit in the long run.",
    ],
    tips: [
      "Say whether you are drawing the short run (abnormal profit or loss possible) or the long run (normal profit only).",
    ],
    realWorld: ["Foreign exchange trading and some agricultural commodity markets come close."],
    related: ["monopoly", "contestable-markets", "average-cost", "marginal-revenue"],
    examQuestions: [
      "Using diagrams, explain how a perfectly competitive firm moves from short-run abnormal profit to long-run equilibrium. [12]",
    ],
  },
  {
    id: "monopoly",
    title: "Monopoly",
    topic: "Market Structure",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Costs / Revenue",
      curves: [
        {
          points: [
            [0, 92],
            [92, 12],
          ],
          label: "AR = D",
          tone: "demand",
          labelAt: [80, 22],
        },
        {
          points: [
            [0, 92],
            [46, 12],
          ],
          label: "MR",
          tone: "revenue",
          labelAt: [40, 8],
        },
        { points: uShape(52, 34, 40, 40), label: "AC", tone: "cost", labelAt: [92, 72] },
        {
          points: [
            [16, 20],
            [38, 26],
            [56, 42],
            [76, 80],
            [86, 95],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [86, 95],
        },
      ],
      markers: [{ at: [34, 62], label: "Pm", labelOffset: [-14, 4], guides: "y" }],
      shades: [
        {
          points: [
            [0, 62],
            [34, 62],
            [34, 38],
            [0, 38],
          ],
          label: "Abnormal profit",
          tone: "primary",
          labelAt: [17, 50],
        },
      ],
      xTicks: [{ at: 34, label: "Qm" }],
    },
    represents:
      "A single seller facing the whole market demand curve, protected by high barriers to entry, choosing output where MC = MR.",
    whyUsed:
      "It shows higher price, lower output and abnormal profit sustained in the long run, and the resulting efficiency loss.",
    whenToDraw:
      "For questions on market power, price discrimination, regulation, and comparisons with perfect competition.",
    howToRead: [
      "Because the firm must lower price to sell more, MR lies below AR and falls twice as fast.",
      "Profit-maximising output Qm is where MC = MR; read the price up to AR to get Pm.",
      "Abnormal profit is the rectangle (AR − AC) × Qm and persists because barriers block entry.",
      "P > MC means allocative inefficiency and a deadweight welfare loss.",
    ],
    labelKeys: ["Q", "P", "AR", "MR", "AC", "MC", "Qm", "Pm", "Profit"],
    mistakes: [
      "Reading the price off the MC = MR intersection instead of up to AR.",
      "Drawing MR above AR, or MR with the same gradient as AR.",
      "Assuming monopoly always harms consumers — dynamic efficiency is the key evaluation.",
    ],
    tips: [
      "Always project vertically from MC = MR up to AR, then across to the price axis — examiners look for this.",
    ],
    realWorld: ["Utility networks, patented pharmaceuticals, national rail infrastructure."],
    related: ["natural-monopoly", "monopoly-profit-maximisation", "perfect-competition", "deadweight-welfare-loss"],
    examQuestions: [
      "Using a diagram, explain how a monopolist determines price and output. [8]",
      "Discuss whether monopoly is always against the consumer interest. [12]",
    ],
  },
  {
    id: "natural-monopoly",
    title: "Natural Monopoly",
    topic: "Market Structure",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Costs / Revenue",
      curves: [
        {
          points: [
            [10, 90],
            [16, 66],
            [26, 50],
            [40, 39],
            [58, 31],
            [80, 26],
            [92, 24],
          ],
          label: "LRAC",
          tone: "cost",
          labelAt: [80, 30],
        },
        {
          points: [
            [10, 44],
            [92, 12],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [80, 10],
        },
        {
          points: [
            [4, 88],
            [76, 14],
          ],
          label: "AR = D",
          tone: "demand",
          labelAt: [66, 22],
        },
      ],
      notes: [
        { at: [26, 92], text: "Demand cuts LRAC while it is still falling" },
        { at: [26, 84], text: "→ one firm supplies the market at lowest cost" },
      ],
    },
    represents:
      "An industry where economies of scale are so large relative to demand that a single firm can supply the whole market at lower average cost than several firms.",
    whyUsed:
      "It justifies regulated monopoly or state ownership rather than forced competition.",
    whenToDraw:
      "For water, gas and electricity networks, rail track and other network utilities.",
    howToRead: [
      "LRAC is still falling where it meets the demand curve, so average cost keeps falling over the whole relevant range.",
      "MC lies below LRAC throughout, so marginal cost pricing (P = MC) would make losses.",
      "Regulators therefore often use average cost pricing (P = AC) to allow only normal profit.",
      "Splitting the industry would raise average cost and waste resources through duplication.",
    ],
    labelKeys: ["Q", "P", "LRAC", "MC", "AR"],
    mistakes: [
      "Drawing LRAC as U-shaped: for a natural monopoly the relevant range is downward sloping.",
      "Forgetting that P = MC pricing creates a loss requiring a subsidy.",
    ],
    tips: ["Use the P = MC versus P = AC contrast as the core evaluation of regulation."],
    realWorld: ["National grid transmission, mains water supply, rail infrastructure."],
    related: ["monopoly", "long-run-average-cost", "economies-of-scale"],
    examQuestions: [
      "Explain, using a diagram, why some industries are natural monopolies. [8]",
    ],
  },
  {
    id: "monopoly-profit-maximisation",
    title: "Monopoly Profit Maximisation",
    topic: "Market Structure",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Costs / Revenue",
      curves: [
        {
          points: [
            [0, 92],
            [92, 12],
          ],
          label: "AR = D",
          tone: "demand",
          labelAt: [80, 22],
        },
        {
          points: [
            [0, 92],
            [46, 12],
          ],
          label: "MR",
          tone: "revenue",
          labelAt: [40, 8],
        },
        { points: uShape(52, 34, 40, 40), label: "ATC", tone: "cost", labelAt: [92, 72] },
        {
          points: [
            [16, 20],
            [38, 26],
            [56, 42],
            [76, 80],
            [86, 95],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [86, 95],
        },
      ],
      markers: [
        { at: [34, 24], label: "MC = MR", labelOffset: [3, -4], guides: "x" },
        { at: [34, 62], label: "Pm", labelOffset: [3, 4], guides: "y" },
      ],
      xTicks: [{ at: 34, label: "Qm" }],
      notes: [{ at: [4, 8], text: "Step 1 MC = MR → Step 2 up to AR → Step 3 across to price" }],
    },
    represents:
      "The precise three-step rule for finding a price maker's profit-maximising price and output.",
    whyUsed:
      "Marks are awarded for the method, not just the answer; this is the single most examined technique in A Level market structure.",
    whenToDraw:
      "Whenever a firm faces a downward-sloping demand curve: monopoly, monopolistic competition, oligopoly.",
    howToRead: [
      "Step 1: find where MC cuts MR from below — that gives Qm.",
      "Step 2: project vertically upwards from Qm to the AR curve.",
      "Step 3: read horizontally across to the price axis to get Pm.",
      "Profit per unit is the vertical gap between AR and ATC at Qm.",
    ],
    labelKeys: ["Q", "P", "AR", "MR", "MC", "ATC", "Qm", "Pm", "Profit"],
    mistakes: [
      "Reading price off the MC = MR point.",
      "Confusing profit maximisation (MC = MR) with revenue maximisation (MR = 0) or sales maximisation (AR = AC).",
    ],
    tips: [
      "Label the three steps on the diagram itself — it makes your reasoning explicit to the examiner.",
    ],
    realWorld: ["Branded pharmaceutical pricing under patent protection."],
    related: ["monopoly", "marginal-revenue", "average-revenue"],
    examQuestions: [
      "Explain how a firm with market power chooses its profit-maximising price and output. [8]",
    ],
  },
  {
    id: "contestable-markets",
    title: "Contestable Markets",
    topic: "Market Structure",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Costs / Revenue",
      curves: [
        {
          points: [
            [0, 90],
            [92, 14],
          ],
          label: "AR = D",
          tone: "demand",
          labelAt: [80, 22],
        },
        {
          points: [
            [0, 90],
            [46, 14],
          ],
          label: "MR",
          tone: "revenue",
          labelAt: [40, 10],
        },
        { points: uShape(56, 38, 42, 40), label: "AC", tone: "cost", labelAt: [92, 74] },
      ],
      markers: [
        { at: [56, 38], label: "Limit price: AR = AC, normal profit only", labelOffset: [-46, 12] },
      ],
      notes: [
        { at: [4, 10], text: "Threat of hit-and-run entry forces price down towards AC" },
      ],
    },
    represents:
      "A market where entry and exit are costless (no sunk costs), so even a single incumbent behaves competitively because of the threat of hit-and-run entry.",
    whyUsed:
      "It shows that market behaviour depends on contestability, not just the number of firms — a powerful evaluation tool.",
    whenToDraw:
      "In questions on deregulation, competition policy, low-cost airlines and whether concentration means abuse.",
    howToRead: [
      "The incumbent sets a limit price where AR = AC, earning only normal profit.",
      "Any abnormal profit would attract entrants who could leave again at no cost.",
      "Output is higher and price lower than under an unthreatened monopoly.",
      "Sunk costs are the key: with them, contestability collapses.",
    ],
    labelKeys: ["Q", "P", "AR", "MR", "AC"],
    mistakes: [
      "Confusing contestability with the number of firms in the market.",
      "Forgetting that the outcome depends on the absence of sunk costs.",
    ],
    tips: ["Use contestability to evaluate: 'a monopoly is only harmful if the market is not contestable'."],
    realWorld: ["Airline routes where aircraft can be redeployed cheaply between city pairs."],
    related: ["monopoly", "perfect-competition"],
    examQuestions: [
      "Discuss whether the theory of contestable markets weakens the case for regulating monopolies. [12]",
    ],
  },

  /* -------------------------------- Costs & revenue -------------------------------- */
  {
    id: "average-cost",
    title: "Average Cost",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(52, 34, 40, 44), label: "AC", tone: "cost", labelAt: [92, 76] },
      ],
      markers: [{ at: [52, 34], label: "minimum AC (productive efficiency)", labelOffset: [-42, 10] }],
    },
    represents: "Total cost divided by output: the cost of producing each unit on average.",
    whyUsed:
      "It identifies productive efficiency and, compared with AR, shows whether the firm makes profit or loss.",
    whenToDraw: "In any firm-level cost or profit question.",
    howToRead: [
      "AC falls at first as fixed costs are spread and the variable factor becomes more productive.",
      "AC rises later because of the law of diminishing returns in the short run.",
      "The minimum point is the productively efficient output.",
    ],
    labelKeys: ["Q", "AC", "AFC", "ATC"],
    labelOverrides: {
      Q: "Output per period produced by the firm.",
    },
    mistakes: [
      "Drawing AC hitting the vertical axis — at zero output average cost is undefined.",
      "Confusing AC with MC.",
    ],
    tips: ["State the reason for each part of the U-shape; unsupported shapes score nothing."],
    realWorld: ["A factory's unit cost falls as the production line runs closer to design capacity."],
    related: ["marginal-cost", "average-total-cost", "short-run-cost-curves"],
    examQuestions: ["Explain why the short-run average cost curve is U-shaped. [8]"],
  },
  {
    id: "marginal-cost",
    title: "Marginal Cost",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(52, 34, 40, 44), label: "AC", tone: "cost", labelAt: [92, 76] },
        {
          points: [
            [16, 30],
            [34, 24],
            [52, 34],
            [70, 62],
            [84, 92],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [84, 92],
        },
      ],
      markers: [{ at: [52, 34], label: "MC cuts AC at its minimum", labelOffset: [-40, 12] }],
    },
    represents: "The addition to total cost from producing one more unit of output.",
    whyUsed:
      "MC = MR is the profit-maximising rule, and MC is the supply curve of a competitive firm above AVC.",
    whenToDraw: "In every market structure diagram and every profit-maximising calculation.",
    howToRead: [
      "MC falls while marginal returns are increasing and rises once diminishing returns set in.",
      "MC always cuts AC and AVC at their minimum points — when MC is below the average it pulls it down, and vice versa.",
      "The area under MC up to an output is total variable cost.",
    ],
    labelKeys: ["Q", "MC", "AC", "AVC"],
    mistakes: [
      "Drawing MC cutting AC anywhere other than the AC minimum.",
      "Treating MC as the cost of all units rather than the extra unit.",
    ],
    tips: ["The MC–AC relationship is pure arithmetic — explain it that way for full marks."],
    realWorld: ["The extra cost of one more airline passenger is very low once the flight is scheduled."],
    related: ["average-cost", "perfect-competition", "monopoly-profit-maximisation"],
    examQuestions: ["Explain the relationship between marginal cost and average cost. [6]"],
  },
  {
    id: "average-revenue",
    title: "Average Revenue",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Revenue per unit",
      curves: [
        {
          points: [
            [0, 92],
            [92, 12],
          ],
          label: "AR = D (price maker)",
          tone: "demand",
          labelAt: [56, 30],
        },
        {
          points: [
            [0, 46],
            [92, 46],
          ],
          label: "AR = MR (price taker)",
          tone: "supply",
          labelAt: [44, 50],
        },
      ],
    },
    represents: "Total revenue divided by output, which is always equal to price.",
    whyUsed:
      "AR is the firm's demand curve; its shape is what distinguishes a price taker from a price maker.",
    whenToDraw: "In any firm-level revenue or profit diagram.",
    howToRead: [
      "For a price taker AR is horizontal at the market price and equals MR.",
      "For a price maker AR slopes downwards, so extra sales require a lower price on all units.",
      "Profit per unit is the vertical gap between AR and AC at the chosen output.",
    ],
    labelKeys: ["Q", "P", "AR", "MR", "TR"],
    mistakes: ["Forgetting AR = price, and treating AR as total revenue."],
    tips: ["State explicitly 'AR = TR ÷ Q = P' — it is a free mark."],
    realWorld: ["A wheat farmer takes the world price; a smartphone brand sets its own."],
    related: ["marginal-revenue", "monopoly", "perfect-competition"],
    examQuestions: ["Explain why average revenue equals price. [4]"],
  },
  {
    id: "marginal-revenue",
    title: "Marginal Revenue",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Revenue per unit",
      curves: [
        {
          points: [
            [0, 92],
            [92, 12],
          ],
          label: "AR = D",
          tone: "demand",
          labelAt: [80, 20],
        },
        {
          points: [
            [0, 92],
            [46, 12],
          ],
          label: "MR",
          tone: "revenue",
          labelAt: [40, 8],
        },
      ],
      markers: [{ at: [46, 12], label: "MR = 0 → TR maximised", labelOffset: [2, 12], guides: "x" }],
    },
    represents: "The change in total revenue from selling one extra unit.",
    whyUsed:
      "MR = MC defines profit maximisation, and the MR = 0 point links revenue to price elasticity of demand.",
    whenToDraw: "Alongside AR in every imperfect competition diagram.",
    howToRead: [
      "With a straight-line AR, MR has the same intercept but twice the gradient, so it hits the axis at half the output.",
      "Where MR is positive, demand is price elastic and a price cut raises total revenue.",
      "Where MR is negative, demand is price inelastic and a price cut lowers total revenue.",
      "At MR = 0 total revenue is maximised and PED = −1.",
    ],
    labelKeys: ["Q", "MR", "AR", "TR"],
    mistakes: [
      "Drawing MR parallel to AR.",
      "Placing MR above AR.",
    ],
    tips: ["Link MR to PED — this is a classic high-mark connection."],
    realWorld: ["Concert promoters price near the MR = 0 point to maximise ticket revenue."],
    related: ["average-revenue", "price-elasticity-of-demand", "monopoly-profit-maximisation"],
    examQuestions: [
      "Explain the relationship between marginal revenue, total revenue and price elasticity of demand. [8]",
    ],
  },
  {
    id: "average-total-cost",
    title: "Average Total Cost",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(52, 36, 40, 44), label: "ATC", tone: "cost", labelAt: [92, 78] },
        { points: uShape(48, 24, 38, 40), label: "AVC", tone: "accent", labelAt: [90, 58] },
        {
          points: [
            [14, 46],
            [26, 28],
            [42, 18],
            [62, 12],
            [88, 8],
          ],
          label: "AFC",
          tone: "neutral",
          labelAt: [88, 8],
        },
      ],
      arrows: [{ from: [66, 44], to: [66, 60], label: "AFC" }],
    },
    represents:
      "Average fixed cost plus average variable cost: the total cost of producing each unit on average.",
    whyUsed:
      "The ATC–AVC gap shows average fixed cost and explains the short-run shutdown decision.",
    whenToDraw:
      "In short-run cost questions and when deciding whether a loss-making firm should continue producing.",
    howToRead: [
      "ATC = AFC + AVC at every output.",
      "AFC falls continuously, so ATC and AVC converge as output rises.",
      "A firm covering AVC but not ATC should continue in the short run and exit in the long run.",
    ],
    labelKeys: ["Q", "ATC", "AVC", "AFC", "TC"],
    mistakes: [
      "Letting AVC cross ATC — they converge but never meet.",
      "Drawing AFC as U-shaped: it falls throughout.",
    ],
    tips: ["Use the shutdown rule (P ≥ AVC) as strong evaluation in loss-making firm questions."],
    realWorld: ["Airlines flew loss-making routes during the pandemic while fares still covered variable costs."],
    related: ["average-cost", "short-run-cost-curves", "marginal-cost"],
    examQuestions: [
      "Explain, using a diagram, why a firm may continue producing while making a loss. [8]",
    ],
  },
  {
    id: "long-run-average-cost",
    title: "Long Run Average Cost",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(56, 30, 46, 46), label: "LRAC", tone: "cost", labelAt: [92, 74] },
        { points: uShape(26, 44, 16, 36), label: "SRAC1", tone: "neutral", dashed: true, labelAt: [14, 84] },
        { points: uShape(56, 32, 16, 36), label: "SRAC2", tone: "neutral", dashed: true, labelAt: [46, 72] },
        { points: uShape(84, 44, 16, 36), label: "SRAC3", tone: "neutral", dashed: true, labelAt: [78, 84] },
      ],
      markers: [{ at: [56, 30], label: "MES", labelOffset: [2, 5] }],
    },
    represents:
      "The lowest average cost achievable at each output when all factors of production are variable — the envelope of the short-run curves.",
    whyUsed:
      "It shows economies and diseconomies of scale, minimum efficient scale, and why some industries are concentrated.",
    whenToDraw:
      "For questions on firm growth, scale, natural monopoly and international competitiveness.",
    howToRead: [
      "Each SRAC represents one fixed scale of plant; LRAC touches each from below.",
      "The falling section is internal economies of scale; the rising section is diseconomies.",
      "The lowest point is minimum efficient scale (MES): the smallest output at which LRAC is minimised.",
      "Movements along LRAC are changes in scale, not changes in output with fixed capital.",
    ],
    labelKeys: ["Q", "LRAC", "SRAC", "AC"],
    mistakes: [
      "Drawing LRAC through the minimum of every SRAC — it is tangential, not through the minima, except at MES.",
      "Confusing economies of scale (long run) with diminishing returns (short run).",
    ],
    tips: ["Name the specific economies — purchasing, technical, managerial, financial, risk-bearing, marketing."],
    realWorld: ["Car assembly plants need very large output to reach minimum efficient scale."],
    related: ["economies-of-scale", "diseconomies-of-scale", "natural-monopoly", "long-run-cost-curves"],
    examQuestions: [
      "Explain, using a diagram, the difference between short-run and long-run average cost. [8]",
    ],
  },
  {
    id: "short-run-cost-curves",
    title: "Short Run Cost Curves",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(52, 36, 40, 44), label: "ATC", tone: "cost", labelAt: [92, 78] },
        { points: uShape(46, 24, 38, 40), label: "AVC", tone: "accent", labelAt: [88, 56] },
        {
          points: [
            [14, 34],
            [30, 22],
            [46, 24],
            [62, 46],
            [80, 92],
          ],
          label: "MC",
          tone: "warn",
          labelAt: [80, 92],
        },
        {
          points: [
            [14, 46],
            [26, 28],
            [42, 18],
            [62, 12],
            [88, 8],
          ],
          label: "AFC",
          tone: "neutral",
          labelAt: [88, 8],
        },
      ],
      markers: [
        { at: [46, 24], label: "min AVC (shutdown point)", labelOffset: [2, -10], guides: "none" },
        { at: [52, 36], label: "min ATC", labelOffset: [4, 6], guides: "none" },
      ],
    },
    represents:
      "The full family of short-run cost curves when at least one factor is fixed: AFC, AVC, ATC and MC.",
    whyUsed:
      "It is the complete toolkit for short-run firm behaviour, including the shutdown and profit-maximising decisions.",
    whenToDraw: "In A Level questions on costs, diminishing returns and short-run supply.",
    howToRead: [
      "AFC falls continuously; AVC and ATC are U-shaped because of the law of diminishing returns.",
      "MC cuts AVC and ATC at their minimum points.",
      "The MC curve above minimum AVC is the firm's short-run supply curve.",
    ],
    labelKeys: ["Q", "MC", "ATC", "AVC", "AFC"],
    mistakes: [
      "Drawing MC cutting AVC and ATC at the same output — it cuts each at its own minimum.",
      "Attributing the U-shape to economies of scale rather than diminishing returns.",
    ],
    tips: ["Say 'law of variable proportions / diminishing marginal returns' explicitly in the short run."],
    realWorld: ["A restaurant with a fixed kitchen faces rising marginal cost once the kitchen is crowded."],
    related: ["long-run-cost-curves", "average-total-cost", "marginal-cost"],
    examQuestions: [
      "Using a diagram, explain the relationship between the short-run cost curves of a firm. [8]",
    ],
  },
  {
    id: "long-run-cost-curves",
    title: "Long Run Cost Curves",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(56, 30, 46, 46), label: "LRAC", tone: "cost", labelAt: [92, 74] },
        {
          points: [
            [14, 16],
            [40, 22],
            [56, 30],
            [74, 56],
            [90, 90],
          ],
          label: "LRMC",
          tone: "warn",
          labelAt: [90, 90],
        },
      ],
      markers: [{ at: [56, 30], label: "LRMC cuts LRAC at MES", labelOffset: [-40, 12] }],
      notes: [
        { at: [12, 92], text: "Economies of scale" },
        { at: [72, 92], text: "Diseconomies of scale" },
      ],
    },
    represents:
      "Long-run average and marginal cost when every factor of production, including capital, can be varied.",
    whyUsed:
      "It shows how unit costs change with the scale of the whole firm and where the optimum scale lies.",
    whenToDraw: "In questions on firm growth, mergers, and industry structure.",
    howToRead: [
      "LRAC falls through the economies of scale range and rises through the diseconomies range.",
      "LRMC cuts LRAC at LRAC's minimum, which is minimum efficient scale.",
      "Constant returns to scale would appear as a flat section of LRAC.",
    ],
    labelKeys: ["Q", "LRAC", "MC"],
    labelOverrides: {
      MC: "Long-run marginal cost — the extra cost of one more unit when all factors can be varied. It cuts LRAC at its minimum.",
    },
    mistakes: ["Using the short-run explanation (diminishing returns) for a long-run curve."],
    tips: ["Always distinguish internal from external economies of scale."],
    realWorld: ["Semiconductor fabrication shows enormous long-run economies of scale."],
    related: ["long-run-average-cost", "economies-of-scale", "diseconomies-of-scale"],
    examQuestions: ["Explain the shape of the long-run average cost curve. [8]"],
  },
  {
    id: "economies-of-scale",
    title: "Economies of Scale",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(62, 28, 52, 48), label: "LRAC", tone: "cost", labelAt: [92, 68] },
      ],
      markers: [
        { at: [20, 60], label: "falling LRAC", labelOffset: [3, 8] },
        { at: [62, 28], label: "MES", labelOffset: [2, 6] },
      ],
      arrows: [{ from: [16, 20], to: [58, 20], label: "economies of scale range" }],
    },
    represents:
      "The fall in long-run average cost as the scale of production increases.",
    whyUsed:
      "It explains why large firms can undercut small ones, why some markets concentrate, and how competitiveness improves.",
    whenToDraw:
      "In questions on firm size, mergers, international trade competitiveness and natural monopoly.",
    howToRead: [
      "Along the falling section, doubling all inputs more than doubles output, so unit cost falls.",
      "Internal sources: technical, purchasing, managerial, financial, risk-bearing, marketing.",
      "External economies shift the whole LRAC curve down as the industry grows.",
    ],
    labelKeys: ["Q", "LRAC"],
    mistakes: [
      "Listing types of economies without linking each to a fall in unit cost.",
      "Confusing internal (firm grows) with external (industry grows) economies.",
    ],
    tips: ["An external economy shifts LRAC down; an internal economy is a movement along it."],
    realWorld: ["Supermarket chains use purchasing economies to buy stock far below small retailers' prices."],
    related: ["diseconomies-of-scale", "long-run-average-cost", "natural-monopoly"],
    examQuestions: [
      "Explain, using a diagram, how a firm may benefit from economies of scale. [8]",
    ],
  },
  {
    id: "diseconomies-of-scale",
    title: "Diseconomies of Scale",
    topic: "Costs & Revenue",
    level: "A Level",
    spec: {
      xLabel: "Output",
      yLabel: "Cost per unit",
      curves: [
        { points: uShape(38, 28, 34, 48), label: "LRAC", tone: "cost", labelAt: [80, 84] },
      ],
      markers: [
        { at: [38, 28], label: "MES", labelOffset: [-10, 7] },
        { at: [66, 66], label: "rising LRAC", labelOffset: [2, 8] },
      ],
      arrows: [{ from: [42, 16], to: [80, 16], label: "diseconomies of scale range" }],
    },
    represents:
      "The rise in long-run average cost when a firm grows beyond its minimum efficient scale.",
    whyUsed:
      "It sets a limit on firm size and is a key evaluation point against the claim that bigger is always cheaper.",
    whenToDraw: "In merger, firm growth and monopoly efficiency questions.",
    howToRead: [
      "Beyond MES, unit costs rise as output expands further.",
      "Causes: coordination and control problems, communication failures, worker alienation, bureaucratic inertia.",
      "External diseconomies (congestion, rising local input prices) shift LRAC upwards.",
    ],
    labelKeys: ["Q", "LRAC"],
    mistakes: ["Explaining rising LRAC with diminishing returns — that is a short-run concept."],
    tips: ["Use diseconomies as the counter-argument in any 'large firms are more efficient' discussion."],
    realWorld: ["Large conglomerates that later demerged to cut management complexity."],
    related: ["economies-of-scale", "long-run-average-cost"],
    examQuestions: [
      "Discuss whether firms always benefit from becoming larger. [12]",
    ],
  },
]);