import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import api from '../src/services/api';
import colors from '../src/styles/colors';

console.log('🌐 Web Leaflet Map Loaded');

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
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultLatitude = 65.0121;
  const defaultLongitude = 25.4651;

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event?.data?.type === 'BUSINESS_MARKER_CLICK') {
        setSelectedBusiness(event.data.business);
      }

      if (event?.data?.type === 'MAP_CLICK') {
        setSelectedBusiness(null);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
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
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const mapHtml = useMemo(() => {
    const firstBusinessCoordinates =
      businesses.length > 0 ? getBusinessCoordinates(businesses[0]) : null;

    const centerLatitude =
      firstBusinessCoordinates?.latitude || defaultLatitude;

    const centerLongitude =
      firstBusinessCoordinates?.longitude || defaultLongitude;

    const markerData = businesses
      .map((business) => {
        const coordinate = getBusinessCoordinates(business);

        if (!coordinate) return null;

        return {
          _id: business._id,
          name: business.name || 'Business',
          description: business.description || 'No description available',
          category: business.category || 'Business',
          address: business.address || 'Address not provided',
          rating: business.averageRating || 0,
          reviewCount: business.reviewCount || 0,
          icon: getCategoryIcon(business.category),
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
      })
      .filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          />

          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <style>
            html,
            body,
            #map {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
            }

            .business-marker {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: white;
              border: 3px solid #F9B208;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 23px;
              box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
              cursor: pointer;
            }
          </style>
        </head>

        <body>
          <div id="map"></div>

          <script>
            const businesses = ${JSON.stringify(markerData)};

            const map = L.map('map').setView(
              [${centerLatitude}, ${centerLongitude}],
              13
            );

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            map.on('click', function () {
              window.parent.postMessage(
                {
                  type: 'MAP_CLICK'
                },
                '*'
              );
            });

            businesses.forEach((business) => {
              const icon = L.divIcon({
                html: '<div class="business-marker">' + business.icon + '</div>',
                className: '',
                iconSize: [44, 44],
                iconAnchor: [22, 22],
              });

              const marker = L.marker(
                [business.latitude, business.longitude],
                {
                  icon: icon,
                }
              ).addTo(map);

              marker.on('click', function (event) {
                L.DomEvent.stopPropagation(event);

                window.parent.postMessage(
                  {
                    type: 'BUSINESS_MARKER_CLICK',
                    business: business,
                  },
                  '*'
                );
              });
            });

            if (businesses.length > 0) {
              const group = L.featureGroup(
                businesses.map((business) =>
                  L.marker([business.latitude, business.longitude])
                )
              );

              map.fitBounds(group.getBounds().pad(0.2));
            }
          </script>
        </body>
      </html>
    `;
  }, [businesses]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <iframe
        title="NeighborScout Business Map"
        srcDoc={mapHtml}
        style={{
          width: '100%',
          height: '100%',
          border: '0',
        }}
      />

      {selectedBusiness && (
        <View style={styles.businessCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedBusiness(null)}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.businessName}>
            {selectedBusiness.icon} {selectedBusiness.name}
          </Text>

          <Text style={styles.businessCategory}>
            {selectedBusiness.category}
          </Text>

          <Text style={styles.businessDescription}>
            {selectedBusiness.description}
          </Text>

          <Text style={styles.businessText}>
            📍 {selectedBusiness.address}
          </Text>

          <Text style={styles.businessText}>
            {(selectedBusiness.reviewCount || 0) > 0
              ? `⭐ ${selectedBusiness.rating} rating`
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
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },

  loadingText: {
    marginTop: 8,
    color: colors.text,
  },

  businessCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: colors.white || '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 5,
    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
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
    color: colors.text || '#222',
    marginBottom: 4,
    paddingRight: 28,
  },

  businessCategory: {
    color: colors.primary || '#F9B208',
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