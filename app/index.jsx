import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔍 check login status
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
  }, []);

  // 🚪 logout function
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setIsLoggedIn(false);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NeighborScout</Text>
      <Text style={styles.subtitle}>
        Discover events and connect with your community
      </Text>

      {/* 🔥 IF LOGGED IN → SHOW LOGOUT */}
      {isLoggedIn ? (
        <Pressable
          style={[styles.button, { backgroundColor: '#ef4444' }]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
      ) : (
        <>
          {/* LOGIN BUTTON */}
          <Pressable
            style={[styles.button, { backgroundColor: '#3b82f6' }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          {/* REGISTER BUTTON */}
          <Pressable
            style={[styles.button, { backgroundColor: '#10b981' }]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.buttonText}>Register</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});