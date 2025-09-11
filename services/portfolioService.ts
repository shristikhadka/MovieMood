import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateMoviePriceById } from './priceService';

// Portfolio interfaces
export interface MovieStock {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number;
  lastUpdated: string;
}

export interface Holding {
  movieId: number;
  movieTitle: string;
  posterPath: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Transaction {
  id: string;
  movieId: number;
  movieTitle: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  totalAmount: number;
  timestamp: string;
}

export interface Portfolio {
  cash: number;
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: Holding[];
  transactions: Transaction[];
  createdAt: string;
  lastUpdated: string;
}

export interface PortfolioStats {
  bestPerformer: Holding | null;
  worstPerformer: Holding | null;
  totalTransactions: number;
  winRate: number;
  averageReturn: number;
  riskScore: number;
}

// Constants
const INITIAL_CASH = 100000; // $100,000 starting balance
const PORTFOLIO_STORAGE_KEY = 'movie_portfolio';
const TRANSACTIONS_STORAGE_KEY = 'portfolio_transactions';

/**
 * Generate a professional transaction ID
 */
const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  // Use a combination of timestamp and performance.now() for uniqueness
  const performanceId = Math.floor(performance.now() * 1000).toString(36);
  const randomSuffix = Math.floor(Math.random() * 1000000).toString(36);
  return `tx_${timestamp}_${performanceId}_${randomSuffix}`;
};

/**
 * Initialize a new portfolio for the user
 */
export const initializePortfolio = async (): Promise<Portfolio> => {
  const newPortfolio: Portfolio = {
    cash: INITIAL_CASH,
    totalValue: INITIAL_CASH,
    totalInvested: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    holdings: [],
    transactions: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(newPortfolio));
  return newPortfolio;
};

/**
 * Get the current portfolio
 */
export const getPortfolio = async (): Promise<Portfolio> => {
  try {
    const portfolioData = await AsyncStorage.getItem(PORTFOLIO_STORAGE_KEY);
    
    if (!portfolioData) {
      return await initializePortfolio();
    }

    const portfolio: Portfolio = JSON.parse(portfolioData);
    
    // Update portfolio with current prices
    const updatedPortfolio = await updatePortfolioPrices(portfolio);
    return updatedPortfolio;
  } catch (error) {
    console.error('Error getting portfolio:', error);
    return await initializePortfolio();
  }
};

/**
 * Update portfolio with current movie stock prices
 */
export const updatePortfolioPrices = async (portfolio: Portfolio): Promise<Portfolio> => {
  try {
    // Use the imported price service to get real calculated prices
    
    // Get current prices for all movies in portfolio
    const movieIds = portfolio.holdings.map(h => h.movieId);
    const currentPrices = await Promise.all(
      movieIds.map(id => calculateMoviePriceById(id))
    );
    
    const updatedHoldings = portfolio.holdings.map(holding => {
      const currentPriceData = currentPrices.find(p => p.movieId === holding.movieId);
      const newPrice = currentPriceData ? currentPriceData.currentPrice : holding.currentPrice;
      const priceChange = newPrice - holding.currentPrice;
      
      return {
        ...holding,
        currentPrice: newPrice,
        priceChange,
        priceChangePercent: holding.currentPrice > 0 ? (priceChange / holding.currentPrice) * 100 : 0,
        totalValue: holding.shares * newPrice,
        profitLoss: (newPrice - holding.averagePrice) * holding.shares,
        profitLossPercent: holding.averagePrice > 0 ? ((newPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0,
      };
    });

    // Calculate total portfolio value
    const totalHoldingsValue = updatedHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
    const totalValue = portfolio.cash + totalHoldingsValue;
    const totalInvested = updatedHoldings.reduce((sum, holding) => sum + (holding.averagePrice * holding.shares), 0);
    const totalProfitLoss = totalValue - INITIAL_CASH;
    const totalProfitLossPercent = (totalProfitLoss / INITIAL_CASH) * 100;

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      holdings: updatedHoldings,
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
      lastUpdated: new Date().toISOString(),
    };

    // Save updated portfolio
    await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolio));
    return updatedPortfolio;
  } catch (error) {
    console.error('Error updating portfolio prices:', error);
    return portfolio;
  }
};

