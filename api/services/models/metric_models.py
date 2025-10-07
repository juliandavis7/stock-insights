"""Data models for metrics calculations."""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class StockInfo:
    """Stock information data model."""
    ticker: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    shares_outstanding: Optional[float] = None
    total_revenue: Optional[float] = None


@dataclass
class QuarterlyData:
    """Quarterly financial data model."""
    date: str
    revenue: Optional[float] = None
    cost_of_revenue: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    gross_profit: Optional[float] = None


@dataclass
class MetricResult:
    """Result of a metric calculation."""
    value: Optional[float]
    calculation_successful: bool
    error_message: Optional[str] = None
    
    @classmethod
    def success(cls, value: Optional[float]) -> 'MetricResult':
        """Create a successful result."""
        return cls(value=value, calculation_successful=True)
    
    @classmethod
    def failure(cls, error_message: str) -> 'MetricResult':
        """Create a failed result."""
        return cls(value=None, calculation_successful=False, error_message=error_message)


@dataclass
class GrowthCalculationInput:
    """Input data for growth calculations."""
    current_value: Optional[float]
    previous_value: Optional[float]
    next_value: Optional[float] = None


@dataclass
class TTMCalculationInput:
    """Input data for TTM calculations."""
    quarterly_data: List[QuarterlyData]
    current_price: Optional[float] = None
    market_cap: Optional[float] = None


@dataclass
class PECalculationInput:
    """Input data for P/E ratio calculations."""
    current_price: float
    eps_ttm: Optional[float] = None
    eps_forward: Optional[float] = None
    eps_two_year_forward: Optional[float] = None


@dataclass
class MarginCalculationInput:
    """Input data for margin calculations."""
    revenue: float
    cost_of_revenue: Optional[float] = None
    net_income: Optional[float] = None
    gross_profit: Optional[float] = None