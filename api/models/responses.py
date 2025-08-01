"""Response models for the FastAPI application"""

from pydantic import BaseModel
from typing import Dict, Optional, Any


class MetricsResponse(BaseModel):
    """Model for stock metrics response"""
    TTM_PE: float | None
    Forward_PE: float | None
    Two_Year_Forward_PE: float | None
    TTM_EPS_Growth: float | None
    Current_Year_EPS_Growth: float | None
    Next_Year_EPS_Growth: float | None
    TTM_Revenue_Growth: float | None
    Current_Year_Revenue_Growth: float | None
    Next_Year_Revenue_Growth: float | None
    Gross_Margin: float | None
    Net_Margin: float | None
    TTM_PS_Ratio: float | None
    Forward_PS_Ratio: float | None


class ProjectionResponse(BaseModel):
    """Model for the projection response"""
    success: bool
    ticker: str
    current_year: int
    base_data: Dict[str, float]
    projections: Dict[int, Dict[str, float]]
    summary: Dict[str, Any]
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """Model for error responses"""
    success: bool = False
    error: str
    ticker: Optional[str] = None