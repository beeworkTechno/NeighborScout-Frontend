import { useState } from "react";
import { View, TextInput, Button, Alert } from "react-native";
import { loginUser } from "../../src/services/authService";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleLogin = async () => {
    try {
      const data = await loginUser(form);

      console.log("Logged in:", data);

      // store token later with AsyncStorage
      Alert.alert("Success", "Login successful!");
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Login failed");
    }
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <TextInput
        placeholder="Email"
        onChangeText={(text) => handleChange("email", text)}
        style={{ borderWidth: 1, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={(text) => handleChange("password", text)}
        style={{ borderWidth: 1, padding: 10 }}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}