/**
 * Buy movie stock
 */
export const buyStock = async (
  movieId: number,
  movieTitle: string,
  posterPath: string,
  shares: number,
  price: number
): Promise<{ success: boolean; message: string; portfolio?: Portfolio }> => {
  try {
    const portfolio = await getPortfolio();
    const totalCost = shares * price;

    // Check if user has enough cash
    if (portfolio.cash < totalCost) {
      return {
        success: false,
        message: `Insufficient funds. You need $${totalCost.toFixed(2)} but only have $${portfolio.cash.toFixed(2)}`,
      };
    }

    // Check if user already owns this stock
    const existingHoldingIndex = portfolio.holdings.findIndex(h => h.movieId === movieId);
    
    let updatedHoldings: Holding[];
    
    if (existingHoldingIndex >= 0) {
      // Update existing holding
      const existingHolding = portfolio.holdings[existingHoldingIndex];
      const newTotalShares = existingHolding.shares + shares;
      const newTotalCost = (existingHolding.averagePrice * existingHolding.shares) + totalCost;
      const newAveragePrice = newTotalCost / newTotalShares;

      updatedHoldings = [...portfolio.holdings];
      updatedHoldings[existingHoldingIndex] = {
        ...existingHolding,
        shares: newTotalShares,
        averagePrice: newAveragePrice,
        currentPrice: price,
        totalValue: newTotalShares * price,
        profitLoss: (price - newAveragePrice) * newTotalShares,
        profitLossPercent: ((price - newAveragePrice) / newAveragePrice) * 100,
      };
    } else {
      // Create new holding
      const newHolding: Holding = {
        movieId,
        movieTitle,
        posterPath,
        shares,
        averagePrice: price,
        currentPrice: price,
        totalValue: shares * price,
        profitLoss: 0,
        profitLossPercent: 0,
      };

      updatedHoldings = [...portfolio.holdings, newHolding];
    }

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${generateTransactionId()}`,
      movieId,
      movieTitle,
      type: 'buy',
      shares,
      price,
      totalAmount: totalCost,
      timestamp: new Date().toISOString(),
    };

    // Update portfolio
    const updatedPortfolio: Portfolio = {
      ...portfolio,
      cash: portfolio.cash - totalCost,
      holdings: updatedHoldings,
      transactions: [...portfolio.transactions, transaction],
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate totals
    const totalHoldingsValue = updatedHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
    updatedPortfolio.totalValue = updatedPortfolio.cash + totalHoldingsValue;
    updatedPortfolio.totalInvested = updatedHoldings.reduce((sum, holding) => sum + (holding.averagePrice * holding.shares), 0);
    updatedPortfolio.totalProfitLoss = updatedPortfolio.totalValue - INITIAL_CASH;
    updatedPortfolio.totalProfitLossPercent = (updatedPortfolio.totalProfitLoss / INITIAL_CASH) * 100;

    // Save updated portfolio
    await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolio));

    return {
      success: true,
      message: `Successfully bought ${shares} shares of ${movieTitle} for $${totalCost.toFixed(2)}`,
      portfolio: updatedPortfolio,
    };
  } catch (error) {
    console.error('Error buying stock:', error);
    return {
      success: false,
      message: 'Failed to buy stock. Please try again.',
    };
  }
};

/**
 * Sell movie stock
 */
export const sellStock = async (
  movieId: number,
  shares: number,
  price: number
): Promise<{ success: boolean; message: string; portfolio?: Portfolio }> => {
  try {
    const portfolio = await getPortfolio();
    
    // Find the holding
    const holdingIndex = portfolio.holdings.findIndex(h => h.movieId === movieId);
    
    if (holdingIndex === -1) {
      return {
        success: false,
        message: 'You don\'t own any shares of this movie.',
      };
    }

    const holding = portfolio.holdings[holdingIndex];
    
    // Check if user has enough shares
    if (holding.shares < shares) {
      return {
        success: false,
        message: `You only own ${holding.shares} shares. Cannot sell ${shares} shares.`,
      };
    }

    const totalRevenue = shares * price;
    const remainingShares = holding.shares - shares;

    // Create transaction record
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${generateTransactionId()}`,
      movieId,
      movieTitle: holding.movieTitle,
      type: 'sell',
      shares,
      price,
      totalAmount: totalRevenue,
      timestamp: new Date().toISOString(),
    };

    let updatedHoldings: Holding[];

    if (remainingShares === 0) {
      // Remove holding completely
      updatedHoldings = portfolio.holdings.filter((_, index) => index !== holdingIndex);
    } else {
      // Update holding
      updatedHoldings = [...portfolio.holdings];
      updatedHoldings[holdingIndex] = {
        ...holding,
        shares: remainingShares,
        totalValue: remainingShares * price,
        profitLoss: (price - holding.averagePrice) * remainingShares,
        profitLossPercent: ((price - holding.averagePrice) / holding.averagePrice) * 100,
      };
    }

    // Update portfolio
    const updatedPortfolio: Portfolio = {
      ...portfolio,
      cash: portfolio.cash + totalRevenue,
      holdings: updatedHoldings,
      transactions: [...portfolio.transactions, transaction],
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate totals
    const totalHoldingsValue = updatedHoldings.reduce((sum, holding) => sum + holding.totalValue, 0);
    updatedPortfolio.totalValue = updatedPortfolio.cash + totalHoldingsValue;
    updatedPortfolio.totalInvested = updatedHoldings.reduce((sum, holding) => sum + (holding.averagePrice * holding.shares), 0);
    updatedPortfolio.totalProfitLoss = updatedPortfolio.totalValue - INITIAL_CASH;
    updatedPortfolio.totalProfitLossPercent = (updatedPortfolio.totalProfitLoss / INITIAL_CASH) * 100;

    // Save updated portfolio
    await AsyncStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(updatedPortfolio));

    return {
      success: true,
      message: `Successfully sold ${shares} shares for $${totalRevenue.toFixed(2)}`,
      portfolio: updatedPortfolio,
    };
  } catch (error) {
    console.error('Error selling stock:', error);
    return {
      success: false,
      message: 'Failed to sell stock. Please try again.',
    };
  }
};

