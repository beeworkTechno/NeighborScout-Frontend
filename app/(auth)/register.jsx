import { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { registerUser } from "../../src/services/authService";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    try {
      const data = await registerUser(form);

      console.log("Registered:", data);

      // store token
      // AsyncStorage is preferred in Expo
      Alert.alert("Success", "User registered!");
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <TextInput
        placeholder="Name"
        onChangeText={(text) => handleChange("name", text)}
        style={{ borderWidth: 1, padding: 10 }}
      />

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

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}