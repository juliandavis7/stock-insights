#!/usr/bin/env python3
"""
Simple script to compare YFinance metrics with FMP API calculated metrics.

Usage:
    python stock-info.py <ticker>
    
Example:
    python stock-info.py CRM
    python stock-info.py AAPL
    python stock-info.py GOOG
"""

import sys
import yfinance as yf
import requests
import os
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env')

# Get FMP API key
FMP_API_KEY = os.getenv("FMP_API_KEY")
if not FMP_API_KEY:
    print("❌ FMP_API_KEY environment variable is required. Please set it in .env file.")
    sys.exit(1)

def format_number(value, decimals=2):
    """Format a number for display."""
    if value is None:
        return "N/A"
    if isinstance(value, str):
        return value
    if isinstance(value, float):
        if abs(value) >= 1e9:
            return f"${value/1e9:.{decimals}f}B"
        elif abs(value) >= 1e6:
            return f"${value/1e6:.{decimals}f}M"
        elif abs(value) >= 1e3:
            return f"${value/1e3:.{decimals}f}K"
        else:
            return f"${value:.{decimals}f}"
    return str(value)

def format_percentage(value, decimals=2):
    """Format a percentage for display."""
    if value is None:
        return "N/A"
    if isinstance(value, str):
        return value
    return f"{value:.{decimals}f}%"

def format_ratio(value, decimals=2):
    """Format a ratio for display."""
    if value is None:
        return "N/A"
    if isinstance(value, str):
        return value
    return f"{value:.{decimals}f}"

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_comparison_metric(label, yf_value, calc_value, formatter=format_ratio):
    """Print a metric comparison side by side."""
    yf_formatted = formatter(yf_value)
    calc_formatted = formatter(calc_value)
    
    # Add color coding for differences
    if yf_value is not None and calc_value is not None:
        diff = abs(yf_value - calc_value)
        if diff > 0.01:  # Significant difference
            status = "⚠️  DIFF"
        else:
            status = "✅ MATCH"
    else:
        status = "❓ MISSING"
    
    print(f"{label:<25}: YF: {yf_formatted:<12} | FMP: {calc_formatted:<12} | {status}")

