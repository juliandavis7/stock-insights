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

def calculate_ttm_cash_flow_metrics(data, index):
    """
    Calculate TTM (Trailing Twelve Months) cash flow metrics for a given quarter
    Uses the current quarter + 3 previous quarters
    """
    if index < 3:  # Not enough data for TTM
        return None, None
    
    # Get 4 quarters of data (current + 3 previous)
    ttm_quarters = data[index-3:index+1]
    
    # Sum up the cash flow values (keep as full integers)
    ttm_operating_cash_flow = sum(q.get('operatingCashFlow', 0) for q in ttm_quarters)
    ttm_free_cash_flow = sum(q.get('freeCashFlow', 0) for q in ttm_quarters)
    
    return ttm_operating_cash_flow, ttm_free_cash_flow

def fetch_cash_flow_data(ticker, years_back=3, mode='quarterly'):
    """
    Fetch cash flow data for the last N years (default: 3 years back from current year to get Q1 2023)
    
    Args:
        ticker: Stock ticker symbol
        years_back: Number of years back from current year to fetch data
        mode: 'quarterly' for quarterly data, 'ttm' for trailing twelve months data
    
    Returns quarters, operating_cash_flow, and free_cash_flow (in full integer values)
    """
    current_year, current_quarter = get_current_year_and_quarter()
    # Set cutoff to 2023 to ensure we get Q1 2023 data
    cutoff_year = 2023
    
    if mode not in ['quarterly', 'ttm']:
        raise ValueError("Mode must be either 'quarterly' or 'ttm'")
    
    try:
        # API call for cash flow statement
        url = f"https://financialmodelingprep.com/api/v3/cash-flow-statement/{ticker}"
        params = {
            'period': 'quarter',
            'limit': 50,  # Increased limit to ensure we get all data back to Q1 2023
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
                'operating_cash_flow': [],
                'free_cash_flow': []
            }
        
        quarters = []
        operating_cash_flow = []
        free_cash_flow = []
        
        # Process data and filter by year (reverse to get chronological order - oldest to newest)
        # We need to go back to Q1 2022 to calculate TTM for Q1 2023
        filtered_data = []
        for quarter in reversed(data):
            if quarter.get('operatingCashFlow') is not None:  # Check for cash flow data
                # Try different year field names
                year_value = None
                if 'fiscalYear' in quarter:
                    year_value = int(quarter['fiscalYear'])
                elif 'date' in quarter:
                    try:
                        year_value = int(quarter['date'][:4])
                    except:
                        continue
                else:
                    continue
                
                # Include data from Q1 2022 onwards to enable TTM calculation for Q1 2023
                if year_value >= 2022:
                    quarter_label = None
                    if 'date' in quarter:
                        quarter_label = date_to_quarter(quarter['date'])
                    elif 'period' in quarter and year_value:
                        quarter_label = f"{year_value} {quarter['period']}"
                    
                    if quarter_label:
                        quarter_year = int(quarter_label.split()[0])
                        quarter_q = quarter_label.split()[1]
                        
                        # Include Q1 2022 onwards for TTM calculations
                        quarter['quarter_label'] = quarter_label
                        quarter['year'] = quarter_year
                        quarter['quarter_period'] = quarter_q
                        filtered_data.append(quarter)
        
        # Process based on mode
        for i, quarter in enumerate(filtered_data):
            quarter_label = quarter['quarter_label']
            quarter_year = quarter['year']
            quarter_q = quarter['quarter_period']
            
            # Only include Q1 2023 onwards in results
            if (quarter_year > 2023) or (quarter_year == 2023 and quarter_q in ['Q1', 'Q2', 'Q3', 'Q4']):
                if mode == 'quarterly':
                    # Get quarterly cash flow values
                    ocf_value = quarter.get('operatingCashFlow', 0)
                    fcf_value = quarter.get('freeCashFlow', 0)
                    
                    # Keep full integer values
                    ocf_value = ocf_value if ocf_value != 0 else 0
                    fcf_value = fcf_value if fcf_value != 0 else 0
                    
                    quarters.append(quarter_label)
                    operating_cash_flow.append(ocf_value)
                    free_cash_flow.append(fcf_value)
                    
                elif mode == 'ttm':
                    # Calculate TTM metrics
                    ttm_operating_cash_flow, ttm_free_cash_flow = calculate_ttm_cash_flow_metrics(filtered_data, i)
                    
                    if ttm_operating_cash_flow is not None:  # Only include if we have enough data for TTM
                        quarters.append(quarter_label)
                        operating_cash_flow.append(ttm_operating_cash_flow)
                        free_cash_flow.append(ttm_free_cash_flow)
        
        return {
            'ticker': ticker,
            'mode': mode,
            'quarters': quarters,
            'operating_cash_flow': operating_cash_flow,
            'free_cash_flow': free_cash_flow
        }
        
    except requests.RequestException as e:
        return {
            'error': f'API request failed: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'operating_cash_flow': [],
            'free_cash_flow': []
        }
    except Exception as e:
        return {
            'error': f'Processing error: {str(e)}',
            'ticker': ticker,
            'mode': mode,
            'quarters': [],
            'operating_cash_flow': [],
            'free_cash_flow': []
        }

# Test the function
if __name__ == "__main__":
    ticker = "AAPL"
    
    print("=== CASH FLOW - QUARTERLY MODE ===")
    quarterly_result = fetch_cash_flow_data(ticker, mode='quarterly')
    if 'error' not in quarterly_result:
        print(json.dumps(quarterly_result, indent=2))
    else:
        print(json.dumps({'error': quarterly_result['error']}, indent=2))
    
    print("\n=== CASH FLOW - TTM MODE ===")
    ttm_result = fetch_cash_flow_data(ticker, mode='ttm')
    if 'error' not in ttm_result:
        print(json.dumps(ttm_result, indent=2))
    else:
        print(json.dumps({'error': ttm_result['error']}, indent=2))