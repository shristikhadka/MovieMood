import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'api' | 'ui' | 'computation' | 'storage' | 'navigation';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PerformanceStats {
  totalMetrics: number;
  avgApiResponseTime: number;
  avgUiRenderTime: number;
  avgComputationTime: number;
  slowestOperations: PerformanceMetric[];
  fastestOperations: PerformanceMetric[];
  errorRate: number;
  sessionDuration: number;
}

// Constants
const PERFORMANCE_STORAGE_KEY = 'performance_metrics';
const MAX_STORED_METRICS = 1000; // Keep only last 1000 metrics
const SESSION_START_TIME = Date.now();

// Active measurements
const activeMetrics = new Map<string, PerformanceMetric>();

/**
 * Generate unique performance metric ID
 */
const generateMetricId = (): string => {
  return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Start measuring performance for an operation
 */
export const startPerformanceMetric = (
  name: string,
  category: PerformanceMetric['category'],
  metadata?: Record<string, any>
): string => {
  const id = generateMetricId();
  const metric: PerformanceMetric = {
    id,
    name,
    startTime: performance.now(),
    category,
    metadata,
    timestamp: new Date().toISOString(),
  };

  activeMetrics.set(id, metric);
  
  if (__DEV__) {
    console.log(`🚀 Started performance metric: ${name} (${id})`);
  }

  return id;
};

/**
 * End performance measurement and store result
 */
export const endPerformanceMetric = async (
  id: string,
  success: boolean = true,
  additionalMetadata?: Record<string, any>
): Promise<PerformanceMetric | null> => {
  const metric = activeMetrics.get(id);
  if (!metric) {
    console.warn(`Performance metric ${id} not found`);
    return null;
  }

  const endTime = performance.now();
  const duration = endTime - metric.startTime;

  const completedMetric: PerformanceMetric = {
    ...metric,
    endTime,
    duration,
    metadata: {
      ...metric.metadata,
      ...additionalMetadata,
      success,
    },
  };

  activeMetrics.delete(id);

  // Store metric
  await storePerformanceMetric(completedMetric);

  if (__DEV__) {
    const emoji = success ? '✅' : '❌';
    console.log(
      `${emoji} Completed performance metric: ${metric.name} (${duration.toFixed(2)}ms)`
    );

    // Warn about slow operations
    if (duration > 2000) {
      console.warn(`⚠️ Slow operation detected: ${metric.name} took ${duration.toFixed(2)}ms`);
    }
  }

  return completedMetric;
};

/**
 * Measure a function's performance automatically
 */
export const measurePerformance = async <T>(
  name: string,
  category: PerformanceMetric['category'],
  fn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  const id = startPerformanceMetric(name, category, metadata);
  
  try {
    const result = await fn();
    await endPerformanceMetric(id, true, { resultType: typeof result });
    return result;
  } catch (error) {
    await endPerformanceMetric(id, false, { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

/**
 * Store performance metric to AsyncStorage
 */
const storePerformanceMetric = async (metric: PerformanceMetric): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(PERFORMANCE_STORAGE_KEY);
    const metrics: PerformanceMetric[] = existingData ? JSON.parse(existingData) : [];
    
    // Add new metric
    metrics.push(metric);
    
    // Keep only the most recent metrics to prevent storage bloat
    const recentMetrics = metrics.slice(-MAX_STORED_METRICS);
    
    await AsyncStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(recentMetrics));
  } catch (error) {
    console.error('Error storing performance metric:', error);
  }
};

/**
 * Get all stored performance metrics
 */
export const getPerformanceMetrics = async (): Promise<PerformanceMetric[]> => {
  try {
    const data = await AsyncStorage.getItem(PERFORMANCE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    return [];
  }
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = async (): Promise<PerformanceStats> => {
  try {
    const metrics = await getPerformanceMetrics();
    const completedMetrics = metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        totalMetrics: 0,
        avgApiResponseTime: 0,
        avgUiRenderTime: 0,
        avgComputationTime: 0,
        slowestOperations: [],
        fastestOperations: [],
        errorRate: 0,
        sessionDuration: Date.now() - SESSION_START_TIME,
      };
    }

    // Calculate averages by category
    const apiMetrics = completedMetrics.filter(m => m.category === 'api');
    const uiMetrics = completedMetrics.filter(m => m.category === 'ui');
    const computationMetrics = completedMetrics.filter(m => m.category === 'computation');

    const avgApiResponseTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / apiMetrics.length 
      : 0;

    const avgUiRenderTime = uiMetrics.length > 0
      ? uiMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / uiMetrics.length
      : 0;

    const avgComputationTime = computationMetrics.length > 0
      ? computationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / computationMetrics.length
      : 0;

    // Find slowest and fastest operations
    const sortedByDuration = [...completedMetrics].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    const slowestOperations = sortedByDuration.slice(0, 5);
    const fastestOperations = sortedByDuration.slice(-5).reverse();

    // Calculate error rate
    const errorCount = completedMetrics.filter(m => m.metadata?.success === false).length;
    const errorRate = (errorCount / completedMetrics.length) * 100;

    return {
      totalMetrics: completedMetrics.length,
      avgApiResponseTime,
      avgUiRenderTime,
      avgComputationTime,
      slowestOperations,
      fastestOperations,
      errorRate,
      sessionDuration: Date.now() - SESSION_START_TIME,
    };
  } catch (error) {
    console.error('Error calculating performance stats:', error);
    return {
      totalMetrics: 0,
      avgApiResponseTime: 0,
      avgUiRenderTime: 0,
      avgComputationTime: 0,
      slowestOperations: [],
      fastestOperations: [],
      errorRate: 0,
      sessionDuration: Date.now() - SESSION_START_TIME,
    };
  }
};

/**
 * Clear all performance metrics (useful for testing or reset)
 */
export const clearPerformanceMetrics = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PERFORMANCE_STORAGE_KEY);
    activeMetrics.clear();
  } catch (error) {
    console.error('Error clearing performance metrics:', error);
  }
};

