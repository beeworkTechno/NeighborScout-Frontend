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
  if (value.includes('furniture')) return '🪑';
  if (value.includes('school')) return '🏫';
  if (value.includes('gym')) return '🏋️';
  if (value.includes('hospital') || value.includes('clinic')) return '🏥';
  if (value.includes('bank')) return '🏦';
  if (value.includes('shop') || value.includes('store')) return '🛍️';

  return '🏢';
};

const getMarkerColor = (category = '') => {
  const value = category.toLowerCase();

  if (value.includes('restaurant')) return '#FF7043';
  if (value.includes('grocery')) return '#43A047';
  if (value.includes('cafe') || value.includes('coffee')) return '#8D6E63';
  if (value.includes('pharmacy')) return '#26A69A';
  if (value.includes('hotel')) return '#5C6BC0';
  if (value.includes('salon')) return '#EC407A';
  if (value.includes('repair')) return '#546E7A';
  if (value.includes('furniture')) return '#F9B208';
  if (value.includes('school')) return '#42A5F5';
  if (value.includes('gym')) return '#AB47BC';
  if (value.includes('hospital') || value.includes('clinic')) return '#EF5350';
  if (value.includes('bank')) return '#66BB6A';
  if (value.includes('shop') || value.includes('store')) return '#FFA726';

  return '#F9B208';
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

        const icon = getCategoryIcon(business.category);
        const markerColor = getMarkerColor(business.category);

        return (
          <Marker
            key={business._id}
            coordinate={coordinate}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.iconMarker,
                {
                  borderColor: markerColor,
                },
              ]}
            >
              <Text style={styles.iconText}>
                {icon}
              </Text>
            </View>

            <View
              style={[
                styles.markerPointer,
                {
                  borderTopColor: markerColor,
                },
              ]}
            />

            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {icon} {business.name}
                </Text>

                <Text
                  style={[
                    styles.calloutCategory,
                    {
                      color: markerColor,
                    },
                  ]}
                >
                  {business.category || 'Business'}
                </Text>

                <Text style={styles.calloutText}>
                  {business.address || 'Address not provided'}
                </Text>

                <Text style={styles.calloutText}>
                  Rating: {business.averageRating || 0} ⭐
                </Text>

                <Text style={styles.calloutText}>
                  Reviews: {business.reviewCount || 0}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  markerPointer: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  iconText: {
    fontSize: 23,
  },

  callout: {
    width: 220,
  },

  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },

  calloutCategory: {
    fontWeight: '700',
    marginBottom: 4,
  },

  calloutText: {
    fontSize: 13,
    marginBottom: 3,
  },
});