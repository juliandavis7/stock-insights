from typing import Dict, List, Any, Optional
from datetime import datetime
import math
import requests
import json
import yfinance as yf

def fetch_stock_info(ticker: str) -> Optional[Dict[str, float]]:
    """
    Fetch current stock price and shares outstanding using yfinance.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
    
    Returns:
        Dictionary with current stock price and shares outstanding, or None if error
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get current stock price (try multiple fields as they can vary)
        current_price = (
            info.get('currentPrice') or 
            info.get('regularMarketPrice') or 
            info.get('previousClose')
        )
        
        # Get shares outstanding (try multiple fields)
        shares_outstanding = (
            info.get('sharesOutstanding') or 
            info.get('impliedSharesOutstanding') or 
            info.get('floatShares')
        )
        
        if current_price is None or shares_outstanding is None:
            print(f"Missing data for {ticker}: price={current_price}, shares={shares_outstanding}")
            return None
            
        return {
            'current_stock_price': float(current_price),
            'shares_outstanding': float(shares_outstanding)
        }
        
    except Exception as e:
        print(f"Error fetching stock info for {ticker}: {e}")
        return None

def fetch_current_year_data(ticker: str, api_key: str) -> Optional[Dict[str, float]]:
    """
    Fetch current year financial data from FMP API.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        api_key: FMP API key
    
    Returns:
        Dictionary with current year revenue and net income, or None if error
    """
    try:
        # FMP API endpoint for analyst estimates
        url = "https://financialmodelingprep.com/stable/analyst-estimates"
        params = {
            "symbol": ticker,
            "period": "annual",
            "page": 0,
            "limit": 10,
            "apikey": api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if not data:
            print(f"No data found for ticker {ticker}")
            return None
        
        # Get current year data
        current_year = datetime.now().year
        current_year_data = None
        
        for record in data:
            if record.get('date'):
                # Extract year from date (format: YYYY-MM-DD)
                record_year = int(record['date'][:4])
                if record_year == current_year:
                    current_year_data = record
                    break
        
        if not current_year_data:
            print(f"No data found for current year {current_year} for ticker {ticker}")
            return None
        
        return {
            'revenue': current_year_data.get('revenueAvg', 0),
            'net_income': current_year_data.get('netIncomeAvg', 0)
        }
        
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return None
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        print(f"Error parsing API response: {e}")
        return None

def calculate_financial_projections(
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
        ticker: Stock ticker symbol (e.g., 'AAPL')
        api_key: FMP API key
        projection_inputs: Dictionary with year as key and projection data as value
            Each year should contain:
            - 'revenue_growth': Revenue growth rate (as decimal, e.g., 0.15 for 15%)
            - 'net_income_growth': Net income growth rate (as decimal)
            - 'net_income_margin': Expected net income margin (as decimal)
            - 'pe_low': Low PE ratio estimate
            - 'pe_high': High PE ratio estimate
        
        shares_outstanding: Optional - Number of shares outstanding (fetched from yfinance if not provided)
        current_stock_price: Optional - Current stock price (fetched from yfinance if not provided)
        current_year_data: Optional - if provided, uses this instead of fetching from API
    
    Returns:
        Dictionary containing projections for each year with calculated metrics
    """
    
    # Fetch current year data if not provided
    if current_year_data is None:
        current_year_data = fetch_current_year_data(ticker, api_key)
        if current_year_data is None:
            return {
                'error': f'Failed to fetch current year data for {ticker}',
                'ticker': ticker
            }
    
    # Fetch stock info if not provided
    if shares_outstanding is None or current_stock_price is None:
        stock_info = fetch_stock_info(ticker)
        if stock_info is None:
            return {
                'error': f'Failed to fetch stock info for {ticker}',
                'ticker': ticker
            }
        
        if shares_outstanding is None:
            shares_outstanding = stock_info['shares_outstanding']
        if current_stock_price is None:
            current_stock_price = stock_info['current_stock_price']
    
    current_year = datetime.now().year
    projections = {}
    
    # Validate projection years (should be current year + 1 to current year + 4)
    valid_years = list(range(current_year + 1, current_year + 5))
    
    # Initialize starting values
    prev_revenue = current_year_data['revenue']
    prev_net_income = current_year_data['net_income']
    
    for year in valid_years:
        if year not in projection_inputs:
            continue
            
        inputs = projection_inputs[year]
        
        # Calculate projected revenue
        revenue_growth = inputs['revenue_growth']
        projected_revenue = prev_revenue * (1 + revenue_growth)
        
        # Calculate projected net income (using growth rate)
        net_income_growth = inputs['net_income_growth']
        projected_net_income = prev_net_income * (1 + net_income_growth)
        
        # Alternative: Calculate net income using margin (optional validation)
        net_income_margin = inputs.get('net_income_margin')
        if net_income_margin:
            projected_net_income_by_margin = projected_revenue * net_income_margin
            # You could choose to use this instead or as a validation check
        
        # Calculate EPS
        eps = projected_net_income / shares_outstanding
        
        # Calculate stock price estimates using PE ratios
        pe_low = inputs['pe_low']
        pe_high = inputs['pe_high']
        
        stock_price_low = eps * pe_low
        stock_price_high = eps * pe_high
        
        # Calculate CAGR (Compound Annual Growth Rate) from current year
        years_from_current = year - current_year
        cagr_low = ((stock_price_low / current_stock_price) ** (1/years_from_current)) - 1
        cagr_high = ((stock_price_high / current_stock_price) ** (1/years_from_current)) - 1
        
        # Store projections for this year
        projections[year] = {
            'revenue': round(projected_revenue, 2),
            'net_income': round(projected_net_income, 2),
            'eps': round(eps, 2),
            'stock_price_low': round(stock_price_low, 2),
            'stock_price_high': round(stock_price_high, 2),
            'cagr_low': round(cagr_low * 100, 2),  # Convert to percentage
            'cagr_high': round(cagr_high * 100, 2),  # Convert to percentage
            'revenue_growth_rate': round(revenue_growth * 100, 2),
            'net_income_growth_rate': round(net_income_growth * 100, 2),
            'net_income_margin': round((projected_net_income / projected_revenue) * 100, 2)
        }
        
        # Update previous values for next iteration
        prev_revenue = projected_revenue
        prev_net_income = projected_net_income
    
    return {
        'ticker': ticker,
        'current_year': current_year,
        'base_data': {
            'revenue': current_year_data['revenue'],
            'net_income': current_year_data['net_income'],
            'stock_price': current_stock_price,
            'shares_outstanding': shares_outstanding
        },
        'projections': projections,
        'summary': {
            'projection_years': list(projections.keys()),
            'total_years_projected': len(projections)
        }
    }

