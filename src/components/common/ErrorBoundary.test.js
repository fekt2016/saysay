import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const ErrorTestButton = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    
    throw new Error('Test error: This is a simulated error to test ErrorBoundary!');
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShouldError(true)}
      >
        <Text style={styles.buttonText}>
          🧪 Test Error Boundary (Dev Only)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md || 12,
  },
  button: {
    backgroundColor: theme.colors.error || '#FF3B30',
    padding: theme.spacing.md || 12,
    borderRadius: theme.borderRadius.md || 8,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white || '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ErrorTestButton;
