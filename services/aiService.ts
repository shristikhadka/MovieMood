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
        "explanation": "Write a warm, personal, conversational explanation that feels like talking to a friend. Use natural language patterns like 'After a long day, you deserve...' or 'Perfect for those moments when...' or 'Sometimes you need stories that...'. Make it feel caring and understanding, not clinical.",
        "recommended_mood": "The specific mood category for movie selection"
      }
      
      Consider these factors in your analysis:
      1. User's emotional state from their input (primary factor)
      2. Time of day influence:
         - Morning (6-11): "Morning energy is perfect for..." or "Start your day right with..."
         - Afternoon (12-17): "Afternoon calls for..." or "Perfect midday pick-me-up..."
         - Evening (18-23): "Evening time - perfect for unwinding..." or "Time to melt away the day's tension..."
         - Night (24-5): "Late night calls for something gentle..." or "Perfect for those quiet night moments..."
      3. Weather influence:
         - Sunny: "The sunshine is calling for..." or "This beautiful weather deserves..."
         - Rainy: "Perfect cozy weather for..." or "Rainy days are made for..."
         - Cloudy: "These contemplative skies are perfect for..." or "Cloudy weather calls for..."
         - Stormy: "The dramatic weather outside calls for..." or "Stormy skies deserve..."
         - Cold/Snow: "Cold weather is perfect for..." or "Cozy up with..."
      ${weatherGenreBoost ? `4. Weather suggests these genres: ${weatherGenreBoost}` : ''}
      5. Season influence: ${timeContext?.season || 'unknown'} season affects mood preferences
      
      For the explanation, use warm, caring language that feels like talking to a close friend. Examples:
      - "After a long day, you deserve something that..."
      - "Perfect for those moments when you need..."
      - "Sometimes you need stories that..."
      - "Time for something that makes you feel..."
      - "These films wrap around you like..."
      - "Looks like it's time to..."
      - "Your energy deserves stories that..."
      
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
  let explanation = 'Perfect for those moments when you just want to feel good';
  
  // Analyze sentiment from user input with personal language
  if (input.includes('stress') || input.includes('tired') || input.includes('exhausted') || input.includes('overwhelmed')) {
    mood = 'stressed';
    energy_level = 2;
    const stressExplanations = [
      'After a long day, you deserve something that wraps around you like a warm blanket',
      'Time to let go of the day\'s weight with something that soothes your soul',
      'Perfect for melting away today\'s tension and finding your calm',
      'Sometimes you need stories that don\'t demand too much but give back everything'
    ];
    explanation = stressExplanations[Math.floor(Math.random() * stressExplanations.length)];
  } else if (input.includes('happy') || input.includes('great') || input.includes('excited') || input.includes('amazing')) {
    mood = 'happy';
    energy_level = 4;
    const happyExplanations = [
      'Looks like it\'s time to ride this good energy with something that matches your vibe',
      'Your positive energy deserves stories that amplify this beautiful feeling',
      'Perfect for those "I feel amazing" moments when you want to keep the good vibes flowing',
      'Time to celebrate this mood with something that makes you smile even bigger'
    ];
    explanation = happyExplanations[Math.floor(Math.random() * happyExplanations.length)];
  } else if (input.includes('sad') || input.includes('down') || input.includes('upset') || input.includes('blue')) {
    mood = 'sad';
    energy_level = 2;
    const sadExplanations = [
      'Sometimes you need stories that understand what you\'re feeling and help you through it',
      'Perfect for those moments when you need a gentle companion for your feelings',
      'Time for stories that hold space for your emotions and offer comfort',
      'These films wrap around you like a warm hug when you need it most'
    ];
    explanation = sadExplanations[Math.floor(Math.random() * sadExplanations.length)];
  } else if (input.includes('adventure') || input.includes('explore') || input.includes('travel')) {
    mood = 'adventurous';
    energy_level = 4;
    explanation = 'Perfect for those "I want to escape and explore" moments';
  } else if (input.includes('romantic') || input.includes('love') || input.includes('relationship')) {
    mood = 'romantic';
    energy_level = 3;
    explanation = 'Time for stories that make your heart flutter and remind you of love\'s magic';
  } else if (input.includes('bored') || input.includes('nothing') || input.includes('dull')) {
    mood = 'bored';
    energy_level = 2;
    explanation = 'When you need something that grabs your attention and doesn\'t let go';
  } else if (input.includes('inspire') || input.includes('motivate') || input.includes('uplift')) {
    mood = 'inspired';
    energy_level = 4;
    explanation = 'Perfect for those moments when you want to feel moved and motivated';
  } else if (input.includes('scared') || input.includes('frightened') || input.includes('horror')) {
    mood = 'scared';
    energy_level = 3;
    explanation = 'Time for something that gets your heart racing and gives you that perfect thrill';
  } else if (input.includes('nostalgic') || input.includes('memories') || input.includes('childhood')) {
    mood = 'nostalgic';
    energy_level = 2;
    explanation = 'Perfect for those moments when you want to feel connected to beautiful memories';
  }
  
  // Adjust based on weather context with natural language
  if (weatherContext) {
    if (weatherContext.weather === 'sunny' && energy_level < 4) {
      energy_level = Math.min(energy_level + 1, 5);
      explanation = 'The sunshine is calling for something that matches this beautiful energy';
    } else if (weatherContext.weather === 'rainy' && mood === 'neutral') {
      mood = 'nostalgic';
      explanation = 'Perfect cozy weather for stories that feel like a warm hug';
    } else if (weatherContext.weather === 'cloudy') {
      explanation = 'These contemplative skies are perfect for something that makes you think and feel';
    } else if (weatherContext.weather === 'stormy') {
      explanation = 'The dramatic weather outside calls for equally compelling stories';
    }
  }
  
  // Adjust based on time context with natural language
  if (timeContext) {
    if (timeContext.hour >= 22 || timeContext.hour <= 6) {
      energy_level = Math.max(energy_level - 1, 1);
      explanation = 'Late night calls for something gentle that won\'t keep you up but will soothe your soul';
    } else if (timeContext.hour >= 6 && timeContext.hour <= 10) {
      energy_level = Math.min(energy_level + 1, 5);
      explanation = 'Morning energy is perfect for something that gets your day started right';
    } else if (timeContext.hour >= 18 && timeContext.hour <= 21) {
      explanation = 'Evening time - perfect for unwinding with something that melts away the day\'s tension';
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
    'scared': ['Horror', 'Thriller', 'Mystery'],
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
