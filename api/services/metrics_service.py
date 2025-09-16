"""Refactored metrics service for orchestrating stock metrics calculation."""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from .fmp_service import FMPService
from .validators import DataValidator
from .models import (
    StockInfo, MetricResult, QuarterlyData, 
    TTMCalculationInput, PECalculationInput,
    GrowthCalculationInput, MarginCalculationInput
)
from .calculators import (
    PECalculator, GrowthCalculator, 
    MarginCalculator, TTMCalculator
)
from .metrics_constants import *
from .. import util

logger = logging.getLogger(__name__)


class MetricsService:
    """Refactored service that orchestrates fetching and calculating stock metrics."""
    
    def __init__(self, fmp_service: Optional[FMPService] = None):
        """
        Initialize MetricsService with dependencies.
        
        Args:
            fmp_service: Optional FMP service instance
        """
        self.fmp_service = fmp_service or FMPService()
        self.validator = DataValidator()
        
        # Initialize calculators
        self.pe_calculator = PECalculator()
        self.growth_calculator = GrowthCalculator()
        self.margin_calculator = MarginCalculator()
        self.ttm_calculator = TTMCalculator()
    
    def get_metrics(self, ticker: str) -> Dict[str, Any]:
        """
        Get comprehensive stock metrics for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing all calculated metrics
        """
        logger.info(f"Starting metrics calculation for {ticker}")
        
        # Initialize result with default values
        result = self._initialize_result(ticker)
        
        try:
            # Fetch and validate data
            data_sources = self._fetch_all_data(ticker)
            
            # Calculate metrics using specialized calculators
            metric_results = self._calculate_all_metrics(data_sources, ticker)
            
            # Merge results into final output
            self._merge_results(result, metric_results)
            
            
        except Exception as e:
            logger.error(f"Error calculating metrics for {ticker}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
        
        return result
    
    def _initialize_result(self, ticker: str) -> Dict[str, Any]:
        """Initialize result dictionary with default None values."""
        return {
            TTM_PE_KEY: DEFAULT_METRIC_VALUE,
            FORWARD_PE_KEY: DEFAULT_METRIC_VALUE,
            TWO_YEAR_FORWARD_PE_KEY: DEFAULT_METRIC_VALUE,
            TTM_EPS_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            CURRENT_YEAR_EPS_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            NEXT_YEAR_EPS_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            TTM_REVENUE_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            CURRENT_YEAR_REVENUE_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            NEXT_YEAR_REVENUE_GROWTH_KEY: DEFAULT_METRIC_VALUE,
            GROSS_MARGIN_KEY: DEFAULT_METRIC_VALUE,
            NET_MARGIN_KEY: DEFAULT_METRIC_VALUE,
            TTM_PS_RATIO_KEY: DEFAULT_METRIC_VALUE,
            FORWARD_PS_RATIO_KEY: DEFAULT_METRIC_VALUE,
            TICKER_KEY: ticker.upper(),
            PRICE_KEY: DEFAULT_METRIC_VALUE,
            MARKET_CAP_KEY: DEFAULT_METRIC_VALUE
        }
    
    def _fetch_all_data(self, ticker: str) -> Dict[str, Any]:
        """Fetch all required data sources."""
        
        data_sources = {
            'stock_info': None,
            'fmp_estimates': None,
            'quarterly_data': None,
            'forecast_data': None
        }
        
        # Fetch stock info
        try:
            stock_info = self._fetch_stock_info(ticker)
            if self.validator.validate_stock_info(stock_info):
                data_sources['stock_info'] = self.validator.convert_to_stock_info(stock_info)
            else:
                logger.warning(f"❌ Invalid stock info data")
        except Exception as e:
            logger.error(f"❌ Error fetching stock info: {e}")
        
        # Fetch FMP estimates
        try:
            fmp_estimates = self._fetch_fmp_estimates(ticker)
            if self.validator.validate_fmp_estimates_data(fmp_estimates):
                data_sources['fmp_estimates'] = fmp_estimates
            else:
                logger.warning(f"❌ Invalid FMP estimates data")
        except Exception as e:
            logger.error(f"❌ Error fetching FMP estimates: {e}")
        
        # Fetch quarterly data for TTM calculations
        try:
            quarterly_data = self._fetch_quarterly_data(ticker)
            if self.validator.validate_quarterly_data(quarterly_data):
                data_sources['quarterly_data'] = self.validator.convert_to_quarterly_data(quarterly_data)
            else:
                logger.warning(f"❌ Invalid quarterly data")
        except Exception as e:
            logger.error(f"❌ Error fetching quarterly data: {e}")
        
        # Fetch forecast data
        try:
            forecast_data = self._fetch_forecast_data(ticker)
            data_sources['forecast_data'] = forecast_data
        except Exception as e:
            logger.error(f"❌ Error fetching forecast data: {e}")
        
        return data_sources
    
    def _calculate_all_metrics(self, data_sources: Dict[str, Any], ticker: str) -> Dict[str, MetricResult]:
        """Calculate all metrics using specialized calculators."""
        all_results = {}
        
        stock_info = data_sources.get('stock_info')
        fmp_estimates = data_sources.get('fmp_estimates')
        quarterly_data = data_sources.get('quarterly_data')
        
        # P/E Ratio calculations
        if stock_info and stock_info.current_price:
            pe_results = self._calculate_pe_metrics(stock_info, fmp_estimates, quarterly_data)
            all_results.update(pe_results)
        
        # Growth calculations from estimates
        if fmp_estimates:
            growth_results = self._calculate_growth_metrics(fmp_estimates, ticker)
            all_results.update(growth_results)
        
        # TTM calculations
        if quarterly_data and stock_info:
            ttm_results = self._calculate_ttm_metrics(quarterly_data, stock_info)
            all_results.update(ttm_results)
        
        # P/S ratio calculations
        if stock_info and data_sources.get('forecast_data'):
            ps_results = self._calculate_ps_metrics(stock_info, data_sources['forecast_data'])
            all_results.update(ps_results)
        
        return all_results
    
    def _calculate_pe_metrics(
        self, 
        stock_info: StockInfo, 
        fmp_estimates: Optional[List[Dict]], 
        quarterly_data: Optional[List[QuarterlyData]]
    ) -> Dict[str, MetricResult]:
        """Calculate P/E ratio metrics."""
        
        # Get TTM EPS from quarterly data
        ttm_eps = None
        if quarterly_data and len(quarterly_data) >= MIN_QUARTERS_FOR_TTM:
            ttm_eps = sum(q.eps or 0 for q in quarterly_data[:QUARTERS_FOR_TTM])
        
        # Get forward EPS from estimates
        forward_eps = None
        two_year_eps = None
        
        if fmp_estimates:
            eps_by_year = util.extract_metric_by_year(fmp_estimates, FMP_ESTIMATED_EPS_AVG)
            current_year = datetime.now().year
            
            forward_eps = eps_by_year.get(str(current_year + NEXT_YEAR_OFFSET))
            two_year_eps = eps_by_year.get(str(current_year + TWO_YEAR_FORWARD_OFFSET))
        
        # Calculate P/E ratios
        pe_input = PECalculationInput(
            current_price=stock_info.current_price,
            eps_ttm=ttm_eps,
            eps_forward=forward_eps,
            eps_two_year_forward=two_year_eps
        )
        
        return self.pe_calculator.calculate(pe_input)
    
    def _calculate_growth_metrics(self, fmp_estimates: List[Dict], ticker: str) -> Dict[str, MetricResult]:
        """Calculate growth metrics using focused methods for each calculation type."""
        results = {}
        
        logger.info(f"🔍 Starting growth metrics calculation for {ticker}")
        
        # Fetch annual income statement data for current year growth calculations
        income_data = self.fmp_service.fetch_annual_income_statement(ticker)
        
        # Fetch quarterly income statement data for hybrid calculations
        quarterly_data = self._fetch_quarterly_data(ticker)
        
        # Fetch quarterly analyst estimates data for hybrid calculations
        quarterly_estimates = self.fmp_service.fetch_quarterly_analyst_estimates(ticker)
        
        logger.info(f"📊 Data availability: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}, quarterly_data={bool(quarterly_data)}, quarterly_estimates={bool(quarterly_estimates)}")
        
        # Current year EPS growth: hybrid approach (actual quarters + estimated quarters)
        if income_data and fmp_estimates:
            # Use quarterly estimates if available, otherwise fall back to annual estimates
            estimates_data = quarterly_estimates if quarterly_estimates else fmp_estimates
            results[CURRENT_YEAR_EPS_GROWTH_KEY] = self.growth_calculator.calculate_current_year_eps_growth(
                income_data, estimates_data, quarterly_data
            )
        else:
            logger.error(f"❌ Missing data for current year EPS growth: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}")
            results[CURRENT_YEAR_EPS_GROWTH_KEY] = self.growth_calculator._create_failure_result(
                f"Missing data: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}"
            )
        
        # Current year revenue growth: hybrid approach (actual quarters + estimated quarters)
        if income_data and fmp_estimates:
            # Use quarterly estimates if available, otherwise fall back to annual estimates
            estimates_data = quarterly_estimates if quarterly_estimates else fmp_estimates
            results[CURRENT_YEAR_REVENUE_GROWTH_KEY] = self.growth_calculator.calculate_current_year_revenue_growth(
                income_data, estimates_data, quarterly_data
            )
        else:
            logger.error(f"❌ Missing data for current year revenue growth: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}")
            results[CURRENT_YEAR_REVENUE_GROWTH_KEY] = self.growth_calculator._create_failure_result(
                f"Missing data: income_data={bool(income_data)}, fmp_estimates={bool(fmp_estimates)}"
            )
        
        # Next year EPS growth: estimates only (forward-looking)
        if fmp_estimates:
            results[NEXT_YEAR_EPS_GROWTH_KEY] = self.growth_calculator.calculate_next_year_eps_growth(fmp_estimates)
        else:
            logger.error(f"❌ No FMP estimates data available for next year EPS growth")
            results[NEXT_YEAR_EPS_GROWTH_KEY] = self.growth_calculator._create_failure_result(
                "No FMP estimates data available"
            )
        
        # Next year revenue growth: estimates only (forward-looking)
        if fmp_estimates:
            results[NEXT_YEAR_REVENUE_GROWTH_KEY] = self.growth_calculator.calculate_next_year_revenue_growth(fmp_estimates)
        else:
            logger.error(f"❌ No FMP estimates data available for next year revenue growth")
            results[NEXT_YEAR_REVENUE_GROWTH_KEY] = self.growth_calculator._create_failure_result(
                "No FMP estimates data available"
            )
        
        return results
    
    def _calculate_ttm_metrics(self, quarterly_data: List[QuarterlyData], stock_info: StockInfo) -> Dict[str, MetricResult]:
        """Calculate TTM-based metrics."""
        ttm_input = TTMCalculationInput(
            quarterly_data=quarterly_data,
            current_price=stock_info.current_price,
            market_cap=stock_info.market_cap
        )
        
        return self.ttm_calculator.calculate(ttm_input)
    
    def _calculate_ps_metrics(self, stock_info: StockInfo, forecast_data: Dict[str, Any]) -> Dict[str, MetricResult]:
        """Calculate P/S ratio metrics."""
        results = {}
        
        try:
            revenue_forecast = forecast_data.get('revenue_forecast')
            if stock_info.market_cap and revenue_forecast:
                forward_ps = util.get_forward_ps_ratio(stock_info.__dict__, revenue_forecast)
                if forward_ps:
                    results[FORWARD_PS_RATIO_KEY] = MetricResult.success(forward_ps)
                else:
                    results[FORWARD_PS_RATIO_KEY] = MetricResult.failure("Could not calculate forward P/S ratio")
            else:
                results[FORWARD_PS_RATIO_KEY] = MetricResult.failure("Missing data for forward P/S calculation")
        except Exception as e:
            logger.error(f"Error calculating P/S metrics: {e}")
            results[FORWARD_PS_RATIO_KEY] = MetricResult.failure(f"P/S calculation error: {e}")
        
        return results
    
    def _merge_results(self, result: Dict[str, Any], metric_results: Dict[str, MetricResult]):
        """Merge calculated results into final output dictionary."""
        
        # Merge calculated metrics
        for key, metric_result in metric_results.items():
            if metric_result.calculation_successful:
                result[key] = metric_result.value
            # Keep default None if calculation failed
        
        # Add stock info fields if available from initial data fetch
        try:
            stock_info = self._get_cached_stock_info()
            if stock_info:
                result[PRICE_KEY] = stock_info.get(CURRENT_PRICE_FIELD)
                result[MARKET_CAP_KEY] = stock_info.get(MARKET_CAP_FIELD)
        except Exception as e:
            logger.warning(f"Could not add stock info fields: {e}")
    
    def _fetch_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Fetch stock info from FMP with error handling."""
        try:
            # Get company profile from FMP
            profile = self.fmp_service.fetch_company_profile(ticker)
            if not profile:
                logger.warning(f"No company profile available for {ticker}")
                return None
            
            # Get current year data for financial metrics
            current_data = self.fmp_service.fetch_current_year_data(ticker)
            
            # Combine profile and current data
            stock_info = {
                'ticker': ticker.upper(),
                'company_name': profile.get('companyName', 'Unknown'),
                'sector': profile.get('sector', 'Unknown'),
                'industry': profile.get('industry', 'Unknown'),
                'current_price': profile.get('price'),
                'market_cap': profile.get('mktCap'),
                'enterprise_value': profile.get('enterpriseValue'),
                'shares_outstanding': profile.get('sharesOutstanding'),
                'total_revenue': current_data.get('revenue') if current_data else None,
            }
            
            # Cache for later use
            self._cached_stock_info = stock_info
            
            logger.info(f"Successfully fetched stock info for {ticker} from FMP")
            return stock_info
            
        except Exception as e:
            logger.error(f"Failed to fetch stock info for {ticker}: {e}")
            return None
    
    def _fetch_fmp_estimates(self, ticker: str) -> Optional[List[Dict]]:
        """Fetch FMP analyst estimates with error handling."""
        try:
            result = self.fmp_service.fetch_analyst_estimates(ticker)
            return result
        except Exception as e:
            logger.error(f"Failed to fetch FMP estimates for {ticker}: {e}")
            return None
    
    def _fetch_quarterly_data(self, ticker: str) -> Optional[List[Dict]]:
        """Fetch quarterly financial data for TTM calculations."""
        try:
            quarterly_data = self.fmp_service.fetch_quarterly_income_statement(ticker)
            return quarterly_data
        except Exception as e:
            logger.error(f"Failed to fetch quarterly data for {ticker}: {e}")
            return None
    
    def _fetch_forecast_data(self, ticker: str) -> Dict[str, Any]:
        """Fetch forecast data from FMP analyst estimates."""
        forecast_data = {
            'earnings_forecast': None,
            'revenue_forecast': None
        }
        
        try:
            # Get analyst estimates from FMP (contains both earnings and revenue forecasts)
            estimates = self.fmp_service.fetch_analyst_estimates(ticker)
            if estimates:
                # FMP analyst estimates contain both EPS and revenue forecasts
                forecast_data['earnings_forecast'] = estimates
                forecast_data['revenue_forecast'] = estimates
                logger.info(f"Successfully fetched forecast data for {ticker} from FMP")
        except Exception as e:
            logger.warning(f"Failed to fetch forecast data for {ticker}: {e}")
        
        return forecast_data
    
    def _get_cached_stock_info(self) -> Optional[Dict[str, Any]]:
        """Get cached stock info if available."""
        return getattr(self, '_cached_stock_info', None)