def get_stock_info(ticker):
    """Fetch comprehensive stock information from Yahoo Finance."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        if not info:
            print(f"No stock info available for {ticker}")
            return None
            
        # Extract key metrics (same as yfinance_service)
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
        
        # Add basic info
        result = {
            'ticker': ticker.upper(),
            'company_name': info.get('longName', 'Unknown'),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            **extracted_metrics
        }
        
        return result
        
    except Exception as e:
        print(f"Error fetching stock info for {ticker}: {e}")
        return None

def fetch_fmp_quarterly_data(ticker):
    """Fetch quarterly income statement data from FMP API."""
    try:
        url = f"https://financialmodelingprep.com/api/v3/income-statement/{ticker}"
        params = {
            'period': 'quarter',
            'limit': 8,  # Get last 8 quarters
            'apikey': FMP_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            print(f"No quarterly data available for {ticker}")
            return None
        
        print(f"✅ Fetched {len(data)} quarters of data from FMP API")
        return data
        
    except Exception as e:
        print(f"Error fetching FMP quarterly data for {ticker}: {e}")
        return None

def calculate_ttm_metrics_from_fmp_data(fmp_data, current_price, market_cap):
    """Calculate TTM metrics from FMP quarterly data."""
    if not fmp_data or len(fmp_data) < 4:
        return {}
    
    # Get the last 4 quarters for current TTM
    current_ttm_quarters = fmp_data[:4]
    
    # Sum up the last 4 quarters for current TTM values
    current_ttm_revenue = sum(q.get('revenue', 0) for q in current_ttm_quarters if q.get('revenue') is not None)
    current_ttm_cost_of_revenue = sum(q.get('costOfRevenue', 0) for q in current_ttm_quarters if q.get('costOfRevenue') is not None)
    current_ttm_net_income = sum(q.get('netIncome', 0) for q in current_ttm_quarters if q.get('netIncome') is not None)
    current_ttm_eps = sum(q.get('eps', 0) for q in current_ttm_quarters if q.get('eps') is not None)
    
    calculated_metrics = {}
    
    # Calculate TTM EPS Growth (compare current TTM vs previous TTM)
    if len(fmp_data) >= 8:
        # Get the previous 4 quarters for previous TTM
        previous_ttm_quarters = fmp_data[4:8]
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
    
    # Store TTM values for debugging
    calculated_metrics['_debug_current_ttm_revenue'] = current_ttm_revenue
    calculated_metrics['_debug_current_ttm_eps'] = current_ttm_eps
    calculated_metrics['_debug_current_ttm_net_income'] = current_ttm_net_income
    
    return calculated_metrics

def main():
    if len(sys.argv) != 2:
        print("Usage: python stock-info.py <ticker>")
        print("Example: python stock-info.py CRM")
        sys.exit(1)
    
    ticker = sys.argv[1].upper()
    
    print(f"Fetching stock information for {ticker}...")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Fetch YFinance stock info
        stock_info = get_stock_info(ticker)
        if not stock_info:
            print(f"❌ Failed to fetch stock information for {ticker}")
            sys.exit(1)
        
        # Fetch FMP quarterly data
        fmp_data = fetch_fmp_quarterly_data(ticker)
        if not fmp_data:
            print(f"❌ Failed to fetch FMP quarterly data for {ticker}")
            sys.exit(1)
        
        # Calculate TTM metrics from FMP data
        calculated_metrics = calculate_ttm_metrics_from_fmp_data(
            fmp_data,
            stock_info.get('current_price'),
            stock_info.get('market_cap')
        )
        
        # METRICS COMPARISON SECTION
        print_section("METRICS COMPARISON: YFINANCE vs FMP CALCULATED")
        
        print("Comparing YFinance values with FMP calculated TTM values:")
        print()
        
        # Compare each metric
        print_comparison_metric(
            "TTM PE", 
            stock_info.get('trailing_pe'), 
            calculated_metrics.get('ttm_pe')
        )
        
        print_comparison_metric(
            "TTM EPS Growth", 
            stock_info.get('earnings_growth'), 
            calculated_metrics.get('ttm_eps_growth'),
            format_percentage
        )
        
        print_comparison_metric(
            "TTM Revenue Growth", 
            stock_info.get('revenue_growth'), 
            calculated_metrics.get('ttm_revenue_growth'),
            format_percentage
        )
        
        print_comparison_metric(
            "Gross Margin", 
            stock_info.get('gross_margins'), 
            calculated_metrics.get('gross_margin'),
            format_percentage
        )
        
        print_comparison_metric(
            "Net Margin", 
            stock_info.get('profit_margins'), 
            calculated_metrics.get('net_margin'),
            format_percentage
        )
        
        print_comparison_metric(
            "TTM P/S Ratio", 
            stock_info.get('price_to_sales_ttm'), 
            calculated_metrics.get('ttm_ps_ratio')
        )
        
        # Show TTM values for debugging
        print(f"\n📊 FMP TTM VALUES (Sum of Last 4 Quarters):")
        print(f"   TTM Revenue: {format_number(calculated_metrics.get('_debug_current_ttm_revenue'))}")
        print(f"   TTM EPS: {format_ratio(calculated_metrics.get('_debug_current_ttm_eps'))}")
        print(f"   TTM Net Income: {format_number(calculated_metrics.get('_debug_current_ttm_net_income'))}")
        
        # Show quarterly breakdown
        if len(fmp_data) >= 4:
            print(f"\n📈 FMP QUARTERLY BREAKDOWN (Last 4 Quarters):")
            for i, quarter in enumerate(fmp_data[:4]):
                date = quarter.get('date', 'N/A')
                revenue = quarter.get('revenue', 0)
                eps = quarter.get('eps', 0)
                net_income = quarter.get('netIncome', 0)
                print(f"   {date}: Revenue={format_number(revenue)}, EPS={format_ratio(eps)}, Net Income={format_number(net_income)}")
        
        print_section("SUMMARY")
        print(f"✅ Successfully compared metrics for {ticker}")
        print(f"📊 YFinance vs FMP comparison completed")
        
    except Exception as e:
        print(f"❌ Error processing data for {ticker}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()