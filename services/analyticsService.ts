import { fetchMovies } from './api';

// Analytics interfaces
export interface BoxOfficeData {
  year: number;
  month: number;
  totalRevenue: number;
  movieCount: number;
  averageRevenue: number;
}

export interface GenreAnalytics {
  genreId: number;
  genreName: string;
  movieCount: number;
  totalRevenue: number;
  averageRevenue: number;
  averageRating: number;
  successRate: number; // Percentage of movies that made profit
}

export interface ActorDirectorMetrics {
  id: number;
  name: string;
  type: 'actor' | 'director';
  movieCount: number;
  totalRevenue: number;
  averageRevenue: number;
  averageRating: number;
  successRate: number;
  topMovies: Array<{
    id: number;
    title: string;
    revenue: number;
    rating: number;
  }>;
}

export interface SeasonalAnalytics {
  month: number;
  monthName: string;
  totalRevenue: number;
  movieCount: number;
  averageRevenue: number;
  topGenres: Array<{
    genreId: number;
    genreName: string;
    revenue: number;
  }>;
}

export interface ROIAnalytics {
  budgetRange: string;
  movieCount: number;
  averageROI: number;
  successRate: number;
  averageRevenue: number;
}

// Genre mapping
const GENRE_NAMES: { [key: number]: string } = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * Get box office trends over time
 */
export const getBoxOfficeTrends = async (): Promise<BoxOfficeData[]> => {
  try {
    // Fetch movies from different time periods
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    const allMovies: Movie[] = [];
    
    for (const year of years) {
      // Fetch popular movies for each year
      const movies = await fetchMovies({ query: '' }); // Get popular movies
      const yearMovies = movies.filter((movie: Movie) => {
        const releaseYear = new Date(movie.release_date).getFullYear();
        return releaseYear === year;
      });
      allMovies.push(...yearMovies);
    }
    
    // Group by year and month
    const trends: { [key: string]: BoxOfficeData } = {};
    
    allMovies.forEach((movie: Movie) => {
      const releaseDate = new Date(movie.release_date);
      const year = releaseDate.getFullYear();
      const month = releaseDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      // Simulate revenue based on popularity and rating
      const simulatedRevenue = calculateSimulatedRevenue(movie);
      
      if (!trends[key]) {
        trends[key] = {
          year,
          month,
          totalRevenue: 0,
          movieCount: 0,
          averageRevenue: 0,
        };
      }
      
      trends[key].totalRevenue += simulatedRevenue;
      trends[key].movieCount += 1;
    });
    
    // Calculate averages
    Object.values(trends).forEach(trend => {
      trend.averageRevenue = trend.totalRevenue / trend.movieCount;
    });
    
    return Object.values(trends).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  } catch (error) {
    console.error('Error getting box office trends:', error);
    return [];
  }
};

/**
 * Get genre performance analytics
 */
