import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../../src/services/api';
import { getToken, removeToken } from '../tokenUtils';

export default function HomeScreen () {
  const router = useRouter();
  const [userName, setUserName] = useState('');
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
        router.replace('/login');
        return;
      }

      const response = await api.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserName(response.data.name || 'Neighbor');
    } catch (error) {
      setUserName('Guest');
    }
  };

  const fetchProperties = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get('/properties/nearby', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNearbyProperties(response.data || []);
      }
    } catch (error) {
      // Dummy data without external images (using local icon)
      setNearbyProperties([
        { id: 1, name: 'Sunset Villa', price: '$450,000', location: 'Downtown', beds: 3, baths: 2 },
        { id: 2, name: 'Green Park Residence', price: '$320,000', location: 'Westside', beds: 2, baths: 1 },
        { id: 3, name: 'Harbor View Apartments', price: '$550,000', location: 'Eastside', beds: 4, baths: 3 },
      ]);
      setFeaturedProperties([
        { id: 4, name: 'Modern Downtown Loft', price: '$680,000', location: 'City Center', beds: 2, baths: 2 },
        { id: 5, name: 'Cozy Family Home', price: '$425,000', location: 'Northside', beds: 3, baths: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await removeToken();
    router.replace('/');
  };

  const PropertyCard = ({ property }) => (
    <TouchableOpacity style={styles.propertyCard}>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="home-outline" size={40} color="#378ADD" />
      </View>
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyPrice}>{property.price}</Text>
        <View style={styles.propertyDetails}>
          <Ionicons name="bed-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{property.beds} beds</Text>
          <Ionicons name="water-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{property.baths} baths</Text>
        </View>
        <Text style={styles.propertyLocation}>
          <Ionicons name="location-outline" size={12} /> {property.location}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FeaturedCard = ({ property }) => (
    <TouchableOpacity style={styles.featuredPropertyCard}>
      <View style={styles.featuredPlaceholder}>
        <Ionicons name="home" size={50} color="#fff" />
        <Text style={styles.featuredPropertyName}>{property.name}</Text>
        <Text style={styles.featuredPropertyPrice}>{property.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {userName}!</Text>
          <Text style={styles.subtitle}>Find your dream home</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={44} color="#378ADD" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <Text style={styles.searchText}>Search by location, price, or type...</Text>
        <Ionicons name="options-outline" size={20} color="#999" style={styles.filterIcon} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.signOutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>✨ Featured for You</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Loading featured...</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featuredProperties}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <FeaturedCard property={item} />}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏠 Nearby Properties</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>Loading properties...</Text>
        ) : (
          nearbyProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 2,
  },
  searchText: {
    flex: 1,
    color: '#999',
    fontSize: 14,
    marginLeft: 10,
  },
  filterIcon: {
    marginLeft: 10,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  seeAllText: {
    fontSize: 13,
    color: '#378ADD',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  horizontalList: {
    gap: 15,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  propertyPrice: {
    fontSize: 15,
    color: '#378ADD',
    fontWeight: '700',
    marginTop: 4,
  },
  propertyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  propertyLocation: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  featuredPropertyCard: {
    width: 260,
    height: 180,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#378ADD',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  featuredPropertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  featuredPropertyPrice: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});