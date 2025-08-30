"""
Combined Revenue & EPS Data Fetcher
Combines historical actuals from income statement with forward estimates from analyst estimates API
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')
FMP_API_KEY = os.getenv("FMP_API_KEY")

if not FMP_API_KEY:
    raise ValueError("FMP_API_KEY environment variable is required")

def date_to_calendar_quarter(date_str: str) -> Optional[str]:
    """Convert date to calendar quarter format (e.g., '2024-03-31' -> '2024 Q1')"""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.year
        month = date_obj.month
        
        if month <= 3:
            quarter = "Q1"
        elif month <= 6:
            quarter = "Q2" 
        elif month <= 9:
            quarter = "Q3"
        else:
            quarter = "Q4"
            
        return f"{year} {quarter}"
    except (ValueError, TypeError):
        return None

def fetch_historical_income_data(ticker: str, cutoff_year: int = 2022) -> Dict[str, Dict[str, float]]:
    """Fetch historical income statement data (actuals) from the stable API."""
    try:
        url = f"https://financialmodelingprep.com/stable/income-statement"
        params = {
            'symbol': ticker,
            'period': 'quarter',
            'limit': 40,
            'apikey': FMP_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return {}
        
        historical_data = {}
        
        for quarter in data:
            quarter_date = quarter.get('date')
            if not quarter_date:
                continue
                
            try:
                date_year = int(quarter_date[:4])
            except:
                continue
            
            if date_year >= cutoff_year:
                quarter_label = date_to_calendar_quarter(quarter_date)
                
                if quarter_label:
                    revenue = quarter.get('revenue', 0)
                    eps_value = quarter.get('eps', 0)
                    
                    historical_data[quarter_label] = {
                        'revenue': revenue,
                        'eps': round(eps_value, 2) if eps_value else 0
                    }
        
        return historical_data
        
    except Exception as e:
        return {}

def fetch_estimates_data(ticker: str, cutoff_year: int = 2022) -> Dict[str, Dict[str, float]]:
    """Fetch analyst estimates data from the analyst estimates API."""
    try:
        url = f"https://financialmodelingprep.com/api/v3/analyst-estimates/{ticker}"
        params = {
            'period': 'quarter',
            'apikey': FMP_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            return {}
        
        estimates_data = {}
        
        for estimate in data:
            estimate_date = estimate.get('date')
            if not estimate_date:
                continue
                
            try:
                date_year = int(estimate_date[:4])
            except:
                continue
            
            if date_year >= cutoff_year:
                quarter_label = date_to_calendar_quarter(estimate_date)
                
                if quarter_label:
                    revenue_est = estimate.get('estimatedRevenueAvg', 0)
                    eps_est = estimate.get('estimatedEpsAvg', 0)
                    
                    estimates_data[quarter_label] = {
                        'revenue': revenue_est,
                        'eps': round(eps_est, 2) if eps_est else 0
                    }
        
        return estimates_data
        
    except Exception as e:
        return {}

def combine_historical_and_estimates(
    historical_data: Dict[str, Dict[str, float]], 
    estimates_data: Dict[str, Dict[str, float]]
) -> Dict[str, Any]:
    """Combine historical actuals with forward estimates."""
    current_year = datetime.now().year
    current_quarter = ((datetime.now().month - 1) // 3) + 1
    
    # Get all unique quarters from both datasets
    all_quarters = set(historical_data.keys()) | set(estimates_data.keys())
    
    # Sort quarters chronologically
    def quarter_sort_key(quarter_label: str) -> tuple:
        try:
            year_str, quarter_str = quarter_label.split()
            year = int(year_str)
            quarter_num = int(quarter_str[1])
            return (year, quarter_num)
        except:
            return (0, 0)
    
    sorted_quarters = sorted(all_quarters, key=quarter_sort_key)
    
    combined_data = {
        'quarters': [],
        'revenue': [],
        'eps': [],
        'data_sources': []
    }
    
    for quarter in sorted_quarters:
        year_str, quarter_str = quarter.split()
        year = int(year_str)
        quarter_num = int(quarter_str[1])
        
        # Determine if this is a past, current, or future quarter
        is_past_or_current = (year < current_year) or (year == current_year and quarter_num <= current_quarter)
        
        revenue = 0
        eps = 0
        source = "unknown"
        
        if is_past_or_current and quarter in historical_data:
            # Use historical actuals for past/current quarters
            revenue = historical_data[quarter]['revenue']
            eps = historical_data[quarter]['eps']
            source = "historical"
            
        elif quarter in estimates_data:
            # Use estimates for future quarters OR if historical data is missing
            revenue = estimates_data[quarter]['revenue']
            eps = estimates_data[quarter]['eps']
            source = "estimate" if not is_past_or_current else "estimate_backfill"
            
        elif quarter in historical_data:
            # Fallback to historical if estimates not available
            revenue = historical_data[quarter]['revenue']
            eps = historical_data[quarter]['eps']
            source = "historical_only"
            
        else:
            # Should not happen but handle gracefully
            continue
        
        combined_data['quarters'].append(quarter)
        combined_data['revenue'].append(revenue)
        combined_data['eps'].append(eps)
        combined_data['data_sources'].append(source)
    
    return combined_data

def convert_to_ttm(quarterly_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert quarterly data to TTM (Trailing Twelve Months)"""
    quarters = quarterly_data['quarters']
    revenue = quarterly_data['revenue']
    eps = quarterly_data['eps']
    sources = quarterly_data['data_sources']
    
    ttm_data = {
        'quarters': [],
        'revenue': [],
        'eps': [],
        'data_sources': []
    }
    
    for i in range(len(quarters)):
        if i < 3:  # Need at least 4 quarters for TTM
            continue
        
        # Get current quarter + 3 previous quarters
        ttm_revenue_values = revenue[i-3:i+1]
        ttm_eps_values = eps[i-3:i+1]
        ttm_sources = sources[i-3:i+1]
        
        # Calculate TTM sums
        ttm_revenue = sum(ttm_revenue_values)
        ttm_eps = round(sum(ttm_eps_values), 2)
        
        # Determine predominant source
        ttm_source = "mixed"
        if all(s.startswith("historical") for s in ttm_sources):
            ttm_source = "historical"
        elif all(s.startswith("estimate") for s in ttm_sources):
            ttm_source = "estimate"
        
        ttm_data['quarters'].append(quarters[i])
        ttm_data['revenue'].append(ttm_revenue)
        ttm_data['eps'].append(ttm_eps)
        ttm_data['data_sources'].append(ttm_source)
    
    return ttm_data

