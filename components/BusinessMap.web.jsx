import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import api from '../src/services/api';
import colors from '../src/styles/colors';

console.log('🌐 Web OpenStreetMap Loaded');

const getCategoryIcon = (category = '') => {
  const value = category.toLowerCase();

  if (value.includes('restaurant')) return '🍽️';
  if (value.includes('grocery')) return '🛒';
  if (value.includes('cafe') || value.includes('coffee')) return '☕';
  if (value.includes('pharmacy')) return '💊';
  if (value.includes('hotel')) return '🏨';
  if (value.includes('salon')) return '💇';
  if (value.includes('repair')) return '🔧';

  return '🏢';
};

const getBusinessCoordinates = (business) => {
  if (
    business?.location?.coordinates &&
    business.location.coordinates.length === 2
  ) {
    return {
      latitude: Number(business.location.coordinates[1]),
      longitude: Number(business.location.coordinates[0]),
    };
  }

  if (business?.latitude && business?.longitude) {
    return {
      latitude: Number(business.latitude),
      longitude: Number(business.longitude),
    };
  }

  return null;
};

export default function BusinessMap() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultLatitude = 65.0121;
  const defaultLongitude = 25.4651;

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/businesses');

      const businessesWithLocation = (res.data || []).filter((business) => {
        return getBusinessCoordinates(business) !== null;
      });

      setBusinesses(businessesWithLocation);
    } catch (error) {
      console.log('Fetch Businesses Error:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const firstBusinessCoordinates =
    businesses.length > 0
      ? getBusinessCoordinates(businesses[0])
      : null;

  const latitude =
    firstBusinessCoordinates?.latitude || defaultLatitude;

  const longitude =
    firstBusinessCoordinates?.longitude || defaultLongitude;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.03
  }%2C${latitude - 0.02}%2C${longitude + 0.03}%2C${
    latitude + 0.02
  }&layer=mapnik&marker=${latitude}%2C${longitude}`;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <iframe
          title="NeighborScout OpenStreetMap"
          src={mapUrl}
          style={{
            width: '100%',
            height: '100%',
            border: '0',
          }}
          loading="lazy"
        />
      </View>

      <ScrollView style={styles.businessList}>
        <Text style={styles.listTitle}>Businesses on Map</Text>

        {businesses.length === 0 ? (
          <Text style={styles.emptyText}>
            No businesses with location found yet.
          </Text>
        ) : (
          businesses.map((business) => {
            const coordinate = getBusinessCoordinates(business);

            return (
              <View key={business._id} style={styles.businessCard}>
                <Text style={styles.businessName}>
                  {getCategoryIcon(business.category)} {business.name}
                </Text>

                <Text style={styles.businessCategory}>
                  {business.category || 'Business'}
                </Text>

                <Text style={styles.businessText}>
                  {business.address || 'No address'}
                </Text>

                <Text style={styles.businessText}>
                  Lat: {coordinate?.latitude}
                </Text>

                <Text style={styles.businessText}>
                  Lng: {coordinate?.longitude}
                </Text>

                <Text style={styles.businessText}>
                  Rating: {business.averageRating || 0} ⭐
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
  },

  mapWrapper: {
    height: 360,
    width: '100%',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  businessList: {
    flex: 1,
    padding: 16,
  },

  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },

  emptyText: {
    color: colors.muted,
  },

  businessCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },

  businessCategory: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },

  businessText: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 2,
  },
});