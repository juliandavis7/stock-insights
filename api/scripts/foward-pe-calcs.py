import requests
import yfinance as yf
from datetime import datetime
from typing import Dict, List
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class ForwardPECalculator:
    """
    Calculate forward P/E ratios using 7 different methods:
    Method 1: 1-Year Forward P/E Using Quarterly Estimates
    Method 2: 1-Year Forward P/E Using Annual Estimates
    Method 3: 2-Year Forward P/E Using Annual Estimates
    Method 4: 2-Year Forward P/E Using Quarterly Estimates
    Method 5: Forward P/E = Next 12 months of EPS (next 4 quarters) / current price
    Method 6: 2-Year Forward P/E = Next 12-24 months of EPS (quarters 5-8) / current price
    Method 7: Forward P/E from yfinance library
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com"
        
        # Check if we should use mock data
        self.use_mock_data = os.getenv("FMP_SERVER", "True").lower() == "false"
        
        # Mock data mode is configured via FMP_SERVER environment variable
    
    def _load_mock_data(self, endpoint: str, ticker: str) -> List[Dict]:
        """Load mock data from JSON file"""
        try:
            # Construct file path relative to the api directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            api_dir = os.path.dirname(current_dir)  # Go up one level from scripts/ to api/
            file_path = os.path.join(api_dir, "mocks", endpoint, f"{ticker.upper()}.json")
            
            if not os.path.exists(file_path):
                return []
            
            with open(file_path, 'r') as f:
                mock_data = json.load(f)
            
            # Check if there was an error when the data was originally fetched
            if mock_data.get("error"):
                return []
            
            data = mock_data.get("data", [])
            return data
            
        except Exception as e:
            return []

    def fetch_current_stock_price(self, ticker: str) -> float:
        # Use mock data if configured
        if self.use_mock_data:
            mock_data = self._load_mock_data("profile", ticker)
            if mock_data and len(mock_data) > 0:
                price = mock_data[0].get('price', 0)
                return price
            return 0
        
        url = f"{self.base_url}/api/v3/quote/{ticker}"
        params = {'apikey': self.api_key}

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if data:
                return data[0].get('price', 0)
            return 0
        except Exception as e:
            print(f"Error fetching stock price for {ticker}: {e}")
            return 0

    def fetch_quarterly_analyst_estimates(self, ticker: str) -> List[Dict]:
        # Use mock data if configured
        if self.use_mock_data:
            mock_data = self._load_mock_data("analyst-estimates/quarterly", ticker)
            if mock_data is not None:
                return mock_data
            return []
        
        url = f"{self.base_url}/api/v3/analyst-estimates/{ticker}"
        params = {'period': 'quarter', 'apikey': self.api_key}

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching quarterly analyst estimates for {ticker}: {e}")
            return []

    def fetch_annual_analyst_estimates(self, ticker: str) -> List[Dict]:
        # Use mock data if configured
        if self.use_mock_data:
            mock_data = self._load_mock_data("analyst-estimates/annual", ticker)
            if mock_data is not None:
                return mock_data
            return []
        
        url = f"{self.base_url}/api/v3/analyst-estimates/{ticker}"
        params = {'period': 'annual', 'apikey': self.api_key}

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching annual analyst estimates for {ticker}: {e}")
            return []

    def filter_data_by_year(self, data: List[Dict], target_year: int) -> List[Dict]:
        filtered = [item for item in data if int(item['date'].split('-')[0]) == target_year]
        filtered.sort(key=lambda x: x['date'], reverse=True)
        return filtered

    def get_quarterly_estimates_eps(self, ticker: str, target_year: int, num_quarters: int = 4) -> float:
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        year_data = self.filter_data_by_year(estimates_data, target_year)
        quarters = year_data[:num_quarters]
        return sum(q.get('estimatedEpsAvg', 0) for q in quarters)

    def get_annual_estimates_eps(self, ticker: str, target_year: int) -> float:
        estimates_data = self.fetch_annual_analyst_estimates(ticker)
        year_data = self.filter_data_by_year(estimates_data, target_year)
        if year_data:
            return year_data[0].get('estimatedEpsAvg', 0)
        return 0

    def get_1year_forward_eps_quarterly(self, ticker: str, next_year: int) -> float:
        return self.get_quarterly_estimates_eps(ticker, next_year, 4)

    def get_1year_forward_eps_annual(self, ticker: str, next_year: int) -> float:
        return self.get_annual_estimates_eps(ticker, next_year)

    # === FIXED METHODS ===
    def get_2year_forward_eps_annual(self, ticker: str, year_plus_2: int) -> float:
        """2-Year Forward EPS using annual estimates (only year+2 EPS)"""
        return self.get_annual_estimates_eps(ticker, year_plus_2)

    def get_2year_forward_eps_quarterly(self, ticker: str, year_plus_2: int) -> float:
        """2-Year Forward EPS using quarterly estimates (only 4 quarters of year+2)"""
        return self.get_quarterly_estimates_eps(ticker, year_plus_2, 4)

    def get_next_12_months_eps(self, ticker: str, current_year: int) -> float:
        """
        Method 5: Get next 12 months of EPS (next 4 quarters from current date)
        This includes quarters from current year and next year as needed
        """
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        if not estimates_data:
            return 0
        
        # Sort by date (most recent first)
        estimates_data.sort(key=lambda x: x['date'], reverse=True)
        
        # Get the next 4 quarters (quarters 0-3 from the sorted list)
        next_4_quarters = estimates_data[:4]
        
        total_eps = 0
        for quarter in next_4_quarters:
            eps = quarter.get('estimatedEpsAvg', 0)
            if eps:
                total_eps += eps
        
        return total_eps

    def get_next_12_to_24_months_eps(self, ticker: str, current_year: int) -> float:
        """
        Method 6: Get next 12-24 months of EPS (quarters 5-8 from current date)
        This gets quarters 4-7 from the sorted estimates data
        """
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        if not estimates_data:
            return 0
        
        # Sort by date (most recent first)
        estimates_data.sort(key=lambda x: x['date'], reverse=True)
        
        # Get quarters 4-7 (quarters 4-7 from the sorted list)
        if len(estimates_data) >= 8:
            quarters_5_to_8 = estimates_data[4:8]
        else:
            # If not enough quarters, return 0
            return 0
        
        total_eps = 0
        for quarter in quarters_5_to_8:
            eps = quarter.get('estimatedEpsAvg', 0)
            if eps:
                total_eps += eps
        
        return total_eps

    def get_yfinance_forward_pe(self, ticker: str) -> float:
        """
        Method 7: Get forward P/E ratio directly from yfinance library
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Try to get forward PE from yfinance info
            forward_pe = info.get('forwardPE')
            if forward_pe and forward_pe != 'None':
                return float(forward_pe)
            
            # If forwardPE is not available, try to calculate it
            # Get current price and forward EPS
            current_price = info.get('currentPrice')
            forward_eps = info.get('forwardEps')
            
            if current_price and forward_eps and forward_eps != 'None':
                return current_price / float(forward_eps)
            
            return 0
            
        except Exception as e:
            print(f"Error fetching yfinance forward PE for {ticker}: {e}")
            return 0

    def calculate_pe_ratio(self, price: float, eps: float) -> float:
        if eps == 0:
            return 0
        return price / eps

    def calculate_forward_pe_ratios(self, ticker: str, current_year: int = None) -> Dict:
        if current_year is None:
            current_year = datetime.now().year

        year_plus_1 = current_year + 1
        year_plus_2 = current_year + 2
        current_price = self.fetch_current_stock_price(ticker)

        # Method 1 & 2 (1-Year Forward)
        method1_pe = self.calculate_pe_ratio(current_price, self.get_1year_forward_eps_quarterly(ticker, year_plus_1))
        method2_pe = self.calculate_pe_ratio(current_price, self.get_1year_forward_eps_annual(ticker, year_plus_1))

        # Method 3 & 4 (2-Year Forward)
        method3_pe = self.calculate_pe_ratio(current_price, self.get_2year_forward_eps_annual(ticker, year_plus_2))
        method4_pe = self.calculate_pe_ratio(current_price, self.get_2year_forward_eps_quarterly(ticker, year_plus_2))

        # Method 5 & 6 (New methods using next 12 months and 12-24 months)
        method5_eps = self.get_next_12_months_eps(ticker, current_year)
        method5_pe = self.calculate_pe_ratio(current_price, method5_eps)
        
        method6_eps = self.get_next_12_to_24_months_eps(ticker, current_year)
        method6_pe = self.calculate_pe_ratio(current_price, method6_eps)

        # Method 7 (yfinance forward PE)
        method7_pe = self.get_yfinance_forward_pe(ticker)

        return {
            'ticker': ticker,
            'current_year': current_year,
            'current_price': current_price,
            'year_plus_1': year_plus_1,
            'year_plus_2': year_plus_2,
            'method5_eps': method5_eps,
            'method6_eps': method6_eps,
            'forward_pe_ratios': {
                'Method1_PE': method1_pe,
                'Method2_PE': method2_pe,
                'Method3_PE': method3_pe,
                'Method4_PE': method4_pe,
                'Method5_PE': method5_pe,
                'Method6_PE': method6_pe,
                'Method7_PE': method7_pe
            }
        }

    def print_forward_pe_table(self, ticker: str, current_year: int = None):
        if current_year is None:
            current_year = datetime.now().year

        results = self.calculate_forward_pe_ratios(ticker, current_year)
        ratios = results['forward_pe_ratios']
        current_price = results['current_price']
        year_plus_1 = results['year_plus_1']
        year_plus_2 = results['year_plus_2']
        method5_eps = results['method5_eps']
        method6_eps = results['method6_eps']

        print(f"\n{ticker} Forward P/E Analysis (Current Price: ${current_price:.2f})")
        print("=" * 90)
        print(f"{'Method':<60} {'Forward P/E':>15} {'EPS':>10}")
        print("-" * 90)
        print(f"{'Method 1: 1-Year Forward P/E (Quarterly)':<60} {ratios['Method1_PE']:>13.2f}x")
        print(f"{'Method 2: 1-Year Forward P/E (Annual)':<60} {ratios['Method2_PE']:>13.2f}x")
        print(f"{'Method 3: 2-Year Forward P/E (Annual)':<60} {ratios['Method3_PE']:>13.2f}x")
        print(f"{'Method 4: 2-Year Forward P/E (Quarterly)':<60} {ratios['Method4_PE']:>13.2f}x")
        print(f"{'Method 5: Next 12 Months EPS':<60} {ratios['Method5_PE']:>13.2f}x {method5_eps:>8.3f}")
        print(f"{'Method 6: Next 12-24 Months EPS':<60} {ratios['Method6_PE']:>13.2f}x {method6_eps:>8.3f}")
        print(f"{'Method 7: yfinance Forward P/E':<60} {ratios['Method7_PE']:>13.2f}x")
        print("=" * 90)
        print(f"Note: Method 1 & 2 use {year_plus_1} estimates")
        print(f"      Method 3 & 4 use {year_plus_2} estimates")
        print(f"      Method 5 uses next 4 quarters from current date")
        print(f"      Method 6 uses quarters 5-8 from current date")
        print(f"      Method 7 uses yfinance library data")


# Example usage
def main():
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"
    calculator = ForwardPECalculator(API_KEY)
    tickers = ['CRM']

    for ticker in tickers:
        try:
            calculator.print_forward_pe_table(ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")


if __name__ == "__main__":
    main()
