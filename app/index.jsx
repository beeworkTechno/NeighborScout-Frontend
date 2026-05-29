import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import { getToken } from "../utils/tokenUtils";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await getToken();

      setTimeout(() => {
        if (token) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }, 300);
    } catch (error) {
      console.log("Auto Login Check Error:", error);
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F9B208" />
      <Text style={styles.text}>Checking login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  text: {
    marginTop: 12,
    color: "#555",
    fontSize: 15,
    fontWeight: "600",
  },
});