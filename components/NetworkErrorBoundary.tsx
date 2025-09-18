import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from './ErrorBoundary';

interface NetworkErrorFallbackProps {
  onRetry: () => void;
  onOfflineMode: () => void;
}

const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({ 
  onRetry, 
  onOfflineMode 
}) => (
  <View style={styles.container}>
    <Ionicons name="wifi" size={48} color="#F44336" style={styles.icon} />
    
    <Text style={styles.title}>Network Connection Error</Text>
    
    <Text style={styles.message}>
      Unable to connect to our services. Please check your internet connection and try again.
    </Text>

    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.buttonText}>Retry Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.offlineButton} onPress={onOfflineMode}>
        <Ionicons name="download" size={16} color="#4CAF50" />
        <Text style={styles.offlineButtonText}>Use Offline Mode</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.hint}>
      Offline mode will use cached data and limited functionality
    </Text>
  </View>
);

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onOfflineMode?: () => void;
}

const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({ 
  children, 
  onRetry,
  onOfflineMode 
}) => {
  const handleError = (error: Error) => {
    console.error('Network Error:', error);
    // Log network errors for debugging
    // logNetworkError(error);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    // Reset the error boundary
    window.location.reload();
  };

  const handleOfflineMode = () => {
    if (onOfflineMode) {
      onOfflineMode();
    }
    // Enable offline mode
    // enableOfflineMode();
  };

  return (
    <ErrorBoundary
      fallback={
        <NetworkErrorFallback 
          onRetry={handleRetry} 
          onOfflineMode={handleOfflineMode}
        />
      }
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#AB8BFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  hint: {
    color: '#A8B5DB',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NetworkErrorBoundary;