"""Response models for the FastAPI application"""

from pydantic import BaseModel
from typing import Dict, Optional, Any, List


class MetricsResponse(BaseModel):
    """Model for stock metrics response"""
    ttm_pe: float | None
    forward_pe: float | None
    two_year_forward_pe: float | None
    ttm_eps_growth: float | None
    current_year_eps_growth: float | None
    next_year_eps_growth: float | None
    ttm_revenue_growth: float | None
    current_year_revenue_growth: float | None
    next_year_revenue_growth: float | None
    gross_margin: float | None
    net_margin: float | None
    ttm_ps_ratio: float | None
    forward_ps_ratio: float | None
    # Stock info fields
    ticker: str | None
    price: float | None
    market_cap: float | None


class ProjectionResponse(BaseModel):
    """Model for the projection response"""
    success: bool
    ticker: str
    current_year: int
    base_data: Dict[str, float]
    projections: Dict[int, Dict[str, float]]
    summary: Dict[str, Any]
    error: Optional[str] = None


class ProjectionBaseDataResponse(BaseModel):
    """Model for projection base data response"""
    ticker: str
    price: float
    market_cap: float
    shares_outstanding: float
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    net_income_margin: Optional[float] = None
    data_year: int


class FinancialStatementResponse(BaseModel):
    """Model for financial statement response (mock FMP API response)"""
    date: str
    symbol: str
    reportedCurrency: str
    cik: str
    filingDate: str
    acceptedDate: str
    fiscalYear: str
    period: str
    revenue: int
    costOfRevenue: int
    grossProfit: int
    researchAndDevelopmentExpenses: int
    generalAndAdministrativeExpenses: int
    sellingAndMarketingExpenses: int
    sellingGeneralAndAdministrativeExpenses: int
    otherExpenses: int
    operatingExpenses: int
    costAndExpenses: int
    netInterestIncome: int
    interestIncome: int
    interestExpense: int
    depreciationAndAmortization: int
    ebitda: int
    ebit: int
    nonOperatingIncomeExcludingInterest: int
    operatingIncome: int
    totalOtherIncomeExpensesNet: int
    incomeBeforeTax: int
    incomeTaxExpense: int
    netIncomeFromContinuingOperations: int
    netIncomeFromDiscontinuedOperations: int
    otherAdjustmentsToNetIncome: int
    netIncome: int
    netIncomeDeductions: int
    bottomLineNetIncome: int
    eps: float
    epsDiluted: float
    weightedAverageShsOut: int
    weightedAverageShsOutDil: int


class AnalystEstimateResponse(BaseModel):
    """Model for analyst estimates data"""
    fiscalYear: str
    totalRevenue: int | None
    netIncome: int | None
    eps: float | None
    dilutedEps: float | None

class FinancialDataResponse(BaseModel):
    """Model for processed financial data response"""
    fiscalYear: str
    totalRevenue: int | None
    costOfRevenue: int | None
    grossProfit: int | None
    sellingGeneralAndAdministrative: int | None
    researchAndDevelopment: int | None
    operatingExpenses: int | None
    operatingIncome: int | None
    netIncome: int | None
    eps: float | None
    dilutedEps: float | None

class ComprehensiveFinancialResponse(BaseModel):
    """Model for comprehensive financial data including historical and analyst estimates"""
    ticker: str
    price: float | None
    market_cap: float | None
    historical: List[FinancialDataResponse]
    estimates: List[AnalystEstimateResponse]


class ErrorResponse(BaseModel):
    """Model for error responses"""
    success: bool = False
    error: str
    ticker: Optional[str] = None