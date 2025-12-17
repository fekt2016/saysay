import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const NotFoundScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.icon}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  icon: { fontSize: 72, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
  message: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl, lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal },
  button: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.xl, borderRadius: 8, backgroundColor: theme.colors.primary },
  buttonText: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.white },
});

export default NotFoundScreen;


