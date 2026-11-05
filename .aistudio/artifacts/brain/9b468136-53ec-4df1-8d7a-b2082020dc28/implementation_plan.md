# PricePulse Studio — Dynamic Pricing Elasticity & Conjoint Engine

An interactive SaaS pricing optimization sandbox that transforms raw willingness-to-pay survey data into real-time Van Westendorp cumulative curves, Gabor-Granger elasticity & revenue frontiers, Economic Value to the Customer (EVC) unit-economics breakdowns, and a Good-Better-Best multi-tier seat packaging simulator.

## User Review & Critical Decisions

> [!IMPORTANT]
> All three product scope decisions from the discovery phase are locked in and synthesized below. No AI or LLM calls are included in the application; all econometric curves, intersections, and conjoint simulations run deterministically in-browser.

- **Confirmed Decision 1 (Survey Data Ingestion)**: Supports one-click industry presets (B2B SaaS Analytics, Developer API Platform, Enterprise Workflow Suite), drag-and-drop/file CSV upload with formula-injection sanitization, and an inline editable respondent data table.
- **Confirmed Decision 2 (Packaging & Conjoint Mode)**: Centers on a **Multi-tier Good-Better-Best Seat Matrix** (Starter, Growth, Enterprise) with configurable seat tiers, feature conjoint utility weights, tier migration/cannibalization modeling, and per-tier gross margin calculation.
- **Confirmed Decision 3 (EVC & Unit Economics Depth)**: Combines **Van Westendorp PSM**, **Gabor-Granger Elasticity**, and a **Full EVC Value-Driver & Unit Economics Engine** (Reference Value, Positive/Negative Differentiation Drivers, Customer Surplus split, Churn, CAC, LTV:CAC, and ARPU/Gross Margin sensitivity).

---

## 1. Overview & Core Concept

- **What It Does**: Replaces static pricing spreadsheets with a live econometric studio. Pricing leads can inspect or edit respondent price-sensitivity data, immediately see exact Van Westendorp intersections ($PMC$, $IPP$, $OPP$, $PME$), test price-point demand elasticity via Gabor-Granger, quantify differentiation value via EVC, and simulate Good-Better-Best tier packaging against churn, COGS, and CAC assumptions.
- **Target Audience / Persona**: Monetization Directors, SaaS Pricing Leads, Product Managers, and Growth Strategists.
- **Key Value**: Eliminates guesswork in tier pricing and packaging by linking customer willingness-to-pay directly to gross margin, net dollar retention, and LTV:CAC unit economics in real time.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Dataset Selection & Ingestion**: Load a realistic B2B SaaS survey preset, upload a custom CSV file, or edit individual respondent thresholds (`Too Cheap`, `Bargain`, `Expensive`, `Too Expensive`, plus Gabor-Granger purchase intent) in the inline table.
  2. **Van Westendorp & Gabor-Granger Analysis**: Inspect the primary interactive SVG cumulative distribution chart showing the four Van Westendorp curves, shaded Acceptable Price Range ($PMC$ to $PME$), and exact $OPP$ / $IPP$ markers, or toggle to the Gabor-Granger Demand, Revenue, and Gross Margin frontier.
  3. **Good-Better-Best Seat Matrix Simulation**: Adjust seat pricing, included seat bands, and feature entitlements across Starter, Growth, and Enterprise tiers while observing real-time conjoint share-of-preference, blended ARPU, and gross margin impact.
  4. **EVC & Unit Economics Stress-Testing**: Configure competitor reference price, quantified value drivers (time saved, error reduction, infrastructure consolidation), monthly churn rate, COGS per seat, and CAC using interactive sliders to evaluate LTV:CAC and payback period.
  5. **Export & Verification**: Export a sanitized CSV/JSON pricing model summary for stakeholder review.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Expressive SaaS Analytics & Bento Financial Grid — high-craft, crisp, analytical, and uncluttered.
  - *Color Palette & Mood*: Light-first analytical canvas in Clean Slate (`#F8FAFC`), crisp white (`#FFFFFF`) structural surfaces with `1px solid #E2E8F0` hairline borders, vibrant Indigo (`#4F46E5`) for primary curves and active controls, and Emerald Green (`#16A34A`) for gross margin highlights and optimal price callouts, with Amber (`#D97706`) and Crimson (`#DC2626`) reserved strictly for elasticity/churn warnings.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for display headings and navigation, `DM Sans` for dense UI labels and prose, and `JetBrains Mono` with `tabular-nums` for all prices, percentages, elasticity coefficients, and data tables.
  - *Component Styling & Layout*: Left sidebar navigation (`240px`) + Top breadcrumb/action bar + Bento financial grid. Single-elevation depth (no nested cards within cards, no thick left accent borders, no static pill badges on metadata—using clean unboxed text with `·` separators).

