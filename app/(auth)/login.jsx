import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { useRouter } from 'expo-router';
import axios from 'axios';

import { saveToken, saveRole } from '../../utils/tokenUtils';
import { useGoogleAuth } from '../../src/services/googleAuthService';
import { API_URL } from '../../src/services/api';

import * as AuthSession from 'expo-auth-session';
import colors from '../../src/styles/colors';

console.log(
  AuthSession.makeRedirectUri({
    useProxy: true,
  })
);

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ==========================
  // Google Auth
  // ==========================
  const { response, promptAsync } = useGoogleAuth();

  // ==========================
  // Helpers
  // ==========================
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
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // Normal Login
  // ==========================
  const handleLogin = async () => {
    if (!validateLogin()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      await saveToken(res.data.token);

      const role = res.data.role || res.data.user?.role || 'personal';

      await saveRole(role);

      Alert.alert('Success', 'Login successful');

      router.replace('/home');
    } catch (error) {
      console.log('Login Error:', error?.response?.data || error);

      const message = getErrorMessage(error, 'Login failed. Please try again.');

      setErrors({
        form: message,
      });

      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Google Login
  // ==========================
  useEffect(() => {
    const handleGoogleLogin = async () => {
      try {
        if (response?.type === 'success') {
          setGoogleLoading(true);

          console.log('Google response:', response);

          const token = response.authentication?.idToken;

          if (!token) {
            Alert.alert('Google Login Error', 'No Google ID token received');
            return;
          }

          const res = await axios.post(`${API_URL}/auth/google`, {
            token,
          });

          await saveToken(res.data.token);

          const role = res.data.role || res.data.user?.role || 'personal';

          await saveRole(role);

          Alert.alert('Success', 'Google login successful');

          router.replace('/home');
        }
      } catch (error) {
        console.log('Google Login Error:', error?.response?.data || error);

        const message = getErrorMessage(
          error,
          'Google login failed. Please try again.'
        );

        setErrors({
          form: message,
        });

        Alert.alert('Google Login Error', message);
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleLogin();
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NeighborScout Login</Text>

      {errors.form ? (
        <Text style={styles.formError}>{errors.form}</Text>
      ) : null}

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);

          if (errors.email || errors.form) {
            setErrors({
              ...errors,
              email: '',
              form: '',
            });
          }
        }}
        style={[
          styles.input,
          errors.email ? styles.inputError : null,
        ]}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      {/* Password */}
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);

          if (errors.password || errors.form) {
            setErrors({
              ...errors,
              password: '',
              form: '',
            });
          }
        }}
        style={[
          styles.input,
          errors.password ? styles.inputError : null,
        ]}
        secureTextEntry
      />

      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      {/* Login Button */}
      <TouchableOpacity
        style={[
          styles.loginButton,
          loading ? styles.disabledButton : null,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity
        style={[
          styles.googleButton,
          googleLoading ? styles.disabledButton : null,
        ]}
        onPress={() => promptAsync()}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      {/* Register */}
      <TouchableOpacity onPress={() => router.push('/register')}>
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
    backgroundColor: colors.bg,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: colors.text,
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
    borderColor: '#D32F2F',
  },

  errorText: {
    color: '#D32F2F',
    marginBottom: 10,
    fontSize: 13,
  },

  formError: {
    backgroundColor: '#FFECEC',
    color: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
  },

  loginButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
  },

  googleButton: {
    backgroundColor: colors.primaryDark,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  registerText: {
    textAlign: 'center',
    color: colors.primary,
  },
});