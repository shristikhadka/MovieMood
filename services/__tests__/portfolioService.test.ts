import {
  initializePortfolio,
  buyStock,
  sellStock,
  getPortfolio,
  getPortfolioStats,
  resetPortfolio,
} from '../portfolioService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the price service
jest.mock('../priceService', () => ({
  calculateMoviePriceById: jest.fn(() =>
    Promise.resolve({
      movieId: 1,
      currentPrice: 50,
      basePrice: 45,
      priceChange: 5,
      priceChangePercent: 11.11,
      volume: 1000,
      marketCap: 50000000,
      volatility: 0.1,
      lastUpdated: new Date().toISOString(),
    })
  ),
}));

describe('PortfolioService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('initializePortfolio', () => {
    it('should create a new portfolio with initial cash', async () => {
      const portfolio = await initializePortfolio();

      expect(portfolio.cash).toBe(100000);
      expect(portfolio.totalValue).toBe(100000);
      expect(portfolio.totalInvested).toBe(0);
      expect(portfolio.totalProfitLoss).toBe(0);
      expect(portfolio.holdings).toEqual([]);
      expect(portfolio.transactions).toEqual([]);
      expect(portfolio.createdAt).toBeDefined();
      expect(portfolio.lastUpdated).toBeDefined();
    });

    it('should save portfolio to AsyncStorage', async () => {
      await initializePortfolio();

      const savedData = await AsyncStorage.getItem('movie_portfolio');
      expect(savedData).toBeDefined();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData.cash).toBe(100000);
    });
  });

  describe('buyStock', () => {
    beforeEach(async () => {
      await initializePortfolio();
    });

    it('should successfully buy stock when sufficient funds', async () => {
      const result = await buyStock(1, 'Test Movie', '/poster.jpg', 10, 50);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully bought');
      expect(result.portfolio).toBeDefined();
      expect(result.portfolio!.cash).toBe(99500); // 100000 - (10 * 50)
      expect(result.portfolio!.holdings).toHaveLength(1);
      expect(result.portfolio!.holdings[0].shares).toBe(10);
      expect(result.portfolio!.transactions).toHaveLength(1);
    });

    it('should fail when insufficient funds', async () => {
      const result = await buyStock(1, 'Expensive Movie', '/poster.jpg', 3000, 50);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient funds');
      expect(result.portfolio).toBeUndefined();
    });

    it('should update existing holding when buying same stock', async () => {
      // First purchase
      await buyStock(1, 'Test Movie', '/poster.jpg', 10, 50);

      // Second purchase
      const result = await buyStock(1, 'Test Movie', '/poster.jpg', 5, 60);

      expect(result.success).toBe(true);
      expect(result.portfolio!.holdings).toHaveLength(1);
      expect(result.portfolio!.holdings[0].shares).toBe(15);
      expect(result.portfolio!.holdings[0].averagePrice).toBeCloseTo(53.33, 2);
    });
  });

  describe('sellStock', () => {
    beforeEach(async () => {
      await initializePortfolio();
      await buyStock(1, 'Test Movie', '/poster.jpg', 20, 50);
    });

    it('should successfully sell stock when sufficient shares', async () => {
      const result = await sellStock(1, 10, 55);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully sold');
      expect(result.portfolio).toBeDefined();
      expect(result.portfolio!.cash).toBe(99550); // 99000 + (10 * 55)
      expect(result.portfolio!.holdings[0].shares).toBe(10);
    });

    it('should fail when insufficient shares', async () => {
      const result = await sellStock(1, 25, 55);

      expect(result.success).toBe(false);
      expect(result.message).toContain('only own 20 shares');
      expect(result.portfolio).toBeUndefined();
    });

    it('should remove holding when selling all shares', async () => {
      const result = await sellStock(1, 20, 55);

      expect(result.success).toBe(true);
      expect(result.portfolio!.holdings).toHaveLength(0);
    });

    it('should fail when trying to sell non-existent stock', async () => {
      const result = await sellStock(999, 5, 55);

      expect(result.success).toBe(false);
      expect(result.message).toContain('don\'t own any shares');
    });
  });

  describe('getPortfolioStats', () => {
    beforeEach(async () => {
      await initializePortfolio();
    });

    it('should return empty stats for new portfolio', async () => {
      const stats = await getPortfolioStats();

      expect(stats.bestPerformer).toBeNull();
      expect(stats.worstPerformer).toBeNull();
      expect(stats.totalTransactions).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.averageReturn).toBe(0);
      expect(stats.riskScore).toBe(0);
    });

    it('should calculate stats correctly with holdings', async () => {
      // Buy some stocks with different performance
      await buyStock(1, 'Winner Movie', '/poster1.jpg', 10, 40);
      await buyStock(2, 'Loser Movie', '/poster2.jpg', 10, 60);

      // Manually update portfolio to simulate price changes
      const portfolio = await getPortfolio();
      portfolio.holdings[0].currentPrice = 50; // 25% gain
      portfolio.holdings[0].totalValue = 500;
      portfolio.holdings[0].profitLoss = 100;
      portfolio.holdings[0].profitLossPercent = 25;

      portfolio.holdings[1].currentPrice = 50; // 16.67% loss
      portfolio.holdings[1].totalValue = 500;
      portfolio.holdings[1].profitLoss = -100;
      portfolio.holdings[1].profitLossPercent = -16.67;

      await AsyncStorage.setItem('movie_portfolio', JSON.stringify(portfolio));

      const stats = await getPortfolioStats();

      expect(stats.bestPerformer?.profitLossPercent).toBe(25);
      expect(stats.worstPerformer?.profitLossPercent).toBeCloseTo(-16.67, 2);
      expect(stats.winRate).toBe(50); // 1 out of 2 profitable
      expect(stats.averageReturn).toBeCloseTo(4.17, 1);
    });
  });

  describe('resetPortfolio', () => {
    it('should reset portfolio to initial state', async () => {
      // Create and modify portfolio
      await buyStock(1, 'Test Movie', '/poster.jpg', 10, 50);

      // Reset portfolio
      const newPortfolio = await resetPortfolio();

      expect(newPortfolio.cash).toBe(100000);
      expect(newPortfolio.holdings).toEqual([]);
      expect(newPortfolio.transactions).toEqual([]);
    });
  });

  describe('getPortfolio', () => {
    it('should initialize portfolio if none exists', async () => {
      const portfolio = await getPortfolio();

      expect(portfolio.cash).toBe(100000);
      expect(portfolio.holdings).toEqual([]);
    });

    it('should return existing portfolio', async () => {
      await buyStock(1, 'Test Movie', '/poster.jpg', 10, 50);
      
      const portfolio = await getPortfolio();

      expect(portfolio.holdings).toHaveLength(1);
      expect(portfolio.cash).toBe(99500);
    });
  });
});