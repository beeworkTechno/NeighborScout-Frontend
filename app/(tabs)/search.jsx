import React, { useState } from 'react';

import {
  View,
  TextInput,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import BusinessMap from '../../components/BusinessMap';

import { BUSINESS_CATEGORIES_WITH_ALL } from '../../src/constants/businessCategories';

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.heading}>Search Businesses</Text>

        <TextInput
          style={styles.input}
          placeholder="Search by name, address, category..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {BUSINESS_CATEGORIES_WITH_ALL.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  isActive ? styles.categoryButtonActive : null,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    isActive ? styles.categoryButtonTextActive : null,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.filterInfo}>
          Filter: {selectedCategory}
          {search.trim() ? ` • Search: ${search.trim()}` : ''}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <BusinessMap searchText={search} selectedCategory={selectedCategory} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },

  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },

  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  categoryButtonActive: {
    backgroundColor: '#F9B208',
    borderColor: '#F9B208',
  },

  categoryButtonText: {
    color: '#333',
    fontWeight: '600',
  },

  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  filterInfo: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
  },

  mapContainer: {
    flex: 1,
  },
});