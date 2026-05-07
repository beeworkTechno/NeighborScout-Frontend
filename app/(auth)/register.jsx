import { useState } from "react";
import { View, TextInput, Button, Text, Alert, StyleSheet } from "react-native";
import { registerUser } from "../../src/services/authService";
import { useRouter } from "expo-router";

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    console.log("🚀 Register button clicked");
    console.log("Form data:", form);

    try {
      const data = await registerUser(form);

      console.log("✅ Registered successfully:", data);

      Alert.alert("Success", "Account created successfully!");

      // redirect to login after register
      router.push("/login");
    } catch (err) {
      console.log("❌ Registration failed");
      console.log("Error message:", err.message);
      console.log("Backend response:", err.response?.data);
      console.log("Full error:", err);
      
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Name"
        style={styles.input}
        onChangeText={(text) => handleChange("name", text)}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={(text) => handleChange("email", text)}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(text) => handleChange("password", text)}
      />

      <Button title="Register" onPress={handleRegister} />

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