"""Input validation utilities."""

from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ProjectionValidator:
    """Validator for financial projection inputs."""
    
    @staticmethod
    def validate_projection_inputs(projection_inputs: Dict[int, Dict[str, float]]) -> List[str]:
        """
        Validate projection inputs for financial calculations.
        
        Args:
            projection_inputs: Dictionary with year as key and projection parameters as value
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if not projection_inputs:
            errors.append("Projection inputs cannot be empty")
            return errors
        
        if not isinstance(projection_inputs, dict):
            errors.append("Projection inputs must be a dictionary")
            return errors
        
        current_year = datetime.now().year
        valid_years = set(range(current_year + 1, current_year + 5))
        
        for year, projections in projection_inputs.items():
            year_prefix = f"Year {year}:"
            
            # Validate year
            if not isinstance(year, int):
                errors.append(f"{year_prefix} Year must be an integer")
                continue
                
            if year not in valid_years:
                errors.append(f"{year_prefix} Year must be between {current_year + 1} and {current_year + 4}")
                continue
            
            # Validate projections structure
            if not isinstance(projections, dict):
                errors.append(f"{year_prefix} Projections must be a dictionary")
                continue
            
            # Required fields
            required_fields = ['revenue_growth', 'net_income_growth', 'pe_low', 'pe_high']
            for field in required_fields:
                if field not in projections:
                    errors.append(f"{year_prefix} Missing required field '{field}'")
                    continue
                
                value = projections[field]
                if not isinstance(value, (int, float)):
                    errors.append(f"{year_prefix} {field} must be a number")
                    continue
            
            # Validate specific field ranges
            revenue_growth = projections.get('revenue_growth')
            if revenue_growth is not None:
                if not (-0.5 <= revenue_growth <= 1.0):
                    errors.append(f"{year_prefix} revenue_growth must be between -0.5 and 1.0 (decimal)")
            
            net_income_growth = projections.get('net_income_growth')
            if net_income_growth is not None:
                if not (-1.0 <= net_income_growth <= 2.0):
                    errors.append(f"{year_prefix} net_income_growth must be between -1.0 and 2.0 (decimal)")
            
            pe_low = projections.get('pe_low')
            if pe_low is not None:
                if not (0 < pe_low <= 100):
                    errors.append(f"{year_prefix} pe_low must be between 0 and 100")
            
            pe_high = projections.get('pe_high')
            if pe_high is not None:
                if not (0 < pe_high <= 200):
                    errors.append(f"{year_prefix} pe_high must be between 0 and 200")
                
                # Check pe_high >= pe_low
                if pe_low is not None and pe_high < pe_low:
                    errors.append(f"{year_prefix} pe_high must be greater than or equal to pe_low")
            
            # Optional field validation
            net_income_margin = projections.get('net_income_margin')
            if net_income_margin is not None:
                if not isinstance(net_income_margin, (int, float)):
                    errors.append(f"{year_prefix} net_income_margin must be a number")
                elif not (0.0 <= net_income_margin <= 0.5):
                    errors.append(f"{year_prefix} net_income_margin must be between 0.0 and 0.5 (decimal)")
        
        if errors:
            logger.warning(f"Projection validation failed with {len(errors)} errors")
        else:
            logger.info("Projection inputs validation passed")
        
        return errors
    
    @staticmethod
    def validate_ticker_symbol(ticker: str) -> List[str]:
        """
        Validate ticker symbol format.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if not ticker:
            errors.append("Ticker symbol cannot be empty")
            return errors
        
        if not isinstance(ticker, str):
            errors.append("Ticker symbol must be a string")
            return errors
        
        ticker = ticker.strip()
        
        if len(ticker) < 1 or len(ticker) > 5:
            errors.append("Ticker symbol must be between 1 and 5 characters")
        
        if not ticker.isalpha():
            errors.append("Ticker symbol must contain only letters")
        
        if not ticker.isupper():
            errors.append("Ticker symbol should be uppercase")
        
        return errors
    
    @staticmethod
    def validate_financial_data(data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """
        Validate financial data structure.
        
        Args:
            data: Financial data dictionary
            required_fields: List of required field names
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if not data:
            errors.append("Financial data cannot be empty")
            return errors
        
        if not isinstance(data, dict):
            errors.append("Financial data must be a dictionary")
            return errors
        
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
                continue
            
            value = data[field]
            if value is None:
                errors.append(f"Field {field} cannot be None")
                continue
            
            if not isinstance(value, (int, float)):
                errors.append(f"Field {field} must be a number")
                continue
            
            if field in ['revenue', 'net_income', 'shares_outstanding'] and value <= 0:
                errors.append(f"Field {field} must be positive")
        
        return errors