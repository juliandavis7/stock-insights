"""Orchestration service for stock metrics calculations."""

import logging
from typing import Dict, Any, Optional
from .fmp_service import FMPService
from .fmp_data_fetcher import FMPDataFetcher
from .metrics_calculator import MetricsCalculator
from ..constants.constants import *

logger = logging.getLogger(__name__)


class MetricsService:
    """Orchestration service for stock metrics calculations."""
    
    def __init__(self, fmp_service: Optional[FMPService] = None):
        """
        Initialize MetricsService with dependencies.
        
        Args:
            fmp_service: Optional FMP service instance
        """
        self.fmp_service = fmp_service or FMPService()
        self.data_fetcher = FMPDataFetcher(self.fmp_service)
        self.calculator = MetricsCalculator()
    
    def get_metrics(self, ticker: str) -> Dict[str, Any]:
        """
        Get comprehensive stock metrics for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing all calculated metrics
        """
        logger.info(f"🔍 METRICS_SERVICE: Starting metrics calculation for {ticker}")
        
        # Initialize result with default values
        result = self._initialize_result(ticker)
        logger.info(f"🔍 METRICS_SERVICE: Initialized result: {result}")
        
        try:
            # Fetch all data using data fetcher
            logger.info(f"🔍 METRICS_SERVICE: Calling data_fetcher.fetch_all_data({ticker})")
            data_sources = self.data_fetcher.fetch_all_data(ticker)
            logger.info(f"🔍 METRICS_SERVICE: Received data_sources: {data_sources}")
            
            # Calculate metrics using calculator
            logger.info(f"🔍 METRICS_SERVICE: Calling calculator._calculate_all_metrics")
            metric_results = self._calculate_all_metrics(data_sources, ticker)
            logger.info(f"🔍 METRICS_SERVICE: Received metric_results: {metric_results}")
            
            # Merge results into final output
            logger.info(f"🔍 METRICS_SERVICE: Merging results")
            self._merge_results(result, metric_results)
            logger.info(f"🔍 METRICS_SERVICE: Final result: {result}")
            
        except Exception as e:
            logger.error(f"❌ METRICS_SERVICE: Error calculating metrics for {ticker}: {e}")
            import traceback
            logger.error(f"❌ METRICS_SERVICE: Full traceback: {traceback.format_exc()}")
        
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
    
    def _calculate_all_metrics(self, data_sources: Dict[str, Any], ticker: str) -> Dict[str, Any]:
        """Calculate all metrics using specialized calculators."""
        all_results = {}
        
        stock_info = data_sources.get('stock_info')
        fmp_estimates = data_sources.get('fmp_estimates')
        quarterly_data = data_sources.get('quarterly_data')
        income_data = data_sources.get('income_data')
        quarterly_estimates = data_sources.get('quarterly_estimates')
        quarterly_data_raw = data_sources.get('quarterly_data_raw')
        
        # P/E Ratio calculations
        if stock_info and stock_info.current_price:
            pe_results = self.calculator.calculate_pe_metrics(stock_info, fmp_estimates, quarterly_data)
            all_results.update(pe_results)
        
        # Growth calculations from estimates
        if fmp_estimates:
            growth_results = self.calculator.calculate_growth_metrics(
                fmp_estimates, ticker, income_data, quarterly_data, quarterly_data_raw, quarterly_estimates
            )
            all_results.update(growth_results)
        
        # TTM calculations
        if quarterly_data and stock_info:
            ttm_results = self.calculator.calculate_ttm_metrics(quarterly_data, stock_info)
            all_results.update(ttm_results)
        
        # P/S ratio calculations
        if stock_info and data_sources.get('forecast_data'):
            ps_results = self.calculator.calculate_ps_metrics(stock_info, data_sources['forecast_data'])
            all_results.update(ps_results)
        
        return all_results
    
    def _merge_results(self, result: Dict[str, Any], metric_results: Dict[str, Any]):
        """Merge calculated results into final output dictionary."""
        logger.info(f"🔍 METRICS_SERVICE: Starting _merge_results")
        logger.info(f"🔍 METRICS_SERVICE: result before merge: {result}")
        logger.info(f"🔍 METRICS_SERVICE: metric_results to merge: {metric_results}")
        
        # Merge calculated metrics
        for key, metric_result in metric_results.items():
            if hasattr(metric_result, 'calculation_successful') and metric_result.calculation_successful:
                result[key] = metric_result.value
                logger.info(f"🔍 METRICS_SERVICE: Merged {key}: {metric_result.value}")
            elif hasattr(metric_result, 'calculation_successful') and not metric_result.calculation_successful:
                # Keep default None if calculation failed
                logger.warning(f"🔍 METRICS_SERVICE: Calculation failed for {key}: {metric_result.error_message}")
                pass
            else:
                # Direct value assignment for non-MetricResult objects
                result[key] = metric_result
                logger.info(f"🔍 METRICS_SERVICE: Direct merge {key}: {metric_result}")
        
        # Add stock info fields if available from data fetcher
        try:
            # Get stock info from data fetcher's cached data
            stock_info = self.data_fetcher.fetch_stock_info(result.get(TICKER_KEY, ''))
            if stock_info:
                result[PRICE_KEY] = stock_info.current_price
                result[MARKET_CAP_KEY] = stock_info.market_cap
                logger.info(f"🔍 METRICS_SERVICE: Added stock info - price: {stock_info.current_price}, market_cap: {stock_info.market_cap}")
        except Exception as e:
            logger.warning(f"🔍 METRICS_SERVICE: Could not add stock info fields: {e}")
        
        logger.info(f"🔍 METRICS_SERVICE: Final merged result: {result}")