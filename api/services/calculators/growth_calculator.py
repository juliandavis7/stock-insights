"""Growth metrics calculator."""

from typing import Dict, List, Optional
from datetime import datetime
from .base_calculator import BaseCalculator
from .current_year_calculator import CurrentYearCalculator
from ..models.metric_models import MetricResult, GrowthCalculationInput
from ..metrics_constants import (
    TTM_EPS_GROWTH_KEY,
    CURRENT_YEAR_EPS_GROWTH_KEY,
    NEXT_YEAR_EPS_GROWTH_KEY,
    TTM_REVENUE_GROWTH_KEY,
    CURRENT_YEAR_REVENUE_GROWTH_KEY,
    NEXT_YEAR_REVENUE_GROWTH_KEY,
    GROWTH_PRECISION,
    PERCENTAGE_MULTIPLIER,
    FMP_ESTIMATED_EPS_AVG,
    FMP_ESTIMATED_REVENUE_AVG
)
from ... import util


class GrowthCalculator(BaseCalculator):
    """Calculator for growth metrics."""
    
    def __init__(self):
        super().__init__()
        self.current_year_calculator = CurrentYearCalculator()
    
    def calculate(self, input_data: GrowthCalculationInput) -> Dict[str, MetricResult]:
        """
        Calculate simple growth rate from input data.
        
        Args:
            input_data: GrowthCalculationInput with current and previous values
            
        Returns:
            Dictionary with single growth result
        """
        return {"growth_rate": self.calculate_simple_growth(input_data)}
    
    def calculate_current_year_eps_growth(self, income_data: List[Dict], fmp_estimates: List[Dict], quarterly_data: List[Dict] = None) -> MetricResult:
        """
        Calculate current year EPS growth using hybrid approach: actual reported quarters + estimated future quarters.
        
        Args:
            income_data: Historical income statement data (actual annual)
            fmp_estimates: FMP analyst estimates (for current year)
            quarterly_data: Quarterly income statement data for hybrid calculation
            
        Returns:
            MetricResult with current year EPS growth
        """
        try:
            current_year = datetime.now().year
            prev_year = current_year - 1
            
            self.logger.info(f"🔍 Calculating current year EPS growth using hybrid approach for {current_year}")
            
            # Use the current year calculator for hybrid growth calculation
            if quarterly_data and fmp_estimates:
                growth_results = self.current_year_calculator.calculate_current_year_growth_rates(
                    quarterly_data, fmp_estimates, current_year, prev_year
                )
                return growth_results['current_year_eps_growth']
            else:
                # Fallback to traditional approach if no quarterly data
                self.logger.warning(f"⚠️ Falling back to traditional approach - quarterly_data={bool(quarterly_data)}, fmp_estimates={bool(fmp_estimates)}")
                return self._calculate_traditional_current_year_eps_growth(income_data, fmp_estimates)
            
        except Exception as e:
            error_msg = f"Error calculating current year EPS growth: {e}"
            self.logger.error(f"❌ {error_msg}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return self._create_failure_result(error_msg)
    
    def _calculate_traditional_current_year_eps_growth(self, income_data: List[Dict], fmp_estimates: List[Dict]) -> MetricResult:
        """Fallback method for traditional current year EPS growth calculation."""
        try:
            current_year = datetime.now().year
            current_year_str = str(current_year)
            prev_year_str = str(current_year - 1)
            
            # Extract actual historical EPS from income statement
            historical_eps = util.extract_metric_by_year(income_data, 'eps')
            
            # Validate previous year data availability
            if prev_year_str not in historical_eps:
                return self._create_failure_result(f"No historical EPS data for {prev_year_str}")
            
            prev_eps = historical_eps[prev_year_str]
            
            # Validate previous year EPS
            if not self._validate_positive_number(prev_eps, f"previous_eps_{prev_year_str}"):
                return self._create_failure_result(f"Invalid previous year EPS: {prev_eps}")
            
            # Get current year estimate
            current_year_eps_estimates = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_EPS_AVG)
            if current_year_str not in current_year_eps_estimates:
                return self._create_failure_result(f"No current year EPS estimate for {current_year_str}")
            
            current_eps = current_year_eps_estimates[current_year_str]
            
            # Validate current year EPS
            if not self._validate_positive_number(current_eps, f"current_eps_{current_year_str}"):
                return self._create_failure_result(f"Invalid current year EPS: {current_eps}")
            
            # Calculate growth
            eps_growth = self._calculate_growth_percentage(current_eps, prev_eps)
            if eps_growth is None:
                return self._create_failure_result("Could not calculate current year EPS growth")
            
            self.logger.info(f"✅ Traditional Current Year EPS Growth: {eps_growth:.2f}%")
            return self._create_success_result(eps_growth, GROWTH_PRECISION)
            
        except Exception as e:
            return self._create_failure_result(f"Error in traditional EPS growth calculation: {e}")
    
    def calculate_current_year_revenue_growth(self, income_data: List[Dict], fmp_estimates: List[Dict], quarterly_data: List[Dict] = None) -> MetricResult:
        """
        Calculate current year revenue growth using hybrid approach: actual reported quarters + estimated future quarters.
        
        Args:
            income_data: Historical income statement data (actual annual)
            fmp_estimates: FMP analyst estimates (for current year)
            quarterly_data: Quarterly income statement data for hybrid calculation
            
        Returns:
            MetricResult with current year revenue growth
        """
        try:
            current_year = datetime.now().year
            prev_year = current_year - 1
            
            self.logger.info(f"🔍 Calculating current year revenue growth using hybrid approach for {current_year}")
            
            # Use the current year calculator for hybrid growth calculation
            if quarterly_data and fmp_estimates:
                growth_results = self.current_year_calculator.calculate_current_year_growth_rates(
                    quarterly_data, fmp_estimates, current_year, prev_year
                )
                return growth_results['current_year_revenue_growth']
            else:
                # Fallback to traditional approach if no quarterly data
                self.logger.warning(f"⚠️ Falling back to traditional approach - quarterly_data={bool(quarterly_data)}, fmp_estimates={bool(fmp_estimates)}")
                return self._calculate_traditional_current_year_revenue_growth(income_data, fmp_estimates)
            
        except Exception as e:
            error_msg = f"Error calculating current year revenue growth: {e}"
            self.logger.error(f"❌ {error_msg}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return self._create_failure_result(error_msg)
    
    def _calculate_traditional_current_year_revenue_growth(self, income_data: List[Dict], fmp_estimates: List[Dict]) -> MetricResult:
        """Fallback method for traditional current year revenue growth calculation."""
        try:
            current_year = datetime.now().year
            current_year_str = str(current_year)
            prev_year_str = str(current_year - 1)
            
            # Extract actual historical revenue from income statement
            historical_revenue = util.extract_metric_by_year(income_data, 'revenue')
            
            # Validate previous year data availability
            if prev_year_str not in historical_revenue:
                return self._create_failure_result(f"No historical revenue data for {prev_year_str}")
            
            prev_revenue = historical_revenue[prev_year_str]
            
            # Validate previous year revenue
            if not self._validate_positive_number(prev_revenue, f"previous_revenue_{prev_year_str}"):
                return self._create_failure_result(f"Invalid previous year revenue: {prev_revenue}")
            
            # Get current year estimate
            current_year_revenue_estimates = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_REVENUE_AVG)
            if current_year_str not in current_year_revenue_estimates:
                return self._create_failure_result(f"No current year revenue estimate for {current_year_str}")
            
            current_revenue = current_year_revenue_estimates[current_year_str]
            
            # Validate current year revenue
            if not self._validate_positive_number(current_revenue, f"current_revenue_{current_year_str}"):
                return self._create_failure_result(f"Invalid current year revenue: {current_revenue}")
            
            # Calculate growth
            revenue_growth = self._calculate_growth_percentage(current_revenue, prev_revenue)
            if revenue_growth is None:
                return self._create_failure_result("Could not calculate current year revenue growth")
            
            self.logger.info(f"✅ Traditional Current Year Revenue Growth: {revenue_growth:.2f}%")
            return self._create_success_result(revenue_growth, GROWTH_PRECISION)
            
        except Exception as e:
            return self._create_failure_result(f"Error in traditional revenue growth calculation: {e}")
    
    def calculate_next_year_eps_growth(self, fmp_estimates: List[Dict]) -> MetricResult:
        """
        Calculate next year EPS growth using analyst estimates only.
        
        Args:
            fmp_estimates: FMP analyst estimates
            
        Returns:
            MetricResult with next year EPS growth
        """
        try:
            current_year = datetime.now().year
            current_year_str = str(current_year)
            next_year_str = str(current_year + 1)
            
            # Extract EPS estimates by year
            eps_by_year = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_EPS_AVG)
            
            # Validate data availability
            if current_year_str not in eps_by_year:
                return self._create_failure_result(f"No current year EPS estimate for {current_year_str}")
            
            if next_year_str not in eps_by_year:
                return self._create_failure_result(f"No next year EPS estimate for {next_year_str}")
            
            # Get values
            current_eps = eps_by_year[current_year_str]
            next_eps = eps_by_year[next_year_str]
            
            # Validate positive numbers
            if not self._validate_positive_number(current_eps, f"current_eps_{current_year_str}"):
                return self._create_failure_result(f"Invalid current year EPS estimate: {current_eps}")
            
            if not self._validate_positive_number(next_eps, f"next_eps_{next_year_str}"):
                return self._create_failure_result(f"Invalid next year EPS estimate: {next_eps}")
            
            # Calculate growth
            eps_growth = self._calculate_growth_percentage(next_eps, current_eps)
            if eps_growth is None:
                return self._create_failure_result("Could not calculate next year EPS growth")
            
            
            return self._create_success_result(eps_growth, GROWTH_PRECISION)
            
        except Exception as e:
            error_msg = f"Error calculating next year EPS growth: {e}"
            self.logger.error(error_msg)
            return self._create_failure_result(error_msg)
    
    def calculate_next_year_revenue_growth(self, fmp_estimates: List[Dict]) -> MetricResult:
        """
        Calculate next year revenue growth using analyst estimates only.
        
        Args:
            fmp_estimates: FMP analyst estimates
            
        Returns:
            MetricResult with next year revenue growth
        """
        try:
            current_year = datetime.now().year
            current_year_str = str(current_year)
            next_year_str = str(current_year + 1)
            
            # Extract revenue estimates by year
            revenue_by_year = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_REVENUE_AVG)
            
            # Validate data availability
            if current_year_str not in revenue_by_year:
                return self._create_failure_result(f"No current year revenue estimate for {current_year_str}")
            
            if next_year_str not in revenue_by_year:
                return self._create_failure_result(f"No next year revenue estimate for {next_year_str}")
            
            # Get values
            current_revenue = revenue_by_year[current_year_str]
            next_revenue = revenue_by_year[next_year_str]
            
            # Validate positive numbers
            if not self._validate_positive_number(current_revenue, f"current_revenue_{current_year_str}"):
                return self._create_failure_result(f"Invalid current year revenue estimate: {current_revenue}")
            
            if not self._validate_positive_number(next_revenue, f"next_revenue_{next_year_str}"):
                return self._create_failure_result(f"Invalid next year revenue estimate: {next_revenue}")
            
            # Calculate growth
            revenue_growth = self._calculate_growth_percentage(next_revenue, current_revenue)
            if revenue_growth is None:
                return self._create_failure_result("Could not calculate next year revenue growth")
            
            
            return self._create_success_result(revenue_growth, GROWTH_PRECISION)
            
        except Exception as e:
            error_msg = f"Error calculating next year revenue growth: {e}"
            self.logger.error(error_msg)
            return self._create_failure_result(error_msg)
    
    
    def calculate_simple_growth(self, input_data: GrowthCalculationInput) -> MetricResult:
        """
        Calculate simple growth rate between two values.
        
        Args:
            input_data: GrowthCalculationInput with current and previous values
            
        Returns:
            MetricResult with growth percentage
        """
        if not self._validate_positive_number(input_data.current_value, "current_value"):
            return self._create_failure_result("Invalid current value")
        
        if not self._validate_positive_number(input_data.previous_value, "previous_value"):
            return self._create_failure_result("Invalid previous value")
        
        growth_rate = self._calculate_growth_percentage(
            input_data.current_value,
            input_data.previous_value
        )
        
        if growth_rate is None:
            return self._create_failure_result("Could not calculate growth rate")
        
        return self._create_success_result(growth_rate, GROWTH_PRECISION)
    
    def _calculate_year_over_year_growth(
        self,
        data_by_year: Dict[str, float],
        current_year: str,
        previous_year: str,
        metric_name: str
    ) -> MetricResult:
        """Calculate year-over-year growth from year-indexed data."""
        
        if current_year not in data_by_year:
            return self._create_failure_result(f"No data available for {current_year}")
        
        if previous_year not in data_by_year:
            return self._create_failure_result(f"No data available for {previous_year}")
        
        current_value = data_by_year[current_year]
        previous_value = data_by_year[previous_year]
        
        if not self._validate_positive_number(current_value, f"{metric_name}_current"):
            return self._create_failure_result(f"Invalid {metric_name} current value")
        
        if not self._validate_positive_number(previous_value, f"{metric_name}_previous"):
            return self._create_failure_result(f"Invalid {metric_name} previous value")
        
        growth_rate = self._calculate_growth_percentage(current_value, previous_value)
        
        if growth_rate is None:
            return self._create_failure_result(f"Could not calculate {metric_name}")
        
        return self._create_success_result(growth_rate, GROWTH_PRECISION)
    
    def _calculate_growth_percentage(self, current_value: float, previous_value: float) -> Optional[float]:
        """Calculate growth percentage between two values."""
        try:
            if previous_value == 0:
                self.logger.warning("Previous value is zero, cannot calculate growth")
                return None
            
            growth = ((current_value - previous_value) / abs(previous_value)) * PERCENTAGE_MULTIPLIER
            return growth
            
        except (TypeError, ValueError, ZeroDivisionError) as e:
            self.logger.warning(f"Error calculating growth percentage: {e}")
            return None