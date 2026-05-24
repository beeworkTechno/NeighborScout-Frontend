import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import BusinessMap from "../../components/BusinessMap";
import api from "../../src/services/api";
import { getToken, removeToken, getRole, saveRole } from "../../utils/tokenUtils";

export default function HomeScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("map");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("personal");
  const [loading, setLoading] = useState(true);

  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchProperties();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserName(response.data.name || "Neighbor");

      const storedRole = await getRole();

      if (storedRole) {
        setUserRole(storedRole);
      } else if (response.data.role) {
        setUserRole(response.data.role);
        await saveRole(response.data.role);
      }
    } catch (error) {
      setUserName("Guest");
    }
  };

  const fetchProperties = async () => {
    try {
      const token = await getToken();

      if (token) {
        const response = await api.get("/properties/nearby", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNearbyProperties(response.data || []);
      }
    } catch (error) {
      setNearbyProperties([
        {
          id: 1,
          name: "Sunset Villa",
          price: "$450,000",
          location: "Downtown",
          beds: 3,
          baths: 2,
        },
        {
          id: 2,
          name: "Green Park Residence",
          price: "$320,000",
          location: "Westside",
          beds: 2,
          baths: 1,
        },
      ]);

      setFeaturedProperties([
        {
          id: 4,
          name: "Modern Loft",
          price: "$680,000",
          location: "City Center",
          beds: 2,
          baths: 2,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await removeToken();
    router.replace("/");
  };

  // ---------------- PERSONAL DASHBOARD ----------------
  const DashboardView = () => (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {userName}!</Text>
          <Text style={styles.subtitle}>Find your dream home</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="person-circle-outline" size={44} color="#378ADD" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <Text style={styles.searchText}>Search properties...</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={colors.white} />
        <Text style={styles.signOutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured</Text>

        <FlatList
          horizontal
          data={featuredProperties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.featuredCard}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {item.name}
              </Text>
              <Text style={{ color: "#fff" }}>{item.price}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby</Text>

        {nearbyProperties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </View>
    </ScrollView>
  );

  // ---------------- BUSINESS DASHBOARD ----------------
  const BusinessDashboard = () => (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Dashboard</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.6</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Update Business Info</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>View Reviews</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const PropertyCard = ({ property }) => (
    <View style={styles.propertyCard}>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="home-outline" size={40} color="#378ADD" />
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyPrice}>{property.price}</Text>

        <Text style={styles.propertyLocation}>
          <Ionicons name="location-outline" size={12} /> {property.location}
        </Text>
      </View>
    </View>
  );

  // ROLE-BASED DASHBOARD
  const renderDashboard = () => {
    if (userRole === "business") {
      return <BusinessDashboard />;
    }

    return <DashboardView />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab("map")}>
          <Text style={[styles.tab, activeTab === "map" && styles.activeTab]}>
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab("dashboard")}>
          <Text
            style={[
              styles.tab,
              activeTab === "dashboard" && styles.activeTab,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "map" ? <BusinessMap /> : renderDashboard()}
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#f2f2f2",
  },

  tab: {
    fontSize: 16,
    color: "gray",
    fontWeight: "600",
  },

  activeTab: {
    color: "#378ADD",
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "gray",
  },

  searchBar: {
    flexDirection: "row",
    padding: 12,
    margin: 20,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },

  searchText: {
    marginLeft: 10,
    color: "#999",
  },

  signOutButton: {
    flexDirection: "row",
    backgroundColor: "red",
    margin: 20,
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  signOutButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },

  propertyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },

  imagePlaceholder: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e6f0ff",
    borderRadius: 10,
  },

  propertyInfo: {
    marginLeft: 10,
  },

  propertyName: {
    fontWeight: "bold",
  },

  propertyPrice: {
    color: "#378ADD",
  },

  propertyLocation: {
    fontSize: 12,
    color: "gray",
  },

  featuredCard: {
    width: 200,
    height: 120,
    backgroundColor: "#378ADD",
    marginRight: 10,
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
  },

  statCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
    margin: 5,
    borderRadius: 10,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },

  statLabel: {
    fontSize: 12,
    color: "gray",
  },

  actionButton: {
    backgroundColor: "#378ADD",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  actionText: {
    color: "#fff",
    textAlign: "center",
  },
});