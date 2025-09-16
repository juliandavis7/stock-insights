"""P/E ratio calculator."""

from typing import Dict, Any, Optional
from .base_calculator import BaseCalculator
from ..models.metric_models import MetricResult, PECalculationInput
from ..metrics_constants import (
    TTM_PE_KEY,
    FORWARD_PE_KEY,
    TWO_YEAR_FORWARD_PE_KEY,
    RATIO_PRECISION
)


class PECalculator(BaseCalculator):
    """Calculator for P/E ratio metrics."""
    
    def calculate(self, input_data: PECalculationInput) -> Dict[str, MetricResult]:
        """
        Calculate P/E ratios.
        
        Args:
            input_data: PECalculationInput containing price and EPS data
            
        Returns:
            Dictionary of P/E ratio results
        """
        results = {}
        
        # TTM P/E
        results[TTM_PE_KEY] = self._calculate_ttm_pe(
            input_data.current_price, 
            input_data.eps_ttm
        )
        
        # Forward P/E
        results[FORWARD_PE_KEY] = self._calculate_forward_pe(
            input_data.current_price,
            input_data.eps_forward
        )
        
        # Two-year forward P/E
        results[TWO_YEAR_FORWARD_PE_KEY] = self._calculate_two_year_forward_pe(
            input_data.current_price,
            input_data.eps_two_year_forward
        )
        
        # Log all results
        for metric_name, result in results.items():
            self._log_calculation(metric_name, result)
        
        return results
    
    def _calculate_ttm_pe(self, current_price: float, eps_ttm: Optional[float]) -> MetricResult:
        """Calculate trailing twelve months P/E ratio."""
        if not self._validate_positive_number(current_price, "current_price"):
            return self._create_failure_result("Invalid current price")
        
        if not self._validate_positive_number(eps_ttm, "eps_ttm"):
            return self._create_failure_result("Invalid TTM EPS")
        
        pe_ratio = self._safe_divide(current_price, eps_ttm)
        if pe_ratio is None:
            return self._create_failure_result("Could not calculate TTM P/E ratio")
        
        return self._create_success_result(pe_ratio, RATIO_PRECISION)
    
    def _calculate_forward_pe(self, current_price: float, eps_forward: Optional[float]) -> MetricResult:
        """Calculate forward P/E ratio."""
        if not self._validate_positive_number(current_price, "current_price"):
            return self._create_failure_result("Invalid current price")
        
        if not self._validate_positive_number(eps_forward, "eps_forward"):
            return self._create_failure_result("Invalid forward EPS")
        
        pe_ratio = self._safe_divide(current_price, eps_forward)
        if pe_ratio is None:
            return self._create_failure_result("Could not calculate forward P/E ratio")
        
        return self._create_success_result(pe_ratio, RATIO_PRECISION)
    
    def _calculate_two_year_forward_pe(self, current_price: float, eps_two_year: Optional[float]) -> MetricResult:
        """Calculate two-year forward P/E ratio."""
        if not self._validate_positive_number(current_price, "current_price"):
            return self._create_failure_result("Invalid current price")
        
        if not self._validate_positive_number(eps_two_year, "eps_two_year"):
            return self._create_failure_result("Invalid two-year forward EPS")
        
        pe_ratio = self._safe_divide(current_price, eps_two_year)
        if pe_ratio is None:
            return self._create_failure_result("Could not calculate two-year forward P/E ratio")
        
        return self._create_success_result(pe_ratio, RATIO_PRECISION)