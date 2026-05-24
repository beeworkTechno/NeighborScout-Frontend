import React from "react";
import { View, StyleSheet } from "react-native";

console.log("🌐 Web OpenStreetMap Loaded");

export default function BusinessMap() {
  const latitude = 65.0121;
  const longitude = 25.4651;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.03
  }%2C${latitude - 0.02}%2C${longitude + 0.03}%2C${
    latitude + 0.02
  }&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <View style={styles.container}>
      <iframe
        title="NeighborScout OpenStreetMap"
        src={mapUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "0",
        }}
        loading="lazy"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});