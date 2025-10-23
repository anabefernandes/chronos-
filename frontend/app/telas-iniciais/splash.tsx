import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';
import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const LogoRelogio = require('../../assets/images/iniciais/relogio_logo.png');
const LogoTexto = require('../../assets/images/iniciais/nome_logo.png');

const { width, height } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();

  const spinValue = useRef(new Animated.Value(0)).current;
  const animValue = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular
  });

  // Logo girando
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    const timer = setTimeout(() => {
      router.push('/telas-iniciais/login');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Pontinhos
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Gradiente
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false
        })
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const startX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });
  const startY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] });
  const endX = animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  const endY = animValue.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <AnimatedLinearGradient
      colors={['#4DC9EA', '#3C188F']}
      start={{ x: startX as any, y: startY as any }}
      end={{ x: endX as any, y: endY as any }}
      style={styles.container}
    >
      <View style={styles.logoWrapper}>
        <View style={styles.logoContainer}>
          <Animated.Image
            source={LogoRelogio}
            style={[styles.relogio, { transform: [{ rotate: spin }] }]}
            resizeMode="contain"
          />
          <Image source={LogoTexto} style={styles.texto} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.text}>
          Otimizando seu tempo
          <Text style={{ fontWeight: 'bold' }}>{dots}</Text>
        </Text>
      </View>
    </AnimatedLinearGradient>
  );
}

// LinearGradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  relogio: {
    width: 90,
    height: 90,
    left: 35
  },
  texto: {
    height: 90,
    flexShrink: 1,
    marginLeft: -35
  },
  textContainer: {
    marginTop: -10
  },
  text: {
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
    textAlign: 'center'
  }
});
