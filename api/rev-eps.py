import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv('.env')

# Get FMP API key from environment
FMP_API_KEY = os.getenv("FMP_API_KEY")
if not FMP_API_KEY:
    raise ValueError("FMP_API_KEY environment variable is required. Please set it in .env file.")

def get_current_year_and_quarter():
    """
    Returns the current year and quarter
    """
    now = datetime.now()
    current_year = now.year
    current_quarter = ((now.month - 1) // 3) + 1
    
    return current_year, current_quarter

def date_to_quarter(date_str):
    """
    Convert date string to quarter format using standard calendar quarters
    Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
    """
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.year
        month = date_obj.month
        
        if month <= 3:  # Jan-Mar
            quarter = "Q1"
        elif month <= 6:  # Apr-Jun
            quarter = "Q2"
        elif month <= 9:  # Jul-Sep
            quarter = "Q3"
        else:  # Oct-Dec
            quarter = "Q4"
            
        return f"{year} {quarter}"
    except:
        return None

def calculate_ttm_estimates(data, index):
    """
    Calculate TTM (Trailing Twelve Months) estimates for revenue and EPS
    Uses the current quarter + 3 previous quarters
    """
    if index < 3:  # Not enough data for TTM
        return None, None
    
    # Get 4 quarters of data (current + 3 previous)
    ttm_quarters = data[index-3:index+1]
    
    # Sum up the revenue values (using average estimates)
    ttm_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in ttm_quarters)
    
    # For EPS, we need to sum the total earnings and then divide by shares
    # Since we don't have shares outstanding in estimates, we'll sum EPS * implied shares
    # First, let's calculate implied shares from revenue and EPS for each quarter
    ttm_total_earnings = 0
    valid_quarters = 0
    
    for q in ttm_quarters:
        eps_avg = q.get('estimatedEpsAvg', 0)
        revenue_avg = q.get('estimatedRevenueAvg', 0)
        
        if eps_avg > 0 and revenue_avg > 0:
            # For simplicity, we'll sum the EPS values directly
            # This is an approximation since share count can change
            ttm_total_earnings += eps_avg
            valid_quarters += 1
    
    # Calculate TTM EPS as sum of quarterly EPS
    ttm_eps = ttm_total_earnings if valid_quarters == 4 else None
    
    # Convert revenue to billions for consistency
    ttm_revenue_billions = round(ttm_revenue / 1e9, 2) if ttm_revenue > 0 else 0
    ttm_eps_rounded = round(ttm_eps, 2) if ttm_eps is not None else None
    
    return ttm_revenue_billions, ttm_eps_rounded

def fetch_estimates_data(ticker, years_back=2, mode='quarterly'):
    """
    Fetch estimates data for revenue and EPS
    
    Args:
        ticker: Stock ticker symbol
        years_back: Number of years back from current year to fetch data
        mode: 'quarterly' for quarterly data, 'ttm' for trailing twelve months data
    
    Returns quarters, revenue, and eps
    """
    current_year, current_quarter = get_current_year_and_quarter()
    cutoff_year = current_year - years_back
    
    if mode not in ['quarterly', 'ttm']:
        raise ValueError("Mode must be either 'quarterly' or 'ttm'")
    
    try:
        # API call for estimates
        url = f"https://financialmodelingprep.com/api/v3/analyst-estimates/{ticker}"
        params = {
            'period': 'quarter',
            'apikey': FMP_API_KEY
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if not data:
            return {
                'error': 'No data returned from API',
                'ticker': ticker,
                'mode': mode,
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
                # Extract year from date
                try:
                    year_value = int(estimate['date'][:4])
                except:
                    continue
                
                # Only include data from cutoff_year onwards
                if year_value >= cutoff_year:
                    quarter_label = date_to_quarter(estimate['date'])
                    
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
                
                # Convert revenue to billions
                revenue_billions = round(revenue_avg / 1e9, 2) if revenue_avg > 0 else 0
                eps_rounded = round(eps_avg, 2) if eps_avg > 0 else 0
                
                quarters.append(quarter_label)
                revenue.append(revenue_billions)
                eps.append(eps_rounded)
                
            elif mode == 'ttm':
                # Calculate TTM estimates
                ttm_revenue, ttm_eps = calculate_ttm_estimates(filtered_data, i)
                
                if ttm_revenue is not None and ttm_eps is not None:  # Only include if we have enough data for TTM
                    quarters.append(quarter_label)
                    revenue.append(ttm_revenue)
                    eps.append(ttm_eps)
        
        return {
            'ticker': ticker,
            'mode': mode,
            'quarters': quarters,
            'revenue': revenue,
            'eps': eps
        }
        
    except requests.RequestException as e:
        return {
            'error': f'API request failed: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'revenue': [],
            'eps': []
        }
    except Exception as e:
        return {
            'error': f'Processing error: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'revenue': [],
            'eps': []
        }

def fetch_combined_estimates_data(ticker, years_back=2, mode='quarterly'):
    """
    Fetch both estimates data (revenue, EPS) and combine with any additional metrics
    This is the main function to use for getting estimates data
    """
    return fetch_estimates_data(ticker, years_back, mode)

# Test the function
if __name__ == "__main__":
    ticker = "AAPL"
    
    print("=== ESTIMATES - QUARTERLY MODE ===")
    quarterly_result = fetch_estimates_data(ticker, mode='quarterly')
    if 'error' not in quarterly_result:
        print(json.dumps(quarterly_result, indent=2))
    else:
        print(json.dumps({'error': quarterly_result['error']}, indent=2))
    
    print("\n=== ESTIMATES - TTM MODE ===")
    ttm_result = fetch_estimates_data(ticker, mode='ttm')
    if 'error' not in ttm_result:
        print(json.dumps(ttm_result, indent=2))
    else:
        print(json.dumps({'error': ttm_result['error']}, indent=2))