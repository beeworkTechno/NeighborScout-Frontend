import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { saveToken, saveRole } from "../../utils/tokenUtils";
import axios from "axios";

import { registerUser } from "../../src/services/authService";
import { useGoogleAuth } from "../../src/services/googleAuthService";

import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "personal",
  });

  // ==========================
  // Google Auth
  // ==========================
  const {
    response,
    promptAsync,
  } = useGoogleAuth();

  // ==========================
  // Handle Inputs
  // ==========================
  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  // ==========================
  // Normal Register
  // ==========================
  const handleRegister = async () => {
    try {
      const data = await registerUser(form);

      await saveRole(form.role || data.role || 'personal');
      Alert.alert("Success", "Account created successfully!");
      router.push("/login");

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Registration failed"
      );

    }
  };

  // ==========================
  // Google Register/Login
  // ==========================
  useEffect(() => {
    const handleGoogleRegister = async () => {
      try {
        if (response?.type === "success") {

          const { authentication } = response;

          const res = await axios.post(
            "http://localhost:5001/api/auth/google",
            {
              token: authentication.idToken,
            }
          );

          // Save JWT and role
          await saveToken(res.data.token);
          await saveRole(res.data.role || res.data.user?.role || 'personal');

          Alert.alert(
            "Success",
            "Google authentication successful"
          );

          // Redirect to home
          router.replace("/home");

        }
      } catch (error) {

        console.log(error);

        Alert.alert(
          "Error",
          "Google signup failed"
        );

      }
    };

    handleGoogleRegister();
  }, [response]);

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Create Account
      </Text>

      {/* Role selection */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => handleChange('role', 'personal')}
          style={[styles.roleButton, form.role === 'personal' && styles.roleButtonActive]}
        >
          <Text style={styles.roleText}>Personal / Reviewer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleChange('role', 'business')}
          style={[styles.roleButton, form.role === 'business' && styles.roleButtonActive]}
        >
          <Text style={styles.roleText}>Business</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <TextInput
        placeholder="Name"
        style={styles.input}
        onChangeText={(text) =>
          handleChange("name", text)
        }
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        onChangeText={(text) =>
          handleChange("email", text)
        }
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(text) =>
          handleChange("password", text)
        }
      />

      {/* Register Button */}
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>
          Register
        </Text>
      </TouchableOpacity>

      {/* Google Signup */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
      >
        <Text style={styles.buttonText}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <Text
        style={styles.link}
        onPress={() => router.push("/login")}
      >
        Already have an account? Login
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
  },

  registerButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  googleButton: {
    backgroundColor: "#DB4437",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff'
  },
  roleButtonActive: {
    backgroundColor: '#378ADD',
  },
  roleText: {
    color: '#000'
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    color: "#007AFF",
    marginTop: 10,
  },
});