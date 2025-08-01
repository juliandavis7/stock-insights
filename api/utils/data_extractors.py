"""Data extraction utilities for processing API responses."""

from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class DataExtractor:
    """Utility class for extracting data from API responses."""
    
    @staticmethod
    def extract_metric_by_year(fmp_data: List[Dict[str, Any]], metric: str) -> Dict[str, float]:
        """
        Extract a specific metric from FMP analyst estimates data, organized by year.
        
        Args:
            fmp_data: List of FMP analyst estimate dictionaries
            metric: The metric key to extract (e.g., 'revenueAvg', 'epsAvg')
            
        Returns:
            Dictionary with year as key and metric value as value
        """
        if not fmp_data or not isinstance(fmp_data, list):
            logger.warning(f"Invalid or empty FMP data provided for metric {metric}")
            return {}
        
        result = {}
        
        for item in fmp_data:
            if not isinstance(item, dict):
                continue
                
            try:
                # Extract year from date (format: "2024-12-31")
                date_str = item.get('date', '')
                if not date_str:
                    continue
                    
                year = date_str.split('-')[0]
                metric_value = item.get(metric)
                
                if metric_value is not None:
                    result[year] = float(metric_value)
                    
            except (ValueError, IndexError, KeyError) as e:
                logger.warning(f"Error extracting {metric} from item {item}: {e}")
                continue
        
        logger.info(f"Extracted {len(result)} {metric} values by year: {result}")
        return result
    
    @staticmethod
    def extract_stock_info_metrics(stock_info: Dict[str, Any]) -> Dict[str, Optional[float]]:
        """
        Extract key metrics from YFinance stock info.
        
        Args:
            stock_info: YFinance info dictionary
            
        Returns:
            Dictionary of extracted metrics
        """
        if not stock_info or not isinstance(stock_info, dict):
            logger.warning("Invalid or empty stock info provided")
            return {}
        
        def safe_extract_and_round(key: str, multiplier: float = 1.0) -> Optional[float]:
            """Safely extract a value and round it."""
            try:
                value = stock_info.get(key)
                if value is not None:
                    return round(float(value) * multiplier, 2)
                return None
            except (ValueError, TypeError):
                return None
        
        metrics = {
            'trailing_pe': safe_extract_and_round('trailingPE'),
            'forward_pe': safe_extract_and_round('forwardPE'),
            'price_to_sales_ttm': safe_extract_and_round('priceToSalesTrailing12Months'),
            'gross_margins': safe_extract_and_round('grossMargins'),
            'profit_margins': safe_extract_and_round('profitMargins'),
            'earnings_growth': safe_extract_and_round('earningsGrowth', 100.0),  # Convert to percentage
            'revenue_growth': safe_extract_and_round('revenueGrowth', 100.0),    # Convert to percentage
            'market_cap': safe_extract_and_round('marketCap'),
            'enterprise_value': safe_extract_and_round('enterpriseValue'),
            'shares_outstanding': safe_extract_and_round('sharesOutstanding'),
            'current_price': safe_extract_and_round('currentPrice'),
            'total_revenue': safe_extract_and_round('totalRevenue')
        }
        
        # Count non-null metrics for logging
        valid_metrics = sum(1 for v in metrics.values() if v is not None)
        logger.info(f"Extracted {valid_metrics} valid metrics from stock info")
        
        return metrics
    
    @staticmethod
    def extract_forecast_growth(forecast_data: Any, period: str) -> Optional[float]:
        """
        Extract growth rate from YFinance forecast data.
        
        Args:
            forecast_data: YFinance forecast DataFrame or data
            period: Period to extract ('0y' for current year, '+1y' for next year)
            
        Returns:
            Growth rate as percentage or None if not available
        """
        try:
            if hasattr(forecast_data, 'loc'):
                # DataFrame-like object
                growth_value = forecast_data.loc[period, 'growth']
                return round(float(growth_value) * 100, 2)
            return None
        except (KeyError, IndexError, AttributeError, ValueError, TypeError):
            logger.debug(f"Could not extract growth for period {period}")
            return None