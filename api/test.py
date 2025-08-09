import requests
import json
from datetime import datetime

# Your FMP API key
FMP_API_KEY = "kFoyQBTilV6J4OIfCd9RdhTeTb8CeK5B"

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

def fetch_quarterly_data(ticker, years_back=2):
    """
    Fetch quarterly data for the last N years (default: 2 years back from current year)
    Returns quarters, gross_margin, net_margin, and operating_income only
    """
    current_year, current_quarter = get_current_year_and_quarter()
    cutoff_year = current_year - years_back
    
    try:
        # API call using stable endpoint
        url = f"https://financialmodelingprep.com/stable/income-statement"
        params = {
            'symbol': ticker,
            'period': 'quarter',
            'limit': 20,
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
                'gross_margin': [],
                'net_margin': [],
                'operating_income': []
            }
        
        quarters = []
        gross_margin = []
        net_margin = []
        operating_income = []
        
        # Process data and filter by year (reverse to get chronological order - oldest to newest)
        for quarter in reversed(data):
            # Check what fields are available and try different field names
            if quarter.get('revenue'):
                # Try different year field names
                year_value = None
                if 'calendarYear' in quarter:
                    year_value = int(quarter['calendarYear'])
                elif 'fiscalYear' in quarter:
                    year_value = int(quarter['fiscalYear'])
                elif 'date' in quarter:
                    # Extract year from date
                    try:
                        year_value = int(quarter['date'][:4])
                    except:
                        continue
                else:
                    continue
                
                # Only include data from cutoff_year onwards (strict >= cutoff_year)
                if year_value >= cutoff_year:
                    # Try to get date for quarter conversion
                    quarter_label = None
                    if 'date' in quarter:
                        quarter_label = date_to_quarter(quarter['date'])
                    elif 'period' in quarter and year_value:
                        # Fallback to period field if available
                        quarter_label = f"{year_value} {quarter['period']}"
                    
                    if quarter_label:
                        # Additional check: if quarter_label year is still >= cutoff_year
                        quarter_year = int(quarter_label.split()[0])
                        if quarter_year >= cutoff_year:
                            # Calculate margins (as percentages)
                            gross_profit = quarter.get('grossProfit', 0)
                            net_income_value = quarter.get('netIncome', 0)
                            revenue_raw = quarter.get('revenue', 0)
                            
                            gross_margin_pct = round((gross_profit / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                            net_margin_pct = round((net_income_value / revenue_raw) * 100, 2) if revenue_raw > 0 else 0
                            
                            # Get operating income in billions
                            operating_income_value = round(quarter.get('operatingIncome', 0) / 1e9, 2)
                            
                            # Add to lists
                            quarters.append(quarter_label)
                            gross_margin.append(gross_margin_pct)
                            net_margin.append(net_margin_pct)
                            operating_income.append(operating_income_value)
        
        return {
            'ticker': ticker,
            'quarters': quarters,
            'gross_margin': gross_margin,
            'net_margin': net_margin,
            'operating_income': operating_income
        }
        
    except requests.RequestException as e:
        return {
            'error': f'API request failed: {str(e)}',
            'ticker': ticker,
            'quarters': [],
            'gross_margin': [],
            'net_margin': [],
            'operating_income': []
        }
    except Exception as e:
        return {
            'error': f'Processing error: {str(e)}',
            'ticker': ticker,
            'quarters': [],
            'gross_margin': [],
            'net_margin': [],
            'operating_income': []
        }

# Test the function
if __name__ == "__main__":
    ticker = "AAPL"
    result = fetch_quarterly_data(ticker)
    
    if 'error' not in result:
        print(json.dumps(result, indent=2))
    else:
        print(json.dumps({'error': result['error']}, indent=2))