"""Margin calculator."""

from typing import Dict, Optional
from .base_calculator import BaseCalculator
from ..models.metric_models import MetricResult, MarginCalculationInput
from ..metrics_constants import (
    GROSS_MARGIN_KEY,
    NET_MARGIN_KEY,
    GROWTH_PRECISION,
    PERCENTAGE_MULTIPLIER
)


class MarginCalculator(BaseCalculator):
    """Calculator for margin metrics."""
    
    def calculate(self, input_data: MarginCalculationInput) -> Dict[str, MetricResult]:
        """
        Calculate margin metrics.
        
        Args:
            input_data: MarginCalculationInput containing revenue and cost data
            
        Returns:
            Dictionary of margin results
        """
        results = {}
        
        # Gross Margin
        results[GROSS_MARGIN_KEY] = self._calculate_gross_margin(input_data)
        
        # Net Margin
        results[NET_MARGIN_KEY] = self._calculate_net_margin(input_data)
        
        # Log all results
        for metric_name, result in results.items():
            self._log_calculation(metric_name, result)
        
        return results
    
    def calculate_from_ttm_data(
        self,
        ttm_revenue: float,
        ttm_cost_of_revenue: Optional[float] = None,
        ttm_net_income: Optional[float] = None
    ) -> Dict[str, MetricResult]:
        """
        Calculate margins from TTM aggregated data.
        
        Args:
            ttm_revenue: TTM total revenue
            ttm_cost_of_revenue: TTM total cost of revenue
            ttm_net_income: TTM total net income
            
        Returns:
            Dictionary of margin results
        """
        input_data = MarginCalculationInput(
            revenue=ttm_revenue,
            cost_of_revenue=ttm_cost_of_revenue,
            net_income=ttm_net_income
        )
        
        return self.calculate(input_data)
    
    def _calculate_gross_margin(self, input_data: MarginCalculationInput) -> MetricResult:
        """Calculate gross margin percentage."""
        if not self._validate_positive_number(input_data.revenue, "revenue"):
            return self._create_failure_result("Invalid revenue for gross margin calculation")
        
        # Try to calculate gross profit from available data
        gross_profit = None
        
        if input_data.gross_profit is not None:
            gross_profit = input_data.gross_profit
        elif input_data.cost_of_revenue is not None:
            gross_profit = input_data.revenue - input_data.cost_of_revenue
        else:
            return self._create_failure_result("No gross profit or cost of revenue data available")
        
        gross_margin = self._safe_percentage(gross_profit, input_data.revenue)
        
        if gross_margin is None:
            return self._create_failure_result("Could not calculate gross margin")
        
        return self._create_success_result(gross_margin, GROWTH_PRECISION)
    
    def _calculate_net_margin(self, input_data: MarginCalculationInput) -> MetricResult:
        """Calculate net margin percentage."""
        if not self._validate_positive_number(input_data.revenue, "revenue"):
            return self._create_failure_result("Invalid revenue for net margin calculation")
        
        if input_data.net_income is None:
            return self._create_failure_result("No net income data available")
        
        net_margin = self._safe_percentage(input_data.net_income, input_data.revenue)
        
        if net_margin is None:
            return self._create_failure_result("Could not calculate net margin")
        
        return self._create_success_result(net_margin, GROWTH_PRECISION)