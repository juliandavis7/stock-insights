"""FMP (Financial Modeling Prep) API service for fetching financial data."""

import requests
import logging
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..constants import FMP_API_KEY, FMP_ANALYST_ESTIMATES_URL

logger = logging.getLogger(__name__)


class FMPService:
    """Service for interacting with Financial Modeling Prep API."""
    
    # List of stocks with cached JSON responses
    CACHED_STOCKS = [
        "AAPL", "META", "GOOG", "GOOGL", "AMZN", "CELH", "ELF", "FUBO", "NVDA", 
        "SOFI", "ADBE", "PLTR", "TSLA", "PYPL", "AMD", "NKE", "SHOP", 
        "CAKE", "WYNN", "MSFT"
    ]
    
    def __init__(self, api_key: str = FMP_API_KEY):
        self.api_key = api_key
        self.base_url_v3 = "https://financialmodelingprep.com/api/v3"
        self.base_url_stable = "https://financialmodelingprep.com/stable"
        self.analyst_estimates_url = FMP_ANALYST_ESTIMATES_URL
        
        # Check if we should use mock data
        self.use_mock_data = os.getenv("FMP_SERVER", "True").lower() == "false"
        
        if self.use_mock_data:
            logger.info("🔧 FMP Service configured to use mock data (FMP_SERVER=False)")
        else:
            logger.info("🌐 FMP Service configured to use live API (FMP_SERVER=True)")
    
    def _is_stock_cached(self, ticker: str) -> bool:
        """Check if a stock has cached data available"""
        return ticker.upper() in self.CACHED_STOCKS
    
    def _load_mock_data(self, endpoint: str, ticker: str) -> Optional[Dict[str, Any]]:
        """Load mock data from JSON file"""
        try:
            # Construct absolute file path - try multiple approaches
            # First, try relative to current working directory
            file_path = os.path.join("mocks", endpoint, f"{ticker.upper()}.json")
            logger.info(f"🔍 Trying path 1: {file_path}")
            
            if not os.path.exists(file_path):
                # Try relative to the services directory
                current_dir = os.path.dirname(os.path.abspath(__file__))
                api_dir = os.path.dirname(current_dir)  # Go up one level from services/ to api/
                file_path = os.path.join(api_dir, "mocks", endpoint, f"{ticker.upper()}.json")
                logger.info(f"🔍 Trying path 2: {file_path}")
                
                if not os.path.exists(file_path):
                    # Try relative to the project root (assuming we're in api/ subdirectory)
                    project_root = os.path.join(os.getcwd(), "api")
                    file_path = os.path.join(project_root, "mocks", endpoint, f"{ticker.upper()}.json")
                    logger.info(f"🔍 Trying path 3: {file_path}")
            
            logger.info(f"🔍 Final path: {file_path}")
            
            if not os.path.exists(file_path):
                logger.warning(f"Mock data file not found: {file_path}")
                return None
            
            with open(file_path, 'r') as f:
                mock_data = json.load(f)
            
            logger.info(f"📄 Raw mock data keys: {list(mock_data.keys()) if isinstance(mock_data, dict) else 'Not a dict'}")
            
            # Check if there was an error when the data was originally fetched
            if mock_data.get("error"):
                logger.error(f"Mock data contains error for {ticker} {endpoint}: {mock_data['error']}")
                return None
            
            data = mock_data.get("data")
            logger.info(f"📁 Loaded mock data for {ticker} {endpoint}: {type(data)}, length: {len(data) if data else 'None'}")
            return data
            
        except Exception as e:
            logger.error(f"Failed to load mock data for {ticker} {endpoint}: {e}")
            return None
    
    def _handle_missing_stock(self, ticker: str, endpoint: str) -> None:
        """Handle case where stock is not in cached list"""
        if not self._is_stock_cached(ticker):
            error_msg = f"Stock {ticker} not available in mock data. Available stocks: {', '.join(self.CACHED_STOCKS)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def _process_estimates_data(self, data: List[Dict], ticker: str, mode: str) -> Dict[str, Any]:
        """Process estimates data (used for both live API and mock data)"""
        try:
            current_year = datetime.now().year
            # For TTM mode, we need data starting from 2022 to calculate TTM for Q1 2023
            # For quarterly mode, we can use 2 years back
            cutoff_year = 2022 if mode == 'ttm' else current_year - 2
            
            if not data:
                logger.warning(f"No estimates data for {ticker}")
                return {
                    'ticker': ticker,
                    'quarters': [],
                    'revenue': [],
                    'eps': []
                }
            
            quarters = []
            revenue = []
            eps = []
            
            # Process data and filter by year (reverse to get chronological order - oldest to newest)
            filtered_data = []
            for estimate in reversed(data):
                if estimate.get('date'):
                    try:
                        year_value = int(estimate['date'][:4])
                    except:
                        continue
                    
                    # Only include data from cutoff_year onwards
                    if year_value >= cutoff_year:
                        quarter_label = self._date_to_quarter(estimate['date'])
                        
                        if quarter_label:
                            quarter_year = int(quarter_label.split()[0])
                            if quarter_year >= cutoff_year:
                                estimate['quarter_label'] = quarter_label
                                filtered_data.append(estimate)
            
            # Process based on mode
            for i, estimate in enumerate(filtered_data):
                quarter_label = estimate['quarter_label']
                
                if mode == 'quarterly':
                    # Get quarterly estimates
                    revenue_avg = estimate.get('estimatedRevenueAvg', 0)
                    eps_avg = estimate.get('estimatedEpsAvg', 0)
                    
                    quarters.append(quarter_label)
                    revenue.append(revenue_avg)  # Keep full integers
                    eps.append(round(eps_avg, 2) if eps_avg > 0 else 0)
                    
                elif mode == 'ttm':
                    # Calculate TTM estimates
                    ttm_revenue, ttm_eps = self._convert_quarterly_to_ttm(
                        filtered_data, i, 'estimatedRevenueAvg', 'estimatedEpsAvg'
                    )
                    
                    if ttm_revenue is not None and ttm_eps is not None:
                        # Filter out Q4 2022 from TTM mode output
                        if quarter_label != "2022 Q4":
                            quarters.append(quarter_label)
                            revenue.append(ttm_revenue)
                            eps.append(ttm_eps)
            
            logger.info(f"Successfully processed estimates data for {ticker}: {len(quarters)} data points")
            return {
                'ticker': ticker,
                'quarters': quarters,
                'revenue': revenue,
                'eps': eps
            }
            
        except Exception as e:
            logger.error(f"Error processing estimates data for {ticker}: {e}")
            return {
                'ticker': ticker,
                'quarters': [],
                'revenue': [],
                'eps': []
            }
    
    def fetch_analyst_estimates(
        self, 
        ticker: str, 
        period: str = "annual", 
        page: int = 0, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch analyst estimates for a given ticker.
        
        Args:
            ticker: Stock ticker symbol
            period: Period type ('annual' or 'quarterly')
            page: Page number for pagination
            limit: Number of results to fetch
            
        Returns:
            List of analyst estimate dictionaries
        """
        # Use mock data if configured
        if self.use_mock_data:
            logger.info(f"🔧 Using mock data for {ticker} analyst estimates")
            self._handle_missing_stock(ticker, "analyst-estimates")
            mock_data = self._load_mock_data("analyst-estimates", ticker)
            logger.info(f"📁 Mock data loaded for {ticker}: {type(mock_data)}, length: {len(mock_data) if mock_data else 'None'}")
            if mock_data is not None:
                logger.info(f"✅ Returning mock data for {ticker} analyst estimates")
                return mock_data
            logger.warning(f"❌ No mock data available for {ticker} analyst estimates")
            return []
        
        # Use live API
        url = f"{self.analyst_estimates_url}?symbol={ticker}&period={period}&page={page}&limit={limit}&apikey={self.api_key}"
        
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if isinstance(data, list):
                logger.info(f"Successfully fetched {len(data)} analyst estimates for {ticker}")
                if len(data) > 0:
                    logger.info(f"📊 Sample FMP estimate: {data[0]}")
                    logger.info(f"📊 All dates in FMP data: {[item.get('date') for item in data[:5]]}")
                return data
            else:
                logger.warning(f"Unexpected response format for {ticker}: {type(data)}")
                logger.info(f"📊 Actual response data: {data}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for {ticker}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error fetching analyst estimates for {ticker}: {e}")
            return []
    
    def fetch_current_year_data(self, ticker: str) -> Optional[Dict[str, float]]:
        """
        Fetch current year financial data for a ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing current year financial metrics or None if failed
        """
        # Use mock data if configured
        if self.use_mock_data:
            self._handle_missing_stock(ticker, "income-statement")
            mock_data = self._load_mock_data("income-statement", ticker)
            if mock_data is not None and isinstance(mock_data, list) and len(mock_data) > 0:
                latest_income = mock_data[0]
                
                # Extract key metrics
                current_data = {
                    'revenue': float(latest_income.get('revenue', 0)),
                    'net_income': float(latest_income.get('netIncome', 0)),
                    'eps': float(latest_income.get('eps', 0)),
                    'shares_outstanding': float(latest_income.get('weightedAverageShsOut', 0))
                }
                
                logger.info(f"Successfully loaded current year data for {ticker} from mock")
                return current_data
            return None
        
        # Use live API
        try:
            # Get income statement data
            income_url = f"{self.base_url_stable}/income-statement?symbol={ticker}&limit=1&apikey={self.api_key}"
            income_response = requests.get(income_url, timeout=10)
            income_response.raise_for_status()
            income_data = income_response.json()
            
            if not income_data or not isinstance(income_data, list):
                logger.warning(f"No income statement data found for {ticker}")
                return None
            
            latest_income = income_data[0]
            
            # Extract key metrics
            current_data = {
                'revenue': float(latest_income.get('revenue', 0)),
                'net_income': float(latest_income.get('netIncome', 0)),
                'eps': float(latest_income.get('eps', 0)),
                'shares_outstanding': float(latest_income.get('weightedAverageShsOut', 0))
            }
            
            logger.info(f"Successfully fetched current year data for {ticker}")
            return current_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for current year data {ticker}: {e}")
            return None
        except (ValueError, KeyError) as e:
            logger.error(f"Error parsing current year data for {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching current year data for {ticker}: {e}")
            return None
    
    def fetch_company_profile(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch company profile data.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Company profile data or None if failed
        """
        # Use mock data if configured
        if self.use_mock_data:
            self._handle_missing_stock(ticker, "profile")
            mock_data = self._load_mock_data("profile", ticker)
            if mock_data is not None and isinstance(mock_data, list) and len(mock_data) > 0:
                logger.info(f"Successfully loaded company profile for {ticker} from mock")
                return mock_data[0]
            return None
        
        # Use live API
        try:
            url = f"{self.base_url_v3}/profile/{ticker}?apikey={self.api_key}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data and isinstance(data, list) and len(data) > 0:
                logger.info(f"Successfully fetched company profile for {ticker}")
                return data[0]
            else:
                logger.warning(f"No company profile data found for {ticker}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for company profile {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching company profile for {ticker}: {e}")
            return None
    
    def _convert_quarterly_to_ttm(self, data: List[Dict], index: int, first_field: str, second_field: str = None) -> tuple:
        """
        Helper method to convert quarterly data to TTM (Trailing Twelve Months).
        Uses the current quarter + 3 previous quarters.
        
        Args:
            data: List of quarterly data
            index: Index of current quarter
            first_field: Field name for first metric (e.g., revenue, operatingCashFlow)
            second_field: Optional field name for second metric (e.g., eps, freeCashFlow)
            
        Returns:
            Tuple of (ttm_first_metric, ttm_second_metric) or (ttm_first_metric, None) if no second field
        """
        if index < 3:  # Not enough data for TTM
            return None, None
        
        # Get 4 quarters of data (current + 3 previous)
        ttm_quarters = data[index-3:index+1]
        
        # Sum up the first field values
        ttm_first_metric = sum(q.get(first_field, 0) for q in ttm_quarters)
        
        # Calculate second metric if field provided
        ttm_second_metric = None
        if second_field:
            # Sum the quarterly values
            ttm_second_metric = sum(q.get(second_field, 0) for q in ttm_quarters)
            # For EPS, round to 2 decimal places; for cash flow, keep as integer
            if second_field == 'estimatedEpsAvg':
                ttm_second_metric = round(ttm_second_metric, 2) if ttm_second_metric > 0 else None
        
        return ttm_first_metric, ttm_second_metric
    
    def fetch_estimates_data(self, ticker: str, mode: str = 'quarterly') -> Optional[Dict[str, Any]]:
        """
        Fetch analyst estimates data for revenue and EPS from the analyst estimates API.
        
        Args:
            ticker: Stock ticker symbol
            mode: 'quarterly' for quarterly data or 'ttm' for trailing twelve months data
            
        Returns:
            Dictionary with ticker, quarters, revenue, and eps arrays or None if failed
        """
        # Use mock data if configured
        if self.use_mock_data:
            self._handle_missing_stock(ticker, "analyst-estimates")
            mock_data = self._load_mock_data("analyst-estimates", ticker)
            if mock_data is not None:
                # Process mock data the same way as live data
                return self._process_estimates_data(mock_data, ticker, mode)
            return {
                'ticker': ticker,
                'quarters': [],
                'revenue': [],
                'eps': []
            }
        
        # Use live API
        try:
            current_year = datetime.now().year
            # For TTM mode, we need data starting from 2022 to calculate TTM for Q1 2023
            # For quarterly mode, we can use 2 years back
            cutoff_year = 2022 if mode == 'ttm' else current_year - 2
            
            # API call to analyst estimates endpoint
            url = f"{self.base_url_v3}/analyst-estimates/{ticker}"
            params = {
                'period': 'quarter',
                'apikey': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Use the same processing logic for live API data
            return self._process_estimates_data(data, ticker, mode)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for estimates data {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching estimates data for {ticker}: {e}")
            return None
    
    def fetch_cash_flow_data(self, ticker: str, mode: str = 'quarterly') -> Optional[Dict[str, Any]]:
        """
        Fetch cash flow data for free cash flow and operating cash flow 
        from the cash flow statement API.
        
        Args:
            ticker: Stock ticker symbol
            mode: 'quarterly' for quarterly data or 'ttm' for trailing twelve months data
            
        Returns:
            Dictionary with ticker, quarters, operating_cash_flow, free_cash_flow arrays or None if failed
        """
        try:
            current_year = datetime.now().year
            # For TTM mode, we need data starting from 2022 to calculate TTM for Q1 2023
            # For quarterly mode, we can use 2 years back
            cutoff_year = 2022 if mode == 'ttm' else current_year - 2
            
            # API call to cash flow statement endpoint
            url = f"{self.base_url_v3}/cash-flow-statement/{ticker}"
            params = {
                'period': 'quarter',
                'limit': 50,  # Get enough historical data
                'apikey': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                logger.warning(f"No cash flow data returned from API for {ticker}")
                return {
                    'ticker': ticker,
                    'quarters': [],
                    'operating_cash_flow': [],
                    'free_cash_flow': []
                }
            
            quarters = []
            operating_cash_flow = []
            free_cash_flow = []
            
            # Process data and filter by year (reverse to get chronological order - oldest to newest)
            filtered_data = []
            for quarter in reversed(data):
                if quarter.get('operatingCashFlow') is not None:
                    quarter_date = quarter.get('date')
                    if not quarter_date:
                        continue
                        
                    try:
                        date_year = int(quarter_date[:4])
                    except:
                        continue
                    
                    # Include data from cutoff_year onwards
                    if date_year >= cutoff_year:
                        quarter_label = self._date_to_calendar_quarter(quarter_date)
                        
                        if quarter_label:
                            quarter_year = int(quarter_label.split()[0])
                            if quarter_year >= cutoff_year:
                                quarter['quarter_label'] = quarter_label
                                filtered_data.append(quarter)
            
            # Process based on mode
            for i, quarter in enumerate(filtered_data):
                quarter_label = quarter['quarter_label']
                
                if mode == 'quarterly':
                    # Get quarterly cash flow values
                    ocf_value = quarter.get('operatingCashFlow', 0)
                    fcf_value = quarter.get('freeCashFlow', 0)
                    
                    quarters.append(quarter_label)
                    operating_cash_flow.append(ocf_value)  # Full integers
                    free_cash_flow.append(fcf_value)  # Full integers
                    
                elif mode == 'ttm':
                    # Calculate TTM cash flow metrics using helper method
                    ttm_operating_cash_flow, ttm_free_cash_flow = self._convert_quarterly_to_ttm(
                        filtered_data, i, 'operatingCashFlow', 'freeCashFlow'
                    )
                    
                    if ttm_operating_cash_flow is not None:
                        # Filter out Q4 2022 from TTM mode output
                        if quarter_label != "2022 Q4":
                            quarters.append(quarter_label)
                            operating_cash_flow.append(ttm_operating_cash_flow)
                            free_cash_flow.append(ttm_free_cash_flow if ttm_free_cash_flow is not None else 0)
            
            logger.info(f"Successfully fetched cash flow data for {ticker}: {len(quarters)} data points")
            return {
                'ticker': ticker,
                'quarters': quarters,
                'operating_cash_flow': operating_cash_flow,
                'free_cash_flow': free_cash_flow
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for cash flow data {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching cash flow data for {ticker}: {e}")
            return None

    def fetch_income_statement_data(self, ticker: str, mode: str = 'quarterly') -> Optional[Dict[str, Any]]:
        """
        Fetch income statement data for gross margin, net margin, and operating income 
        from the income statement API.
        
        Args:
            ticker: Stock ticker symbol
            mode: 'quarterly' for quarterly data or 'ttm' for trailing twelve months data
            
        Returns:
            Dictionary with ticker, quarters, gross_margin, net_margin, operating_income arrays or None if failed
        """
        try:
            current_year = datetime.now().year
            # For TTM mode, we need data starting from 2022 to calculate TTM for Q1 2023
            # For quarterly mode, we can use 2 years back
            cutoff_year = 2022 if mode == 'ttm' else current_year - 2
            
            # API call to income statement endpoint
            url = f"{self.base_url_stable}/income-statement"
            params = {
                'symbol': ticker,
                'period': 'quarter',
                'limit': 40,  # Get enough historical data
                'apikey': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                logger.warning(f"No income statement data returned from API for {ticker}")
                return {
                    'ticker': ticker,
                    'quarters': [],
                    'gross_margin': [],
                    'net_margin': [],
                    'operating_income': []
                }
            
            quarters = []
            gross_margin = []
            net_margin = []
            operating_income = []
            
            # Process data and filter by year (reverse to get chronological order - oldest to newest)
            filtered_data = []
            for quarter in reversed(data):
                if not quarter.get('revenue'):
                    continue
                
                quarter_date = quarter.get('date')
                if not quarter_date:
                    continue
                
                try:
                    date_year = int(quarter_date[:4])
                except:
                    continue
                
                # Include data from cutoff_year onwards
                if date_year >= cutoff_year:
                    quarter_label = self._date_to_calendar_quarter(quarter_date)
                    
                    if quarter_label:
                        quarter_year = int(quarter_label.split()[0])
                        if quarter_year >= cutoff_year:
                            quarter['quarter_label'] = quarter_label
                            filtered_data.append(quarter)
            
            # Process based on mode
            for i, quarter in enumerate(filtered_data):
                quarter_label = quarter['quarter_label']
                
                if mode == 'quarterly':
                    # Calculate quarterly margins
                    gross_profit = quarter.get('grossProfit', 0)
                    net_income_value = quarter.get('netIncome', 0)
                    revenue_raw = quarter.get('revenue', 0)
                    operating_income_value = quarter.get('operatingIncome', 0)
                    
                    gross_margin_pct = round((gross_profit / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                    net_margin_pct = round((net_income_value / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                    
                    quarters.append(quarter_label)
                    gross_margin.append(gross_margin_pct)
                    net_margin.append(net_margin_pct)
                    operating_income.append(operating_income_value)  # Full integer
                    
                elif mode == 'ttm':
                    # Calculate TTM metrics manually for margins and operating income
                    if i < 3:  # Not enough data for TTM
                        continue
                    
                    # Get 4 quarters of data (current + 3 previous)
                    ttm_quarters = filtered_data[i-3:i+1]
                    
                    # Sum up the values
                    ttm_revenue = sum(q.get('revenue', 0) for q in ttm_quarters)
                    ttm_gross_profit = sum(q.get('grossProfit', 0) for q in ttm_quarters)
                    ttm_net_income = sum(q.get('netIncome', 0) for q in ttm_quarters)
                    ttm_operating_income = sum(q.get('operatingIncome', 0) for q in ttm_quarters)
                    
                    # Calculate margins
                    ttm_gross_margin_pct = round((ttm_gross_profit / ttm_revenue) * 100, 2) if ttm_revenue > 0 else 0
                    ttm_net_margin_pct = round((ttm_net_income / ttm_revenue) * 100, 2) if ttm_revenue > 0 else 0
                    
                    # Filter out Q4 2022 from TTM mode output
                    if quarter_label != "2022 Q4":
                        quarters.append(quarter_label)
                        gross_margin.append(ttm_gross_margin_pct)
                        net_margin.append(ttm_net_margin_pct)
                        operating_income.append(ttm_operating_income)  # Full integer
            
            logger.info(f"Successfully fetched income statement data for {ticker}: {len(quarters)} data points")
            return {
                'ticker': ticker,
                'quarters': quarters,
                'gross_margin': gross_margin,
                'net_margin': net_margin,
                'operating_income': operating_income
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for income statement data {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching income statement data for {ticker}: {e}")
            return None

    def fetch_chart_data(self, ticker: str, mode: str = 'quarterly') -> Optional[Dict[str, Any]]:
        """
        Fetch comprehensive chart data combining revenue/EPS from estimates API,
        margins/operating income from income statement API, and cash flow data from cash flow API.
        
        Args:
            ticker: Stock ticker symbol
            mode: Data mode - 'quarterly' for quarterly data or 'ttm' for trailing twelve months data
            
        Returns:
            Dictionary with all chart data or None if failed
        """
        try:
            # Get estimates data (revenue and EPS)
            estimates_data = self.fetch_estimates_data(ticker, mode)
            if not estimates_data:
                logger.error(f"Failed to fetch estimates data for {ticker}")
                return None
            
            # Get income statement data (margins and operating income) 
            income_data = self.fetch_income_statement_data(ticker, mode)
            if not income_data:
                logger.error(f"Failed to fetch income statement data for {ticker}")
                return None
            
            # Get cash flow data (operating and free cash flow)
            cash_flow_data = self.fetch_cash_flow_data(ticker, mode)
            if not cash_flow_data:
                logger.warning(f"Failed to fetch cash flow data for {ticker}, using null values")
                cash_flow_data = {
                    'quarters': [],
                    'operating_cash_flow': [],
                    'free_cash_flow': []
                }
            
            # Combine the data - use estimates quarters as primary reference
            quarters = estimates_data['quarters']
            revenue = estimates_data['revenue']
            eps = estimates_data['eps']
            
            # Align income statement data with estimates quarters
            gross_margin = []
            net_margin = []
            operating_income = []
            
            for quarter in quarters:
                if quarter in income_data['quarters']:
                    idx = income_data['quarters'].index(quarter)
                    gross_margin.append(income_data['gross_margin'][idx])
                    net_margin.append(income_data['net_margin'][idx])
                    operating_income.append(income_data['operating_income'][idx])
                else:
                    # Quarter not found in income data - set as null for future projections
                    gross_margin.append(None)
                    net_margin.append(None)
                    operating_income.append(None)
            
            # Align cash flow data with estimates quarters
            operating_cash_flow = []
            free_cash_flow = []
            
            for quarter in quarters:
                if quarter in cash_flow_data['quarters']:
                    idx = cash_flow_data['quarters'].index(quarter)
                    operating_cash_flow.append(cash_flow_data['operating_cash_flow'][idx])
                    free_cash_flow.append(cash_flow_data['free_cash_flow'][idx])
                else:
                    # Quarter not found in cash flow data - set as null for future projections
                    operating_cash_flow.append(None)
                    free_cash_flow.append(None)
            
            result = {
                'ticker': ticker,
                'quarters': quarters,
                'revenue': revenue,
                'eps': eps,
                'gross_margin': gross_margin,
                'net_margin': net_margin,
                'operating_income': operating_income,
                'operating_cash_flow': operating_cash_flow,
                'free_cash_flow': free_cash_flow
            }
            
            logger.info(f"Successfully combined chart data for {ticker}: {len(quarters)} quarters")
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error fetching chart data for {ticker}: {e}")
            return None
    
    def _date_to_quarter(self, date_str: str) -> Optional[str]:
        """
        Convert date string to quarter format (e.g., "2025-03-28" -> "2025 Q1")
        Using standard calendar quarters: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
        """
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            year = date_obj.year
            month = date_obj.month
            
            # Standard calendar quarters
            if month <= 3:  # Jan-Mar
                quarter = "Q1"
            elif month <= 6:  # Apr-Jun
                quarter = "Q2"
            elif month <= 9:  # Jul-Sep
                quarter = "Q3"
            else:  # Oct-Dec
                quarter = "Q4"
                
            return f"{year} {quarter}"
        except (ValueError, TypeError):
            return None
    
    def _date_to_calendar_quarter(self, date_str: str) -> Optional[str]:
        """
        Convert fiscal quarter end date to the actual calendar quarter the data represents.
        
        Apple's fiscal quarters end on these dates and represent these calendar periods:
        - ~April 1st (Q2 fiscal) -> Q1 calendar (Jan-Mar data)
        - ~July 1st (Q3 fiscal) -> Q2 calendar (Apr-Jun data)  
        - ~September 30th (Q4 fiscal) -> Q3 calendar (Jul-Sep data)
        - ~December 31st (Q1 fiscal) -> Q4 calendar (Oct-Dec data)
        """
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            # Map fiscal quarter end dates to the calendar quarters they represent
            if (month == 4 and day == 1) or (month == 3 and day >= 25):  # End of Q1 calendar period
                return f"{year} Q1"
            elif (month == 7 and day == 1) or (month == 6 and day >= 25):  # End of Q2 calendar period
                return f"{year} Q2"  
            elif month == 9 and day >= 25:  # End of Q3 calendar period (Sept 30 area)
                return f"{year} Q3"
            elif month == 12 and day >= 25:  # End of Q4 calendar period (Dec 31 area)
                return f"{year} Q4"
            else:
                # Fallback to standard calendar quarters if dates don't match expected fiscal pattern
                return self._date_to_quarter(date_str)
                
        except (ValueError, TypeError):
            return None