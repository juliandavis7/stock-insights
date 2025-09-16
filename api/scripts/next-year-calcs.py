import requests
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
import json


class NextYearFinancialCalculator:
    """
    Calculate next year EPS and revenue growth using 4 different methods:
    Method 1: Next Year Estimates Quarterly vs Current Year Hybrid Quarterly
    Method 2: Next Year Estimates Quarterly vs Current Year Estimates Quarterly
    Method 3: Next Year Estimates Annual vs Current Year Estimates Annual
    Method 4: Next Year Estimates Annual vs Current Year Hybrid Annual
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com"
    
    def get_quarters_elapsed_in_year(self, target_year: int = None) -> int:
        """Calculate how many fiscal quarters have elapsed in the target year."""
        if target_year is None:
            target_year = datetime.now().year
        
        current_date = datetime.now()
        current_year = current_date.year
        
        if target_year > current_year:
            return 0
        elif target_year < current_year:
            return 4
        else:
            current_month = current_date.month
            if current_month <= 3:
                return 0
            elif current_month <= 6:
                return 1
            elif current_month <= 9:
                return 2
            else:
                return 3
    
    def fetch_quarterly_income_statement(self, ticker: str, limit: int = 20) -> List[Dict]:
        """Fetch quarterly income statement data from FMP"""
        url = f"{self.base_url}/api/v3/income-statement/{ticker}"
        params = {
            'period': 'quarter',
            'limit': limit,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching quarterly income statement for {ticker}: {e}")
            return []
    
    def fetch_quarterly_analyst_estimates(self, ticker: str) -> List[Dict]:
        """Fetch quarterly analyst estimates from FMP"""
        url = f"{self.base_url}/api/v3/analyst-estimates/{ticker}"
        params = {
            'period': 'quarter',
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching quarterly analyst estimates for {ticker}: {e}")
            return []
    
    def fetch_annual_analyst_estimates(self, ticker: str) -> List[Dict]:
        """Fetch annual analyst estimates from FMP"""
        url = f"{self.base_url}/api/v3/analyst-estimates/{ticker}"
        params = {
            'period': 'annual',
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching annual analyst estimates for {ticker}: {e}")
            return []
    
    def filter_data_by_year(self, data: List[Dict], target_year: int) -> List[Dict]:
        """Filter data to only include specified year"""
        filtered = []
        for item in data:
            item_year = int(item['date'].split('-')[0])
            if item_year == target_year:
                filtered.append(item)
        
        filtered.sort(key=lambda x: x['date'], reverse=True)
        return filtered
    
    def get_quarterly_actual_data(self, ticker: str, target_year: int, num_quarters: int = 4) -> Tuple[float, float]:
        """Get actual EPS and revenue for quarters in target year"""
        income_data = self.fetch_quarterly_income_statement(ticker)
        year_data = self.filter_data_by_year(income_data, target_year)
        
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('eps', 0) for q in quarters)
        total_revenue = sum(q.get('revenue', 0) for q in quarters)
        
        return total_eps, total_revenue
    
    def get_quarterly_estimates_data(self, ticker: str, target_year: int, num_quarters: int = 4) -> Tuple[float, float]:
        """Get estimated EPS and revenue for quarters in target year"""
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        year_data = self.filter_data_by_year(estimates_data, target_year)
        
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('estimatedEpsAvg', 0) for q in quarters)
        total_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in quarters)
        
        return total_eps, total_revenue
    
    def get_annual_estimates_data(self, ticker: str, target_year: int) -> Tuple[float, float]:
        """Get annual estimated EPS and revenue for target year"""
        estimates_data = self.fetch_annual_analyst_estimates(ticker)
        year_data = self.filter_data_by_year(estimates_data, target_year)
        
        if year_data:
            annual_data = year_data[0]
            return annual_data.get('estimatedEpsAvg', 0), annual_data.get('estimatedRevenueAvg', 0)
        
        return 0, 0
    
    def get_hybrid_current_year_data(self, ticker: str, target_year: int) -> Tuple[float, float]:
        """Get hybrid current year data (actual + estimates)"""
        quarters_elapsed = self.get_quarters_elapsed_in_year(target_year)
        quarters_remaining = 4 - quarters_elapsed
        
        # Get actual data for completed quarters
        actual_eps, actual_revenue = 0, 0
        if quarters_elapsed > 0:
            actual_eps, actual_revenue = self.get_quarterly_actual_data(ticker, target_year, quarters_elapsed)
        
        # Get estimated data for remaining quarters
        estimated_eps, estimated_revenue = 0, 0
        if quarters_remaining > 0:
            estimated_eps, estimated_revenue = self.get_quarterly_estimates_data(ticker, target_year, quarters_remaining)
        
        return actual_eps + estimated_eps, actual_revenue + estimated_revenue
    
    def get_hybrid_annual_estimate(self, ticker: str, target_year: int) -> Tuple[float, float]:
        """
        Get hybrid-based annual estimate for current year:
        - Uses actual EPS and revenue for completed quarters
        - Uses quarterly estimates for remaining quarters
        """
        quarters_elapsed = self.get_quarters_elapsed_in_year(target_year)
        if quarters_elapsed == 0:
            # If no quarters completed yet, fallback to annual estimate
            return self.get_annual_estimates_data(ticker, target_year)
        
        # Actuals for completed quarters
        actual_eps, actual_revenue = self.get_quarterly_actual_data(ticker, target_year, quarters_elapsed)
        
        # Estimates for remaining quarters
        remaining_quarters = 4 - quarters_elapsed
        est_eps, est_revenue = self.get_quarterly_estimates_data(ticker, target_year, remaining_quarters)
        
        return actual_eps + est_eps, actual_revenue + est_revenue
    
    def calculate_growth_rate(self, next_value: float, current_value: float) -> float:
        """Calculate growth rate with proper handling of negative values and zero division"""
        if current_value == 0:
            return 0
        return ((next_value - current_value) / abs(current_value)) * 100
    
    def calculate_next_year_growth(self, ticker: str, current_year: int = None, next_year: int = None) -> Dict:
        """Calculate next year growth rates using 4 different methods"""
        if current_year is None:
            current_year = datetime.now().year
        if next_year is None:
            next_year = current_year + 1
        
        # Get next year quarterly estimates (used by Methods 1 and 2)
        next_quarterly_est_eps, next_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, next_year, 4)
        
        # Get next year annual estimates (used by Methods 3 and 4)
        next_annual_est_eps, next_annual_est_revenue = self.get_annual_estimates_data(ticker, next_year)
        
        # === METHOD 1: Next Year Estimates Quarterly vs Current Year Hybrid Quarterly ===
        current_hybrid_eps, current_hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        
        method1_eps = self.calculate_growth_rate(next_quarterly_est_eps, current_hybrid_eps)
        method1_rev = self.calculate_growth_rate(next_quarterly_est_revenue, current_hybrid_revenue)
        
        # === METHOD 2: Next Year Estimates Quarterly vs Current Year Estimates Quarterly ===
        current_quarterly_est_eps, current_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, current_year, 4)
        
        method2_eps = self.calculate_growth_rate(next_quarterly_est_eps, current_quarterly_est_eps)
        method2_rev = self.calculate_growth_rate(next_quarterly_est_revenue, current_quarterly_est_revenue)
        
        # === METHOD 3: Next Year Estimates Annual vs Current Year Estimates Annual ===
        current_annual_est_eps, current_annual_est_revenue = self.get_annual_estimates_data(ticker, current_year)
        
        method3_eps = self.calculate_growth_rate(next_annual_est_eps, current_annual_est_eps)
        method3_rev = self.calculate_growth_rate(next_annual_est_revenue, current_annual_est_revenue)
        
        # === METHOD 4: Next Year Estimates Annual vs Current Year Hybrid Annual ===
        current_hybrid_annual_eps, current_hybrid_annual_revenue = self.get_hybrid_annual_estimate(ticker, current_year)
        
        method4_eps = self.calculate_growth_rate(next_annual_est_eps, current_hybrid_annual_eps)
        method4_rev = self.calculate_growth_rate(next_annual_est_revenue, current_hybrid_annual_revenue)
        
        return {
            'ticker': ticker,
            'current_year': current_year,
            'next_year': next_year,
            'methods': {
                'Method1_EPS': method1_eps,
                'Method1_REV': method1_rev,
                'Method2_EPS': method2_eps,
                'Method2_REV': method2_rev,
                'Method3_EPS': method3_eps,
                'Method3_REV': method3_rev,
                'Method4_EPS': method4_eps,
                'Method4_REV': method4_rev
            }
        }
    
    def print_next_year_growth_table(self, ticker: str, current_year: int = None, next_year: int = None):
        """Print a formatted table showing next year growth calculations using 4 methods"""
        if current_year is None:
            current_year = datetime.now().year
        if next_year is None:
            next_year = current_year + 1
        
        results = self.calculate_next_year_growth(ticker, current_year, next_year)
        methods = results['methods']
        
        print(f"\n{ticker} Next Year Growth Analysis ({current_year} → {next_year})")
        print("=" * 80)
        print(f"{'Method':<50} {'EPS Growth':>12} {'Revenue Growth':>15}")
        print("-" * 80)
        print(f"{'Method 1: Next Est Quarter vs Cur Hybrid Quarter':<50} {methods['Method1_EPS']:>10.2f}% {methods['Method1_REV']:>13.2f}%")
        print(f"{'Method 2: Next Est Quarterly vs Cur Est Quarterly':<50} {methods['Method2_EPS']:>10.2f}% {methods['Method2_REV']:>13.2f}%")
        print(f"{'Method 3: Next Est Annual vs Cur Est Annual':<50} {methods['Method3_EPS']:>10.2f}% {methods['Method3_REV']:>13.2f}%")
        print(f"{'Method 4: Next Est Annual vs Cur Hybrid Annual':<50} {methods['Method4_EPS']:>10.2f}% {methods['Method4_REV']:>13.2f}%")
        print("=" * 80)


# Example usage
def main():
    """Example usage of the NextYearFinancialCalculator"""
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"
    
    calculator = NextYearFinancialCalculator(API_KEY)
    
    # Test with multiple tickers
    tickers = ['GOOG']
    
    for ticker in tickers:
        try:
            calculator.print_next_year_growth_table(ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")


if __name__ == "__main__":
    main()