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
import axios from 'axios';

import { saveToken, saveRole } from '../../utils/tokenUtils';

import { useGoogleAuth } from '../../src/services/googleAuthService';

import { API_URL } from '../../src/services/api';

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

  // ==========================
  // Google Auth
  // ==========================
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
        `${API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      await saveToken(res.data.token);

      const role =
        res.data.role ||
        res.data.user?.role ||
        'personal';

      await saveRole(role);

      Alert.alert(
        'Success',
        'Login successful'
      );

      router.replace('/home');

    } catch (error) {

      console.log(
        'Login Error:',
        error?.response?.data || error
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error.message ||
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

          console.log(
            'Google response:',
            response
          );

          const token =
            response.authentication?.idToken;

          if (!token) {

            Alert.alert(
              'Google Login Error',
              'No Google ID token received'
            );

            return;
          }

          // Send Google token to backend
          const res = await axios.post(
            `${API_URL}/api/auth/google`,
            {
              token,
            }
          );

          await saveToken(res.data.token);

          const role =
            res.data.role ||
            res.data.user?.role ||
            'personal';

          await saveRole(role);

          Alert.alert(
            'Success',
            'Google login successful'
          );

          router.replace('/home');
        }

      } catch (error) {

        console.log(
          'Google Login Error:',
          error?.response?.data || error
        );

        Alert.alert(
          'Google Login Error',
          error?.response?.data?.message ||
            error.message ||
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