/**
 * Monitor API call performance
 */
export const monitorApiCall = async <T>(
  apiName: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return measurePerformance(
    `API: ${apiName}`,
    'api',
    apiCall,
    { apiEndpoint: apiName, ...metadata }
  );
};

/**
 * Monitor UI rendering performance
 */
export const monitorUIRender = async <T>(
  componentName: string,
  renderFn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  return measurePerformance(
    `UI: ${componentName}`,
    'ui',
    renderFn,
    { component: componentName, ...metadata }
  );
};

/**
 * Monitor computation performance
 */
export const monitorComputation = async <T>(
  computationName: string,
  computationFn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  return measurePerformance(
    `Computation: ${computationName}`,
    'computation',
    computationFn,
    { computation: computationName, ...metadata }
  );
};

/**
 * Monitor storage operations
 */
export const monitorStorage = async <T>(
  operationName: string,
  storageFn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  return measurePerformance(
    `Storage: ${operationName}`,
    'storage',
    storageFn,
    { operation: operationName, ...metadata }
  );
};

/**
 * Monitor navigation performance
 */
export const monitorNavigation = async <T>(
  navigationAction: string,
  navigationFn: () => Promise<T> | T,
  metadata?: Record<string, any>
): Promise<T> => {
  return measurePerformance(
    `Navigation: ${navigationAction}`,
    'navigation',
    navigationFn,
    { action: navigationAction, ...metadata }
  );
};

/**
 * Get memory usage information (iOS/Android only)
 */
export const getMemoryUsage = (): Record<string, any> => {
  try {
    // This is a simplified memory monitoring
    // In a real app, you'd use react-native-device-info or similar
    return {
      timestamp: new Date().toISOString(),
      // These would be actual memory readings in production
      heapUsed: Math.floor(Math.random() * 100), // MB
      heapTotal: Math.floor(Math.random() * 200), // MB
      external: Math.floor(Math.random() * 50), // MB
    };
  } catch (error) {
    console.error('Error getting memory usage:', error);
    return {};
  }
};

/**
 * Log performance summary for debugging
 */
export const logPerformanceSummary = async (): Promise<void> => {
  if (!__DEV__) return;

  try {
    const stats = await getPerformanceStats();
    
    console.log('📊 Performance Summary:');
    console.log(`   Total Metrics: ${stats.totalMetrics}`);
    console.log(`   Avg API Response: ${stats.avgApiResponseTime.toFixed(2)}ms`);
    console.log(`   Avg UI Render: ${stats.avgUiRenderTime.toFixed(2)}ms`);
    console.log(`   Avg Computation: ${stats.avgComputationTime.toFixed(2)}ms`);
    console.log(`   Error Rate: ${stats.errorRate.toFixed(2)}%`);
    console.log(`   Session Duration: ${(stats.sessionDuration / 1000).toFixed(2)}s`);
    
    if (stats.slowestOperations.length > 0) {
      console.log('🐌 Slowest Operations:');
      stats.slowestOperations.slice(0, 3).forEach((op, i) => {
        console.log(`   ${i + 1}. ${op.name}: ${op.duration?.toFixed(2)}ms`);
      });
    }
  } catch (error) {
    console.error('Error logging performance summary:', error);
  }
};