"""
Simplified utilities for stock analysis calculations.
All functions in one file for easier debugging and maintenance.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


# =============================================================================
# BASIC METRICS CALCULATIONS
# =============================================================================

def get_ttm_pe(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get trailing twelve months P/E ratio."""
    val = stock_info.get('trailingPE') or stock_info.get('trailing_pe')
    return round(val, 2) if val is not None else None


def get_forward_pe(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get forward P/E ratio.""" 
    val = stock_info.get('forwardPE') or stock_info.get('forward_pe')
    return round(val, 2) if val is not None else None


def get_ttm_ps(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get trailing twelve months price-to-sales ratio."""
    val = stock_info.get('priceToSalesTrailing12Months') or stock_info.get('price_to_sales_ttm')
    return round(val, 2) if val is not None else None


def get_gross_margin(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get gross margin percentage."""
    val = stock_info.get('grossMargins') or stock_info.get('gross_margins')
    return round(val, 2) if val is not None else None


def get_net_margin(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get net margin percentage."""
    val = stock_info.get('profitMargins') or stock_info.get('profit_margins')
    return round(val, 2) if val is not None else None


def get_earnings_growth(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get earnings growth percentage."""
    val = stock_info.get('earningsGrowth')
    if val is not None:
        return round(val * 100, 2)  # Convert to percentage
    
    val = stock_info.get('earnings_growth')  # Already in percentage
    return round(val, 2) if val is not None else None


def get_revenue_growth(stock_info: Dict[str, Any]) -> Optional[float]:
    """Get revenue growth percentage."""
    val = stock_info.get('revenueGrowth')
    if val is not None:
        return round(val * 100, 2)  # Convert to percentage
    
    val = stock_info.get('revenue_growth')  # Already in percentage
    return round(val, 2) if val is not None else None


# =============================================================================
# DATA EXTRACTION FUNCTIONS
# =============================================================================

def extract_metric_by_year(fmp_data: List[Dict[str, Any]], metric: str) -> Dict[str, float]:
    """Extract metric from FMP data organized by year."""
    if not fmp_data or not isinstance(fmp_data, list):
        return {}
    
    result = {}
    for item in fmp_data:
        if not isinstance(item, dict):
            continue
        
        try:
            date_str = item.get('date', '')
            if not date_str:
                continue
            
            year = date_str.split('-')[0]
            metric_value = item.get(metric)
            
            if metric_value is not None:
                result[year] = float(metric_value)
                
        except (ValueError, IndexError):
            continue
    
    return result


def extract_forecast_growth(forecast_data: Any, period: str) -> Optional[float]:
    """Extract growth rate from forecast data."""
    try:
        if hasattr(forecast_data, 'loc'):
            growth_value = forecast_data.loc[period, 'growth']
            return round(float(growth_value) * 100, 2)
        return None
    except (KeyError, IndexError, AttributeError, ValueError, TypeError):
        return None


# =============================================================================
# PROJECTION CALCULATIONS
# =============================================================================

def calculate_projected_revenue(base_revenue: float, growth_rate: float, years: int = 1) -> float:
    """Calculate projected revenue based on growth rate."""
    return base_revenue * ((1 + growth_rate) ** years)


def calculate_projected_net_income(base_net_income: float, growth_rate: float, years: int = 1) -> float:
    """Calculate projected net income based on growth rate."""
    return base_net_income * ((1 + growth_rate) ** years)


def calculate_eps(net_income: float, shares_outstanding: float) -> float:
    """Calculate earnings per share."""
    if shares_outstanding <= 0:
        raise ValueError("Shares outstanding must be positive")
    return net_income / shares_outstanding


def calculate_stock_price_range(eps: float, pe_low: float, pe_high: float) -> Dict[str, float]:
    """Calculate stock price range based on EPS and P/E ratios."""
    return {
        'low': eps * pe_low,
        'high': eps * pe_high
    }


def calculate_cagr(initial_value: float, final_value: float, years: int) -> float:
    """Calculate Compound Annual Growth Rate."""
    if initial_value <= 0 or years <= 0:
        raise ValueError("Initial value and years must be positive")
    return ((final_value / initial_value) ** (1 / years)) - 1


# =============================================================================
# ADVANCED CALCULATIONS
# =============================================================================

def get_forward_ps_ratio(stock_info: Dict[str, Any], revenue_forecast: Any) -> Optional[float]:
    """Calculate forward price-to-sales ratio."""
    try:
        market_cap = stock_info.get('marketCap') or stock_info.get('market_cap')
        if market_cap is None:
            return None
        
        next_year_growth = extract_forecast_growth(revenue_forecast, '+1y')
        if next_year_growth is None:
            return None
        
        current_revenue = stock_info.get('totalRevenue') or stock_info.get('total_revenue')
        if current_revenue is None:
            return None
        
        forward_revenue = current_revenue * (1 + next_year_growth / 100)
        forward_ps = market_cap / forward_revenue
        
        return round(forward_ps, 2)
        
    except (TypeError, ZeroDivisionError):
        return None


def get_two_year_forward_pe(ticker: str, current_price: float, fmp_data: List[Dict[str, Any]]) -> Optional[float]:
    """Calculate two-year forward P/E ratio using FMP estimates."""
    try:
        current_year = datetime.now().year
        target_year = str(current_year + 2)
        
        eps_by_year = extract_metric_by_year(fmp_data, 'epsAvg')
        
        if target_year not in eps_by_year:
            return None
        
        target_eps = eps_by_year[target_year]
        if target_eps <= 0:
            return None
        
        return round(current_price / target_eps, 2)
        
    except (KeyError, ValueError, ZeroDivisionError):
        return None


# =============================================================================
# SERVICE FUNCTIONS (Main API Functions)
# =============================================================================

def get_metrics(ticker: str) -> Dict[str, Any]:
    """Get comprehensive stock metrics for a ticker."""
    from .services.metrics_service import MetricsService
    service = MetricsService()
    return service.get_metrics(ticker)


def fetch_fmp_analyst_estimates(ticker: str, api_key: str = None) -> List[Dict[str, Any]]:
    """Fetch FMP analyst estimates for a ticker."""
    from .services.fmp_service import FMPService
    from .constants import FMP_API_KEY
    
    service = FMPService(api_key or FMP_API_KEY)
    return service.fetch_analyst_estimates(ticker)


def calculate_financial_projections(
    ticker: str,
    api_key: str,
    projection_inputs: Dict[int, Dict[str, float]],
    shares_outstanding: Optional[float] = None,
    current_stock_price: Optional[float] = None,
    current_year_data: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """Calculate financial projections for a stock."""
    from .services.projection_service import ProjectionService
    
    service = ProjectionService()
    return service.calculate_financial_projections(
        ticker=ticker,
        api_key=api_key,
        projection_inputs=projection_inputs,
        shares_outstanding=shares_outstanding,
        current_stock_price=current_stock_price,
        current_year_data=current_year_data
    )


def fetch_chart_data(ticker: str, api_key: str = None) -> Optional[Dict[str, Any]]:
    """
    Fetch chart data (quarterly revenue and EPS estimates) for a ticker.
    
    Args:
        ticker: Stock ticker symbol
        api_key: Optional FMP API key (uses default if not provided)
        
    Returns:
        Dictionary with ticker, quarters, revenue, and eps arrays or None if failed
    """
    from .services.fmp_service import FMPService
    from .constants import FMP_API_KEY
    
    service = FMPService(api_key or FMP_API_KEY)
    return service.fetch_chart_data(ticker)

def fetch_enhanced_chart_data(ticker: str, api_key: str = None) -> Optional[Dict[str, Any]]:
    """
    Fetch enhanced chart data including revenue, EPS estimates and historical financial metrics.
    Combines projected data with historical financial metrics and pads with nulls for consistency.
    
    Args:
        ticker: Stock ticker symbol
        api_key: Optional FMP API key (uses default if not provided)
        
    Returns:
        Dictionary with ticker, quarters, revenue, eps, gross_margin, net_margin, operating_income arrays or None if failed
    """
    from .services.fmp_service import FMPService
    from .constants import FMP_API_KEY
    
    service = FMPService(api_key or FMP_API_KEY)
    
    # Fetch projected data (revenue and EPS)
    projected_data = service.fetch_chart_data(ticker)
    if not projected_data:
        return None
        
    # Fetch historical financial metrics
    historical_data = service.fetch_historical_financials(ticker)
    if not historical_data:
        return None
    
    # Get the projected quarters as the master list
    projected_quarters = projected_data.get('quarters', [])
    historical_quarters = historical_data.get('quarters', [])
    
    # Create dictionaries for quick lookup of historical data
    historical_gross_margin = {q: v for q, v in zip(historical_quarters, historical_data.get('gross_margin', []))}
    historical_net_margin = {q: v for q, v in zip(historical_quarters, historical_data.get('net_margin', []))}
    historical_operating_income = {q: v for q, v in zip(historical_quarters, historical_data.get('operating_income', []))}
    
    # The alignment should now work correctly with fiscal-to-calendar quarter mapping
    
    # Build aligned arrays with nulls for missing historical data
    gross_margin_aligned = []
    net_margin_aligned = []
    operating_income_aligned = []
    
    for quarter in projected_quarters:
        gross_margin_aligned.append(historical_gross_margin.get(quarter))
        net_margin_aligned.append(historical_net_margin.get(quarter))  
        operating_income_aligned.append(historical_operating_income.get(quarter))
    
    return {
        'ticker': projected_data['ticker'],
        'quarters': projected_quarters,
        'revenue': projected_data.get('revenue', []),
        'eps': projected_data.get('eps', []),
        'gross_margin': gross_margin_aligned,
        'net_margin': net_margin_aligned,
        'operating_income': operating_income_aligned,
        'price': projected_data.get('price'),
        'market_cap': projected_data.get('market_cap')
    }


# =============================================================================
# INPUT VALIDATION
# =============================================================================

def validate_projection_inputs(projection_inputs: Dict[int, Dict[str, float]]) -> List[str]:
    """Validate projection inputs."""
    errors = []
    
    if not projection_inputs:
        errors.append("Projection inputs cannot be empty")
        return errors
    
    current_year = datetime.now().year
    valid_years = set(range(current_year + 1, current_year + 5))
    
    for year, projections in projection_inputs.items():
        year_prefix = f"Year {year}:"
        
        if year not in valid_years:
            errors.append(f"{year_prefix} Year must be between {current_year + 1} and {current_year + 4}")
            continue
        
        required_fields = ['revenue_growth', 'net_income_growth', 'pe_low', 'pe_high']
        for field in required_fields:
            if field not in projections:
                errors.append(f"{year_prefix} Missing required field '{field}'")
            elif not isinstance(projections[field], (int, float)):
                errors.append(f"{year_prefix} {field} must be a number")
        
        # Validate ranges
        revenue_growth = projections.get('revenue_growth')
        if revenue_growth is not None and not (-0.5 <= revenue_growth <= 1.0):
            errors.append(f"{year_prefix} revenue_growth must be between -0.5 and 1.0")
        
        net_income_growth = projections.get('net_income_growth')
        if net_income_growth is not None and not (-1.0 <= net_income_growth <= 2.0):
            errors.append(f"{year_prefix} net_income_growth must be between -1.0 and 2.0")
        
        pe_low = projections.get('pe_low')
        if pe_low is not None and not (0 < pe_low <= 100):
            errors.append(f"{year_prefix} pe_low must be between 0 and 100")
        
        pe_high = projections.get('pe_high')
        if pe_high is not None:
            if not (0 < pe_high <= 200):
                errors.append(f"{year_prefix} pe_high must be between 0 and 200")
            elif pe_low is not None and pe_high < pe_low:
                errors.append(f"{year_prefix} pe_high must be >= pe_low")
    
    return errors


def validate_ticker_symbol(ticker: str) -> List[str]:
    """Validate ticker symbol format."""
    errors = []
    
    if not ticker or not isinstance(ticker, str):
        errors.append("Ticker must be a non-empty string")
        return errors
    
    ticker = ticker.strip()
    
    if len(ticker) < 1 or len(ticker) > 5:
        errors.append("Ticker must be 1-5 characters")
    
    if not ticker.isalpha():
        errors.append("Ticker must contain only letters")
    
    return errors