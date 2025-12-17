import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useNotifications } from '../../hooks/useNotification';
import { theme } from '../../theme';

const BuyerNotificationsScreen = () => {
  const { data: notificationsData, isLoading } = useNotifications({ type: 'buyer' });

  const notifications = useMemo(() => {
    if (!notificationsData?.data?.notifications && !notificationsData?.data?.data) return [];
    return notificationsData.data.notifications || notificationsData.data.data || [];
  }, [notificationsData]);

  const renderNotification = ({ item }) => {
    return (
      <TouchableOpacity style={styles.notificationCard} activeOpacity={0.7}>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title || 'Notification'}</Text>
          <Text style={styles.notificationMessage}>{item.message || item.body}</Text>
          <Text style={styles.notificationDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
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
        title="Notifications"
        subtitle={`${notifications.length} ${notifications.length === 1 ? 'notification' : 'notifications'}`}
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications"
          message="You're all caught up!"
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => item._id || item.id || `notification-${index}`}
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
  notificationCard: {
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
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.xs },
  notificationMessage: { fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal },
  notificationDate: { fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary, marginLeft: theme.spacing.sm, marginTop: theme.spacing.xs },
});

export default BuyerNotificationsScreen;


