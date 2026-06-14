import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api, { API_URL } from "../src/services/api";

export default function SuperAdminReviewDashboard() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [adminNotes, setAdminNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    checkExistingSuperAdminSession();
  }, []);

  useEffect(() => {
    if (user?.role === "superadmin") {
      loadReportedReviews();
    }
  }, [statusFilter, user]);

  const saveSuperAdminSession = async (token, role) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("role", role);
  };

  const clearSuperAdminSession = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("role");
    setUser(null);
    setReports([]);
  };

  const checkExistingSuperAdminSession = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setUser(null);
        return;
      }

      const userResponse = await api.get("/auth/me");
      const currentUser = userResponse.data;

      if (currentUser?.role !== "superadmin") {
        await clearSuperAdminSession();
        return;
      }

      setUser(currentUser);
      await loadReportedReviews();
    } catch (error) {
      console.log("Super Admin Session Error:", error?.response?.data || error);
      await clearSuperAdminSession();
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Info", "Enter superadmin email and password.");
      return;
    }

    try {
      setLoginLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const token =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.data?.token;

      if (!token) {
        Alert.alert("Login Error", "No token returned from backend.");
        return;
      }

      await saveSuperAdminSession(token, "superadmin");

      const userResponse = await api.get("/auth/me");
      const currentUser = userResponse.data;

      if (currentUser?.role !== "superadmin") {
        await clearSuperAdminSession();

        Alert.alert(
          "Access Denied",
          "This account is not a superadmin account."
        );

        return;
      }

      setUser(currentUser);
      setEmail("");
      setPassword("");

      await loadReportedReviews();

      Alert.alert("Success", "Superadmin logged in.");
    } catch (error) {
      console.log("Super Admin Login Error:", error?.response?.data || error);

      Alert.alert(
        "Login Error",
        error?.response?.data?.message ||
          "Could not login as superadmin. Check email and password."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const loadReportedReviews = async () => {
    try {
      const response = await api.get(
        `/reviews/admin/reports?status=${statusFilter}`
      );

      setReports(response.data || []);
    } catch (error) {
      console.log(
        "Load Reported Reviews Error:",
        error?.response?.data || error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message || "Could not load reported reviews."
      );

      setReports([]);
    }
  };

  const getReportCardKey = (reviewId, reportId) => {
    return `${reviewId}-${reportId}`;
  };

  const getAdminNote = (reviewId, reportId) => {
    return adminNotes[getReportCardKey(reviewId, reportId)] || "";
  };

  const updateAdminNote = (reviewId, reportId, value) => {
    setAdminNotes((previousNotes) => ({
      ...previousNotes,
      [getReportCardKey(reviewId, reportId)]: value,
    }));
  };

  const clearAdminNote = (reviewId, reportId) => {
    setAdminNotes((previousNotes) => {
      const nextNotes = { ...previousNotes };
      delete nextNotes[getReportCardKey(reviewId, reportId)];
      return nextNotes;
    });
  };

  const performReportAction = async ({
    reviewId,
    reportId,
    action,
    successMessage,
  }) => {
    const adminNote = getAdminNote(reviewId, reportId).trim();

    if (!adminNote) {
      Alert.alert(
        "Admin Message Required",
        "Please write a custom admin message before taking action."
      );
      return;
    }

    try {
      setActionLoadingId(getReportCardKey(reviewId, reportId));

      await api.put(`/reviews/admin/reports/${reviewId}/${reportId}`, {
        action,
        adminNote,
      });

      clearAdminNote(reviewId, reportId);

      await loadReportedReviews();

      Alert.alert("Success", successMessage);
    } catch (error) {
      console.log("Report Action Error:", error?.response?.data || error);

      Alert.alert(
        "Action Error",
        error?.response?.data?.message ||
          "Could not update this report. Please try again."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectReportKeepReviewPublic = async (reviewId, reportId) => {
    const runAction = async () => {
      await performReportAction({
        reviewId,
        reportId,
        action: "dismiss",
        successMessage: "Report rejected. Review remains public.",
      });
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Reject this report and keep the review public?"
      );

      if (confirmed) {
        await runAction();
      }

      return;
    }

    Alert.alert(
      "Reject Report",
      "Reject this report and keep the review public?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject Report",
          style: "destructive",
          onPress: runAction,
        },
      ]
    );
  };

  const acceptReportHideReview = async (reviewId, reportId) => {
    const runAction = async () => {
      await performReportAction({
        reviewId,
        reportId,
        action: "reject_review",
        successMessage:
          "Report accepted. Review is hidden from public but kept in database.",
      });
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Accept this report and hide the review from public?"
      );

      if (confirmed) {
        await runAction();
      }

      return;
    }

    Alert.alert(
      "Accept Report",
      "Accept this report and hide the review from public?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept & Hide Review",
          style: "destructive",
          onPress: runAction,
        },
      ]
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

  const renderLoginScreen = () => {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginIconBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={42}
              color="#F9B208"
            />
          </View>

          <Text style={styles.loginTitle}>Superadmin Access</Text>

          <Text style={styles.loginSubtitle}>
            This hidden page is only for superadmin review moderation.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Superadmin email"
            placeholderTextColor="#999"
            style={styles.loginInput}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#999"
            style={styles.loginInput}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, loginLoading && styles.disabledButton]}
            onPress={handleSuperAdminLogin}
            disabled={loginLoading}
            activeOpacity={0.8}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Enter Dashboard</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.loginWarning}>
            This page is not linked anywhere in the app, but it is still
            protected by superadmin authentication.
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  const renderReportItem = (review, report) => {
    const cardKey = getReportCardKey(review._id, report._id);
    const isActionLoading = actionLoadingId === cardKey;

    return (
      <View key={cardKey} style={styles.reportBox}>
        <View style={styles.reportHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportReason}>
              Report Reason: {report.reason || "inappropriate"}
            </Text>

            <Text style={styles.reportStatus}>
              Status: {report.status || "pending"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              report.status === "pending"
                ? styles.pendingBadge
                : report.status === "verified"
                ? styles.verifiedBadge
                : styles.dismissedBadge,
            ]}
          >
            <Text style={styles.statusBadgeText}>{report.status}</Text>
          </View>
        </View>

        <Text style={styles.reportSmallText}>Report ID: {report._id}</Text>

        <Text style={styles.reportSmallText}>
          Reported by user: {report.user}
        </Text>

        {report.details ? (
          <Text style={styles.reportDetails}>Details: {report.details}</Text>
        ) : (
          <Text style={styles.reportDetails}>Details: No details provided.</Text>
        )}

        {report.status === "pending" ? (
          <>
            <Text style={styles.adminLabel}>Custom Admin Message</Text>

            <TextInput
              value={getAdminNote(review._id, report._id)}
              onChangeText={(value) =>
                updateAdminNote(review._id, report._id, value)
              }
              placeholder="Write why you accepted/rejected this report..."
              placeholderTextColor="#999"
              style={styles.adminNoteInput}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.rejectReportButton,
                  isActionLoading && styles.disabledButton,
                ]}
                onPress={() =>
                  rejectReportKeepReviewPublic(review._id, report._id)
                }
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle-outline"
                      size={17}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Reject Report</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.acceptReportButton,
                  isActionLoading && styles.disabledButton,
                ]}
                onPress={() => acceptReportHideReview(review._id, report._id)}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={17}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>Accept & Hide</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.reviewedBox}>
            <Text style={styles.reviewedText}>
              Admin Note: {report.adminNote || "No admin note."}
            </Text>

            <Text style={styles.reviewedText}>
              Reviewed At:{" "}
              {report.reviewedAt
                ? new Date(report.reviewedAt).toLocaleString()
                : "Not reviewed"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderReportedReviewCard = (review) => {
    const reviewReports = review.reports || [];

    return (
      <View key={review._id} style={styles.reviewCard}>
        <View style={styles.reviewTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.businessName}>
              {review.business?.name || "Unknown Business"}
            </Text>

            <Text style={styles.businessInfo}>
              {review.business?.category || "Business"} ·{" "}
              {review.business?.address || "No address"}
            </Text>
          </View>

          <View
            style={[
              styles.moderationBadge,
              review.moderationStatus === "hidden"
                ? styles.hiddenBadge
                : styles.activeBadge,
            ]}
          >
            <Text style={styles.moderationBadgeText}>
              {review.moderationStatus}
            </Text>
          </View>
        </View>

        <View style={styles.reviewContentBox}>
          <Text style={styles.reviewAuthor}>
            Review by: {review.pseudoName || "Anonymous Neighbor"}
          </Text>

          <Text style={styles.reviewRating}>{review.rating} ⭐</Text>

          <Text style={styles.reviewComment}>
            {review.comment || "No comment provided."}
          </Text>

          {renderReviewImages(review)}

          <View style={styles.reviewMetaRow}>
            <Text style={styles.reviewMetaText}>👍 {review.likeCount || 0}</Text>

            <Text style={styles.reviewMetaText}>
              👎 {review.dislikeCount || 0}
            </Text>

            <Text style={styles.reviewMetaText}>
              Reports: {review.reports?.length || 0}
            </Text>
          </View>

          <Text style={styles.reviewId}>Review ID: {review._id}</Text>
        </View>

        <Text style={styles.reportsTitle}>Reports</Text>

        {reviewReports.length === 0 ? (
          <Text style={styles.emptyText}>No reports found.</Text>
        ) : (
          reviewReports.map((report) => renderReportItem(review, report))
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator color="#F9B208" size="large" />
        <Text style={styles.loadingText}>Checking superadmin access...</Text>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== "superadmin") {
    return renderLoginScreen();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Super Admin Review Dashboard</Text>
            <Text style={styles.subtitle}>
              Only reported reviews appear here. Normal reviews stay public.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={clearSuperAdminSession}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={17} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterBox}>
          <Text style={styles.filterTitle}>Filter Reports</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["pending", "verified", "dismissed", "all"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {statusFilter === "pending"
              ? "Pending Reported Reviews"
              : `${statusFilter} Reported Reviews`}
          </Text>

          {reports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="checkmark-done-outline"
                size={38}
                color="#F9B208"
              />
              <Text style={styles.emptyTitle}>No reported reviews found</Text>
              <Text style={styles.emptyText}>
                Reviews will appear here only after another personal user reports
                them.
              </Text>
            </View>
          ) : (
            reports.map((review) => renderReportedReviewCard(review))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  centerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#555",
  },

  loginContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loginCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#f8f8f8",
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },

  loginIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#F9B208",
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
  },

  loginSubtitle: {
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 20,
  },

  loginInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
    outlineStyle: "none",
  },

  loginButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },

  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  loginWarning: {
    color: "gray",
    fontSize: 12,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },

  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    marginTop: 5,
    color: "#666",
    lineHeight: 20,
  },

  logoutButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 16,
  },

  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  filterBox: {
    padding: 20,
    backgroundColor: "#FFF8E1",
  },

  filterTitle: {
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
  },

  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: "#F9B208",
    borderColor: "#F9B208",
  },

  filterChipText: {
    color: "#333",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  filterChipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },

  content: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
    textTransform: "capitalize",
  },

  emptyBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginTop: 8,
    marginBottom: 4,
  },

  emptyText: {
    color: "gray",
    lineHeight: 20,
  },

  reviewCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },

  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  businessName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },

  businessInfo: {
    color: "#666",
    marginTop: 4,
    lineHeight: 19,
  },

  moderationBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: "flex-start",
  },

  activeBadge: {
    backgroundColor: "#E8F5E9",
  },

  hiddenBadge: {
    backgroundColor: "#FFEBEE",
  },

  moderationBadgeText: {
    fontWeight: "bold",
    color: "#222",
    fontSize: 12,
    textTransform: "capitalize",
  },

  reviewContentBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },

  reviewAuthor: {
    fontWeight: "bold",
    color: "#222",
    marginBottom: 5,
  },

  reviewRating: {
    color: "#F9B208",
    fontWeight: "bold",
    marginBottom: 6,
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

  reviewMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },

  reviewMetaText: {
    color: "#555",
    fontWeight: "600",
  },

  reviewId: {
    color: "gray",
    fontSize: 12,
    marginTop: 8,
  },

  reportsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
  },

  reportBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },

  reportReason: {
    fontWeight: "bold",
    color: "#222",
    textTransform: "capitalize",
  },

  reportStatus: {
    color: "#555",
    marginTop: 4,
    textTransform: "capitalize",
  },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    alignSelf: "flex-start",
  },

  pendingBadge: {
    backgroundColor: "#FFF8E1",
  },

  verifiedBadge: {
    backgroundColor: "#E8F5E9",
  },

  dismissedBadge: {
    backgroundColor: "#eee",
  },

  statusBadgeText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "capitalize",
  },

  reportSmallText: {
    color: "gray",
    fontSize: 12,
    marginTop: 3,
  },

  reportDetails: {
    color: "#555",
    marginTop: 8,
    lineHeight: 20,
  },

  adminLabel: {
    fontWeight: "bold",
    color: "#222",
    marginTop: 12,
    marginBottom: 7,
  },

  adminNoteInput: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    minHeight: 85,
    textAlignVertical: "top",
    marginBottom: 12,
    outlineStyle: "none",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  rejectReportButton: {
    flex: 1,
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  acceptReportButton: {
    flex: 1,
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },

  reviewedBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },

  reviewedText: {
    color: "#555",
    lineHeight: 20,
  },
});