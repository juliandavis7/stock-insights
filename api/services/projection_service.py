"""Projection service for financial projections and scenario analysis."""

import yfinance as yf
import requests
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from .fmp_service import FMPService
from .yfinance_service import YFinanceService
from .. import util

logger = logging.getLogger(__name__)


class ProjectionService:
    """Service for calculating financial projections."""
    
    def __init__(self, fmp_service: Optional[FMPService] = None, yfinance_service: Optional[YFinanceService] = None):
        self.fmp_service = fmp_service or FMPService()
        self.yfinance_service = yfinance_service or YFinanceService()
    
    def calculate_financial_projections(
        self,
        ticker: str,
        api_key: str,
        projection_inputs: Dict[int, Dict[str, float]],
        shares_outstanding: Optional[float] = None,
        current_stock_price: Optional[float] = None,
        current_year_data: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculate financial projections for a stock based on growth assumptions.
        
        Args:
            ticker: Stock ticker symbol
            api_key: FMP API key
            projection_inputs: Dictionary with year as key and projection data as value
            shares_outstanding: Optional - Number of shares outstanding
            current_stock_price: Optional - Current stock price
            current_year_data: Optional - Current year financial data
            
        Returns:
            Dictionary containing projections for each year with calculated metrics
        """
        logger.info(f"Starting projection calculations for {ticker}")
        
        try:
            # Validate inputs
            validation_errors = util.validate_projection_inputs(projection_inputs)
            if validation_errors:
                return {
                    'success': False,
                    'error': 'Validation failed',
                    'details': validation_errors,
                    'ticker': ticker
                }
            
            # Fetch required data
            current_data = self._get_current_year_data(ticker, current_year_data)
            if not current_data:
                return {
                    'success': False,
                    'error': f'Failed to fetch current year data for {ticker}',
                    'ticker': ticker
                }
            
            stock_price = self._get_current_stock_price(ticker, current_stock_price)
            if not stock_price:
                return {
                    'success': False,
                    'error': f'Failed to fetch current stock price for {ticker}',
                    'ticker': ticker
                }
            
            shares = self._get_shares_outstanding(ticker, shares_outstanding, current_data)
            if not shares:
                return {
                    'success': False,
                    'error': f'Failed to determine shares outstanding for {ticker}',
                    'ticker': ticker
                }
            
            # Calculate projections
            projections = self._calculate_projections(
                projection_inputs, current_data, stock_price, shares
            )
            
            # Calculate summary statistics
            summary = self._calculate_summary(projections, stock_price)
            
            current_year = datetime.now().year
            
            result = {
                'success': True,
                'ticker': ticker.upper(),
                'current_year': current_year,
                'base_data': {
                    'current_stock_price': stock_price,
                    'shares_outstanding': shares,
                    'current_revenue': current_data['revenue'],
                    'current_net_income': current_data['net_income']
                },
                'projections': projections,
                'summary': summary
            }
            
            logger.info(f"Successfully calculated projections for {ticker}")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating projections for {ticker}: {e}")
            return {
                'success': False,
                'error': f'Internal error: {str(e)}',
                'ticker': ticker
            }
    
    def _get_current_year_data(self, ticker: str, provided_data: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        """Get current year financial data."""
        if provided_data:
            # Validate provided data
            required_fields = ['revenue', 'net_income']  
            validation_errors = []
            if not all(field in provided_data and isinstance(provided_data[field], (int, float)) for field in required_fields):
                validation_errors = ['Missing or invalid required fields']
            if not validation_errors:
                return provided_data
            else:
                logger.warning(f"Invalid provided data for {ticker}: {validation_errors}")
        
        # Fetch from FMP
        return self.fmp_service.fetch_current_year_data(ticker)
    
    def _get_current_stock_price(self, ticker: str, provided_price: Optional[float]) -> Optional[float]:
        """Get current stock price."""
        if provided_price and provided_price > 0:
            return provided_price
        
        return self.yfinance_service.get_current_price(ticker)
    
    def _get_shares_outstanding(
        self, 
        ticker: str, 
        provided_shares: Optional[float], 
        current_data: Dict[str, float]
    ) -> Optional[float]:
        """Get shares outstanding."""
        if provided_shares and provided_shares > 0:
            return provided_shares
        
        # Try from current data
        if 'shares_outstanding' in current_data and current_data['shares_outstanding'] > 0:
            return current_data['shares_outstanding']
        
        # Fetch from YFinance
        return self.yfinance_service.get_shares_outstanding(ticker)
    
    def _calculate_projections(
        self,
        projection_inputs: Dict[int, Dict[str, float]],
        current_data: Dict[str, float],
        current_price: float,
        shares_outstanding: float
    ) -> Dict[int, Dict[str, float]]:
        """Calculate projections for each year."""
        projections = {}
        current_year = datetime.now().year
        
        # Initialize starting values
        prev_revenue = current_data['revenue']
        prev_net_income = current_data['net_income']
        
        # Process years in order
        valid_years = sorted([year for year in projection_inputs.keys() 
                             if year in range(current_year + 1, current_year + 5)])
        
        for year in valid_years:
            if year not in projection_inputs:
                continue
            
            inputs = projection_inputs[year]
            
            # Calculate projected financials
            projected_revenue = util.calculate_projected_revenue(
                prev_revenue, inputs['revenue_growth']
            )
            
            projected_net_income = util.calculate_projected_net_income(
                prev_net_income, inputs['net_income_growth']
            )
            
            # Calculate EPS
            eps = util.calculate_eps(projected_net_income, shares_outstanding)
            
            # Calculate stock price range
            price_range = util.calculate_stock_price_range(
                eps, inputs['pe_low'], inputs['pe_high']
            )
            
            # Calculate CAGR
            years_from_current = year - current_year
            cagr_low = util.calculate_cagr(current_price, price_range['low'], years_from_current)
            cagr_high = util.calculate_cagr(current_price, price_range['high'], years_from_current)
            
            # Store projections
            projections[year] = {
                'revenue': round(projected_revenue, 2),
                'net_income': round(projected_net_income, 2),
                'eps': round(eps, 2),
                'stock_price_low': round(price_range['low'], 2),
                'stock_price_high': round(price_range['high'], 2),
                'cagr_low': round(cagr_low * 100, 2),  # Convert to percentage
                'cagr_high': round(cagr_high * 100, 2)  # Convert to percentage
            }
            
            # Update for next iteration
            prev_revenue = projected_revenue
            prev_net_income = projected_net_income
        
        return projections
    
    def _calculate_summary(self, projections: Dict[int, Dict[str, float]], current_price: float) -> Dict[str, Any]:
        """Calculate summary statistics from projections."""
        if not projections:
            return {}
        
        years = sorted(projections.keys())
        final_year = years[-1]
        final_projection = projections[final_year]
        
        # Calculate ranges
        price_lows = [p['stock_price_low'] for p in projections.values()]
        price_highs = [p['stock_price_high'] for p in projections.values()]
        cagr_lows = [p['cagr_low'] for p in projections.values()]
        cagr_highs = [p['cagr_high'] for p in projections.values()]
        
        return {
            'projection_years': len(projections),
            'final_year': final_year,
            'price_range_low': {
                'min': round(min(price_lows), 2),
                'max': round(max(price_lows), 2),
                'final': final_projection['stock_price_low']
            },
            'price_range_high': {
                'min': round(min(price_highs), 2),
                'max': round(max(price_highs), 2),
                'final': final_projection['stock_price_high']
            },
            'cagr_range': {
                'low_min': round(min(cagr_lows), 2),
                'low_max': round(max(cagr_lows), 2),
                'high_min': round(min(cagr_highs), 2),
                'high_max': round(max(cagr_highs), 2)
            },
            'upside_potential': {
                'low_estimate': round(((final_projection['stock_price_low'] / current_price) - 1) * 100, 2),
                'high_estimate': round(((final_projection['stock_price_high'] / current_price) - 1) * 100, 2)
            }
        }
    
    def get_stock_current_data(self, ticker: str, fmp_api_key: str) -> Optional[Dict[str, float]]:
        """
        Fetch current stock data using yfinance and FMP API.
        
        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL', 'PYPL')
            fmp_api_key: Financial Modeling Prep API key
        
        Returns:
            Dictionary containing current stock data:
            - revenue: Current year revenue estimate from FMP
            - net_income: Current year net income estimate from FMP
            - current_year_eps: Current year EPS estimate from FMP
            - price: Current stock price
            - market_cap: Current market capitalization
            - shares_outstanding: Current shares outstanding
            
            Returns None if data cannot be fetched or processed
        """
        try:
            # Create yfinance Ticker object
            stock = yf.Ticker(ticker)
            
            # Get stock info (contains price, market cap, shares data)
            info = stock.info
            
            # Fetch current stock price
            price = (
                info.get('currentPrice') or 
                info.get('regularMarketPrice') or 
                info.get('previousClose')
            )
            
            # Fetch market cap
            market_cap = info.get('marketCap')
            
            # Fetch shares outstanding
            shares_outstanding = (
                info.get('sharesOutstanding') or 
                info.get('impliedSharesOutstanding') or 
                info.get('floatShares')
            )
            
            # Fetch current year financial data from FMP API
            current_year = datetime.now().year
            revenue = None
            net_income = None
            current_year_eps = None
            
            try:
                # FMP API call for analyst estimates
                fmp_url = "https://financialmodelingprep.com/stable/analyst-estimates"
                params = {
                    "symbol": ticker,
                    "period": "annual",
                    "page": 0,
                    "limit": 10,
                    "apikey": fmp_api_key
                }
                
                response = requests.get(fmp_url, params=params)
                response.raise_for_status()
                
                fmp_data = response.json()
                
                if fmp_data:
                    # Find current year data
                    for record in fmp_data:
                        if record.get('date'):
                            # Extract year from date (format: YYYY-MM-DD)
                            record_year = int(record['date'][:4])
                            if record_year == current_year:
                                revenue = record.get('estimatedRevenueAvg')
                                net_income = record.get('estimatedNetIncomeAvg')
                                current_year_eps = record.get('estimatedEpsAvg')
                                break
                    
                    if revenue is None:
                        logger.warning(f"No current year ({current_year}) data found for {ticker} in FMP API")
                else:
                    logger.warning(f"No data returned from FMP API for {ticker}")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"FMP API request failed for {ticker}: {e}")
            except (KeyError, ValueError) as e:
                logger.error(f"Error parsing FMP API response for {ticker}: {e}")
            
            # Check if we have all required basic data
            if any(x is None for x in [price, market_cap, shares_outstanding]):
                logger.error(f"Missing basic stock data for {ticker}")
                return None
            
            # Build result dictionary
            result = {
                'ticker': ticker,
                'revenue': float(revenue) if revenue else None,
                'net_income': float(net_income) if net_income else None,
                'current_year_eps': float(current_year_eps) if current_year_eps else None,
                'price': float(price),
                'market_cap': float(market_cap),
                'shares_outstanding': float(shares_outstanding),
                'data_year': current_year
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return None