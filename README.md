# PricePulse Studio — Dynamic Pricing Elasticity & Algorithmic Conjoint Engine

PricePulse Studio is an interactive SaaS pricing optimization sandbox built for Monetization Directors, SaaS Pricing Leads, Product Managers, and Growth Strategists. It replaces static pricing spreadsheets with real-time econometric modeling across four integrated frameworks:

1. **Van Westendorp Price Sensitivity Meter (PSM)**:
   - Renders intersecting cumulative distributions for *Too Cheap*, *Bargain*, *Expensive*, and *Too Expensive* survey thresholds.
   - Automatically interpolates the **Point of Marginal Cheapness ($PMC$)**, **Indifference Price Point ($IPP$)**, **Optimal Price Point ($OPP$)**, and **Point of Marginal Expensiveness ($PME$)**, highlighting the Acceptable Price Range.

2. **Gabor-Granger Demand & Gross Margin Frontier**:
   - Models purchase intent (%) across candidate price points alongside point price elasticity ($\varepsilon$), expected revenue, and expected gross margin per 100 leads.
   - Includes an interactive **Elasticity Sensitivity** multiplier to stress-test demand curves under varying market conditions.

3. **Good-Better-Best (GBB) Seat Matrix & Conjoint Simulator**:
   - Simulates a 3-tier seat packaging architecture (*Starter*, *Growth*, *Enterprise*) using a Multinomial Logit (MNL) choice model.
   - Dynamically recalculates tier share-of-preference, projected accounts/seats, tier MRR, and blended gross margin as you adjust per-seat pricing, included seats, or feature entitlements.

4. **Economic Value to the Customer (EVC) & Unit Economics**:
   - Quantifies next-best competitive reference value plus positive and negative differentiation drivers to compute Total EVC and Customer Surplus.
   - Connects value-capture percentage, COGS per seat, monthly logo churn, and CAC to real-time **Seat LTV**, **LTV:CAC**, and **CAC Payback Period**.

5. **Survey Data Ingestion & Security**:
   - Supports one-click industry presets (*B2B SaaS Analytics*, *Developer API & Observability*, *Enterprise Workflow Suite*), inline respondent editing, and CSV upload/export.
   - Enforces CSV formula-injection neutralization (CWE-1236), XSS-safe label sanitization, file size/row bounds, and monotonic threshold normalization.

---

## Development & Testing

```bash
# Install dependencies
npm install

# Run unit & security tests (Van Westendorp, Gabor-Granger, EVC, Conjoint, CSV Security)
npm test

# Type-check and build for production
npm run lint && npm run build

# Start development server on port 3000
npm run dev
```