export const getGenreAnalytics = async (): Promise<GenreAnalytics[]> => {
  try {
    const movies = await fetchMovies({ query: '' }); // Get popular movies
    const genreStats: { [key: number]: GenreAnalytics } = {};
    
    movies.forEach((movie: Movie) => {
      const simulatedRevenue = calculateSimulatedRevenue(movie);
      const isProfitable = simulatedRevenue > 50000000; // $50M threshold
      
      movie.genre_ids.forEach((genreId: number) => {
        if (!genreStats[genreId]) {
          genreStats[genreId] = {
            genreId,
            genreName: GENRE_NAMES[genreId] || 'Unknown',
            movieCount: 0,
            totalRevenue: 0,
            averageRevenue: 0,
            averageRating: 0,
            successRate: 0,
          };
        }
        
        const stats = genreStats[genreId];
        stats.movieCount += 1;
        stats.totalRevenue += simulatedRevenue;
        stats.averageRating += movie.vote_average;
        
        if (isProfitable) {
          stats.successRate += 1;
        }
      });
    });
    
    // Calculate averages and percentages
    Object.values(genreStats).forEach(stats => {
      stats.averageRevenue = stats.totalRevenue / stats.movieCount;
      stats.averageRating = stats.averageRating / stats.movieCount;
      stats.successRate = (stats.successRate / stats.movieCount) * 100;
    });
    
    return Object.values(genreStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    console.error('Error getting genre analytics:', error);
    return [];
  }
};

/**
 * Get seasonal analytics
 */
export const getSeasonalAnalytics = async (): Promise<SeasonalAnalytics[]> => {
  try {
    const movies = await fetchMovies({ query: '' }); // Get popular movies
    const monthlyStats: { [key: number]: SeasonalAnalytics } = {};
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Initialize all months
    for (let i = 0; i < 12; i++) {
      monthlyStats[i + 1] = {
        month: i + 1,
        monthName: monthNames[i],
        totalRevenue: 0,
        movieCount: 0,
        averageRevenue: 0,
        topGenres: [],
      };
    }
    
    movies.forEach((movie: Movie) => {
      const releaseDate = new Date(movie.release_date);
      const month = releaseDate.getMonth() + 1;
      const simulatedRevenue = calculateSimulatedRevenue(movie);
      
      monthlyStats[month].totalRevenue += simulatedRevenue;
      monthlyStats[month].movieCount += 1;
    });
    
    // Calculate averages and top genres for each month
    Object.values(monthlyStats).forEach(monthStats => {
      monthStats.averageRevenue = monthStats.totalRevenue / Math.max(monthStats.movieCount, 1);
      
      // Get top genres for this month
      const genreRevenue: { [key: number]: number } = {};
      movies.forEach((movie: Movie) => {
        const releaseDate = new Date(movie.release_date);
        const month = releaseDate.getMonth() + 1;
        
        if (month === monthStats.month) {
          const simulatedRevenue = calculateSimulatedRevenue(movie);
          movie.genre_ids.forEach((genreId: number) => {
            genreRevenue[genreId] = (genreRevenue[genreId] || 0) + simulatedRevenue;
          });
        }
      });
      
      monthStats.topGenres = Object.entries(genreRevenue)
        .map(([genreId, revenue]) => ({
          genreId: parseInt(genreId),
          genreName: GENRE_NAMES[parseInt(genreId)] || 'Unknown',
          revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
    });
    
    return Object.values(monthlyStats);
  } catch (error) {
    console.error('Error getting seasonal analytics:', error);
    return [];
  }
};

/**
 * Get ROI analytics by budget range
 */
export const getROIAnalytics = async (): Promise<ROIAnalytics[]> => {
  try {
    const movies = await fetchMovies({ query: '' }); // Get popular movies
    const budgetRanges = [
      { range: 'Under $10M', min: 0, max: 10000000 },
      { range: '$10M - $50M', min: 10000000, max: 50000000 },
      { range: '$50M - $100M', min: 50000000, max: 100000000 },
      { range: '$100M - $200M', min: 100000000, max: 200000000 },
      { range: 'Over $200M', min: 200000000, max: Infinity },
    ];
    
    const roiStats: ROIAnalytics[] = budgetRanges.map(range => ({
      budgetRange: range.range,
      movieCount: 0,
      averageROI: 0,
      successRate: 0,
      averageRevenue: 0,
    }));
    
    movies.forEach((movie: Movie) => {
      // Simulate budget based on popularity and genre
      const simulatedBudget = calculateSimulatedBudget(movie);
      const simulatedRevenue = calculateSimulatedRevenue(movie);
      const roi = ((simulatedRevenue - simulatedBudget) / simulatedBudget) * 100;
      const isProfitable = simulatedRevenue > simulatedBudget;
      
      // Find the appropriate budget range
      const rangeIndex = budgetRanges.findIndex(range => 
        simulatedBudget >= range.min && simulatedBudget < range.max
      );
      
      if (rangeIndex >= 0) {
        const stats = roiStats[rangeIndex];
        stats.movieCount += 1;
        stats.averageROI += roi;
        stats.averageRevenue += simulatedRevenue;
        
        if (isProfitable) {
          stats.successRate += 1;
        }
      }
    });
    
    // Calculate averages and percentages
    roiStats.forEach(stats => {
      if (stats.movieCount > 0) {
        stats.averageROI = stats.averageROI / stats.movieCount;
        stats.averageRevenue = stats.averageRevenue / stats.movieCount;
        stats.successRate = (stats.successRate / stats.movieCount) * 100;
      }
    });
    
    return roiStats.filter(stats => stats.movieCount > 0);
  } catch (error) {
    console.error('Error getting ROI analytics:', error);
    return [];
  }
};

/**
 * Calculate simulated revenue based on movie data
 */
const calculateSimulatedRevenue = (movie: Movie): number => {
  // Base revenue calculation using popularity, rating, and release date
  const baseRevenue = 10000000; // $10M base
  const popularityMultiplier = Math.min(movie.popularity / 100, 5); // Cap at 5x
  const ratingMultiplier = movie.vote_average / 5; // Normalize to 0-2x
  const voteCountMultiplier = Math.min(movie.vote_count / 1000, 3); // Cap at 3x
  
  // Recency factor (newer movies tend to have higher revenue)
  const releaseDate = new Date(movie.release_date);
  const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.1, 1 - (daysSinceRelease / 3650)); // Decay over 10 years
  
  const totalRevenue = baseRevenue * popularityMultiplier * ratingMultiplier * voteCountMultiplier * recencyFactor;
  
  // Add some randomness but keep it realistic
  const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
  
  return Math.round(totalRevenue * randomFactor);
};

/**
 * Calculate simulated budget based on movie data
 */
const calculateSimulatedBudget = (movie: Movie): number => {
  // Base budget calculation
  const baseBudget = 5000000; // $5M base
  const popularityMultiplier = Math.min(movie.popularity / 200, 3); // Cap at 3x
  const ratingMultiplier = movie.vote_average / 6; // Normalize to 0-1.67x
  
  // Genre-based budget adjustments
  const genreMultipliers: { [key: number]: number } = {
    28: 1.5,  // Action (expensive)
    12: 1.3,  // Adventure
    16: 1.2,  // Animation (expensive)
    35: 0.8,  // Comedy (cheaper)
    27: 0.7,  // Horror (cheaper)
    878: 1.4, // Sci-Fi (expensive)
  };
  
  const primaryGenre = movie.genre_ids[0] || 18; // Default to Drama
  const genreMultiplier = genreMultipliers[primaryGenre] || 1.0;
  
  const totalBudget = baseBudget * popularityMultiplier * ratingMultiplier * genreMultiplier;
  
  // Add some randomness
  const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
  
  return Math.round(totalBudget * randomFactor);
};

/**
 * Get top performing movies for insights
 */
export const getTopPerformingMovies = async (limit: number = 10): Promise<Movie[]> => {
  try {
    const movies = await fetchMovies({ query: '' }); // Get popular movies
    
    // Sort by a combination of rating, popularity, and vote count
    const scoredMovies = movies.map((movie: Movie) => ({
      ...movie,
      score: (movie.vote_average * 0.4) + (movie.popularity / 100 * 0.3) + (movie.vote_count / 1000 * 0.3),
    }));
    
    return scoredMovies
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top performing movies:', error);
    return [];
  }
};
