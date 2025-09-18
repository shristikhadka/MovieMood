import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentWeather, getWeatherMoodInfluence } from './weatherService';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export interface MoodAnalysis {
  mood: string;
  energy_level: number;
  preferred_genres: string[];
  time_preference: string;
  explanation: string;
  recommended_mood: string;
}

export interface WeatherContext {
  weather: string;
  temperature: number;
  city: string;
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

export interface TimeContext {
  hour: number;
  dayOfWeek: string;
  season: string;
}

/**
 * Analyze user's mood and context to provide movie recommendations
 */
export const analyzeMoodAndContext = async (
  userInput: string,
  weatherContext?: WeatherContext,
  timeContext?: TimeContext
): Promise<MoodAnalysis> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Get weather mood influence if weather context is available
    let weatherInfluence = null;
    if (weatherContext) {
      const weatherData = await getCurrentWeather();
      if (weatherData) {
        weatherInfluence = getWeatherMoodInfluence(weatherData);
      }
    }
    
    const contextInfo = `
      Current Context:
      - Time: ${timeContext ? `${timeContext.hour}:00, ${timeContext.dayOfWeek}, ${timeContext.season}` : 'Unknown'}
      - Weather: ${weatherContext ? `${weatherContext.weather} (${weatherContext.temperature}°C) in ${weatherContext.city}${weatherContext.description ? ` - ${weatherContext.description}` : ''}` : 'Unknown'}
      ${weatherInfluence ? `- Weather Mood Influence: ${weatherInfluence.explanation}` : ''}
    `;
    
    const weatherGenreBoost = weatherInfluence ? weatherInfluence.genreBoost.join(', ') : '';
    
