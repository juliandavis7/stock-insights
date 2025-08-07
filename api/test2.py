import requests
import json
from datetime import datetime

# Your FMP API key
FMP_API_KEY = "kFoyQBTilV6J4OIfCd9RdhTeTb8CeK5B"

def date_to_quarter(date_str):
    """
    Convert date string to quarter format (e.g., "2025-03-28" -> "2025 Q1")
    Using standard calendar quarters: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
    """
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.year
        month = date_obj.month
        
        # Standard calendar quarters
        # Q1: Jan-Mar (1-3)
        # Q2: Apr-Jun (4-6)
        # Q3: Jul-Sep (7-9)
        # Q4: Oct-Dec (10-12)
        
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

def get_cutoff_year():
    """
    Get the cutoff year (2 years prior to current year)
    """
    current_year = datetime.now().year
    return current_year - 2

def fetch_analyst_estimates_data(ticker):
    """
    Fetch analyst estimates and format as requested JSON structure
    Only includes data from 2 years prior to current year onwards
    """
    cutoff_year = get_cutoff_year()
    current_year = datetime.now().year
    
    try:
        # API call to analyst estimates endpoint
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
                'quarters': [],
                'revenue': [],
                'eps': []
            }
        
        quarters = []
        revenue = []
        eps = []
        
        # Sort data by date (oldest to newest for chronological order)
        sorted_data = sorted(data, key=lambda x: x['date'])
        
        for estimate in sorted_data:
            try:
                # Get the year from the date
                estimate_year = int(estimate['date'][:4])
                
                # Only include data from cutoff_year onwards
                if estimate_year >= cutoff_year:
                    # Convert date to quarter format
                    quarter_label = date_to_quarter(estimate['date'])
                    
                    if quarter_label:
                        # Get estimated revenue (convert to billions for readability)
                        estimated_revenue = estimate.get('estimatedRevenueAvg', 0)
                        revenue_billions = round(estimated_revenue / 1_000_000_000, 2) if estimated_revenue else 0
                        
                        # Get estimated EPS
                        estimated_eps = estimate.get('estimatedEpsAvg', 0)
                        
                        # Add to lists
                        quarters.append(quarter_label)
                        revenue.append(revenue_billions)
                        eps.append(estimated_eps)
                    
            except Exception as e:
                continue
        
        return {
            'ticker': ticker,
            'quarters': quarters,
            'revenue': revenue,
            'eps': eps,
            'data_points': len(quarters),
            'cutoff_year': cutoff_year,
            'current_year': current_year,
            'timestamp': datetime.now().isoformat()
        }
        
    except requests.RequestException as e:
        return {
            'error': f'API request failed: {str(e)}',
            'ticker': ticker,
            'quarters': [],
            'revenue': [],
            'eps': []
        }
    except Exception as e:
        return {
            'error': f'Processing error: {str(e)}',
            'ticker': ticker,
            'quarters': [],
            'revenue': [],
            'eps': []
        }

# Test the function
if __name__ == "__main__":
    # Test with AAPL only
    ticker = "AAPL"
    
    result = fetch_analyst_estimates_data(ticker)
    
    if 'error' not in result:
        # Create clean output matching your requested format
        clean_output = {
            'ticker': result['ticker'],
            'quarters': result['quarters'],
            'revenue': result['revenue'],
            'eps': result['eps']
        }
        print(json.dumps(clean_output, indent=2))
        
    else:
        print(json.dumps({'error': result['error']}, indent=2))