import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getPortfolioStats, Portfolio, PortfolioStats } from '../services/portfolioService';

interface PortfolioDashboardProps {
  portfolio: Portfolio | null;
  onRefresh: () => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolio, onRefresh }) => {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portfolio) {
      loadStats();
    }
  }, [portfolio]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const portfolioStats = await getPortfolioStats();
      setStats(portfolioStats);
    } catch (error) {
      console.error('Error loading portfolio stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return '#4CAF50';
    if (value < 0) return '#F44336';
    return '#9E9E9E';
  };

  if (!portfolio) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB8BFF" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Portfolio Overview */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>Portfolio Overview</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color="#AB8BFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Total Value</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(portfolio.totalValue)}
            </Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Cash</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(portfolio.cash)}
            </Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Invested</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(portfolio.totalInvested)}
            </Text>
          </View>
          
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>P&L</Text>
            <Text style={[
              styles.overviewValue,
              { color: getPerformanceColor(portfolio.totalProfitLoss) }
            ]}>
              {formatCurrency(portfolio.totalProfitLoss)}
            </Text>
          </View>
        </View>
        
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Total Return</Text>
          <Text style={[
            styles.performanceValue,
            { color: getPerformanceColor(portfolio.totalProfitLossPercent) }
          ]}>
            {formatPercent(portfolio.totalProfitLossPercent)}
          </Text>
        </View>
      </View>

      {/* Holdings */}
      <View style={styles.holdingsCard}>
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        
        {portfolio.holdings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No holdings yet</Text>
            <Text style={styles.emptySubtext}>Start investing in movie stocks!</Text>
          </View>
        ) : (
          portfolio.holdings.map((holding) => (
            <View key={holding.movieId} style={styles.holdingItem}>
              <Image
                source={{
                  uri: holding.posterPath
                    ? `https://image.tmdb.org/t/p/w200${holding.posterPath}`
                    : 'https://placehold.co/200x300/1a1a1a/FFFFFF.png',
                }}
                style={styles.holdingPoster}
                resizeMode="cover"
              />
              
              <View style={styles.holdingInfo}>
                <Text style={styles.holdingTitle} numberOfLines={2}>
                  {holding.movieTitle}
                </Text>
                
                <View style={styles.holdingDetails}>
                  <Text style={styles.holdingDetail}>
                    {holding.shares} shares @ {formatCurrency(holding.averagePrice)}
                  </Text>
                  <Text style={styles.holdingDetail}>
                    Current: {formatCurrency(holding.currentPrice)}
                  </Text>
                </View>
                
                <View style={styles.holdingPerformance}>
                  <Text style={styles.holdingValue}>
                    {formatCurrency(holding.totalValue)}
                  </Text>
                  <Text style={[
                    styles.holdingPnl,
                    { color: getPerformanceColor(holding.profitLoss) }
                  ]}>
                    {formatCurrency(holding.profitLoss)} ({formatPercent(holding.profitLossPercent)})
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Portfolio Stats */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Portfolio Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Transactions</Text>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Win Rate</Text>
              <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average Return</Text>
              <Text style={[
                styles.statValue,
                { color: getPerformanceColor(stats.averageReturn) }
              ]}>
                {formatPercent(stats.averageReturn)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Risk Score</Text>
              <Text style={styles.statValue}>{stats.riskScore.toFixed(2)}</Text>
            </View>
          </View>
          
          {/* Best & Worst Performers */}
          {(stats.bestPerformer || stats.worstPerformer) && (
            <View style={styles.performersSection}>
              <Text style={styles.performersTitle}>Top Performers</Text>
              
              {stats.bestPerformer && (
                <View style={styles.performerItem}>
                  <Ionicons name="trending-up" size={20} color="#4CAF50" />
                  <Text style={styles.performerText}>
                    {stats.bestPerformer.movieTitle}: {formatPercent(stats.bestPerformer.profitLossPercent)}
                  </Text>
                </View>
              )}
              
              {stats.worstPerformer && (
                <View style={styles.performerItem}>
                  <Ionicons name="trending-down" size={20} color="#F44336" />
                  <Text style={styles.performerText}>
                    {stats.worstPerformer.movieTitle}: {formatPercent(stats.worstPerformer.profitLossPercent)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.transactionsCard}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {portfolio.transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your trading history will appear here</Text>
          </View>
        ) : (
          portfolio.transactions
            .slice(-10) // Show last 10 transactions
            .reverse() // Most recent first
            .map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === 'buy' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={transaction.type === 'buy' ? '#4CAF50' : '#F44336'}
                  />
                </View>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.shares} shares
                  </Text>
                  <Text style={styles.transactionMovie}>
                    {transaction.movieTitle}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.transactionValue,
                    { color: transaction.type === 'buy' ? '#F44336' : '#4CAF50' }
                  ]}>
                    {transaction.type === 'buy' ? '-' : '+'}{formatCurrency(transaction.totalAmount)}
                  </Text>
                  <Text style={styles.transactionPrice}>
                    @ {formatCurrency(transaction.price)}
                  </Text>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030014',
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
  overviewCard: {
    backgroundColor: '#1A1A2E',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewItem: {
    width: '48%',
    marginBottom: 16,
  },
  overviewLabel: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 4,
  },
  overviewValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  performanceLabel: {
    color: '#B0B0B0',
    fontSize: 16,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  holdingsCard: {
    backgroundColor: '#1A1A2E',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  holdingItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  holdingPoster: {
    width: 50,
    height: 75,
    borderRadius: 8,
    marginRight: 16,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  holdingDetails: {
    marginBottom: 8,
  },
  holdingDetail: {
    color: '#B0B0B0',
    fontSize: 12,
    marginBottom: 2,
  },
  holdingPerformance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdingValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  holdingPnl: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#1A1A2E',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    color: '#B0B0B0',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  performersSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  performersTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  transactionsCard: {
    backgroundColor: '#1A1A2E',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionMovie: {
    color: '#AB8BFF',
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDate: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionPrice: {
    color: '#B0B0B0',
    fontSize: 12,
  },
});

export default PortfolioDashboard;
