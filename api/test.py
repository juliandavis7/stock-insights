import yfinance as yf
import requests
from typing import Dict, Optional
import pandas as pd
from datetime import datetime

def get_stock_current_data(ticker: str, fmp_api_key: str) -> Optional[Dict[str, float]]:
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
                            revenue = record.get('revenueAvg')
                            net_income = record.get('netIncomeAvg')
                            current_year_eps = record.get('epsAvg')
                            break
                
                if revenue is None:
                    print(f"No current year ({current_year}) data found for {ticker} in FMP API")
            else:
                print(f"No data returned from FMP API for {ticker}")
                
        except requests.exceptions.RequestException as e:
            print(f"FMP API request failed for {ticker}: {e}")
        except (KeyError, ValueError) as e:
            print(f"Error parsing FMP API response for {ticker}: {e}")
        
        # Check if we have all required basic data
        if any(x is None for x in [price, market_cap, shares_outstanding]):
            print(f"Missing basic stock data for {ticker}")
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
        print(f"Error fetching data for {ticker}: {e}")
        return None

# Example usage and testing
if __name__ == "__main__":
    # You'll need to set your FMP API key
    FMP_API_KEY = "kFoyQBTilV6J4OIfCd9RdhTeTb8CeK5B"  # Replace with your actual API key
    
    print("\n" + "="*50)
    print("Sample usage with FMP API integration:")
    print("="*50)
    
    # Test with SOFI (from your example)
    sofi_data = get_stock_current_data("SOFI", FMP_API_KEY)
    if sofi_data:
        print(f"\nSOFI data for {sofi_data['data_year']}:")
        print(f"  ticker: {sofi_data['ticker']}")
        print(f"  price: ${sofi_data['price']:.2f}")
        print(f"  market_cap: ${sofi_data['market_cap']:,.0f}")
        print(f"  shares_outstanding: {sofi_data['shares_outstanding']:,.0f}")
        
        if sofi_data['revenue']:
            revenue_millions = sofi_data['revenue'] / 1_000_000
            print(f"  revenue: ${revenue_millions:.1f}M (${sofi_data['revenue']:,.0f})")
        else:
            print("  revenue: Not Available")
        
        if sofi_data['net_income']:
            net_income_millions = sofi_data['net_income'] / 1_000_000
            print(f"  net_income: ${net_income_millions:.1f}M (${sofi_data['net_income']:,.0f})")
        else:
            print("  net_income: Not Available")
            
        if sofi_data['current_year_eps']:
            print(f"  current_year_eps: ${sofi_data['current_year_eps']:.2f}")
        else:
            print("  current_year_eps: Not Available")
    else:
        print("❌ Failed to fetch SOFI data")