import { View, Text, StyleSheet } from 'react-native';
import colors from '../../src/styles/colors';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  text: { fontSize: 20, fontWeight: '500', color: colors.text },
});