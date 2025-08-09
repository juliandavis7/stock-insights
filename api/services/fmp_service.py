"""FMP (Financial Modeling Prep) API service for fetching financial data."""

import requests
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..constants import FMP_API_KEY, FMP_ANALYST_ESTIMATES_URL

logger = logging.getLogger(__name__)


class FMPService:
    """Service for interacting with Financial Modeling Prep API."""
    
    def __init__(self, api_key: str = FMP_API_KEY):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com/api/v3"
        self.analyst_estimates_url = FMP_ANALYST_ESTIMATES_URL
    
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
        try:
            # Get income statement data
            income_url = f"{self.base_url}/income-statement/{ticker}?limit=1&apikey={self.api_key}"
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
        try:
            url = f"{self.base_url}/profile/{ticker}?apikey={self.api_key}"
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
    
    def fetch_chart_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch analyst estimates for chart data (revenue and EPS by quarter).
        Based on test2.py logic for quarterly analyst estimates.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with ticker, quarters, revenue, and eps arrays or None if failed
        """
        try:
            # API call to analyst estimates endpoint for quarterly data
            url = f"{self.base_url}/analyst-estimates/{ticker}"
            params = {
                'period': 'quarter',
                'apikey': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                logger.warning(f"No chart data returned from API for {ticker}")
                return {
                    'ticker': ticker,
                    'quarters': [],
                    'revenue': [],
                    'eps': []
                }
            
            # Get cutoff year (2 years prior to current year) and target year (2 years into future)
            current_year = datetime.now().year
            cutoff_year = current_year - 2
            target_year = current_year + 2
            
            quarters = []
            revenue = []
            eps = []
            
            # Sort data by date (oldest to newest for chronological order)
            sorted_data = sorted(data, key=lambda x: x.get('date', ''))
            
            for estimate in sorted_data:
                try:
                    # Get the year from the date
                    estimate_date = estimate.get('date', '')
                    if not estimate_date:
                        continue
                        
                    estimate_year = int(estimate_date[:4])
                    
                    # Only include data from cutoff_year to target_year (inclusive)
                    if cutoff_year <= estimate_year <= target_year:
                        # Convert date to quarter format
                        quarter_label = self._date_to_quarter(estimate_date)
                        
                        if quarter_label:
                            # Get estimated revenue (keep full numbers)
                            estimated_revenue = estimate.get('estimatedRevenueAvg', 0)
                            
                            # Get estimated EPS
                            estimated_eps = estimate.get('estimatedEpsAvg', 0)
                            
                            # Add to lists
                            quarters.append(quarter_label)
                            revenue.append(estimated_revenue)
                            eps.append(estimated_eps)
                        
                except (ValueError, KeyError, TypeError):
                    continue
            
            logger.info(f"Successfully fetched chart data for {ticker}: {len(quarters)} data points")
            return {
                'ticker': ticker,
                'quarters': quarters,
                'revenue': revenue,
                'eps': eps
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for chart data {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching chart data for {ticker}: {e}")
            return None
    
    def fetch_historical_financials(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fetch historical financial metrics (gross margin, net margin, operating income) from income statement.
        Based on test.py logic for quarterly income statement data.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with ticker, quarters, gross_margin, net_margin, operating_income arrays or None if failed
        """
        try:
            # API call to income statement endpoint for quarterly data
            # Use the same URL format as the current year data method
            url = f"{self.base_url}/income-statement/{ticker}"
            params = {
                'period': 'quarter',
                'limit': 20,
                'apikey': self.api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                logger.warning(f"No historical financial data returned from API for {ticker}")
                return {
                    'ticker': ticker,
                    'quarters': [],
                    'gross_margin': [],
                    'net_margin': [],
                    'operating_income': []
                }
            
            # Get cutoff year (2 years prior to current year)
            current_year = datetime.now().year
            cutoff_year = current_year - 2
            
            quarters = []
            gross_margin = []
            net_margin = []
            operating_income = []
            
            # Process data and filter by year (reverse to get chronological order - oldest to newest)
            for quarter in reversed(data):
                try:
                    # Check if revenue exists (filter out invalid quarters)
                    if not quarter.get('revenue'):
                        continue
                    
                    # Get the date to convert to calendar quarter (to match analyst estimates format)
                    quarter_date = quarter.get('date')
                    if not quarter_date:
                        continue
                        
                    # Extract calendar year from the date (this gives us the actual calendar period)
                    try:
                        date_year = int(quarter_date[:4])
                    except:
                        continue
                    
                    # Only include data from cutoff_year onwards using calendar year from date
                    if date_year >= cutoff_year:
                        # Convert date to calendar quarter format (to match analyst estimates)
                        quarter_label = self._date_to_calendar_quarter(quarter_date)
                        
                        if quarter_label:
                                # Calculate margins (as percentages)
                                gross_profit = quarter.get('grossProfit', 0)
                                net_income_value = quarter.get('netIncome', 0)
                                revenue_raw = quarter.get('revenue', 0)
                                
                                gross_margin_pct = round((gross_profit / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                                net_margin_pct = round((net_income_value / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                                
                                # Get operating income (keep full numbers like revenue)
                                operating_income_value = quarter.get('operatingIncome', 0)
                                
                                # Add to lists
                                quarters.append(quarter_label)
                                gross_margin.append(gross_margin_pct)
                                net_margin.append(net_margin_pct)
                                operating_income.append(operating_income_value)
                                
                except (ValueError, KeyError, TypeError):
                    continue
            
            logger.info(f"Successfully fetched historical financial data for {ticker}: {len(quarters)} data points")
            return {
                'ticker': ticker,
                'quarters': quarters,
                'gross_margin': gross_margin,
                'net_margin': net_margin,
                'operating_income': operating_income
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"FMP API request failed for historical financial data {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching historical financial data for {ticker}: {e}")
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