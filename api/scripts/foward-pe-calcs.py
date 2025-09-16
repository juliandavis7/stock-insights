import requests
from datetime import datetime
from typing import Dict, List


class ForwardPECalculator:
    """
    Calculate forward P/E ratios using 4 different methods:
    Method 1: 1-Year Forward P/E Using Quarterly Estimates
    Method 2: 1-Year Forward P/E Using Annual Estimates
    Method 3: 2-Year Forward P/E Using Annual Estimates
    Method 4: 2-Year Forward P/E Using Quarterly Estimates
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com"

    def fetch_current_stock_price(self, ticker: str) -> float:
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

        return {
            'ticker': ticker,
            'current_year': current_year,
            'current_price': current_price,
            'year_plus_1': year_plus_1,
            'year_plus_2': year_plus_2,
            'forward_pe_ratios': {
                'Method1_PE': method1_pe,
                'Method2_PE': method2_pe,
                'Method3_PE': method3_pe,
                'Method4_PE': method4_pe
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

        print(f"\n{ticker} Forward P/E Analysis (Current Price: ${current_price:.2f})")
        print("=" * 80)
        print(f"{'Method':<50} {'Forward P/E':>15}")
        print("-" * 80)
        print(f"{'Method 1: 1-Year Forward P/E (Quarterly)':<50} {ratios['Method1_PE']:>13.2f}x")
        print(f"{'Method 2: 1-Year Forward P/E (Annual)':<50} {ratios['Method2_PE']:>13.2f}x")
        print(f"{'Method 3: 2-Year Forward P/E (Annual)':<50} {ratios['Method3_PE']:>13.2f}x")
        print(f"{'Method 4: 2-Year Forward P/E (Quarterly)':<50} {ratios['Method4_PE']:>13.2f}x")
        print("=" * 80)
        print(f"Note: Method 1 & 2 use {year_plus_1} estimates")
        print(f"      Method 3 & 4 use {year_plus_2} estimates")


# Example usage
def main():
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"
    calculator = ForwardPECalculator(API_KEY)
    tickers = ['GOOG', 'AAPL', 'META']

    for ticker in tickers:
        try:
            calculator.print_forward_pe_table(ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")


if __name__ == "__main__":
    main()
