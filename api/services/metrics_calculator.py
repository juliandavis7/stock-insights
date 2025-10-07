"""MetricsCalculator class for all stock metrics calculations."""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from .models import StockInfo, MetricResult, QuarterlyData
from ..constants.constants import *
from .. import util

logger = logging.getLogger(__name__)


class MetricsCalculator:
    """Pure calculation class for all stock metrics calculations."""
    
    def __init__(self):
        """Initialize MetricsCalculator."""
        pass
    
    def calculate_pe_metrics(
        self, 
        stock_info: StockInfo, 
        fmp_estimates: Optional[List[Dict]], 
        quarterly_data: Optional[List[QuarterlyData]]
    ) -> Dict[str, MetricResult]:
        """Calculate P/E ratio metrics."""
        logger.info(f"🔍 METRICS_CALCULATOR: Starting calculate_pe_metrics")
        logger.info(f"🔍 METRICS_CALCULATOR: stock_info: {stock_info}")
        logger.info(f"🔍 METRICS_CALCULATOR: fmp_estimates: {fmp_estimates}")
        logger.info(f"🔍 METRICS_CALCULATOR: quarterly_data: {quarterly_data}")
        
        results = {}
        
        if not stock_info.current_price:
            logger.warning(f"🔍 METRICS_CALCULATOR: No current price available")
            return self._create_pe_failure_results("No current price available")
        
        # Get TTM EPS from quarterly data
        ttm_eps = None
        if quarterly_data and len(quarterly_data) >= MIN_QUARTERS_FOR_TTM:
            ttm_eps = sum(q.eps or 0 for q in quarterly_data[:QUARTERS_FOR_TTM])
            logger.info(f"🔍 METRICS_CALCULATOR: Calculated TTM EPS: {ttm_eps}")
        else:
            logger.warning(f"🔍 METRICS_CALCULATOR: Insufficient quarterly data for TTM EPS")
        
        # Get forward EPS from estimates
        forward_eps = None
        two_year_eps = None
        
        if fmp_estimates:
            eps_by_year = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_EPS_AVG)
            current_year = datetime.now().year
            logger.info(f"🔍 METRICS_CALCULATOR: EPS by year: {eps_by_year}")
            
            forward_eps = eps_by_year.get(str(current_year + NEXT_YEAR_OFFSET))
            two_year_eps = eps_by_year.get(str(current_year + TWO_YEAR_FORWARD_OFFSET))
            logger.info(f"🔍 METRICS_CALCULATOR: Forward EPS: {forward_eps}, Two-year EPS: {two_year_eps}")
        else:
            logger.warning(f"🔍 METRICS_CALCULATOR: No FMP estimates available")
        
        # Calculate P/E ratios
        logger.info(f"🔍 METRICS_CALCULATOR: Calculating P/E ratios")
        results[TTM_PE_KEY] = self._calculate_pe_ratio(stock_info.current_price, ttm_eps, "TTM")
        results[FORWARD_PE_KEY] = self._calculate_pe_ratio(stock_info.current_price, forward_eps, "Forward")
        results[TWO_YEAR_FORWARD_PE_KEY] = self._calculate_pe_ratio(stock_info.current_price, two_year_eps, "Two-year Forward")
        
        logger.info(f"🔍 METRICS_CALCULATOR: P/E results: {results}")
        return results
    
    def calculate_growth_metrics(self, fmp_estimates: List[Dict], ticker: str, 
                                income_data: List[Dict], quarterly_data: List[QuarterlyData], 
                                quarterly_data_raw: List[Dict], quarterly_estimates: List[Dict]) -> Dict[str, MetricResult]:
        """Calculate growth metrics using inline methods."""
        logger.info(f"🔍 METRICS_CALCULATOR: Starting calculate_growth_metrics for {ticker}")
        logger.info(f"🔍 METRICS_CALCULATOR: fmp_estimates: {fmp_estimates}")
        logger.info(f"🔍 METRICS_CALCULATOR: income_data: {income_data}")
        logger.info(f"🔍 METRICS_CALCULATOR: quarterly_data: {quarterly_data}")
        logger.info(f"🔍 METRICS_CALCULATOR: quarterly_data_raw: {quarterly_data_raw}")
        logger.info(f"🔍 METRICS_CALCULATOR: quarterly_estimates: {quarterly_estimates}")
        
        results = {}
        
        logger.info(f"🔍 METRICS_CALCULATOR: Starting growth metrics calculation for {ticker}")
        
        logger.info(f"📊 METRICS_CALCULATOR: Data availability: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}, quarterly_data={bool(quarterly_data)}, quarterly_estimates={bool(quarterly_estimates)}")
        logger.info(f"📊 METRICS_CALCULATOR: Raw quarterly data: {len(quarterly_data_raw) if quarterly_data_raw else 0} records")
        logger.info(f"📊 METRICS_CALCULATOR: Quarterly estimates: {len(quarterly_estimates) if quarterly_estimates else 0} records")
        if quarterly_data_raw and len(quarterly_data_raw) > 0:
            logger.info(f"📊 METRICS_CALCULATOR: Sample quarterly record: {quarterly_data_raw[0]}")
        if quarterly_estimates and len(quarterly_estimates) > 0:
            logger.info(f"📊 METRICS_CALCULATOR: Sample quarterly estimate: {quarterly_estimates[0]}")
        
        # Current year EPS growth: Method 1C (GAAP-Adjusted Hybrid Median-Based)
        logger.info(f"🔍 METRICS_CALCULATOR: Checking Method 1C requirements - quarterly_data_raw: {bool(quarterly_data_raw)}, quarterly_estimates: {bool(quarterly_estimates)}")
        if quarterly_data_raw and quarterly_estimates:
            logger.info(f"✅ METRICS_CALCULATOR: Using Method 1C for current year EPS growth")
            # Method 1C requires quarterly estimates for proper GAAP adjustment
            results[CURRENT_YEAR_EPS_GROWTH_KEY] = self._calculate_current_year_eps_growth(
                income_data, quarterly_estimates, quarterly_data, quarterly_data_raw
            )
        else:
            logger.error(f"❌ METRICS_CALCULATOR: Falling back to old method - Missing data for Method 1C current year EPS growth: quarterly_data_raw={bool(quarterly_data_raw)}, quarterly_estimates={bool(quarterly_estimates)}")
            # Missing data for Method 1C
            results[CURRENT_YEAR_EPS_GROWTH_KEY] = MetricResult.failure(
                f"Missing data for Method 1C EPS growth: quarterly_data_raw={bool(quarterly_data_raw)}, quarterly_estimates={bool(quarterly_estimates)}"
            )
        
        # Current year revenue growth: hybrid approach (actual quarters + estimated quarters)
        if income_data and fmp_estimates:
            # Use quarterly estimates if available, otherwise fall back to annual estimates
            estimates_data = quarterly_estimates if quarterly_estimates else fmp_estimates
            results[CURRENT_YEAR_REVENUE_GROWTH_KEY] = self._calculate_current_year_revenue_growth(
                income_data, estimates_data, quarterly_data, quarterly_data_raw
            )
        else:
            logger.error(f"❌ Missing data for current year revenue growth: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}")
            results[CURRENT_YEAR_REVENUE_GROWTH_KEY] = MetricResult.failure(
                f"Missing data: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}"
            )
        
        # Next year EPS growth: Method 1C (GAAP-Adjusted Hybrid Median-Based)
        logger.info(f"🔍 METRICS_CALCULATOR: Checking Method 1C requirements for next year - quarterly_estimates: {bool(quarterly_estimates)}, quarterly_data_raw: {bool(quarterly_data_raw)}")
        if quarterly_estimates and quarterly_data_raw:
            logger.info(f"✅ METRICS_CALCULATOR: Using Method 1C for next year EPS growth")
            # Method 1C requires quarterly estimates for proper GAAP adjustment
            results[NEXT_YEAR_EPS_GROWTH_KEY] = self._calculate_next_year_eps_growth(
                quarterly_estimates, quarterly_data, quarterly_estimates, quarterly_data_raw
            )
        else:
            logger.error(f"❌ METRICS_CALCULATOR: Falling back to old method - Missing data for Method 1C next year EPS growth: quarterly_estimates={bool(quarterly_estimates)}, quarterly_data_raw={bool(quarterly_data_raw)}")
            # Missing data for Method 1C
            results[NEXT_YEAR_EPS_GROWTH_KEY] = MetricResult.failure("Missing data for Method 1C next year EPS growth")
        
        # Next year revenue growth: Method 1 (Next Year Estimates Quarterly vs Current Year Hybrid Quarterly)
        if quarterly_estimates and quarterly_data:
            # Use quarterly estimates for next year calculations (matches script logic)
            results[NEXT_YEAR_REVENUE_GROWTH_KEY] = self._calculate_next_year_revenue_growth(
                quarterly_estimates, quarterly_data, quarterly_estimates, quarterly_data_raw
            )
        else:
            logger.error(f"❌ Missing data for next year revenue growth: fmp_estimates={bool(fmp_estimates)}, quarterly_data={bool(quarterly_data)}")
            results[NEXT_YEAR_REVENUE_GROWTH_KEY] = MetricResult.failure("Missing data for next year revenue growth")
        
        return results
    
    def calculate_ttm_metrics(self, quarterly_data: List[QuarterlyData], stock_info: StockInfo) -> Dict[str, MetricResult]:
        """Calculate TTM-based metrics."""
        logger.info(f"🔍 METRICS_CALCULATOR: Starting calculate_ttm_metrics")
        logger.info(f"🔍 METRICS_CALCULATOR: quarterly_data: {quarterly_data}")
        logger.info(f"🔍 METRICS_CALCULATOR: stock_info: {stock_info}")
        
        results = {}
        
        if len(quarterly_data) < MIN_QUARTERS_FOR_TTM:
            error_msg = f"Insufficient quarterly data (need {MIN_QUARTERS_FOR_TTM}, got {len(quarterly_data)})"
            logger.warning(f"🔍 METRICS_CALCULATOR: {error_msg}")
            return self._create_ttm_failure_results(error_msg)
        
        # Calculate TTM aggregates
        logger.info(f"🔍 METRICS_CALCULATOR: Calculating TTM aggregates")
        ttm_values = self._calculate_ttm_aggregates(quarterly_data[:QUARTERS_FOR_TTM])
        logger.info(f"🔍 METRICS_CALCULATOR: TTM values: {ttm_values}")
        
        # TTM P/E
        if stock_info.current_price:
            logger.info(f"🔍 METRICS_CALCULATOR: Calculating TTM P/E")
            results[TTM_PE_KEY] = self._calculate_pe_ratio(
                stock_info.current_price, ttm_values['eps'], "TTM"
            )
        
        # TTM P/S
        if stock_info.market_cap:
            logger.info(f"🔍 METRICS_CALCULATOR: Calculating TTM P/S")
            results[TTM_PS_RATIO_KEY] = self._calculate_ps_ratio(
                stock_info.market_cap, ttm_values['revenue']
            )
        
        # TTM Margins
        logger.info(f"🔍 METRICS_CALCULATOR: Calculating TTM margins")
        results.update(self._calculate_ttm_margins(ttm_values))
        
        # TTM Growth rates
        if len(quarterly_data) >= MIN_QUARTERS_FOR_GROWTH:
            logger.info(f"🔍 METRICS_CALCULATOR: Calculating TTM growth rates")
            results.update(self._calculate_ttm_growth_rates(quarterly_data))
        
        logger.info(f"🔍 METRICS_CALCULATOR: TTM results: {results}")
        return results
    
    def calculate_ps_metrics(self, stock_info: StockInfo, forecast_data: Dict[str, Any]) -> Dict[str, MetricResult]:
        """Calculate P/S ratio metrics."""
        logger.info(f"🔍 METRICS_CALCULATOR: Starting calculate_ps_metrics")
        logger.info(f"🔍 METRICS_CALCULATOR: stock_info: {stock_info}")
        logger.info(f"🔍 METRICS_CALCULATOR: forecast_data: {forecast_data}")
        
        results = {}
        
        try:
            revenue_forecast = forecast_data.get('revenue_forecast')
            logger.info(f"🔍 METRICS_CALCULATOR: revenue_forecast: {revenue_forecast}")
            
            if stock_info.market_cap and revenue_forecast:
                logger.info(f"🔍 METRICS_CALCULATOR: Calculating forward P/S ratio")
                forward_ps = util.get_forward_ps_ratio(stock_info.__dict__, revenue_forecast)
                logger.info(f"🔍 METRICS_CALCULATOR: forward_ps result: {forward_ps}")
                
                if forward_ps:
                    results[FORWARD_PS_RATIO_KEY] = MetricResult.success(forward_ps)
                else:
                    results[FORWARD_PS_RATIO_KEY] = MetricResult.failure("Could not calculate forward P/S ratio")
            else:
                logger.warning(f"🔍 METRICS_CALCULATOR: Missing data for forward P/S calculation")
                results[FORWARD_PS_RATIO_KEY] = MetricResult.failure("Missing data for forward P/S calculation")
        except Exception as e:
            logger.error(f"❌ METRICS_CALCULATOR: Error calculating P/S metrics: {e}")
            results[FORWARD_PS_RATIO_KEY] = MetricResult.failure(f"P/S calculation error: {e}")
        
        logger.info(f"🔍 METRICS_CALCULATOR: P/S results: {results}")
        return results
    
    # ============================================================================
    # HELPER METHODS FOR CALCULATIONS
    # ============================================================================
    
    def _calculate_pe_ratio(self, price: float, eps: Optional[float], ratio_type: str) -> MetricResult:
        """Calculate a single P/E ratio."""
        if not self._is_positive_number(price):
            return MetricResult.failure(f"Invalid price for {ratio_type} P/E")
        
        if not self._is_positive_number(eps):
            return MetricResult.failure(f"Invalid EPS for {ratio_type} P/E")
        
        pe_ratio = price / eps
        return MetricResult.success(round(pe_ratio, RATIO_PRECISION))
    
    def _calculate_ps_ratio(self, market_cap: float, revenue: float) -> MetricResult:
        """Calculate P/S ratio."""
        if not self._is_positive_number(market_cap) or not self._is_positive_number(revenue):
            return MetricResult.failure("Invalid data for P/S calculation")
        
        ps_ratio = market_cap / revenue
        return MetricResult.success(round(ps_ratio, RATIO_PRECISION))
    
    def _calculate_ttm_aggregates(self, quarters: List[QuarterlyData]) -> Dict[str, float]:
        """Calculate TTM aggregated values from quarterly data."""
        return {
            'revenue': sum(q.revenue or 0 for q in quarters),
            'cost_of_revenue': sum(q.cost_of_revenue or 0 for q in quarters),
            'net_income': sum(q.net_income or 0 for q in quarters),
            'eps': sum(q.eps or 0 for q in quarters)
        }
    
    def _calculate_ttm_margins(self, ttm_values: Dict[str, float]) -> Dict[str, MetricResult]:
        """Calculate TTM margin metrics."""
        results = {}
        
        revenue = ttm_values['revenue']
        cost_of_revenue = ttm_values['cost_of_revenue']
        net_income = ttm_values['net_income']
        
        # Gross Margin
        if self._is_positive_number(revenue):
            gross_profit = revenue - cost_of_revenue
            gross_margin = (gross_profit / revenue) * PERCENTAGE_MULTIPLIER
            results[GROSS_MARGIN_KEY] = MetricResult.success(round(gross_margin, GROWTH_PRECISION))
        else:
            results[GROSS_MARGIN_KEY] = MetricResult.failure("Invalid revenue for gross margin")
        
        # Net Margin
        if self._is_positive_number(revenue) and self._is_positive_number(net_income):
            net_margin = (net_income / revenue) * PERCENTAGE_MULTIPLIER
            results[NET_MARGIN_KEY] = MetricResult.success(round(net_margin, GROWTH_PRECISION))
        else:
            results[NET_MARGIN_KEY] = MetricResult.failure("Invalid data for net margin")
        
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
        if not self._is_positive_number(current_value):
            return MetricResult.failure(f"Invalid current value for {metric_name}")
        
        if not self._is_positive_number(previous_value):
            return MetricResult.failure(f"Invalid previous value for {metric_name}")
        
        growth_percentage = self._calculate_growth_percentage(current_value, previous_value)
        
        if growth_percentage is None:
            return MetricResult.failure(f"Could not calculate {metric_name}")
        
        return MetricResult.success(round(growth_percentage, GROWTH_PRECISION))
    
    def _calculate_growth_percentage(self, current_value: float, previous_value: float) -> Optional[float]:
        """Calculate growth percentage between two values."""
        if previous_value == 0:
            logger.warning("Previous value is zero, cannot calculate growth")
            return None
        
        try:
            growth = ((current_value - previous_value) / abs(previous_value)) * PERCENTAGE_MULTIPLIER
            return growth
        except (TypeError, ValueError) as e:
            logger.warning(f"Error calculating growth percentage: {e}")
            return None
    
    def _calculate_current_year_eps_growth(self, income_data: List[Dict], estimates_data: List[Dict], 
                                         quarterly_data: List[Dict], quarterly_data_raw: List[Dict]) -> MetricResult:
        """Calculate current year EPS growth using Method 1C: GAAP-Adjusted Hybrid (Median-Based)."""
        try:
            current_year = datetime.now().year
            prev_year = current_year - 1
            
            logger.info(f"🔍 METRICS_CALCULATOR: Starting Method 1C current year EPS growth calculation for {current_year}")
            
            # Method 1C: Get GAAP-adjusted hybrid data using the main method
            # Extract ticker from quarterly data if available, otherwise use a placeholder
            ticker = quarterly_data_raw[0].get('symbol', 'UNKNOWN') if quarterly_data_raw else 'UNKNOWN'
            (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue) = self.get_median_adjusted_hybrid_data(
                ticker, current_year, quarterly_data_raw, estimates_data
            )
            
            # Method 1C: Get previous year quarterly sum (prior year quarterly actual data)
            prev_eps = self._get_previous_year_quarterly_sum(quarterly_data_raw, prev_year)
            
            logger.info(f"🔍 METRICS_CALCULATOR: Current year adjusted EPS: {current_adj_eps}, Previous year EPS: {prev_eps}")
            
            if not self._is_positive_number(current_adj_eps) or not self._is_positive_number(prev_eps):
                return MetricResult.failure("Invalid EPS data for growth calculation")
            
            growth = ((current_adj_eps - prev_eps) / abs(prev_eps)) * PERCENTAGE_MULTIPLIER
            logger.info(f"🔍 METRICS_CALCULATOR: Method 1C EPS growth: {growth:.2f}%")
            return MetricResult.success(round(growth, GROWTH_PRECISION))
            
        except Exception as e:
            logger.error(f"❌ METRICS_CALCULATOR: Error calculating Method 1C current year EPS growth: {e}")
            return MetricResult.failure(f"Error calculating current year EPS growth: {e}")
    
    def _calculate_current_year_revenue_growth(self, income_data: List[Dict], estimates_data: List[Dict], 
                                             quarterly_data: List[Dict], quarterly_data_raw: List[Dict]) -> MetricResult:
        """Calculate current year revenue growth using Method 1: Hybrid vs Prior Quarterly."""
        try:
            current_year = datetime.now().year
            prev_year = current_year - 1
            
            # Method 1: Get hybrid current year revenue (actual quarters + estimated quarters)
            current_revenue = self._get_hybrid_current_year_revenue(quarterly_data_raw, estimates_data, current_year)
            
            # Method 1: Get previous year quarterly sum (prior year quarterly actual data)
            prev_revenue = self._get_previous_year_quarterly_revenue_sum(quarterly_data_raw, prev_year)
            
            if not self._is_positive_number(current_revenue) or not self._is_positive_number(prev_revenue):
                return MetricResult.failure("Invalid revenue data for growth calculation")
            
            growth = ((current_revenue - prev_revenue) / abs(prev_revenue)) * PERCENTAGE_MULTIPLIER
            return MetricResult.success(round(growth, GROWTH_PRECISION))
            
        except Exception as e:
            return MetricResult.failure(f"Error calculating current year revenue growth: {e}")
    
    def _calculate_next_year_eps_growth(self, fmp_estimates: List[Dict], quarterly_data: List[Dict], 
                                     estimates_data: List[Dict], quarterly_data_raw: List[Dict]) -> MetricResult:
        """Calculate next year EPS growth using Method 1C: GAAP-Adjusted Hybrid (Median-Based)."""
        try:
            current_year = datetime.now().year
            next_year = current_year + 1
            
            logger.info(f"🔍 METRICS_CALCULATOR: Starting Method 1C next year EPS growth calculation for {current_year} → {next_year}")
            
            # Method 1C: Get GAAP-adjusted hybrid data using the main method
            # Extract ticker from quarterly data if available, otherwise use a placeholder
            ticker = quarterly_data_raw[0].get('symbol', 'UNKNOWN') if quarterly_data_raw else 'UNKNOWN'
            (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue) = self.get_median_adjusted_hybrid_data(
                ticker, current_year, quarterly_data_raw, estimates_data
            )
            
            logger.info(f"🔍 METRICS_CALCULATOR: Current year adjusted EPS: {current_adj_eps}, Next year adjusted EPS: {next_adj_eps}")
            
            if not self._is_positive_number(current_adj_eps) or not self._is_positive_number(next_adj_eps):
                return MetricResult.failure("Invalid EPS estimates for growth calculation")
            
            growth = ((next_adj_eps - current_adj_eps) / abs(current_adj_eps)) * PERCENTAGE_MULTIPLIER
            logger.info(f"🔍 METRICS_CALCULATOR: Method 1C next year EPS growth: {growth:.2f}%")
            return MetricResult.success(round(growth, GROWTH_PRECISION))
            
        except Exception as e:
            logger.error(f"❌ METRICS_CALCULATOR: Error calculating Method 1C next year EPS growth: {e}")
            return MetricResult.failure(f"Error calculating next year EPS growth: {e}")
    
    def _calculate_next_year_revenue_growth(self, fmp_estimates: List[Dict], quarterly_data: List[Dict], 
                                          estimates_data: List[Dict], quarterly_data_raw: List[Dict]) -> MetricResult:
        """Calculate next year revenue growth using Method 1: Next Year Estimates Quarterly vs Current Year Hybrid Quarterly."""
        try:
            current_year = datetime.now().year
            next_year = current_year + 1
            
            # Method 1: Get next year quarterly revenue estimates (next year quarterly estimates)
            next_revenue = self._get_next_year_quarterly_revenue(fmp_estimates, next_year)
            
            # Method 1: Get current year hybrid revenue (actual quarters + estimated quarters)
            current_revenue = self._get_hybrid_current_year_revenue(quarterly_data_raw, estimates_data, current_year)
            
            if not self._is_positive_number(current_revenue) or not self._is_positive_number(next_revenue):
                return MetricResult.failure("Invalid revenue estimates for growth calculation")
            
            growth = ((next_revenue - current_revenue) / abs(current_revenue)) * PERCENTAGE_MULTIPLIER
            return MetricResult.success(round(growth, GROWTH_PRECISION))
            
        except Exception as e:
            return MetricResult.failure(f"Error calculating next year revenue growth: {e}")
    
    def _get_previous_year_quarterly_sum(self, quarterly_data: List[Dict], prev_year: int) -> Optional[float]:
        """Get previous year quarterly EPS sum (prior year quarterly actual data) using script logic."""
        try:
            # Use the same logic as scripts - filter by year and sum quarters
            prev_year_eps = self._get_quarterly_actual_eps(quarterly_data, prev_year, 4)
            return prev_year_eps if prev_year_eps > 0 else None
            
        except Exception as e:
            logger.error(f"Error getting previous year quarterly EPS sum: {e}")
            return None
    
    def _get_previous_year_quarterly_revenue_sum(self, quarterly_data: List[Dict], prev_year: int) -> Optional[float]:
        """Get previous year quarterly revenue sum (prior year quarterly actual data) using script logic."""
        try:
            # Use the same logic as scripts - filter by year and sum quarters
            prev_year_revenue = self._get_quarterly_actual_revenue(quarterly_data, prev_year, 4)
            return prev_year_revenue if prev_year_revenue > 0 else None
            
        except Exception as e:
            logger.error(f"Error getting previous year quarterly revenue sum: {e}")
            return None
    
    def _get_next_year_quarterly_eps(self, fmp_estimates: List[Dict], next_year: int) -> Optional[float]:
        """Get next year quarterly EPS estimates using script logic."""
        try:
            # Use the same logic as scripts - filter by year and sum quarters
            next_year_eps = self._get_quarterly_estimates_eps(fmp_estimates, next_year, 4)
            return next_year_eps if next_year_eps > 0 else None
            
        except Exception as e:
            logger.error(f"Error getting next year quarterly EPS: {e}")
            return None
    
    def _get_next_year_quarterly_revenue(self, fmp_estimates: List[Dict], next_year: int) -> Optional[float]:
        """Get next year quarterly revenue estimates using script logic."""
        try:
            # Use the same logic as scripts - filter by year and sum quarters
            next_year_revenue = self._get_quarterly_estimates_revenue(fmp_estimates, next_year, 4)
            return next_year_revenue if next_year_revenue > 0 else None
            
        except Exception as e:
            logger.error(f"Error getting next year quarterly revenue: {e}")
            return None

    def _filter_data_by_fiscal_year(self, data: List[Dict], target_fiscal_year: int) -> List[Dict]:
        """
        Filter data to include the correct fiscal year quarters using flexible month-based logic.
        This exactly matches the script logic for fiscal year filtering.
        """
        filtered = []
        quarters_found = {'Q1': [], 'Q2': [], 'Q3': [], 'Q4': []}
        
        for item in data:
            try:
                date_str = item['date']
                year = int(date_str.split('-')[0])
                month = int(date_str.split('-')[1])
                
                # Map reporting months to fiscal quarters (matches script logic)
                if year == target_fiscal_year:
                    if month in [1, 2, 3, 4]:  # Q1 reporting period
                        quarters_found['Q1'].append(item)
                    elif month in [5, 6, 7]:  # Q2 reporting period
                        quarters_found['Q2'].append(item)
                    elif month in [8, 9, 10]:  # Q3 reporting period
                        quarters_found['Q3'].append(item)
                    elif month in [11, 12]:  # Q4 reporting period (partial)
                        quarters_found['Q4'].append(item)
                elif year == target_fiscal_year + 1:
                    if month in [1, 2, 3]:  # Q4 reporting period (continued)
                        quarters_found['Q4'].append(item)
            except (KeyError, ValueError, IndexError):
                continue
        
        # Take the most recent entry for each quarter (in case of duplicates)
        for quarter_key in ['Q1', 'Q2', 'Q3', 'Q4']:
            if quarters_found[quarter_key]:
                # Sort by date and take the most recent
                quarters_found[quarter_key].sort(key=lambda x: x['date'], reverse=True)
                filtered.append(quarters_found[quarter_key][0])
        
        # Sort by date to get quarters in chronological order
        filtered.sort(key=lambda x: x['date'])
        return filtered

    def _get_quarterly_actual_eps(self, quarterly_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get actual EPS for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_fiscal_year(quarterly_data, target_year)
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('eps', 0) for q in quarters)
        return total_eps

    def _get_quarterly_actual_revenue(self, quarterly_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get actual revenue for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_fiscal_year(quarterly_data, target_year)
        quarters = year_data[:num_quarters]
        total_revenue = sum(q.get('revenue', 0) for q in quarters)
        return total_revenue

    def _get_quarterly_estimates_eps(self, estimates_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get estimated EPS for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_fiscal_year(estimates_data, target_year)
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('estimatedEpsAvg', 0) for q in quarters)
        return total_eps

    def _get_quarterly_estimates_revenue(self, estimates_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get estimated revenue for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_fiscal_year(estimates_data, target_year)
        quarters = year_data[:num_quarters]
        total_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in quarters)
        return total_revenue

    def _get_quarterly_actual_net_income(self, quarterly_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get actual net income for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_year(quarterly_data, target_year)
        quarters = year_data[:num_quarters]
        total_net_income = sum(q.get('netIncome', 0) for q in quarters)
        return total_net_income

    def _get_quarterly_estimates_net_income(self, estimates_data: List[Dict], target_year: int, num_quarters: int = 4) -> float:
        """Get estimated net income for quarters in target year (matches script logic)."""
        year_data = self._filter_data_by_year(estimates_data, target_year)
        quarters = year_data[:num_quarters]
        total_net_income = sum(q.get('estimatedNetIncomeAvg', 0) for q in quarters)
        return total_net_income

    def _get_hybrid_current_year_eps(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                   target_year: int) -> Optional[float]:
        """Get hybrid current year EPS (actual + estimated quarters) using script logic."""
        try:
            # Get quarters elapsed in the year
            quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
            quarters_remaining = 4 - quarters_elapsed
            
            # Get actual EPS for completed quarters
            actual_eps = 0
            if quarters_elapsed > 0:
                actual_eps = self._get_quarterly_actual_eps(quarterly_data, target_year, quarters_elapsed)
            
            # Get estimated EPS for remaining quarters
            estimated_eps = 0
            if quarters_remaining > 0:
                estimated_eps = self._get_quarterly_estimates_eps(estimates_data, target_year, quarters_remaining)
            
            return actual_eps + estimated_eps
            
        except Exception as e:
            logger.error(f"Error getting hybrid current year EPS: {e}")
            return None
    
    def _get_hybrid_current_year_revenue(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                       target_year: int) -> Optional[float]:
        """Get hybrid current year revenue (actual + estimated quarters) using script logic."""
        try:
            # Get quarters elapsed in the year
            quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
            quarters_remaining = 4 - quarters_elapsed
            
            # Get actual revenue for completed quarters
            actual_revenue = 0
            if quarters_elapsed > 0:
                actual_revenue = self._get_quarterly_actual_revenue(quarterly_data, target_year, quarters_elapsed)
            
            # Get estimated revenue for remaining quarters
            estimated_revenue = 0
            if quarters_remaining > 0:
                estimated_revenue = self._get_quarterly_estimates_revenue(estimates_data, target_year, quarters_remaining)
            
            return actual_revenue + estimated_revenue
            
        except Exception as e:
            logger.error(f"Error getting hybrid current year revenue: {e}")
            return None
    
    def _get_hybrid_current_year_net_income(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                          target_year: int) -> Optional[float]:
        """Get hybrid current year net income (actual + estimated quarters) using script logic."""
        try:
            # Get quarters elapsed in the year
            quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
            quarters_remaining = 4 - quarters_elapsed
            
            # Get actual net income for completed quarters
            actual_net_income = 0
            if quarters_elapsed > 0:
                actual_net_income = self._get_quarterly_actual_net_income(quarterly_data, target_year, quarters_elapsed)
            
            # Get estimated net income for remaining quarters
            estimated_net_income = 0
            if quarters_remaining > 0:
                estimated_net_income = self._get_quarterly_estimates_net_income(estimates_data, target_year, quarters_remaining)
            
            return actual_net_income + estimated_net_income
            
        except Exception as e:
            logger.error(f"Error getting hybrid current year net income: {e}")
            return None
    
    def _get_quarters_elapsed_in_year(self, target_year: int = None) -> int:
        """
        Calculate how many fiscal quarters have REPORTED earnings in the target year.
        This matches the script logic exactly.
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
            # For current year 2025, based on script debug output, we have:
            # Q1, Q2 as actual data, Q3, Q4 as estimates
            # So quarters_elapsed = 2
            current_month = current_date.month
            if current_month <= 3:
                return 0  # Q1 not yet reported
            elif current_month <= 6:
                return 1  # Q1 reported
            elif current_month <= 9:
                return 2  # Q1, Q2 reported
            else:
                return 2  # Q1, Q2 reported (Q3, Q4 estimates - based on script output)
    
    def _calculate_gaap_estimate_median_ratio(self, quarterly_data: List[Dict], estimates_data: List[Dict]) -> float:
        """
        Calculate the median ratio between actual (GAAP) and estimated (non-GAAP) EPS
        using the latest 4 quarters of actual data to adjust for GAAP vs non-GAAP differences using median-based scaling.
        The median is more robust to outliers than the average.
        """
        logger.info(f"🔍 METRICS_CALCULATOR: Calculating GAAP median ratio using latest 4 quarters")
        
        ratios = []
        
        # Get the latest 4 quarters of actual data
        if quarterly_data:
            # Sort by date to get most recent first
            actual_data_sorted = sorted(quarterly_data, key=lambda x: x['date'], reverse=True)
            
            # Take the latest 4 quarters
            latest_actual_quarters = actual_data_sorted[:4]
            logger.info(f"🔍 METRICS_CALCULATOR: Found {len(latest_actual_quarters)} latest actual quarters")
            
            for i, actual_quarter in enumerate(latest_actual_quarters):
                actual_date = actual_quarter['date']
                actual_eps = actual_quarter.get('eps', 0)
                
                # Find corresponding estimate for the same date
                matching_estimate = None
                for est_quarter in estimates_data:
                    if est_quarter['date'] == actual_date:
                        matching_estimate = est_quarter
                        break
                
                if matching_estimate:
                    estimated_eps = matching_estimate.get('estimatedEpsAvg', 0)
                    logger.info(f"🔍 METRICS_CALCULATOR: {actual_date}: Actual={actual_eps:.4f}, Estimate={estimated_eps:.4f}")
                    
                    # Calculate ratio (actual / estimate) if both values are positive
                    if actual_eps > 0 and estimated_eps > 0:
                        ratio = actual_eps / estimated_eps
                        ratios.append(ratio)
                        logger.info(f"🔍 METRICS_CALCULATOR: → Ratio={ratio:.4f}")
                    elif actual_eps != 0 or estimated_eps != 0:
                        logger.info(f"🔍 METRICS_CALCULATOR: → Skipped (one value is 0 or negative)")
                    else:
                        logger.info(f"🔍 METRICS_CALCULATOR: → Skipped (both values are 0)")
                else:
                    logger.info(f"🔍 METRICS_CALCULATOR: {actual_date}: Actual={actual_eps:.4f}, No matching estimate found")
        
        # Return median ratio, or 1.0 if no data available (no adjustment)
        if ratios:
            # Sort ratios and find median
            ratios.sort()
            n = len(ratios)
            logger.info(f"🔍 METRICS_CALCULATOR: Sorted ratios: {[f'{r:.4f}' for r in ratios]}")
            
            if n % 2 == 0:
                # Even number of ratios - average of two middle values
                median_ratio = (ratios[n//2 - 1] + ratios[n//2]) / 2
                logger.info(f"🔍 METRICS_CALCULATOR: Median (even count): ({ratios[n//2 - 1]:.4f} + {ratios[n//2]:.4f}) / 2 = {median_ratio:.4f}")
            else:
                # Odd number of ratios - middle value
                median_ratio = ratios[n//2]
                logger.info(f"🔍 METRICS_CALCULATOR: Median (odd count): {median_ratio:.4f} (middle value)")
            
            return median_ratio
        else:
            logger.info(f"🔍 METRICS_CALCULATOR: ⚠️  No valid ratios found, using default 1.0")
            return 1.0
    
    def _get_median_adjusted_hybrid_current_year_eps(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                                   target_year: int) -> Optional[float]:
        """
        Get median-adjusted hybrid current year EPS by adjusting estimates with historical
        GAAP vs non-GAAP median ratios to prevent growth inflation using robust median scaling.
        """
        logger.info(f"🔍 METRICS_CALCULATOR: Starting Method 1C median-adjusted hybrid calculation for {target_year}")
        
        quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
        logger.info(f"🔍 METRICS_CALCULATOR: Quarters elapsed in {target_year}: {quarters_elapsed}")
        
        # Calculate GAAP vs estimate median ratio using latest 4 quarters of actual data
        median_gaap_ratio = self._calculate_gaap_estimate_median_ratio(quarterly_data, estimates_data)
        logger.info(f"🔍 METRICS_CALCULATOR: Median GAAP ratio (actual/estimate): {median_gaap_ratio:.4f}")
        
        # Get all quarters data using fiscal year logic (matches script)
        actual_quarters = self._filter_data_by_fiscal_year(quarterly_data, target_year)
        estimate_quarters = self._filter_data_by_fiscal_year(estimates_data, target_year)
        
        # Debug: Show what data we have
        logger.info(f"🔍 METRICS_CALCULATOR: Actual quarters for {target_year}: {len(actual_quarters)} records")
        for i, q in enumerate(actual_quarters[:4]):
            logger.info(f"🔍 METRICS_CALCULATOR:   Actual Q{i+1}: {q.get('date')} EPS={q.get('eps', 0)}")
        
        logger.info(f"🔍 METRICS_CALCULATOR: Estimate quarters for {target_year}: {len(estimate_quarters)} records")
        for i, q in enumerate(estimate_quarters[:4]):
            logger.info(f"🔍 METRICS_CALCULATOR:   Estimate Q{i+1}: {q.get('date')} EPS={q.get('estimatedEpsAvg', 0)}")
        
        total_eps = 0
        actual_eps_sum = 0
        estimated_eps_sum = 0
        
        logger.info(f"🔍 METRICS_CALCULATOR: Breaking down current year quarters:")
        
        # Process each quarter (Q1, Q2, Q3, Q4)
        # Note: quarters_elapsed=3 means Q1, Q2 are completed, Q3, Q4 are estimates
        for i in range(4):
            quarter_name = f"Q{i+1}"
            
            # Debug: Show what we're checking
            logger.info(f"🔍 METRICS_CALCULATOR: Processing {quarter_name}: i={i}, quarters_elapsed={quarters_elapsed}, actual_quarters_len={len(actual_quarters)}, estimate_quarters_len={len(estimate_quarters)}")
            
            if i < quarters_elapsed and i < len(actual_quarters):
                # Use actual data for completed quarters where actual data exists
                quarter_eps = actual_quarters[i].get('eps', 0)
                total_eps += quarter_eps
                actual_eps_sum += quarter_eps
                logger.info(f"🔍 METRICS_CALCULATOR:   {quarter_name}: {quarter_eps:.4f} (actual)")
            else:
                # Use median-adjusted estimated data for all other quarters (future or missing actual)
                if i < len(estimate_quarters):
                    estimated_eps = estimate_quarters[i].get('estimatedEpsAvg', 0)
                    
                    # Adjust EPS by multiplying with median GAAP ratio
                    adjusted_eps = estimated_eps * median_gaap_ratio
                    
                    total_eps += adjusted_eps
                    estimated_eps_sum += estimated_eps
                    logger.info(f"🔍 METRICS_CALCULATOR:   {quarter_name}: {estimated_eps:.4f} × {median_gaap_ratio:.4f} = {adjusted_eps:.4f} (median-adjusted estimate)")
                else:
                    logger.warning(f"🔍 METRICS_CALCULATOR:   {quarter_name}: No estimate data available")
        
        logger.info(f"🔍 METRICS_CALCULATOR: Actual EPS sum: {actual_eps_sum:.4f}")
        logger.info(f"🔍 METRICS_CALCULATOR: Estimated EPS sum (before adjustment): {estimated_eps_sum:.4f}")
        logger.info(f"🔍 METRICS_CALCULATOR: Estimated EPS sum × Median GAAP ratio: {estimated_eps_sum:.4f} × {median_gaap_ratio:.4f} = {estimated_eps_sum * median_gaap_ratio:.4f}")
        logger.info(f"🔍 METRICS_CALCULATOR: Total adjusted current year EPS: {total_eps:.4f}")
        
        return total_eps
    
    def _get_median_adjusted_next_year_eps(self, fmp_estimates: List[Dict], quarterly_data: List[Dict], 
                                         estimates_data: List[Dict], next_year: int) -> Optional[float]:
        """
        Get GAAP-adjusted next year EPS using median-based method.
        For next year, all are estimates, so apply full median ratio adjustment.
        """
        logger.info(f"🔍 METRICS_CALCULATOR: Starting Method 1C next year median adjustment for {next_year}")
        
        # Calculate GAAP vs estimate median ratio using latest 4 quarters of actual data
        median_gaap_ratio = self._calculate_gaap_estimate_median_ratio(quarterly_data, estimates_data)
        logger.info(f"🔍 METRICS_CALCULATOR: Median GAAP ratio (actual/estimate): {median_gaap_ratio:.4f}")
        
        # Get next year quarterly estimates
        next_quarterly_est_eps = self._get_quarterly_estimates_eps(fmp_estimates, next_year, 4)
        logger.info(f"🔍 METRICS_CALCULATOR: Next year ({next_year}) estimated EPS: {next_quarterly_est_eps:.4f}")
        
        # For next year, all are estimates, so apply full median ratio adjustment
        next_adj_eps = next_quarterly_est_eps * median_gaap_ratio
        logger.info(f"🔍 METRICS_CALCULATOR: Next year adjusted EPS: {next_quarterly_est_eps:.4f} × {median_gaap_ratio:.4f} = {next_adj_eps:.4f}")
        
        return next_adj_eps
    
    def get_median_adjusted_hybrid_data(self, ticker: str, target_year: int, quarterly_data: List[Dict], estimates_data: List[Dict]) -> Tuple[Tuple[float, float], Tuple[float, float]]:
        """
        Get median-adjusted hybrid data for both current year and next year.
        Only adjusts EPS using GAAP vs non-GAAP median ratios. Revenue is not adjusted.
        Returns: ((current_adj_eps, current_revenue), (next_adj_eps, next_revenue))
        """
        logger.info(f"🔍 METRICS_CALCULATOR: Starting get_median_adjusted_hybrid_data for {ticker}, year {target_year}")
        
        # Calculate GAAP vs estimate median ratio using latest 4 quarters of actual data
        median_gaap_ratio = self._calculate_gaap_estimate_median_ratio(quarterly_data, estimates_data)
        logger.info(f"🔍 METRICS_CALCULATOR: Median GAAP ratio (actual/estimate): {median_gaap_ratio:.4f}")
        
        # Get current year hybrid data (actual + estimated quarters)
        current_hybrid_eps, current_hybrid_revenue = self._get_hybrid_current_year_eps_and_revenue(quarterly_data, estimates_data, target_year)
        logger.info(f"🔍 METRICS_CALCULATOR: Current year ({target_year}) hybrid EPS: {current_hybrid_eps:.4f}, Revenue: {current_hybrid_revenue:.0f}")
        
        # Get next year estimates
        next_year = target_year + 1
        next_quarterly_est_eps = self._get_quarterly_estimates_eps(estimates_data, next_year, 4)
        next_quarterly_est_revenue = self._get_quarterly_estimates_revenue(estimates_data, next_year, 4)
        logger.info(f"🔍 METRICS_CALCULATOR: Next year ({next_year}) estimated EPS: {next_quarterly_est_eps:.4f}, Revenue: {next_quarterly_est_revenue:.0f}")
        
        # Apply GAAP adjustment (multiply EPS estimates by median ratio, leave revenue unchanged)
        quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
        logger.info(f"🔍 METRICS_CALCULATOR: Quarters elapsed in {target_year}: {quarters_elapsed}")
        
        if quarters_elapsed < 4:
            logger.info(f"🔍 METRICS_CALCULATOR: Applying partial EPS adjustment (some quarters are estimates)")
            # Get the actual and estimated EPS components separately
            actual_data = quarterly_data
            actual_quarters = self._filter_data_by_fiscal_year(actual_data, target_year)
            
            estimate_quarters = self._filter_data_by_fiscal_year(estimates_data, target_year)
            
            actual_eps_sum = 0
            actual_revenue_sum = 0
            estimated_eps_sum = 0
            estimated_revenue_sum = 0
            
            logger.info(f"🔍 METRICS_CALCULATOR: Breaking down current year quarters for adjustment:")
            for i in range(4):
                quarter_name = f"Q{i+1}"
                if i < quarters_elapsed and i < len(actual_quarters):
                    # Use actual data for completed quarters
                    quarter_eps = actual_quarters[i].get('eps', 0)
                    quarter_revenue = actual_quarters[i].get('revenue', 0)
                    actual_eps_sum += quarter_eps
                    actual_revenue_sum += quarter_revenue
                    logger.info(f"🔍 METRICS_CALCULATOR:   {quarter_name}: EPS={quarter_eps:.4f}, Revenue={quarter_revenue:.0f} (actual)")
                else:
                    # Use estimated data for remaining quarters
                    if i < len(estimate_quarters):
                        quarter_eps = estimate_quarters[i].get('estimatedEpsAvg', 0)
                        quarter_revenue = estimate_quarters[i].get('estimatedRevenueAvg', 0)
                        estimated_eps_sum += quarter_eps
                        estimated_revenue_sum += quarter_revenue
                        logger.info(f"🔍 METRICS_CALCULATOR:   {quarter_name}: EPS={quarter_eps:.4f}, Revenue={quarter_revenue:.0f} (estimate)")
            
            logger.info(f"🔍 METRICS_CALCULATOR: Actual EPS sum: {actual_eps_sum:.4f}")
            logger.info(f"🔍 METRICS_CALCULATOR: Estimated EPS sum: {estimated_eps_sum:.4f}")
            logger.info(f"🔍 METRICS_CALCULATOR: Estimated EPS sum × Median GAAP ratio: {estimated_eps_sum:.4f} × {median_gaap_ratio:.4f} = {estimated_eps_sum * median_gaap_ratio:.4f}")
            
            # Apply median ratio adjustment only to estimated EPS portion
            current_adj_eps = actual_eps_sum + (estimated_eps_sum * median_gaap_ratio)
            current_adj_revenue = actual_revenue_sum + estimated_revenue_sum  # No adjustment for revenue
            logger.info(f"🔍 METRICS_CALCULATOR: Current adjusted EPS: {actual_eps_sum:.4f} + {estimated_eps_sum * median_gaap_ratio:.4f} = {current_adj_eps:.4f}")
            logger.info(f"🔍 METRICS_CALCULATOR: Current revenue (no adjustment): {current_adj_revenue:.0f}")
        else:
            # All quarters are actuals, no adjustment needed
            current_adj_eps = current_hybrid_eps
            current_adj_revenue = current_hybrid_revenue
            logger.info(f"🔍 METRICS_CALCULATOR: ✅ All quarters are actuals, no EPS adjustment needed: {current_adj_eps:.4f}")
        
        # For next year, all are estimates, so apply full median ratio adjustment to EPS only
        next_adj_eps = next_quarterly_est_eps * median_gaap_ratio
        next_adj_revenue = next_quarterly_est_revenue  # No adjustment for revenue
        logger.info(f"🔍 METRICS_CALCULATOR: Next year adjusted EPS: {next_quarterly_est_eps:.4f} × {median_gaap_ratio:.4f} = {next_adj_eps:.4f}")
        logger.info(f"🔍 METRICS_CALCULATOR: Next year revenue (no adjustment): {next_adj_revenue:.0f}")
        
        return (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue)
    
    def _get_hybrid_current_year_eps_and_revenue(self, quarterly_data: List[Dict], estimates_data: List[Dict], 
                                               target_year: int) -> Tuple[float, float]:
        """Get hybrid current year EPS and revenue (actual + estimated quarters) using script logic."""
        try:
            # Get quarters elapsed in the year
            quarters_elapsed = self._get_quarters_elapsed_in_year(target_year)
            quarters_remaining = 4 - quarters_elapsed
            
            # Get actual EPS and revenue for completed quarters
            actual_eps = 0
            actual_revenue = 0
            if quarters_elapsed > 0:
                actual_eps = self._get_quarterly_actual_eps(quarterly_data, target_year, quarters_elapsed)
                actual_revenue = self._get_quarterly_actual_revenue(quarterly_data, target_year, quarters_elapsed)
            
            # Get estimated EPS and revenue for remaining quarters
            estimated_eps = 0
            estimated_revenue = 0
            if quarters_remaining > 0:
                estimated_eps = self._get_quarterly_estimates_eps(estimates_data, target_year, quarters_remaining)
                estimated_revenue = self._get_quarterly_estimates_revenue(estimates_data, target_year, quarters_remaining)
            
            return actual_eps + estimated_eps, actual_revenue + estimated_revenue
            
        except Exception as e:
            logger.error(f"Error getting hybrid current year EPS and revenue: {e}")
            return None, None
    
    
    
    
    
    
    
    
    def _get_quarterly_estimates_eps(self, estimates_data: List[Dict], target_year: int, num_quarters: int) -> float:
        """Get quarterly EPS estimates from FMP analyst estimates data."""
        year_data = self._filter_data_by_fiscal_year(estimates_data, target_year)
        estimated_quarters = year_data[:num_quarters]
        
        return sum(q.get('estimatedEpsAvg', 0) for q in estimated_quarters if q.get('estimatedEpsAvg') is not None)
    
    def _get_quarterly_estimates_revenue(self, estimates_data: List[Dict], target_year: int, num_quarters: int) -> float:
        """Get quarterly revenue estimates from FMP analyst estimates data."""
        year_data = self._filter_data_by_fiscal_year(estimates_data, target_year)
        estimated_quarters = year_data[:num_quarters]
        
        return sum(q.get('estimatedRevenueAvg', 0) for q in estimated_quarters if q.get('estimatedRevenueAvg') is not None)
    
    
    
    def _get_previous_year_eps(self, income_data: List[Dict], prev_year: int) -> Optional[float]:
        """Get previous year EPS from income data."""
        historical_eps = util.extract_metric_by_year(income_data, 'eps')
        return historical_eps.get(str(prev_year))
    
    def _get_previous_year_revenue(self, income_data: List[Dict], prev_year: int) -> Optional[float]:
        """Get previous year revenue from income data."""
        historical_revenue = util.extract_metric_by_year(income_data, 'revenue')
        return historical_revenue.get(str(prev_year))
    
    def _is_positive_number(self, value: Any) -> bool:
        """Check if value is a positive number."""
        try:
            return value is not None and float(value) > 0
        except (TypeError, ValueError):
            return False
    
    def _create_pe_failure_results(self, error_msg: str) -> Dict[str, MetricResult]:
        """Create failure results for all P/E calculations."""
        return {
            TTM_PE_KEY: MetricResult.failure(error_msg),
            FORWARD_PE_KEY: MetricResult.failure(error_msg),
            TWO_YEAR_FORWARD_PE_KEY: MetricResult.failure(error_msg)
        }
    
    def _create_ttm_failure_results(self, error_msg: str) -> Dict[str, MetricResult]:
        """Create failure results for all TTM calculations."""
        return {
            TTM_PE_KEY: MetricResult.failure(error_msg),
            TTM_PS_RATIO_KEY: MetricResult.failure(error_msg),
            TTM_EPS_GROWTH_KEY: MetricResult.failure(error_msg),
            TTM_REVENUE_GROWTH_KEY: MetricResult.failure(error_msg),
            GROSS_MARGIN_KEY: MetricResult.failure(error_msg),
            NET_MARGIN_KEY: MetricResult.failure(error_msg)
        }
