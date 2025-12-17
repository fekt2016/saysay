import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTicketDetail, useReplyToTicket } from '../../hooks/useSupport';
import { useAuth } from '../../hooks/useAuth';

import AppButton from '../../components/AppButton';
import LogoIcon from '../../components/header/LogoIcon';

import { theme } from '../../theme';

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params || {};
  const { user } = useAuth();
  const scrollViewRef = useRef(null);

  const { data: ticketData, isLoading, refetch } = useTicketDetail(ticketId);
  const { mutate: replyToTicket, isPending: isReplying } = useReplyToTicket();

  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState([]);

  const ticket = ticketData?.data?.ticket || ticketData?.data || ticketData;
  const messages = ticketData?.data?.messages || ticketData?.messages || ticket?.messages || [];

  if (ticketData && !messages.length) {
    console.log('TicketDetailScreen - ticketData structure:', JSON.stringify(ticketData, null, 2));
    console.log('TicketDetailScreen - extracted messages:', messages);
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: ticket?.ticketNumber || 'Ticket Details',
    });
  }, [navigation, ticket?.ticketNumber]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return theme.colors.primary;
      case 'in_progress':
        return theme.colors.blue || theme.colors.info;
      case 'awaiting_user':
        return theme.colors.warning || theme.colors.orange;
      case 'resolved':
        return theme.colors.success || theme.colors.green;
      case 'closed':
        return theme.colors.grey600 || theme.colors.textSecondary;
      default:
        return theme.colors.grey500;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return theme.colors.error;
      case 'high':
        return theme.colors.warning || theme.colors.orange;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.grey500;
      default:
        return theme.colors.grey500;
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to attach images to your reply.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      const newAttachment = {
        uri: asset.uri,
        name: asset.fileName || `attachment-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      };

      if (attachments.length < 5) {
        setAttachments((prev) => [...prev, newAttachment]);
      } else {
        Alert.alert('Limit Reached', 'You can attach up to 5 images');
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReply = () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    replyToTicket(
      {
        ticketId,
        replyData: {
          message: replyMessage,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      },
      {
        onSuccess: () => {
          setReplyMessage('');
          setAttachments([]);
          refetch();
          Alert.alert('Success', 'Your reply has been sent');
        },
        onError: (error) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message 
            'Failed to send reply. Please try again.';
          Alert.alert('Error', errorMessage);
        },
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="close-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.emptyTitle}>Ticket not found</Text>
          <Text style={styles.emptyText}>This ticket could not be loaded</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(ticket.status);
  const priorityColor = getPriorityColor(ticket.priority);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>

            <View style={styles.ticketMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {ticket.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
                  </Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Priority</Text>
                <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
                  <Text style={[styles.badgeText, { color: priorityColor }]}>
                    {ticket.priority?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Department</Text>
                <Text style={styles.metaValue}>{ticket.department || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Created</Text>
                <Text style={styles.metaValue}>{formatDate(ticket.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            {messages.length === 0 ? (
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>No messages yet</Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((message, index) => {

                  const isUserMessage =
                    message.senderRole === 'buyer' 
                    message.senderId === user?._id 
                    message.sender?._id === user?._id;
                  const isAdmin = message.senderRole === 'admin';

                  return (
                    <View
                      key={message._id || index}
                      style={[
                        styles.messageContainer,
                        isUserMessage ? styles.userMessageContainer : styles.supportMessageContainer,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isUserMessage ? styles.userMessageBubble : styles.supportMessageBubble,
                        ]}
                      >
                        {!isUserMessage && (
                          <View style={styles.messageHeader}>
                            <Ionicons
                              name={isAdmin ? 'shield-checkmark' : 'headset'}
                              size={16}
                              color={isAdmin ? theme.colors.primary : theme.colors.textSecondary}
                            />
                            <Text style={styles.messageSender}>
                              {isAdmin ? 'Admin' : message.senderName || 'Support'}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.messageText,
                            isUserMessage ? styles.userMessageText : styles.supportMessageText,
                          ]}
                        >
                          {message.message || message.text}
                        </Text>
                        {message.attachments && message.attachments.length > 0 && (
                          <View style={styles.messageAttachments}>
                            {message.attachments.map((attachment, idx) => (
                              <Image
                                key={idx}
                                source={{ uri: attachment.url || attachment.path }}
                                style={styles.messageAttachmentImage}
                                resizeMode="cover"
                              />
                            ))}
                          </View>
                        )}
                        <Text
                          style={[
                            styles.messageTime,
                            isUserMessage ? styles.userMessageTime : styles.supportMessageTime,
                          ]}
                        >
                          {formatDate(message.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.replySection}>
            <Text style={styles.sectionTitle}>Reply to Ticket</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply..."
              placeholderTextColor={theme.colors.grey400}
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
              numberOfLines={4}
            />

            {attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                {attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                    <TouchableOpacity
                      style={styles.removeAttachmentButton}
                      onPress={() => removeAttachment(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickImage}
                disabled={attachments.length >= 5 || isReplying}
              >
                <Ionicons name="attach-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.attachButtonText}>
                  {attachments.length >= 5 ? 'Limit Reached' : 'Attach Image'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.submitButtonWrapper}>
              <AppButton
                title="Send Reply"
                onPress={handleReply}
                loading={isReplying}
                disabled={!replyMessage.trim() || isReplying}
                fullWidth
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  ticketHeader: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  ticketTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  ticketNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  ticketMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    minWidth: 100,
  },
  metaLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs / 2,
  },
  metaValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },

  messagesSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  emptyMessages: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  messagesList: {
    gap: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  supportMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  supportMessageBubble: {
    backgroundColor: theme.colors.grey200,
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  messageSender: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  supportMessageText: {
    color: theme.colors.textPrimary,
  },
  messageAttachments: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  messageAttachmentImage: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.sm,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  userMessageTime: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  supportMessageTime: {
    color: theme.colors.textSecondary,
  },

  replySection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
  },
  replyActions: {
    marginBottom: theme.spacing.md,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  attachButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  attachmentItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },
  submitButtonWrapper: {
    marginTop: theme.spacing.md,
  },
});

export default TicketDetailScreen;