def fetch_combined_revenue_eps_data(ticker: str, mode: str = 'quarterly') -> Optional[Dict[str, Any]]:
    """Main function to fetch combined historical + estimates revenue and EPS data."""
    # Fetch both datasets
    historical_data = fetch_historical_income_data(ticker)
    estimates_data = fetch_estimates_data(ticker)
    
    if not historical_data and not estimates_data:
        return None
    
    # Combine the datasets
    combined_data = combine_historical_and_estimates(historical_data, estimates_data)
    
    if not combined_data['quarters']:
        return None
    
    # Convert to TTM if requested
    if mode == 'ttm':
        combined_data = convert_to_ttm(combined_data)
    
    # Add metadata
    result = {
        'ticker': ticker,
        'mode': mode,
        'quarters': combined_data['quarters'],
        'revenue': combined_data['revenue'],
        'eps': combined_data['eps'],
        'data_sources': combined_data['data_sources'],
        'total_quarters': len(combined_data['quarters'])
    }
    
    return result

# Test the function
if __name__ == "__main__":
    ticker = "AAPL"
    
    quarterly_result = fetch_combined_revenue_eps_data(ticker, mode='quarterly')
    if quarterly_result:
        output = {
            'ticker': quarterly_result['ticker'],
            'quarters': quarterly_result['quarters'],
            'revenue': quarterly_result['revenue'],
            'eps': quarterly_result['eps']
        }
        print(json.dumps(output, indent=2))