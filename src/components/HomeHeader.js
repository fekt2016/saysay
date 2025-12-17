import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Logo from './Logo';
import { theme } from '../theme';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';

/**
 * HomeHeader - Custom header for Home screen with logo, search, and avatar
