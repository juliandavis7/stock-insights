import yfinance as yf
from typing import Dict, Optional
import pandas as pd

def fetch_stock_metrics(ticker: str) -> Optional[Dict[str, float]]:
    """
    Fetch key stock metrics using yfinance.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
    
    Returns:
        Dictionary with stock metrics or None if error
    """
    try:
        stock = yf.Ticker(ticker)
        
        # Get stock info (contains price and shares data)
        info = stock.info
        
        # Get financial data (contains revenue and net income)
        financials = stock.financials  # Annual financials
        
        # Fetch current stock price
        current_price = (
            info.get('currentPrice') or 
            info.get('regularMarketPrice') or 
            info.get('previousClose') or
            info.get('ask') or
            info.get('bid')
        )
        
        # Fetch shares outstanding
        shares_outstanding = (
            info.get('sharesOutstanding') or 
            info.get('impliedSharesOutstanding') or 
            info.get('floatShares')
        )
        
        # Fetch revenue (Total Revenue is the most recent year, first column)
        revenue = None
        if not financials.empty and 'Total Revenue' in financials.index:
            revenue = financials.loc['Total Revenue'].iloc[0]  # Most recent year
        
        # Fetch net income (Net Income is the most recent year, first column)
        net_income = None
        if not financials.empty and 'Net Income' in financials.index:
            net_income = financials.loc['Net Income'].iloc[0]  # Most recent year
        
        # Alternative: Try different field names for net income
        if net_income is None and not financials.empty:
            for field in ['Net Income Common Stockholders', 'Net Income Continuous Operations']:
                if field in financials.index:
                    net_income = financials.loc[field].iloc[0]
                    break
        
        return {
            'ticker': ticker,
            'current_price': float(current_price) if current_price else None,
            'revenue_current_year': float(revenue) if revenue and pd.notna(revenue) else None,
            'net_income_current_year': float(net_income) if net_income and pd.notna(net_income) else None,
            'shares_outstanding': float(shares_outstanding) if shares_outstanding else None,
            'data_date': financials.columns[0] if not financials.empty else None  # Date of financial data
        }
        
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

def print_stock_metrics(ticker: str):
    """
    Fetch and print stock metrics in a formatted way.
    
    Args:
        ticker: Stock ticker symbol
    """
    print(f"\nFetching data for {ticker}...")
    print("-" * 50)
    
    metrics = fetch_stock_metrics(ticker)
    
    if metrics is None:
        print("❌ Failed to fetch data")
        return
    
    print(f"📊 Stock Metrics for {metrics['ticker']}:")
    print(f"   Financial Data Date: {metrics['data_date']}")
    print()
    
    # Current Price
    if metrics['current_price']:
        print(f"💰 Current Stock Price: ${metrics['current_price']:,.2f}")
    else:
        print("💰 Current Stock Price: ❌ Not Available")
    
    # Revenue
    if metrics['revenue_current_year']:
        revenue_billions = metrics['revenue_current_year'] / 1_000_000_000
        print(f"📈 Revenue (Current Year): ${revenue_billions:,.2f}B (${metrics['revenue_current_year']:,.0f})")
    else:
        print("📈 Revenue (Current Year): ❌ Not Available")
    
    # Net Income
    if metrics['net_income_current_year']:
        net_income_billions = metrics['net_income_current_year'] / 1_000_000_000
        print(f"💵 Net Income (Current Year): ${net_income_billions:,.2f}B (${metrics['net_income_current_year']:,.0f})")
    else:
        print("💵 Net Income (Current Year): ❌ Not Available")
    
    # Shares Outstanding
    if metrics['shares_outstanding']:
        shares_billions = metrics['shares_outstanding'] / 1_000_000_000
        print(f"🏢 Shares Outstanding: {shares_billions:,.2f}B ({metrics['shares_outstanding']:,.0f})")
    else:
        print("🏢 Shares Outstanding: ❌ Not Available")
    
    # Calculate market cap if we have both price and shares
    if metrics['current_price'] and metrics['shares_outstanding']:
        market_cap = metrics['current_price'] * metrics['shares_outstanding']
        market_cap_billions = market_cap / 1_000_000_000
        print(f"🏦 Market Cap: ${market_cap_billions:,.2f}B")

def main():
    """
    Main method to fetch and display metrics for PYPL.
    """
    print("🔍 Fetching PayPal (PYPL) Stock Metrics")
    print("=" * 60)
    
    try:
        print_stock_metrics("PYPL")
        
        # Also show raw data
        print("\n" + "-" * 60)
        print("📋 Raw Data for PYPL:")
        print("-" * 60)
        
        pypl_data = fetch_stock_metrics("PYPL")
        if pypl_data:
            for key, value in pypl_data.items():
                if value is not None:
                    if isinstance(value, float) and key != 'current_price':
                        print(f"{key}: {value:,.0f}")
                    else:
                        print(f"{key}: {value}")
                else:
                    print(f"{key}: Not Available")
        else:
            print("❌ Failed to fetch PYPL data")
            
    except Exception as e:
        print(f"❌ Error fetching PYPL data: {e}")

# Example usage
if __name__ == "__main__":
    # Run main method for PYPL
    main()
    
    print("\n" + "="*80)
    print("🔄 Additional Examples (Multiple Stocks):")
    print("="*80)
    
    # Test with multiple stocks
    tickers = ["PYPL"]
    
    for ticker in tickers:
        try:
            print_stock_metrics(ticker)
            print()
        except KeyboardInterrupt:
            print("\n⏹️  Stopped by user")
            break
        except Exception as e:
            print(f"❌ Error processing {ticker}: {e}")
            continue
    
    print("✅ Done!")