import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { saveToken, saveRole } from '../../utils/tokenUtils';
import axios from 'axios';

import { registerUser } from '../../src/services/authService';
import { useGoogleAuth } from '../../src/services/googleAuthService';
import { API_URL } from '../../src/services/api';

import { useRouter } from 'expo-router';
import colors from '../../src/styles/colors';

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'personal',
  });

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

  const validateRegister = () => {
    const newErrors = {};

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) {
      newErrors.name = 'Name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!form.role) {
      newErrors.role = 'Please select an account type.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==========================
  // Handle Inputs
  // ==========================
  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });

    if (errors[key] || errors.form) {
      setErrors({
        ...errors,
        [key]: '',
        form: '',
      });
    }
  };

  // ==========================
  // Normal Register
  // ==========================
  const handleRegister = async () => {
    if (!validateRegister()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const cleanedForm = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      };

      const data = await registerUser(cleanedForm);

      await saveRole(cleanedForm.role || data.role || 'personal');

      Alert.alert('Success', 'Account created successfully!');

      router.push('/login');
    } catch (err) {
      console.log('Register Error:', err?.response?.data || err);

      const message = getErrorMessage(
        err,
        'Registration failed. Please try again.'
      );

      setErrors({
        form: message,
      });

      Alert.alert('Registration Error', message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Google Register/Login
  // ==========================
  useEffect(() => {
    const handleGoogleRegister = async () => {
      try {
        if (response?.type === 'success') {
          setGoogleLoading(true);

          const { authentication } = response;

          if (!authentication?.idToken) {
            Alert.alert(
              'Google Signup Error',
              'No Google ID token received'
            );
            return;
          }

          const res = await axios.post(`${API_URL}/auth/google`, {
            token: authentication.idToken,
          });

          await saveToken(res.data.token);
          await saveRole(res.data.role || res.data.user?.role || 'personal');

          Alert.alert('Success', 'Google authentication successful');

          router.replace('/home');
        }
      } catch (error) {
        console.log('Google Register Error:', error?.response?.data || error);

        const message = getErrorMessage(
          error,
          'Google signup failed. Please try again.'
        );

        setErrors({
          form: message,
        });

        Alert.alert('Google Signup Error', message);
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleRegister();
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {errors.form ? (
        <Text style={styles.formError}>{errors.form}</Text>
      ) : null}

      {/* Role selection */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          onPress={() => handleChange('role', 'personal')}
          style={[
            styles.roleButton,
            form.role === 'personal' && styles.roleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              form.role === 'personal' && styles.roleTextActive,
            ]}
          >
            Personal / Reviewer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleChange('role', 'business')}
          style={[
            styles.roleButton,
            form.role === 'business' && styles.roleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              form.role === 'business' && styles.roleTextActive,
            ]}
          >
            Business
          </Text>
        </TouchableOpacity>
      </View>

      {errors.role ? (
        <Text style={styles.errorText}>{errors.role}</Text>
      ) : null}

      {/* Name */}
      <TextInput
        placeholder="Name"
        value={form.name}
        style={[
          styles.input,
          errors.name ? styles.inputError : null,
        ]}
        onChangeText={(text) => handleChange('name', text)}
      />

      {errors.name ? (
        <Text style={styles.errorText}>{errors.name}</Text>
      ) : null}

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={form.email}
        style={[
          styles.input,
          errors.email ? styles.inputError : null,
        ]}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(text) => handleChange('email', text)}
      />

      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      {/* Password */}
      <TextInput
        placeholder="Password"
        value={form.password}
        secureTextEntry
        style={[
          styles.input,
          errors.password ? styles.inputError : null,
        ]}
        onChangeText={(text) => handleChange('password', text)}
      />

      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      {/* Register Button */}
      <TouchableOpacity
        style={[
          styles.registerButton,
          loading ? styles.disabledButton : null,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      {/* Google Signup */}
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

      {/* Login Link */}
      <Text style={styles.link} onPress={() => router.push('/login')}>
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
    padding: 14,
    borderRadius: 10,
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

  registerButton: {
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

  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },

  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.muted,
    backgroundColor: colors.white,
  },

  roleButtonActive: {
    backgroundColor: colors.primary,
  },

  roleText: {
    color: colors.text,
  },

  roleTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },

  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },

  link: {
    textAlign: 'center',
    color: colors.primary,
    marginTop: 10,
  },
});