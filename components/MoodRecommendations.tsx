import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { MoodAnalysis } from '../services/aiService';
import MovieCard from './MovieCard';

interface MoodRecommendationsProps {
  movies: Movie[];
  moodAnalysis: MoodAnalysis;
  contextInfo: {
    weather: string | null;
    time: string;
    season: string;
  };
  onMoviePress: (movie: Movie) => void;
  onReset: () => void;
}

const MoodRecommendations: React.FC<MoodRecommendationsProps> = ({
  movies,
  moodAnalysis,
  contextInfo,
  onMoviePress,
  onReset,
}) => {
  const getMoodEmoji = (mood: string): string => {
    const moodEmojis: { [key: string]: string } = {
      'stressed': '😌',
      'tired': '😴',
      'happy': '😊',
      'excited': '🚀',
      'sad': '😢',
      'bored': '😐',
      'romantic': '💕',
      'adventurous': '⚡',
      'nostalgic': '📽️',
      'inspired': '✨',
      'neutral': '🎬',
    };
    return moodEmojis[mood] || '🎬';
  };

  const getEnergyColor = (level: number): string => {
    if (level <= 2) return '#4CAF50'; // Low energy - green
    if (level <= 3) return '#FF9800'; // Medium energy - orange
    return '#F44336'; // High energy - red
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.moodHeader}>
          <Text style={styles.moodEmoji}>{getMoodEmoji(moodAnalysis.mood)}</Text>
          <View style={styles.moodInfo}>
            <Text style={styles.moodTitle}>Perfect for your {moodAnalysis.mood} mood</Text>
            <View style={styles.energyContainer}>
              <Text style={styles.energyLabel}>Energy Level:</Text>
              <View style={styles.energyBar}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.energyDot,
                      {
                        backgroundColor: level <= moodAnalysis.energy_level 
                          ? getEnergyColor(moodAnalysis.energy_level)
                          : '#3A3A4E'
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Ionicons name="refresh" size={20} color="#AB8BFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.contextContainer}>
        <Text style={styles.contextTitle}>Why these movies?</Text>
        <Text style={styles.contextText}>{moodAnalysis.explanation}</Text>
        
        <View style={styles.contextDetails}>
          {contextInfo.weather && (
            <View style={styles.contextItem}>
              <Ionicons name="partly-sunny" size={16} color="#AB8BFF" />
              <Text style={styles.contextItemText}>{contextInfo.weather}</Text>
            </View>
          )}
          <View style={styles.contextItem}>
            <Ionicons name="time" size={16} color="#AB8BFF" />
            <Text style={styles.contextItemText}>{contextInfo.time}</Text>
          </View>
        </View>
      </View>

      <View style={styles.genresContainer}>
        <Text style={styles.genresTitle}>Recommended Genres:</Text>
        <View style={styles.genresList}>
          {moodAnalysis.preferred_genres.map((genre, index) => (
            <View key={index} style={styles.genreTag}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.moviesContainer}>
        <Text style={styles.moviesTitle}>
          Perfect Movies for You ({movies.length} found)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {movies.map((movie) => (
            <View key={movie.id} style={styles.movieCard}>
              <MovieCard {...movie} />
            </View>
          ))}
        </ScrollView>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  moodHeader: {
    flexDirection: 'row',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  moodInfo: {
    flex: 1,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyLabel: {
    fontSize: 14,
    color: '#B0B0B0',
    marginRight: 8,
  },
  energyBar: {
    flexDirection: 'row',
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },
  contextContainer: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AB8BFF',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
  contextDetails: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contextItemText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginLeft: 4,
  },
  genresContainer: {
    marginBottom: 20,
  },
  genresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#AB8BFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  moviesContainer: {
    marginBottom: 16,
  },
  moviesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  movieCard: {
    marginRight: 12,
    width: 120,
  },
});

export default MoodRecommendations;
