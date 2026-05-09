import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '../../src/services/api';
import { getToken } from '../tokenUtils';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearbyProperties, setNearbyProperties] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchNearbyProperties();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get('/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserName(response.data.name || 'Neighbor');
      } else {
        setUserName('Guest');
      }
    } catch (error) {
      console.log('Error fetching user:', error);
      setUserName('Neighbor');
    }
  };

  const fetchNearbyProperties = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await api.get('/properties/nearby', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNearbyProperties(response.data || []);
      } else {
        setNearbyProperties([
          { id: 1, name: 'Sunset Villa', price: '$450,000', location: 'Downtown' },
          { id: 2, name: 'Green Park Residence', price: '$320,000', location: 'Westside' },
          { id: 3, name: 'Harbor View Apartments', price: '$550,000', location: 'Eastside' },
        ]);
      }
    } catch (error) {
      console.log('Error fetching properties:', error);
      setNearbyProperties([
        { id: 1, name: 'Sunset Villa', price: '$450,000', location: 'Downtown' },
        { id: 2, name: 'Green Park Residence', price: '$320,000', location: 'Westside' },
        { id: 3, name: 'Harbor View Apartments', price: '$550,000', location: 'Eastside' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, {userName}!</Text>
          <Text style={styles.subtitle}>Find your dream neighborhood</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={44} color="#378ADD" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <Text style={styles.searchText}>Search for properties...</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Nearby Properties</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading properties...</Text>
        ) : (
          nearbyProperties.map((property) => (
            <TouchableOpacity key={property.id} style={styles.propertyCard}>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName}>{property.name}</Text>
                <Text style={styles.propertyPrice}>{property.price}</Text>
                <Text style={styles.propertyLocation}>
                  <Ionicons name="location-outline" size={14} /> {property.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✨ Recommended for You</Text>
        <View style={styles.featuredCard}>
          <Text style={styles.featuredText}>Get personalized property recommendations</Text>
          <TouchableOpacity style={styles.featuredButton}>
            <Text style={styles.featuredButtonText}>Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    gap: 10,
  },
  searchText: {
    color: '#999',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  propertyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  propertyPrice: {
    fontSize: 14,
    color: '#378ADD',
    fontWeight: '600',
    marginTop: 4,
  },
  propertyLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  featuredCard: {
    backgroundColor: '#378ADD',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  featuredText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  featuredButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featuredButtonText: {
    color: '#378ADD',
    fontWeight: '600',
  },
});