- **Interactive Feedback & Motion**:
  - Smooth SVG curve transitions and crosshair hover tooltips (`<= 180ms` settling) showing exact price, cumulative percentages, elasticity, and margin at any cursor position.
  - Instant validation banners for malformed CSVs or out-of-order respondent thresholds, plus clean empty/reset states.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Custom Precision SVG Charts vs. Heavy Charting Libraries**
  - *Chosen Approach*: Build dedicated, responsive SVG chart components for Van Westendorp cumulative curves, Gabor-Granger demand/margin frontiers, and EVC waterfall bars.
  - *Why*: Guarantees exact mathematical interpolation of intersection points ($PMC$, $IPP$, $OPP$, $PME$), zero bundle bloat, crisp `tabular-nums` crosshair tooltips, and full control over Indigo/Emerald visual styling.
  - *Alternatives Considered*: Generic charting wrappers, which often struggle with custom four-curve cumulative inversions and exact intersection annotations.

- **Decision 2: Client-Side Econometric Engine with Strict Input Sanitization**
  - *Chosen Approach*: Run all statistical calculations, conjoint logit share-of-preference, and CSV parsing in pure TypeScript modules on the client, with strict CSV formula-injection neutralization and numeric bounds checking.
  - *Why*: Zero-latency slider feedback (`< 16ms` recalculation), offline reliability, and strong security against malicious CSV payloads.
  - *Alternatives Considered*: Server-side calculation round-trips, which would introduce slider lag.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PricePulse Studio Shell                          │
│  ┌───────────────┐  ┌────────────────────────────────────────────────┐  │
│  │ Left Sidebar  │  │ Top Header (Breadcrumbs + Preset/Export CTA)   │  │
│  │ Navigation    │  ├────────────────────────────────────────────────┤  │
│  │               │  │                                                │  │
│  │ • Overview    │  │  ┌──────────────────────┐  ┌────────────────┐  │  │
│  │ • Van         │  │  │ Interactive Curve    │  │ KPI & Margin   │  │  │
│  │   Westendorp  │  │  │ Viewport (SVG)       │  │ Summary Strip  │  │  │
│  │ • Gabor-      │  │  │ • Van Westendorp PSM │  └────────────────┘  │  │
│  │   Granger     │  │  │ • Gabor-Granger      │  ┌────────────────┐  │  │
│  │ • GBB Tier    │  │  │ • EVC Waterfall      │  │ Elasticity &   │  │  │
│  │   Matrix      │  │  └──────────────────────┘  │ Unit Economics │  │  │
│  │ • EVC & Unit  │  │  ┌──────────────────────┐  │ Sliders        │  │  │
│  │   Economics   │  │  │ Good-Better-Best     │  └────────────────┘  │  │
│  │ • Survey Data │  │  │ Seat Matrix & Inline │                      │  │
│  │   Table       │  │  │ Survey Table         │                      │  │
│  └───────────────┘  │  └──────────────────────┘                      │  │
│                     └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     ▲
                                     │ Pure Deterministic State
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Econometric & Conjoint Core Engine                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ Van Westendorp   │  │ Gabor-Granger    │  │ EVC & Conjoint Tier   │  │
│  │ Interpolator     │  │ Elasticity &     │  │ Simulator             │  │
│  │ (PMC, IPP, OPP,  │  │ Revenue/Margin   │  │ (Logit Share, ARPU,   │  │
│  │  PME)            │  │ Optimizer        │  │  Churn, CAC, LTV)     │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `SurveyRespondent`: `{ id, segment, tooCheap, bargain, expensive, tooExpensive, maxWillingnessToPay }`
  - `TierConfig`: `{ id: 'starter' | 'growth' | 'enterprise', name, targetAudience, monthlyPricePerSeat, includedSeats, overagePerSeat, cogsPerSeat, features: FeatureEntitlement[] }`
  - `EvcConfig`: `{ referencePrice, positiveDrivers: ValueDriver[], negativeDrivers: ValueDriver[], monthlyChurnRate, cac, targetCaptureRate }`
  - `PricingMetrics`: Derived real-time outputs (`pmc`, `ipp`, `opp`, `pme`, `optimalGaborPrice`, `peakGrossMargin`, `totalEvc`, `recommendedPrice`, `blendedArpu`, `ltvToCac`, `tierShares`).
- **Interactive Component & State Mapping**:
  - Editing a respondent row or uploading a CSV updates `respondents` state, immediately recomputing Van Westendorp cumulative distributions and Gabor-Granger demand curves.
  - Dragging elasticity, churn, COGS, or CAC sliders updates `evcConfig` and `tiers`, recalculating gross margin, LTV:CAC, and multinomial logit tier shares in real time.
  - Toggling features or adjusting seat prices in the Good-Better-Best matrix updates conjoint utility scores and projects tier migration and blended gross margin.
