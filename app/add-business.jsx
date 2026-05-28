import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import api from '../src/services/api';
import colors from '../src/styles/colors';

const categories = [
  'Restaurant',
  'Grocery',
  'Cafe',
  'Pharmacy',
  'Hotel',
  'Salon',
  'Repair',
  'Furniture',
  'Other',
];

export default function AddBusinessScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Restaurant',
    address: '',
    phone: '',
    latitude: '',
    longitude: '',
  });

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');

    if (Platform.OS !== 'web') {
      Alert.alert('Error', message);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');

    if (Platform.OS !== 'web') {
      Alert.alert('Success', message);
    }
  };

  const handleChange = (key, value) => {
    setForm((previousForm) => ({
      ...previousForm,
      [key]: value,
    }));

    setErrorMessage('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showError('Business name is required.');
      return false;
    }

    if (!form.description.trim()) {
      showError('Business description is required.');
      return false;
    }

    if (!form.category.trim()) {
      showError('Please select a business category.');
      return false;
    }

    if (!form.latitude || !form.longitude) {
      showError(
        'Please use current location or enter latitude and longitude manually.'
      );
      return false;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      showError('Please enter valid latitude and longitude values.');
      return false;
    }

    return true;
  };

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        showError('Location permission is required to use current location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      setForm((previousForm) => ({
        ...previousForm,
        latitude: String(loc.coords.latitude),
        longitude: String(loc.coords.longitude),
      }));

      showSuccess('Current location added successfully.');
    } catch (error) {
      console.log('Location Error:', error);
      showError('Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleAddBusiness = async () => {
    console.log('Add Business button pressed');

    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        address: form.address.trim() || 'Address not provided',
        phone: form.phone.trim(),
        location: {
          type: 'Point',
          coordinates: [
            Number(form.longitude),
            Number(form.latitude),
          ],
        },
      };

      console.log('Sending business payload:', payload);

      const response = await api.post('/businesses', payload);

      console.log('Business created:', response.data);

      showSuccess('Business added successfully.');

      setTimeout(() => {
        router.replace('/(tabs)/profile');
      }, 500);
    } catch (error) {
      console.log('Create Business Error:', error?.response?.data || error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Could not add business. Please try again.';

      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Your Business</Text>

      <TextInput
        placeholder="Business Name"
        value={form.name}
        onChangeText={(text) => handleChange('name', text)}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        value={form.description}
        onChangeText={(text) => handleChange('description', text)}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.label}>Category</Text>

      <View style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              form.category === category && styles.categoryButtonActive,
            ]}
            onPress={() => handleChange('category', category)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryText,
                form.category === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Address optional"
        value={form.address}
        onChangeText={(text) => handleChange('address', text)}
        style={styles.input}
      />

      <TextInput
        placeholder="Phone optional"
        value={form.phone}
        onChangeText={(text) => handleChange('phone', text)}
        style={styles.input}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={styles.locationButton}
        onPress={useCurrentLocation}
        disabled={locating}
        activeOpacity={0.8}
      >
        {locating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Use Current Location</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText}>Or enter location manually:</Text>

      <TextInput
        placeholder="Latitude"
        value={form.latitude}
        onChangeText={(text) => handleChange('latitude', text)}
        style={styles.input}
        keyboardType="numeric"
      />

      <TextInput
        placeholder="Longitude"
        value={form.longitude}
        onChangeText={(text) => handleChange('longitude', text)}
        style={styles.input}
        keyboardType="numeric"
      />

      {errorMessage ? (
        <Text style={styles.errorBox}>{errorMessage}</Text>
      ) : null}

      {successMessage ? (
        <Text style={styles.successBox}>{successMessage}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.submitButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleAddBusiness}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Add Business</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  container: {
    padding: 20,
    paddingBottom: 100,
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.white,
    marginBottom: 14,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  categoryButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.muted,
  },

  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  categoryText: {
    color: colors.text,
    fontWeight: '500',
  },

  categoryTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },

  locationButton: {
    backgroundColor: colors.primaryDark || colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },

  helperText: {
    color: colors.muted,
    marginBottom: 10,
  },

  errorBox: {
    backgroundColor: '#FFECEC',
    color: '#D32F2F',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontWeight: '600',
  },

  successBox: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontWeight: '600',
  },

  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  cancelText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});