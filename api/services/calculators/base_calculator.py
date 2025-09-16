"""Base calculator class for metrics calculations."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from ..models.metric_models import MetricResult

logger = logging.getLogger(__name__)


class BaseCalculator(ABC):
    """Abstract base class for all metric calculators."""
    
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    def calculate(self, *args, **kwargs) -> Dict[str, MetricResult]:
        """
        Calculate metrics based on input data.
        
        Returns:
            Dictionary mapping metric names to MetricResult objects
        """
        pass
    
    def _safe_divide(self, numerator: float, denominator: float) -> Optional[float]:
        """Safely divide two numbers, returning None if division by zero."""
        try:
            if denominator == 0:
                self.logger.warning("Division by zero attempted")
                return None
            return numerator / denominator
        except (TypeError, ValueError) as e:
            self.logger.warning(f"Division error: {e}")
            return None
    
    def _safe_percentage(self, numerator: float, denominator: float) -> Optional[float]:
        """Calculate percentage, handling division by zero."""
        result = self._safe_divide(numerator, denominator)
        return result * 100 if result is not None else None
    
    def _validate_positive_number(self, value: Any, field_name: str) -> bool:
        """Validate that a value is a positive number."""
        try:
            if value is None:
                self.logger.debug(f"{field_name} is None")
                return False
            float_value = float(value)
            if float_value <= 0:
                self.logger.debug(f"{field_name} is not positive: {float_value}")
                return False
            return True
        except (TypeError, ValueError):
            self.logger.debug(f"{field_name} is not a valid number: {value}")
            return False
    
    def _round_result(self, value: Optional[float], precision: int = 2) -> Optional[float]:
        """Round a result to specified precision."""
        if value is None:
            return None
        try:
            return round(float(value), precision)
        except (TypeError, ValueError):
            self.logger.warning(f"Could not round value: {value}")
            return None
    
    def _log_calculation(self, metric_name: str, result: MetricResult):
        """Log the result of a calculation."""
        if result.calculation_successful:
            self.logger.debug(f"✅ {metric_name}: {result.value}")
        else:
            self.logger.warning(f"❌ {metric_name}: {result.error_message}")
    
    def _create_success_result(self, value: Optional[float], precision: int = 2) -> MetricResult:
        """Create a successful calculation result."""
        rounded_value = self._round_result(value, precision)
        return MetricResult.success(rounded_value)
    
    def _create_failure_result(self, error_message: str) -> MetricResult:
        """Create a failed calculation result."""
        return MetricResult.failure(error_message)