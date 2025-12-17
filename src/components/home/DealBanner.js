
 
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const DealBanner = ({ onPress }) => {
  return (
    <View style={styles.dealBanner}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
        style={styles.dealImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.9)']}
        style={styles.dealOverlay}
      />
      <View style={styles.dealContent}>
        <View style={styles.dealTag}>
          <Text style={styles.dealTagText}>Deal of the Day</Text>
        </View>
        <Text style={styles.dealTitle}>Premium Headphones</Text>
        <Text style={styles.dealDesc}>Immerse yourself in crystal clear sound</Text>
        <View style={styles.dealTimer}>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>08</Text>
            <Text style={styles.timerLabel}>Hours</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>45</Text>
            <Text style={styles.timerLabel}>Mins</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>12</Text>
            <Text style={styles.timerLabel}>Secs</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.dealButton} onPress={onPress}>
          <Text style={styles.dealButtonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dealBanner: {
    height: 280,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  dealImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  dealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dealContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  dealTag: {
    backgroundColor: theme.colors.error,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dealTagText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  dealTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: 8,
  },
  dealDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: 16,
  },
  dealTimer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    marginRight: 8,
    alignItems: 'center',
  },
  timerValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  timerLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.8,
  },
  dealButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  dealButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary,
  },
});

export default DealBanner;


