import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv('.env')

# Get FMP API key from environment
FMP_API_KEY = os.getenv("FMP_API_KEY")
if not FMP_API_KEY:
    raise ValueError("FMP_API_KEY environment variable is required. Please set it in .env file.")

# List of stocks to fetch data for
STOCKS = [
    "AAPL", "META", "GOOG", "AMZN", "CELH", "ELF", "FUBO", "NVDA", 
    "SOFI", "ADBE", "PLTR", "TSLA", "PYPL", "AMD", "NKE", "SHOP", 
    "CAKE", "WYNN", "GOOGL", "MSFT"
]

# FMP API endpoints
FMP_ENDPOINTS = {
    "analyst-estimates": {
        "url": "https://financialmodelingprep.com/api/v3/analyst-estimates",
        "use_path_param": True,
        "params": {"period": "quarter", "apikey": FMP_API_KEY}
    },
    "income-statement": {
        "url": "https://financialmodelingprep.com/stable/income-statement",
        "use_path_param": False,
        "params": {"period": "quarter", "limit": "40", "apikey": FMP_API_KEY}
    },
    "cash-flow-statement": {
        "url": "https://financialmodelingprep.com/api/v3/cash-flow-statement",
        "use_path_param": True,
        "params": {"period": "quarter", "limit": "50", "apikey": FMP_API_KEY}
    },
    "profile": {
        "url": "https://financialmodelingprep.com/api/v3/profile",
        "use_path_param": True,
        "params": {"apikey": FMP_API_KEY}
    }
}

def create_mock_directories():
    """Create the mock directory structure"""
    base_dir = "mocks"
    endpoints = ["analyst-estimates", "income-statement", "cash-flow-statement", "profile"]
    
    for endpoint in endpoints:
        endpoint_dir = os.path.join(base_dir, endpoint)
        os.makedirs(endpoint_dir, exist_ok=True)
        print(f"Created directory: {endpoint_dir}")

def fetch_api_data(endpoint_name, ticker):
    """Fetch data from FMP API for a specific endpoint and ticker"""
    endpoint_config = FMP_ENDPOINTS[endpoint_name]
    params = endpoint_config['params'].copy()
    
    # Add ticker to params for endpoints that use query parameters
    if not endpoint_config['use_path_param']:
        params['symbol'] = ticker
        url = endpoint_config['url']
    else:
        # Use path parameter for endpoints that support it
        url = f"{endpoint_config['url']}/{ticker}"
    
    try:
        print(f"Fetching {endpoint_name} data for {ticker}...")
        print(f"URL: {url}")
        print(f"Params: {params}")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Add metadata
        result = {
            "ticker": ticker,
            "endpoint": endpoint_name,
            "fetched_at": datetime.now().isoformat(),
            "data": data
        }
        
        print(f"✅ Successfully fetched {endpoint_name} data for {ticker}")
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed for {ticker} {endpoint_name}: {e}")
        return {
            "ticker": ticker,
            "endpoint": endpoint_name,
            "fetched_at": datetime.now().isoformat(),
            "error": str(e),
            "data": None
        }
    except Exception as e:
        print(f"❌ Unexpected error for {ticker} {endpoint_name}: {e}")
        return {
            "ticker": ticker,
            "endpoint": endpoint_name,
            "fetched_at": datetime.now().isoformat(),
            "error": str(e),
            "data": None
        }

def save_mock_data(endpoint_name, ticker, data):
    """Save mock data to JSON file"""
    filename = f"mocks/{endpoint_name}/{ticker}.json"
    
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"💾 Saved {filename}")
    except Exception as e:
        print(f"❌ Failed to save {filename}: {e}")

def main():
    """Main function to fetch and save all FMP API data"""
    print("🚀 Starting FMP API data collection for mock files...")
    print(f"📊 Fetching data for {len(STOCKS)} stocks")
    print(f"🔑 Using API key: {FMP_API_KEY[:10]}...")
    print()
    
    # Create directory structure
    create_mock_directories()
    print()
    
    # Track statistics
    total_requests = len(STOCKS) * len(FMP_ENDPOINTS)
    successful_requests = 0
    failed_requests = 0
    
    # Fetch data for each stock and endpoint
    for ticker in STOCKS:
        print(f"📈 Processing {ticker}...")
        
        for endpoint_name in FMP_ENDPOINTS.keys():
            # Fetch data
            data = fetch_api_data(endpoint_name, ticker)
            
            # Save to file
            save_mock_data(endpoint_name, ticker, data)
            
            # Update statistics
            if data.get("error") is None:
                successful_requests += 1
            else:
                failed_requests += 1
            
            print()  # Add spacing between requests
        
        print(f"✅ Completed {ticker}")
        print("-" * 50)
    
    # Print summary
    print("🎉 Data collection completed!")
    print(f"📊 Total requests: {total_requests}")
    print(f"✅ Successful: {successful_requests}")
    print(f"❌ Failed: {failed_requests}")
    print(f"📁 Mock files saved to: api/mocks/")
    
    # Create a summary file
    summary = {
        "generated_at": datetime.now().isoformat(),
        "total_stocks": len(STOCKS),
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "stocks": STOCKS,
        "endpoints": list(FMP_ENDPOINTS.keys())
    }
    
    with open("mocks/summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"📋 Summary saved to: api/mocks/summary.json")

if __name__ == "__main__":
    main()