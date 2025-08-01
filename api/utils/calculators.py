"""Pure calculation functions for financial metrics and projections."""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from .data_extractors import DataExtractor

logger = logging.getLogger(__name__)


class MetricsCalculator:
    """Calculator for stock metrics from various data sources."""
    
    @staticmethod
    def get_ttm_pe(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate trailing twelve months P/E ratio."""
        # Try both the extracted field name and original YFinance field name
        val = stock_info.get('trailing_pe') or stock_info.get('trailingPE')
        return round(val, 2) if val is not None else None
    
    @staticmethod
    def get_forward_pe(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate forward P/E ratio."""
        val = stock_info.get('forward_pe') or stock_info.get('forwardPE')
        return round(val, 2) if val is not None else None
    
    @staticmethod
    def get_ttm_ps(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate trailing twelve months price-to-sales ratio."""
        val = stock_info.get('price_to_sales_ttm') or stock_info.get('priceToSalesTrailing12Months')
        return round(val, 2) if val is not None else None
    
    @staticmethod
    def get_gross_margin(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate gross margin percentage."""
        val = stock_info.get('gross_margins') or stock_info.get('grossMargins')
        return round(val, 2) if val is not None else None
    
    @staticmethod
    def get_net_margin(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate net margin percentage."""
        val = stock_info.get('profit_margins') or stock_info.get('profitMargins')
        return round(val, 2) if val is not None else None
    
    @staticmethod
    def get_earnings_growth(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate earnings growth percentage."""
        # The DataExtractor already converts to percentage, so use as-is
        val = stock_info.get('earnings_growth')
        if val is not None:
            return round(val, 2)
        
        # Fallback to original field and convert
        val = stock_info.get('earningsGrowth')
        return round(val * 100, 2) if val is not None else None
    
    @staticmethod
    def get_revenue_growth(stock_info: Dict[str, Any]) -> Optional[float]:
        """Calculate revenue growth percentage."""
        # The DataExtractor already converts to percentage, so use as-is
        val = stock_info.get('revenue_growth')
        if val is not None:
            return round(val, 2)
        
        # Fallback to original field and convert
        val = stock_info.get('revenueGrowth')
        return round(val * 100, 2) if val is not None else None
    
    @staticmethod
    def get_current_year_eps_growth(earnings_forecast: Any) -> Optional[float]:
        """Extract current year EPS growth from forecast data."""
        from .data_extractors import DataExtractor
        return DataExtractor.extract_forecast_growth(earnings_forecast, '0y')
    
    @staticmethod
    def get_next_year_eps_growth(earnings_forecast: Any) -> Optional[float]:
        """Extract next year EPS growth from forecast data."""
        return DataExtractor.extract_forecast_growth(earnings_forecast, '+1y')
    
    @staticmethod
    def get_current_year_revenue_growth(revenue_forecast: Any) -> Optional[float]:
        """Extract current year revenue growth from forecast data."""
        return DataExtractor.extract_forecast_growth(revenue_forecast, '0y')
    
    @staticmethod
    def get_next_year_revenue_growth(revenue_forecast: Any) -> Optional[float]:
        """Extract next year revenue growth from forecast data."""
        return DataExtractor.extract_forecast_growth(revenue_forecast, '+1y')
    
    @staticmethod
    def get_forward_ps_ratio(stock_info: Dict[str, Any], revenue_forecast: Any) -> Optional[float]:
        """
        Calculate forward price-to-sales ratio using current market cap and forecasted revenue.
        """
        try:
            # Try both extracted and original field names
            market_cap = stock_info.get('market_cap') or stock_info.get('marketCap')
            if market_cap is None:
                return None
            
            # Try to extract next year revenue forecast
            next_year_growth = DataExtractor.extract_forecast_growth(revenue_forecast, '+1y')
            if next_year_growth is None:
                return None
            
            current_revenue = stock_info.get('total_revenue') or stock_info.get('totalRevenue')
            if current_revenue is None:
                return None
            
            # Calculate forward revenue
            forward_revenue = current_revenue * (1 + next_year_growth / 100)
            forward_ps = market_cap / forward_revenue
            
            return round(forward_ps, 2)
            
        except (TypeError, ZeroDivisionError):
            return None
    
    @staticmethod
    def get_two_year_forward_pe(
        ticker: str, 
        current_price: float, 
        fmp_data: List[Dict[str, Any]]
    ) -> Optional[float]:
        """
        Calculate two-year forward P/E ratio using FMP analyst estimates.
        
        Args:
            ticker: Stock ticker symbol
            current_price: Current stock price
            fmp_data: FMP analyst estimates data
            
        Returns:
            Two-year forward P/E ratio or None if calculation fails
        """
        try:
            current_year = datetime.now().year
            target_year = str(current_year + 2)
            
            # Extract EPS estimates by year
            eps_by_year = DataExtractor.extract_metric_by_year(fmp_data, 'epsAvg')
            
            if target_year not in eps_by_year:
                logger.warning(f"No EPS estimate available for {target_year}")
                return None
            
            target_eps = eps_by_year[target_year]
            if target_eps <= 0:
                logger.warning(f"Invalid EPS estimate for {target_year}: {target_eps}")
                return None
            
            two_year_forward_pe = current_price / target_eps
            return round(two_year_forward_pe, 2)
            
        except (KeyError, ValueError, ZeroDivisionError) as e:
            logger.error(f"Error calculating two-year forward PE for {ticker}: {e}")
            return None


class ProjectionCalculator:
    """Calculator for financial projections and scenario analysis."""
    
    @staticmethod
    def calculate_projected_revenue(
        base_revenue: float, 
        growth_rate: float, 
        years: int = 1
    ) -> float:
        """
        Calculate projected revenue based on growth rate.
        
        Args:
            base_revenue: Starting revenue amount
            growth_rate: Annual growth rate (as decimal, e.g., 0.15 for 15%)
            years: Number of years to project
            
        Returns:
            Projected revenue
        """
        return base_revenue * ((1 + growth_rate) ** years)
    
    @staticmethod
    def calculate_projected_net_income(
        base_net_income: float, 
        growth_rate: float, 
        years: int = 1
    ) -> float:
        """
        Calculate projected net income based on growth rate.
        
        Args:
            base_net_income: Starting net income amount
            growth_rate: Annual growth rate (as decimal)
            years: Number of years to project
            
        Returns:
            Projected net income
        """
        return base_net_income * ((1 + growth_rate) ** years)
    
    @staticmethod
    def calculate_eps(net_income: float, shares_outstanding: float) -> float:
        """
        Calculate earnings per share.
        
        Args:
            net_income: Net income amount
            shares_outstanding: Number of shares outstanding
            
        Returns:
            Earnings per share
        """
        if shares_outstanding <= 0:
            raise ValueError("Shares outstanding must be positive")
        
        return net_income / shares_outstanding
    
    @staticmethod
    def calculate_stock_price_range(
        eps: float, 
        pe_low: float, 
        pe_high: float
    ) -> Dict[str, float]:
        """
        Calculate stock price range based on EPS and P/E ratio range.
        
        Args:
            eps: Earnings per share
            pe_low: Low P/E ratio estimate
            pe_high: High P/E ratio estimate
            
        Returns:
            Dictionary with 'low' and 'high' price estimates
        """
        return {
            'low': eps * pe_low,
            'high': eps * pe_high
        }
    
    @staticmethod
    def calculate_cagr(
        initial_value: float, 
        final_value: float, 
        years: int
    ) -> float:
        """
        Calculate Compound Annual Growth Rate (CAGR).
        
        Args:
            initial_value: Starting value
            final_value: Ending value
            years: Number of years
            
        Returns:
            CAGR as decimal (e.g., 0.15 for 15%)
        """
        if initial_value <= 0:
            raise ValueError("Initial value must be positive")
        if years <= 0:
            raise ValueError("Years must be positive")
        
        return ((final_value / initial_value) ** (1 / years)) - 1
    
    @staticmethod
    def calculate_net_income_margin(net_income: float, revenue: float) -> float:
        """
        Calculate net income margin.
        
        Args:
            net_income: Net income amount
            revenue: Revenue amount
            
        Returns:
            Net income margin as decimal
        """
        if revenue <= 0:
            raise ValueError("Revenue must be positive")
        
        return net_income / revenue
    
    @staticmethod
    def calculate_year_over_year_growth(current_value: float, previous_value: float) -> float:
        """
        Calculate year-over-year growth rate.
        
        Args:
            current_value: Current period value
            previous_value: Previous period value
            
        Returns:
            Growth rate as decimal
        """
        if previous_value <= 0:
            raise ValueError("Previous value must be positive")
        
        return (current_value - previous_value) / previous_value