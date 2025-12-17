import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useProductReviews, useCreateReview } from '../../hooks/useReviews';

const ReviewScreen = ({ navigation }) => {
  const route = useRoute();
  const productId = route?.params?.productId || route?.params?.id;
  const productName = route?.params?.productName;

  const [page, setPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    title: '',
  });

  const { data: reviewsData, isLoading: isReviewsLoading, refetch } = useProductReviews(
    productId,
    { page, limit: 20 }
  );
  const createReview = useCreateReview();

  const reviews = reviewsData?.data?.reviews || reviewsData?.data || [];
  const ratingSummary = reviewsData?.data?.ratingSummary || {};
  const averageRating = ratingSummary.average || 0;
  const totalReviews = ratingSummary.total || reviews.length;

  const handleLoadMore = () => {
    if (reviews.length > 0 && reviews.length % 20 === 0) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSubmitReview = () => {
    createReview.mutate(
      { productId, reviewData: reviewForm },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewForm({ rating: 5, comment: '', title: '' });
          refetch();
        },
      }
    );
  };

  const renderReviewItem = ({ item }) => {
    const review = item;
    const user = review.user || review.buyer || {};
    const userName = user.name || user.username || 'Anonymous';
    const userAvatar = user.avatar || user.image;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Text style={styles.userAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <Text key={i} style={styles.star}>
                    {i < (review.rating || 0) ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt || review.date).toLocaleDateString()}
          </Text>
        </View>

        {review.title && (
          <Text style={styles.reviewTitle}>{review.title}</Text>
        )}

        <Text style={styles.reviewComment}>{review.comment || review.review}</Text>

        {review.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Purchase</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRatingSummary = () => {
    const ratingDistribution = ratingSummary.distribution || {};

    return (
      <View style={styles.ratingSummary}>
        <View style={styles.ratingOverview}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.star}>
                {i < Math.round(averageRating) ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
          <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
        </View>

        <View style={styles.ratingBreakdown}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <View key={star} style={styles.ratingBar}>
                <Text style={styles.ratingLabel}>{star}⭐</Text>
                <View style={styles.ratingBarContainer}>
                  <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.ratingCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title={productName ? `Reviews for ${productName}` : 'Product Reviews'}
        subtitle={`${totalReviews} total reviews`}
        actionLabel="Write Review"
        onActionPress={() => setShowReviewModal(true)}
      />

      {isReviewsLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          ListHeaderComponent={totalReviews > 0 ? renderRatingSummary : null}
          ListEmptyComponent={
            <EmptyState
              icon="⭐"
              title="No reviews yet"
              message="Be the first to review this product!"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            isReviewsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadMore} />
            ) : null
          }
        />
      )}

      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.ratingSelector}>
                <Text style={styles.ratingLabel}>Rating</Text>
                <View style={styles.starSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewForm({ ...reviewForm, rating: star })}
                    >
                      <Text style={styles.starSelectorStar}>
                        {star <= reviewForm.rating ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Review title"
                  value={reviewForm.title}
                  onChangeText={(text) => setReviewForm({ ...reviewForm, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Comment</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Share your experience..."
                  multiline
                  numberOfLines={4}
                  value={reviewForm.comment}
                  onChangeText={(text) => setReviewForm({ ...reviewForm, comment: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, createReview.isPending && styles.submitButtonDisabled]}
                onPress={handleSubmitReview}
                disabled={createReview.isPending || !reviewForm.comment.trim()}
              >
                {createReview.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  ratingSummary: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.md,
  },
  ratingOverview: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  averageRating: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  star: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  totalReviews: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  ratingBreakdown: {
    gap: theme.spacing.xs,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingLabel: {
    fontSize: theme.typography.fontSize.sm,
    width: 30,
    color: theme.colors.text,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.grey200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  ratingCount: {
    fontSize: theme.typography.fontSize.sm,
    width: 30,
    textAlign: 'right',
    color: theme.colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  userAvatarText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  reviewDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  reviewTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reviewComment: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    marginBottom: theme.spacing.xs,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.green100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm || 6,
    marginTop: theme.spacing.xs,
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.green700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadMore: {
    marginVertical: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.textSecondary,
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  ratingSelector: {
    marginBottom: theme.spacing.md,
  },
  starSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  starSelectorStar: {
    fontSize: 32,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm || 6,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    backgroundColor: theme.colors.white,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md || 8,
    backgroundColor: theme.colors.grey200,
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md || 8,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default ReviewScreen;


