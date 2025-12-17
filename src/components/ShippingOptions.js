import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetShippingOptions } from '../hooks/useShipping';
import { calculateCartWeight } from '../utils/calculateCartWeight';
import { theme } from '../theme';

/**
 * ShippingOptions Component - Mobile version
 * Displays shipping options with calculated fees using the new ShippingZone system
