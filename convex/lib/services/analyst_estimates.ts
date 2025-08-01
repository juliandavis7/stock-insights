import { AnalystEstimate, FinancialMetrics, CompanyOverview } from "../types/financial";

export class AnalystEstimatesService {
  private fmpApiKey = 'kFoyQBTilV6J4OIfCd9RdhTeTb8CeK5B';
  private avApiKey = 'Q7CBUBA90SADTGIW';
  private fmpBaseUrl = 'https://financialmodelingprep.com/stable';
  private avBaseUrl = 'https://www.alphavantage.co/query';
  private estimates: AnalystEstimate[] = [];
  private companyOverview: CompanyOverview | null = null;

  async fetchAnalystEstimates(
    symbol: string,
    period: 'annual' | 'quarterly' = 'annual',
    page: number = 0,
    limit: number = 10
  ): Promise<AnalystEstimate[]> {
    try {
      const url = `${this.fmpBaseUrl}/analyst-estimates?symbol=${symbol}&period=${period}&page=${page}&limit=${limit}&apikey=${this.fmpApiKey}`;
      console.log(`🔄 Fetching analyst estimates for ${symbol} from:`, url);
      
      const response = await fetch(url);
      console.log(`📊 Analyst estimates response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: AnalystEstimate[] = await response.json();
      console.log(`✅ Analyst estimates data received:`, {
        count: data.length,
        sample: data.slice(0, 2),
        allData: data
      });
      
      this.estimates = data;
      return data;
    } catch (error) {
      console.error('❌ Error fetching analyst estimates:', error);
      throw error;
    }
  }

  async fetchCompanyOverview(symbol: string): Promise<CompanyOverview> {
    try {
      const url = `${this.avBaseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${this.avApiKey}`;
      console.log(`🔄 Fetching company overview for ${symbol} from AlphaVantage:`, url);
      
      const response = await fetch(url);
      console.log(`🏢 Company overview response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Company overview API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📊 Raw company overview response:`, data);
      
      // Check for AlphaVantage rate limit or error response
      if (data.Information && data.Information.includes('rate limit')) {
        console.log(`⚠️ AlphaVantage rate limit reached:`, data.Information);
        throw new Error(`AlphaVantage rate limit: ${data.Information}`);
      }
      
      if (data.Note && data.Note.includes('frequency')) {
        console.log(`⚠️ AlphaVantage frequency limit:`, data.Note);
        throw new Error(`AlphaVantage frequency limit: ${data.Note}`);
      }
      
      // Validate that we received actual company data
      if (!data.Symbol || !data.Name) {
        throw new Error(`Invalid company overview response: Missing Symbol or Name`);
      }
      
      const typedData: CompanyOverview = data;
      console.log(`✅ Company overview data received:`, {
        symbol: typedData.Symbol,
        name: typedData.Name,
        marketCap: typedData.MarketCapitalization,
        trailingPE: typedData.TrailingPE,
        forwardPE: typedData.ForwardPE
      });
      
      this.companyOverview = typedData;
      return typedData;
    } catch (error) {
      console.error('❌ Error fetching company overview:', error);
      throw error;
    }
  }

  getStoredEstimates(): AnalystEstimate[] {
    return this.estimates;
  }

  getStoredCompanyOverview(): CompanyOverview | null {
    return this.companyOverview;
  }

  getCurrentMarketCap(): number | null {
    if (!this.companyOverview) return null;
    
    const marketCapString = this.companyOverview.MarketCapitalization;
    if (!marketCapString || marketCapString === 'None' || marketCapString === '-') return null;
    
    const marketCap = parseInt(marketCapString, 10);
    return isNaN(marketCap) ? null : marketCap;
  }

  async fetchCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const url = `${this.avBaseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.avApiKey}`;
      console.log(`🔄 Fetching current price for ${symbol} from AlphaVantage:`, url);
      
      const response = await fetch(url);
      console.log(`💰 Current price response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Current price API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📈 Current price raw data:`, data);
      
      // Check for AlphaVantage rate limit or error response
      if (data.Information && data.Information.includes('rate limit')) {
        console.log(`⚠️ AlphaVantage rate limit reached for current price:`, data.Information);
        return null;
      }
      
      if (data.Note && data.Note.includes('frequency')) {
        console.log(`⚠️ AlphaVantage frequency limit for current price:`, data.Note);
        return null;
      }
      
      const quote = data["Global Quote"];
      console.log(`📊 Global Quote data:`, quote);
      
      if (!quote) {
        console.log(`⚠️ No Global Quote found in response`);
        return null;
      }
      
      const currentPrice = parseFloat(quote["05. price"]);
      console.log(`✅ Parsed current price:`, currentPrice);
      return isNaN(currentPrice) ? null : currentPrice;
    } catch (error) {
      console.error('❌ Error fetching current price:', error);
      return null;
    }
  }

  calculateForwardPE(currentPrice: number, futureYear: string): number | null {
    const estimate = this.estimates.find(est => est.date.includes(futureYear));
    if (!estimate || estimate.epsAvg <= 0) return null;
    
    return currentPrice / estimate.epsAvg;
  }

  calculate2YearForwardPE(currentPrice: number): number | null {
    const estimate = this.estimates.find(est => est.date.includes('2026'));
    if (!estimate || estimate.epsAvg <= 0) return null;
    
    return currentPrice / estimate.epsAvg;
  }

  calculateTTMEPSGrowth(): number | null {
    const sortedEstimates = this.estimates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedEstimates.length < 2) return null;
    
    const current = sortedEstimates[0];
    const previous = sortedEstimates[1];
    
    if (!current || !previous || previous.epsAvg <= 0) return null;
    
    return ((current.epsAvg - previous.epsAvg) / previous.epsAvg) * 100;
  }

  calculateCurrentYearEPSGrowth(): number | null {
    const currentYearEst = this.estimates.find(est => est.date.includes('2025'));
    const previousYearEst = this.estimates.find(est => est.date.includes('2024'));
    
    if (!currentYearEst || !previousYearEst || previousYearEst.epsAvg <= 0) return null;
    
    return ((currentYearEst.epsAvg - previousYearEst.epsAvg) / previousYearEst.epsAvg) * 100;
  }

  calculateNextYearEPSGrowth(): number | null {
    const nextYearEst = this.estimates.find(est => est.date.includes('2026'));
    const currentYearEst = this.estimates.find(est => est.date.includes('2025'));
    
    if (!nextYearEst || !currentYearEst || currentYearEst.epsAvg <= 0) return null;
    
    return ((nextYearEst.epsAvg - currentYearEst.epsAvg) / currentYearEst.epsAvg) * 100;
  }

  calculateTTMRevenueGrowth(): number | null {
    const sortedEstimates = this.estimates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedEstimates.length < 2) return null;
    
    const current = sortedEstimates[0];
    const previous = sortedEstimates[1];
    
    if (!current || !previous || previous.revenueAvg <= 0) return null;
    
    return ((current.revenueAvg - previous.revenueAvg) / previous.revenueAvg) * 100;
  }

  calculateCurrentYearExpectedRevenueGrowth(): number | null {
    const currentYearEst = this.estimates.find(est => est.date.includes('2025'));
    const previousYearEst = this.estimates.find(est => est.date.includes('2024'));
    
    if (!currentYearEst || !previousYearEst || previousYearEst.revenueAvg <= 0) return null;
    
    return ((currentYearEst.revenueAvg - previousYearEst.revenueAvg) / previousYearEst.revenueAvg) * 100;
  }

  calculateNextYearRevenueGrowth(): number | null {
    const nextYearEst = this.estimates.find(est => est.date.includes('2026'));
    const currentYearEst = this.estimates.find(est => est.date.includes('2025'));
    
    if (!nextYearEst || !currentYearEst || currentYearEst.revenueAvg <= 0) return null;
    
    return ((nextYearEst.revenueAvg - currentYearEst.revenueAvg) / currentYearEst.revenueAvg) * 100;
  }

  calculateTTMPE(currentPrice: number): number | null {
    const sortedEstimates = this.estimates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const mostRecentEstimate = sortedEstimates[0];
    
    if (!mostRecentEstimate || mostRecentEstimate.epsAvg <= 0) return null;
    
    return currentPrice / mostRecentEstimate.epsAvg;
  }

  calculateNetMargin(): number | null {
    if (!this.companyOverview) return null;
    
    const profitMarginString = this.companyOverview.ProfitMargin;
    
    if (!profitMarginString || profitMarginString === 'None' || profitMarginString === '-') return null;
    
    const profitMargin = parseFloat(profitMarginString);
    
    if (isNaN(profitMargin)) return null;
    
    // ProfitMargin is already in decimal format (e.g., 0.145), so multiply by 100 for percentage
    return profitMargin * 100;
  }

  calculateTTMPriceToSales(): number | null {
    const marketCap = this.getCurrentMarketCap();
    if (!marketCap) return null;
    
    const sortedEstimates = this.estimates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const mostRecentEstimate = sortedEstimates[0];
    
    if (!mostRecentEstimate || mostRecentEstimate.revenueAvg <= 0) return null;
    
    return marketCap / mostRecentEstimate.revenueAvg;
  }

  calculateForwardPriceToSales(): number | null {
    const marketCap = this.getCurrentMarketCap();
    if (!marketCap) return null;
    
    const currentYearEst = this.estimates.find(est => est.date.includes('2025'));
    
    if (!currentYearEst || currentYearEst.revenueAvg <= 0) return null;
    
    return marketCap / currentYearEst.revenueAvg;
  }

  calculateGrossMargin(): number | null {
    if (!this.companyOverview) return null;
    
    const grossProfitString = this.companyOverview.GrossProfitTTM;
    const revenueTTMString = this.companyOverview.RevenueTTM;
    
    if (!grossProfitString || !revenueTTMString || 
        grossProfitString === 'None' || revenueTTMString === 'None' ||
        grossProfitString === '-' || revenueTTMString === '-') return null;
    
    const grossProfit = parseFloat(grossProfitString);
    const revenue = parseFloat(revenueTTMString);
    
    if (isNaN(grossProfit) || isNaN(revenue) || revenue <= 0) return null;
    
    return (grossProfit / revenue) * 100;
  }


  private roundToTenth(value: number | null): number | null {
    if (value === null) return null;
    return Math.round(value * 100) / 100;
  }

  private parseAlphaVantageValue(value: string | undefined): number | null {
    if (!value || value === 'None' || value === '-' || value === 'N/A') return null;
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }

  private parseAlphaVantagePercentage(value: string | undefined): number | null {
    const parsed = this.parseAlphaVantageValue(value);
    if (parsed === null) return null;
    
    // If the value is already a percentage (> 1), return as is, otherwise convert from decimal
    return parsed > 1 ? parsed : parsed * 100;
  }

  async calculateAllMetrics(symbol: string, providedPrice?: number): Promise<FinancialMetrics> {
    console.log(`🚀 Starting calculateAllMetrics for ${symbol}, providedPrice:`, providedPrice);
    
    // Fetch data with graceful error handling for AlphaVantage API failures
    const [estimatesResult, overviewResult, priceResult] = await Promise.allSettled([
      this.fetchAnalystEstimates(symbol),
      this.fetchCompanyOverview(symbol),
      providedPrice ? Promise.resolve(null) : this.fetchCurrentPrice(symbol)
    ]);
    
    // Process results, handling failures gracefully
    let fetchedPrice: number | null = null;
    
    if (estimatesResult.status === 'rejected') {
      console.error(`❌ Failed to fetch analyst estimates:`, estimatesResult.reason);
    }
    
    if (overviewResult.status === 'rejected') {
      console.log(`⚠️ Failed to fetch company overview (likely AlphaVantage rate limit):`, overviewResult.reason);
      this.companyOverview = null;
    }
    
    if (priceResult.status === 'fulfilled') {
      fetchedPrice = priceResult.value;
    } else if (priceResult.status === 'rejected') {
      console.log(`⚠️ Failed to fetch current price:`, priceResult.reason);
    }
    
    console.log(`📊 Data fetching completed:`, {
      estimatesCount: this.estimates.length,
      hasCompanyOverview: !!this.companyOverview,
      fetchedPrice,
      providedPrice
    });
    
    // Determine which price to use and track the source
    let currentPrice: number;
    let priceSource: 'provided' | 'fetched' | 'default';
    
    if (providedPrice) {
      currentPrice = providedPrice;
      priceSource = 'provided';
    } else if (fetchedPrice) {
      currentPrice = fetchedPrice;
      priceSource = 'fetched';
    } else {
      currentPrice = 100; // Default fallback
      priceSource = 'default';
    }
    
    console.log(`💰 Price determination:`, { currentPrice, priceSource });

    const av = this.companyOverview; // Shorthand for AlphaVantage data
    console.log(`🏢 AlphaVantage overview available:`, !!av);
    
    if (av) {
      console.log(`📈 Key AlphaVantage metrics:`, {
        trailingPE: av.TrailingPE,
        forwardPE: av.ForwardPE,
        marketCap: av.MarketCapitalization,
        profitMargin: av.ProfitMargin,
        priceToSalesRatio: av.PriceToSalesRatioTTM
      });
    }
    
    const calculatedMetrics = {
      symbol,
      currentPrice: this.roundToTenth(currentPrice)!,
      currentPriceSource: priceSource,
      marketCap: this.getCurrentMarketCap(),
      
      // PE Ratios - Mix of AlphaVantage and calculated
      ttmPE: this.roundToTenth(this.parseAlphaVantageValue(av?.TrailingPE)),
      forwardPE: this.roundToTenth(this.parseAlphaVantageValue(av?.ForwardPE)),
      twoYearForwardPE: this.roundToTenth(this.calculate2YearForwardPE(currentPrice)),
      
      // EPS Growth - All calculated from analyst estimates
      ttmEPSGrowth: this.roundToTenth(this.calculateTTMEPSGrowth()),
      currentYearEPSGrowth: this.roundToTenth(this.calculateCurrentYearEPSGrowth()),
      nextYearEPSGrowth: this.roundToTenth(this.calculateNextYearEPSGrowth()),
      
      // Revenue Growth - All calculated from analyst estimates
      ttmRevenueGrowth: this.roundToTenth(this.calculateTTMRevenueGrowth()),
      currentYearExpectedRevenueGrowth: this.roundToTenth(this.calculateCurrentYearExpectedRevenueGrowth()),
      nextYearRevenueGrowth: this.roundToTenth(this.calculateNextYearRevenueGrowth()),
      
      // Margins - Mix of AlphaVantage and calculated
      grossMargin: this.roundToTenth(this.calculateGrossMargin()),
      netMargin: this.roundToTenth(this.parseAlphaVantagePercentage(av?.ProfitMargin)),
      
      // Price-to-Sales - Mix of AlphaVantage and calculated
      ttmPriceToSales: this.roundToTenth(this.parseAlphaVantageValue(av?.PriceToSalesRatioTTM)),
      forwardPriceToSales: this.roundToTenth(this.calculateForwardPriceToSales())
    };
    
    console.log(`✅ Final calculated metrics:`, calculatedMetrics);
    
    return calculatedMetrics;
  }
}