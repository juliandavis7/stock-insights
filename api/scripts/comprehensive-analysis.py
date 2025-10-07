#!/usr/bin/env python3
"""
Comprehensive Financial Analysis Script

Combines current year calculations, forward PE calculations, and next year calculations
for multiple stocks in a single comprehensive analysis.

Usage:
    python3 comprehensive-analysis.py
"""

import os
import sys
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the api directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the classes directly from the script files
import importlib.util
import sys

# Load current-year-calcs module
spec1 = importlib.util.spec_from_file_location("current_year_calcs", "scripts/current-year-calcs.py")
current_year_module = importlib.util.module_from_spec(spec1)
spec1.loader.exec_module(current_year_module)

# Load foward-pe-calcs module  
spec2 = importlib.util.spec_from_file_location("foward_pe_calcs", "scripts/foward-pe-calcs.py")
foward_pe_module = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(foward_pe_module)

# Load next-year-calcs module
spec3 = importlib.util.spec_from_file_location("next_year_calcs", "scripts/next-year-calcs.py")
next_year_module = importlib.util.module_from_spec(spec3)
spec3.loader.exec_module(next_year_module)

# Get the classes
CurrentYearFinancialCalculator = current_year_module.CurrentYearFinancialCalculator
ForwardPECalculator = foward_pe_module.ForwardPECalculator
NextYearFinancialCalculator = next_year_module.NextYearFinancialCalculator


