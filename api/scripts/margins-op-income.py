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

def calculate_ttm_metrics(data, index):
    """
    Calculate TTM (Trailing Twelve Months) metrics for a given quarter
    Uses the current quarter + 3 previous quarters
    """
    if index < 3:  # Not enough data for TTM
        return None, None, None
    
    # Get 4 quarters of data (current + 3 previous)
    ttm_quarters = data[index-3:index+1]
    
    # Sum up the values
    ttm_revenue = sum(q.get('revenue', 0) for q in ttm_quarters)
    ttm_gross_profit = sum(q.get('grossProfit', 0) for q in ttm_quarters)
    ttm_net_income = sum(q.get('netIncome', 0) for q in ttm_quarters)
    ttm_operating_income = sum(q.get('operatingIncome', 0) for q in ttm_quarters)
    
    # Calculate margins
    ttm_gross_margin = round((ttm_gross_profit / ttm_revenue) * 100, 2) if ttm_revenue > 0 else 0
    ttm_net_margin = round((ttm_net_income / ttm_revenue) * 100, 2) if ttm_revenue > 0 else 0
    
    # Operating income in billions
    ttm_operating_income_billions = round(ttm_operating_income / 1e9, 2)
    
    return ttm_gross_margin, ttm_net_margin, ttm_operating_income_billions

def fetch_quarterly_data(ticker, years_back=2, mode='quarterly'):
    """
    Fetch quarterly data for the last N years (default: 2 years back from current year)
    
    Args:
        ticker: Stock ticker symbol
        years_back: Number of years back from current year to fetch data
        mode: 'quarterly' for quarterly data, 'ttm' for trailing twelve months data
    
    Returns quarters, gross_margin, net_margin, and operating_income
    """
    current_year, current_quarter = get_current_year_and_quarter()
    cutoff_year = current_year - years_back
    
    if mode not in ['quarterly', 'ttm']:
        raise ValueError("Mode must be either 'quarterly' or 'ttm'")
    
    try:
        # API call using stable endpoint
        url = f"https://financialmodelingprep.com/stable/income-statement"
        params = {
            'symbol': ticker,
            'period': 'quarter',
            'limit': 40,  # Increased limit to ensure we have enough data for TTM calculations
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
                'gross_margin': [],
                'net_margin': [],
                'operating_income': []
            }
        
        quarters = []
        gross_margin = []
        net_margin = []
        operating_income = []
        
        # Process data and filter by year (reverse to get chronological order - oldest to newest)
        filtered_data = []
        for quarter in reversed(data):
            if quarter.get('revenue'):
                # Try different year field names
                year_value = None
                if 'calendarYear' in quarter:
                    year_value = int(quarter['calendarYear'])
                elif 'fiscalYear' in quarter:
                    year_value = int(quarter['fiscalYear'])
                elif 'date' in quarter:
                    try:
                        year_value = int(quarter['date'][:4])
                    except:
                        continue
                else:
                    continue
                
                # Only include data from cutoff_year onwards
                if year_value >= cutoff_year:
                    quarter_label = None
                    if 'date' in quarter:
                        quarter_label = date_to_quarter(quarter['date'])
                    elif 'period' in quarter and year_value:
                        quarter_label = f"{year_value} {quarter['period']}"
                    
                    if quarter_label:
                        quarter_year = int(quarter_label.split()[0])
                        if quarter_year >= cutoff_year:
                            quarter['quarter_label'] = quarter_label
                            filtered_data.append(quarter)
        
        # Process based on mode
        for i, quarter in enumerate(filtered_data):
            quarter_label = quarter['quarter_label']
            
            if mode == 'quarterly':
                # Calculate quarterly margins
                gross_profit = quarter.get('grossProfit', 0)
                net_income_value = quarter.get('netIncome', 0)
                revenue_raw = quarter.get('revenue', 0)
                
                gross_margin_pct = round((gross_profit / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                net_margin_pct = round((net_income_value / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                operating_income_value = round(quarter.get('operatingIncome', 0) / 1e9, 2)
                
                quarters.append(quarter_label)
                gross_margin.append(gross_margin_pct)
                net_margin.append(net_margin_pct)
                operating_income.append(operating_income_value)
                
            elif mode == 'ttm':
                # Calculate TTM metrics
                ttm_gross_margin, ttm_net_margin, ttm_operating_income = calculate_ttm_metrics(filtered_data, i)
                
                if ttm_gross_margin is not None:  # Only include if we have enough data for TTM
                    quarters.append(quarter_label)
                    gross_margin.append(ttm_gross_margin)
                    net_margin.append(ttm_net_margin)
                    operating_income.append(ttm_operating_income)
        
        return {
            'ticker': ticker,
            'mode': mode,
            'quarters': quarters,
            'gross_margin': gross_margin,
            'net_margin': net_margin,
            'operating_income': operating_income
        }
        
    except requests.RequestException as e:
        return {
            'error': f'API request failed: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'gross_margin': [],
            'net_margin': [],
            'operating_income': []
        }
    except Exception as e:
        return {
            'error': f'Processing error: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'gross_margin': [],
            'net_margin': [],
            'operating_income': []
        }

# Test the function
if __name__ == "__main__":
    ticker = "AAPL"
    
    print("=== QUARTERLY MODE ===")
    quarterly_result = fetch_quarterly_data(ticker, mode='quarterly')
    if 'error' not in quarterly_result:
        print(json.dumps(quarterly_result, indent=2))
    else:
        print(json.dumps({'error': quarterly_result['error']}, indent=2))
    
    print("\n=== TTM MODE ===")
    ttm_result = fetch_quarterly_data(ticker, mode='ttm')
    if 'error' not in ttm_result:
        print(json.dumps(ttm_result, indent=2))
    else:
        print(json.dumps({'error': ttm_result['error']}, indent=2))