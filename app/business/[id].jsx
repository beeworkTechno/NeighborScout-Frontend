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
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import api from '../../src/services/api';
import { getImageUrl } from '../../utils/imageUrl';

export default function BusinessDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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

      const reviewResponse = await api.get(`/reviews/${id}`);
      setReviews(reviewResponse.data || []);
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

  const getBusinessImageUrl = () => {
    if (!business?.profilePhoto) {
      return null;
    }

    return getImageUrl(business.profilePhoto);
  };

  const shouldShowBusinessImage = business?.profilePhoto && !imageError;

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
              source={{ uri: getBusinessImageUrl() }}
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

  emptyText: {
    color: 'gray',
    lineHeight: 20,
  },

  backButton: {
    backgroundColor: '#F9B208',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },

  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});