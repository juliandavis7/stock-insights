import requests
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class NextYearFinancialCalculator:
    """
    Calculate next year EPS and revenue growth using 5 different methods:
    Method 1: Next Year Estimates Quarterly vs Current Year Hybrid Quarterly
    Method 1A: GAAP-Adj Hybrid (Absolute Difference)
    Method 1B: GAAP-Adj Hybrid (Ratio-Based)
    Method 1C: GAAP-Adj Hybrid (Median-Based)
    Method 2: Estimates-Only Quarterly (Next Year vs Current Year)
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://financialmodelingprep.com"
        
        # Check if we should use mock data
        self.use_mock_data = os.getenv("FMP_SERVER", "True").lower() == "false"
        
        # Mock data mode is configured via FMP_SERVER environment variable
    
    def _load_mock_data(self, endpoint: str, ticker: str) -> Optional[List[Dict]]:
        """Load mock data from JSON file"""
        try:
            # Construct file path relative to the api directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            api_dir = os.path.dirname(current_dir)  # Go up one level from scripts/ to api/
            file_path = os.path.join(api_dir, "mocks", endpoint, f"{ticker.upper()}.json")
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r') as f:
                mock_data = json.load(f)
            
            # Check if there was an error when the data was originally fetched
            if mock_data.get("error"):
                return None
            
            data = mock_data.get("data", [])
            return data
            
        except Exception as e:
            return None
    
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
        # Use mock data if configured
        if self.use_mock_data:
            mock_data = self._load_mock_data("income-statement", ticker)
            if mock_data is not None:
                return mock_data
            return []
        
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
        # Use mock data if configured
        if self.use_mock_data:
            mock_data = self._load_mock_data("analyst-estimates/quarterly", ticker)
            if mock_data is not None:
                return mock_data
            return []
        
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
    
    
    
    def filter_data_by_fiscal_year(self, data: List[Dict], target_fiscal_year: int) -> List[Dict]:
        """
        Filter data to include the correct fiscal year quarters using flexible month-based logic.
        Works with different company fiscal calendars by grouping quarters by reporting month.
        
        For fiscal year 2025, includes quarters reported in:
        - Q1 2025: Jan-Apr 2025 (e.g., CRM: 04-30, AAPL: 03-28)
        - Q2 2025: May-Jul 2025 (e.g., CRM: 07-31, AAPL: 06-28)
        - Q3 2025: Aug-Oct 2025 (e.g., CRM: 10-31, AAPL: 09-28)
        - Q4 2025: Nov 2025-Mar 2026 (e.g., CRM: 01-31, AAPL: 12-28)
        """
        filtered = []
        quarters_found = {'Q1': [], 'Q2': [], 'Q3': [], 'Q4': []}
        
        for item in data:
            date_str = item['date']
            year = int(date_str.split('-')[0])
            month = int(date_str.split('-')[1])
            
            # Map reporting months to fiscal quarters
            if year == target_fiscal_year:
                if month in [1, 2, 3, 4]:  # Q1 reporting period
                    quarters_found['Q1'].append(item)
                elif month in [5, 6, 7]:  # Q2 reporting period
                    quarters_found['Q2'].append(item)
                elif month in [8, 9, 10]:  # Q3 reporting period
                    quarters_found['Q3'].append(item)
                elif month in [11, 12]:  # Q4 reporting period (partial)
                    quarters_found['Q4'].append(item)
            elif year == target_fiscal_year + 1:
                if month in [1, 2, 3]:  # Q4 reporting period (continued)
                    quarters_found['Q4'].append(item)
        
        # Take the most recent entry for each quarter (in case of duplicates)
        for quarter_key in ['Q1', 'Q2', 'Q3', 'Q4']:
            if quarters_found[quarter_key]:
                # Sort by date and take the most recent
                quarters_found[quarter_key].sort(key=lambda x: x['date'], reverse=True)
                filtered.append(quarters_found[quarter_key][0])
        
        # Sort by date to get quarters in chronological order
        filtered.sort(key=lambda x: x['date'])
        return filtered
    
    def get_quarterly_actual_data(self, ticker: str, target_year: int, num_quarters: int = 4) -> Tuple[float, float]:
        """Get actual EPS and revenue for quarters in target year"""
        income_data = self.fetch_quarterly_income_statement(ticker)
        year_data = self.filter_data_by_fiscal_year(income_data, target_year)
        
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('eps', 0) for q in quarters)
        total_revenue = sum(q.get('revenue', 0) for q in quarters)
        
        return total_eps, total_revenue
    
    def get_quarterly_estimates_data(self, ticker: str, target_year: int, num_quarters: int = 4) -> Tuple[float, float]:
        """Get estimated EPS and revenue for quarters in target year"""
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        year_data = self.filter_data_by_fiscal_year(estimates_data, target_year)
        
        quarters = year_data[:num_quarters]
        total_eps = sum(q.get('estimatedEpsAvg', 0) for q in quarters)
        total_revenue = sum(q.get('estimatedRevenueAvg', 0) for q in quarters)
        
        return total_eps, total_revenue
    
    
    def get_hybrid_current_year_data(self, ticker: str, target_year: int) -> Tuple[float, float]:
        """Get hybrid current year data (actual + estimates)"""
        quarters_elapsed = self.get_quarters_elapsed_in_year(target_year)
        
        # Get all quarters data
        actual_data = self.fetch_quarterly_income_statement(ticker)
        actual_quarters = self.filter_data_by_fiscal_year(actual_data, target_year)
        
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        estimate_quarters = self.filter_data_by_fiscal_year(estimates_data, target_year)
        
        total_eps = 0
        total_revenue = 0
        
        # Process each quarter (Q1, Q2, Q3, Q4)
        for i in range(4):
            if i < quarters_elapsed:
                # Use actual data for completed quarters
                if i < len(actual_quarters):
                    quarter = actual_quarters[i]
                    total_eps += quarter.get('eps', 0)
                    total_revenue += quarter.get('revenue', 0)
                else:
                    # Fallback to estimates if actual not available
                    if i < len(estimate_quarters):
                        quarter = estimate_quarters[i]
                        total_eps += quarter.get('estimatedEpsAvg', 0)
                        total_revenue += quarter.get('estimatedRevenueAvg', 0)
            else:
                # Use estimated data for remaining quarters
                if i < len(estimate_quarters):
                    quarter = estimate_quarters[i]
                    total_eps += quarter.get('estimatedEpsAvg', 0)
                    total_revenue += quarter.get('estimatedRevenueAvg', 0)
        
        return total_eps, total_revenue
    
    def calculate_gaap_estimate_difference(self, ticker: str) -> float:
        """
        Calculate the average difference between actual (GAAP) and estimated (non-GAAP) EPS
        using the latest 4 quarters of actual data to adjust for GAAP vs non-GAAP differences.
        """
        # Get all actual quarterly data
        actual_data = self.fetch_quarterly_income_statement(ticker)
        # Get all estimates data
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        
        differences = []
        
        # Get the latest 4 quarters of actual data
        if actual_data:
            # Sort by date to get most recent first
            actual_data_sorted = sorted(actual_data, key=lambda x: x['date'], reverse=True)
            
            # Take the latest 4 quarters
            latest_actual_quarters = actual_data_sorted[:4]
            
            for actual_quarter in latest_actual_quarters:
                actual_date = actual_quarter['date']
                actual_eps = actual_quarter.get('eps', 0)
                
                # Find corresponding estimate for the same date
                matching_estimate = None
                for est_quarter in estimates_data:
                    if est_quarter['date'] == actual_date:
                        matching_estimate = est_quarter
                        break
                
                if matching_estimate and actual_eps != 0:
                    estimated_eps = matching_estimate.get('estimatedEpsAvg', 0)
                    if estimated_eps != 0:
                        # Calculate absolute difference
                        difference = abs(estimated_eps - actual_eps)
                        differences.append(difference)
        
        # Return average difference, or 0 if no data available
        if differences:
            avg_difference = sum(differences) / len(differences)
            return avg_difference
        else:
            return 0.0
    
    def calculate_gaap_estimate_ratio(self, ticker: str) -> float:
        """
        Calculate the average ratio between actual (GAAP) and estimated (non-GAAP) EPS
        using the latest 4 quarters of actual data to adjust for GAAP vs non-GAAP differences using proportional scaling.
        """
        # Get all actual quarterly data
        actual_data = self.fetch_quarterly_income_statement(ticker)
        # Get all estimates data
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        
        ratios = []
        
        # Get the latest 4 quarters of actual data
        if actual_data:
            # Sort by date to get most recent first
            actual_data_sorted = sorted(actual_data, key=lambda x: x['date'], reverse=True)
            
            # Take the latest 4 quarters
            latest_actual_quarters = actual_data_sorted[:4]
            
            for actual_quarter in latest_actual_quarters:
                actual_date = actual_quarter['date']
                actual_eps = actual_quarter.get('eps', 0)
                
                # Find corresponding estimate for the same date
                matching_estimate = None
                for est_quarter in estimates_data:
                    if est_quarter['date'] == actual_date:
                        matching_estimate = est_quarter
                        break
                
                if matching_estimate and actual_eps > 0:
                    estimated_eps = matching_estimate.get('estimatedEpsAvg', 0)
                    if estimated_eps > 0:
                        # Calculate ratio (actual / estimate)
                        ratio = actual_eps / estimated_eps
                        ratios.append(ratio)
        
        # Return average ratio, or 1.0 if no data available (no adjustment)
        if ratios:
            avg_ratio = sum(ratios) / len(ratios)
            return avg_ratio
        else:
            return 1.0
    
    def get_gaap_adjusted_hybrid_data_absolute(self, ticker: str, current_year: int, next_year: int) -> Tuple[Tuple[float, float], Tuple[float, float]]:
        """
        Get GAAP-adjusted data for both current year hybrid and next year estimates using absolute difference method.
        Returns: ((current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue))
        """
        # Calculate GAAP vs estimate difference using latest 4 quarters of actual data
        avg_gaap_difference = self.calculate_gaap_estimate_difference(ticker)
        
        # Get current year hybrid data
        current_hybrid_eps, current_hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        
        # Get next year estimates
        next_quarterly_est_eps, next_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, next_year, 4)
        
        # Apply GAAP adjustment (subtract average difference from estimates)
        # For current year hybrid, we need to adjust only the estimated portions
        quarters_elapsed = self.get_quarters_elapsed_in_year(current_year)
        
        # Estimate how much of current hybrid is from estimates vs actuals
        if quarters_elapsed < 4:
            # Some quarters are estimates, apply partial adjustment
            estimated_quarters_ratio = (4 - quarters_elapsed) / 4
            current_adj_eps = current_hybrid_eps - (avg_gaap_difference * estimated_quarters_ratio * 4)
        else:
            # All quarters are actuals, no adjustment needed
            current_adj_eps = current_hybrid_eps
        
        # For next year, all are estimates, so apply full adjustment
        next_adj_eps = next_quarterly_est_eps - (avg_gaap_difference * 4)
        
        # Revenue adjustment (minimal for now)
        current_adj_revenue = current_hybrid_revenue
        next_adj_revenue = next_quarterly_est_revenue
        
        return (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue)
    
    def get_gaap_adjusted_hybrid_data_ratio(self, ticker: str, current_year: int, next_year: int) -> Tuple[Tuple[float, float], Tuple[float, float]]:
        """
        Get GAAP-adjusted data for both current year hybrid and next year estimates using ratio-based method.
        Returns: ((current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue))
        """
        # Calculate GAAP vs estimate ratio using latest 4 quarters of actual data
        avg_gaap_ratio = self.calculate_gaap_estimate_ratio(ticker)
        
        # Get current year hybrid data
        current_hybrid_eps, current_hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        
        # Get next year estimates
        next_quarterly_est_eps, next_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, next_year, 4)
        
        # Apply GAAP adjustment (multiply estimates by average ratio)
        # For current year hybrid, we need to adjust only the estimated portions
        quarters_elapsed = self.get_quarters_elapsed_in_year(current_year)
        
        if quarters_elapsed < 4:
            # Some quarters are estimates, apply proportional adjustment
            # Get the actual and estimated components separately
            actual_data = self.fetch_quarterly_income_statement(ticker)
            actual_quarters = self.filter_data_by_fiscal_year(actual_data, current_year)
            
            estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
            estimate_quarters = self.filter_data_by_fiscal_year(estimates_data, current_year)
            
            actual_eps_sum = 0
            estimated_eps_sum = 0
            
            for i in range(4):
                if i < quarters_elapsed:
                    # Use actual data for completed quarters
                    if i < len(actual_quarters):
                        actual_eps_sum += actual_quarters[i].get('eps', 0)
                    else:
                        # Fallback to estimates if actual not available
                        if i < len(estimate_quarters):
                            estimated_eps_sum += estimate_quarters[i].get('estimatedEpsAvg', 0)
                else:
                    # Use estimated data for remaining quarters
                    if i < len(estimate_quarters):
                        estimated_eps_sum += estimate_quarters[i].get('estimatedEpsAvg', 0)
            
            # Apply ratio adjustment only to estimated portion
            current_adj_eps = actual_eps_sum + (estimated_eps_sum * avg_gaap_ratio)
        else:
            # All quarters are actuals, no adjustment needed
            current_adj_eps = current_hybrid_eps
        
        # For next year, all are estimates, so apply full ratio adjustment
        next_adj_eps = next_quarterly_est_eps * avg_gaap_ratio
        
        # Revenue adjustment (minimal for now)
        current_adj_revenue = current_hybrid_revenue
        next_adj_revenue = next_quarterly_est_revenue
        
        return (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue)
    
    def calculate_gaap_estimate_median_ratio(self, ticker: str) -> float:
        """
        Calculate the median ratio between actual (GAAP) and estimated (non-GAAP) EPS
        using the latest 4 quarters of actual data to adjust for GAAP vs non-GAAP differences using median-based scaling.
        The median is more robust to outliers than the average.
        """
        print(f"\n🔍 Calculating GAAP median ratio for {ticker} using latest 4 quarters:")
        
        # Get all actual quarterly data
        actual_data = self.fetch_quarterly_income_statement(ticker)
        # Get all estimates data
        estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
        
        ratios = []
        
        # Get the latest 4 quarters of actual data
        if actual_data:
            # Sort by date to get most recent first
            actual_data_sorted = sorted(actual_data, key=lambda x: x['date'], reverse=True)
            
            # Take the latest 4 quarters
            latest_actual_quarters = actual_data_sorted[:4]
            print(f"  Found {len(latest_actual_quarters)} latest actual quarters")
            
            for i, actual_quarter in enumerate(latest_actual_quarters):
                actual_date = actual_quarter['date']
                actual_eps = actual_quarter.get('eps', 0)
                
                # Find corresponding estimate for the same date
                matching_estimate = None
                for est_quarter in estimates_data:
                    if est_quarter['date'] == actual_date:
                        matching_estimate = est_quarter
                        break
                
                if matching_estimate:
                    estimated_eps = matching_estimate.get('estimatedEpsAvg', 0)
                    print(f"  {actual_date}: Actual={actual_eps:.4f}, Estimate={estimated_eps:.4f}", end="")
                    
                    # Calculate ratio (actual / estimate) if both values are positive
                    if actual_eps > 0 and estimated_eps > 0:
                        ratio = actual_eps / estimated_eps
                        ratios.append(ratio)
                        print(f" → Ratio={ratio:.4f}")
                    elif actual_eps != 0 or estimated_eps != 0:
                        print(f" → Skipped (one value is 0 or negative)")
                    else:
                        print(f" → Skipped (both values are 0)")
                else:
                    print(f"  {actual_date}: Actual={actual_eps:.4f}, No matching estimate found")
        
        # Return median ratio, or 1.0 if no data available (no adjustment)
        if ratios:
            # Sort ratios and find median
            ratios.sort()
            n = len(ratios)
            print(f"  📊 Sorted ratios: {[f'{r:.4f}' for r in ratios]}")
            
            if n % 2 == 0:
                # Even number of ratios - average of two middle values
                median_ratio = (ratios[n//2 - 1] + ratios[n//2]) / 2
                print(f"  📈 Median (even count): ({ratios[n//2 - 1]:.4f} + {ratios[n//2]:.4f}) / 2 = {median_ratio:.4f}")
            else:
                # Odd number of ratios - middle value
                median_ratio = ratios[n//2]
                print(f"  📈 Median (odd count): {median_ratio:.4f} (middle value)")
            
            return median_ratio
        else:
            print(f"  ⚠️  No valid ratios found, using default 1.0")
            return 1.0
    
    def get_gaap_adjusted_hybrid_data_median(self, ticker: str, current_year: int, next_year: int) -> Tuple[Tuple[float, float], Tuple[float, float]]:
        """
        Get GAAP-adjusted data for both current year hybrid and next year estimates using median-based method.
        Returns: ((current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue))
        """
        print(f"\n=== METHOD 1C DEBUG: GAAP-Adj Hybrid (Median-Based) for {ticker} ===")
        
        # Calculate GAAP vs estimate median ratio using latest 4 quarters of actual data
        print(f"📊 Using latest 4 quarters of actual data for GAAP median ratio calculation")
        
        median_gaap_ratio = self.calculate_gaap_estimate_median_ratio(ticker)
        print(f"📈 Median GAAP ratio (actual/estimate): {median_gaap_ratio:.4f}")
        
        # Get current year hybrid data
        current_hybrid_eps, current_hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        print(f"💰 Current year ({current_year}) hybrid EPS: {current_hybrid_eps:.4f}")
        
        # Get next year estimates
        next_quarterly_est_eps, next_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, next_year, 4)
        print(f"🔮 Next year ({next_year}) estimated EPS: {next_quarterly_est_eps:.4f}")
        
        # Apply GAAP adjustment (multiply estimates by median ratio)
        # For current year hybrid, we need to adjust only the estimated portions
        quarters_elapsed = self.get_quarters_elapsed_in_year(current_year)
        print(f"📅 Quarters elapsed in {current_year}: {quarters_elapsed}")
        
        if quarters_elapsed < 4:
            print(f"🔄 Applying partial adjustment (some quarters are estimates)")
            # Some quarters are estimates, apply proportional adjustment
            # Get the actual and estimated components separately
            actual_data = self.fetch_quarterly_income_statement(ticker)
            actual_quarters = self.filter_data_by_fiscal_year(actual_data, current_year)
            
            estimates_data = self.fetch_quarterly_analyst_estimates(ticker)
            estimate_quarters = self.filter_data_by_fiscal_year(estimates_data, current_year)
            
            actual_eps_sum = 0
            estimated_eps_sum = 0
            current_adj_eps = 0
            
            print(f"📋 Breaking down current year quarters:")
            for i in range(4):
                quarter_name = f"Q{i+1}"
                if i < quarters_elapsed and i < len(actual_quarters):
                    # Use actual data for completed quarters where actual data exists
                    quarter_eps = actual_quarters[i].get('eps', 0)
                    current_adj_eps += quarter_eps
                    actual_eps_sum += quarter_eps
                    print(f"  {quarter_name}: {quarter_eps:.4f} (actual)")
                else:
                    # Use median-adjusted estimated data for all other quarters (future or missing actual)
                    if i < len(estimate_quarters):
                        estimated_eps = estimate_quarters[i].get('estimatedEpsAvg', 0)
                        
                        # Adjust EPS by multiplying with median GAAP ratio
                        adjusted_eps = estimated_eps * median_gaap_ratio
                        
                        current_adj_eps += adjusted_eps
                        estimated_eps_sum += estimated_eps
                        print(f"  {quarter_name}: {estimated_eps:.4f} × {median_gaap_ratio:.4f} = {adjusted_eps:.4f} (median-adjusted estimate)")
            
            print(f"📊 Actual EPS sum: {actual_eps_sum:.4f}")
            print(f"📊 Estimated EPS sum (before adjustment): {estimated_eps_sum:.4f}")
            print(f"📊 Estimated EPS sum × Median GAAP ratio: {estimated_eps_sum:.4f} × {median_gaap_ratio:.4f} = {estimated_eps_sum * median_gaap_ratio:.4f}")
            print(f"🎯 Total adjusted current year EPS: {current_adj_eps:.4f}")
        else:
            # All quarters are actuals, no adjustment needed
            current_adj_eps = current_hybrid_eps
            print(f"✅ All quarters are actuals, no adjustment needed: {current_adj_eps:.4f}")
        
        # For next year, all are estimates, so apply full median ratio adjustment
        next_adj_eps = next_quarterly_est_eps * median_gaap_ratio
        print(f"🔮 Next year adjusted EPS: {next_quarterly_est_eps:.4f} × {median_gaap_ratio:.4f} = {next_adj_eps:.4f}")
        
        # Calculate growth rate for debugging
        if current_adj_eps != 0:
            growth_rate = ((next_adj_eps - current_adj_eps) / abs(current_adj_eps)) * 100
            print(f"📈 Growth calculation: ({next_adj_eps:.4f} - {current_adj_eps:.4f}) / {abs(current_adj_eps):.4f} × 100 = {growth_rate:.2f}%")
        else:
            print(f"⚠️  Cannot calculate growth: current adjusted EPS is 0")
        
        # Revenue adjustment (minimal for now)
        current_adj_revenue = current_hybrid_revenue
        next_adj_revenue = next_quarterly_est_revenue
        
        print(f"=== END METHOD 1C DEBUG ===")
        return (current_adj_eps, current_adj_revenue), (next_adj_eps, next_adj_revenue)
    
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
        
        # Get next year quarterly estimates (used by both methods)
        next_quarterly_est_eps, next_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, next_year, 4)
        
        # === METHOD 1: Next Year Estimates Quarterly vs Current Year Hybrid Quarterly ===
        current_hybrid_eps, current_hybrid_revenue = self.get_hybrid_current_year_data(ticker, current_year)
        
        method1_eps = self.calculate_growth_rate(next_quarterly_est_eps, current_hybrid_eps)
        method1_rev = self.calculate_growth_rate(next_quarterly_est_revenue, current_hybrid_revenue)
        
        # === METHOD 1A: GAAP-Adj Hybrid (Absolute Difference) ===
        (current_adj_abs_eps, current_adj_abs_revenue), (next_adj_abs_eps, next_adj_abs_revenue) = self.get_gaap_adjusted_hybrid_data_absolute(ticker, current_year, next_year)
        
        method1a_eps = self.calculate_growth_rate(next_adj_abs_eps, current_adj_abs_eps)
        method1a_rev = self.calculate_growth_rate(next_adj_abs_revenue, current_adj_abs_revenue)
        
        # === METHOD 1B: GAAP-Adj Hybrid (Ratio-Based) ===
        (current_adj_ratio_eps, current_adj_ratio_revenue), (next_adj_ratio_eps, next_adj_ratio_revenue) = self.get_gaap_adjusted_hybrid_data_ratio(ticker, current_year, next_year)
        
        method1b_eps = self.calculate_growth_rate(next_adj_ratio_eps, current_adj_ratio_eps)
        method1b_rev = self.calculate_growth_rate(next_adj_ratio_revenue, current_adj_ratio_revenue)
        
        # === METHOD 1C: GAAP-Adj Hybrid (Median-Based) ===
        (current_adj_median_eps, current_adj_median_revenue), (next_adj_median_eps, next_adj_median_revenue) = self.get_gaap_adjusted_hybrid_data_median(ticker, current_year, next_year)
        
        method1c_eps = self.calculate_growth_rate(next_adj_median_eps, current_adj_median_eps)
        method1c_rev = self.calculate_growth_rate(next_adj_median_revenue, current_adj_median_revenue)
        
        # === METHOD 2: Estimates-Only Quarterly (Next Year vs Current Year) ===
        current_quarterly_est_eps, current_quarterly_est_revenue = self.get_quarterly_estimates_data(ticker, current_year, 4)
        
        method2_eps = self.calculate_growth_rate(next_quarterly_est_eps, current_quarterly_est_eps)
        method2_rev = self.calculate_growth_rate(next_quarterly_est_revenue, current_quarterly_est_revenue)
        
        return {
            'ticker': ticker,
            'current_year': current_year,
            'next_year': next_year,
            'methods': {
                'Method1_EPS': method1_eps,
                'Method1_REV': method1_rev,
                'Method1A_EPS': method1a_eps,
                'Method1A_REV': method1a_rev,
                'Method1B_EPS': method1b_eps,
                'Method1B_REV': method1b_rev,
                'Method1C_EPS': method1c_eps,
                'Method1C_REV': method1c_rev,
                'Method2_EPS': method2_eps,
                'Method2_REV': method2_rev
            }
        }
    
    def print_next_year_growth_table(self, ticker: str, current_year: int = None, next_year: int = None):
        """Print a formatted table showing next year growth calculations using 5 methods"""
        if current_year is None:
            current_year = datetime.now().year
        if next_year is None:
            next_year = current_year + 1
        
        results = self.calculate_next_year_growth(ticker, current_year, next_year)
        methods = results['methods']
        
        print(f"\n{ticker} Next Year Growth Analysis ({current_year} → {next_year})")
        print("=" * 90)
        print(f"{'Method':<65} {'EPS Growth':<12} {'Revenue Growth':<12}")
        print("-" * 90)
        print(f"{'Method 1: Next Est Quarter vs Cur Hybrid Quarter':<65} {methods['Method1_EPS']:>10.2f}% {methods['Method1_REV']:>12.2f}%")
        print(f"{'Method 1A: GAAP-Adj Hybrid (Absolute Diff)':<65} {methods['Method1A_EPS']:>10.2f}% {methods['Method1A_REV']:>12.2f}%")
        print(f"{'Method 1B: GAAP-Adj Hybrid (Ratio-Based)':<65} {methods['Method1B_EPS']:>10.2f}% {methods['Method1B_REV']:>12.2f}%")
        print(f"{'Method 1C: GAAP-Adj Hybrid (Median-Based)':<65} {methods['Method1C_EPS']:>10.2f}% {methods['Method1C_REV']:>12.2f}%")
        print(f"{'Method 2: Estimates-Only Quarterly':<65} {methods['Method2_EPS']:>10.2f}% {methods['Method2_REV']:>12.2f}%")
        print("=" * 90)


# Example usage
def main():
    """Example usage of the NextYearFinancialCalculator"""
    API_KEY = "K2vr75nI8NZJboRITYrwzwuHIxMxEHXc"
    
    calculator = NextYearFinancialCalculator(API_KEY)
    
    # Test with multiple tickers
    tickers = ['CRM']
    
    for ticker in tickers:
        try:
            calculator.print_next_year_growth_table(ticker)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")


if __name__ == "__main__":
    main()