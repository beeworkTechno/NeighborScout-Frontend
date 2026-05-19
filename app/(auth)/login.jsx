import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

import { useRouter } from 'expo-router';
import { saveToken } from '../tokenUtils';
import axios from 'axios';

import { useGoogleAuth } from '../../src/services/googleAuthService';
import * as AuthSession from 'expo-auth-session';

console.log(
  AuthSession.makeRedirectUri({
    useProxy: true,
  })
);

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google Auth
  const {
    response,
    promptAsync,
  } = useGoogleAuth();

  // ==========================
  // Normal Login
  // ==========================
  const handleLogin = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        {
          email,
          password,
        }
      );

     await saveToken(res.data.token);

      Alert.alert('Success', 'Login successful');

      router.replace('/');

    } catch (error) {
      console.log(error);

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Login failed'
      );
    }
  };

  // ==========================
  // Google Login
  // ==========================
  useEffect(() => {
    const handleGoogleLogin = async () => {
      try {
        if (response?.type === 'success') {

          const { authentication } = response;

          const res = await axios.post(
            'http://10.0.2.2:5000/api/auth/google',
            {
              token: authentication.idToken,
            }
          );

          await AsyncStorage.setItem(
            'token',
            res.data.token
          );

          Alert.alert(
            'Success',
            'Google login successful'
          );

          router.replace('/');

        }
      } catch (error) {

        console.log(error);

        Alert.alert(
          'Error',
          'Google login failed'
        );

      }
    };

    handleGoogleLogin();
  }, [response]);

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        NeighborScout Login
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>
          Login
        </Text>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
      >
        <Text style={styles.buttonText}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Register */}
      <TouchableOpacity
        onPress={() => router.push('/register')}
      >
        <Text style={styles.registerText}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },

  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },

  googleButton: {
    backgroundColor: '#DB4437',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  registerText: {
    textAlign: 'center',
    color: '#007AFF',
  },
});