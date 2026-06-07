import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import api from '../../src/services/api';
import colors from '../../src/styles/colors';
import { clearToken, getToken } from '../../utils/tokenUtils';
import { getUserProfilePhotoUrl } from '../../utils/userPhoto';
import ImageCropModal from '../../components/ImageCropModal';

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);

  const isBusinessUser = user?.role === 'business';

  const fetchProfile = async () => {
    try {
      const token = await getToken();

      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      if (userRes.data?.role === 'business') {
        const businessRes = await api.get('/businesses/my');
        setMyBusinesses(businessRes.data || []);
      } else {
        setMyBusinesses([]);
      }
    } catch (error) {
      console.log('Profile Error:', error?.response?.data || error);

      if (error?.response?.status === 401) {
        Alert.alert('Session expired', 'Please login again.');
        await clearToken();
        router.replace('/(auth)/login');
        return;
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Could not load profile. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const createImageFile = async (image) => {
    if (image.webFile) {
      return image.webFile;
    }

    const fileName = image.fileName || `profile-photo-${Date.now()}.jpg`;
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

  const uploadProfilePhoto = async (image) => {
    try {
      setPhotoUploading(true);

      const imageFile = await createImageFile(image);

      const formData = new FormData();
      formData.append('profilePhoto', imageFile);

      const response = await api.put('/auth/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(response.data.user);

      Alert.alert('Success', 'Profile photo updated.');
    } catch (error) {
      console.log('Upload Profile Photo Error:', error?.response?.data || error);

      Alert.alert(
        'Upload Error',
        error?.response?.data?.message || 'Could not upload profile photo.'
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const pickAndUploadProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: Platform.OS !== 'web',
        aspect: [1, 1],
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

      await uploadProfilePhoto(selectedImage);
    } catch (error) {
      console.log('Pick Profile Photo Error:', error);
      Alert.alert('Error', 'Could not select profile photo.');
    }
  };

  const handleLogout = async () => {
    try {
      await clearToken();
      setUser(null);
      setMyBusinesses([]);
      router.replace('/(auth)/login');
    } catch (error) {
      console.log('Logout Error:', error);
      Alert.alert('Error', 'Logout failed. Please try again.');
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not available';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Not available';
    }

    return date.toLocaleDateString();
  };

  const getTotalReviews = () => {
    return myBusinesses.reduce((total, business) => {
      return total + (business.reviewCount || 0);
    }, 0);
  };

  const getReviewedBusinesses = () => {
    return myBusinesses.filter((business) => {
      return (business.reviewCount || 0) > 0;
    });
  };

  const getAverageRating = () => {
    const reviewedBusinesses = getReviewedBusinesses();

    if (!reviewedBusinesses.length) {
      return 'No reviews';
    }

    const totalRating = reviewedBusinesses.reduce((total, business) => {
      return total + (business.averageRating || 0);
    }, 0);

    return (totalRating / reviewedBusinesses.length).toFixed(1);
  };

  const getBusinessRatingText = (business) => {
    const hasReviews = (business.reviewCount || 0) > 0;

    if (!hasReviews) {
      return 'No reviews';
    }

    return String(business.averageRating || 0);
  };

  const userPhotoUrl = getUserProfilePhotoUrl(user);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <TouchableOpacity
            onPress={pickAndUploadProfilePhoto}
            disabled={photoUploading}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            {userPhotoUrl ? (
              <Image
                source={{ uri: userPhotoUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}

            {photoUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.changePhotoText}>Change / Crop Photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email available'}</Text>

          <View
            style={[
              styles.roleBadge,
              isBusinessUser ? styles.businessBadge : styles.personalBadge,
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {isBusinessUser ? 'Business Account' : 'Personal Account'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <InfoRow label="Name" value={user?.name || 'Not available'} />
          <InfoRow label="Email" value={user?.email || 'Not available'} />
          <InfoRow
            label="Account Type"
            value={isBusinessUser ? 'Business Owner' : 'Personal / Reviewer'}
          />
          <InfoRow label="Member Since" value={formatDate(user?.createdAt)} />
        </View>

        {isBusinessUser ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Business Dashboard</Text>

              <View style={styles.statsRow}>
                <StatBox label="Listings" value={String(myBusinesses.length)} />
                <StatBox label="Reviews" value={String(getTotalReviews())} />
                <StatBox label="Avg Rating" value={getAverageRating()} />
              </View>

              <Text style={styles.noteText}>
                Businesses with 0 reviews are not counted in the average rating.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Businesses</Text>

                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => router.push('/add-business')}
                >
                  <Text style={styles.smallButtonText}>Add New</Text>
                </TouchableOpacity>
              </View>

              {myBusinesses.length === 0 ? (
                <Text style={styles.emptyText}>
                  You have not added any business listings yet.
                </Text>
              ) : (
                myBusinesses.map((business) => (
                  <TouchableOpacity
                    key={business._id}
                    style={styles.businessItem}
                    onPress={() => router.push(`/business/${business._id}`)}
                  >
                    <Text style={styles.businessName}>{business.name}</Text>

                    <Text style={styles.businessCategory}>
                      {business.category || 'No category'}
                    </Text>

                    <Text style={styles.businessAddress}>
                      {business.address || 'No address'}
                    </Text>

                    <View style={styles.businessMetaRow}>
                      <Text style={styles.businessMeta}>
                        Rating: {getBusinessRatingText(business)}
                      </Text>

                      <Text style={styles.businessMeta}>
                        Reviews: {business.reviewCount || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reviewer Profile</Text>

            <Text style={styles.descriptionText}>
              Use your personal account to discover local businesses, view
              business details, and share reviews with the community.
            </Text>

            <View style={styles.featureList}>
              <FeatureItem text="Browse local businesses" />
              <FeatureItem text="View ratings and reviews" />
              <FeatureItem text="Share your experience with a pseudo name" />
              <FeatureItem text="Support trusted businesses nearby" />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <ImageCropModal
        visible={cropModalVisible}
        imageUri={imageToCrop?.uri}
        aspect={1}
        fileName="profile-photo.jpg"
        onCancel={() => {
          setCropModalVisible(false);
          setImageToCrop(null);
        }}
        onCropDone={async (croppedImage) => {
          setCropModalVisible(false);
          setImageToCrop(null);

          await uploadProfilePhoto({
            uri: croppedImage.uri,
            webFile: croppedImage.file,
            fileName: 'profile-photo.jpg',
            mimeType: 'image/jpeg',
          });
        }}
      />
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureItem({ text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureBullet}>•</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },

  loadingText: {
    marginTop: 10,
    color: colors.text,
    fontSize: 15,
  },

  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },

  avatarCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    marginBottom: 8,
    backgroundColor: colors.bg,
  },

  avatarText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: 'bold',
  },

  changePhotoText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },

  email: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 12,
    textAlign: 'center',
  },

  roleBadge: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  personalBadge: {
    backgroundColor: '#E8F5E9',
  },

  businessBadge: {
    backgroundColor: '#E3F2FD',
  },

  roleBadgeText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    gap: 12,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    flex: 1,
  },

  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statBox: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
  },

  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },

  noteText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  smallButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  smallButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  businessItem: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.bg,
  },

  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },

  businessCategory: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },

  businessAddress: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
  },

  businessMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  businessMeta: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },

  descriptionText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },

  featureList: {
    marginTop: 4,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  featureBullet: {
    color: colors.primary,
    fontSize: 22,
    marginRight: 8,
  },

  featureText: {
    color: colors.text,
    fontSize: 14,
  },

  logoutButton: {
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  logoutText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});