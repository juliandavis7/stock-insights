"""
Backward compatibility layer for util.py.
This file maintains the original API while delegating to the new refactored services.
"""

import warnings
from typing import Dict, List, Any, Optional

# Import new services and utilities
from .services import FMPService, YFinanceService, MetricsService, ProjectionService
from .utils import DataExtractor, ProjectionValidator, MetricsCalculator

# Initialize services
_fmp_service = FMPService()
_yfinance_service = YFinanceService()
_metrics_service = MetricsService(_fmp_service, _yfinance_service)
_projection_service = ProjectionService(_fmp_service, _yfinance_service)
_data_extractor = DataExtractor()
_validator = ProjectionValidator()
_calculator = MetricsCalculator()


# Backward compatibility functions - FMP related
def fetch_fmp_analyst_estimates(ticker: str, api_key: str = None) -> List[Dict[str, Any]]:
    """
    DEPRECATED: Use FMPService.fetch_analyst_estimates() instead.
    """
    warnings.warn(
        "fetch_fmp_analyst_estimates is deprecated. Use FMPService.fetch_analyst_estimates() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    if api_key:
        service = FMPService(api_key)
        return service.fetch_analyst_estimates(ticker)
    return _fmp_service.fetch_analyst_estimates(ticker)


def fetch_current_year_data(ticker: str, api_key: str) -> Optional[Dict[str, float]]:
    """
    DEPRECATED: Use FMPService.fetch_current_year_data() instead.
    """
    warnings.warn(
        "fetch_current_year_data is deprecated. Use FMPService.fetch_current_year_data() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    if api_key:
        service = FMPService(api_key)
        return service.fetch_current_year_data(ticker)
    return _fmp_service.fetch_current_year_data(ticker)


# Backward compatibility functions - Calculator methods
def get_ttm_pe(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_ttm_pe() instead."""
    warnings.warn(
        "get_ttm_pe is deprecated. Use MetricsCalculator.get_ttm_pe() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_ttm_pe(stock_info)


def get_forward_pe(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_forward_pe() instead."""
    warnings.warn(
        "get_forward_pe is deprecated. Use MetricsCalculator.get_forward_pe() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_forward_pe(stock_info)


def get_ttm_ps(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_ttm_ps() instead."""
    warnings.warn(
        "get_ttm_ps is deprecated. Use MetricsCalculator.get_ttm_ps() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_ttm_ps(stock_info)


def get_gross_margin(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_gross_margin() instead."""
    warnings.warn(
        "get_gross_margin is deprecated. Use MetricsCalculator.get_gross_margin() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_gross_margin(stock_info)


def get_net_margin(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_net_margin() instead."""
    warnings.warn(
        "get_net_margin is deprecated. Use MetricsCalculator.get_net_margin() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_net_margin(stock_info)


def get_earnings_growth(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_earnings_growth() instead."""
    warnings.warn(
        "get_earnings_growth is deprecated. Use MetricsCalculator.get_earnings_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_earnings_growth(stock_info)


def get_revenue_growth(stock_info: Dict[str, Any]) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_revenue_growth() instead."""
    warnings.warn(
        "get_revenue_growth is deprecated. Use MetricsCalculator.get_revenue_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_revenue_growth(stock_info)


def get_current_year_eps_growth(earnings_forecast: Any) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_current_year_eps_growth() instead."""
    warnings.warn(
        "get_current_year_eps_growth is deprecated. Use MetricsCalculator.get_current_year_eps_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_current_year_eps_growth(earnings_forecast)


def get_next_year_eps_growth(earnings_forecast: Any) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_next_year_eps_growth() instead."""
    warnings.warn(
        "get_next_year_eps_growth is deprecated. Use MetricsCalculator.get_next_year_eps_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_next_year_eps_growth(earnings_forecast)


def get_current_year_revenue_growth(revenue_forecast: Any) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_current_year_revenue_growth() instead."""
    warnings.warn(
        "get_current_year_revenue_growth is deprecated. Use MetricsCalculator.get_current_year_revenue_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_current_year_revenue_growth(revenue_forecast)


def get_next_year_revenue_growth(revenue_forecast: Any) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_next_year_revenue_growth() instead."""
    warnings.warn(
        "get_next_year_revenue_growth is deprecated. Use MetricsCalculator.get_next_year_revenue_growth() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_next_year_revenue_growth(revenue_forecast)


def get_forward_ps_ratio(stock_info: Dict[str, Any], revenue_forecast: Any) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_forward_ps_ratio() instead."""
    warnings.warn(
        "get_forward_ps_ratio is deprecated. Use MetricsCalculator.get_forward_ps_ratio() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _calculator.get_forward_ps_ratio(stock_info, revenue_forecast)


def get_two_year_forward_pe(ticker: str, current_price: float, api_key: str = None) -> Optional[float]:
    """DEPRECATED: Use MetricsCalculator.get_two_year_forward_pe() instead."""
    warnings.warn(
        "get_two_year_forward_pe is deprecated. Use MetricsCalculator.get_two_year_forward_pe() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    # Fetch FMP data
    if api_key:
        service = FMPService(api_key)
        fmp_data = service.fetch_analyst_estimates(ticker)
    else:
        fmp_data = _fmp_service.fetch_analyst_estimates(ticker)
    
    return _calculator.get_two_year_forward_pe(ticker, current_price, fmp_data)


# Main service functions
def get_metrics(ticker: str) -> Dict[str, Any]:
    """
    Get comprehensive stock metrics for a ticker.
    This function now uses the new MetricsService.
    """
    return _metrics_service.get_metrics(ticker)


def extract_metric_by_year(fmp_data: List[Dict[str, Any]], metric: str) -> Dict[str, float]:
    """
    DEPRECATED: Use DataExtractor.extract_metric_by_year() instead.
    """
    warnings.warn(
        "extract_metric_by_year is deprecated. Use DataExtractor.extract_metric_by_year() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _data_extractor.extract_metric_by_year(fmp_data, metric)


def fetch_stock_info(ticker: str) -> Optional[Dict[str, float]]:
    """
    DEPRECATED: Use YFinanceService.fetch_stock_info() instead.
    """
    warnings.warn(
        "fetch_stock_info is deprecated. Use YFinanceService.fetch_stock_info() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _yfinance_service.fetch_stock_info(ticker)


def validate_projection_inputs(projection_inputs: Dict[int, Dict[str, float]]) -> List[str]:
    """
    DEPRECATED: Use ProjectionValidator.validate_projection_inputs() instead.
    """
    warnings.warn(
        "validate_projection_inputs is deprecated. Use ProjectionValidator.validate_projection_inputs() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return _validator.validate_projection_inputs(projection_inputs)


def calculate_financial_projections(
    ticker: str,
    api_key: str,
    projection_inputs: Dict[int, Dict[str, float]],
    shares_outstanding: Optional[float] = None,
    current_stock_price: Optional[float] = None,
    current_year_data: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculate financial projections for a stock.
    This function now uses the new ProjectionService.
    """
    return _projection_service.calculate_financial_projections(
        ticker=ticker,
        api_key=api_key,
        projection_inputs=projection_inputs,
        shares_outstanding=shares_outstanding,
        current_stock_price=current_stock_price,
        current_year_data=current_year_data
    )


# Export the new services for direct access
__all__ = [
    # Backward compatibility functions
    'fetch_fmp_analyst_estimates',
    'fetch_current_year_data',
    'get_ttm_pe',
    'get_forward_pe',
    'get_ttm_ps',
    'get_gross_margin',
    'get_net_margin',
    'get_earnings_growth',
    'get_revenue_growth',
    'get_current_year_eps_growth',
    'get_next_year_eps_growth',
    'get_current_year_revenue_growth',
    'get_next_year_revenue_growth',
    'get_forward_ps_ratio',
    'get_two_year_forward_pe',
    'get_metrics',
    'extract_metric_by_year',
    'fetch_stock_info',
    'validate_projection_inputs',
    'calculate_financial_projections',
    
    # New services (recommended)
    'FMPService',
    'YFinanceService',
    'MetricsService',
    'ProjectionService',
    'DataExtractor',
    'ProjectionValidator',
    'MetricsCalculator'
]