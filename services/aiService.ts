import { GoogleGenerativeAI } from '@google/generative-ai';

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
    
    const contextInfo = `
      Current Context:
      - Time: ${timeContext ? `${timeContext.hour}:00, ${timeContext.dayOfWeek}` : 'Unknown'}
      - Weather: ${weatherContext ? `${weatherContext.weather}, ${weatherContext.temperature}°C in ${weatherContext.city}` : 'Unknown'}
    `;
    
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
        "explanation": "Brief explanation for the recommendation",
        "recommended_mood": "The specific mood category for movie selection"
      }
      
      Consider:
      - User's emotional state from their input
      - Time of day (morning = energetic, evening = relaxing)
      - Weather (sunny = upbeat, rainy = cozy)
      - Energy level (1=very low, 5=very high)
      
      Map moods to movie genres:
      - stressed/tired → Comedy, Romance, Light Drama
      - happy/excited → Action, Adventure, Comedy
      - sad → Drama, Romance, Comedy
      - bored → Thriller, Action, Mystery
      - romantic → Romance, Comedy, Drama
      - adventurous → Action, Adventure, Sci-Fi
      - nostalgic → Drama, Comedy, Family
      - inspired → Drama, Biography, Documentary
      - scared/horror → Horror, Thriller, Mystery
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
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
    
    // Fallback analysis
    return {
      mood: 'neutral',
      energy_level: 3,
      preferred_genres: ['Drama', 'Comedy'],
      time_preference: 'medium',
      explanation: 'Unable to analyze mood, showing general recommendations',
      recommended_mood: 'general'
    };
  }
};

/**
 * Get weather context for better recommendations
 */
export const getWeatherContext = async (): Promise<WeatherContext | null> => {
  try {
    // For now, return mock data. In production, integrate with weather API
    const mockWeather: WeatherContext = {
      weather: 'sunny',
      temperature: 22,
      city: 'Your Location'
    };
    
    return mockWeather;
  } catch (error) {
    console.error('Error getting weather context:', error);
    return null;
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
