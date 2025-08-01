"""FMP (Financial Modeling Prep) API service for fetching financial data."""

import requests
import logging
from typing import List, Dict, Any, Optional
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