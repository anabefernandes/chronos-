import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, Animated, Easing } from 'react-native';

const frases = [
  'Organize sua rotina com o Chronos ⏳',
  'Um dia bem planejado vale por dois 💡',
  'Seu tempo, sua produtividade 🚀',
  'Controle e praticidade na palma da mão 📱',
  'Cada segundo conta ⌛',
  'Chronos — tecnologia a favor do cuidado ⏳'
];

export default function Footer() {
  const [fraseIndex, setFraseIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const animarEntrada = () => {
    fadeAnim.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    animarEntrada();
    const intervalo = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      }).start(() => {
        setFraseIndex((prev) => (prev + 1) % frases.length);
        animarEntrada();
      });
    }, 5000); // troca a cada 5 segundos

    return () => clearInterval(intervalo);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: fadeAnim,
            transform: [{ translateY }]
          }
        ]}
      >
        {frases[fraseIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 30,
    minHeight: 80,
    justifyContent: 'center'
  },
  line: {
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(0, 111, 149, 0.26)',
    marginBottom: 15
  },
  text: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#006F95',
    fontFamily: 'Poppins_600SemiBold'
  }
});
