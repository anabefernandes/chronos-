import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const slides = [
  { id: '1', image: require('../../assets/images/iniciais/slide1.png') },
  { id: '2', image: require('../../assets/images/iniciais/slide2.png') },
];

export default function Inicial() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Zoom bem sutil e suave (quase imperceptível)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02, // zoom leve
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <FlatList
      ref={flatListRef}
      data={slides}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      renderItem={({ item, index }) => (
        <View style={styles.container}>
          {/* Wrapper fixa o tamanho e impede o vazamento do zoom */}
          <View style={styles.imageWrapper}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <ImageBackground
                source={item.image}
                style={styles.image}
                resizeMode="cover"
              >
                <ImageBackground
                  source={require('../../assets/images/iniciais/logo_chronos.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />

                {index === currentIndex && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/telas-iniciais/splash')}
                  >
                    <Text style={styles.buttonText}>Começar</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.separator} />
                <View style={styles.indicators}>
                  {slides.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, currentIndex === i && styles.activeDot]}
                    />
                  ))}
                </View>
              </ImageBackground>
            </Animated.View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  imageWrapper: {
    width,
    height,
    overflow: 'hidden', // evita que o zoom ultrapasse
  },
  image: {
    width,
    height,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  logo: {
    width: 280,
    height: 140,
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#17153A',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 45,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  indicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#17153A',
    width: 10,
    height: 10,
  },
  separator: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(142, 171, 181, 0.26)',
    position: 'absolute',
    bottom: 80,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
});
