import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import MapView, {
  Marker,
  Callout,
  UrlTile,
} from 'react-native-maps';

import * as Location from 'expo-location';
import api from '../src/services/api';

console.log('🔥 Native Map Loaded');

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
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      await getUserLocation();
      await fetchBusinesses();
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission was denied.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.log('Location Error:', error);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/businesses');

      const businessesWithLocation = (res.data || []).filter((business) => {
        return getBusinessCoordinates(business) !== null;
      });

      setBusinesses(businessesWithLocation);
    } catch (error) {
      console.log('Fetch Businesses Error:', error?.response?.data || error);
      Alert.alert('Error', 'Could not load businesses.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLocation?.latitude || 65.0121,
        longitude: userLocation?.longitude || 25.4651,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation
    >
      <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userLocation && (
        <Marker
          coordinate={userLocation}
          title="You"
          pinColor="blue"
        />
      )}

      {businesses.map((business) => {
        const coordinate = getBusinessCoordinates(business);

        if (!coordinate) return null;

        return (
          <Marker
            key={business._id}
            coordinate={coordinate}
          >
            <View style={styles.iconMarker}>
              <Text style={styles.iconText}>
                {getCategoryIcon(business.category)}
              </Text>
            </View>

            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {business.name}
                </Text>

                <Text style={styles.calloutCategory}>
                  {business.category || 'Business'}
                </Text>

                <Text style={styles.calloutText}>
                  {business.address || 'No address'}
                </Text>

                <Text style={styles.calloutText}>
                  Rating: {business.averageRating || 0} ⭐
                </Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderText: {
    marginTop: 8,
  },

  iconMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 7,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },

  iconText: {
    fontSize: 22,
  },

  callout: {
    width: 210,
  },

  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },

  calloutCategory: {
    fontWeight: '600',
    marginBottom: 4,
  },

  calloutText: {
    fontSize: 13,
    marginBottom: 3,
  },
});