class ComprehensiveFinancialAnalyzer:
    """
    Comprehensive financial analyzer that combines all three calculation methods
    for multiple stocks in a single analysis.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.current_year_calc = CurrentYearFinancialCalculator(api_key)
        self.forward_pe_calc = ForwardPECalculator(api_key)
        self.next_year_calc = NextYearFinancialCalculator(api_key)
    
    def analyze_stock(self, ticker: str) -> Dict[str, Any]:
        """
        Perform comprehensive analysis for a single stock.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary containing all analysis results
        """
        print(f"\n{'='*80}")
        print(f"COMPREHENSIVE ANALYSIS FOR {ticker.upper()}")
        print(f"{'='*80}")
        
        try:
            # Forward PE Analysis
            print(f"\n📈 FORWARD P/E ANALYSIS")
            print("-" * 50)
            forward_pe_results = self.forward_pe_calc.calculate_forward_pe_ratios(ticker)
            self._print_forward_pe_table(forward_pe_results)
            
            # Current Year Growth Analysis
            print(f"\n📊 CURRENT YEAR GROWTH ANALYSIS")
            print("-" * 50)
            current_year_results = self.current_year_calc.calculate_current_year_growth(ticker)
            self._print_current_year_table(current_year_results)
            
            # Next Year Growth Analysis
            print(f"\n🔮 NEXT YEAR GROWTH ANALYSIS")
            print("-" * 50)
            next_year_results = self.next_year_calc.calculate_next_year_growth(ticker)
            self._print_next_year_table(next_year_results)
            
            return {
                'ticker': ticker,
                'current_year': current_year_results,
                'forward_pe': forward_pe_results,
                'next_year': next_year_results,
                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            print(f"❌ Error analyzing {ticker}: {e}")
            return {
                'ticker': ticker,
                'error': str(e),
                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
    
    def analyze_multiple_stocks(self, tickers: List[str]) -> Dict[str, Any]:
        """
        Perform comprehensive analysis for multiple stocks.
        
        Args:
            tickers: List of stock ticker symbols
            
        Returns:
            Dictionary containing analysis results for all stocks
        """
        print(f"\n🚀 COMPREHENSIVE FINANCIAL ANALYSIS")
        print(f"Analyzing {len(tickers)} stocks: {', '.join(tickers)}")
        print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        results = {}
        
        for ticker in tickers:
            results[ticker] = self.analyze_stock(ticker)
        
        # Summary comparison
        self._print_summary_comparison(results)
        
        return results
    
    def _print_current_year_table(self, results: Dict[str, Any]):
        """Print formatted current year growth table."""
        methods = results['methods']
        
        print(f"{'Method':<50} {'EPS Growth':<12} {'Revenue Growth':<12}")
        print("-" * 75)
        print(f"{'Method 1: Hybrid vs Prior Quarterly':<50} {methods['Method1_EPS']:>10.2f}% {methods['Method1_REV']:>12.2f}%")
        print(f"{'Method 2: Estimates Quarterly vs Prior Quarterly':<50} {methods['Method2_EPS']:>10.2f}% {methods['Method2_REV']:>12.2f}%")
        print(f"{'Method 3: Estimates Annual vs Prior Annual':<50} {methods['Method3_EPS']:>10.2f}% {methods['Method3_REV']:>12.2f}%")
        print(f"{'Method 4: NTM vs TTM':<50} {methods['Method4_EPS']:>10.2f}% {methods['Method4_REV']:>12.2f}%")
    
    def _print_forward_pe_table(self, results: Dict[str, Any]):
        """Print formatted forward PE table broken into 1-year and 2-year sections."""
        ratios = results['forward_pe_ratios']
        current_price = results['current_price']
        
        print(f"Current Price: ${current_price:.2f}")
        
        # 1-Year Forward P/E Section
        print(f"\n1-YEAR FORWARD P/E:")
        print(f"{'Method':<50} {'Forward P/E':<15}")
        print("-" * 70)
        print(f"{'Method 1: 1-Year Forward P/E (Quarterly)':<50} {ratios['Method1_PE']:>13.2f}x")
        print(f"{'Method 2: 1-Year Forward P/E (Annual)':<50} {ratios['Method2_PE']:>13.2f}x")
        print(f"{'Method 5: Next 12 Months EPS':<50} {ratios['Method5_PE']:>13.2f}x")
        print(f"{'Method 7: yfinance Forward P/E':<50} {ratios['Method7_PE']:>13.2f}x")
        
        # 2-Year Forward P/E Section
        print(f"\n2-YEAR FORWARD P/E:")
        print(f"{'Method':<50} {'Forward P/E':<15}")
        print("-" * 70)
        print(f"{'Method 3: 2-Year Forward P/E (Annual)':<50} {ratios['Method3_PE']:>13.2f}x")
        print(f"{'Method 4: 2-Year Forward P/E (Quarterly)':<50} {ratios['Method4_PE']:>13.2f}x")
        print(f"{'Method 6: Next 12-24 Months EPS':<50} {ratios['Method6_PE']:>13.2f}x")
    
    def _print_next_year_table(self, results: Dict[str, Any]):
        """Print formatted next year growth table."""
        methods = results['methods']
        
        print(f"{'Method':<50} {'EPS Growth':<12} {'Revenue Growth':<15}")
        print("-" * 80)
        print(f"{'Method 1: Next Est Quarter vs Cur Hybrid Quarter':<50} {methods['Method1_EPS']:>10.2f}% {methods['Method1_REV']:>13.2f}%")
        print(f"{'Method 2: Next Est Quarterly vs Cur Est Quarterly':<50} {methods['Method2_EPS']:>10.2f}% {methods['Method2_REV']:>13.2f}%")
        print(f"{'Method 3: Next Est Annual vs Cur Est Annual':<50} {methods['Method3_EPS']:>10.2f}% {methods['Method3_REV']:>13.2f}%")
        print(f"{'Method 4: Next Est Annual vs Cur Hybrid Annual':<50} {methods['Method4_EPS']:>10.2f}% {methods['Method4_REV']:>13.2f}%")
    
    def _print_summary_comparison(self, results: Dict[str, Any]):
        """Print summary comparison across all stocks."""
        print(f"\n{'='*100}")
        print(f"SUMMARY COMPARISON ACROSS ALL STOCKS")
        print(f"{'='*100}")
        
        # Create summary table
        print(f"{'Stock':<8} {'Current Year EPS Growth':<20} {'Forward P/E (Avg)':<18} {'Next Year EPS Growth':<20}")
        print("-" * 100)
        
        for ticker, data in results.items():
            if 'error' in data:
                print(f"{ticker:<8} {'ERROR':<20} {'ERROR':<18} {'ERROR':<20}")
                continue
            
            # Current year EPS growth (average of methods)
            current_year_eps = data['current_year']['methods']
            avg_current_eps = (current_year_eps['Method1_EPS'] + current_year_eps['Method2_EPS'] + 
                             current_year_eps['Method3_EPS'] + current_year_eps['Method4_EPS']) / 4
            
            # Forward PE (average of methods)
            forward_pe = data['forward_pe']['forward_pe_ratios']
            avg_forward_pe = (forward_pe['Method1_PE'] + forward_pe['Method2_PE'] + 
                            forward_pe['Method3_PE'] + forward_pe['Method4_PE'] + 
                            forward_pe['Method5_PE'] + forward_pe['Method6_PE'] + 
                            forward_pe['Method7_PE']) / 7
            
            # Next year EPS growth (average of methods)
            next_year_eps = data['next_year']['methods']
            avg_next_eps = (next_year_eps['Method1_EPS'] + next_year_eps['Method2_EPS'] + 
                          next_year_eps['Method3_EPS'] + next_year_eps['Method4_EPS']) / 4
            
            print(f"{ticker:<8} {avg_current_eps:>18.2f}% {avg_forward_pe:>16.2f}x {avg_next_eps:>18.2f}%")
        
        print(f"{'='*100}")
    


def main():
    """Main function to run comprehensive analysis."""
    # Configuration
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"  # Not used when using mock data
    
    # List of stocks to analyze
    STOCKS_TO_ANALYZE = [
        'CRM'
    ]
    
    print("🚀 COMPREHENSIVE FINANCIAL ANALYSIS DASHBOARD")
    print("=" * 60)
    print("This script combines:")
    print("• Current Year Growth Analysis (4 methods)")
    print("• Forward P/E Analysis (7 methods)")
    print("• Next Year Growth Analysis (4 methods)")
    print("=" * 60)
    
    # Initialize analyzer
    analyzer = ComprehensiveFinancialAnalyzer(API_KEY)
    
    # Perform analysis
    results = analyzer.analyze_multiple_stocks(STOCKS_TO_ANALYZE)
    
    print(f"\n✅ Analysis complete for {len(STOCKS_TO_ANALYZE)} stocks!")


if __name__ == "__main__":
    main()
