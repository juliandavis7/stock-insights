"""TTM (Trailing Twelve Months) calculator."""

from typing import Dict, List, Optional
from .base_calculator import BaseCalculator
from ..models.metric_models import MetricResult, TTMCalculationInput, QuarterlyData
from ..metrics_constants import (
    TTM_PE_KEY,
    TTM_PS_RATIO_KEY,
    TTM_EPS_GROWTH_KEY,
    TTM_REVENUE_GROWTH_KEY,
    GROSS_MARGIN_KEY,
    NET_MARGIN_KEY,
    QUARTERS_FOR_TTM,
    QUARTERS_FOR_COMPARISON,
    MIN_QUARTERS_FOR_TTM,
    MIN_QUARTERS_FOR_GROWTH,
    REVENUE_FIELD,
    COST_OF_REVENUE_FIELD,
    NET_INCOME_FIELD,
    EPS_FIELD,
    RATIO_PRECISION,
    GROWTH_PRECISION,
    PERCENTAGE_MULTIPLIER
)


class TTMCalculator(BaseCalculator):
    """Calculator for TTM-based metrics."""
    
    def calculate(self, input_data: TTMCalculationInput) -> Dict[str, MetricResult]:
        """
        Calculate TTM metrics from quarterly data.
        
        Args:
            input_data: TTMCalculationInput containing quarterly data and stock info
            
        Returns:
            Dictionary of TTM metric results
        """
        results = {}
        
        quarterly_data = input_data.quarterly_data
        
        if len(quarterly_data) < MIN_QUARTERS_FOR_TTM:
            error_msg = f"Insufficient quarterly data for TTM calculations (need {MIN_QUARTERS_FOR_TTM}, got {len(quarterly_data)})"
            return self._create_all_failure_results(error_msg)
        
        # Calculate TTM aggregated values
        ttm_values = self._calculate_ttm_aggregates(quarterly_data[:QUARTERS_FOR_TTM])
        
        # TTM P/E Ratio
        if input_data.current_price:
            results[TTM_PE_KEY] = self._calculate_ttm_pe(
                input_data.current_price,
                ttm_values['eps']
            )
        
        # TTM P/S Ratio
        if input_data.market_cap:
            results[TTM_PS_RATIO_KEY] = self._calculate_ttm_ps(
                input_data.market_cap,
                ttm_values['revenue']
            )
        
        # TTM Margins
        margin_results = self._calculate_ttm_margins(ttm_values)
        results.update(margin_results)
        
        # TTM Growth rates (if enough data available)
        if len(quarterly_data) >= MIN_QUARTERS_FOR_GROWTH:
            growth_results = self._calculate_ttm_growth_rates(quarterly_data)
            results.update(growth_results)
        
        # Log all results
        for metric_name, result in results.items():
            self._log_calculation(metric_name, result)
        
        return results
    
    def _calculate_ttm_aggregates(self, quarters: List[QuarterlyData]) -> Dict[str, float]:
        """Calculate TTM aggregated values from quarterly data."""
        aggregates = {
            'revenue': 0,
            'cost_of_revenue': 0,
            'net_income': 0,
            'eps': 0
        }
        
        for quarter in quarters:
            aggregates['revenue'] += quarter.revenue or 0
            aggregates['cost_of_revenue'] += quarter.cost_of_revenue or 0
            aggregates['net_income'] += quarter.net_income or 0
            aggregates['eps'] += quarter.eps or 0
        
        return aggregates
    
    def _calculate_ttm_pe(self, current_price: float, ttm_eps: float) -> MetricResult:
        """Calculate TTM P/E ratio."""
        if not self._validate_positive_number(current_price, "current_price"):
            return self._create_failure_result("Invalid current price for TTM P/E")
        
        if not self._validate_positive_number(ttm_eps, "ttm_eps"):
            return self._create_failure_result("Invalid TTM EPS for P/E calculation")
        
        pe_ratio = self._safe_divide(current_price, ttm_eps)
        if pe_ratio is None:
            return self._create_failure_result("Could not calculate TTM P/E ratio")
        
        return self._create_success_result(pe_ratio, RATIO_PRECISION)
    
    def _calculate_ttm_ps(self, market_cap: float, ttm_revenue: float) -> MetricResult:
        """Calculate TTM P/S ratio."""
        if not self._validate_positive_number(market_cap, "market_cap"):
            return self._create_failure_result("Invalid market cap for TTM P/S")
        
        if not self._validate_positive_number(ttm_revenue, "ttm_revenue"):
            return self._create_failure_result("Invalid TTM revenue for P/S calculation")
        
        ps_ratio = self._safe_divide(market_cap, ttm_revenue)
        if ps_ratio is None:
            return self._create_failure_result("Could not calculate TTM P/S ratio")
        
        return self._create_success_result(ps_ratio, RATIO_PRECISION)
    
    def _calculate_ttm_margins(self, ttm_values: Dict[str, float]) -> Dict[str, MetricResult]:
        """Calculate TTM margin metrics."""
        results = {}
        
        ttm_revenue = ttm_values['revenue']
        ttm_cost_of_revenue = ttm_values['cost_of_revenue']
        ttm_net_income = ttm_values['net_income']
        
        # Gross Margin
        if self._validate_positive_number(ttm_revenue, "ttm_revenue"):
            gross_profit = ttm_revenue - ttm_cost_of_revenue
            gross_margin = self._safe_percentage(gross_profit, ttm_revenue)
            
            if gross_margin is not None:
                results[GROSS_MARGIN_KEY] = self._create_success_result(gross_margin, GROWTH_PRECISION)
            else:
                results[GROSS_MARGIN_KEY] = self._create_failure_result("Could not calculate TTM gross margin")
        else:
            results[GROSS_MARGIN_KEY] = self._create_failure_result("Invalid TTM revenue for gross margin")
        
        # Net Margin
        if self._validate_positive_number(ttm_revenue, "ttm_revenue"):
            net_margin = self._safe_percentage(ttm_net_income, ttm_revenue)
            
            if net_margin is not None:
                results[NET_MARGIN_KEY] = self._create_success_result(net_margin, GROWTH_PRECISION)
            else:
                results[NET_MARGIN_KEY] = self._create_failure_result("Could not calculate TTM net margin")
        else:
            results[NET_MARGIN_KEY] = self._create_failure_result("Invalid TTM revenue for net margin")
        
        return results
    
    def _calculate_ttm_growth_rates(self, quarterly_data: List[QuarterlyData]) -> Dict[str, MetricResult]:
        """Calculate TTM growth rates by comparing current vs previous TTM periods."""
        results = {}
        
        # Current TTM (last 4 quarters)
        current_ttm = self._calculate_ttm_aggregates(quarterly_data[:QUARTERS_FOR_TTM])
        
        # Previous TTM (quarters 4-7)
        previous_ttm = self._calculate_ttm_aggregates(quarterly_data[QUARTERS_FOR_TTM:QUARTERS_FOR_COMPARISON])
        
        # EPS Growth
        eps_growth = self._calculate_growth_rate(
            current_ttm['eps'],
            previous_ttm['eps'],
            "TTM EPS growth"
        )
        results[TTM_EPS_GROWTH_KEY] = eps_growth
        
        # Revenue Growth
        revenue_growth = self._calculate_growth_rate(
            current_ttm['revenue'],
            previous_ttm['revenue'],
            "TTM revenue growth"
        )
        results[TTM_REVENUE_GROWTH_KEY] = revenue_growth
        
        return results
    
    def _calculate_growth_rate(self, current_value: float, previous_value: float, metric_name: str) -> MetricResult:
        """Calculate growth rate between two values."""
        if not self._validate_positive_number(current_value, f"{metric_name}_current"):
            return self._create_failure_result(f"Invalid current value for {metric_name}")
        
        if not self._validate_positive_number(previous_value, f"{metric_name}_previous"):
            return self._create_failure_result(f"Invalid previous value for {metric_name}")
        
        growth_percentage = self._calculate_growth_percentage(current_value, previous_value)
        
        if growth_percentage is None:
            return self._create_failure_result(f"Could not calculate {metric_name}")
        
        return self._create_success_result(growth_percentage, GROWTH_PRECISION)
    
    def _calculate_growth_percentage(self, current_value: float, previous_value: float) -> Optional[float]:
        """Calculate growth percentage between two values."""
        if previous_value == 0:
            self.logger.warning("Previous value is zero, cannot calculate growth")
            return None
        
        try:
            growth = ((current_value - previous_value) / abs(previous_value)) * PERCENTAGE_MULTIPLIER
            return growth
        except (TypeError, ValueError) as e:
            self.logger.warning(f"Error calculating growth percentage: {e}")
            return None
    
    def _create_all_failure_results(self, error_message: str) -> Dict[str, MetricResult]:
        """Create failure results for all TTM metrics."""
        return {
            TTM_PE_KEY: self._create_failure_result(error_message),
            TTM_PS_RATIO_KEY: self._create_failure_result(error_message),
            TTM_EPS_GROWTH_KEY: self._create_failure_result(error_message),
            TTM_REVENUE_GROWTH_KEY: self._create_failure_result(error_message),
            GROSS_MARGIN_KEY: self._create_failure_result(error_message),
            NET_MARGIN_KEY: self._create_failure_result(error_message)
        }