import {
  calculateMoviePrice,
  calculateMoviePriceById,
  getMultipleMoviePrices,
  simulatePriceUpdate,
} from '../priceService';

// Mock the API service
jest.mock('../api', () => ({
  fetchMovieDetails: jest.fn(() =>
    Promise.resolve({
      id: 1,
      title: 'Test Movie',
      budget: 100000000,
      revenue: 500000000,
      genres: [{ id: 28, name: 'Action' }],
      vote_average: 8.0,
      vote_count: 5000,
      popularity: 250,
      release_date: '2024-01-01',
    })
  ),
}));

describe('PriceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMoviePrice', () => {
    const mockMovie: Movie = {
      id: 1,
      title: 'Test Movie',
      release_date: '2024-01-01',
      vote_average: 8.0,
      popularity: 250,
      genre_ids: [28], // Action
      poster_path: '/test.jpg',
      backdrop_path: '/test-backdrop.jpg',
      adult: false,
      original_language: 'en',
      original_title: 'Test Movie',
      overview: 'A test movie',
      vote_count: 5000,
      video: false,
    };

    it('should calculate movie price with all factors', async () => {
      const result = await calculateMoviePrice(mockMovie);

      expect(result.movieId).toBe(1);
      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.currentPrice).toBeGreaterThan(0);
      expect(result.volume).toBeGreaterThan(0);
      expect(result.marketCap).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle high-rated movies correctly', async () => {
      const highRatedMovie = {
        ...mockMovie,
        vote_average: 9.5,
        vote_count: 10000,
        popularity: 1000,
      };

      const result = await calculateMoviePrice(highRatedMovie);

      expect(result.basePrice).toBeGreaterThan(50); // Should be above base price
      expect(result.volume).toBeGreaterThan(1000); // High popularity = high volume
    });

    it('should handle low-rated movies correctly', async () => {
      const lowRatedMovie = {
        ...mockMovie,
        vote_average: 3.0,
        vote_count: 100,
        popularity: 10,
      };

      const result = await calculateMoviePrice(lowRatedMovie);

      expect(result.basePrice).toBeGreaterThanOrEqual(5); // Should not go below minimum
      expect(result.volume).toBeGreaterThanOrEqual(1000); // Should have minimum volume
    });

    it('should apply genre multipliers correctly', async () => {
      const horrorMovie = {
        ...mockMovie,
        genre_ids: [27], // Horror genre
      };

      const result = await calculateMoviePrice(horrorMovie);

      expect(result.basePrice).toBeGreaterThan(0);
      // Horror has a 1.3 multiplier, so should be higher than base
    });

    it('should handle API errors gracefully', async () => {
      const mockFetchMovieDetails = require('../api').fetchMovieDetails;
      mockFetchMovieDetails.mockRejectedValueOnce(new Error('API Error'));

      const result = await calculateMoviePrice(mockMovie);

      expect(result.movieId).toBe(1);
      expect(result.basePrice).toBe(50); // Fallback base price
      expect(result.currentPrice).toBe(50);
      expect(result.priceChange).toBe(0);
    });
  });

  describe('calculateMoviePriceById', () => {
    it('should calculate price by movie ID', async () => {
      const result = await calculateMoviePriceById(1);

      expect(result.movieId).toBe(1);
      expect(result.currentPrice).toBeGreaterThan(0);
      expect(result.basePrice).toBeGreaterThan(0);
    });

    it('should handle non-existent movie ID', async () => {
      const mockFetchMovieDetails = require('../api').fetchMovieDetails;
      mockFetchMovieDetails.mockResolvedValueOnce(null);

      await expect(calculateMoviePriceById(999)).rejects.toThrow(
        'Movie with ID 999 not found'
      );
    });

    it('should return fallback data on error', async () => {
      const mockFetchMovieDetails = require('../api').fetchMovieDetails;
      mockFetchMovieDetails.mockRejectedValueOnce(new Error('API Error'));

      const result = await calculateMoviePriceById(1);

      expect(result.movieId).toBe(1);
      expect(result.basePrice).toBe(50); // Fallback base price
    });
  });

  describe('getMultipleMoviePrices', () => {
    const mockMovies: Movie[] = [
      {
        id: 1,
        title: 'Movie 1',
        release_date: '2024-01-01',
        vote_average: 8.0,
        popularity: 250,
        genre_ids: [28],
        poster_path: '/test1.jpg',
        backdrop_path: '/test1-backdrop.jpg',
        adult: false,
        original_language: 'en',
        original_title: 'Movie 1',
        overview: 'First test movie',
        vote_count: 5000,
        video: false,
      },
      {
        id: 2,
        title: 'Movie 2',
        release_date: '2024-02-01',
        vote_average: 7.5,
        popularity: 200,
        genre_ids: [35],
        poster_path: '/test2.jpg',
        backdrop_path: '/test2-backdrop.jpg',
        adult: false,
        original_language: 'en',
        original_title: 'Movie 2',
        overview: 'Second test movie',
        vote_count: 3000,
        video: false,
      },
    ];

    it('should calculate prices for multiple movies', async () => {
      const results = await getMultipleMoviePrices(mockMovies);

      expect(results).toHaveLength(2);
      expect(results[0].movieId).toBe(1);
      expect(results[1].movieId).toBe(2);
      expect(results[0].currentPrice).toBeGreaterThan(0);
      expect(results[1].currentPrice).toBeGreaterThan(0);
    });

    it('should handle empty movie array', async () => {
      const results = await getMultipleMoviePrices([]);

      expect(results).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const mockFetchMovieDetails = require('../api').fetchMovieDetails;
      mockFetchMovieDetails.mockRejectedValue(new Error('API Error'));

      const results = await getMultipleMoviePrices(mockMovies);

      expect(results).toHaveLength(2);
      // Should return fallback data for both movies
      expect(results[0].basePrice).toBe(50);
      expect(results[1].basePrice).toBe(50);
    });
  });

  describe('simulatePriceUpdate', () => {
    const mockPriceData = {
      movieId: 1,
      basePrice: 50,
      currentPrice: 55,
      priceChange: 5,
      priceChangePercent: 10,
      volume: 1000,
      marketCap: 55000000,
      volatility: 0.1,
      lastUpdated: '2024-01-01T00:00:00.000Z',
    };

    it('should update price with volatility', () => {
      const result = simulatePriceUpdate(mockPriceData);

      expect(result.movieId).toBe(1);
      expect(result.currentPrice).toBeGreaterThan(0);
      expect(result.lastUpdated).not.toBe(mockPriceData.lastUpdated);
      expect(result.priceChange).toBeDefined();
      expect(result.priceChangePercent).toBeDefined();
    });

    it('should respect minimum and maximum price bounds', () => {
      const highVolatilityData = {
        ...mockPriceData,
        volatility: 1.0, // Very high volatility
        currentPrice: 10,
      };

      const result = simulatePriceUpdate(highVolatilityData);

      expect(result.currentPrice).toBeGreaterThanOrEqual(5); // MIN_PRICE
      expect(result.currentPrice).toBeLessThanOrEqual(500); // MAX_PRICE
    });

    it('should apply market activity modifiers correctly', () => {
      // Mock different times of day
      const originalDate = Date;
      
      // Business hours (higher activity)
      global.Date = jest.fn(() => {
        const date = new originalDate();
        jest.spyOn(date, 'getHours').mockReturnValue(14); // 2 PM
        jest.spyOn(date, 'getDay').mockReturnValue(2); // Tuesday
        return date;
      }) as any;
      global.Date.now = originalDate.now;

      const result = simulatePriceUpdate(mockPriceData);

      expect(result.movieId).toBe(1);
      expect(result.currentPrice).toBeGreaterThan(0);

      // Restore original Date
      global.Date = originalDate;
    });
  });
});