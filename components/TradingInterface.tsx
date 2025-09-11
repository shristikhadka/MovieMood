import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchMovies } from '../services/api';
import { buyStock, getPortfolio, Portfolio, sellStock } from '../services/portfolioService';
import { getMultipleMoviePrices, MoviePriceData } from '../services/priceService';

interface TradingInterfaceProps {
  onPortfolioUpdate: (portfolio: Portfolio) => void;
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({ onPortfolioUpdate }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviePrices, setMoviePrices] = useState<MoviePriceData[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<MoviePriceData | null>(null);
  const [shares, setShares] = useState('1');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load portfolio
      const portfolioData = await getPortfolio();
      setPortfolio(portfolioData);
      onPortfolioUpdate(portfolioData);
      
      // Load movies
      const moviesData = await fetchMovies({ query: '' });
      setMovies(moviesData.slice(0, 20)); // Show top 20 movies
      
      // Calculate prices
      const prices = await getMultipleMoviePrices(moviesData.slice(0, 20));
      setMoviePrices(prices);
      
    } catch (error) {
      console.error('Error loading trading data:', error);
      Alert.alert('Error', 'Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyStock = async () => {
    if (!selectedMovie || !portfolio) return;
    
    const sharesToBuy = parseInt(shares);
    if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of shares');
      return;
    }

    const movie = movies.find(m => m.id === selectedMovie.movieId);
    if (!movie) return;

    const result = await buyStock(
      selectedMovie.movieId,
      movie.title,
      movie.poster_path,
      sharesToBuy,
      selectedMovie.currentPrice
    );

    if (result.success && result.portfolio) {
      setPortfolio(result.portfolio);
      onPortfolioUpdate(result.portfolio);
      setShowBuyModal(false);
      setSelectedMovie(null);
      setShares('1');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleSellStock = async () => {
    if (!selectedMovie || !portfolio) return;
    
    const sharesToSell = parseInt(shares);
    if (isNaN(sharesToSell) || sharesToSell <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of shares');
      return;
    }

    const result = await sellStock(
      selectedMovie.movieId,
      sharesToSell,
      selectedMovie.currentPrice
    );

    if (result.success && result.portfolio) {
      setPortfolio(result.portfolio);
      onPortfolioUpdate(result.portfolio);
      setShowSellModal(false);
      setSelectedMovie(null);
      setShares('1');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return '#4CAF50'; // Green
    if (change < 0) return '#F44336'; // Red
    return '#9E9E9E'; // Gray
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'remove';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB8BFF" />
        <Text style={styles.loadingText}>Loading trading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
      {/* Portfolio Summary */}
      {portfolio && (
        <View style={styles.portfolioSummary}>
          <Text style={styles.portfolioTitle}>Your Portfolio</Text>
          <View style={styles.portfolioRow}>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>Cash</Text>
              <Text style={styles.portfolioValue}>${portfolio.cash.toFixed(2)}</Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>Total Value</Text>
              <Text style={styles.portfolioValue}>${portfolio.totalValue.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.portfolioRow}>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>P&L</Text>
              <Text style={[
                styles.portfolioValue,
                { color: portfolio.totalProfitLoss >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {portfolio.totalProfitLoss >= 0 ? '+' : ''}${portfolio.totalProfitLoss.toFixed(2)}
              </Text>
            </View>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioLabel}>Return</Text>
              <Text style={[
                styles.portfolioValue,
                { color: portfolio.totalProfitLossPercent >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {portfolio.totalProfitLossPercent >= 0 ? '+' : ''}{portfolio.totalProfitLossPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Movie Stocks */}
      <View style={styles.stocksContainer}>
        <Text style={styles.sectionTitle}>Movie Stocks</Text>
        {moviePrices.map((priceData) => {
          const movie = movies.find(m => m.id === priceData.movieId);
          if (!movie) return null;

          const userHolding = portfolio?.holdings.find(h => h.movieId === priceData.movieId);

          return (
            <TouchableOpacity
              key={priceData.movieId}
              style={styles.stockCard}
              onPress={() => {
                setSelectedMovie(priceData);
                setShowBuyModal(true);
              }}
            >
              <Image
                source={{
                  uri: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                    : 'https://placehold.co/200x300/1a1a1a/FFFFFF.png',
                }}
                style={styles.moviePoster}
                resizeMode="cover"
              />
              
              <View style={styles.stockInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.title}
                </Text>
                
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>
                    ${priceData.currentPrice.toFixed(2)}
                  </Text>
                  <View style={styles.priceChange}>
                    <Ionicons
                      name={getPriceChangeIcon(priceData.priceChange)}
                      size={16}
                      color={getPriceChangeColor(priceData.priceChange)}
                    />
                    <Text style={[
                      styles.priceChangeText,
                      { color: getPriceChangeColor(priceData.priceChange) }
                    ]}>
                      {priceData.priceChangePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.stockDetails}>
                  <Text style={styles.stockDetail}>
                    Vol: {priceData.volume.toLocaleString()}
                  </Text>
                  <Text style={styles.stockDetail}>
                    Cap: ${(priceData.marketCap / 1000000).toFixed(1)}M
                  </Text>
                </View>

                {userHolding && (
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingText}>
                      You own {userHolding.shares} shares
                    </Text>
                    <Text style={[
                      styles.holdingPnl,
                      { color: userHolding.profitLoss >= 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {userHolding.profitLoss >= 0 ? '+' : ''}${userHolding.profitLoss.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.buyButton]}
                  onPress={() => {
                    setSelectedMovie(priceData);
                    setShowBuyModal(true);
                  }}
                >
                  <Text style={styles.buyButtonText}>Buy</Text>
                </TouchableOpacity>
                
                {userHolding && userHolding.shares > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.sellButton]}
                    onPress={() => {
                      setSelectedMovie(priceData);
                      setShowSellModal(true);
                    }}
                  >
                    <Text style={styles.sellButtonText}>Sell</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      </ScrollView>

      {/* Buy Modal */}
      {showBuyModal && selectedMovie && (
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Buy Stock</Text>
              <Text style={styles.modalMovieTitle}>
                {movies.find(m => m.id === selectedMovie.movieId)?.title}
              </Text>
              <Text style={styles.modalPrice}>
                ${selectedMovie.currentPrice.toFixed(2)} per share
              </Text>
              
              <TextInput
                style={styles.sharesInput}
                value={shares}
                onChangeText={setShares}
                placeholder="Number of shares"
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <Text style={styles.totalCost}>
                Total: ${(parseInt(shares) * selectedMovie.currentPrice).toFixed(2)}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowBuyModal(false);
                    setSelectedMovie(null);
                    setShares('1');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleBuyStock}
                >
                  <Text style={styles.confirmButtonText}>Buy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Sell Modal */}
      {showSellModal && selectedMovie && portfolio && (
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Sell Stock</Text>
              <Text style={styles.modalMovieTitle}>
                {movies.find(m => m.id === selectedMovie.movieId)?.title}
              </Text>
              <Text style={styles.modalPrice}>
                ${selectedMovie.currentPrice.toFixed(2)} per share
              </Text>
              
              {(() => {
                const holding = portfolio.holdings.find(h => h.movieId === selectedMovie.movieId);
                return holding ? (
                  <Text style={styles.availableShares}>
                    Available: {holding.shares} shares
                  </Text>
                ) : null;
              })()}
              
              <TextInput
                style={styles.sharesInput}
                value={shares}
                onChangeText={setShares}
                placeholder="Number of shares"
                keyboardType="numeric"
                returnKeyType="done"
              />
              
              <Text style={styles.totalCost}>
                Total: ${(parseInt(shares) * selectedMovie.currentPrice).toFixed(2)}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSellModal(false);
                    setSelectedMovie(null);
                    setShares('1');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSellStock}
                >
                  <Text style={styles.confirmButtonText}>Sell</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030014',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030014',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  portfolioSummary: {
    backgroundColor: '#1A1A2E',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  portfolioTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  portfolioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  portfolioItem: {
    flex: 1,
  },
  portfolioLabel: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 4,
  },
  portfolioValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stocksContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stockCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
  },
  stockInfo: {
    flex: 1,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockDetail: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  holdingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdingText: {
    color: '#AB8BFF',
    fontSize: 12,
  },
  holdingPnl: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#4CAF50',
  },
  sellButton: {
    backgroundColor: '#F44336',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sellButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    minHeight: 300,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMovieTitle: {
    color: '#AB8BFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  availableShares: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  sharesInput: {
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  totalCost: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#2A2A3E',
  },
  confirmButton: {
    backgroundColor: '#AB8BFF',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TradingInterface;
