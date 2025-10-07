"""
EPS TTM Calculator

This script calculates Trailing Twelve Months (TTM) EPS for each quarter from 2022 Q1 through 2026 Q4.
It uses a combination of:
- Historical income statement data (for past quarters)
- Analyst estimates data (for future quarters)

The TTM EPS for any given quarter is the sum of EPS for that quarter plus the previous 3 quarters.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class EPSTTMCalculator:
    """Calculate TTM EPS using historical and estimated data"""
    
    def __init__(self):
        self.mocks_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mocks")
        
    def load_income_statement_data(self, ticker: str) -> List[Dict]:
        """Load historical income statement data from mocks"""
        try:
            file_path = os.path.join(self.mocks_dir, "income-statement", f"{ticker.upper()}.json")
            
            if not os.path.exists(file_path):
                print(f"❌ No income statement data found for {ticker}")
                return []
            
            with open(file_path, 'r') as f:
                mock_data = json.load(f)
            
            # Extract the data array
            data = mock_data.get("data", [])
            if not data:
                print(f"❌ Empty income statement data for {ticker}")
                return []
            
            print(f"✅ Loaded {len(data)} income statement records for {ticker}")
            return data
            
        except Exception as e:
            print(f"❌ Error loading income statement data for {ticker}: {e}")
            return []
    
    def load_estimates_data(self, ticker: str) -> List[Dict]:
        """Load analyst estimates data from mocks"""
        try:
            file_path = os.path.join(self.mocks_dir, "analyst-estimates", "quarterly", f"{ticker.upper()}.json")
            
            if not os.path.exists(file_path):
                print(f"❌ No estimates data found for {ticker}")
                return []
            
            with open(file_path, 'r') as f:
                mock_data = json.load(f)
            
            # Extract the data array
            data = mock_data.get("data", [])
            if not data:
                print(f"❌ Empty estimates data for {ticker}")
                return []
            
            print(f"✅ Loaded {len(data)} estimate records for {ticker}")
            return data
            
        except Exception as e:
            print(f"❌ Error loading estimates data for {ticker}: {e}")
            return []
    
    def parse_quarter_from_date(self, date_str: str) -> Optional[Tuple[int, int]]:
        """Parse year and quarter from date string using same logic as current-year-calcs.py"""
        try:
            year = int(date_str.split('-')[0])
            month = int(date_str.split('-')[1])
            
            # Use the same month-to-quarter mapping as current-year-calcs.py
            # This handles fiscal year boundaries correctly
            if month in [1, 2, 3, 4]:  # Q1 reporting period
                fiscal_year = year
                quarter = 1
                # January-March could be Q4 of previous fiscal year
                if month in [1, 2, 3]:
                    fiscal_year = year - 1
                    quarter = 4
            elif month in [5, 6, 7]:  # Q2 reporting period
                fiscal_year = year
                quarter = 2
            elif month in [8, 9, 10]:  # Q3 reporting period
                fiscal_year = year
                quarter = 3
            elif month in [11, 12]:  # Q4 reporting period (partial)
                fiscal_year = year
                quarter = 4
            else:
                return None
            
            return (fiscal_year, quarter)
            
        except Exception as e:
            print(f"❌ Error parsing date {date_str}: {e}")
            return None
    
    def create_quarter_key(self, year: int, quarter: int) -> str:
        """Create a standardized quarter key"""
        return f"{year}Q{quarter}"
    
    def get_all_eps_data(self, ticker: str) -> Tuple[Dict[str, float], Dict[str, str]]:
        """Combine historical and estimated EPS data into a single timeline with source tracking"""
        eps_data = {}
        eps_sources = {}  # Track whether data is from actuals or estimates
        
        # Load historical data
        income_data = self.load_income_statement_data(ticker)
        for record in income_data:
            date_str = record.get('date')
            eps = record.get('eps', 0)
            
            if date_str and eps is not None:
                quarter_info = self.parse_quarter_from_date(date_str)
                if quarter_info:
                    year, quarter = quarter_info
                    quarter_key = self.create_quarter_key(year, quarter)
                    eps_data[quarter_key] = float(eps)
                    eps_sources[quarter_key] = 'act'  # actual data
        
        # Load estimates data
        estimates_data = self.load_estimates_data(ticker)
        for record in estimates_data:
            date_str = record.get('date')
            eps = record.get('estimatedEpsAvg', 0)
            
            if date_str and eps is not None:
                quarter_info = self.parse_quarter_from_date(date_str)
                if quarter_info:
                    year, quarter = quarter_info
                    quarter_key = self.create_quarter_key(year, quarter)
                    # Only use estimates if we don't have historical data
                    if quarter_key not in eps_data:
                        eps_data[quarter_key] = float(eps)
                        eps_sources[quarter_key] = 'est'  # estimate data
        
        return eps_data, eps_sources
    
    def calculate_ttm_eps(self, ticker: str) -> Dict[str, float]:
        """Calculate TTM EPS for each quarter from 2022 Q1 through 2026 Q4"""
        eps_data, eps_sources = self.get_all_eps_data(ticker)
        ttm_results = {}
        
        print(f"\n📊 Calculating TTM EPS for {ticker}")
        print(f"Available quarters: {sorted(eps_data.keys())}")
        
        # Generate all quarters from 2022 Q1 through 2026 Q4
        for year in range(2022, 2027):
            for quarter in range(1, 5):
                current_quarter = self.create_quarter_key(year, quarter)
                
                # Get the current quarter and previous 3 quarters
                ttm_quarters = []
                ttm_eps_values = []
                ttm_sources = []
                
                # Calculate which quarters to include in TTM (previous 4 quarters, NOT including current)
                for i in range(1, 5):  # Previous 4 quarters (i=1,2,3,4)
                    q_year = year
                    q_quarter = quarter - i
                    
                    # Handle year rollover
                    while q_quarter <= 0:
                        q_quarter += 4
                        q_year -= 1
                    
                    quarter_key = self.create_quarter_key(q_year, q_quarter)
                    ttm_quarters.append(quarter_key)
                    
                    if quarter_key in eps_data:
                        ttm_eps_values.append(eps_data[quarter_key])
                        ttm_sources.append(eps_sources[quarter_key])
                    else:
                        # Missing data - can't calculate TTM for this quarter
                        ttm_eps_values = []
                        ttm_sources = []
                        break
                
                # Calculate TTM if we have all 4 quarters
                if len(ttm_eps_values) == 4:
                    ttm_eps = sum(ttm_eps_values)
                    ttm_results[current_quarter] = ttm_eps
                    
                    # Reverse the lists for proper chronological order (oldest to newest)
                    ttm_quarters.reverse()
                    ttm_eps_values.reverse()
                    ttm_sources.reverse()
                    
                    # Create detailed math breakdown
                    math_parts = []
                    for q, v, s in zip(ttm_quarters, ttm_eps_values, ttm_sources):
                        math_parts.append(f"{q}({v:.2f} {s})")
                    
                    math_formula = " + ".join(math_parts)
                    print(f"  {current_quarter} TTM: {ttm_eps:.2f} = {math_formula}")
                else:
                    available_quarters = [q for q in ttm_quarters if q in eps_data]
                    print(f"  {current_quarter}: ❌ Missing data (available: {available_quarters})")
        
        return ttm_results
    
    def print_ttm_summary(self, ticker: str, ttm_results: Dict[str, float]):
        """Print a formatted summary of TTM results"""
        print(f"\n📈 TTM EPS Summary for {ticker}")
        print("=" * 50)
        
        if not ttm_results:
            print("❌ No TTM data available")
            return
        
        # Group by year
        by_year = defaultdict(list)
        for quarter_key, ttm_eps in sorted(ttm_results.items()):
            year = int(quarter_key[:4])
            quarter = quarter_key[5:]
            by_year[year].append((quarter, ttm_eps))
        
        for year in sorted(by_year.keys()):
            print(f"\n{year}:")
            for quarter, ttm_eps in by_year[year]:
                print(f"  Q{quarter}: ${ttm_eps:.2f}")
    
    def process_ticker(self, ticker: str) -> Dict[str, float]:
        """Process a single ticker and return TTM results"""
        print(f"\n🔍 Processing {ticker}")
        print("-" * 50)
        
        ttm_results = self.calculate_ttm_eps(ticker)
        self.print_ttm_summary(ticker, ttm_results)
        
        return ttm_results


def main():
    """Main function to process multiple tickers"""
    
    # List of stocks to process
    STOCKS_TO_PROCESS = [
        "CRM"
    ]
    
    calculator = EPSTTMCalculator()
    all_results = {}
    
    print("🚀 Starting EPS TTM Analysis")
    print(f"📋 Processing {len(STOCKS_TO_PROCESS)} stocks")
    print("=" * 60)
    
    for ticker in STOCKS_TO_PROCESS:
        try:
            results = calculator.process_ticker(ticker)
            all_results[ticker] = results
        except Exception as e:
            print(f"❌ Error processing {ticker}: {e}")
            all_results[ticker] = {}
    
    # Print final summary
    print("\n" + "=" * 60)
    print("📊 FINAL SUMMARY")
    print("=" * 60)
    
    successful_tickers = [ticker for ticker, results in all_results.items() if results]
    failed_tickers = [ticker for ticker, results in all_results.items() if not results]
    
    print(f"✅ Successfully processed: {len(successful_tickers)} stocks")
    print(f"❌ Failed to process: {len(failed_tickers)} stocks")
    
    if failed_tickers:
        print(f"Failed tickers: {', '.join(failed_tickers)}")
    
    # Show sample results for first successful ticker
    if successful_tickers:
        sample_ticker = successful_tickers[0]
        sample_results = all_results[sample_ticker]
        print(f"\n📈 Sample results for {sample_ticker}:")
        for quarter_key in sorted(list(sample_results.keys())[:8]):  # Show first 8 quarters
            print(f"  {quarter_key}: ${sample_results[quarter_key]:.2f}")
        if len(sample_results) > 8:
            print(f"  ... and {len(sample_results) - 8} more quarters")


if __name__ == "__main__":
    main()
