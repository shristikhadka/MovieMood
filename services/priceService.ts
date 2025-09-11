import { fetchMovieDetails } from './api';

// Price calculation interfaces
export interface MoviePriceData {
  movieId: number;
  basePrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number;
  volatility: number;
  lastUpdated: string;
}

export interface PriceFactors {
  popularity: number;
  rating: number;
  releaseDate: string;
  budget: number;
  revenue: number;
  voteCount: number;
  genreMultiplier: number;
  seasonalMultiplier: number;
  trendMultiplier: number;
}

// Constants for price calculation
const BASE_PRICE = 50; // Starting price for all movies
const MIN_PRICE = 5;   // Minimum price
const MAX_PRICE = 500; // Maximum price
const VOLATILITY_FACTOR = 0.1; // How much prices can fluctuate

// Genre multipliers (some genres are more valuable than others)
const GENRE_MULTIPLIERS: { [key: number]: number } = {
  28: 1.2,  // Action
  12: 1.1,  // Adventure
  16: 0.9,  // Animation
  35: 1.0,  // Comedy
  80: 0.8,  // Crime
  99: 0.7,  // Documentary
  18: 1.0,  // Drama
  10751: 0.9, // Family
  14: 1.1,  // Fantasy
  36: 0.8,  // History
  27: 1.3,  // Horror
  10402: 0.9, // Music
  9648: 1.1, // Mystery
  10749: 1.0, // Romance
  878: 1.2,  // Science Fiction
  10770: 0.8, // TV Movie
  53: 1.1,   // Thriller
  10752: 0.9, // War
  37: 0.8,   // Western
};

/**
 * Calculate movie stock price by ID (convenience function)
 */
