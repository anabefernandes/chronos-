import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';
import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';
import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const LogoTexto = require('../../assets/images/iniciais/nome_logo.png');

const { width, height } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Splash() {
  const router = useRouter();
  const animValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular
  });

  useEffect(() => {
    // 🌈 Movimento diagonal super suave (vai e volta)
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 6000, // mais lento para suavidade
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false
        })
      ])
    ).start();

    // ✨ Fade in dos elementos
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true
    }).start();

    const timer = setTimeout(() => {
      router.push('/telas-iniciais/login');
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 🌀 Movimentação diagonal (vai do canto superior esquerdo ao inferior direito)
  const startX = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.8] });
  const startY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.2] });
  const endX = animValue.interpolate({ inputRange: [0, 1], outputRange: [1.0, 0.6] });
  const endY = animValue.interpolate({ inputRange: [0, 1], outputRange: [1.0, 0.9] });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#3C188F' }} />;
  }

  return (
    <AnimatedLinearGradient
      // 💙💜 Gradiente vibrante e suave igual ao vídeo
      colors={['#4DC9EA', '#3C188F']}
      start={{ x: startX as any, y: startY as any }}
      end={{ x: endX as any, y: endY as any }}
      style={styles.container}
    >
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <LottieView source={require('../../assets/lottie/relogio.json')} autoPlay loop style={styles.lottie} />
          <Image source={LogoTexto} style={styles.texto} resizeMode="contain" />
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.text}>
          Otimizando seu tempo
          <Text style={{ fontWeight: 'bold' }}>{dots}</Text>
        </Text>
      </View>
    </AnimatedLinearGradient>
  );
}

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
  lottie: {
    width: 130,
    height: 130,
    left: 20,
    top: -1,
    opacity: 0.9
  },
  texto: {
    height: 90,
    flexShrink: 1,
    marginLeft: -75
  },
  textContainer: {
    marginTop: -50
  },
  text: {
    fontSize: 20,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFFE5',
    textAlign: 'center'
  }
});
