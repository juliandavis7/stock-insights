"""Response models for the FastAPI application"""

from pydantic import BaseModel
from typing import Dict, Optional, Any


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


class ErrorResponse(BaseModel):
    """Model for error responses"""
    success: bool = False
    error: str
    ticker: Optional[str] = None