    const prompt = `
      Analyze this user input and current context to determine the best movie recommendation mood:
      
      User Input: "${userInput}"
      ${contextInfo}
      
      Return ONLY a JSON object with this exact structure:
      {
        "mood": "stressed|happy|sad|excited|tired|romantic|bored|adventurous|nostalgic|inspired",
        "energy_level": 1-5,
        "preferred_genres": ["genre1", "genre2", "genre3"],
        "time_preference": "short|medium|long",
        "explanation": "Brief explanation for the recommendation considering weather and time context",
        "recommended_mood": "The specific mood category for movie selection"
      }
      
      Consider these factors in your analysis:
      1. User's emotional state from their input (primary factor)
      2. Time of day influence:
         - Morning (6-11): Higher energy, prefer upbeat content
         - Afternoon (12-17): Moderate energy, balanced content
         - Evening (18-23): Lower energy, prefer relaxing/cozy content
         - Night (24-5): Very low energy, prefer calming content
      3. Weather influence:
         - Sunny: Boosts energy, prefer upbeat genres (Action, Comedy, Adventure)
         - Rainy: Creates cozy mood, prefer emotional content (Drama, Romance)
         - Cloudy: Contemplative mood, prefer deeper content (Drama, Documentary)
         - Stormy: Intense mood, prefer dramatic content (Thriller, Horror)
         - Cold/Snow: Nostalgic mood, prefer comfort content (Family, Romance, Comedy)
      ${weatherGenreBoost ? `4. Weather suggests these genres: ${weatherGenreBoost}` : ''}
      5. Season influence: ${timeContext?.season || 'unknown'} season affects mood preferences
      
      Genre mapping guidelines:
      - stressed/tired → Comedy, Romance, Light Drama (comfort viewing)
      - happy/excited → Action, Adventure, Comedy (high energy)
      - sad → Drama, Romance, Comedy (emotional support)
      - bored → Thriller, Action, Mystery (engaging content)
      - romantic → Romance, Comedy, Drama (relationship-focused)
      - adventurous → Action, Adventure, Sci-Fi (exploration themes)
      - nostalgic → Drama, Comedy, Family (emotional connection)
      - inspired → Drama, Biography, Documentary (meaningful content)
      
      Energy level scale:
      1 = Very low (calm, meditative content)
      2 = Low (relaxing, easy viewing)
      3 = Medium (balanced entertainment)
      4 = High (engaging, active content)
      5 = Very high (intense, action-packed content)
      
      Time preference:
      - short (90-100 min): For tired/busy states
      - medium (100-130 min): Standard preference
      - long (130+ min): For immersive experiences when relaxed
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const moodAnalysis: MoodAnalysis = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    if (!moodAnalysis.mood || !moodAnalysis.preferred_genres) {
      throw new Error('Invalid mood analysis response');
    }
    
    return moodAnalysis;
  } catch (error) {
    console.error('Error analyzing mood:', error);
    
    // Enhanced fallback analysis based on user input
    const fallbackAnalysis = generateFallbackMoodAnalysis(userInput, weatherContext, timeContext);
    
    console.log('🔄 Using enhanced fallback mood analysis:', fallbackAnalysis.explanation);
    
    return fallbackAnalysis;
  }
};

/**
 * Generate intelligent fallback mood analysis when AI is unavailable
 */
const generateFallbackMoodAnalysis = (
  userInput: string,
  weatherContext?: WeatherContext,
  timeContext?: TimeContext
): MoodAnalysis => {
  const input = userInput.toLowerCase();
  
  // Smart mood detection based on keywords
  let mood = 'neutral';
  let energy_level = 3;
  let explanation = 'Based on your input and current context';
  
  // Analyze sentiment from user input
  if (input.includes('stress') || input.includes('tired') || input.includes('exhausted')) {
    mood = 'stressed';
    energy_level = 2;
  } else if (input.includes('happy') || input.includes('great') || input.includes('excited')) {
    mood = 'happy';
    energy_level = 4;
  } else if (input.includes('sad') || input.includes('down') || input.includes('upset')) {
    mood = 'sad';
    energy_level = 2;
  } else if (input.includes('adventure') || input.includes('explore')) {
    mood = 'adventurous';
    energy_level = 4;
  } else if (input.includes('romantic') || input.includes('love')) {
    mood = 'romantic';
    energy_level = 3;
  } else if (input.includes('bored') || input.includes('nothing')) {
    mood = 'bored';
    energy_level = 2;
  } else if (input.includes('inspire') || input.includes('motivate')) {
    mood = 'inspired';
    energy_level = 4;
  }
  
  // Adjust based on weather context
  if (weatherContext) {
    if (weatherContext.weather === 'sunny' && energy_level < 4) {
      energy_level = Math.min(energy_level + 1, 5);
      explanation += ', boosted by sunny weather';
    } else if (weatherContext.weather === 'rainy' && mood === 'neutral') {
      mood = 'nostalgic';
      explanation += ', influenced by cozy rainy weather';
    }
  }
  
  // Adjust based on time context
  if (timeContext) {
    if (timeContext.hour >= 22 || timeContext.hour <= 6) {
      energy_level = Math.max(energy_level - 1, 1);
      explanation += ', adjusted for late/early hours';
    } else if (timeContext.hour >= 6 && timeContext.hour <= 10) {
      energy_level = Math.min(energy_level + 1, 5);
      explanation += ', boosted for morning energy';
    }
  }
  
  // Map mood to genres
  const genreMap: { [key: string]: string[] } = {
    'stressed': ['Comedy', 'Romance', 'Animation'],
    'happy': ['Comedy', 'Adventure', 'Action'],
    'sad': ['Drama', 'Romance', 'Comedy'],
    'adventurous': ['Action', 'Adventure', 'Sci-Fi'],
    'romantic': ['Romance', 'Comedy', 'Drama'],
    'bored': ['Thriller', 'Action', 'Mystery'],
    'inspired': ['Drama', 'Biography', 'Documentary'],
    'nostalgic': ['Drama', 'Family', 'Comedy'],
    'neutral': ['Drama', 'Comedy', 'Action']
  };
  
  const preferred_genres = genreMap[mood] || genreMap['neutral'];
  
  // Determine time preference based on energy
  let time_preference = 'medium';
  if (energy_level <= 2) time_preference = 'short';
  else if (energy_level >= 4) time_preference = 'long';
  
  return {
    mood,
    energy_level,
    preferred_genres,
    time_preference,
    explanation: `${explanation} (AI temporarily unavailable)`,
    recommended_mood: mood
  };
};

/**
 * Get weather context for better recommendations
 */
export const getWeatherContext = async (): Promise<WeatherContext | null> => {
  try {
    const weatherData = await getCurrentWeather();
    
    if (!weatherData) {
      console.warn('Could not get weather data, using fallback');
      return {
        weather: 'partly-cloudy',
        temperature: 22,
        city: 'Your Location',
        description: 'Pleasant conditions',
      };
    }
    
    return {
      weather: weatherData.weather,
      temperature: weatherData.temperature,
      city: `${weatherData.city}, ${weatherData.country}`,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      description: weatherData.description,
    };
  } catch (error) {
    console.error('Error getting weather context:', error);
    return {
      weather: 'partly-cloudy',
      temperature: 22,
      city: 'Your Location',
      description: 'Pleasant conditions',
    };
  }
};

/**
 * Get time context for better recommendations
 */
export const getTimeContext = (): TimeContext => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Determine season
  const month = now.getMonth();
  let season = 'spring';
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';
  
  return {
    hour,
    dayOfWeek,
    season
  };
};

/**
 * Map mood to TMDB genre IDs
 */
export const mapMoodToGenres = (mood: string): number[] => {
  const genreMap: { [key: string]: number[] } = {
    'stressed': [35, 10749, 18], // Comedy, Romance, Drama
    'tired': [35, 10749, 16], // Comedy, Romance, Animation
    'happy': [28, 12, 35], // Action, Adventure, Comedy
    'excited': [28, 12, 878], // Action, Adventure, Sci-Fi
    'sad': [18, 10749, 35], // Drama, Romance, Comedy
    'bored': [53, 28, 9648], // Thriller, Action, Mystery
    'romantic': [10749, 35, 18], // Romance, Comedy, Drama
    'adventurous': [28, 12, 878], // Action, Adventure, Sci-Fi
    'nostalgic': [18, 35, 10751], // Drama, Comedy, Family
    'inspired': [18, 36, 99], // Drama, Biography, Documentary
    'scared': [27, 53, 9648], // Horror, Thriller, Mystery
    'horror': [27, 53, 9648], // Horror, Thriller, Mystery
    'neutral': [18, 35, 28] // Drama, Comedy, Action
  };
  
  return genreMap[mood] || genreMap['neutral'];
};

/**
 * Get personalized movie recommendations based on mood analysis
 */
export const getMoodBasedRecommendations = async (
  userInput: string
): Promise<{
  moodAnalysis: MoodAnalysis;
  recommendedGenres: number[];
  contextInfo: {
    weather: string | null;
    time: string;
    season: string;
  };
}> => {
  try {
    // Get context
    const weatherContext = await getWeatherContext();
    const timeContext = getTimeContext();
    
    // Analyze mood
    const moodAnalysis = await analyzeMoodAndContext(userInput, weatherContext || undefined, timeContext);
    
    // Map to genres
    const recommendedGenres = mapMoodToGenres(moodAnalysis.recommended_mood);
    
    // Create context info - just the contextual data, not the explanation
    const contextInfo = {
      weather: weatherContext ? `${weatherContext.weather}, ${weatherContext.temperature}°C` : null,
      time: `${timeContext.hour}:00, ${timeContext.dayOfWeek}`,
      season: timeContext.season
    };
    
    return {
      moodAnalysis,
      recommendedGenres,
      contextInfo
    };
  } catch (error) {
    console.error('Error getting mood-based recommendations:', error);
    throw error;
  }
};
