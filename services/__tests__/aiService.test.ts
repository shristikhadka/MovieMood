import {
  analyzeMoodAndContext,
  getTimeContext,
  mapMoodToGenres,
  getMoodBasedRecommendations,
} from '../aiService';

// Mock the weather service
jest.mock('../weatherService', () => ({
  getCurrentWeather: jest.fn(() =>
    Promise.resolve({
      weather: 'sunny',
      temperature: 25,
      humidity: 60,
      windSpeed: 10,
      pressure: 1013,
      city: 'Test City',
      country: 'Test Country',
      description: 'clear sky',
      icon: '01d',
      timestamp: Date.now(),
    })
  ),
  getWeatherMoodInfluence: jest.fn(() => ({
    moodModifier: 'energetic',
    genreBoost: ['action', 'adventure', 'comedy'],
    explanation: 'Sunny weather encourages upbeat, energetic content',
  })),
}));

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(() =>
        Promise.resolve({
          response: {
            text: () =>
              JSON.stringify({
                mood: 'happy',
                energy_level: 4,
                preferred_genres: ['Comedy', 'Action', 'Adventure'],
                time_preference: 'medium',
                explanation: 'User is feeling positive and energetic',
                recommended_mood: 'happy',
              }),
          },
        })
      ),
    })),
  })),
}));

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMoodAndContext', () => {
    it('should analyze mood successfully with valid input', async () => {
      const result = await analyzeMoodAndContext(
        'I am feeling great today!',
        { weather: 'sunny', temperature: 25, city: 'Test City' },
        { hour: 14, dayOfWeek: 'Monday', season: 'summer' }
      );

      expect(result.mood).toBe('happy');
      expect(result.energy_level).toBe(4);
      expect(result.preferred_genres).toContain('Comedy');
      expect(result.explanation).toBeDefined();
      expect(result.recommended_mood).toBe('happy');
    });

    it('should return fallback analysis when AI fails', async () => {
      const mockGenerateContent = jest.fn(() =>
        Promise.reject(new Error('AI Error'))
      );

      const mockGetGenerativeModel = jest.fn(() => ({
        generateContent: mockGenerateContent,
      }));

      const mockGoogleGenerativeAI = jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: mockGoogleGenerativeAI,
      }));

      const result = await analyzeMoodAndContext('I feel terrible');

      expect(result.mood).toBe('neutral');
      expect(result.energy_level).toBe(3);
      expect(result.preferred_genres).toEqual(['Drama', 'Comedy']);
      expect(result.explanation).toContain('Unable to analyze mood');
    });

    it('should handle invalid JSON response from AI', async () => {
      const mockGenerateContent = jest.fn(() =>
        Promise.resolve({
          response: {
            text: () => 'Invalid JSON response',
          },
        })
      );

      const mockGetGenerativeModel = jest.fn(() => ({
        generateContent: mockGenerateContent,
      }));

      const mockGoogleGenerativeAI = jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: mockGoogleGenerativeAI,
      }));

      const result = await analyzeMoodAndContext('I am confused');

      expect(result.mood).toBe('neutral');
      expect(result.preferred_genres).toEqual(['Drama', 'Comedy']);
    });
  });

  describe('getTimeContext', () => {
    it('should return current time context', () => {
      const context = getTimeContext();

      expect(context.hour).toBeGreaterThanOrEqual(0);
      expect(context.hour).toBeLessThanOrEqual(23);
      expect(context.dayOfWeek).toBeDefined();
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(context.season);
    });

    it('should determine correct season based on month', () => {
      // Mock Date to test specific seasons
      const originalDate = Date;
      
      // Test winter (December)
      global.Date = jest.fn(() => new originalDate('2024-12-15')) as any;
      global.Date.now = originalDate.now;
      
      let context = getTimeContext();
      expect(context.season).toBe('winter');

      // Test spring (April)
      global.Date = jest.fn(() => new originalDate('2024-04-15')) as any;
      global.Date.now = originalDate.now;
      
      context = getTimeContext();
      expect(context.season).toBe('spring');

      // Test summer (July)
      global.Date = jest.fn(() => new originalDate('2024-07-15')) as any;
      global.Date.now = originalDate.now;
      
      context = getTimeContext();
      expect(context.season).toBe('summer');

      // Test autumn (October)
      global.Date = jest.fn(() => new originalDate('2024-10-15')) as any;
      global.Date.now = originalDate.now;
      
      context = getTimeContext();
      expect(context.season).toBe('autumn');

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('mapMoodToGenres', () => {
    it('should map moods to correct genre IDs', () => {
      expect(mapMoodToGenres('happy')).toEqual([28, 12, 35]); // Action, Adventure, Comedy
      expect(mapMoodToGenres('sad')).toEqual([18, 10749, 35]); // Drama, Romance, Comedy
      expect(mapMoodToGenres('stressed')).toEqual([35, 10749, 18]); // Comedy, Romance, Drama
      expect(mapMoodToGenres('adventurous')).toEqual([28, 12, 878]); // Action, Adventure, Sci-Fi
      expect(mapMoodToGenres('romantic')).toEqual([10749, 35, 18]); // Romance, Comedy, Drama
      expect(mapMoodToGenres('bored')).toEqual([53, 28, 9648]); // Thriller, Action, Mystery
      expect(mapMoodToGenres('unknown')).toEqual([18, 35, 28]); // Default: Drama, Comedy, Action
    });
  });

  describe('getMoodBasedRecommendations', () => {
    it('should return comprehensive mood-based recommendations', async () => {
      const result = await getMoodBasedRecommendations('I want to feel energized!');

      expect(result.moodAnalysis).toBeDefined();
      expect(result.recommendedGenres).toBeDefined();
      expect(result.contextInfo).toBeDefined();
      expect(result.contextInfo.weather).toBeDefined();
      expect(result.contextInfo.time).toBeDefined();
      expect(result.contextInfo.season).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Mock AI service to fail
      const mockError = new Error('AI Service Error');
      jest.doMock('../weatherService', () => ({
        getCurrentWeather: jest.fn(() => Promise.reject(mockError)),
        getWeatherMoodInfluence: jest.fn(() => ({
          moodModifier: 'neutral',
          genreBoost: ['drama'],
          explanation: 'Fallback mood',
        })),
      }));

      await expect(getMoodBasedRecommendations('Test input')).rejects.toThrow();
    });
  });
});