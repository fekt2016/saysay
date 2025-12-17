import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SellerCard from '../../components/SellerCard';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useFollowedSellers } from '../../hooks/useFollow';
import { theme } from '../../theme';

const FollowScreen = () => {
  const navigation = useNavigation();
  const { data: sellersData, isLoading } = useFollowedSellers();

  const sellers = useMemo(() => {
    if (!sellersData?.data?.sellers && !sellersData?.data?.data) return [];
    return sellersData.data.sellers || sellersData.data.data || [];
  }, [sellersData]);

  const handleSellerPress = (seller) => {
    navigation.navigate('Seller', {
      sellerId: seller._id || seller.id,
    });
  };

  const renderSeller = ({ item }) => (
    <SellerCard
      seller={item}
      onPress={() => handleSellerPress(item)}
      isFollowing={true}
    />
  );

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
        title="Followed Sellers"
        subtitle={`${sellers.length} sellers`}
      />
      {sellers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Not following anyone"
          message="Follow sellers to see their latest products and updates."
        />
      ) : (
        <FlatList
          data={sellers}
          renderItem={renderSeller}
          keyExtractor={(item) => item._id || item.id}
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
});

export default FollowScreen;