# Example usage and helper function for API integration
def validate_projection_inputs(projection_inputs: Dict[int, Dict[str, float]]) -> List[str]:
    """
    Validate the projection inputs and return any error messages.
    
    Args:
        projection_inputs: The projection inputs dictionary
    
    Returns:
        List of error messages (empty if no errors)
    """
    errors = []
    current_year = datetime.now().year
    valid_years = set(range(current_year + 1, current_year + 5))
    
    for year, inputs in projection_inputs.items():
        if year not in valid_years:
            errors.append(f"Invalid year {year}. Must be between {current_year + 1} and {current_year + 4}")
        
        required_fields = ['revenue_growth', 'net_income_growth', 'pe_low', 'pe_high']
        for field in required_fields:
            if field not in inputs:
                errors.append(f"Missing required field '{field}' for year {year}")
            elif not isinstance(inputs[field], (int, float)):
                errors.append(f"Field '{field}' for year {year} must be a number")
        
        # Validate PE ratios are positive
        if 'pe_low' in inputs and inputs['pe_low'] <= 0:
            errors.append(f"PE low for year {year} must be positive")
        if 'pe_high' in inputs and inputs['pe_high'] <= 0:
            errors.append(f"PE high for year {year} must be positive")
        if 'pe_low' in inputs and 'pe_high' in inputs and inputs['pe_low'] > inputs['pe_high']:
            errors.append(f"PE low must be less than or equal to PE high for year {year}")
    
    return errors

# Example usage
if __name__ == "__main__":
    # You'll need to set your FMP API key
    API_KEY = "kFoyQBTilV6J4OIfCd9RdhTeTb8CeK5B"
    
    # Projection inputs for 2026-2029 (assuming current year is 2025)
    projections_input = {
        2026: {
            'revenue_growth': 0.15,      # 15% growth
            'net_income_growth': 0.20,   # 20% growth
            'net_income_margin': 0.12,   # 12% margin
            'pe_low': 15,
            'pe_high': 25
        },
        2027: {
            'revenue_growth': 0.12,
            'net_income_growth': 0.15,
            'net_income_margin': 0.13,
            'pe_low': 16,
            'pe_high': 26
        },
        2028: {
            'revenue_growth': 0.10,
            'net_income_growth': 0.12,
            'net_income_margin': 0.14,
            'pe_low': 17,
            'pe_high': 27
        },
        2029: {
            'revenue_growth': 0.08,
            'net_income_growth': 0.10,
            'net_income_margin': 0.15,
            'pe_low': 18,
            'pe_high': 28
        }
    }
    
    # Validate inputs
    errors = validate_projection_inputs(projections_input)
    if errors:
        print("Validation errors:")
        for error in errors:
            print(f"- {error}")
    else:
        # Calculate projections for AAPL
        result = calculate_financial_projections(
            ticker="AAPL",
            api_key=API_KEY,
            projection_inputs=projections_input
            # shares_outstanding and current_stock_price will be fetched automatically
        )
        
        if 'error' in result:
            print(f"Error: {result['error']}")
        else:
            print(f"Financial Projections for {result['ticker']}:")
            print(f"Base Year ({result['current_year']}):")
            print(f"  Revenue: ${result['base_data']['revenue']:,.0f}")
            print(f"  Net Income: ${result['base_data']['net_income']:,.0f}")
            print(f"  Stock Price: ${result['base_data']['stock_price']}")
            print()
            
            for year, data in result['projections'].items():
                print(f"Year {year}:")
                print(f"  Revenue: ${data['revenue']:,.0f} ({data['revenue_growth_rate']}% growth)")
                print(f"  Net Income: ${data['net_income']:,.0f} ({data['net_income_growth_rate']}% growth)")
                print(f"  EPS: ${data['eps']}")
                print(f"  Stock Price Range: ${data['stock_price_low']} - ${data['stock_price_high']}")
                print(f"  CAGR Range: {data['cagr_low']}% - {data['cagr_high']}%")
                print()