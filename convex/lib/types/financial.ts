export interface AnalystEstimate {
  symbol: string;
  date: string;
  revenueLow: number;
  revenueHigh: number;
  revenueAvg: number;
  ebitdaLow: number;
  ebitdaHigh: number;
  ebitdaAvg: number;
  ebitLow: number;
  ebitHigh: number;
  ebitAvg: number;
  netIncomeLow: number;
  netIncomeHigh: number;
  netIncomeAvg: number;
  sgaExpenseLow: number;
  sgaExpenseHigh: number;
  sgaExpenseAvg: number;
  epsAvg: number;
  epsHigh: number;
  epsLow: number;
  numAnalystsRevenue: number;
  numAnalystsEps: number;
}

export interface CompanyOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  OfficialSite: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  AnalystRatingStrongBuy: string;
  AnalystRatingBuy: string;
  AnalystRatingHold: string;
  AnalystRatingSell: string;
  AnalystRatingStrongSell: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  "52WeekHigh": string;
  "52WeekLow": string;
  "50DayMovingAverage": string;
  "200DayMovingAverage": string;
  SharesOutstanding: string;
  SharesFloat: string;
  PercentInsiders: string;
  PercentInstitutions: string;
  DividendDate: string;
  ExDividendDate: string;
}

export interface FinancialMetrics {
  symbol: string;
  currentPrice: number;
  currentPriceSource: 'provided' | 'fetched' | 'default';
  marketCap: number | null;
  
  // Required PE Ratios
  ttmPE: number | null;           // From AlphaVantage TrailingPE
  forwardPE: number | null;       // From AlphaVantage ForwardPE  
  twoYearForwardPE: number | null; // Calculated from analyst estimates (2026)
  
  // Required EPS Growth
  ttmEPSGrowth: number | null;           // Calculated from analyst estimates
  currentYearEPSGrowth: number | null;   // Calculated from analyst estimates (2025 vs 2024)
  nextYearEPSGrowth: number | null;      // Calculated from analyst estimates (2026 vs 2025)
  
  // Required Revenue Growth
  ttmRevenueGrowth: number | null;              // Calculated from analyst estimates
  currentYearExpectedRevenueGrowth: number | null; // Calculated from analyst estimates (2025 vs 2024)
  nextYearRevenueGrowth: number | null;         // Calculated from analyst estimates (2026 vs 2025)
  
  // Required Margins
  grossMargin: number | null;  // Calculated from AlphaVantage GrossProfitTTM/RevenueTTM
  netMargin: number | null;    // From AlphaVantage ProfitMargin
  
  // Required Price-to-Sales
  ttmPriceToSales: number | null;    // From AlphaVantage PriceToSalesRatioTTM
  forwardPriceToSales: number | null; // Calculated from MarketCap/2025 Revenue estimate
}