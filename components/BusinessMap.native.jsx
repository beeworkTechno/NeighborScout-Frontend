import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';

import MapView, { Marker, UrlTile } from 'react-native-maps';

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

const getPopularBusinesses = (businesses) => {
  const reviewedBusinesses = businesses
    .filter((business) => (business.reviewCount || 0) > 0)
    .sort((a, b) => {
      if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }

      return (b.averageRating || 0) - (a.averageRating || 0);
    })
    .slice(0, 5);

  return reviewedBusinesses.length > 0
    ? reviewedBusinesses
    : businesses.slice(0, 5);
};

const getRegionForBusinesses = (businesses, fallbackLocation) => {
  const popularBusinesses = getPopularBusinesses(businesses);

  const coordinates = popularBusinesses
    .map((business) => getBusinessCoordinates(business))
    .filter(Boolean);

  if (coordinates.length === 0) {
    return {
      latitude: fallbackLocation?.latitude || 65.0121,
      longitude: fallbackLocation?.longitude || 25.4651,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const latitudes = coordinates.map((coord) => coord.latitude);
  const longitudes = coordinates.map((coord) => coord.longitude);

  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const centerLongitude = (minLongitude + maxLongitude) / 2;

  const latitudeDelta = Math.max((maxLatitude - minLatitude) * 1.6, 0.03);
  const longitudeDelta = Math.max((maxLongitude - minLongitude) * 1.6, 0.03);

  return {
    latitude: centerLatitude,
    longitude: centerLongitude,
    latitudeDelta,
    longitudeDelta,
  };
};

const getRegionForSelectedBusiness = (business) => {
  const coordinate = getBusinessCoordinates(business);

  if (!coordinate) return null;

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
};

export default function BusinessMap({ selectedBusinessFromList = null }) {
  const mapRef = useRef(null);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (!selectedBusinessFromList) return;

    const coordinate = getBusinessCoordinates(selectedBusinessFromList);

    if (!coordinate) return;

    const selectedWithIcon = {
      ...selectedBusinessFromList,
      icon: getCategoryIcon(selectedBusinessFromList.category),
    };

    setSelectedBusiness(selectedWithIcon);

    setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );
    }, 300);
  }, [selectedBusinessFromList, businesses]);

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

  const closeBusinessCard = () => {
    setSelectedBusiness(null);
  };

  const initialRegion =
    selectedBusinessFromList && getRegionForSelectedBusiness(selectedBusinessFromList)
      ? getRegionForSelectedBusiness(selectedBusinessFromList)
      : getRegionForBusinesses(businesses, userLocation);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={closeBusinessCard}
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
              onPress={(event) => {
                event.stopPropagation();

                setSelectedBusiness({
                  ...business,
                  icon,
                });

                mapRef.current?.animateToRegion(
                  {
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  500
                );
              }}
            >
              <View
                style={[
                  styles.iconMarker,
                  {
                    borderColor: markerColor,
                  },
                ]}
              >
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              <View
                style={[
                  styles.markerPointer,
                  {
                    borderTopColor: markerColor,
                  },
                ]}
              />
            </Marker>
          );
        })}
      </MapView>

      {selectedBusiness && (
        <View style={styles.businessCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeBusinessCard}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.businessName}>
            {selectedBusiness.icon || getCategoryIcon(selectedBusiness.category)}{' '}
            {selectedBusiness.name}
          </Text>

          <Text style={styles.businessCategory}>
            {selectedBusiness.category || 'Business'}
          </Text>

          <Text style={styles.businessDescription}>
            {selectedBusiness.description || 'No description available'}
          </Text>

          <Text style={styles.businessText}>
            📍 {selectedBusiness.address || 'Address not provided'}
          </Text>

          <Text style={styles.businessText}>
            {(selectedBusiness.reviewCount || 0) > 0
              ? `⭐ ${selectedBusiness.averageRating || selectedBusiness.rating || 0} rating`
              : 'No reviews yet'}
          </Text>

          <Text style={styles.businessText}>
            Reviews: {selectedBusiness.reviewCount || 0}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

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

  businessCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
  },

  closeText: {
    fontSize: 28,
    color: '#555',
    fontWeight: 'bold',
  },

  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    paddingRight: 28,
  },

  businessCategory: {
    color: '#F9B208',
    fontWeight: 'bold',
    marginBottom: 6,
  },

  businessDescription: {
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },

  businessText: {
    color: '#555',
    marginTop: 3,
  },
});