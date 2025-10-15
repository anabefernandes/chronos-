import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../../frontend/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <Slot />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
