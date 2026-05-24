import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, Callout, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";

console.log("🔥 Native Map Loaded");

export default function BusinessMap() {
  const [businesses, setBusinesses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation();
    fetchBusinesses();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const res = await axios.get("http://YOUR_BACKEND_URL/api/businesses");
      setBusinesses(res.data);
    } catch (e) {
      console.log("API failed, using fallback");

      setBusinesses([
        {
          id: 1,
          name: "Coffee House",
          latitude: 60.192,
          longitude: 24.945,
          description: "Best coffee",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: userLocation?.latitude || 60.192,
        longitude: userLocation?.longitude || 24.945,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {userLocation && (
        <Marker coordinate={userLocation} title="You" pinColor="blue" />
      )}

      {businesses.map((b) => (
        <Marker
          key={b.id}
          coordinate={{
            latitude: b.latitude,
            longitude: b.longitude,
          }}
        >
          <Callout>
            <View style={{ width: 200 }}>
              <Text style={{ fontWeight: "bold" }}>{b.name}</Text>
              <Text>{b.description}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});