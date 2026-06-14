import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { useRouter } from "expo-router";
import axios from "axios";

import { saveToken, saveRole, getToken } from "../../utils/tokenUtils";
import { signInWithGoogle } from "../../src/services/googleAuthService";
import { API_URL } from "../../src/services/api";

import colors from "../../src/styles/colors";

export default function LoginScreen() {
  const router = useRouter();
  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const token = await getToken();

      if (token) {
        router.replace("/(tabs)/home");
        return;
      }
    } catch (error) {
      console.log("Check Existing Token Error:", error);
    } finally {
      setCheckingToken(false);
    }
  };

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const getErrorMessage = (error, fallbackMessage) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.errors?.length > 0) {
      return error.response.data.errors[0].msg;
    }

    if (error?.message) {
      return error.message;
    }

    return fallbackMessage;
  };

  const validateLogin = () => {
    const newErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (loading || googleLoading) return;

    if (!validateLogin()) return;

    try {
      setLoading(true);
      setErrors({});
      setSuccessMessage("");

      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.data.token) {
        Alert.alert("Login Error", "No token received from server.");
        return;
      }

      await saveToken(res.data.token);

      const role = res.data.role || res.data.user?.role || "personal";
      await saveRole(role);

      setSuccessMessage("Login successful. Entering home page...");

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1000);
    } catch (error) {
      console.log("Login Error:", error?.response?.data || error);

      const message = getErrorMessage(error, "Login failed. Please try again.");

      setErrors({
        form: message,
      });

      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;

    try {
      setGoogleLoading(true);
      setErrors({});
      setSuccessMessage("");

      const googleResult = await signInWithGoogle();

      console.log("Google login final result:", googleResult);

      if (googleResult.type !== "success") {
        setErrors({
          form: "Google login was cancelled or dismissed.",
        });
        return;
      }

      const accessToken = googleResult.accessToken;
      const idToken = googleResult.idToken;

      console.log("Final access token exists:", Boolean(accessToken));
      console.log("Final id token exists:", Boolean(idToken));

      if (!accessToken && !idToken) {
        setErrors({
          form: "Google token missing. Please try again.",
        });

        Alert.alert(
          "Google Login Error",
          "Google token missing. Please try again."
        );

        return;
      }

      const res = await axios.post(`${API_URL}/auth/google`, {
        accessToken,
        idToken,
        token: idToken,
      });

      console.log("Backend Google login response:", res.data);

      if (!res.data.token) {
        setErrors({
          form: "No token received from server.",
        });

        Alert.alert("Google Login Error", "No token received from server.");
        return;
      }

      await saveToken(res.data.token);

      const role = res.data.role || res.data.user?.role || "personal";
      await saveRole(role);

      setSuccessMessage("Google login successful. Entering home page...");

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1000);
    } catch (error) {
      console.log("Google Login Error:", error?.response?.data || error);

      const message = getErrorMessage(
        error,
        "Google login failed. Please try again."
      );

      setErrors({
        form: message,
      });

      Alert.alert("Google Login Error", message);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking login...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NeighborScout Login</Text>

      {successMessage ? (
        <Text style={styles.successBox}>{successMessage}</Text>
      ) : null}

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);

          if (successMessage) setSuccessMessage("");

          if (errors.email || errors.form) {
            setErrors({
              ...errors,
              email: "",
              form: "",
            });
          }
        }}
        style={[styles.input, errors.email ? styles.inputError : null]}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordInputRef.current?.focus()}
      />

      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <TextInput
        ref={passwordInputRef}
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);

          if (successMessage) setSuccessMessage("");

          if (errors.password || errors.form) {
            setErrors({
              ...errors,
              password: "",
              form: "",
            });
          }
        }}
        style={[styles.input, errors.password ? styles.inputError : null]}
        secureTextEntry
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.loginButton, loading ? styles.disabledButton : null]}
        onPress={handleLogin}
        disabled={loading || googleLoading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.googleButton, googleLoading ? styles.disabledButton : null]}
        onPress={handleGoogleLogin}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.registerText}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  loadingText: {
    marginTop: 10,
    color: colors.text,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.bg,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: colors.text,
  },

  successBox: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    backgroundColor: colors.white,
  },

  inputError: {
    borderColor: "#D32F2F",
  },

  errorText: {
    color: "#D32F2F",
    marginBottom: 10,
    fontSize: 13,
  },

  formError: {
    backgroundColor: "#FFECEC",
    color: "#D32F2F",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: "center",
  },

  loginButton: {
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  googleButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },

  registerText: {
    textAlign: "center",
    color: colors.primary,
  },
});