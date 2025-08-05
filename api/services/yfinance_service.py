"""YFinance service for fetching stock data from Yahoo Finance."""

import yfinance as yf
import pandas as pd
import logging
from typing import Dict, Any, Optional
from .. import util

logger = logging.getLogger(__name__)


class YFinanceService:
    """Service for interacting with Yahoo Finance API via yfinance."""
    
    def __init__(self):
        pass
    
    def fetch_stock_info(self, ticker: str) -> Optional[Dict[str, float]]:
        """
        Fetch comprehensive stock information from Yahoo Finance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing stock information or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info:
                logger.warning(f"No stock info available for {ticker}")
                return None
            
            # Extract and validate basic info
            if not info.get('symbol'):
                logger.warning(f"Invalid stock info for {ticker} - missing symbol")
                return None
                
            # Use data extractor to process the info
            # Extract key metrics manually instead of using DataExtractor
            extracted_metrics = {
                'trailing_pe': info.get('trailingPE'),
                'forward_pe': info.get('forwardPE'),
                'price_to_sales_ttm': info.get('priceToSalesTrailing12Months'),
                'gross_margins': info.get('grossMargins'),
                'profit_margins': info.get('profitMargins'),
                'earnings_growth': info.get('earningsGrowth', 0) * 100 if info.get('earningsGrowth') else None,
                'revenue_growth': info.get('revenueGrowth', 0) * 100 if info.get('revenueGrowth') else None,
                'market_cap': info.get('marketCap'),
                'enterprise_value': info.get('enterpriseValue'),
                'shares_outstanding': info.get('sharesOutstanding'),
                'current_price': info.get('currentPrice'),
                'total_revenue': info.get('totalRevenue')
            }
            
            # Add some additional processing
            result = {
                'ticker': ticker.upper(),
                'company_name': info.get('longName', 'Unknown'),
                'sector': info.get('sector', 'Unknown'),
                'industry': info.get('industry', 'Unknown'),
                **extracted_metrics
            }
            
            logger.info(f"Successfully fetched stock info for {ticker}")
            return result
            
        except Exception as e:
            logger.error(f"Error fetching stock info for {ticker}: {e}")
            return None
    
    def fetch_earnings_forecast(self, ticker: str) -> Optional[Any]:
        """
        Fetch earnings forecast data.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Earnings forecast data or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            
            # Try multiple yfinance properties for earnings forecasts
            forecast_sources = [
                ('calendar', stock.calendar),
                ('earnings_forecasts', getattr(stock, 'earnings_forecasts', None)),
                ('analyst_price_target', getattr(stock, 'analyst_price_target', None)),
                ('earnings_estimate', getattr(stock, 'earnings_estimate', None))
            ]
            
            for source_name, forecast_data in forecast_sources:
                try:
                    if forecast_data is not None and hasattr(forecast_data, 'empty') and not forecast_data.empty:
                        logger.info(f"Successfully fetched earnings forecast for {ticker} from {source_name}")
                        return forecast_data
                    elif forecast_data is not None and not hasattr(forecast_data, 'empty'):
                        logger.info(f"Successfully fetched earnings forecast for {ticker} from {source_name}")
                        return forecast_data
                except:
                    continue
            
            logger.warning(f"No earnings forecast available for {ticker}")
            return None
                
        except Exception as e:
            logger.error(f"Error fetching earnings forecast for {ticker}: {e}")
            return None
    
    def fetch_revenue_forecast(self, ticker: str) -> Optional[Any]:
        """
        Fetch revenue forecast data.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Revenue forecast data or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            
            # Try multiple yfinance properties for revenue forecasts
            forecast_sources = [
                ('revenue_estimate', getattr(stock, 'revenue_estimate', None)),
                ('earnings_estimate', getattr(stock, 'earnings_estimate', None)),
                ('calendar', stock.calendar),
                ('recommendations', stock.recommendations),
                ('analyst_price_target', getattr(stock, 'analyst_price_target', None))
            ]
            
            for source_name, forecast_data in forecast_sources:
                try:
                    if forecast_data is not None and hasattr(forecast_data, 'empty') and not forecast_data.empty:
                        logger.info(f"Successfully fetched revenue forecast for {ticker} from {source_name}")
                        return forecast_data
                    elif forecast_data is not None and not hasattr(forecast_data, 'empty'):
                        logger.info(f"Successfully fetched revenue forecast for {ticker} from {source_name}")
                        return forecast_data
                except:
                    continue
            
            logger.warning(f"No revenue forecast available for {ticker}")
            return None
                
        except Exception as e:
            logger.error(f"Error fetching revenue forecast for {ticker}: {e}")
            return None
    
    def get_current_price(self, ticker: str) -> Optional[float]:
        """
        Get current stock price.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Current stock price or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Try multiple price fields
            price_fields = ['currentPrice', 'regularMarketPrice', 'previousClose']
            
            for field in price_fields:
                price = info.get(field)
                if price is not None:
                    logger.info(f"Got current price for {ticker}: ${price}")
                    return float(price)
            
            logger.warning(f"No current price available for {ticker}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching current price for {ticker}: {e}")
            return None
    
    def get_shares_outstanding(self, ticker: str) -> Optional[float]:
        """
        Get shares outstanding.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Shares outstanding or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            shares = info.get('sharesOutstanding')
            if shares is not None:
                logger.info(f"Got shares outstanding for {ticker}: {shares:,.0f}")
                return float(shares)
            
            logger.warning(f"No shares outstanding data for {ticker}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching shares outstanding for {ticker}: {e}")
            return None
    
    def get_market_cap(self, ticker: str) -> Optional[float]:
        """
        Get market capitalization.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Market cap or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            market_cap = info.get('marketCap')
            if market_cap is not None:
                logger.info(f"Got market cap for {ticker}: ${market_cap:,.0f}")
                return float(market_cap)
            
            logger.warning(f"No market cap data for {ticker}")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching market cap for {ticker}: {e}")
            return None
    
    def get_annual_income_statement(self, ticker: str) -> Optional[list]:
        """
        Get annual income statement data using yfinance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            List of annual financial data or None if failed
        """
        try:
            stock = yf.Ticker(ticker)
            financials = stock.financials
            
            if financials.empty:
                logger.warning(f"No financial data available for {ticker}")
                return None
            
            # Define the metrics we want to extract (matching the test.py approach exactly)
            metric_mapping = {
                'totalRevenue': ['Total Revenue', 'Revenue'],
                'costOfRevenue': ['Cost Of Revenue', 'Cost of Revenue'],
                'grossProfit': ['Gross Profit'],
                'sellingGeneralAndAdministrative': ['Selling General And Administration', 'Selling General And Administrative', 'Selling General Administrative'],
                'researchAndDevelopment': ['Research And Development', 'Research Development'],
                'operatingExpenses': ['Operating Expense', 'Total Operating Expenses'],
                'operatingIncome': ['Operating Income', 'Operating Revenue'],
                'netIncome': ['Net Income', 'Net Income Common Stockholders'],
                'eps': ['Basic EPS', 'Earnings Per Share'],
                'dilutedEps': ['Diluted EPS', 'Diluted Earnings Per Share']
            }
            
            # Extract data for each year
            financial_data = []
            
            for year_col in financials.columns:
                year_data = {
                    'fiscalYear': str(year_col.year)
                }
                
                for our_key, possible_names in metric_mapping.items():
                    value = None
                    
                    # Try to find the metric in financials
                    for name in possible_names:
                        if name in financials.index:
                            value = financials.loc[name, year_col]
                            break
                    
                    if value is not None and not pd.isna(value):
                        # For EPS fields, keep as float; for others, convert to int
                        if our_key in ['eps', 'dilutedEps']:
                            year_data[our_key] = float(value)
                        else:
                            year_data[our_key] = int(float(value))
                    else:
                        year_data[our_key] = None
                
                financial_data.append(year_data)
            
            logger.info(f"Successfully fetched annual income statement for {ticker}")
            return financial_data
            
        except Exception as e:
            logger.error(f"Error fetching annual income statement for {ticker}: {e}")
            return None