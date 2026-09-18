from graph.state import FinancialAssumptions, FinancialModel, YearProjection
import hashlib
import numpy_financial as npf
import pandas as pd


def build_financial_model(seed: str) -> FinancialModel:
    # Keep fallback models deterministic, but make them specific to the idea.
    # Previously every idea used the same hard-coded assumptions and chart.
    fingerprint = int(hashlib.sha256(seed.encode("utf-8")).hexdigest()[:8], 16)
    assumptions = FinancialAssumptions(
        monthly_subscriptions_y1=400 + fingerprint % 1200,
        price_per_unit=199.0 + (fingerprint % 700),
        churn_rate=0.03 + ((fingerprint >> 4) % 8) / 100,
        tax_rate=0.20 + ((fingerprint >> 8) % 11) / 100,
        cagr=0.35 + ((fingerprint >> 12) % 45) / 100,
    )
    projections: list[YearProjection] = []
    revenue = assumptions.monthly_subscriptions_y1 * assumptions.price_per_unit * 12
    df_rows = []
    for year in range(1, 6):
        cogs = revenue * 0.25
        gross_profit = revenue - cogs
        ebitda = gross_profit * 0.35
        taxes = max(ebitda, 0) * assumptions.tax_rate
        capex = revenue * 0.05
        delta_nwc = revenue * 0.02
        fcf = ebitda - taxes - capex - delta_nwc
        df_rows.append({"year": year, "revenue": revenue, "cogs": cogs, "gross_profit": gross_profit, "ebitda": ebitda, "fcf": fcf})
        projections.append(
            YearProjection(
                year=year,
                revenue=revenue,
                cogs=cogs,
                gross_profit=gross_profit,
                ebitda=ebitda,
                fcf=fcf,
            )
        )
        revenue *= 1 + assumptions.cagr

    fcf_series = pd.Series([row["fcf"] for row in df_rows], dtype="float64")
    discount_rate = 0.18
    npv = float(sum(cash / ((1 + discount_rate) ** idx) for idx, cash in enumerate(fcf_series, start=1)))
    irr = float(npf.irr([-250000.0] + fcf_series.tolist())) if len(fcf_series) > 1 else 0.0
    cumulative = 0.0
    payback_months = 0
    for idx, cash in enumerate(fcf_series, start=1):
        cumulative += cash
        if cumulative >= 250000:
            payback_months = idx * 12
            break
    if payback_months == 0:
        payback_months = 60

    return FinancialModel(
        assumptions=assumptions,
        projections=projections,
        npv=npv,
        irr=irr,
        payback_months=payback_months,
        fcf_formula="FCF = EBITDA - Taxes - CapEx - Delta NWC",
    )
