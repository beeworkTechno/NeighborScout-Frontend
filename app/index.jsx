import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NeighborScout</Text>
      <Text style={styles.subtitle}>
        Discover events and connect with your community
      </Text>

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