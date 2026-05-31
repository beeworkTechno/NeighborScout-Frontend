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
  Image,
} from 'react-native';

import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import api from '../src/services/api';
import colors from '../src/styles/colors';
import ImageCropModal from '../components/ImageCropModal';

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

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);

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

  const createImageFile = async (image) => {
    if (image.webFile) {
      return image.webFile;
    }

    const fileName = image.fileName || `business-photo-${Date.now()}.jpg`;
    const mimeType = image.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(image.uri);
      const blob = await response.blob();

      return new File([blob], fileName, {
        type: blob.type || mimeType,
      });
    }

    return {
      uri: image.uri,
      name: fileName,
      type: mimeType,
    };
  };

  const pickBusinessPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError('Please allow photo access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,

        // Web uses our custom crop modal.
        // Native uses the system crop editor.
        allowsEditing: Platform.OS !== 'web',

        aspect: [16, 9],
        quality: 0.9,
        exif: false,
      });

      if (result.canceled) return;

      const selectedImage = result.assets[0];

      if (Platform.OS === 'web') {
        setImageToCrop(selectedImage);
        setCropModalVisible(true);
        return;
      }

      setProfilePhoto(selectedImage);
      setErrorMessage('');
      setSuccessMessage('');
    } catch (error) {
      console.log('Pick Business Photo Error:', error);
      showError('Could not select business photo.');
    }
  };

  const removeSelectedPhoto = () => {
    setProfilePhoto(null);
    setImageToCrop(null);
    setCropModalVisible(false);
    setErrorMessage('');
    setSuccessMessage('');
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

      const formData = new FormData();

      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('address', form.address.trim() || 'Address not provided');
      formData.append('phone', form.phone.trim());
      formData.append('latitude', String(Number(form.latitude)));
      formData.append('longitude', String(Number(form.longitude)));

      if (profilePhoto) {
        const imageFile = await createImageFile(profilePhoto);
        formData.append('profilePhoto', imageFile);
      }

      const response = await api.post('/businesses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add Your Business</Text>

        <TouchableOpacity
          style={styles.photoPicker}
          onPress={pickBusinessPhoto}
          activeOpacity={0.8}
        >
          {profilePhoto ? (
            <Image
              source={{ uri: profilePhoto.uri }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoPickerText}>Add Business Photo</Text>
              <Text style={styles.photoHelperText}>
                Crop and resize before uploading
              </Text>
            </>
          )}
        </TouchableOpacity>

        {profilePhoto ? (
          <View style={styles.photoActionRow}>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickBusinessPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.changePhotoText}>Change / Crop Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={removeSelectedPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
          style={[styles.submitButton, loading && styles.disabledButton]}
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

      <ImageCropModal
        visible={cropModalVisible}
        imageUri={imageToCrop?.uri}
        aspect={16 / 9}
        fileName="business-photo.jpg"
        onCancel={() => {
          setCropModalVisible(false);
          setImageToCrop(null);
        }}
        onCropDone={(croppedImage) => {
          setProfilePhoto({
            uri: croppedImage.uri,
            webFile: croppedImage.file,
            fileName: 'business-photo.jpg',
            mimeType: 'image/jpeg',
          });

          setCropModalVisible(false);
          setImageToCrop(null);
          setErrorMessage('');
          setSuccessMessage('');
        }}
      />
    </>
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

  photoPicker: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 14,
    backgroundColor: colors.white,
    minHeight: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },

  photoPreview: {
    width: '100%',
    height: 190,
  },

  photoIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  photoPickerText: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  photoHelperText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },

  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  changePhotoButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
  },

  changePhotoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },

  removePhotoButton: {
    backgroundColor: '#FFECEC',
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  removePhotoText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 13,
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