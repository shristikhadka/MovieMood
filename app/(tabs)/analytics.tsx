import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';

const Analytics = () => {
  const router = useRouter();

  const handleMoviePress = (movie: Movie) => {
    router.push(`/movies/${movie.id}`);
  };

  return (
    <View style={styles.container}>
      <AnalyticsDashboard onMoviePress={handleMoviePress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
});

export default Analytics;
