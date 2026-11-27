/* =========================================================
   Marathon Outdoors: PRICE SETTINGS for the quote estimator
   ---------------------------------------------------------
   ⚠ SAMPLE NUMBERS. Replace these with Tom's real prices.
   Every price is a [low, high] range in dollars.
   You can change any number here without touching estimator.js.
   ========================================================= */

window.MO_PRICING = {
  // Shows a small "sample pricing" note on the estimate until Tom's numbers are in.
  demoPricing: true,

  // Round the final range to the nearest... (keeps it from looking falsely exact)
  roundTo: 500,

  // Smallest job Tom takes. Estimates below this are raised to it.
  minimumJob: 5000,

  // ---- Surfaces: price per square foot, by material ----
  materials: {
    // listed from most budget-friendly to most expensive (this order is the order on screen)
    gravel:   { label: 'Gravel', perSqFt: [8, 14] },
    standard: { label: 'Concrete pavers', perSqFt: [18, 26] },
    brick:    { label: 'Brick', perSqFt: [22, 32] },
    premium:  { label: 'Premium pavers', perSqFt: [24, 34] },
    natural:  { label: 'Natural stone', perSqFt: [30, 45] },
    // "I'm not sure": shows a wider range covering concrete pavers to premium pavers
    unsure:   { label: "I'm not sure yet", perSqFt: [18, 34] },
  },
  walkwayMultiplier: 1.1,          // walkways cost a bit more per sq ft than patios (more edges/cuts)

  // ---- Walls ----
  retainingWallPerFaceSqFt: [45, 75],   // length x height
  seatingWallPerLinearFt: [90, 140],

  // ---- Per-item prices ----
  stepEach: [400, 800],
  firePit: [2500, 5000],
  kitchen: {
    small:  [8000, 14000],
    medium: [14000, 25000],
    large:  [25000, 45000],
  },
  lightingPerFixture: [250, 400],
  lightingTransformer: [800, 1200],    // added once if any lighting is chosen
  drainagePerLinearFt: [30, 55],
  crawlspaceDrainage: [3000, 6000],
  turfPerSqFt: [12, 18],
  gravelAreaPerSqFt: [6, 10],
  removalPerSqFt: [4, 8],              // tearing out an old patio/concrete

  // ---- Site adjustments (multiply the construction total) ----
  slope:  { flat: 1, gentle: 1.1, steep: 1.25 },
  access: { wide: 1, narrow: 1.12, none: 1.25 },

  // ---- Service area: ZIP codes that count as "in area" ----
  // Cary, Apex, Morrisville, Holly Springs, Durham, Chapel Hill, Raleigh (Wake County)
  serviceZips: [
    '27511', '27513', '27518', '27519', '27523', '27502', '27539', '27540', '27560',
    '27701', '27703', '27705', '27707', '27713', '27514', '27516', '27517',
    '27601', '27603', '27604', '27605', '27606', '27607', '27608', '27609', '27610',
    '27612', '27613', '27614', '27615', '27616', '27617', '27526', '27529', '27587', '27597'
  ],

  // ---- Booking ----
  consultFee: 150,
  // Paste Tom's Stripe Payment Link here (test mode is fine for the class demo).
  stripePaymentLink: '',
  // Paste a Formspree endpoint here (e.g. https://formspree.io/f/abcdwxyz) so requests email Tom.
  formEndpoint: '',
};
