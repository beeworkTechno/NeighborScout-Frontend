import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
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

const escapeHtml = (value = '') => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const mapHtml = useMemo(() => {
    const firstBusinessCoordinates =
      businesses.length > 0
        ? getBusinessCoordinates(businesses[0])
        : null;

    const centerLatitude =
      firstBusinessCoordinates?.latitude || defaultLatitude;

    const centerLongitude =
      firstBusinessCoordinates?.longitude || defaultLongitude;

    const markerData = businesses
      .map((business) => {
        const coordinate = getBusinessCoordinates(business);

        if (!coordinate) {
          return null;
        }

        return {
          id: business._id,
          name: business.name || 'Business',
          category: business.category || 'Business',
          address: business.address || 'Address not provided',
          rating: business.averageRating || 0,
          reviews: business.reviewCount || 0,
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
              width: 42px;
              height: 42px;
              border-radius: 50%;
              background: white;
              border: 3px solid #F9B208;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 22px;
              box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
            }

            .popup-title {
              font-weight: 700;
              font-size: 15px;
              margin-bottom: 4px;
            }

            .popup-category {
              color: #F9B208;
              font-weight: 700;
              margin-bottom: 4px;
            }

            .popup-text {
              color: #555;
              margin-bottom: 3px;
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
              attribution:
                '&copy; OpenStreetMap contributors'
            }).addTo(map);

            businesses.forEach((business) => {
              const icon = L.divIcon({
                html: '<div class="business-marker">' + business.icon + '</div>',
                className: '',
                iconSize: [42, 42],
                iconAnchor: [21, 21],
                popupAnchor: [0, -20],
              });

              L.marker([business.latitude, business.longitude], {
                icon,
              })
                .addTo(map)
                .bindPopup(
                  '<div>' +
                    '<div class="popup-title">' +
                      business.icon +
                      ' ' +
                      business.name +
                    '</div>' +
                    '<div class="popup-category">' +
                      business.category +
                    '</div>' +
                    '<div class="popup-text">' +
                      business.address +
                    '</div>' +
                    '<div class="popup-text">Rating: ' +
                      business.rating +
                      ' ⭐</div>' +
                    '<div class="popup-text">Reviews: ' +
                      business.reviews +
                    '</div>' +
                  '</div>'
                );
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
});