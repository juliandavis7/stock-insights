"""Constants for metrics calculations."""

# Quarters for TTM calculations
QUARTERS_FOR_TTM = 4
QUARTERS_FOR_COMPARISON = 8

# Current year calculation
CURRENT_YEAR_OFFSET = 0
NEXT_YEAR_OFFSET = 1
PREVIOUS_YEAR_OFFSET = -1
TWO_YEAR_FORWARD_OFFSET = 2

# Percentage calculations
PERCENTAGE_MULTIPLIER = 100

# Rounding precision
GROWTH_PRECISION = 2
RATIO_PRECISION = 4

# Minimum data requirements
MIN_QUARTERS_FOR_GROWTH = 8
MIN_QUARTERS_FOR_TTM = 4

# Default metric values
DEFAULT_METRIC_VALUE = None

# FMP API field names
FMP_ESTIMATED_EPS_AVG = 'estimatedEpsAvg'
FMP_ESTIMATED_REVENUE_AVG = 'estimatedRevenueAvg'

# Financial statement field names
REVENUE_FIELD = 'revenue'
COST_OF_REVENUE_FIELD = 'costOfRevenue'
NET_INCOME_FIELD = 'netIncome'
EPS_FIELD = 'eps'

# Stock info field names
CURRENT_PRICE_FIELD = 'current_price'
MARKET_CAP_FIELD = 'market_cap'
SHARES_OUTSTANDING_FIELD = 'shares_outstanding'

# Metric result keys
TTM_PE_KEY = 'ttm_pe'
FORWARD_PE_KEY = 'forward_pe'
TWO_YEAR_FORWARD_PE_KEY = 'two_year_forward_pe'
TTM_EPS_GROWTH_KEY = 'ttm_eps_growth'
CURRENT_YEAR_EPS_GROWTH_KEY = 'current_year_eps_growth'
NEXT_YEAR_EPS_GROWTH_KEY = 'next_year_eps_growth'
TTM_REVENUE_GROWTH_KEY = 'ttm_revenue_growth'
CURRENT_YEAR_REVENUE_GROWTH_KEY = 'current_year_revenue_growth'
NEXT_YEAR_REVENUE_GROWTH_KEY = 'next_year_revenue_growth'
GROSS_MARGIN_KEY = 'gross_margin'
NET_MARGIN_KEY = 'net_margin'
TTM_PS_RATIO_KEY = 'ttm_ps_ratio'
FORWARD_PS_RATIO_KEY = 'forward_ps_ratio'
TICKER_KEY = 'ticker'
PRICE_KEY = 'price'
MARKET_CAP_KEY = 'market_cap'