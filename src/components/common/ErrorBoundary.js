import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import logger from '../../utils/logger';
import { captureException } from '../../utils/errorReporting';

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    logger.error('[ErrorBoundary] Caught error:', {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Send to error reporting service in production
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
      captureException(error, {
        componentStack: errorInfo?.componentStack,
        errorBoundary: true,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg || 24,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg || 24,
  },
  title: {
    fontSize: theme.typography.fontSize.xl || 24,
    fontWeight: theme.typography.fontWeight.bold || 'bold',
    color: theme.colors.text || '#000000',
    marginBottom: theme.spacing.md || 12,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.md || 16,
    color: theme.colors.textSecondary || '#666666',
    textAlign: 'center',
    marginBottom: theme.spacing.xl || 32,
    lineHeight: 24,
  },
  debugContainer: {
    width: '100%',
    backgroundColor: theme.colors.errorBackground || '#FFF5F5',
    padding: theme.spacing.md || 12,
    borderRadius: theme.borderRadius.md || 8,
    marginBottom: theme.spacing.lg || 24,
    maxHeight: 300,
  },
  debugTitle: {
    fontSize: theme.typography.fontSize.sm || 14,
    fontWeight: theme.typography.fontWeight.bold || 'bold',
    color: theme.colors.error || '#FF3B30',
    marginBottom: theme.spacing.xs || 8,
  },
  debugText: {
    fontSize: theme.typography.fontSize.xs || 12,
    color: theme.colors.text || '#000000',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: theme.colors.primary || '#007AFF',
    paddingVertical: theme.spacing.md || 12,
    paddingHorizontal: theme.spacing.xl || 32,
    borderRadius: theme.borderRadius.md || 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white || '#FFFFFF',
    fontSize: theme.typography.fontSize.md || 16,
    fontWeight: theme.typography.fontWeight.semibold || '600',
  },
});

export default ErrorBoundary;
