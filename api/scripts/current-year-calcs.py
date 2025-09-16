import requests
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
import json


class CurrentYearFinancialCalculator:
    """
    Calculate current year EPS and revenue growth using 4 different methods:
    Method 1: Hybrid Quarterly vs Prior Year Quarterly Sum
    Method 2: Estimates Quarterly vs Prior Year Quarterly Sum  
    Method 3: Estimates Annual vs Prior Year Annual
    Method 4: Next Twelve Months (NTM) vs Prior Twelve Months (TTM)
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
    
    def fetch_annual_income_statement(self, ticker: str, limit: int = 10) -> List[Dict]:
        """Fetch annual income statement data from FMP"""
        url = f"{self.base_url}/api/v3/income-statement/{ticker}"
        params = {
            'period': 'annual',
            'limit': limit,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching annual income statement for {ticker}: {e}")
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
    
    def get_annual_actual_data(self, ticker: str, target_year: int) -> Tuple[float, float]:
        """Get annual actual EPS and revenue for target year"""
        income_data = self.fetch_annual_income_statement(ticker)
        year_data = self.filter_data_by_year(income_data, target_year)
        
        if year_data:
            annual_data = year_data[0]
            return annual_data.get('eps', 0), annual_data.get('revenue', 0)
        
        return 0, 0
    
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
    
    def get_ntm_data(self, ticker: str) -> Tuple[float, float]:
        """Get Next Twelve Months (NTM) data - next 4 quarters forward"""
        current_date = datetime.now()
        current_year = current_date.year
        next_year = current_year + 1
        
        # Get estimates for current year remaining quarters + next year quarters
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        
        # Filter for current and next year
        current_year_data = self.filter_data_by_year(estimates_data, current_year)
        next_year_data = self.filter_data_by_year(estimates_data, next_year)
        
        # Get next 4 quarters forward from current date
        quarters_elapsed = self.get_quarters_elapsed_in_year(current_year)
        quarters_remaining_current = 4 - quarters_elapsed
        
        ntm_quarters = []
        
        # Add remaining quarters from current year
        if quarters_remaining_current > 0 and current_year_data:
            ntm_quarters.extend(current_year_data[:quarters_remaining_current])
        
        # Add quarters from next year to make up 4 total quarters
        quarters_needed_from_next = 4 - len(ntm_quarters)
        if quarters_needed_from_next > 0 and next_year_data:
            ntm_quarters.extend(next_year_data[:quarters_needed_from_next])
        
        total_eps = sum(q.get('estimatedEpsAvg', 0) for q in ntm_quarters)
        total_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in ntm_quarters)
        
        return total_eps, total_revenue
    
    def get_ttm_data(self, ticker: str) -> Tuple[float, float]:
        """Get Trailing Twelve Months (TTM) data - last 4 quarters backward"""
        # Get the most recent 4 quarters of actual data
        income_data = self.fetch_quarterly_income_statement(ticker, limit=8)
        
        # Take the most recent 4 quarters
        recent_quarters = income_data[:4]
        
        total_eps = sum(q.get('eps', 0) for q in recent_quarters)
        total_revenue = sum(q.get('revenue', 0) for q in recent_quarters)
        
        return total_eps, total_revenue
    
    def calculate_growth_rate(self, current_value: float, prior_value: float) -> float:
        """Calculate growth rate with proper handling of negative values and zero division"""
        if prior_value == 0:
            return 0
        return ((current_value - prior_value) / abs(prior_value)) * 100
    
    def calculate_current_year_growth(self, ticker: str, current_year: int = None, previous_year: int = None) -> Dict:
        """Calculate current year growth rates using 4 different methods"""
        if current_year is None:
            current_year = datetime.now().year
        if previous_year is None:
            previous_year = current_year - 1
        
        # === METHOD 1: Hybrid Quarterly vs Prior Year Quarterly Sum ===
        hybrid_eps, hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        prior_quarterly_eps, prior_quarterly_revenue = self.get_quarterly_actual_data(ticker, previous_year, 4)
        
        method1_eps = self.calculate_growth_rate(hybrid_eps, prior_quarterly_eps)
        method1_rev = self.calculate_growth_rate(hybrid_revenue, prior_quarterly_revenue)
        
        # === METHOD 2: Estimates Quarterly vs Prior Year Quarterly Sum ===
        quarterly_est_eps, quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, current_year, 4)
        
        method2_eps = self.calculate_growth_rate(quarterly_est_eps, prior_quarterly_eps)
        method2_rev = self.calculate_growth_rate(quarterly_est_revenue, prior_quarterly_revenue)
        
        # === METHOD 3: Estimates Annual vs Prior Year Annual ===
        annual_est_eps, annual_est_revenue = self.get_annual_estimates_data(ticker, current_year)
        prior_annual_eps, prior_annual_revenue = self.get_annual_actual_data(ticker, previous_year)
        
        method3_eps = self.calculate_growth_rate(annual_est_eps, prior_annual_eps)
        method3_rev = self.calculate_growth_rate(annual_est_revenue, prior_annual_revenue)
        
        # === METHOD 4: Next Twelve Months (NTM) vs Prior Twelve Months (TTM) ===
        ntm_eps, ntm_revenue = self.get_ntm_data(ticker)
        ttm_eps, ttm_revenue = self.get_ttm_data(ticker)
        
        method4_eps = self.calculate_growth_rate(ntm_eps, ttm_eps)
        method4_rev = self.calculate_growth_rate(ntm_revenue, ttm_revenue)
        
        return {
            'ticker': ticker,
            'current_year': current_year,
            'previous_year': previous_year,
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
    
    def print_current_year_growth_table(self, ticker: str, current_year: int = None, previous_year: int = None):
        """Print a formatted table showing current year growth calculations using 4 methods"""
        if current_year is None:
            current_year = datetime.now().year
        if previous_year is None:
            previous_year = current_year - 1
        
        results = self.calculate_current_year_growth(ticker, current_year, previous_year)
        methods = results['methods']
        
        print(f"\n{ticker} Current Year Growth Analysis ({previous_year} → {current_year})")
        print("=" * 75)
        print(f"{'Method':<50} {'EPS Growth':<12} {'Revenue Growth':<12}")
        print("-" * 75)
        print(f"{'Method 1: Hybrid vs Prior Quarterly':<50} {methods['Method1_EPS']:>10.2f}% {methods['Method1_REV']:>12.2f}%")
        print(f"{'Method 2: Estimates Quarterly vs Prior Quarterly':<50} {methods['Method2_EPS']:>10.2f}% {methods['Method2_REV']:>12.2f}%")
        print(f"{'Method 3: Estimates Annual vs Prior Annual':<50} {methods['Method3_EPS']:>10.2f}% {methods['Method3_REV']:>12.2f}%")
        print(f"{'Method 4: NTM vs TTM':<50} {methods['Method4_EPS']:>10.2f}% {methods['Method4_REV']:>12.2f}%")
        print("=" * 75)


# Example usage
def main():
    """Example usage of the CurrentYearFinancialCalculator"""
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"
    
    calculator = CurrentYearFinancialCalculator(API_KEY)
    
    # Test with multiple tickers
    tickers = ['GOOG']
    
    for ticker in tickers:
        try:
            calculator.print_current_year_growth_table(ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")


if __name__ == "__main__":
    main()