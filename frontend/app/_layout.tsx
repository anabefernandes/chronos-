import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from '../../frontend/contexts/AuthContext';
import { ToastProvider } from '../../frontend/contexts/ToastContext'; // ajuste o caminho

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <View style={styles.container}>
          <Slot />
        </View>
      </ToastProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
