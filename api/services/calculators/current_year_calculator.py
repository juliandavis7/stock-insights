"""Current year hybrid calculation calculator."""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from .base_calculator import BaseCalculator
from ..models.metric_models import MetricResult
from ..metrics_constants import GROWTH_PRECISION
from ... import util


class CurrentYearCalculator(BaseCalculator):
    """Calculator for current year hybrid metrics combining actual and estimated quarters."""
    
    def calculate(self, input_data) -> Dict[str, MetricResult]:
        """
        Required abstract method implementation from BaseCalculator.
        This calculator doesn't use the standard input pattern, so we return empty results.
        """
        return {}
    
    def get_quarters_elapsed_in_year(self, target_year: int = None) -> int:
        """
        Calculate how many fiscal quarters have elapsed in the target year.
        Assumes calendar year = fiscal year for simplicity.
        """
        if target_year is None:
            target_year = datetime.now().year
        
        current_date = datetime.now()
        current_year = current_date.year
        
        if target_year > current_year:
            return 0  # Future year, no quarters elapsed
        elif target_year < current_year:
            return 4  # Past year, all quarters elapsed
        else:
            # Current year - calculate based on current month
            current_month = current_date.month
            if current_month <= 3:
                return 0  # Q1 not yet complete
            elif current_month <= 6:
                return 1  # Q1 complete
            elif current_month <= 9:
                return 2  # Q1, Q2 complete
            else:
                return 3  # Q1, Q2, Q3 complete
    
    def filter_quarters_by_year(self, data: List[Dict], target_year: int) -> List[Dict]:
        """Filter quarterly data to only include specified year"""
        if not data:
            return []
            
        filtered = []
        for quarter in data:
            try:
                date_str = quarter.get('date', '')
                if not date_str:
                    continue
                    
                # Extract year from date (format: "2025-06-30")
                quarter_year = int(date_str.split('-')[0])
                
                if quarter_year == target_year:
                    filtered.append(quarter)
            except (KeyError, ValueError, IndexError):
                continue
        
        # Sort by date (most recent first)
        filtered.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return filtered
    
    def get_actual_quarters_data(self, quarterly_data: List[Dict], target_year: int, num_quarters: int) -> Tuple[float, float]:
        """
        Get actual EPS and revenue for the most recent completed quarters.
        Returns (total_eps, total_revenue) for the specified number of quarters.
        """
        if not quarterly_data:
            return 0.0, 0.0
            
        year_data = self.filter_quarters_by_year(quarterly_data, target_year)
        
        # Take the most recent completed quarters
        actual_quarters = year_data[:num_quarters]
        
        total_eps = sum(q.get('eps', 0) for q in actual_quarters if q.get('eps') is not None)
        total_revenue = sum(q.get('revenue', 0) for q in actual_quarters if q.get('revenue') is not None)
        
        return total_eps, total_revenue
    
    def get_estimated_quarters_data(self, estimates_data: List[Dict], target_year: int, num_quarters: int) -> Tuple[float, float]:
        """
        Get estimated EPS and revenue for future quarters.
        Supports both quarterly estimates (preferred) and annual estimates (fallback).
        Returns (total_eps, total_revenue) for the specified number of quarters.
        """
        if not estimates_data or num_quarters <= 0:
            return 0.0, 0.0
        
        # First, try to get quarterly estimates (preferred method)
        quarterly_estimates = self._get_quarterly_estimates(estimates_data, target_year, num_quarters)
        if quarterly_estimates[0] > 0 or quarterly_estimates[1] > 0:
            return quarterly_estimates
        
        # Fallback to annual estimates scaled down to quarterly values
        return self._get_annual_estimates_scaled(estimates_data, target_year, num_quarters)
    
    def _get_quarterly_estimates(self, estimates_data: List[Dict], target_year: int, num_quarters: int) -> Tuple[float, float]:
        """
        Get quarterly estimates from FMP analyst estimates data.
        This is the preferred method as it uses actual quarterly estimates.
        """
        year_data = self.filter_quarters_by_year(estimates_data, target_year)
        
        # Take the next quarters (estimates are usually sorted chronologically)
        estimated_quarters = year_data[:num_quarters]
        
        total_eps = sum(q.get('estimatedEpsAvg', 0) for q in estimated_quarters if q.get('estimatedEpsAvg') is not None)
        total_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in estimated_quarters if q.get('estimatedRevenueAvg') is not None)
        
        return total_eps, total_revenue
    
    def _get_annual_estimates_scaled(self, estimates_data: List[Dict], target_year: int, num_quarters: int) -> Tuple[float, float]:
        """
        Fallback method: Get annual estimates and scale them down to quarterly values.
        """
        # Find the annual estimate for the target year
        annual_estimate = None
        for estimate in estimates_data:
            try:
                estimate_year = int(estimate.get('date', '').split('-')[0])
                if estimate_year == target_year:
                    annual_estimate = estimate
                    break
            except (ValueError, IndexError):
                continue
        
        if not annual_estimate:
            return 0.0, 0.0
        
        # Get annual values
        annual_eps = annual_estimate.get('estimatedEpsAvg', 0.0) or 0.0
        annual_revenue = annual_estimate.get('estimatedRevenueAvg', 0.0) or 0.0
        
        # Scale down to quarterly values (divide by 4)
        quarterly_eps = annual_eps / 4.0
        quarterly_revenue = annual_revenue / 4.0
        
        # Calculate total for the remaining quarters
        total_eps = quarterly_eps * num_quarters
        total_revenue = quarterly_revenue * num_quarters
        
        return total_eps, total_revenue
    
    def get_all_estimated_quarters_data(self, estimates_data: List[Dict], target_year: int) -> Tuple[float, float]:
        """
        Get estimated EPS and revenue for ALL quarters of the target year (Q1-Q4).
        This is used for the estimates-only calculation.
        Returns (total_eps, total_revenue) for all 4 quarters.
        """
        if not estimates_data:
            return 0.0, 0.0
        
        # First, try to get quarterly estimates (preferred method)
        quarterly_estimates = self._get_quarterly_estimates(estimates_data, target_year, 4)
        if quarterly_estimates[0] > 0 or quarterly_estimates[1] > 0:
            return quarterly_estimates
        
        # Fallback to annual estimates
        annual_estimate = None
        for estimate in estimates_data:
            try:
                estimate_year = int(estimate.get('date', '').split('-')[0])
                if estimate_year == target_year:
                    annual_estimate = estimate
                    break
            except (ValueError, IndexError):
                continue
        
        if not annual_estimate:
            return 0.0, 0.0
        
        # Get annual values (no scaling needed for full year)
        total_eps = annual_estimate.get('estimatedEpsAvg', 0.0) or 0.0
        total_revenue = annual_estimate.get('estimatedRevenueAvg', 0.0) or 0.0
        
        return total_eps, total_revenue
    
    def calculate_hybrid_current_year(self, quarterly_data: List[Dict], estimates_data: List[Dict], target_year: int = None) -> Dict[str, float]:
        """
        Calculate hybrid current year EPS and revenue by combining actual + estimated quarters.
        
        Args:
            quarterly_data: List of quarterly income statement data
            estimates_data: List of analyst estimates data
            target_year: Year to calculate for (defaults to current year)
            
        Returns:
            Dictionary with hybrid calculation results
        """
        if target_year is None:
            target_year = datetime.now().year
        
        self.logger.info(f"🔍 Calculating hybrid {target_year} metrics")
        
        # Determine quarters split
        quarters_elapsed = self.get_quarters_elapsed_in_year(target_year)
        quarters_remaining = 4 - quarters_elapsed
        
        self.logger.info(f"📊 Quarters elapsed: {quarters_elapsed}, Quarters remaining: {quarters_remaining}")
        
        # Get actual data for completed quarters
        actual_eps, actual_revenue = 0.0, 0.0
        if quarters_elapsed > 0:
            actual_eps, actual_revenue = self.get_actual_quarters_data(quarterly_data, target_year, quarters_elapsed)
            self.logger.info(f"📈 Actual quarters: EPS={actual_eps:.3f}, Revenue=${actual_revenue:,.0f}")
        
        # Get estimated data for remaining quarters
        estimated_eps, estimated_revenue = 0.0, 0.0
        if quarters_remaining > 0:
            estimated_eps, estimated_revenue = self.get_estimated_quarters_data(estimates_data, target_year, quarters_remaining)
            self.logger.info(f"🔮 Estimated quarters: EPS={estimated_eps:.3f}, Revenue=${estimated_revenue:,.0f}")
        
        # Calculate hybrid totals
        hybrid_eps = actual_eps + estimated_eps
        hybrid_revenue = actual_revenue + estimated_revenue
        
        self.logger.info(f"✅ Hybrid {target_year}: EPS={hybrid_eps:.3f}, Revenue=${hybrid_revenue:,.0f}")
        
        return {
            'year': target_year,
            'quarters_elapsed': quarters_elapsed,
            'quarters_remaining': quarters_remaining,
            'actual_eps': actual_eps,
            'estimated_eps': estimated_eps,
            'hybrid_eps': hybrid_eps,
            'actual_revenue': actual_revenue,
            'estimated_revenue': estimated_revenue,
            'hybrid_revenue': hybrid_revenue
        }
    
    def calculate_estimates_only_current_year(self, estimates_data: List[Dict], target_year: int = None) -> Dict[str, float]:
        """
        Calculate estimates-only current year EPS and revenue using ALL estimated quarters (Q1-Q4).
        
        Args:
            estimates_data: List of analyst estimates data
            target_year: Year to calculate for (defaults to current year)
            
        Returns:
            Dictionary with estimates-only calculation results
        """
        if target_year is None:
            target_year = datetime.now().year
        
        self.logger.info(f"🔍 Calculating estimates-only {target_year} metrics")
        
        # Get estimated data for all quarters (Q1-Q4)
        estimated_eps, estimated_revenue = self.get_all_estimated_quarters_data(estimates_data, target_year)
        
        self.logger.info(f"✅ Estimates-only {target_year}: EPS={estimated_eps:.3f}, Revenue=${estimated_revenue:,.0f}")
        
        return {
            'year': target_year,
            'estimated_eps': estimated_eps,
            'estimated_revenue': estimated_revenue
        }
    
    def calculate_actual_previous_year(self, quarterly_data: List[Dict], target_year: int) -> Dict[str, float]:
        """
        Calculate actual previous year metrics using all 4 quarters (complete year).
        
        Args:
            quarterly_data: List of quarterly income statement data
            target_year: Previous year to calculate for
            
        Returns:
            Dictionary with actual year metrics
        """
        # For previous year, get all 4 quarters (complete year)
        actual_eps, actual_revenue = self.get_actual_quarters_data(quarterly_data, target_year, 4)
        
        return {
            'year': target_year,
            'quarters_elapsed': 4,
            'quarters_remaining': 0,
            'actual_eps': actual_eps,
            'estimated_eps': 0.0,
            'hybrid_eps': actual_eps,  # For previous year, hybrid = actual
            'actual_revenue': actual_revenue,
            'estimated_revenue': 0.0,
            'hybrid_revenue': actual_revenue  # For previous year, hybrid = actual
        }
    
    def calculate_current_year_eps(self, quarterly_data: List[Dict], estimates_data: List[Dict], target_year: int = None) -> MetricResult:
        """
        Calculate current year EPS using hybrid approach.
        
        Args:
            quarterly_data: List of quarterly income statement data
            estimates_data: List of analyst estimates data
            target_year: Year to calculate for (defaults to current year)
            
        Returns:
            MetricResult with current year EPS
        """
        try:
            self.logger.info(f"🔍 Starting current year EPS calculation for {target_year or datetime.now().year}")
            
            hybrid_result = self.calculate_hybrid_current_year(quarterly_data, estimates_data, target_year)
            hybrid_eps = hybrid_result['hybrid_eps']
            
            if hybrid_eps <= 0:
                return self._create_failure_result(f"Invalid hybrid EPS: {hybrid_eps}")
            
            self.logger.info(f"✅ Current Year EPS: {hybrid_eps:.3f}")
            return self._create_success_result(hybrid_eps, GROWTH_PRECISION)
            
        except Exception as e:
            error_msg = f"Error calculating current year EPS: {e}"
            self.logger.error(f"❌ {error_msg}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return self._create_failure_result(error_msg)
    
    def calculate_current_year_revenue(self, quarterly_data: List[Dict], estimates_data: List[Dict], target_year: int = None) -> MetricResult:
        """
        Calculate current year revenue using hybrid approach.
        
        Args:
            quarterly_data: List of quarterly income statement data
            estimates_data: List of analyst estimates data
            target_year: Year to calculate for (defaults to current year)
            
        Returns:
            MetricResult with current year revenue
        """
        try:
            self.logger.info(f"🔍 Starting current year revenue calculation for {target_year or datetime.now().year}")
            
            hybrid_result = self.calculate_hybrid_current_year(quarterly_data, estimates_data, target_year)
            hybrid_revenue = hybrid_result['hybrid_revenue']
            
            if hybrid_revenue <= 0:
                return self._create_failure_result(f"Invalid hybrid revenue: {hybrid_revenue}")
            
            self.logger.info(f"✅ Current Year Revenue: ${hybrid_revenue:,.0f}")
            return self._create_success_result(hybrid_revenue, GROWTH_PRECISION)
            
        except Exception as e:
            error_msg = f"Error calculating current year revenue: {e}"
            self.logger.error(f"❌ {error_msg}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return self._create_failure_result(error_msg)
    
    
    def calculate_current_year_growth_rates(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                          current_year: int = None, previous_year: int = None) -> Dict[str, MetricResult]:
        """
        Calculate EPS and revenue growth rates using hybrid methodology for both years.
        
        Args:
            quarterly_data: List of quarterly income statement data
            estimates_data: List of analyst estimates data
            current_year: Current year to calculate for (defaults to current year)
            previous_year: Previous year to compare against (defaults to current_year - 1)
            
        Returns:
            Dictionary with growth rate results
        """
        try:
            if current_year is None:
                current_year = datetime.now().year
            if previous_year is None:
                previous_year = current_year - 1
            
            
            # Calculate hybrid metrics for current year
            current_metrics = self.calculate_hybrid_current_year(quarterly_data, estimates_data, current_year)
            
            # For previous year, we should use actual annual data, not hybrid calculation
            # since the previous year is complete
            previous_metrics = self.calculate_actual_previous_year(quarterly_data, previous_year)
            
            # Calculate growth rates
            eps_growth = 0.0
            revenue_growth = 0.0
            
            if previous_metrics['hybrid_eps'] != 0:
                eps_growth = ((current_metrics['hybrid_eps'] - previous_metrics['hybrid_eps']) / 
                             abs(previous_metrics['hybrid_eps'])) * 100
            
            if previous_metrics['hybrid_revenue'] != 0:
                revenue_growth = ((current_metrics['hybrid_revenue'] - previous_metrics['hybrid_revenue']) / 
                                abs(previous_metrics['hybrid_revenue'])) * 100
            
            return {
                'current_year_eps_growth': self._create_success_result(eps_growth, GROWTH_PRECISION),
                'current_year_revenue_growth': self._create_success_result(revenue_growth, GROWTH_PRECISION)
            }
            
        except Exception as e:
            error_msg = f"Error calculating growth rates: {e}"
            self.logger.error(f"❌ {error_msg}")
            import traceback
            self.logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return {
                'current_year_eps_growth': self._create_failure_result(error_msg),
                'current_year_revenue_growth': self._create_failure_result(error_msg)
            }