export const calculateMoviePriceById = async (movieId: number): Promise<MoviePriceData> => {
  try {
    // Get movie details first
    const movieDetails = await fetchMovieDetails(movieId);
    if (!movieDetails) {
      throw new Error(`Movie with ID ${movieId} not found`);
    }
    
    // Create a minimal Movie object
    const movie: Movie = {
      id: movieId,
      title: movieDetails.title || 'Unknown',
      release_date: movieDetails.release_date || '2024-01-01',
      vote_average: movieDetails.vote_average || 0,
      popularity: movieDetails.popularity || 0,
      genre_ids: movieDetails.genres?.map(g => g.id) || [],
      poster_path: movieDetails.poster_path || '',
      backdrop_path: movieDetails.backdrop_path || '',
      adult: movieDetails.adult || false,
      original_language: movieDetails.original_language || 'en',
      original_title: movieDetails.original_title || movieDetails.title || 'Unknown',
      overview: movieDetails.overview || '',
      vote_count: movieDetails.vote_count || 0,
      video: false,
    };
    
    return await calculateMoviePrice(movie);
  } catch (error) {
    console.error('Error calculating movie price by ID:', error);
    // Return fallback data
    return {
      movieId,
      basePrice: BASE_PRICE,
      currentPrice: BASE_PRICE,
      priceChange: 0,
      priceChangePercent: 0,
      volume: 1000,
      marketCap: BASE_PRICE * 1000 * 1000,
      volatility: 0.1,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Calculate movie stock price based on various factors
 */
export const calculateMoviePrice = async (movie: Movie): Promise<MoviePriceData> => {
  try {
    // Get detailed movie information
    const movieDetails = await fetchMovieDetails(movie.id);
    
    // Calculate price factors
    const factors = calculatePriceFactors(movie, movieDetails);
    
    // Calculate base price
    const basePrice = calculateBasePrice(factors);
    
    // Add realistic market volatility based on movie characteristics
    const volatility = calculateVolatility(factors);
    const marketVolatility = calculateMarketVolatility(factors, volatility);
    const currentPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, basePrice * (1 + marketVolatility)));
    const priceChange = currentPrice - basePrice;
    
    // Calculate volume (simulated trading volume)
    const volume = calculateVolume(factors);
    
    // Calculate market cap (simulated)
    const marketCap = currentPrice * volume * 1000; // Assume 1000 shares outstanding
    
    return {
      movieId: movie.id,
      basePrice,
      currentPrice,
      priceChange,
      priceChangePercent: (priceChange / basePrice) * 100,
      volume,
      marketCap,
      volatility,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error calculating movie price:', error);
    
    // Fallback to basic calculation
    return {
      movieId: movie.id,
      basePrice: BASE_PRICE,
      currentPrice: BASE_PRICE,
      priceChange: 0,
      priceChangePercent: 0,
      volume: 1000,
      marketCap: BASE_PRICE * 1000 * 1000,
      volatility: 0.1,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Calculate price factors from movie data
 */
interface MovieDetails {
  budget?: number;
  revenue?: number;
  genres?: Array<{ id: number; name: string }>;
}

const calculatePriceFactors = (movie: Movie, movieDetails: MovieDetails): PriceFactors => {
  // Popularity factor (0-1, higher is better)
  const popularity = Math.min(1, movie.popularity / 1000);
  
  // Rating factor (0-1, higher is better)
  const rating = movie.vote_average / 10;
  
  // Release date factor (newer movies tend to be more valuable)
  const releaseDate = movie.release_date;
  const daysSinceRelease = (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.1, 1 - (daysSinceRelease / 365)); // Decay over 1 year
  
  // Budget factor (higher budget = higher potential value)
  const budget = movieDetails?.budget || 0;
  const budgetFactor = Math.min(1, budget / 200000000); // Normalize to $200M max
  
  // Revenue factor (actual performance)
  const revenue = movieDetails?.revenue || 0;
  const revenueFactor = Math.min(1, revenue / 1000000000); // Normalize to $1B max
  
  // Vote count factor (more votes = more reliable rating)
  const voteCount = movie.vote_count;
  const voteCountFactor = Math.min(1, voteCount / 10000); // Normalize to 10K votes max
  
  // Genre multiplier
  const primaryGenre = movie.genre_ids[0] || 18; // Default to Drama
  const genreMultiplier = GENRE_MULTIPLIERS[primaryGenre] || 1.0;
  
  // Seasonal multiplier (simulate seasonal trends)
  const seasonalMultiplier = calculateSeasonalMultiplier(primaryGenre);
  
  // Trend multiplier (simulate market trends)
  const trendMultiplier = calculateTrendMultiplier(movie);
  
  return {
    popularity,
    rating,
    releaseDate,
    budget: budgetFactor,
    revenue: revenueFactor,
    voteCount: voteCountFactor,
    genreMultiplier,
    seasonalMultiplier,
    trendMultiplier,
  };
};

/**
 * Calculate base price from factors
 */
const calculateBasePrice = (factors: PriceFactors): number => {
  // Weighted combination of factors
  const price = BASE_PRICE * (
    factors.popularity * 0.2 +
    factors.rating * 0.2 +
    factors.budget * 0.15 +
    factors.revenue * 0.15 +
    factors.voteCount * 0.1 +
    factors.genreMultiplier * 0.1 +
    factors.seasonalMultiplier * 0.05 +
    factors.trendMultiplier * 0.05
  );
  
  return Math.max(MIN_PRICE, Math.min(MAX_PRICE, price));
};

/**
 * Calculate volatility based on factors
 */
const calculateVolatility = (factors: PriceFactors): number => {
  // Higher volatility for newer movies, lower for established ones
  const baseVolatility = VOLATILITY_FACTOR;
  const recencyVolatility = factors.popularity * 0.1; // Newer = more volatile
  const ratingVolatility = (1 - factors.rating) * 0.05; // Lower rated = more volatile
  
  return baseVolatility + recencyVolatility + ratingVolatility;
};

/**
 * Calculate realistic market volatility based on movie characteristics
 * This replaces pure randomness with data-driven fluctuations
 */
const calculateMarketVolatility = (factors: PriceFactors, baseVolatility: number): number => {
  // Use movie characteristics to determine volatility direction and magnitude
  const timeOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Market sentiment based on movie performance
  let sentimentFactor = 0;
  
  // Higher sentiment for well-rated movies
  if (factors.rating > 0.7) {
    sentimentFactor += 0.02;
  }
  
  // Higher sentiment for popular movies
  if (factors.popularity > 0.5) {
    sentimentFactor += 0.01;
  }
  
  // Weekend effect (movies perform better on weekends)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    sentimentFactor += 0.01;
  }
  
  // Evening effect (more movie interest in evenings)
  if (timeOfDay >= 18 && timeOfDay <= 23) {
    sentimentFactor += 0.005;
  }
  
  // Add controlled randomness within volatility bounds
  const randomFactor = (Math.random() - 0.5) * baseVolatility;
  
  // Combine sentiment and random factors
  const totalVolatility = sentimentFactor + randomFactor;
  
  // Ensure volatility stays within reasonable bounds (-5% to +5%)
  return Math.max(-0.05, Math.min(0.05, totalVolatility));
};

/**
 * Calculate trading volume
 */
const calculateVolume = (factors: PriceFactors): number => {
  // Volume based on popularity and rating
  const baseVolume = 1000;
  const popularityVolume = factors.popularity * 5000;
  const ratingVolume = factors.rating * 2000;
  
  return Math.round(baseVolume + popularityVolume + ratingVolume);
};

/**
 * Calculate seasonal multiplier based on genre
 */
const calculateSeasonalMultiplier = (genreId: number): number => {
  const month = new Date().getMonth();
  
  // Seasonal patterns
  const seasonalPatterns: { [key: number]: number[] } = {
    27: [1.2, 1.1, 1.3, 1.4, 1.1, 1.0, 0.9, 0.8, 0.9, 1.1, 1.3, 1.2], // Horror (Halloween)
    10749: [1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.0, 0.9, 0.8, 1.1], // Romance (Valentine's)
    28: [1.0, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8, 0.9], // Action (Summer)
    35: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // Comedy (consistent)
  };
  
  const pattern = seasonalPatterns[genreId] || Array(12).fill(1.0);
  return pattern[month];
};

/**
 * Calculate trend multiplier (simulate market trends)
 */
const calculateTrendMultiplier = (movie: Movie): number => {
  // Simulate trending based on recent popularity and movie characteristics
  const popularityFactor = Math.min(1, movie.popularity / 1000);
  const ratingFactor = movie.vote_average / 10;
  const recencyFactor = calculateRecencyFactor(movie.release_date);
  
  // Weighted combination for realistic trend calculation
  const trendFactor = 0.8 + (popularityFactor * 0.2) + (ratingFactor * 0.1) + (recencyFactor * 0.1);
  return Math.max(0.8, Math.min(1.2, trendFactor));
};

/**
 * Calculate recency factor based on release date
 */
const calculateRecencyFactor = (releaseDate: string): number => {
  const daysSinceRelease = (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceRelease < 30) return 0.2; // Very recent
  if (daysSinceRelease < 90) return 0.1; // Recent
  if (daysSinceRelease < 365) return 0.05; // Within a year
  return 0; // Older movies
};

/**
 * Get price data for multiple movies
 */
export const getMultipleMoviePrices = async (movies: Movie[]): Promise<MoviePriceData[]> => {
  try {
    const pricePromises = movies.map(movie => calculateMoviePrice(movie));
    const prices = await Promise.all(pricePromises);
    return prices;
  } catch (error) {
    console.error('Error getting multiple movie prices:', error);
    return [];
  }
};

/**
 * Simulate price updates (for real-time updates)
 * Uses market volatility and time-based factors for realistic price movements
 */
export const simulatePriceUpdate = (priceData: MoviePriceData): MoviePriceData => {
  const volatility = priceData.volatility;
  const timeOfDay = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Market activity factor (higher during business hours and weekends)
  let marketActivity = 1.0;
  if (timeOfDay >= 9 && timeOfDay <= 17) marketActivity = 1.2; // Business hours
  if (dayOfWeek === 0 || dayOfWeek === 6) marketActivity = 1.1; // Weekends
  
  // Calculate price change based on volatility and market activity
  const baseVolatility = volatility * marketActivity;
  const priceChange = (Math.random() - 0.5) * baseVolatility * priceData.currentPrice;
  const newPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, priceData.currentPrice + priceChange));
  
  return {
    ...priceData,
    currentPrice: newPrice,
    priceChange,
    priceChangePercent: (priceChange / priceData.currentPrice) * 100,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Get trending movies (highest price changes)
 */
export const getTrendingMovies = async (movies: Movie[]): Promise<MoviePriceData[]> => {
  try {
    const prices = await getMultipleMoviePrices(movies);
    return prices
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 10); // Top 10 trending
  } catch (error) {
    console.error('Error getting trending movies:', error);
    return [];
  }
};

/**
 * Get top performers (highest current prices)
 */
export const getTopPerformers = async (movies: Movie[]): Promise<MoviePriceData[]> => {
  try {
    const prices = await getMultipleMoviePrices(movies);
    return prices
      .sort((a, b) => b.currentPrice - a.currentPrice)
      .slice(0, 10); // Top 10 performers
  } catch (error) {
    console.error('Error getting top performers:', error);
    return [];
  }
};
