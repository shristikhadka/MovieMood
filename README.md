# MovieMood – AI-Powered Movie Discovery

React Native app that combines mood-based AI recommendations, weather-aware personalization, and a virtual movie stock market.

<img src="https://i.imgur.com/RgkIdVL.png" width="400" />

## 🚀 Features

### AI Mood Matching
*Context-aware AI that considers weather, time, and sentiment*

<img src="https://i.imgur.com/kvutwjF.png" width="400" />

- Natural language explanations of recommendations
- Smart fallback system when AI is unavailable
- Weather and time context integration

### Movie Investment Simulator
*Dynamic movie stock prices with realistic market simulation*

<img src="https://i.imgur.com/7gTRMp1.png" width="400" />

- Complex pricing algorithm (popularity, ratings, seasonal trends, demand)
- Buy/sell with transaction history
- Portfolio analytics: P&L, win rate, risk assessment

### Analytics Dashboard
*Data visualization and business intelligence*

<img src="https://i.imgur.com/aHEMOiz.png" width="400" />

- Interactive charts (line, bar, pie)
- Genre/seasonal trend insights
- ROI analysis and top performers

### Other Features

- **Personalized Watchlists** - Save and organize favorite movies
- **Trending Discovery** - Real-time trending movies from TMDB
- **Search & Discovery** - Find movies with advanced filtering
- **User Authentication** - Secure login with Appwrite backend
- **Mobile Optimization** - Built for React Native with performance focus

## 🛠 Tech Stack

- **React Native** + **TypeScript** + **Expo**
- **Google Gemini AI** for mood analysis
- **TMDB** for movies & metadata
- **OpenWeatherMap** for weather integration
- **Appwrite** backend
- **TailwindCSS** (via NativeWind) for styling
- **Expo Router** for navigation

## 📂 Project Structure

```
MovieMood/
├── app/             # Screens (Expo Router)
├── components/      # UI components (MoodMatcher, TradingInterface, AnalyticsDashboard)
├── services/        # Business logic & API integrations
├── constants/       # App configs
└── types/           # TypeScript types
```

## ⚙️ Setup

```bash
git clone https://github.com/shristikhadka/MovieMood.git
cd MovieMood
npm install
cp .env.example .env   
npx expo start
```

**Required API Keys (all free):** Google Gemini AI, OpenWeatherMap, TMDB, Appwrite

## 🎯 Why This Project Matters

- **AI integration** → real contextual recommendations
- **Gamified trading simulator** → unique feature not seen in typical movie apps
- **Data visualization** → analytics dashboard with real insights
- **Modern mobile architecture** → TypeScript, Expo Router, modular services

---

**Built with React Native, TypeScript, and a focus on AI + data-driven user experiences.**