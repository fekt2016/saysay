import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useBrowserHistory } from '../../hooks/useBrowserhistory';
import { theme } from '../../theme';

const BrowserHistoryScreen = () => {
  const navigation = useNavigation();
  const { data: historyData, isLoading } = useBrowserHistory();

  const history = useMemo(() => {
    if (!historyData?.data?.history && !historyData?.data?.data) return [];
    return historyData.data.history || historyData.data.data || [];
  }, [historyData]);

  const handleProductPress = (item) => {
    navigation.navigate('ProductDetail', {
      productId: item.product?._id || item.productId,
    });
  };

  const renderHistoryItem = ({ item }) => {
    const product = item.product || item;
    const imageUri = product?.imageCover || product?.images?.[0] || 'https:

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: imageUri }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.name || 'Product'}
          </Text>
          <Text style={styles.viewedDate}>
            Viewed: {item.viewedAt ? new Date(item.viewedAt).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title="Browsing History"
        subtitle={`${history.length} items`}
      />
      {history.length === 0 ? (
        <EmptyState
          icon="🕐"
          title="No browsing history"
          message="Products you view will appear here."
        />
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => item._id || item.id || `history-${index}`}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: theme.spacing.md },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: theme.colors.grey200, marginRight: theme.spacing.md },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  viewedDate: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary },
});

export default BrowserHistoryScreen;
