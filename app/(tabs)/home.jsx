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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import BusinessMap from "../../components/BusinessMap";
import api from "../../src/services/api";
import {
  getToken,
  getRole,
  saveRole,
  clearToken,
} from "../../utils/tokenUtils";

export default function HomeScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("map");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("personal");
  const [loading, setLoading] = useState(true);

  const [businesses, setBusinesses] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [mapSelectedBusiness, setMapSelectedBusiness] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedBusinessReviews, setSelectedBusinessReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [editingReview, setEditingReview] = useState(null);
  const [editingRating, setEditingRating] = useState(5);
  const [editingComment, setEditingComment] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

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
      await fetchBusinesses();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get("/auth/me");

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
  };

  const resetEditForm = () => {
    setEditingReview(null);
    setEditingRating(5);
    setEditingComment("");
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

      await api.post(`/reviews/${selectedBusiness._id}`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
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

      await api.put(`/reviews/${editingReview._id}`, {
        rating: editingRating,
        comment: editingComment.trim(),
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

  const getFilteredBusinesses = (list) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter((business) => {
      const name = business.name?.toLowerCase() || "";
      const category = business.category?.toLowerCase() || "";
      const address = business.address?.toLowerCase() || "";
      const description = business.description?.toLowerCase() || "";

      return (
        name.includes(query) ||
        category.includes(query) ||
        address.includes(query) ||
        description.includes(query)
      );
    });
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

  const renderSearchBar = (placeholder = "Search businesses by name, category, or address...") => (
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
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPersonalDashboard = () => {
    const filteredBusinesses = getFilteredBusinesses(businesses);

    return (
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userName}!</Text>
            <Text style={styles.subtitle}>
              Discover and review local businesses
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Ionicons name="person-circle-outline" size={44} color="#F9B208" />
          </TouchableOpacity>
        </View>

        {renderSearchBar("Search businesses by name, category, or address...")}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Businesses</Text>

          {loading ? (
            <ActivityIndicator color="#F9B208" />
          ) : filteredBusinesses.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? "No businesses match your search."
                : "No businesses found yet."}
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

          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Ionicons name="person-circle-outline" size={44} color="#F9B208" />
          </TouchableOpacity>
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
              No businesses match your search.
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
                  Business accounts can view reviews but cannot create, edit, or
                  delete reviews.
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
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#222",
    fontSize: 15,
    outlineStyle: "none",
  },

  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
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

  businessCard: {
    backgroundColor: "#fff",
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
    backgroundColor: "#1976D2",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  viewMapButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },

  viewPageButton: {
    flexDirection: "row",
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  viewPageButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },

  reviewButton: {
    flexDirection: "row",
    backgroundColor: "#F9B208",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  reviewButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
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
    backgroundColor: "#F9B208",
    padding: 13,
    borderRadius: 10,
    marginTop: 14,
  },

  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
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

  submitReviewButton: {
    backgroundColor: "#F9B208",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  submitReviewText: {
    color: "#fff",
    fontWeight: "bold",
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

  reviewActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  editReviewButton: {
    flex: 1,
    backgroundColor: "#F9B208",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  editReviewText: {
    color: "#fff",
    fontWeight: "bold",
  },

  deleteReviewButton: {
    flex: 1,
    backgroundColor: "#D32F2F",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteReviewText: {
    color: "#fff",
    fontWeight: "bold",
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