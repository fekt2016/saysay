import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotifications, useMarkAsRead } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';

import { theme } from '../../theme';

const NotificationsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated, user } = useAuth();

  
  const { data: notificationsData, isLoading, error, refetch } = useNotifications({
    limit: 50,
    sort: '-createdAt',
  });

  const markAsRead = useMarkAsRead();

  
  const notifications = useMemo(() => {
    if (!notificationsData?.data?.notifications) return [];
    return notificationsData.data.notifications || [];
  }, [notificationsData]);

  
  const hasAuthError = error?.response?.status === 401;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('[NotificationsScreen] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return '📦';
      case 'payment':
        return '💳';
      case 'delivery':
        return '🚚';
      case 'promotion':
        return '🎉';
      case 'account':
        return '👤';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  
  const handleNotificationPress = async (item) => {
    try {
      
      if (!item.read && !item.isRead) {
        try {
          await markAsRead.mutateAsync(item._id || item.id);
        } catch (error) {
          console.error('[NotificationsScreen] Error marking notification as read:', error);
        }
      }

      
      const link = item.link || item.actionUrl;
      
      if (!link) {
        console.log('[NotificationsScreen] No link found for notification:', item._id);
        return;
      }

      console.log('[NotificationsScreen] Handling notification link:', link);

      
      

      
      
      const urlPath = link.startsWith('/') ? link : `/${link}`;
      const pathParts = urlPath.split('/').filter(Boolean);

      
      if (pathParts[0] === 'orders' && pathParts[1]) {
        
        const orderId = pathParts[1];
        navigation.navigate('OrderDetail', { orderId });
      } else if (pathParts[0] === 'support' && pathParts[1]) {
        
        const ticketId = pathParts[1];
        navigation.navigate('TicketDetail', { ticketId });
      } else if (pathParts[0] === 'refunds' && pathParts[1]) {
        
        const refundId = pathParts[1];
        
        navigation.navigate('Orders');
      } else if (item.metadata?.orderId) {
        
        navigation.navigate('OrderDetail', { orderId: item.metadata.orderId });
      } else if (item.type === 'order' && item.metadata?.orderId) {
        
        navigation.navigate('OrderDetail', { orderId: item.metadata.orderId });
      } else if (item.type === 'support' && item.metadata?.ticketId) {
        
        navigation.navigate('TicketDetail', { ticketId: item.metadata.ticketId });
      } else if (link.startsWith('OrderDetail') || link === 'OrderDetail') {
        
        const orderId = item.metadata?.orderId || pathParts[1];
        if (orderId) {
          navigation.navigate('OrderDetail', { orderId });
        } else {
          navigation.navigate('Orders');
        }
      } else if (link.startsWith('Orders') || link === 'Orders') {
        
        navigation.navigate('Orders');
      } else if (link.startsWith('TicketDetail') || link === 'TicketDetail') {
        
        const ticketId = item.metadata?.ticketId || pathParts[1];
        if (ticketId) {
          navigation.navigate('TicketDetail', { ticketId });
        } else {
          navigation.navigate('TicketsList');
        }
      } else {
        
        
        try {
          navigation.navigate(link);
        } catch (error) {
          console.warn('[NotificationsScreen] Failed to navigate to:', link, error);
          
          if (item.type === 'order' || item.type === 'delivery') {
            navigation.navigate('Orders');
          }
        }
      }
    } catch (error) {
      console.error('[NotificationsScreen] Error handling notification press:', error);
      
      if (item.type === 'order' || item.type === 'delivery') {
        navigation.navigate('Orders');
      }
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          {item.title || 'Notification'}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message || item.body || ''}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTime(item.createdAt)}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  
  if (hasAuthError && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load notifications. Please try again.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item, index) => item._id || item.id || `notification-${index}`}
        contentContainerStyle={styles.notificationList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  markAllText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  notificationList: {
    paddingBottom: theme.spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  notificationUnread: {
    backgroundColor: theme.colors.primary + '05',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
