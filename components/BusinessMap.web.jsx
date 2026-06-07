import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import { useRouter } from "expo-router";

import api from "../src/services/api";
import colors from "../src/styles/colors";

console.log("🌐 Web Leaflet Map Loaded");

const getCategoryIcon = (category = "") => {
  const value = category.toLowerCase();

  if (value.includes("restaurant")) return "🍽️";
  if (value.includes("grocery")) return "🛒";
  if (value.includes("cafe") || value.includes("coffee")) return "☕";
  if (value.includes("pharmacy")) return "💊";
  if (value.includes("hotel")) return "🏨";
  if (value.includes("salon")) return "💇";
  if (value.includes("repair")) return "🔧";
  if (value.includes("furniture")) return "🪑";
  if (value.includes("school")) return "🏫";
  if (value.includes("gym")) return "🏋️";
  if (value.includes("hospital") || value.includes("clinic")) return "🏥";
  if (value.includes("bank")) return "🏦";
  if (value.includes("shop") || value.includes("store")) return "🛍️";

  return "🏢";
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

const getDistanceInMeters = (coord1, coord2) => {
  const earthRadius = 6371000;

  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const getMostPopulatedBusinessCluster = (businesses) => {
  const businessCoordinates = businesses
    .map((business) => {
      const coordinate = getBusinessCoordinates(business);

      if (!coordinate) return null;

      return {
        business,
        coordinate,
      };
    })
    .filter(Boolean);

  if (businessCoordinates.length === 0) {
    return [];
  }

  const radiusMeters = 2000;
  let bestCluster = [];

  businessCoordinates.forEach((item) => {
    const nearbyBusinesses = businessCoordinates.filter((otherItem) => {
      return (
        getDistanceInMeters(item.coordinate, otherItem.coordinate) <=
        radiusMeters
      );
    });

    if (nearbyBusinesses.length > bestCluster.length) {
      bestCluster = nearbyBusinesses;
    }
  });

  return bestCluster;
};

export default function BusinessMap({ selectedBusinessFromList }) {
  const router = useRouter();
  const iframeRef = useRef(null);

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
      if (event?.data?.type === "BUSINESS_MARKER_CLICK") {
        setSelectedBusiness(event.data.business);
      }

      if (
        event?.data?.type === "MAP_CLICK" ||
        event?.data?.type === "CURRENT_LOCATION_CLICK"
      ) {
        setSelectedBusiness(null);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await api.get("/businesses");

      const businessesWithLocation = (res.data || []).filter((business) => {
        return getBusinessCoordinates(business) !== null;
      });

      setBusinesses(businessesWithLocation);
    } catch (error) {
      console.log("Fetch Businesses Error:", error?.response?.data || error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const openBusinessPage = (business) => {
    if (!business?._id) return;

    router.push(`/business/${business._id}`);
  };

  const mapHtml = useMemo(() => {
    const mostPopulatedCluster = getMostPopulatedBusinessCluster(businesses);

    const clusterCoordinates = mostPopulatedCluster
      .map((item) => item.coordinate)
      .filter(Boolean);

    const centerLatitude =
      clusterCoordinates.length > 0
        ? clusterCoordinates.reduce((total, coord) => {
            return total + coord.latitude;
          }, 0) / clusterCoordinates.length
        : defaultLatitude;

    const centerLongitude =
      clusterCoordinates.length > 0
        ? clusterCoordinates.reduce((total, coord) => {
            return total + coord.longitude;
          }, 0) / clusterCoordinates.length
        : defaultLongitude;

    const markerData = businesses
      .map((business) => {
        const coordinate = getBusinessCoordinates(business);

        if (!coordinate) return null;

        return {
          _id: business._id,
          name: business.name || "Business",
          description: business.description || "No description available",
          category: business.category || "Business",
          address: business.address || "Address not provided",
          rating: business.averageRating || 0,
          reviewCount: business.reviewCount || 0,
          icon: getCategoryIcon(business.category),
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
      })
      .filter(Boolean);

    const populatedBusinessIds = mostPopulatedCluster.map((item) => {
      return item.business._id;
    });

    const businessesToFit = markerData.filter((business) => {
      return populatedBusinessIds.includes(business._id);
    });

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

            .marker-wrapper {
              display: flex;
              align-items: center;
              gap: 6px;
              width: max-content;
              transform: translateX(-22px);
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
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }

            .business-marker:hover {
              transform: scale(1.12);
              box-shadow: 0 5px 14px rgba(0, 0, 0, 0.4);
            }

            .marker-name-label {
              display: none;
              background: white;
              color: #222;
              font-size: 13px;
              font-weight: bold;
              padding: 6px 9px;
              border-radius: 12px;
              box-shadow: 0 3px 9px rgba(0, 0, 0, 0.25);
              max-width: 180px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              pointer-events: none;
            }

            body.show-business-labels .marker-name-label {
              display: inline-block;
            }

            .business-tooltip {
              background: #222;
              color: white;
              border: none;
              border-radius: 10px;
              padding: 7px 10px;
              font-weight: bold;
              box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
            }

            .business-tooltip::before {
              border-top-color: #222;
            }

            .location-button {
              position: absolute;
              top: 16px;
              right: 16px;
              z-index: 9999;
              background: white;
              color: #222;
              border: none;
              padding: 12px 16px;
              border-radius: 28px;
              font-size: 14px;
              font-weight: bold;
              cursor: pointer;
              box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
              transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
            }

            .location-button:hover {
              background: #f8f8f8;
              transform: translateY(-1px);
              box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
            }

            .user-location-marker {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #1976D2;
              border: 4px solid white;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
            }
          </style>
        </head>

        <body>
          <div id="map"></div>

          <button class="location-button" onclick="goToCurrentLocation()">
            📍 Current Location
          </button>

          <script>
            const businesses = ${JSON.stringify(markerData)};
            const businessesToFit = ${JSON.stringify(businessesToFit)};

            let userLocationMarker = null;

            const map = L.map('map').setView(
              [${centerLatitude}, ${centerLongitude}],
              14
            );

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            function escapeHtml(value) {
              return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
            }

            function updateBusinessLabels() {
              if (map.getZoom() >= 16) {
                document.body.classList.add('show-business-labels');
              } else {
                document.body.classList.remove('show-business-labels');
              }
            }

            map.on('zoomend', updateBusinessLabels);

            map.on('click', function () {
              window.parent.postMessage(
                {
                  type: 'MAP_CLICK'
                },
                '*'
              );
            });

            businesses.forEach((business) => {
              const safeName = escapeHtml(business.name);

              const icon = L.divIcon({
                html:
                  '<div class="marker-wrapper">' +
                    '<div class="business-marker" title="' + safeName + '">' +
                      business.icon +
                    '</div>' +
                    '<div class="marker-name-label">' + safeName + '</div>' +
                  '</div>',
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

              marker.bindTooltip(safeName, {
                direction: 'top',
                offset: [0, -24],
                opacity: 0.95,
                className: 'business-tooltip',
              });

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

            if (businessesToFit.length > 0) {
              const group = L.featureGroup(
                businessesToFit.map((business) =>
                  L.marker([business.latitude, business.longitude])
                )
              );

              map.fitBounds(group.getBounds().pad(0.3), {
                maxZoom: 16,
              });
            }

            updateBusinessLabels();

            function goToCurrentLocation() {
              window.parent.postMessage(
                {
                  type: 'CURRENT_LOCATION_CLICK'
                },
                '*'
              );

              if (!navigator.geolocation) {
                alert('Geolocation is not supported by this browser.');
                return;
              }

              navigator.geolocation.getCurrentPosition(
                function (position) {
                  const latitude = position.coords.latitude;
                  const longitude = position.coords.longitude;

                  const userIcon = L.divIcon({
                    html: '<div class="user-location-marker"></div>',
                    className: '',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                  });

                  if (userLocationMarker) {
                    userLocationMarker.setLatLng([latitude, longitude]);
                  } else {
                    userLocationMarker = L.marker([latitude, longitude], {
                      icon: userIcon,
                    }).addTo(map);
                  }

                  map.setView([latitude, longitude], 16);
                  updateBusinessLabels();
                },
                function () {
                  alert('Could not get your current location.');
                }
              );
            }

            window.addEventListener('message', function (event) {
              if (event.data?.type === 'FOCUS_BUSINESS') {
                map.setView([event.data.latitude, event.data.longitude], 17);
                updateBusinessLabels();

                const selected = businesses.find(
                  (business) => business._id === event.data.businessId
                );

                if (selected) {
                  window.parent.postMessage(
                    {
                      type: 'BUSINESS_MARKER_CLICK',
                      business: selected,
                    },
                    '*'
                  );
                }
              }
            });
          </script>
        </body>
      </html>
    `;
  }, [businesses]);

  useEffect(() => {
    if (!selectedBusinessFromList || loading) return;

    const coordinate = getBusinessCoordinates(selectedBusinessFromList);

    if (!coordinate) return;

    const selected = {
      _id: selectedBusinessFromList._id,
      name: selectedBusinessFromList.name || "Business",
      description:
        selectedBusinessFromList.description || "No description available",
      category: selectedBusinessFromList.category || "Business",
      address: selectedBusinessFromList.address || "Address not provided",
      rating: selectedBusinessFromList.averageRating || 0,
      reviewCount: selectedBusinessFromList.reviewCount || 0,
      icon: getCategoryIcon(selectedBusinessFromList.category),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };

    setSelectedBusiness(selected);

    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "FOCUS_BUSINESS",
          businessId: selected._id,
          latitude: selected.latitude,
          longitude: selected.longitude,
        },
        "*"
      );
    }, 700);

    return () => clearTimeout(timer);
  }, [selectedBusinessFromList, loading, mapHtml]);

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
        ref={iframeRef}
        title="NeighborScout Business Map"
        srcDoc={mapHtml}
        style={{
          width: "100%",
          height: "100%",
          border: "0",
        }}
      />

      {selectedBusiness && (
        <TouchableOpacity
          style={styles.businessCard}
          activeOpacity={0.9}
          onPress={() => openBusinessPage(selectedBusiness)}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={(event) => {
              event.stopPropagation();
              setSelectedBusiness(null);
            }}
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

          <Text style={styles.businessText}>📍 {selectedBusiness.address}</Text>

          <Text style={styles.businessText}>
            {(selectedBusiness.reviewCount || 0) > 0
              ? `⭐ ${selectedBusiness.rating} rating`
              : "No reviews yet"}
          </Text>

          <Text style={styles.businessText}>
            Reviews: {selectedBusiness.reviewCount || 0}
          </Text>

          <View style={styles.openPageHint}>
            <Text style={styles.openPageHintText}>
              Tap card to open business page
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: colors.bg,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  loadingText: {
    marginTop: 8,
    color: colors.text,
  },

  businessCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: colors.white || "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 5,
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    cursor: "pointer",
  },

  closeButton: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 10,
  },

  closeText: {
    fontSize: 28,
    color: "#555",
    fontWeight: "bold",
  },

  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text || "#222",
    marginBottom: 4,
    paddingRight: 28,
  },

  businessCategory: {
    color: colors.primary || "#F9B208",
    fontWeight: "bold",
    marginBottom: 6,
  },

  businessDescription: {
    color: "#555",
    marginBottom: 6,
    lineHeight: 20,
  },

  businessText: {
    color: "#555",
    marginTop: 3,
  },

  openPageHint: {
    marginTop: 12,
    backgroundColor: colors.primaryDark || "#222",
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },

  openPageHintText: {
    color: colors.white || "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});