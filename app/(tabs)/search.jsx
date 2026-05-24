import React, { useState } from "react";

import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from "react-native";

import BusinessMap from "../../components/BusinessMap";

export default function SearchScreen() {
  const [search, setSearch] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.heading}>
          Search Businesses
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Search cafes, restaurants..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.mapContainer}>
        <BusinessMap />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
  },

  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
  },

  mapContainer: {
    flex: 1,
  },
});