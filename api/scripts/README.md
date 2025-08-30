# API Scripts

This folder contains utility scripts for the stock insights API.

## Scripts

### `mock-fmp-json.py`
Main script to fetch and cache FMP API data for mock testing.
- Fetches data for 18+ stocks from FMP API
- Creates JSON mock files in `../mocks/` directory
- Handles analyst estimates, income statements, cash flow, and company profiles
- Usage: `python mock-fmp-json.py`

### `rev-eps.py`
Script to fetch and process revenue and EPS estimates data.
- Fetches analyst estimates for revenue and EPS from FMP API
- Supports both quarterly and TTM (Trailing Twelve Months) calculations
- Calculates TTM estimates by summing 4 quarters of data
- Usage: `python rev-eps.py`

### `cash-flow.py`
Script to fetch and process cash flow statement data.
- Fetches cash flow statements from FMP API
- Calculates operating cash flow and free cash flow metrics
- Supports both quarterly and TTM calculations
- Usage: `python cash-flow.py`

### `margins-op-income.py`
Script to fetch and process income statement data for margins and operating income.
- Fetches income statements from FMP API
- Calculates gross margin, net margin, and operating income
- Supports both quarterly and TTM calculations
- Usage: `python margins-op-income.py`

## Usage

All scripts should be run from the `api/` directory with the virtual environment activated:

```bash
cd api
source venv/bin/activate
python scripts/script_name.py
```

## Notes

- The `mocks/` directory is gitignored to avoid committing large JSON files
- Scripts use relative imports, so they must be run from the correct directory
- Environment variables are loaded from `../.env` file
