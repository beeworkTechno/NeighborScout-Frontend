import { useRouter } from "expo-router";
import { useState } from "react";
import { View, TextInput, Button, Alert, Text, StyleSheet } from "react-native";
import { loginUser } from "../../src/services/authService";

export default function Login() {
  const router = useRouter(); // ✅ ADD THIS

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleLogin = async () => {
    console.log("🚀 Login button clicked");
    console.log("Form data:", form);

    try {
      const data = await loginUser(form);

      console.log("✅ Login success:", data);

      Alert.alert("Success", "Login successful!");

      // 🔥 REDIRECT AFTER SUCCESS LOGIN
      router.replace("/"); // or "/home" if you have a home screen

    } catch (err) {
      console.log("❌ Login failed");
      console.log("Error message:", err.message);
      console.log("Backend response:", err.response?.data);
      console.log("Full error:", err);

      Alert.alert("Error", "Login failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        placeholder="Email"
        onChangeText={(text) => handleChange("email", text)}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => handleChange("password", text)}
        style={styles.input}
      />

      <Button title="Login" onPress={handleLogin} />

      <Text style={styles.link}>
        Don’t have an account? Register
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  link: {
    marginTop: 15,
    color: "blue",
    textAlign: "center",
  },
});