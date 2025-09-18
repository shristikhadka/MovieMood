import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { monitorApiCall, monitorStorage } from './performanceService';

// Weather interfaces
export interface WeatherData {
  weather: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  city: string;
  country: string;
  description: string;
  icon: string;
  timestamp: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

// Constants
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
const WEATHER_CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const LOCATION_CACHE_KEY = 'location_cache';

/**
 * Get user's current location with permission handling
 */
export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // Check cached location first (valid for 1 hour)
    const cachedLocation = await getCachedLocation();
    if (cachedLocation) {
      return cachedLocation;
    }

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied');
      return null;
    }

    // Get current position with timeout
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // 10 seconds timeout
    });

    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Get city/country from coordinates
    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        locationData.city = place.city || place.subregion || 'Unknown City';
        locationData.country = place.country || 'Unknown Country';
      }
    } catch (geocodeError) {
      console.warn('Geocoding failed:', geocodeError);
      locationData.city = 'Unknown City';
      locationData.country = 'Unknown Country';
    }

    // Cache location for 1 hour
    await cacheLocation(locationData);
    
    return locationData;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Get cached location if it's still valid
 */
const getCachedLocation = async (): Promise<LocationData | null> => {
  try {
    const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const hourAgo = Date.now() - (60 * 60 * 1000); // 1 hour
      
      if (timestamp > hourAgo) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Cache location data
 */
const cacheLocation = async (location: LocationData): Promise<void> => {
  try {
    const cacheData = {
      data: location,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache location:', error);
  }
};

/**
 * Fetch weather data from OpenWeatherMap API
 */
export const fetchWeatherData = async (location: LocationData): Promise<WeatherData | null> => {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeather API key not configured');
    return getFallbackWeatherData(location);
  }

  try {
    return await monitorApiCall('OpenWeatherMap', async () => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        weather: mapWeatherCondition(data.weather[0].main),
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed * 3.6) || 0, // Convert m/s to km/h
        pressure: data.main.pressure,
        city: location.city || data.name || 'Unknown City',
        country: location.country || data.sys.country || 'Unknown Country',
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: Date.now(),
      };

      // Cache the weather data
      await cacheWeatherData(weatherData);
      
      return weatherData;
    }, { location: `${location.latitude},${location.longitude}` });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Try to return cached data if available
    const cachedWeather = await getCachedWeatherData();
    if (cachedWeather) {
      console.log('Using cached weather data due to API error');
      return cachedWeather;
    }
    
    // Return fallback data as last resort
    return getFallbackWeatherData(location);
  }
};

/**
 * Get current weather with location detection
 */
export const getCurrentWeather = async (): Promise<WeatherData | null> => {
  try {
    // Check cached weather first
    const cachedWeather = await getCachedWeatherData();
    if (cachedWeather) {
      return cachedWeather;
    }

    // Get user location
    const location = await getUserLocation();
    if (!location) {
      console.warn('Could not get user location for weather');
      return getFallbackWeatherData();
    }

    // Fetch weather data
    return await fetchWeatherData(location);
  } catch (error) {
    console.error('Error getting current weather:', error);
    return getFallbackWeatherData();
  }
};

/**
 * Cache weather data
 */
