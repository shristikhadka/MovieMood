import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from './ErrorBoundary';

interface AIErrorFallbackProps {
  onRetry: () => void;
}

const AIErrorFallback: React.FC<AIErrorFallbackProps> = ({ onRetry }) => (
  <View style={styles.container}>
    <Ionicons name="bulb" size={48} color="#AB8BFF" style={styles.icon} />
    
    <Text style={styles.title}>AI Service Temporarily Unavailable</Text>
    
    <Text style={styles.message}>
      Our AI mood analysis is currently experiencing issues. You can still browse movies manually or try again in a moment.
    </Text>

    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.buttonText}>Retry AI Analysis</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.skipButton} onPress={() => {}}>
        <Ionicons name="search" size={16} color="#AB8BFF" />
        <Text style={styles.skipButtonText}>Browse Movies</Text>
      </TouchableOpacity>
    </View>
  </View>
);

interface AIErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

const AIErrorBoundary: React.FC<AIErrorBoundaryProps> = ({ children, onRetry }) => {
  const handleError = (error: Error) => {
    console.error('AI Service Error:', error);
    // Log to analytics service
    // logAIError(error);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    // Reset the error boundary
    window.location.reload();
  };

  return (
    <ErrorBoundary
      fallback={<AIErrorFallback onRetry={handleRetry} />}
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
  },
  retryButton: {
    backgroundColor: '#AB8BFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#AB8BFF',
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
  skipButtonText: {
    color: '#AB8BFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default AIErrorBoundary;