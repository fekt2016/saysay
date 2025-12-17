import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useMarkAsRead, useUnreadCount } from '../hooks/useNotification';
import { theme } from '../theme';

/**
 * NotificationDropdown Component
 * 
 * Implements the required filtering logic:
 * - Always prioritizes unread notifications
 * - Removes notifications from dropdown immediately after they are read
 * - Shows read notifications only when there are no unread notifications
