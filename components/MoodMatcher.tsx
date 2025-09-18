import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getMoodBasedRecommendations, MoodAnalysis } from '../services/aiService';
import { fetchMoviesByGenres } from '../services/api';

interface MoodMatcherProps {
  onRecommendations: (movies: Movie[], moodAnalysis: MoodAnalysis, contextInfo: {
    weather: string | null;
    time: string;
    season: string;
  }) => void;
}

const MoodMatcher: React.FC<MoodMatcherProps> = ({ onRecommendations }) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showQuickMoods, setShowQuickMoods] = useState(true);

  const quickMoods = [
    { mood: "I'm stressed and need to relax", emoji: "😌", color: "#4CAF50" },
    { mood: "I want to laugh and feel happy", emoji: "😂", color: "#FF9800" },
    { mood: "I'm feeling adventurous today", emoji: "🚀", color: "#2196F3" },
    { mood: "I need something romantic", emoji: "💕", color: "#E91E63" },
    { mood: "I'm tired and want something easy", emoji: "😴", color: "#9C27B0" },
    { mood: "I want to be inspired", emoji: "✨", color: "#FF5722" },
    { mood: "I'm feeling nostalgic", emoji: "📽️", color: "#607D8B" },
    { mood: "I want to be scared", emoji: "👻", color: "#795548" },
  ];

  const handleMoodAnalysis = async (input: string) => {
    if (!input.trim()) {
      Alert.alert('Please enter how you\'re feeling');
      return;
    }

    setIsAnalyzing(true);
    setShowQuickMoods(false);

    try {
      // Get AI-powered mood analysis and recommendations
      const { moodAnalysis, recommendedGenres, contextInfo } = await getMoodBasedRecommendations(input);
      
      // Fetch movies based on recommended genres
      const movies = await fetchMoviesByGenres(recommendedGenres);
      
      // Pass results to parent component
      onRecommendations(movies.slice(0, 10), moodAnalysis, contextInfo);
      
    } catch (error) {
      console.error('Error analyzing mood:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to analyze your mood right now. Please try again or use a quick mood option.'
      );
      setShowQuickMoods(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickMood = (mood: string) => {
    setUserInput(mood);
    handleMoodAnalysis(mood);
  };

  const handleCustomInput = () => {
    if (userInput.trim()) {
      handleMoodAnalysis(userInput);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#AB8BFF" />
        <Text style={styles.title}>Mood Matcher</Text>
        <Text style={styles.subtitle}>Tell us how you&apos;re feeling and we&apos;ll find the perfect movie</Text>
      </View>

      {showQuickMoods && (
        <View style={styles.quickMoodsContainer}>
          <Text style={styles.quickMoodsTitle}>Quick Moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickMoodsScroll}>
            {quickMoods.map((mood, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickMoodButton, { backgroundColor: mood.color }]}
                onPress={() => handleQuickMood(mood.mood)}
              >
                <Text style={styles.quickMoodEmoji}>{mood.emoji}</Text>
                <Text style={styles.quickMoodText}>{mood.mood}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="How are you feeling? (e.g., 'I had a long day and want to relax')"
          value={userInput}
          onChangeText={setUserInput}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
          onPress={handleCustomInput}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Find My Movie</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AB8BFF" />
          <Text style={styles.loadingText}>Analyzing your mood and finding perfect movies...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickMoodsContainer: {
    marginBottom: 20,
  },
  quickMoodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  quickMoodsScroll: {
    flexDirection: 'row',
  },
  quickMoodButton: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickMoodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickMoodText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3A3A4E',
    marginBottom: 12,
    minHeight: 80,
  },
  analyzeButton: {
    backgroundColor: '#AB8BFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#AB8BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#6A6A7A',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default MoodMatcher;
