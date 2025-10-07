"""FMPDataFetcher class for all data fetching operations."""

import logging
from typing import Dict, Any, Optional, List
from .fmp_service import FMPService
from .validators import DataValidator
from .models import StockInfo, QuarterlyData

logger = logging.getLogger(__name__)


class FMPDataFetcher:
    """Centralized data fetching class for FMP API operations."""
    
    def __init__(self, fmp_service: Optional[FMPService] = None):
        """
        Initialize FMPDataFetcher with dependencies.
        
        Args:
            fmp_service: Optional FMP service instance
        """
        self.fmp_service = fmp_service or FMPService()
        self.validator = DataValidator()
    
    def fetch_stock_info(self, ticker: str) -> Optional[StockInfo]:
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
            
            # Validate and convert to StockInfo model
            if self.validator.validate_stock_info(stock_info):
                return self.validator.convert_to_stock_info(stock_info)
            else:
                logger.warning(f"❌ Invalid stock info data for {ticker}")
                return None
            
        except Exception as e:
            logger.error(f"❌ Error fetching stock info for {ticker}: {e}")
            return None
    
    def fetch_fmp_estimates(self, ticker: str) -> Optional[List[Dict]]:
        """Fetch FMP analyst estimates with error handling."""
        try:
            result = self.fmp_service.fetch_analyst_estimates(ticker)
            if self.validator.validate_fmp_estimates_data(result):
                return result
            else:
                logger.warning(f"❌ Invalid FMP estimates data for {ticker}")
                return None
        except Exception as e:
            logger.error(f"❌ Error fetching FMP estimates for {ticker}: {e}")
            return None
    
    def fetch_quarterly_data(self, ticker: str) -> Optional[List[QuarterlyData]]:
        """Fetch quarterly financial data for TTM calculations."""
        try:
            quarterly_data = self.fmp_service.fetch_quarterly_income_statement(ticker)
            if self.validator.validate_quarterly_data(quarterly_data):
                return self.validator.convert_to_quarterly_data(quarterly_data)
            else:
                logger.warning(f"❌ Invalid quarterly data for {ticker}")
                return None
        except Exception as e:
            logger.error(f"❌ Error fetching quarterly data for {ticker}: {e}")
            return None
    
    def fetch_forecast_data(self, ticker: str) -> Dict[str, Any]:
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
    
    def fetch_income_data(self, ticker: str) -> Optional[List[Dict]]:
        """Fetch annual income statement data for growth calculations."""
        try:
            return self.fmp_service.fetch_annual_income_statement(ticker)
        except Exception as e:
            logger.error(f"❌ Error fetching income data for {ticker}: {e}")
            return None
    
    def fetch_quarterly_estimates(self, ticker: str) -> Optional[List[Dict]]:
        """Fetch quarterly analyst estimates data for hybrid calculations."""
        try:
            return self.fmp_service.fetch_quarterly_analyst_estimates(ticker)
        except Exception as e:
            logger.error(f"❌ Error fetching quarterly estimates for {ticker}: {e}")
            return None
    
    def fetch_all_data(self, ticker: str) -> Dict[str, Any]:
        """Fetch all required data sources in one call."""
        logger.info(f"🔍 FMP_DATA_FETCHER: Starting fetch_all_data for {ticker}")
        
        data_sources = {
            'stock_info': None,
            'fmp_estimates': None,
            'quarterly_data': None,
            'forecast_data': None,
            'income_data': None,
            'quarterly_estimates': None,
            'quarterly_data_raw': None
        }
        
        # Fetch stock info
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching stock info for {ticker}")
            stock_info = self.fetch_stock_info(ticker)
            data_sources['stock_info'] = stock_info
            logger.info(f"🔍 FMP_DATA_FETCHER: Stock info result: {stock_info}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching stock info: {e}")
        
        # Fetch FMP estimates
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching FMP estimates for {ticker}")
            fmp_estimates = self.fetch_fmp_estimates(ticker)
            data_sources['fmp_estimates'] = fmp_estimates
            logger.info(f"🔍 FMP_DATA_FETCHER: FMP estimates result: {fmp_estimates}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching FMP estimates: {e}")
        
        # Fetch quarterly data for TTM calculations
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching quarterly data for {ticker}")
            quarterly_data = self.fetch_quarterly_data(ticker)
            data_sources['quarterly_data'] = quarterly_data
            logger.info(f"🔍 FMP_DATA_FETCHER: Quarterly data result: {quarterly_data}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching quarterly data: {e}")
        
        # Fetch raw quarterly data for growth calculations
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching raw quarterly data for {ticker}")
            quarterly_data_raw = self.fmp_service.fetch_quarterly_income_statement(ticker)
            data_sources['quarterly_data_raw'] = quarterly_data_raw
            logger.info(f"🔍 FMP_DATA_FETCHER: Raw quarterly data result: {quarterly_data_raw}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching raw quarterly data: {e}")
        
        # Fetch forecast data
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching forecast data for {ticker}")
            forecast_data = self.fetch_forecast_data(ticker)
            data_sources['forecast_data'] = forecast_data
            logger.info(f"🔍 FMP_DATA_FETCHER: Forecast data result: {forecast_data}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching forecast data: {e}")
        
        # Fetch income data for growth calculations
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching income data for {ticker}")
            income_data = self.fetch_income_data(ticker)
            data_sources['income_data'] = income_data
            logger.info(f"🔍 FMP_DATA_FETCHER: Income data result: {income_data}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching income data: {e}")
        
        # Fetch quarterly estimates for hybrid calculations
        try:
            logger.info(f"🔍 FMP_DATA_FETCHER: Fetching quarterly estimates for {ticker}")
            quarterly_estimates = self.fetch_quarterly_estimates(ticker)
            data_sources['quarterly_estimates'] = quarterly_estimates
            logger.info(f"🔍 FMP_DATA_FETCHER: Quarterly estimates result: {len(quarterly_estimates) if quarterly_estimates else 0} records")
            if quarterly_estimates and len(quarterly_estimates) > 0:
                logger.info(f"🔍 FMP_DATA_FETCHER: Sample quarterly estimate: {quarterly_estimates[0]}")
        except Exception as e:
            logger.error(f"❌ FMP_DATA_FETCHER: Error fetching quarterly estimates: {e}")
        
        logger.info(f"🔍 FMP_DATA_FETCHER: Final data_sources: {data_sources}")
        return data_sources
