import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { useWalletBalance, useWalletTransactions } from '../../hooks/useWallet';

const CreditBalanceScreen = () => {
  const navigation = useNavigation();
  const [page, setPage] = useState(1);
  const { data: balanceData, isLoading: isBalanceLoading, error: balanceError, refetch: refetchBalance } = useWalletBalance();
  const { data: transactionsData, isLoading: isTransactionsLoading } = useWalletTransactions({
    page,
    limit: 20,
  });

  const balance = balanceData?.data?.wallet?.availableBalance ?? 
                  balanceData?.data?.wallet?.balance ?? 
                  balanceData?.data?.balance ?? 
                  balanceData?.balance ?? 
                  0;

  useFocusEffect(
    React.useCallback(() => {
      console.log('[CreditBalanceScreen] Screen focused, refetching balance...');
      refetchBalance();
    }, [refetchBalance])
  );

  if (__DEV__ && balanceData) {
    console.log('[CreditBalanceScreen] Balance data:', JSON.stringify(balanceData, null, 2));
    console.log('[CreditBalanceScreen] Extracted balance:', balance);
  }

  if (__DEV__ && balanceError) {
    console.error('[CreditBalanceScreen] Balance error:', balanceError);
  }
  const transactions = useMemo(() => {
    if (!transactionsData?.data) return [];
    return transactionsData.data.transactions || transactionsData.data || [];
  }, [transactionsData]);

  const handleLoadMore = () => {
    if (transactions.length > 0 && transactions.length % 20 === 0) {
      setPage((prev) => prev + 1);
    }
  };

  const renderTransaction = ({ item }) => {
    const amount = item.amount || 0;
    const type = item.type || item.transactionType || 'credit';
    const isCredit = type === 'credit' || type === 'topup' || amount > 0;
    const date = new Date(item.createdAt || item.date);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>
              {item.description || item.narration || (isCredit ? 'Top-up' : 'Debit')}
            </Text>
            <Text
              style={[
                styles.transactionAmount,
                isCredit ? styles.creditAmount : styles.debitAmount,
              ]}
            >
              {isCredit ? '+' : '-'}₵{Math.abs(amount).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.transactionDate}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </Text>
          {item.reference && (
            <Text style={styles.transactionReference}>Ref: {item.reference}</Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'completed' && styles.statusBadgeSuccess,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'completed' && styles.statusTextSuccess,
            ]}
          >
            {item.status || 'completed'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title="Wallet Balance"
        actionLabel="Add Money"
        onActionPress={() => navigation.navigate('AddMoney')}
      />

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary600]}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>Available Balance</Text>
        {isBalanceLoading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <Text style={styles.balanceAmount}>₵{balance.toFixed(2)}</Text>
        )}
      </LinearGradient>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {isTransactionsLoading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => item._id || item.id || index.toString()}
            ListEmptyComponent={
              <EmptyState
                icon="💳"
                title="No transactions yet"
                message="Your transaction history will appear here"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              isTransactionsLoading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={styles.loadMore}
                />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  balanceCard: {
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.md || 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  transactionsSection: {
    flex: 1,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  transactionType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  transactionAmount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  creditAmount: {
    color: theme.colors.green700,
  },
  debitAmount: {
    color: theme.colors.error,
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  transactionReference: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm || 6,
    backgroundColor: theme.colors.grey200,
    alignSelf: 'flex-start',
    marginLeft: theme.spacing.sm,
  },
  statusBadgeSuccess: {
    backgroundColor: theme.colors.green100,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  statusTextSuccess: {
    color: theme.colors.green700,
  },
  loadMore: {
    marginVertical: theme.spacing.md,
  },
});

export default CreditBalanceScreen;


