import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to performance monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info for display
    this.setState({ error, errorInfo });

    // In production, you might want to log this to a crash reporting service
    if (!__DEV__) {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 bg-primary justify-center items-center p-5">
          <View className="bg-secondary rounded-2xl p-6 max-w-sm items-center shadow-lg">
            <Ionicons name="warning" size={48} color="#F44336" className="mb-4" />
            
            <Text className="text-white text-xl font-bold text-center mb-3">
              Oops! Something went wrong
            </Text>
            
            <Text className="text-gray-400 text-sm text-center leading-5 mb-6">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <View className="bg-gray-800 rounded-lg p-4 mb-6 w-full">
                <Text className="text-accent text-sm font-bold mb-2">Debug Info:</Text>
                <Text className="text-gray-300 text-xs font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-gray-300 text-xs font-mono">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity 
              className="bg-accent rounded-xl px-6 py-3 flex-row items-center shadow-lg"
              onPress={this.handleReset}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;