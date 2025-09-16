"""Data validation utilities for metrics service."""

import logging
from typing import Any, List, Dict, Optional
import pandas as pd
from ..models.metric_models import StockInfo, QuarterlyData

logger = logging.getLogger(__name__)


class DataValidator:
    """Validates data for metrics calculations."""
    
    @staticmethod
    def is_valid_data(data: Any) -> bool:
        """
        Check if data is valid and not empty, handling various data types.
        
        Args:
            data: Data to validate
            
        Returns:
            True if data is valid, False otherwise
        """
        try:
            logger.debug(f"🔍 Validating data: {type(data)}")
            
            if data is None:
                logger.debug("❌ Data is None")
                return False
            
            # Handle pandas DataFrame first (before bool check)
            if hasattr(data, 'empty'):
                result = not data.empty
                logger.debug(f"📊 DataFrame validation: {result}")
                return result
            
            # Handle list
            if isinstance(data, list):
                result = len(data) > 0
                logger.debug(f"📋 List validation: {result}, length: {len(data)}")
                return result
            
            # Handle dict
            if isinstance(data, dict):
                result = len(data) > 0
                logger.debug(f"📖 Dict validation: {result}, length: {len(data)}")
                return result
            
            # Handle other types safely
            try:
                result = bool(data)
                logger.debug(f"🔧 Other type validation: {result}")
                return result
            except ValueError:
                # Some objects (like DataFrames) can't be converted to bool
                logger.debug(f"✅ Assuming valid for non-bool type")
                return True  # If it exists and isn't None, assume it's valid
                
        except Exception as e:
            logger.error(f"Error in data validation: {e}")
            return False
    
    @staticmethod
    def validate_stock_info(stock_info: Optional[Dict[str, Any]]) -> bool:
        """
        Validate stock info data structure.
        
        Args:
            stock_info: Stock information dictionary
            
        Returns:
            True if valid, False otherwise
        """
        if not DataValidator.is_valid_data(stock_info):
            return False
        
        required_fields = ['ticker', 'current_price']
        for field in required_fields:
            if field not in stock_info or stock_info[field] is None:
                logger.warning(f"Missing required stock info field: {field}")
                return False
        
        # Validate numeric fields
        numeric_fields = ['current_price', 'market_cap']
        for field in numeric_fields:
            if field in stock_info and stock_info[field] is not None:
                try:
                    float(stock_info[field])
                except (TypeError, ValueError):
                    logger.warning(f"Invalid numeric value for {field}: {stock_info[field]}")
                    return False
        
        return True
    
    @staticmethod
    def validate_quarterly_data(quarterly_data: List[Dict[str, Any]]) -> bool:
        """
        Validate quarterly financial data.
        
        Args:
            quarterly_data: List of quarterly data dictionaries
            
        Returns:
            True if valid, False otherwise
        """
        if not DataValidator.is_valid_data(quarterly_data):
            return False
        
        if len(quarterly_data) < 1:
            logger.warning("Quarterly data list is empty")
            return False
        
        # Check each quarter
        for i, quarter in enumerate(quarterly_data):
            if not isinstance(quarter, dict):
                logger.warning(f"Quarter {i} is not a dictionary")
                return False
            
            # Check for required fields
            if 'date' not in quarter:
                logger.warning(f"Quarter {i} missing date field")
                return False
            
            # Validate numeric fields
            numeric_fields = ['revenue', 'cost_of_revenue', 'net_income', 'eps']
            for field in numeric_fields:
                if field in quarter and quarter[field] is not None:
                    try:
                        float(quarter[field])
                    except (TypeError, ValueError):
                        logger.warning(f"Quarter {i} has invalid {field}: {quarter[field]}")
                        return False
        
        return True
    
    @staticmethod
    def validate_fmp_estimates_data(fmp_data: List[Dict[str, Any]]) -> bool:
        """
        Validate FMP analyst estimates data.
        
        Args:
            fmp_data: List of FMP estimates dictionaries
            
        Returns:
            True if valid, False otherwise
        """
        if not DataValidator.is_valid_data(fmp_data):
            return False
        
        if len(fmp_data) < 1:
            logger.warning("FMP estimates data list is empty")
            return False
        
        # Check for expected fields in at least one record
        required_fields = ['date', 'symbol']
        expected_fields = ['estimatedEpsAvg', 'estimatedRevenueAvg']
        
        sample_record = fmp_data[0]
        
        # Check required fields
        for field in required_fields:
            if field not in sample_record:
                logger.warning(f"FMP data missing required field: {field}")
                return False
        
        # Check for at least one expected numeric field
        has_numeric_data = any(
            field in sample_record and sample_record[field] is not None
            for field in expected_fields
        )
        
        if not has_numeric_data:
            logger.warning("FMP data missing expected numeric fields")
            return False
        
        return True
    
    @staticmethod
    def convert_to_quarterly_data(raw_data: List[Dict[str, Any]]) -> List[QuarterlyData]:
        """
        Convert raw quarterly data to QuarterlyData objects.
        
        Args:
            raw_data: List of raw quarterly data dictionaries
            
        Returns:
            List of QuarterlyData objects
        """
        quarterly_data = []
        
        for quarter_dict in raw_data:
            try:
                quarterly_data.append(QuarterlyData(
                    date=quarter_dict.get('date', ''),
                    revenue=DataValidator._safe_float(quarter_dict.get('revenue')),
                    cost_of_revenue=DataValidator._safe_float(quarter_dict.get('costOfRevenue')),
                    net_income=DataValidator._safe_float(quarter_dict.get('netIncome')),
                    eps=DataValidator._safe_float(quarter_dict.get('eps')),
                    gross_profit=DataValidator._safe_float(quarter_dict.get('grossProfit'))
                ))
            except Exception as e:
                logger.warning(f"Error converting quarterly data: {e}")
                continue
        
        return quarterly_data
    
    @staticmethod
    def convert_to_stock_info(raw_data: Dict[str, Any]) -> StockInfo:
        """
        Convert raw stock info to StockInfo object.
        
        Args:
            raw_data: Raw stock info dictionary
            
        Returns:
            StockInfo object
        """
        return StockInfo(
            ticker=raw_data.get('ticker', ''),
            company_name=raw_data.get('company_name'),
            sector=raw_data.get('sector'),
            industry=raw_data.get('industry'),
            current_price=DataValidator._safe_float(raw_data.get('current_price')),
            market_cap=DataValidator._safe_float(raw_data.get('market_cap')),
            enterprise_value=DataValidator._safe_float(raw_data.get('enterprise_value')),
            shares_outstanding=DataValidator._safe_float(raw_data.get('shares_outstanding')),
            total_revenue=DataValidator._safe_float(raw_data.get('total_revenue'))
        )
    
    @staticmethod
    def _safe_float(value: Any) -> Optional[float]:
        """Safely convert value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None