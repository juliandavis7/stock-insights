#!/usr/bin/env python3
"""Test script to debug metrics calculation for CRM ticker."""

import logging
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('debug_test.log')
    ]
)

def test_metrics():
    """Test metrics calculation for CRM ticker."""
    try:
        print("🔍 Starting metrics test for CRM...")
        
        # Test individual components first
        print("🔍 Testing FMPDataFetcher...")
        from services.fmp_data_fetcher import FMPDataFetcher
        data_fetcher = FMPDataFetcher()
        data_sources = data_fetcher.fetch_all_data("CRM")
        print(f"🔍 Data sources: {data_sources}")
        
        print("🔍 Testing MetricsCalculator...")
        from services.metrics_calculator import MetricsCalculator
        calculator = MetricsCalculator()
        
        # Test individual calculations
        if data_sources.get('stock_info'):
            print("🔍 Testing P/E calculations...")
            pe_results = calculator.calculate_pe_metrics(
                data_sources['stock_info'], 
                data_sources.get('fmp_estimates'), 
                data_sources.get('quarterly_data')
            )
            print(f"🔍 P/E results: {pe_results}")
        
        print("🔍 Testing full MetricsService...")
        from services.metrics_service import MetricsService
        service = MetricsService()
        result = service.get_metrics("CRM")
        
        print(f"🔍 Final result: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Error in test: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return None

if __name__ == "__main__":
    result = test_metrics()
    if result:
        print("✅ Test completed successfully")
    else:
        print("❌ Test failed")
