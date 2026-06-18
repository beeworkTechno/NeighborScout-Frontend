import { useState } from 'react';
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
import { signInWithGoogle } from '../../src/services/googleAuthService';
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
  const [successMessage, setSuccessMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });

    if (successMessage) {
      setSuccessMessage('');
    }

    if (errors[key] || errors.form) {
      setErrors({
        ...errors,
        [key]: '',
        form: '',
      });
    }
  };

  const handleRegister = async () => {
    if (loading || googleLoading) return;

    if (!validateRegister()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setSuccessMessage('');

      const cleanedForm = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      };

      const data = await registerUser(cleanedForm);

      await saveRole(cleanedForm.role || data.role || 'personal');

      setSuccessMessage('Account created successfully. Redirecting to login...');

      setForm({
        name: '',
        email: '',
        password: '',
        role: 'personal',
      });

      setTimeout(() => {
        router.replace('/login');
      }, 1000);
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

  const handleGoogleRegister = async () => {
    if (loading || googleLoading) return;

    try {
      setGoogleLoading(true);
      setErrors({});
      setSuccessMessage('');

      const googleResult = await signInWithGoogle();

      console.log('Google register final result:', googleResult);

      if (googleResult.type !== 'success') {
        setErrors({
          form: 'Google signup was cancelled or dismissed.',
        });
        return;
      }

      const accessToken = googleResult.accessToken;
      const idToken = googleResult.idToken;

      console.log('Google register access token exists:', Boolean(accessToken));
      console.log('Google register id token exists:', Boolean(idToken));

      if (!accessToken && !idToken) {
        const message = 'Google token missing. Please try again.';

        setErrors({
          form: message,
        });

        Alert.alert('Google Signup Error', message);
        return;
      }

      const res = await axios.post(`${API_URL}/auth/google`, {
        accessToken,
        idToken,
        token: idToken,
      });

      console.log('Backend Google register response:', res.data);

      if (!res.data.token) {
        const message = 'No token received from server.';

        setErrors({
          form: message,
        });

        Alert.alert('Google Signup Error', message);
        return;
      }

      await saveToken(res.data.token);

      const role = res.data.role || res.data.user?.role || 'personal';
      await saveRole(role);

      setSuccessMessage('Google signup successful. Entering home page...');

      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {successMessage ? (
        <Text style={styles.successBox}>{successMessage}</Text>
      ) : null}

      {errors.form ? (
        <Text style={styles.formError}>{errors.form}</Text>
      ) : null}

      <View style={styles.roleContainer}>
        <TouchableOpacity
          onPress={() => handleChange('role', 'personal')}
          style={[
            styles.roleButton,
            form.role === 'personal' && styles.roleButtonActive,
          ]}
          disabled={loading || googleLoading}
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
          disabled={loading || googleLoading}
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

      <TextInput
        placeholder="Name"
        value={form.name}
        style={[
          styles.input,
          errors.name ? styles.inputError : null,
        ]}
        onChangeText={(text) => handleChange('name', text)}
        editable={!loading && !googleLoading}
      />

      {errors.name ? (
        <Text style={styles.errorText}>{errors.name}</Text>
      ) : null}

      <TextInput
        placeholder="Email"
        value={form.email}
        style={[
          styles.input,
          errors.email ? styles.inputError : null,
        ]}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        onChangeText={(text) => handleChange('email', text)}
        editable={!loading && !googleLoading}
      />

      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      <TextInput
        placeholder="Password"
        value={form.password}
        secureTextEntry
        style={[
          styles.input,
          errors.password ? styles.inputError : null,
        ]}
        onChangeText={(text) => handleChange('password', text)}
        editable={!loading && !googleLoading}
      />

      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.registerButton,
          loading ? styles.disabledButton : null,
        ]}
        onPress={handleRegister}
        disabled={loading || googleLoading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.googleButton,
          googleLoading ? styles.disabledButton : null,
        ]}
        onPress={handleGoogleRegister}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <Text
        style={styles.link}
        onPress={() => router.push('/login')}
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

  successBox: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
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
    backgroundColor: colors.primaryDark,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
    shadowColor: '#000',
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
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
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

  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },

  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.muted,
    backgroundColor: colors.white,
  },

  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  roleText: {
    color: colors.text,
  },

  roleTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  link: {
    textAlign: 'center',
    color: colors.primary,
    marginTop: 10,
  },
});