import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useSupportTickets } from '../../hooks/useSupportTickets';

const TicketsListScreen = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const { data: ticketsData, isLoading } = useSupportTickets({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  const tickets = useMemo(() => {
    if (!ticketsData?.data) return [];
    return ticketsData.data.tickets || ticketsData.data || [];
  }, [ticketsData]);

  const handleTicketPress = (ticket) => {
    navigation.navigate('TicketDetail', {
      ticketId: ticket._id || ticket.id,
    });
  };

  const handleLoadMore = () => {
    if (tickets.length > 0 && tickets.length % 20 === 0) {
      setPage((prev) => prev + 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'pending':
        return theme.colors.primary;
      case 'resolved':
      case 'closed':
        return theme.colors.green700;
      case 'in_progress':
        return theme.colors.blue700;
      default:
        return theme.colors.grey500;
    }
  };

  const renderTicket = ({ item }) => {
    const status = item.status || 'open';
    const statusColor = getStatusColor(status);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => handleTicketPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketContent}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketSubject} numberOfLines={1}>
              {item.subject || item.title || 'Support Ticket'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.ticketMessage} numberOfLines={2}>
            {item.message || item.description || 'No description'}
          </Text>

          <View style={styles.ticketFooter}>
            <Text style={styles.ticketDate}>
              {new Date(item.createdAt || item.date).toLocaleDateString()}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title="Support Tickets"
        subtitle={`${ticketsData?.data?.total || tickets.length} tickets`}
        actionLabel="New Ticket"
        onActionPress={() => navigation.navigate('SupportChat')}
      />

      <View style={styles.filterContainer}>
        {['', 'open', 'in_progress', 'resolved'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
              ]}
            >
              {status || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item._id || item.id}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No tickets found"
              message={statusFilter ? "No tickets with this status" : "You haven't created any support tickets yet"}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.loadMore}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: theme.colors.grey200,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  ticketCard: {
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
    alignItems: 'center',
  },
  ticketContent: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  ticketSubject: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm || 6,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  ticketMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  unreadText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  arrow: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  loadMore: {
    marginVertical: theme.spacing.md,
  },
});

export default TicketsListScreen;


