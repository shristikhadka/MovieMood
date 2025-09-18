# 🎬 MovieMood - AI-Powered Movie Recommendations

MovieMood is a sophisticated React Native app that uses AI to provide personalized movie recommendations based on your current mood, weather conditions, and time context. It also features a realistic movie investment simulator where you can trade virtual movie stocks.

## ✨ Key Features

### AI-Powered Mood Analysis
- **Real-time mood detection** using Google Gemini AI
- **Context-aware recommendations** based on weather and time
- **Quick mood selection** with 8+ pre-defined mood states
- **Smart genre mapping** that adapts to your emotional state

### Real Weather Integration
- **Live weather data** from OpenWeatherMap API
- **Location-based context** for better recommendations
- **Weather mood influence** (sunny = upbeat, rainy = cozy)
- **Intelligent caching** for optimal performance

### Investment Simulator
- **Realistic movie stock trading** with complex pricing algorithms
- **Portfolio management** with P&L tracking and risk analysis
- **Market simulation** with 14+ pricing factors including popularity, ratings, and seasonal trends
- **Performance analytics** with win rates and best/worst performers

### Advanced Features
- **User authentication** with Appwrite backend
- **Personalized watchlists** and favorites
- **Search and discovery** with trending movies
- **Professional UI/UX** with modern design patterns

## Tech Stack

- **Frontend**: React Native, TypeScript, Expo
- **Styling**: TailwindCSS + NativeWind
- **AI Integration**: Google Gemini AI
- **Weather**: OpenWeatherMap API
- **Movie Data**: The Movie Database (TMDB) API
- **Backend**: Appwrite (Authentication, Database)
- **State Management**: React Hooks + AsyncStorage
- **Navigation**: Expo Router

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd MovieMood
npm install
```

### 2. Environment Setup
Create your `.env` file with the required API keys:

```bash
# Copy the example file
cp .env.example .env
```

**Required API Keys (All FREE):**

#### OpenWeatherMap API (FREE)
1. Visit [OpenWeatherMap API](https://openweathermap.org/api)
2. Sign up for free account
3. Get your API key from the dashboard
4. Add to `.env`: `EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here`

#### Google Gemini AI (FREE)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create free account
3. Generate API key
4. Add to `.env`: `EXPO_PUBLIC_GEMINI_API_KEY=your_key_here`

#### TMDB API (FREE)
1. Visit [TMDB API](https://www.themoviedb.org/settings/api)
2. Create free account
3. Request API key
4. Add to `.env`: `EXPO_PUBLIC_MOVIE_API_KEY=your_key_here`

#### Appwrite Backend (FREE)
1. Visit [Appwrite Cloud](https://appwrite.io/)
2. Create free project
3. Set up database and collections
4. Add credentials to `.env`

### 3. Run the App
```bash
# Start the development server
npx expo start

# Run on specific platforms
npx expo start --ios
npx expo start --android
npx expo start --web
```

## 📱 App Structure

```
MovieMood/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── movies/            # Movie detail screens
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── MoodMatcher.tsx    # AI mood analysis interface
│   ├── TradingInterface.tsx # Investment trading UI
│   └── PortfolioDashboard.tsx # Portfolio management
├── services/              # Business logic & API integration
│   ├── aiService.ts       # Google Gemini AI integration
│   ├── weatherService.ts  # OpenWeatherMap integration
│   ├── portfolioService.ts # Investment portfolio logic
│   ├── priceService.ts    # Movie stock pricing algorithm
│   ├── api.ts            # TMDB API integration
│   └── appwrite.ts       # Backend configuration
├── constants/             # App constants and configurations
├── types/                # TypeScript type definitions
└── .env                  # Environment variables
```

## Core Algorithms

### Mood Analysis Algorithm
The AI mood analysis considers multiple factors:
- **User input sentiment** (primary factor)
- **Current weather conditions** (sunny = energetic, rainy = cozy)
- **Time of day** (morning = high energy, evening = relaxing)
- **Seasonal influences** (winter = nostalgic, summer = adventurous)

### Movie Stock Pricing
Sophisticated pricing algorithm with 14+ factors:
- **Popularity score** (0-1000 scale)
- **Rating weighted by vote count**
- **Release date recency factor**
- **Budget and revenue performance**
- **Genre popularity multipliers**
- **Seasonal trends** (horror peaks in October)
- **Market volatility simulation**
- **Real-time supply/demand modeling**

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run tests (when implemented)
npm test
```

## Performance Features

- **Intelligent caching** for weather and movie data
- **Optimized image loading** with lazy loading
- **Debounced search** to reduce API calls
- **Background sync** for portfolio updates
- **Memory-efficient** list rendering with FlatList

## Security & Privacy

- **Environment variable protection** - No API keys exposed in code
- **Local data encryption** for sensitive portfolio data
- **Permission-based location access**
- **Secure authentication** with Appwrite
- **Rate limiting** on external API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- **OpenWeatherMap** for weather data
- **Google Gemini AI** for intelligent mood analysis
- **The Movie Database (TMDB)** for comprehensive movie data
- **Appwrite** for backend infrastructure
- **React Native & Expo** for excellent development experience

---

## Support

For questions or support, please open an issue in the GitHub repository.

**Built with ❤️ using React Native, TypeScript, and AI**
