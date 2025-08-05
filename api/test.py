import yfinance as yf
import pandas as pd

def get_sga_three_years(ticker):
    """Get SG&A for 2022-2024"""
    
    try:
        stock = yf.Ticker(ticker)
        financials = stock.financials
        
        # The correct field name (without the final 'e')
        sga_field = 'Selling General And Administration'
        
        print(f"=== SG&A for {ticker} (2022-2024) ===")
        
        if sga_field in financials.index:
            print(f"Field found: '{sga_field}'\n")
            
            # Get SG&A values for each year
            sga_data = []
            for year_col in financials.columns[:3]:  # Last 3 years
                year = year_col.year
                value = financials.loc[sga_field, year_col]
                
                if pd.notna(value):
                    sga_data.append({
                        'year': year,
                        'sga': int(value)
                    })
                    print(f"{year}: ${value:,.0f}")
                else:
                    print(f"{year}: No data")
            
            # Return as structured data
            return sga_data
            
        else:
            print(f"Field '{sga_field}' not found!")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test with different tickers
if __name__ == "__main__":
    tickers = ["AAPL", "PYPL", "MSFT"]  # Add more tickers here
    
    for ticker in tickers:
        data = get_sga_three_years(ticker)
        print()  # Empty line between tickers