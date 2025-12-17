import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

if (Platform.OS === 'ios') {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

const HelpQAItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, isOpen && styles.containerOpen]}>
      <TouchableOpacity
        style={styles.questionButton}
        onPress={toggleOpen}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{question}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
          style={styles.chevron}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.lg || 12,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  containerOpen: {
    borderColor: theme.colors.primary200 || theme.colors.primary,
  },
  questionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    width: '100%',
  },
  questionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.base * 1.4,
  },
  chevron: {
    marginLeft: theme.spacing.xs,
  },
  answerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  answerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.7,
  },
});

export default HelpQAItem;