/**
 * Get portfolio statistics
 */
export const getPortfolioStats = async (): Promise<PortfolioStats> => {
  try {
    const portfolio = await getPortfolio();
    
    if (portfolio.holdings.length === 0) {
      return {
        bestPerformer: null,
        worstPerformer: null,
        totalTransactions: portfolio.transactions.length,
        winRate: 0,
        averageReturn: 0,
        riskScore: 0,
      };
    }

    // Find best and worst performers
    const sortedByPerformance = [...portfolio.holdings].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
    const bestPerformer = sortedByPerformance[0];
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

    // Calculate win rate (percentage of profitable holdings)
    const profitableHoldings = portfolio.holdings.filter(h => h.profitLoss > 0).length;
    const winRate = (profitableHoldings / portfolio.holdings.length) * 100;

    // Calculate average return
    const averageReturn = portfolio.holdings.reduce((sum, h) => sum + h.profitLossPercent, 0) / portfolio.holdings.length;

    // Calculate risk score (volatility of returns)
    const returns = portfolio.holdings.map(h => h.profitLossPercent);
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const riskScore = Math.sqrt(variance);

    return {
      bestPerformer,
      worstPerformer,
      totalTransactions: portfolio.transactions.length,
      winRate,
      averageReturn,
      riskScore,
    };
  } catch (error) {
    console.error('Error getting portfolio stats:', error);
    return {
      bestPerformer: null,
      worstPerformer: null,
      totalTransactions: 0,
      winRate: 0,
      averageReturn: 0,
      riskScore: 0,
    };
  }
};

/**
 * Reset portfolio (for testing or new game)
 */
export const resetPortfolio = async (): Promise<Portfolio> => {
  await AsyncStorage.removeItem(PORTFOLIO_STORAGE_KEY);
  await AsyncStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
  return await initializePortfolio();
};
