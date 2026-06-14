import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import BusinessMap from "../../components/BusinessMap";
import api, { API_URL } from "../../src/services/api";
import colors from "../../src/styles/colors";
import {
  getToken,
  getRole,
  saveRole,
  clearToken,
} from "../../utils/tokenUtils";
import { getUserProfilePhotoUrl } from "../../utils/userPhoto";

import { BUSINESS_CATEGORIES_WITH_ALL } from "../../src/constants/businessCategories";

export default function HomeScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("map");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("personal");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [businesses, setBusinesses] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [mapSelectedBusiness, setMapSelectedBusiness] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedBusinessReviews, setSelectedBusinessReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [editingReview, setEditingReview] = useState(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");
  const [editingImages, setEditingImages] = useState([]);
  const [removeExistingEditImages, setRemoveExistingEditImages] =
    useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [reactionLoadingId, setReactionLoadingId] = useState(null);

  const isBusinessUser = userRole === "business";

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      await fetchUserData();
      await fetchUserLocation();
      await fetchBusinesses();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError("");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Location permission denied.");
        setUserLocation(null);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      setUserLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      console.log("Fetch User Location Error:", error);
      setLocationError("Could not get your current location.");
      setUserLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/me");

      setUser(response.data);
      setUserName(response.data.name || "Neighbor");

      const storedRole = await getRole();

      if (storedRole) {
        setUserRole(storedRole);
      } else if (response.data.role) {
        setUserRole(response.data.role);
        await saveRole(response.data.role);
      }
    } catch (error) {
      console.log("Fetch User Error:", error?.response?.data || error);

      if (error?.response?.status === 401) {
        await clearToken();
        router.replace("/(auth)/login");
      }

      setUserName("Guest");
      setUser(null);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await api.get("/businesses");
      setBusinesses(response.data || []);

      const role = await getRole();

      if (role === "business") {
        try {
          const myBusinessRes = await api.get("/businesses/my");
          setMyBusinesses(myBusinessRes.data || []);
        } catch (error) {
          console.log(
            "Fetch My Businesses Error:",
            error?.response?.data || error
          );
          setMyBusinesses([]);
        }
      }
    } catch (error) {
      console.log("Fetch Businesses Error:", error?.response?.data || error);
      setBusinesses([]);
    }
  };

  const handleSignOut = async () => {
    await clearToken();
    router.replace("/(auth)/login");
  };

  const handleViewInMap = (business) => {
    setMapSelectedBusiness(business);
    setActiveTab("map");
  };

  const resetReviewForm = () => {
    setReviewRating(5);
    setReviewComment("");
    setReviewImages([]);
  };

  const resetEditForm = () => {
    setEditingReview(null);
    setEditingRating(5);
    setEditingComment("");
    setEditingImages([]);
    setRemoveExistingEditImages(false);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedBusiness(null);
    setSelectedBusinessReviews([]);
    resetReviewForm();
    resetEditForm();
  };

  const openReviewModal = async (business) => {
    setSelectedBusiness(business);
    setSelectedBusinessReviews([]);
    resetReviewForm();
    resetEditForm();
    setReviewModalVisible(true);

    await fetchReviewsForBusiness(business._id);
  };

  const fetchReviewsForBusiness = async (businessId) => {
    try {
      const response = await api.get(`/reviews/${businessId}`);
      setSelectedBusinessReviews(response.data || []);
    } catch (error) {
      console.log("Fetch Reviews Error:", error?.response?.data || error);
      setSelectedBusinessReviews([]);
    }
  };

  const createReviewImageFile = async (image, index) => {
    const mimeType = image.mimeType || image.type || "image/jpeg";
    const extension = mimeType.split("/")[1] || "jpg";
    const fileName =
      image.fileName || `review-image-${Date.now()}-${index}.${extension}`;

    if (Platform.OS === "web") {
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

  const pickImages = async (currentImages, setImages) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo access to add review images."
        );
        return;
      }

      const remainingSlots = 5 - currentImages.length;

      if (remainingSlots <= 0) {
        Alert.alert("Limit reached", "You can upload up to 5 images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.85,
        exif: false,
      });

      if (result.canceled) return;

      const selectedImages = (result.assets || []).slice(0, remainingSlots);

      setImages((previousImages) =>
        [...previousImages, ...selectedImages].slice(0, 5)
      );
    } catch (error) {
      console.log("Pick Review Images Error:", error);
      Alert.alert("Image Error", "Could not select review images.");
    }
  };

  const pickReviewImages = async () => {
    await pickImages(reviewImages, setReviewImages);
  };

  const pickEditingImages = async () => {
    await pickImages(editingImages, setEditingImages);
  };

  const removeReviewImage = (imageIndex) => {
    setReviewImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );
  };

  const removeEditingImage = (imageIndex) => {
    setEditingImages((previousImages) =>
      previousImages.filter((_, index) => index !== imageIndex)
    );
  };

  const getAbsoluteReviewImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    const backendUrl = API_URL.replace("/api", "");
    return `${backendUrl}${imageUrl}`;
  };

  const submitReview = async () => {
    if (!selectedBusiness?._id) {
      Alert.alert("Error", "No business selected.");
      return;
    }

    if (isBusinessUser) {
      Alert.alert(
        "Not allowed",
        "Business accounts cannot rate or review businesses."
      );
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      Alert.alert("Invalid Rating", "Rating must be between 1 and 5.");
      return;
    }

    try {
      setReviewLoading(true);

      const formData = new FormData();
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment.trim());

      for (let index = 0; index < reviewImages.length; index += 1) {
        const imageFile = await createReviewImageFile(reviewImages[index], index);
        formData.append("images", imageFile);
      }

      await api.post(`/reviews/${selectedBusiness._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      resetReviewForm();
      closeReviewModal();

      await fetchBusinesses();

      Alert.alert("Success", "Review submitted successfully.");
    } catch (error) {
      console.log("Submit Review Error:", error?.response?.data || error);

      Alert.alert(
        "Review Error",
        error?.response?.data?.message ||
          "Could not submit review. Please try again."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const startEditReview = (review) => {
    setEditingReview(review);
    setEditingRating(review.rating || 5);
    setEditingComment(review.comment || "");
    setEditingImages([]);
    setRemoveExistingEditImages(false);
  };

  const cancelEditReview = () => {
    resetEditForm();
  };

  const updateReview = async () => {
    if (!editingReview?._id) {
      Alert.alert("Error", "No review selected.");
      return;
    }

    if (!selectedBusiness?._id) {
      Alert.alert("Error", "No business selected.");
      return;
    }

    if (!editingRating || editingRating < 1 || editingRating > 5) {
      Alert.alert("Invalid Rating", "Rating must be between 1 and 5.");
      return;
    }

    try {
      setEditLoading(true);

      const formData = new FormData();
      formData.append("rating", String(editingRating));
      formData.append("comment", editingComment.trim());

      if (removeExistingEditImages) {
        formData.append("removeImages", "true");
      }

      for (let index = 0; index < editingImages.length; index += 1) {
        const imageFile = await createReviewImageFile(
          editingImages[index],
          index
        );

        formData.append("images", imageFile);
      }

      await api.put(`/reviews/${editingReview._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchReviewsForBusiness(selectedBusiness._id);
      await fetchBusinesses();

      resetEditForm();

      Alert.alert("Success", "Review updated successfully.");
    } catch (error) {
      console.log("Update Review Error:", error?.response?.data || error);

      Alert.alert(
        "Update Error",
        error?.response?.data?.message ||
          "Could not update review. Please try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!selectedBusiness?._id) {
      Alert.alert("Error", "No business selected.");
      return;
    }

    const performDelete = async () => {
      try {
        setDeleteLoadingId(reviewId);

        await api.delete(`/reviews/${reviewId}`);

        await fetchReviewsForBusiness(selectedBusiness._id);
        await fetchBusinesses();

        if (editingReview?._id === reviewId) {
          resetEditForm();
        }

        Alert.alert("Deleted", "Review deleted successfully.");
      } catch (error) {
        console.log("Delete Review Error:", error?.response?.data || error);

        Alert.alert(
          "Delete Error",
          error?.response?.data?.message ||
            "Could not delete review. Please try again."
        );
      } finally {
        setDeleteLoadingId(null);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to delete your review?"
      );

      if (confirmed) {
        await performDelete();
      }

      return;
    }

    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete your review?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const reactToReview = async (review, reaction) => {
    if (!selectedBusiness?._id) {
      Alert.alert("Error", "No business selected.");
      return;
    }

    if (isBusinessUser) {
      Alert.alert(
        "Not allowed",
        "Business accounts cannot like or dislike reviews."
      );
      return;
    }

    if (!review.canReact) {
      Alert.alert("Not allowed", "You cannot react to your own review.");
      return;
    }

    try {
      setReactionLoadingId(review._id);

      const nextReaction = review.myReaction === reaction ? "none" : reaction;

      await api.put(`/reviews/${review._id}/reaction`, {
        reaction: nextReaction,
      });

      await fetchReviewsForBusiness(selectedBusiness._id);
    } catch (error) {
      console.log("React To Review Error:", error?.response?.data || error);

      Alert.alert(
        "Reaction Error",
        error?.response?.data?.message ||
          "Could not update your reaction. Please try again."
      );
    } finally {
      setReactionLoadingId(null);
    }
  };

  const getCategoryIcon = (category = "") => {
    const value = category.toLowerCase();

    if (value.includes("restaurant")) return "🍽️";
    if (value.includes("grocery")) return "🛒";
    if (value.includes("cafe") || value.includes("coffee")) return "☕";
    if (value.includes("pharmacy")) return "💊";
    if (value.includes("hotel")) return "🏨";
    if (value.includes("salon")) return "💇";
    if (value.includes("repair")) return "🔧";
    if (value.includes("furniture")) return "🪑";
    if (value.includes("school")) return "🏫";
    if (value.includes("gym")) return "🏋️";
    if (value.includes("hospital") || value.includes("clinic")) return "🏥";
    if (value.includes("bank")) return "🏦";
    if (value.includes("shop") || value.includes("store")) return "🛍️";

    return "🏢";
  };

  const getBusinessRatingText = (business) => {
    const hasReviews = (business.reviewCount || 0) > 0;

    if (!hasReviews) {
      return "No reviews";
    }

    return `${business.averageRating || 0} ⭐`;
  };

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;

    const toRadians = (degree) => {
      return degree * (Math.PI / 180);
    };

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  };

  const getBusinessCoordinates = (business) => {
    if (
      business?.location?.coordinates &&
      Array.isArray(business.location.coordinates) &&
      business.location.coordinates.length === 2
    ) {
      const longitude = Number(business.location.coordinates[0]);
      const latitude = Number(business.location.coordinates[1]);

      if (
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        return {
          latitude,
          longitude,
        };
      }
    }

    const latitude = Number(business.latitude);
    const longitude = Number(business.longitude);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  };

  const getNearestBusinesses = (list) => {
    if (!userLocation) {
      return list.slice(0, 10);
    }

    return list
      .map((business) => {
        const coordinates = getBusinessCoordinates(business);

        if (!coordinates) {
          return null;
        }

        const distance = getDistanceInKm(
          userLocation.latitude,
          userLocation.longitude,
          coordinates.latitude,
          coordinates.longitude
        );

        return {
          ...business,
          distance,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  };

  const getFilteredBusinesses = (list) => {
    const query = searchQuery.trim().toLowerCase();
    const categoryFilter = selectedCategory.trim().toLowerCase();

    return list.filter((business) => {
      const name = business.name?.toLowerCase() || "";
      const category = business.category?.toLowerCase() || "";
      const address = business.address?.toLowerCase() || "";
      const description = business.description?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        name.includes(query) ||
        category.includes(query) ||
        address.includes(query) ||
        description.includes(query);

      const matchesCategory =
        selectedCategory === "All" || category.includes(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setShowCategoryFilters(false);
  };

  const renderHeaderProfileButton = () => {
    const userPhotoUrl = getUserProfilePhotoUrl(user);

    return (
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile")}
        activeOpacity={0.8}
      >
        {userPhotoUrl ? (
          <Image
            source={{ uri: userPhotoUrl }}
            style={styles.headerProfileImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="person-circle-outline" size={44} color="#F9B208" />
        )}
      </TouchableOpacity>
    );
  };

  const renderBusinessCard = (business) => (
    <View style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <Text style={styles.businessName}>
          {getCategoryIcon(business.category)} {business.name}
        </Text>

        <Text style={styles.ratingText}>{getBusinessRatingText(business)}</Text>
      </View>

      <Text style={styles.businessCategory}>
        {business.category || "Business"}
      </Text>

      {typeof business.distance === "number" ? (
        <Text style={styles.distanceText}>
          {business.distance.toFixed(1)} km away
        </Text>
      ) : null}

      <Text style={styles.businessText}>
        {business.description || "No description available"}
      </Text>

      <Text style={styles.businessText}>
        <Ionicons name="location-outline" size={13} />{" "}
        {business.address || "Address not provided"}
      </Text>

      <Text style={styles.businessText}>
        Reviews: {business.reviewCount || 0}
      </Text>

      <TouchableOpacity
        style={styles.viewMapButton}
        onPress={() => handleViewInMap(business)}
      >
        <Ionicons name="map-outline" size={17} color="#fff" />
        <Text style={styles.viewMapButtonText}>View in Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.viewPageButton}
        onPress={() => router.push(`/business/${business._id}`)}
      >
        <Ionicons name="open-outline" size={17} color="#fff" />
        <Text style={styles.viewPageButtonText}>Open Business Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reviewButton}
        onPress={() => openReviewModal(business)}
      >
        <Ionicons name="star-outline" size={17} color="#fff" />

        <Text style={styles.reviewButtonText}>
          {isBusinessUser ? "View Reviews" : "Review / Rate"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = (
    placeholder = "Search businesses by name, category, or address..."
  ) => (
    <View>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" />

        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}

        <View style={styles.searchDivider} />

        <TouchableOpacity
          style={[
            styles.filterIconButton,
            showCategoryFilters || selectedCategory !== "All"
              ? styles.filterIconButtonActive
              : null,
          ]}
          activeOpacity={0.7}
          onPress={() => setShowCategoryFilters(!showCategoryFilters)}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={
              showCategoryFilters || selectedCategory !== "All"
                ? "#fff"
                : "#222"
            }
          />
        </TouchableOpacity>
      </View>

      {showCategoryFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContainer}
        >
          {BUSINESS_CATEGORIES_WITH_ALL.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  isActive ? styles.categoryChipActive : null,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive ? styles.categoryChipTextActive : null,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {selectedCategory !== "All" && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterText}>
            Filtering by: {selectedCategory}
          </Text>

          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSelectedImagePreview = (images, removeImage) => {
    if (images.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectedReviewImageRow}
      >
        {images.map((image, imageIndex) => (
          <View
            key={`${image.uri}-${imageIndex}`}
            style={styles.selectedReviewImageWrap}
          >
            <Image
              source={{ uri: image.uri }}
              style={styles.selectedReviewImage}
            />

            <TouchableOpacity
              style={styles.removeReviewImageButton}
              onPress={() => removeImage(imageIndex)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderReviewImages = (review) => {
    if (!review.imageUrls || review.imageUrls.length === 0) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.reviewImageRow}
      >
        {review.imageUrls.map((imageUrl, imageIndex) => (
          <Image
            key={`${review._id}-${imageIndex}`}
            source={{ uri: getAbsoluteReviewImageUrl(imageUrl) }}
            style={styles.reviewImage}
          />
        ))}
      </ScrollView>
    );
  };

  const renderReviewReactions = (review) => {
    const isLoading = reactionLoadingId === review._id;

    return (
      <View style={styles.reviewReactionRow}>
        <TouchableOpacity
          style={[
            styles.reviewReactionButton,
            review.myReaction === "like" && styles.reviewReactionButtonActive,
            (!review.canReact || isLoading) && styles.reviewReactionButtonDisabled,
          ]}
          onPress={() => reactToReview(review, "like")}
          disabled={!review.canReact || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              review.myReaction === "like"
                ? "thumbs-up"
                : "thumbs-up-outline"
            }
            size={16}
            color={review.myReaction === "like" ? "#fff" : "#222"}
          />

          <Text
            style={[
              styles.reviewReactionText,
              review.myReaction === "like" && styles.reviewReactionTextActive,
            ]}
          >
            {review.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.reviewReactionButton,
            review.myReaction === "dislike" &&
              styles.reviewReactionButtonActive,
            (!review.canReact || isLoading) && styles.reviewReactionButtonDisabled,
          ]}
          onPress={() => reactToReview(review, "dislike")}
          disabled={!review.canReact || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              review.myReaction === "dislike"
                ? "thumbs-down"
                : "thumbs-down-outline"
            }
            size={16}
            color={review.myReaction === "dislike" ? "#fff" : "#222"}
          />

          <Text
            style={[
              styles.reviewReactionText,
              review.myReaction === "dislike" &&
                styles.reviewReactionTextActive,
            ]}
          >
            {review.dislikeCount || 0}
          </Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator size="small" color="#F9B208" />}
      </View>
    );
  };

  const renderPersonalDashboard = () => {
    const nearestBusinesses = getNearestBusinesses(businesses);
    const filteredBusinesses = getFilteredBusinesses(nearestBusinesses);

    return (
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userName}!</Text>
            <Text style={styles.subtitle}>
              Discover and review nearby local businesses
            </Text>
          </View>

          {renderHeaderProfileButton()}
        </View>

        {renderSearchBar("Search nearby businesses...")}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 10 Nearest Businesses</Text>

          {locationLoading ? (
            <Text style={styles.locationInfoText}>Getting your location...</Text>
          ) : locationError ? (
            <Text style={styles.locationWarningText}>
              Location unavailable. Showing limited business results.
            </Text>
          ) : userLocation ? (
            <Text style={styles.locationInfoText}>
              Sorted by distance from your current location.
            </Text>
          ) : null}

          {loading ? (
            <ActivityIndicator color="#F9B208" />
          ) : filteredBusinesses.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim() || selectedCategory !== "All"
                ? "No nearby businesses match your filters."
                : "No nearby businesses found yet."}
            </Text>
          ) : (
            <FlatList
              data={filteredBusinesses}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderBusinessCard(item)}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </ScrollView>
    );
  };

  const renderBusinessDashboard = () => {
    const filteredMyBusinesses = getFilteredBusinesses(myBusinesses);

    const totalReviews = myBusinesses.reduce((total, business) => {
      return total + (business.reviewCount || 0);
    }, 0);

    const reviewedBusinesses = myBusinesses.filter((business) => {
      return (business.reviewCount || 0) > 0;
    });

    const averageRating =
      reviewedBusinesses.length === 0
        ? "No reviews"
        : (
            reviewedBusinesses.reduce((total, business) => {
              return total + (business.averageRating || 0);
            }, 0) / reviewedBusinesses.length
          ).toFixed(1);

    return (
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userName}!</Text>
            <Text style={styles.subtitle}>Manage your business listings</Text>
          </View>

          {renderHeaderProfileButton()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Dashboard</Text>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalReviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{averageRating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{myBusinesses.length}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/add-business")}
          >
            <Text style={styles.actionText}>Add Business</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 16 }}>
            {renderSearchBar("Search my businesses...")}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            My Businesses
          </Text>

          {myBusinesses.length === 0 ? (
            <Text style={styles.emptyText}>
              You have not added any business listings yet.
            </Text>
          ) : filteredMyBusinesses.length === 0 ? (
            <Text style={styles.emptyText}>
              No businesses match your filters.
            </Text>
          ) : (
            filteredMyBusinesses.map((business) => (
              <View key={business._id}>{renderBusinessCard(business)}</View>
            ))
          )}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.signOutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderReviewModal = () => (
    <Modal
      visible={reviewModalVisible}
      animationType="slide"
      transparent
      onRequestClose={closeReviewModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBusiness?.name || "Business Reviews"}
              </Text>

              <TouchableOpacity onPress={closeReviewModal}>
                <Ionicons name="close" size={26} color="#222" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Reviews are shown using pseudo names to protect user identity.
            </Text>

            {!isBusinessUser && (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Your Rating</Text>

                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                    >
                      <Ionicons
                        name={star <= reviewRating ? "star" : "star-outline"}
                        size={32}
                        color="#F9B208"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  placeholder="Write your review..."
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  style={styles.reviewInput}
                  multiline
                  textAlignVertical="top"
                  blurOnSubmit={false}
                />

                <TouchableOpacity
                  style={styles.addReviewImagesButton}
                  onPress={pickReviewImages}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images-outline" size={18} color="#fff" />

                  <Text style={styles.addReviewImagesButtonText}>
                    Add Images ({reviewImages.length}/5)
                  </Text>
                </TouchableOpacity>

                {renderSelectedImagePreview(reviewImages, removeReviewImage)}

                <TouchableOpacity
                  style={[
                    styles.submitReviewButton,
                    reviewLoading && styles.disabledButton,
                  ]}
                  onPress={submitReview}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitReviewText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isBusinessUser && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Business accounts can view reviews but cannot create, edit,
                  delete, like, or dislike reviews.
                </Text>
              </View>
            )}

            <Text style={styles.reviewListTitle}>Reviews</Text>

            {selectedBusinessReviews.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet.</Text>
            ) : (
              selectedBusinessReviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  {editingReview?._id === review._id ? (
                    <>
                      <Text style={styles.reviewPseudoName}>
                        Editing your review
                      </Text>

                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setEditingRating(star)}
                          >
                            <Ionicons
                              name={
                                star <= editingRating
                                  ? "star"
                                  : "star-outline"
                              }
                              size={28}
                              color="#F9B208"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TextInput
                        value={editingComment}
                        onChangeText={setEditingComment}
                        placeholder="Update your review..."
                        style={styles.reviewInput}
                        multiline
                        textAlignVertical="top"
                        blurOnSubmit={false}
                      />

                      {review.imageUrls?.length > 0 &&
                        !removeExistingEditImages && (
                          <View style={styles.currentImagesBox}>
                            <Text style={styles.currentImagesTitle}>
                              Current Images
                            </Text>

                            {renderReviewImages(review)}

                            <TouchableOpacity
                              style={styles.removeExistingImagesButton}
                              onPress={() => setRemoveExistingEditImages(true)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.removeExistingImagesText}>
                                Remove Current Images
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}

                      {removeExistingEditImages && (
                        <Text style={styles.imagesRemovedText}>
                          Current images will be removed after saving.
                        </Text>
                      )}

                      <TouchableOpacity
                        style={styles.addReviewImagesButton}
                        onPress={pickEditingImages}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="images-outline" size={18} color="#fff" />

                        <Text style={styles.addReviewImagesButtonText}>
                          Add New Images ({editingImages.length}/5)
                        </Text>
                      </TouchableOpacity>

                      {renderSelectedImagePreview(
                        editingImages,
                        removeEditingImage
                      )}

                      <TouchableOpacity
                        style={[
                          styles.submitReviewButton,
                          editLoading && styles.disabledButton,
                        ]}
                        onPress={updateReview}
                        disabled={editLoading}
                      >
                        {editLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitReviewText}>
                            Save Changes
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelEditButton}
                        onPress={cancelEditReview}
                      >
                        <Text style={styles.cancelEditText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={styles.reviewCardHeader}>
                        <Text style={styles.reviewPseudoName}>
                          {review.pseudoName || "Anonymous Neighbor"}
                        </Text>

                        <Text style={styles.reviewRating}>
                          {review.rating} ⭐
                        </Text>
                      </View>

                      <Text style={styles.reviewComment}>
                        {review.comment || "No comment provided."}
                      </Text>

                      {renderReviewImages(review)}

                      {renderReviewReactions(review)}

                      {review.canEdit && review.canDelete && !isBusinessUser && (
                        <View style={styles.reviewActionRow}>
                          <TouchableOpacity
                            style={styles.editReviewButton}
                            onPress={() => startEditReview(review)}
                          >
                            <Text style={styles.editReviewText}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.deleteReviewButton,
                              deleteLoadingId === review._id &&
                                styles.disabledButton,
                            ]}
                            onPress={() => deleteReview(review._id)}
                            disabled={deleteLoadingId === review._id}
                          >
                            {deleteLoadingId === review._id ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.deleteReviewText}>
                                Delete
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDashboard = () => {
    if (isBusinessUser) {
      return renderBusinessDashboard();
    }

    return renderPersonalDashboard();
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {activeTab === "map" ? (
        <BusinessMap selectedBusinessFromList={mapSelectedBusiness} />
      ) : (
        renderDashboard()
      )}

      {renderReviewModal()}
    </SafeAreaView>
  );
}

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
    color: "#F9B208",
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  headerProfileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
    borderWidth: 2,
    borderColor: "#F9B208",
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    color: "gray",
    marginTop: 4,
  },

  searchBar: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#222",
    fontSize: 15,
    outlineStyle: "none",
  },

  searchIconButton: {
    padding: 4,
  },

  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#ddd",
    marginHorizontal: 8,
  },

  filterIconButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  filterIconButtonActive: {
    backgroundColor: "#F9B208",
  },

  categoryFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  categoryChipActive: {
    backgroundColor: "#F9B208",
    borderColor: "#F9B208",
  },

  categoryChipText: {
    color: "#333",
    fontWeight: "600",
  },

  categoryChipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  activeFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#FFF8E1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  activeFilterText: {
    color: "#555",
    fontWeight: "600",
  },

  clearFilterText: {
    color: "#D32F2F",
    fontWeight: "bold",
  },

  locationInfoText: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },

  locationWarningText: {
    color: "#D32F2F",
    backgroundColor: "#FFECEC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    fontWeight: "600",
  },

  distanceText: {
    color: "#1976D2",
    fontWeight: "bold",
    marginTop: 5,
  },

  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    margin: 20,
    padding: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  signOutButtonText: {
    color: colors.white,
    marginLeft: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  businessCard: {
    backgroundColor: colors.white,
    padding: 15,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },

  businessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  businessName: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#222",
    flex: 1,
  },

  ratingText: {
    color: "#F9B208",
    fontWeight: "bold",
    textAlign: "right",
  },

  businessCategory: {
    color: "#F9B208",
    fontWeight: "bold",
    marginTop: 5,
  },

  businessText: {
    color: "#555",
    marginTop: 5,
    lineHeight: 19,
  },

  viewMapButton: {
    flexDirection: "row",
    backgroundColor: colors.primaryDark,
    padding: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  viewMapButtonText: {
    color: colors.white,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  viewPageButton: {
    flexDirection: "row",
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  viewPageButtonText: {
    color: colors.white,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  reviewButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  reviewButtonText: {
    color: colors.white,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  emptyText: {
    color: "gray",
    lineHeight: 20,
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 14,
    margin: 5,
    borderRadius: 10,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9B208",
    textAlign: "center",
  },

  statLabel: {
    fontSize: 12,
    color: "gray",
  },

  actionButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  actionText: {
    color: colors.white,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },

  modalSubtitle: {
    color: "gray",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },

  reviewForm: {
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },

  formLabel: {
    fontWeight: "bold",
    marginBottom: 8,
  },

  starRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  reviewInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 12,
  },

  addReviewImagesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F9B208",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  addReviewImagesButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  selectedReviewImageRow: {
    marginBottom: 14,
  },

  selectedReviewImageWrap: {
    marginRight: 10,
    position: "relative",
  },

  selectedReviewImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#eee",
  },

  removeReviewImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  submitReviewButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.55,
  },

  submitReviewText: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  infoBox: {
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  infoText: {
    color: "#555",
    lineHeight: 20,
  },

  reviewListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  reviewCard: {
    backgroundColor: "#f8f8f8",
    padding: 13,
    borderRadius: 12,
    marginBottom: 10,
  },

  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  reviewPseudoName: {
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },

  reviewRating: {
    color: "#F9B208",
    fontWeight: "bold",
  },

  reviewComment: {
    color: "#555",
    lineHeight: 20,
  },

  reviewImageRow: {
    marginTop: 10,
  },

  reviewImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#eee",
  },

  reviewReactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },

  reviewReactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  reviewReactionButtonActive: {
    backgroundColor: "#F9B208",
    borderColor: "#F9B208",
  },

  reviewReactionButtonDisabled: {
    opacity: 0.5,
  },

  reviewReactionText: {
    color: "#222",
    fontWeight: "bold",
  },

  reviewReactionTextActive: {
    color: "#fff",
  },

  currentImagesBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  currentImagesTitle: {
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },

  removeExistingImagesButton: {
    backgroundColor: "#D32F2F",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  removeExistingImagesText: {
    color: "#fff",
    fontWeight: "bold",
  },

  imagesRemovedText: {
    color: "#D32F2F",
    backgroundColor: "#FFECEC",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    fontWeight: "600",
  },

  reviewActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  editReviewButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  editReviewText: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  deleteReviewButton: {
    flex: 1,
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  deleteReviewText: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  cancelEditButton: {
    padding: 11,
    alignItems: "center",
    marginTop: 8,
  },

  cancelEditText: {
    color: "#555",
    fontWeight: "bold",
  },
});