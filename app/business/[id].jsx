import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import api, { API_URL } from '../../src/services/api';
import colors from '../../src/styles/colors';
import ShareButton from '../../components/ShareButton';

export default function BusinessDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reactionLoadingId, setReactionLoadingId] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);

  useEffect(() => {
    if (id) {
      loadBusinessDetails();
    }
  }, [id]);

  const loadBusinessDetails = async () => {
    try {
      setLoading(true);
      setImageError(false);

      const businessResponse = await api.get(`/businesses/${id}`);
      setBusiness(businessResponse.data);

      await loadBusinessReviews();
    } catch (error) {
      console.log('Business Detail Error:', error?.response?.data || error);

      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Could not load business details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessReviews = async () => {
    try {
      const reviewResponse = await api.get(`/reviews/${id}`);
      setReviews(reviewResponse.data || []);
    } catch (error) {
      console.log('Load Business Reviews Error:', error?.response?.data || error);
      setReviews([]);
    }
  };

  const reactToReview = async (review, reaction) => {
    if (!review.canReact) {
      Alert.alert(
        'Not allowed',
        'You cannot react to your own review, or you may need to log in as a personal user.'
      );
      return;
    }

    try {
      setReactionLoadingId(review._id);

      const nextReaction = review.myReaction === reaction ? 'none' : reaction;

      await api.put(`/reviews/${review._id}/reaction`, {
        reaction: nextReaction,
      });

      await loadBusinessReviews();
    } catch (error) {
      console.log('React To Review Error:', error?.response?.data || error);

      Alert.alert(
        'Reaction Error',
        error?.response?.data?.message ||
          'Could not update your reaction. Please try again.'
      );
    } finally {
      setReactionLoadingId(null);
    }
  };

  const reportReview = async (review) => {
    if (!review.canReport) {
      Alert.alert(
        'Not allowed',
        review.reportedByMe
          ? 'You have already reported this review.'
          : 'You can only report reviews posted by other personal users.'
      );
      return;
    }

    const performReport = async () => {
      try {
        setReportLoadingId(review._id);

        await api.post(`/reviews/${review._id}/report`, {
          reason: 'inappropriate',
          details: '',
        });

        await loadBusinessReviews();

        Alert.alert(
          'Reported',
          'Review reported successfully. A super admin will verify it.'
        );
      } catch (error) {
        console.log('Report Review Error:', error?.response?.data || error);

        Alert.alert(
          'Report Error',
          error?.response?.data?.message ||
            'Could not report this review. Please try again.'
        );
      } finally {
        setReportLoadingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Report this review for super admin verification?'
      );

      if (confirmed) {
        await performReport();
      }

      return;
    }

    Alert.alert(
      'Report Review',
      'Report this review for super admin verification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: performReport,
        },
      ]
    );
  };

  const getCategoryIcon = (category = '') => {
    const value = category.toLowerCase();

    if (value.includes('restaurant')) return '🍽️';
    if (value.includes('grocery')) return '🛒';
    if (value.includes('cafe') || value.includes('coffee')) return '☕';
    if (value.includes('pharmacy')) return '💊';
    if (value.includes('hotel')) return '🏨';
    if (value.includes('salon')) return '💇';
    if (value.includes('repair')) return '🔧';
    if (value.includes('furniture')) return '🪑';
    if (value.includes('school')) return '🏫';
    if (value.includes('gym')) return '🏋️';
    if (value.includes('hospital') || value.includes('clinic')) return '🏥';
    if (value.includes('bank')) return '🏦';
    if (value.includes('shop') || value.includes('store')) return '🛍️';

    return '🏢';
  };

  const getRatingText = () => {
    if (!business || (business.reviewCount || 0) === 0) {
      return 'No reviews yet';
    }

    return `${business.averageRating || 0} ⭐`;
  };

  const getBusinessUrl = () => {
    if (business?.businessPageUrl) {
      return business.businessPageUrl;
    }

    if (!id) {
      return '';
    }

    return `http://localhost:8081/business/${id}`;
  };

  const getBusinessPhotoUrl = () => {
    const backendUrl = API_URL.replace('/api', '');
    return `${backendUrl}/api/businesses/${id}/photo`;
  };

  const getAbsoluteReviewImageUrl = (imageUrl) => {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const backendUrl = API_URL.replace('/api', '');
    return `${backendUrl}${imageUrl}`;
  };

  const shouldShowBusinessImage = business?.hasProfilePhoto && !imageError;

  const renderReviewImages = (review) => {
    if (!review.imageUrls || review.imageUrls.length === 0) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.reviewImageRow}
      >
        {review.imageUrls.map((imageUrl, imageIndex) => (
          <Image
            key={`${review._id}-${imageIndex}`}
            source={{ uri: getAbsoluteReviewImageUrl(imageUrl) }}
            style={styles.reviewImage}
          />
        ))}
      </ScrollView>
    );
  };

  const renderReviewReactions = (review) => {
    const isLoading = reactionLoadingId === review._id;

    return (
      <View style={styles.reviewReactionRow}>
        <TouchableOpacity
          style={[
            styles.reviewReactionButton,
            review.myReaction === 'like' && styles.reviewReactionButtonActive,
            (!review.canReact || isLoading) &&
              styles.reviewReactionButtonDisabled,
          ]}
          onPress={() => reactToReview(review, 'like')}
          disabled={!review.canReact || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              review.myReaction === 'like'
                ? 'thumbs-up'
                : 'thumbs-up-outline'
            }
            size={16}
            color={review.myReaction === 'like' ? '#fff' : '#222'}
          />

          <Text
            style={[
              styles.reviewReactionText,
              review.myReaction === 'like' && styles.reviewReactionTextActive,
            ]}
          >
            {review.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reviewReactionButton,
            review.myReaction === 'dislike' &&
              styles.reviewReactionButtonActive,
            (!review.canReact || isLoading) &&
              styles.reviewReactionButtonDisabled,
          ]}
          onPress={() => reactToReview(review, 'dislike')}
          disabled={!review.canReact || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              review.myReaction === 'dislike'
                ? 'thumbs-down'
                : 'thumbs-down-outline'
            }
            size={16}
            color={review.myReaction === 'dislike' ? '#fff' : '#222'}
          />

          <Text
            style={[
              styles.reviewReactionText,
              review.myReaction === 'dislike' &&
                styles.reviewReactionTextActive,
            ]}
          >
            {review.dislikeCount || 0}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator size="small" color="#F9B208" />}
      </View>
    );
  };

  const renderReportButton = (review) => {
    if (!review.canReport && !review.reportedByMe) {
      return null;
    }

    const isLoading = reportLoadingId === review._id;

    return (
      <TouchableOpacity
        style={[
          styles.reportReviewButton,
          review.reportedByMe && styles.reportReviewButtonDisabled,
          isLoading && styles.reportReviewButtonDisabled,
        ]}
        onPress={() => reportReview(review)}
        disabled={review.reportedByMe || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#D32F2F" />
        ) : (
          <Ionicons
            name="flag-outline"
            size={15}
            color={review.reportedByMe ? 'gray' : '#D32F2F'}
          />
        )}

        <Text
          style={[
            styles.reportReviewText,
            review.reportedByMe && styles.reportReviewTextDisabled,
          ]}
        >
          {review.reportedByMe ? 'Reported' : 'Report Review'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator color="#F9B208" size="large" />
        <Text style={styles.loadingText}>Loading business...</Text>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Business not found.</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={26} color="#222" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Business Details</Text>

          <View style={{ width: 26 }} />
        </View>

        <View style={styles.heroCard}>
          {shouldShowBusinessImage ? (
            <Image
              source={{ uri: getBusinessPhotoUrl() }}
              style={styles.businessHeroImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Business Image Load Error:', error?.nativeEvent);
                setImageError(true);
              }}
            />
          ) : (
            <View style={styles.businessIconBox}>
              <Text style={styles.businessIcon}>
                {getCategoryIcon(business.category)}
              </Text>
            </View>
          )}

          <Text style={styles.businessName}>{business.name}</Text>

          <Text style={styles.businessCategory}>
            {business.category || 'Business'}
          </Text>

          <Text style={styles.ratingText}>{getRatingText()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <Text style={styles.descriptionText}>
            {business.description || 'No description available.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#F9B208" />

            <Text style={styles.infoText}>
              {business.address || 'Address not provided'}
            </Text>
          </View>

          {business?.location?.coordinates?.length === 2 && (
            <Text style={styles.coordinateText}>
              Longitude: {business.location.coordinates[0]}
              {'\n'}
              Latitude: {business.location.coordinates[1]}
            </Text>
          )}
        </View>

        {business.phone ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#F9B208" />

              <Text style={styles.infoText}>{business.phone}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Public URL</Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlText}>{getBusinessUrl()}</Text>
          </View>

          <ShareButton
            businessId={id}
            businessName={business.name}
            businessAddress={business.address || 'this business'}
            businessLatitude={business?.location?.coordinates?.[1]}
            businessLongitude={business?.location?.coordinates?.[0]}
            style={styles.shareButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reviews ({business.reviewCount || reviews.length || 0})
          </Text>

          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          ) : (
            reviews.map((review) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>
                    {review.pseudoName || 'Anonymous Neighbor'}
                  </Text>

                  <Text style={styles.reviewRating}>{review.rating} ⭐</Text>
                </View>

                <Text style={styles.reviewComment}>
                  {review.comment || 'No comment provided.'}
                </Text>

                {renderReviewImages(review)}

                {renderReviewReactions(review)}

                {renderReportButton(review)}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  centerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#555',
  },

  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },

  heroCard: {
    margin: 20,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
  },

  businessHeroImage: {
    width: '100%',
    height: 230,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#eee',
  },

  businessIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#F9B208',
  },

  businessIcon: {
    fontSize: 54,
  },

  businessName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },

  businessCategory: {
    color: '#F9B208',
    fontWeight: 'bold',
    marginTop: 6,
    fontSize: 16,
  },

  ratingText: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F9B208',
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },

  descriptionText: {
    color: '#555',
    lineHeight: 22,
    fontSize: 15,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoText: {
    flex: 1,
    color: '#555',
    lineHeight: 21,
  },

  coordinateText: {
    color: 'gray',
    marginTop: 10,
    lineHeight: 20,
  },

  urlBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },

  urlText: {
    color: '#333',
    fontSize: 14,
  },

  reviewCard: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  reviewName: {
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },

  reviewRating: {
    color: '#F9B208',
    fontWeight: 'bold',
  },

  reviewComment: {
    color: '#555',
    lineHeight: 20,
  },

  reviewImageRow: {
    marginTop: 10,
  },

  reviewImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: '#eee',
  },

  reviewReactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },

  reviewReactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  reviewReactionButtonActive: {
    backgroundColor: '#F9B208',
    borderColor: '#F9B208',
  },

  reviewReactionButtonDisabled: {
    opacity: 0.5,
  },

  reviewReactionText: {
    color: '#222',
    fontWeight: 'bold',
  },

  reviewReactionTextActive: {
    color: '#fff',
  },

  reportReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFECEC',
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },

  reportReviewButtonDisabled: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
  },

  reportReviewText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 13,
  },

  reportReviewTextDisabled: {
    color: 'gray',
  },

  emptyText: {
    color: 'gray',
    lineHeight: 20,
  },

  backButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  shareButton: {
    marginTop: 18,
  },

  backButtonText: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});