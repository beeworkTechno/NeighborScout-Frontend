import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";

import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import api from "../src/services/api";

console.log("🔥 Native Map Loaded");

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

const getMarkerColor = (category = "") => {
  const value = category.toLowerCase();

  if (value.includes("restaurant")) return "#FF7043";
  if (value.includes("grocery")) return "#43A047";
  if (value.includes("cafe") || value.includes("coffee")) return "#8D6E63";
  if (value.includes("pharmacy")) return "#26A69A";
  if (value.includes("hotel")) return "#5C6BC0";
  if (value.includes("salon")) return "#EC407A";
  if (value.includes("repair")) return "#546E7A";
  if (value.includes("furniture")) return "#F9B208";
  if (value.includes("school")) return "#42A5F5";
  if (value.includes("gym")) return "#AB47BC";
  if (value.includes("hospital") || value.includes("clinic")) return "#EF5350";
  if (value.includes("bank")) return "#66BB6A";
  if (value.includes("shop") || value.includes("store")) return "#FFA726";

  return "#F9B208";
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

const getRegionForBusinesses = (businesses, fallbackLocation) => {
  const mostPopulatedCluster = getMostPopulatedBusinessCluster(businesses);

  const coordinates = mostPopulatedCluster
    .map((item) => item.coordinate)
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

  const latitudeDelta = Math.max((maxLatitude - minLatitude) * 2.2, 0.015);
  const longitudeDelta = Math.max((maxLongitude - minLongitude) * 2.2, 0.015);

  return {
    latitude: centerLatitude,
    longitude: centerLongitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export default function BusinessMap({
  selectedBusinessFromList,
  searchText = "",
  selectedCategory = "All",
}) {
  const router = useRouter();
  const mapRef = useRef(null);

  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  const filteredBusinesses = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase();
    const categoryValue = selectedCategory.trim().toLowerCase();

    return businesses.filter((business) => {
      const name = business.name?.toLowerCase() || "";
      const description = business.description?.toLowerCase() || "";
      const category = business.category?.toLowerCase() || "";
      const address = business.address?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        description.includes(searchValue) ||
        category.includes(searchValue) ||
        address.includes(searchValue);

      const matchesCategory =
        selectedCategory === "All" || category.includes(categoryValue);

      return matchesSearch && matchesCategory;
    });
  }, [businesses, searchText, selectedCategory]);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    setSelectedBusiness(null);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        getRegionForBusinesses(filteredBusinesses, userLocation),
        500
      );
    }
  }, [searchText, selectedCategory, filteredBusinesses.length]);

  useEffect(() => {
    if (!selectedBusinessFromList || !mapRef.current) return;

    const coordinate = getBusinessCoordinates(selectedBusinessFromList);

    if (!coordinate) return;

    const icon = getCategoryIcon(selectedBusinessFromList.category);

    setSelectedBusiness({
      ...selectedBusinessFromList,
      icon,
    });

    mapRef.current.animateToRegion(
      {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700
    );
  }, [selectedBusinessFromList]);

  const loadMapData = async () => {
    try {
      await getUserLocation(false);
      await fetchBusinesses();
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async (shouldMoveToLocation = true) => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission was denied.");
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const currentLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(currentLocation);

      if (shouldMoveToLocation && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          700
        );
      }

      return currentLocation;
    } catch (error) {
      console.log("Location Error:", error);
      Alert.alert("Location Error", "Could not get your current location.");
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await api.get("/businesses");

      const businessesWithLocation = (res.data || []).filter((business) => {
        return getBusinessCoordinates(business) !== null;
      });

      setBusinesses(businessesWithLocation);
    } catch (error) {
      console.log("Fetch Businesses Error:", error?.response?.data || error);
      Alert.alert("Error", "Could not load businesses.");
    }
  };

  const closeBusinessCard = () => {
    setSelectedBusiness(null);
  };

  const openBusinessPage = (business) => {
    if (!business?._id) return;

    router.push(`/business/${business._id}`);
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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getRegionForBusinesses(filteredBusinesses, userLocation)}
        showsUserLocation
        onPress={closeBusinessCard}
      >
        <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="blue"
          />
        )}

        {filteredBusinesses.map((business) => {
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

      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={() => {
          setSelectedBusiness(null);
          getUserLocation(true);
        }}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator color="#222" />
        ) : (
          <>
            <Ionicons name="locate" size={20} color="#222" />
            <Text style={styles.currentLocationText}>Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      {filteredBusinesses.length === 0 && (
        <View style={styles.noResultsBox}>
          <Text style={styles.noResultsText}>
            No businesses found for this filter
          </Text>
        </View>
      )}

      {selectedBusiness && (
        <TouchableOpacity
          style={styles.businessCard}
          activeOpacity={0.9}
          onPress={() => openBusinessPage(selectedBusiness)}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeBusinessCard}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.businessName}>
            {selectedBusiness.icon} {selectedBusiness.name}
          </Text>

          <Text style={styles.businessCategory}>
            {selectedBusiness.category || "Business"}
          </Text>

          <Text style={styles.businessDescription}>
            {selectedBusiness.description || "No description available"}
          </Text>

          <Text style={styles.businessText}>
            📍 {selectedBusiness.address || "Address not provided"}
          </Text>

          <Text style={styles.businessText}>
            {(selectedBusiness.reviewCount || 0) > 0
              ? `⭐ ${selectedBusiness.averageRating || 0} rating`
              : "No reviews yet"}
          </Text>

          <Text style={styles.businessText}>
            Reviews: {selectedBusiness.reviewCount || 0}
          </Text>

          <View style={styles.openPageHint}>
            <Ionicons name="open-outline" size={16} color="#fff" />
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
  },

  map: {
    flex: 1,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderText: {
    marginTop: 8,
  },

  currentLocationButton: {
    position: "absolute",
    top: 18,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  currentLocationText: {
    marginLeft: 6,
    color: "#222",
    fontWeight: "bold",
  },

  noResultsBox: {
    position: "absolute",
    top: "45%",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  noResultsText: {
    color: "#222",
    fontWeight: "bold",
    textAlign: "center",
  },

  iconMarker: {
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  markerPointer: {
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },

  iconText: {
    fontSize: 23,
  },

  businessCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
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
    color: "#222",
    marginBottom: 4,
    paddingRight: 28,
  },

  businessCategory: {
    color: "#F9B208",
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
    backgroundColor: "#222",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  openPageHintText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
});