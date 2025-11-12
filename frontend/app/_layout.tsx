import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ✅ import necessário
import { AuthProvider } from '../../frontend/contexts/AuthContext';
import { ToastProvider } from '../../frontend/contexts/ToastContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <View style={styles.container}>
            <Slot />
          </View>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
