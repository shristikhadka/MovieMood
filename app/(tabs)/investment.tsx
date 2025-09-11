import PortfolioDashboard from '@/components/PortfolioDashboard';
import TradingInterface from '@/components/TradingInterface';
import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { Portfolio, getPortfolio } from '@/services/portfolioService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const Investment = () => {
  const [activeTab, setActiveTab] = useState<'trading' | 'portfolio'>('trading');
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const portfolioData = await getPortfolio();
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioUpdate = (updatedPortfolio: Portfolio) => {
    setPortfolio(updatedPortfolio);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AB8BFF" />
        <Text style={styles.loadingText}>Loading investment data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={images.bg}
        className="absolute w-full z-0"
        resizeMode="cover"
      />

      {/* Header */}
      <View style={styles.header}>
        <Image source={icons.logo} className="w-12 h-10 mt-20 mb-5 mx-auto" />
        <Text style={styles.headerTitle}>Movie Investment Simulator</Text>
        <Text style={styles.headerSubtitle}>
          Trade virtual movie stocks and build your portfolio
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'trading' && styles.activeTab
          ]}
          onPress={() => setActiveTab('trading')}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'trading' ? '#AB8BFF' : '#A8B5DB'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'trading' && styles.activeTabText
          ]}>
            Trading
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'portfolio' && styles.activeTab
          ]}
          onPress={() => setActiveTab('portfolio')}
        >
          <Ionicons
            name="pie-chart"
            size={20}
            color={activeTab === 'portfolio' ? '#AB8BFF' : '#A8B5DB'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'portfolio' && styles.activeTabText
          ]}>
            Portfolio
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'trading' ? (
          <TradingInterface onPortfolioUpdate={handlePortfolioUpdate} />
        ) : (
          <PortfolioDashboard 
            portfolio={portfolio} 
            onRefresh={loadPortfolio}
          />
        )}
      </View>
    </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#A8B5DB',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#AB8BFF',
  },
  tabText: {
    color: '#A8B5DB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});

export default Investment;
