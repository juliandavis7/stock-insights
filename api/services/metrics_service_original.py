"""Metrics service for orchestrating stock metrics calculation."""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from .fmp_service import FMPService
# from .yfinance_service import YFinanceService  # Removed - using FMP only
from .. import util

logger = logging.getLogger(__name__)


class MetricsService:
    """Service that orchestrates fetching and calculating stock metrics."""
    
    def __init__(self, fmp_service: Optional[FMPService] = None):
        self.fmp_service = fmp_service or FMPService()
    
    def get_metrics(self, ticker: str) -> Dict[str, Any]:
        """
        Get comprehensive stock metrics for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing all calculated metrics
        """
        logger.info(f"Starting metrics calculation for {ticker}")
        
        # Initialize result with default None values
        result = {
            'ttm_pe': None,
            'forward_pe': None,
            'two_year_forward_pe': None,
            'ttm_eps_growth': None,
            'current_year_eps_growth': None,
            'next_year_eps_growth': None,
            'ttm_revenue_growth': None,
            'current_year_revenue_growth': None,
            'next_year_revenue_growth': None,
            'gross_margin': None,
            'net_margin': None,
            'ttm_ps_ratio': None,
            'forward_ps_ratio': None,
            # Stock info fields
            'ticker': ticker.upper(),
            'price': None,
            'market_cap': None
        }
        
        try:
            # Fetch data from various sources
            logger.info(f"🔍 Starting data fetch for {ticker}")
            
            try:
                stock_info = self._fetch_stock_info(ticker)
                logger.info(f"📊 Stock info fetched: {bool(stock_info)}")
            except Exception as e:
                logger.error(f"❌ Error fetching stock info: {e}")
                stock_info = None
            
            try:
                fmp_data = self._fetch_fmp_data(ticker)
                fmp_valid = self._is_valid_data(fmp_data)
                logger.info(f"📈 FMP data fetched: {fmp_valid} - Type: {type(fmp_data)} - Length: {len(fmp_data) if hasattr(fmp_data, '__len__') else 'N/A'}")
                if fmp_valid:
                    if isinstance(fmp_data, list) and len(fmp_data) > 0:
                        logger.info(f"📈 FMP sample data: {fmp_data[0]}")
                    elif hasattr(fmp_data, 'iloc') and len(fmp_data) > 0:
                        logger.info(f"📈 FMP sample data (DataFrame): {fmp_data.iloc[0].to_dict()}")
                    else:
                        logger.info(f"📈 FMP data type: {type(fmp_data)}")
            except Exception as e:
                logger.error(f"❌ Error fetching FMP data: {e}")
                fmp_data = None
            
            try:
                forecast_data = self._fetch_forecast_data(ticker)
                logger.info(f"🔮 Forecast data fetched: {forecast_data}")
            except Exception as e:
                logger.error(f"❌ Error fetching forecast data: {e}")
                forecast_data = {}
            
            # Calculate basic metrics from stock info
            if stock_info:
                basic_metrics = self._calculate_basic_metrics(stock_info)
                logger.info(f"✅ Basic metrics calculated: {basic_metrics}")
                result.update(basic_metrics)
                
                # Extract stock info fields
                stock_data = self._extract_stock_info_fields(stock_info)
                logger.info(f"✅ Stock info fields extracted: {stock_data}")
                result.update(stock_data)
            
            # Calculate FMP-based metrics
            fmp_data_valid = self._is_valid_data(fmp_data)
            if fmp_data_valid and stock_info:
                fmp_metrics = self._calculate_fmp_metrics(ticker, stock_info, fmp_data)
                logger.info(f"✅ FMP metrics calculated: {fmp_metrics}")
                result.update(fmp_metrics)
            else:
                logger.warning(f"⚠️ Skipping FMP metrics - FMP data valid: {fmp_data_valid}, Stock info valid: {bool(stock_info)}")
            
            # Calculate forecast-based metrics
            if forecast_data:
                forecast_metrics = self._calculate_forecast_metrics(forecast_data, fmp_data)
                logger.info(f"✅ Forecast metrics calculated: {forecast_metrics}")
                result.update(forecast_metrics)
            else:
                logger.warning(f"⚠️ No forecast data available")
            
            # Calculate derived metrics
            try:
                logger.info(f"🔄 Starting derived metrics calculation")
                revenue_forecast = forecast_data.get('revenue_forecast') if forecast_data else None
                logger.info(f"💰 Revenue forecast for derived metrics: {type(revenue_forecast)}")
                
                if stock_info and revenue_forecast is not None:
                    logger.info(f"🧮 Calculating forward P/S ratio")
                    forward_ps = util.get_forward_ps_ratio(stock_info, revenue_forecast)
                    logger.info(f"📊 Forward P/S calculated: {forward_ps}")
                    
                    if forward_ps:
                        result['forward_ps_ratio'] = forward_ps
                else:
                    logger.info(f"⚠️ Skipping derived metrics - Stock info: {bool(stock_info)}, Revenue forecast: {revenue_forecast is not None}")
            except Exception as derived_error:
                logger.error(f"❌ Error in derived metrics calculation: {derived_error}")
            
            logger.info(f"Successfully calculated metrics for {ticker}")
            
        except Exception as e:
            logger.error(f"Error calculating metrics for {ticker}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
        
        return result
    
    def _is_valid_data(self, data: Any) -> bool:
        """Check if data is valid and not empty, handling both lists and DataFrames."""
        try:
            logger.info(f"🔍 Validating data: {type(data)}, value: {data}")
            
            if data is None:
                logger.info(f"❌ Data is None")
                return False
            
            # Handle pandas DataFrame first (before bool check)
            if hasattr(data, 'empty'):
                result = not data.empty
                logger.info(f"📊 DataFrame validation: {result}")
                return result
            
            # Handle list
            if isinstance(data, list):
                result = len(data) > 0
                logger.info(f"📋 List validation: {result}, length: {len(data)}")
                return result
            
            # Handle dict
            if isinstance(data, dict):
                result = len(data) > 0
                logger.info(f"📖 Dict validation: {result}, length: {len(data)}")
                return result
            
            # Handle other types safely
            try:
                result = bool(data)
                logger.info(f"🔧 Other type validation: {result}")
                return result
            except ValueError:
                # Some objects (like DataFrames) can't be converted to bool
                logger.info(f"✅ Assuming valid for non-bool type")
                return True  # If it exists and isn't None, assume it's valid
                
        except Exception as e:
            logger.error(f"Error in _is_valid_data: {e}")
            return False
    
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
                'current_price': profile.get('price'),  # FMP profile includes current price
                'market_cap': profile.get('mktCap'),
                'enterprise_value': profile.get('enterpriseValue'),
                'shares_outstanding': profile.get('sharesOutstanding'),
                'total_revenue': current_data.get('revenue') if current_data else None,
                # Note: PE ratios and margins will be calculated from FMP data
                'trailing_pe': None,  # Will be calculated from FMP data
                'forward_pe': None,   # Will be calculated from FMP data
                'price_to_sales_ttm': None,  # Will be calculated from FMP data
                'gross_margins': None,  # Will be calculated from FMP data
                'profit_margins': None,  # Will be calculated from FMP data
                'earnings_growth': None,  # Will be calculated from FMP data
                'revenue_growth': None,  # Will be calculated from FMP data
            }
            
            logger.info(f"Successfully fetched stock info for {ticker} from FMP")
            return stock_info
            
        except Exception as e:
            logger.error(f"Failed to fetch stock info for {ticker}: {e}")
            return None
    
    def _fetch_fmp_data(self, ticker: str) -> Optional[list]:
        """Fetch FMP analyst estimates with error handling."""
        try:
            logger.info(f"🔍 Fetching FMP data for {ticker}")
            result = self.fmp_service.fetch_analyst_estimates(ticker)
            logger.info(f"📊 FMP data result for {ticker}: {type(result)}, length: {len(result) if result else 'None'}")
            return result
        except Exception as e:
            logger.error(f"Failed to fetch FMP data for {ticker}: {e}")
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
    
    def _calculate_basic_metrics(self, stock_info: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate basic metrics from stock info (FMP values - will be overridden by FMP calculations)."""
        return {
            'ttm_pe': util.get_ttm_pe(stock_info),
            'forward_pe': util.get_forward_pe(stock_info),
            'ttm_eps_growth': util.get_earnings_growth(stock_info),
            'ttm_revenue_growth': util.get_revenue_growth(stock_info),
            'gross_margin': util.get_gross_margin(stock_info),
            'net_margin': util.get_net_margin(stock_info),
            'ttm_ps_ratio': util.get_ttm_ps(stock_info)
        }
    
    def _extract_stock_info_fields(self, stock_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extract stock price and market cap from stock info."""
        return {
            'price': stock_info.get('current_price'),
            'market_cap': stock_info.get('market_cap')
        }
    
    def _calculate_fmp_metrics(self, ticker: str, stock_info: Dict[str, Any], fmp_data: list) -> Dict[str, Any]:
        """Calculate metrics that require FMP data."""
        result = {}
        
        current_price = stock_info.get('current_price')
        if not current_price:
            return result
        
        # Calculate TTM metrics from FMP quarterly data
        ttm_metrics = self._calculate_ttm_metrics_from_fmp_quarterly(ticker, current_price, stock_info.get('market_cap'))
        if ttm_metrics:
            result.update(ttm_metrics)
        
        # Calculate Forward PE and 2-Year Forward PE from FMP estimates
        if fmp_data:
            # Extract EPS by year from FMP data
            eps_by_year = util.extract_metric_by_year(fmp_data, 'estimatedEpsAvg')
            current_year = datetime.now().year
            
            # Calculate Forward PE (using next year EPS)
            next_year_eps = eps_by_year.get(str(current_year + 1))
            if next_year_eps and next_year_eps > 0:
                forward_pe = util.calculate_pe_from_eps(current_price, next_year_eps)
                if forward_pe:
                    result['forward_pe'] = forward_pe
            
            # Calculate Two-year forward PE
            two_year_pe = util.get_two_year_forward_pe(ticker, current_price, fmp_data)
            if two_year_pe:
                result['two_year_forward_pe'] = two_year_pe
        
        return result
    
    def _calculate_ttm_metrics_from_fmp_quarterly(self, ticker: str, current_price: float, market_cap: float) -> Dict[str, Any]:
        """Calculate TTM metrics from FMP quarterly income statement data."""
        try:
            # Fetch quarterly income statement data from FMP
            quarterly_data = self.fmp_service.fetch_quarterly_income_statement(ticker)
            if not quarterly_data or len(quarterly_data) < 4:
                logger.warning(f"Insufficient quarterly data for {ticker} TTM calculations")
                return {}
            
            # Get the last 4 quarters for current TTM
            current_ttm_quarters = quarterly_data[:4]
            
            # Sum up the last 4 quarters for current TTM values
            current_ttm_revenue = sum(q.get('revenue', 0) for q in current_ttm_quarters if q.get('revenue') is not None)
            current_ttm_cost_of_revenue = sum(q.get('costOfRevenue', 0) for q in current_ttm_quarters if q.get('costOfRevenue') is not None)
            current_ttm_net_income = sum(q.get('netIncome', 0) for q in current_ttm_quarters if q.get('netIncome') is not None)
            current_ttm_eps = sum(q.get('eps', 0) for q in current_ttm_quarters if q.get('eps') is not None)
            
            calculated_metrics = {}
            
            # Calculate TTM EPS Growth (compare current TTM vs previous TTM)
            if len(quarterly_data) >= 8:
                # Get the previous 4 quarters for previous TTM
                previous_ttm_quarters = quarterly_data[4:8]
                previous_ttm_eps = sum(q.get('eps', 0) for q in previous_ttm_quarters if q.get('eps') is not None)
                previous_ttm_revenue = sum(q.get('revenue', 0) for q in previous_ttm_quarters if q.get('revenue') is not None)
                
                # TTM EPS Growth calculation: ((Current TTM EPS - Previous TTM EPS) / Previous TTM EPS) * 100
                if previous_ttm_eps != 0:
                    eps_growth = ((current_ttm_eps - previous_ttm_eps) / abs(previous_ttm_eps)) * 100
                    calculated_metrics['ttm_eps_growth'] = eps_growth
                
                # TTM Revenue Growth calculation
                if previous_ttm_revenue != 0:
                    revenue_growth = ((current_ttm_revenue - previous_ttm_revenue) / abs(previous_ttm_revenue)) * 100
                    calculated_metrics['ttm_revenue_growth'] = revenue_growth
            
            # TTM PE calculation
            if current_ttm_eps != 0 and current_price:
                ttm_pe = current_price / current_ttm_eps
                calculated_metrics['ttm_pe'] = ttm_pe
            
            # Gross Margin calculation (TTM)
            if current_ttm_revenue != 0:
                gross_margin = ((current_ttm_revenue - current_ttm_cost_of_revenue) / current_ttm_revenue) * 100
                calculated_metrics['gross_margin'] = gross_margin
            
            # Net Margin calculation (TTM)
            if current_ttm_revenue != 0:
                net_margin = (current_ttm_net_income / current_ttm_revenue) * 100
                calculated_metrics['net_margin'] = net_margin
            
            # TTM P/S Ratio calculation
            if current_ttm_revenue != 0 and market_cap:
                ttm_ps = market_cap / current_ttm_revenue
                calculated_metrics['ttm_ps_ratio'] = ttm_ps
            
            logger.info(f"✅ Successfully calculated TTM metrics from FMP quarterly data for {ticker}")
            return calculated_metrics
            
        except Exception as e:
            logger.error(f"Error calculating TTM metrics from FMP quarterly data for {ticker}: {e}")
            return {}
    
    def _calculate_forecast_metrics(self, forecast_data: Dict[str, Any], fmp_data: Optional[list] = None) -> Dict[str, Any]:
        """Calculate metrics from FMP forecast data."""
        logger.info(f"🔮 Starting forecast metrics calculation from FMP data")
        result = {}
        
        # Use FMP analyst estimates data directly
        fmp_valid = self._is_valid_data(fmp_data)
        logger.info(f"📈 FMP analyst estimates available: {fmp_valid} - Type: {type(fmp_data)}")
        
        if fmp_valid:
            logger.info(f"🚀 Calculating growth metrics from FMP data")
            fmp_growth_metrics = self._calculate_fmp_growth_metrics(fmp_data)
            logger.info(f"📈 FMP growth results: {fmp_growth_metrics}")
            result.update(fmp_growth_metrics)
        else:
            logger.info(f"⚠️ No FMP data available for growth calculations")
        
        logger.info(f"✅ Final forecast metrics: {result}")
        return result
    
    def _calculate_fmp_growth_metrics(self, fmp_data: list) -> Dict[str, Any]:
        """Calculate growth metrics from FMP analyst estimates data."""
        from datetime import datetime
        
        result = {}
        
        if not self._is_valid_data(fmp_data):
            return result
        
        try:
            logger.info(f"FMP data type: {type(fmp_data)}, length/shape: {len(fmp_data) if hasattr(fmp_data, '__len__') else 'N/A'}")
            
            # Convert DataFrame to list if needed
            if hasattr(fmp_data, 'to_dict'):
                # It's a DataFrame, convert to list of dictionaries
                fmp_list = fmp_data.to_dict('records')
                logger.info(f"Converted DataFrame to list with {len(fmp_list)} records")
            else:
                fmp_list = fmp_data
            
            # Extract EPS and revenue by year
            eps_by_year = util.extract_metric_by_year(fmp_list, 'estimatedEpsAvg')
            revenue_by_year = util.extract_metric_by_year(fmp_list, 'estimatedRevenueAvg')
            
            logger.info(f"Extracted data - EPS years: {len(eps_by_year)}, Revenue years: {len(revenue_by_year)}")
            logger.info(f"📊 Available EPS years: {list(eps_by_year.keys())}")
            logger.info(f"📊 Available Revenue years: {list(revenue_by_year.keys())}")
            
            current_year = datetime.now().year
            current_year_str = str(current_year)
            next_year_str = str(current_year + 1)
            prev_year_str = str(current_year - 1)
            
            # Calculate EPS growth rates
            logger.info(f"📊 EPS calculation - Current year: {current_year_str}, Prev: {prev_year_str}, Next: {next_year_str}")
            logger.info(f"📊 Available EPS years: {len(eps_by_year)}")
            
            if current_year_str in eps_by_year and prev_year_str in eps_by_year:
                prev_eps = eps_by_year[prev_year_str]
                current_eps = eps_by_year[current_year_str]
                logger.info(f"📊 EPS values - Prev ({prev_year_str}): {prev_eps}, Current ({current_year_str}): {current_eps}")
                
                if prev_eps and prev_eps != 0:
                    growth = ((current_eps - prev_eps) / abs(prev_eps)) * 100
                    result['current_year_eps_growth'] = round(growth, 2)
                    logger.info(f"✅ Calculated Current Year EPS Growth: {result['current_year_eps_growth']}%")
                else:
                    logger.warning(f"⚠️ Invalid previous EPS value: {prev_eps}")
            else:
                logger.warning(f"⚠️ Missing EPS data - Current in data: {current_year_str in eps_by_year}, Prev in data: {prev_year_str in eps_by_year}")
            
            if next_year_str in eps_by_year and current_year_str in eps_by_year:
                current_eps = eps_by_year[current_year_str]
                next_eps = eps_by_year[next_year_str]
                logger.info(f"📊 EPS values - Current ({current_year_str}): {current_eps}, Next ({next_year_str}): {next_eps}")
                
                if current_eps and current_eps != 0:
                    growth = ((next_eps - current_eps) / abs(current_eps)) * 100
                    result['next_year_eps_growth'] = round(growth, 2)
                    logger.info(f"✅ Calculated Next Year EPS Growth: {result['next_year_eps_growth']}%")
                else:
                    logger.warning(f"⚠️ Invalid current EPS value: {current_eps}")
            else:
                logger.warning(f"⚠️ Missing EPS data - Next in data: {next_year_str in eps_by_year}, Current in data: {current_year_str in eps_by_year}")
            
            # Calculate Revenue growth rates
            if current_year_str in revenue_by_year and prev_year_str in revenue_by_year:
                prev_rev = revenue_by_year[prev_year_str]
                current_rev = revenue_by_year[current_year_str]
                if prev_rev and prev_rev != 0:
                    growth = ((current_rev - prev_rev) / abs(prev_rev)) * 100
                    result['current_year_revenue_growth'] = round(growth, 2)
            
            if next_year_str in revenue_by_year and current_year_str in revenue_by_year:
                current_rev = revenue_by_year[current_year_str]
                next_rev = revenue_by_year[next_year_str]
                if current_rev and current_rev != 0:
                    growth = ((next_rev - current_rev) / abs(current_rev)) * 100
                    result['next_year_revenue_growth'] = round(growth, 2)
            
            logger.info(f"Calculated FMP growth metrics: {result}")
            
        except Exception as e:
            logger.error(f"Error calculating FMP growth metrics: {e}")
        
        return result