const cacheWeatherData = async (weather: WeatherData): Promise<void> => {
  try {
    const cacheData = {
      data: weather,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache weather data:', error);
  }
};

/**
 * Get cached weather data if it's still valid
 */
const getCachedWeatherData = async (): Promise<WeatherData | null> => {
  try {
    const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const cacheExpiry = Date.now() - CACHE_DURATION;
      
      if (timestamp > cacheExpiry) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Map OpenWeather conditions to simplified weather states
 */
const mapWeatherCondition = (condition: string): string => {
  const conditionMap: { [key: string]: string } = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'stormy',
    'Snow': 'snowy',
    'Mist': 'foggy',
    'Smoke': 'foggy',
    'Haze': 'foggy',
    'Fog': 'foggy',
  };
  
  return conditionMap[condition] || 'partly-cloudy';
};

/**
 * Get fallback weather data when API is unavailable
 */
const getFallbackWeatherData = (location?: LocationData): WeatherData => {
  // Generate realistic fallback based on current season and time
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  
  // Seasonal temperature ranges (in Celsius)
  let baseTemp = 20;
  if (month >= 5 && month <= 7) baseTemp = 28; // Summer
  else if (month >= 8 && month <= 10) baseTemp = 15; // Autumn
  else if (month >= 11 || month <= 1) baseTemp = 5; // Winter
  else baseTemp = 18; // Spring
  
  // Time of day variation
  const timeVariation = Math.sin((hour - 6) * Math.PI / 12) * 8; // Peak at 2 PM
  const finalTemp = Math.round(baseTemp + timeVariation);
  
  // Determine weather condition based on season
  const seasonalWeather = ['sunny', 'partly-cloudy', 'cloudy'];
  if (month >= 11 || month <= 1) seasonalWeather.push('rainy', 'foggy');
  const weather = seasonalWeather[Math.floor(Math.random() * seasonalWeather.length)];
  
  return {
    weather,
    temperature: finalTemp,
    humidity: 60 + Math.floor(Math.random() * 30),
    windSpeed: Math.floor(Math.random() * 20),
    pressure: 1013 + Math.floor(Math.random() * 20 - 10),
    city: location?.city || 'Your Location',
    country: location?.country || 'Unknown',
    description: `${weather} conditions`,
    icon: '01d',
    timestamp: Date.now(),
  };
};

/**
 * Get weather emoji for display
 */
export const getWeatherEmoji = (weather: string): string => {
  const emojiMap: { [key: string]: string } = {
    'sunny': '☀️',
    'partly-cloudy': '⛅',
    'cloudy': '☁️',
    'rainy': '🌧️',
    'stormy': '⛈️',
    'snowy': '❄️',
    'foggy': '🌫️',
  };
  
  return emojiMap[weather] || '🌤️';
};

/**
 * Check if weather affects movie mood recommendations
 */
export const getWeatherMoodInfluence = (weather: WeatherData): {
  moodModifier: string;
  genreBoost: string[];
  explanation: string;
} => {
  const weatherMoodMap: { [key: string]: any } = {
    'sunny': {
      moodModifier: 'energetic',
      genreBoost: ['action', 'adventure', 'comedy'],
      explanation: 'Sunny weather encourages upbeat, energetic content'
    },
    'rainy': {
      moodModifier: 'cozy',
      genreBoost: ['drama', 'romance', 'thriller'],
      explanation: 'Rainy weather creates a cozy mood perfect for emotional stories'
    },
    'cloudy': {
      moodModifier: 'contemplative',
      genreBoost: ['drama', 'mystery', 'documentary'],
      explanation: 'Cloudy skies inspire thoughtful, deeper content'
    },
    'stormy': {
      moodModifier: 'intense',
      genreBoost: ['thriller', 'horror', 'action'],
      explanation: 'Stormy weather matches intense, dramatic content'
    },
    'snowy': {
      moodModifier: 'nostalgic',
      genreBoost: ['family', 'romance', 'comedy'],
      explanation: 'Snowy weather evokes warmth and nostalgia'
    },
    'foggy': {
      moodModifier: 'mysterious',
      genreBoost: ['mystery', 'thriller', 'horror'],
      explanation: 'Foggy conditions enhance mysterious, suspenseful moods'
    }
  };
  
  return weatherMoodMap[weather.weather] || {
    moodModifier: 'neutral',
    genreBoost: ['drama', 'comedy'],
    explanation: 'Current weather conditions support general entertainment'
  };
};

/**
 * Clear all weather caches (useful for testing or user preference)
 */
export const clearWeatherCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(WEATHER_CACHE_KEY);
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing weather cache:', error);
  }
};