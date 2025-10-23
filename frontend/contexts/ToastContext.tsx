// frontend/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { Text, StyleSheet, Animated, Dimensions } from 'react-native';

type ToastContextType = {
  showToast: (message: string, type?: 'success' | 'error', duration?: number) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {}
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string, toastType: 'success' | 'error' = 'success', duration = 1800) => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Aparece quase instantâneo
    opacity.setValue(1);

    // Desaparece depois do tempo definido
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setVisible(false));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { backgroundColor: type === 'success' ? '#3C188F' : '#E74C3C', opacity }]}>
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    width: width * 0.9
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  }
});
