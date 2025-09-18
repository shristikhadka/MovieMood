import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BoxOfficeData,
  GenreAnalytics,
  getBoxOfficeTrends,
  getGenreAnalytics,
  getROIAnalytics,
  getSeasonalAnalytics,
  getTopPerformingMovies,
  ROIAnalytics,
  SeasonalAnalytics,
} from '../services/analyticsService';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsDashboardProps {
  onMoviePress: (movie: Movie) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onMoviePress }) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'genres' | 'seasonal' | 'roi'>('trends');
  const [loading, setLoading] = useState(true);
  const [boxOfficeTrends, setBoxOfficeTrends] = useState<BoxOfficeData[]>([]);
  const [genreAnalytics, setGenreAnalytics] = useState<GenreAnalytics[]>([]);
  const [seasonalAnalytics, setSeasonalAnalytics] = useState<SeasonalAnalytics[]>([]);
  const [roiAnalytics, setRoiAnalytics] = useState<ROIAnalytics[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [trends, genres, seasonal, roi, movies] = await Promise.all([
        getBoxOfficeTrends(),
        getGenreAnalytics(),
        getSeasonalAnalytics(),
        getROIAnalytics(),
        getTopPerformingMovies(5),
      ]);
      
      setBoxOfficeTrends(trends);
      setGenreAnalytics(genres);
      setSeasonalAnalytics(seasonal);
      setRoiAnalytics(roi);
      setTopMovies(movies);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const renderBoxOfficeTrends = () => {
    if (boxOfficeTrends.length === 0) return null;

    const chartData = {
      labels: boxOfficeTrends.map(trend => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[trend.month - 1]} ${trend.year}`;
      }),
      datasets: [{
        data: boxOfficeTrends.map(trend => trend.totalRevenue / 1000000), // Convert to millions
        color: (opacity = 1) => `rgba(171, 139, 255, ${opacity})`,
        strokeWidth: 3,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Box Office Revenue Trends</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#1A1A2E',
              backgroundGradientFrom: '#1A1A2E',
              backgroundGradientTo: '#16213E',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#AB8BFF',
              },
              propsForLabels: {
                fontSize: 9,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#AB8BFF',
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={true}
            fromZero={false}
            segments={4}
          />
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(boxOfficeTrends.reduce((sum, trend) => sum + trend.totalRevenue, 0))}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{boxOfficeTrends.reduce((sum, trend) => sum + trend.movieCount, 0)}</Text>
            <Text style={styles.statLabel}>Total Movies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(boxOfficeTrends.reduce((sum, trend) => sum + trend.averageRevenue, 0) / boxOfficeTrends.length)}</Text>
            <Text style={styles.statLabel}>Avg Revenue</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGenreAnalytics = () => {
    if (genreAnalytics.length === 0) return null;

    const topGenres = genreAnalytics.slice(0, 6);
    const pieData = topGenres.map((genre, index) => ({
      name: genre.genreName,
      population: genre.totalRevenue,
      color: `hsl(${index * 60}, 70%, 60%)`,
      legendFontColor: '#FFFFFF',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Genre Performance</Text>
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={180}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            hasLegend={true}
          />
        </View>
        
        <ScrollView style={styles.genreList} showsVerticalScrollIndicator={false}>
          {topGenres.map((genre, index) => (
            <View key={genre.genreId} style={styles.genreItem}>
              <View style={[styles.genreColor, { backgroundColor: pieData[index].color }]} />
              <View style={styles.genreInfo}>
                <Text style={styles.genreName}>{genre.genreName}</Text>
                <Text style={styles.genreStats}>
                  {formatCurrency(genre.totalRevenue)} • {genre.movieCount} movies • {genre.averageRating.toFixed(1)}★
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSeasonalAnalytics = () => {
    if (seasonalAnalytics.length === 0) return null;

    // Ensure months are in calendar order and include December
    const seasonalSorted = [...seasonalAnalytics].sort((a, b) => a.month - b.month);
    const chartData = {
      labels: seasonalSorted.map(season => season.monthName.substring(0, 3)),
      datasets: [{
        data: seasonalSorted.map(season => season.totalRevenue / 1000000), // Convert to millions
        color: (opacity = 1) => `rgba(171, 139, 255, ${opacity})`,
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Seasonal Performance</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={chartData}
            width={screenWidth - 20}
            height={200}
            yAxisLabel=""
            yAxisSuffix="M"
            chartConfig={{
              backgroundColor: '#1A1A2E',
              backgroundGradientFrom: '#1A1A2E',
              backgroundGradientTo: '#16213E',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#AB8BFF',
                strokeWidth: 1,
              },
              propsForLabels: {
                fontSize: 9,
              },
            }}
            style={styles.chart}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={true}
            fromZero={false}
            segments={4}
          />
        </View>
        
        <ScrollView style={styles.seasonalInsights} showsVerticalScrollIndicator={false}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          {seasonalAnalytics
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 3)
            .map((season, index) => (
              <View key={season.month} style={styles.insightItem}>
                <Text style={styles.insightText}>
                  {index + 1}. {season.monthName} is the {index === 0 ? 'best' : index === 1 ? 'second best' : 'third best'} performing month
                </Text>
                <Text style={styles.insightValue}>{formatCurrency(season.totalRevenue)}</Text>
              </View>
            ))}
        </ScrollView>
      </View>
    );
  };

  const renderROIAnalytics = () => {
    if (roiAnalytics.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>ROI by Budget Range</Text>
        
        <View style={styles.roiList}>
          {roiAnalytics.map((roi, index) => (
            <View key={roi.budgetRange} style={styles.roiItem}>
              <View style={styles.roiHeader}>
                <Text style={styles.roiRange}>{roi.budgetRange}</Text>
                <Text style={[styles.roiValue, { color: roi.averageROI >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {roi.averageROI >= 0 ? '+' : ''}{roi.averageROI.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.roiStats}>
                <Text style={styles.roiStat}>
                  {roi.movieCount} movies • {roi.successRate.toFixed(0)}% success rate
                </Text>
                <Text style={styles.roiStat}>
                  Avg Revenue: {formatCurrency(roi.averageRevenue)}
                </Text>
              </View>
              <View style={styles.roiBar}>
                <View 
                  style={[
                    styles.roiBarFill, 
                    { 
                      width: `${Math.min(Math.abs(roi.averageROI), 100)}%`,
                      backgroundColor: roi.averageROI >= 0 ? '#4CAF50' : '#F44336'
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopMovies = () => {
    if (topMovies.length === 0) return null;

    return (
      <View style={styles.topMoviesContainer}>
        <Text style={styles.sectionTitle}>Top Performing Movies</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topMoviesScroll}>
          {topMovies.map((movie) => (
            <TouchableOpacity
              key={movie.id}
              style={styles.topMovieCard}
              onPress={() => onMoviePress(movie)}
            >
              <Image
                source={{
                  uri: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : 'https://via.placeholder.com/150x225/1A1A2E/FFFFFF?text=No+Image',
                }}
                style={styles.topMoviePoster}
              />
              <Text style={styles.topMovieTitle} numberOfLines={2}>
                {movie.title}
              </Text>
              <View style={styles.topMovieRating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.topMovieRatingText}>{movie.vote_average.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB8BFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab Navigation (fixed at top) */}
      <View style={styles.tabContainer}>
        {[
          { key: 'trends', label: 'Trends', icon: 'trending-up' },
          { key: 'genres', label: 'Genres', icon: 'film' },
          { key: 'seasonal', label: 'Seasonal', icon: 'calendar' },
          { key: 'roi', label: 'ROI', icon: 'analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#151312' : '#B0B0B0'}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Movies Section */}
        {renderTopMovies()}

        {/* Analytics Content */}
        {activeTab === 'trends' && renderBoxOfficeTrends()}
        {activeTab === 'genres' && renderGenreAnalytics()}
        {activeTab === 'seasonal' && renderSeasonalAnalytics()}
        {activeTab === 'roi' && renderROIAnalytics()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#AB8BFF',
  },
  tabText: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#151312',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topMoviesContainer: {
    marginBottom: 24,
  },
  topMoviesScroll: {
    paddingLeft: 16,
  },
  topMovieCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 8,
  },
  topMoviePoster: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  topMovieTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  topMovieRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topMovieRatingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  chartContainer: {
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
    marginVertical: 4,
  },
  chart: {
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    color: '#AB8BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 4,
  },
  genreList: {
    marginTop: 16,
    maxHeight: 200,
  },
  genreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genreColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  genreInfo: {
    flex: 1,
  },
  genreName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  genreStats: {
    color: '#B0B0B0',
    fontSize: 12,
    marginTop: 2,
  },
  seasonalInsights: {
    marginTop: 16,
    maxHeight: 200,
  },
  insightsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#16213E',
    borderRadius: 8,
  },
  insightText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  insightValue: {
    color: '#AB8BFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roiList: {
    marginTop: 16,
  },
  roiItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#16213E',
    borderRadius: 12,
  },
  roiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roiRange: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roiStats: {
    marginBottom: 8,
  },
  roiStat: {
    color: '#B0B0B0',
    fontSize: 12,
    marginBottom: 2,
  },
  roiBar: {
    height: 4,
    backgroundColor: '#2A2A3E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  roiBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default AnalyticsDashboard;
