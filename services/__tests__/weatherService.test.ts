import {
  getCurrentWeather,
  getWeatherMoodInfluence,
  getWeatherEmoji,
  clearWeatherCache,
} from '../weatherService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('getCurrentWeather', () => {
    it('should return weather data with valid API response', async () => {
      const mockWeatherResponse = {
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        main: { temp: 25, humidity: 60, pressure: 1013 },
        wind: { speed: 5 },
        name: 'San Francisco',
        sys: { country: 'US' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeatherResponse,
      } as Response);

      const result = await getCurrentWeather();

      expect(result).toBeDefined();
      expect(result?.weather).toBe('sunny');
      expect(result?.temperature).toBe(25);
      expect(result?.city).toContain('San Francisco');
    });

    it('should return fallback data when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await getCurrentWeather();

      expect(result).toBeDefined();
      expect(result?.weather).toBeDefined();
      expect(result?.temperature).toBeGreaterThan(0);
      expect(result?.city).toBeDefined();
    });

    it('should use cached data when available', async () => {
      const cachedWeather = {
        weather: 'sunny',
        temperature: 22,
        humidity: 50,
        windSpeed: 10,
        pressure: 1010,
        city: 'Test City',
        country: 'Test Country',
        description: 'sunny',
        icon: '01d',
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        'weather_cache',
        JSON.stringify({
          data: cachedWeather,
          timestamp: Date.now(),
        })
      );

      const result = await getCurrentWeather();

      expect(result).toEqual(cachedWeather);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getWeatherMoodInfluence', () => {
    it('should return correct mood influence for sunny weather', () => {
      const weatherData = {
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
      };

      const influence = getWeatherMoodInfluence(weatherData);

      expect(influence.moodModifier).toBe('energetic');
      expect(influence.genreBoost).toContain('action');
      expect(influence.genreBoost).toContain('adventure');
      expect(influence.explanation).toContain('energetic');
    });

    it('should return correct mood influence for rainy weather', () => {
      const weatherData = {
        weather: 'rainy',
        temperature: 18,
        humidity: 80,
        windSpeed: 15,
        pressure: 1005,
        city: 'Test City',
        country: 'Test Country',
        description: 'light rain',
        icon: '10d',
        timestamp: Date.now(),
      };

      const influence = getWeatherMoodInfluence(weatherData);

      expect(influence.moodModifier).toBe('cozy');
      expect(influence.genreBoost).toContain('drama');
      expect(influence.genreBoost).toContain('romance');
      expect(influence.explanation).toContain('cozy');
    });
  });

  describe('getWeatherEmoji', () => {
    it('should return correct emojis for different weather conditions', () => {
      expect(getWeatherEmoji('sunny')).toBe('☀️');
      expect(getWeatherEmoji('rainy')).toBe('🌧️');
      expect(getWeatherEmoji('cloudy')).toBe('☁️');
      expect(getWeatherEmoji('snowy')).toBe('❄️');
      expect(getWeatherEmoji('stormy')).toBe('⛈️');
      expect(getWeatherEmoji('foggy')).toBe('🌫️');
      expect(getWeatherEmoji('unknown')).toBe('🌤️'); // fallback
    });
  });

  describe('clearWeatherCache', () => {
    it('should clear weather and location cache', async () => {
      await AsyncStorage.setItem('weather_cache', 'test');
      await AsyncStorage.setItem('location_cache', 'test');

      await clearWeatherCache();

      const weatherCache = await AsyncStorage.getItem('weather_cache');
      const locationCache = await AsyncStorage.getItem('location_cache');

      expect(weatherCache).toBeNull();
      expect(locationCache).toBeNull();
    });
  });
});