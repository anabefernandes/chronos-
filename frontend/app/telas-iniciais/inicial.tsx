import { View, Text, ImageBackground, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../../assets/images/iniciais/slide1.png')
  },
  {
    id: '2',
    image: require('../../assets/images/iniciais/slide2.png')
  }
];

export default function Inicial() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <FlatList
      ref={flatListRef}
      data={slides}
      keyExtractor={item => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      renderItem={({ item, index }) => (
        <ImageBackground source={item.image} style={styles.container}>
          <View style={styles.overlay} />

          <ImageBackground
            source={require('../../assets/images/iniciais/logo_chronos.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.text,
              index === 0 ? { top: -200, right: 60, textAlign: 'left' } : { top: -130, left: 70, textAlign: 'right' }
            ]}
          >
            {item.text}
          </Text>

          {index === currentIndex && (
            <TouchableOpacity style={styles.button} onPress={() => router.push('/telas-iniciais/splash')}>
              <Text style={styles.buttonText}>Começar</Text>
            </TouchableOpacity>
          )}

          <View style={styles.separator} />
          <View style={styles.indicators}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
            ))}
          </View>

          <View style={styles.indicators}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, currentIndex === i && styles.activeDot]} />
            ))}
          </View>
        </ImageBackground>
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
    paddingBottom: 80
  },
  logo: {
    width: 280,
    height: 140,
    position: 'absolute',
    top: 80,
    alignSelf: 'center'
  },
  text: {
    fontSize: 26,
    color: '#fff',
    marginHorizontal: 30,
    marginBottom: 30
  },
  button: {
    backgroundColor: '#17153A',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginBottom: 45,
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold'
  },
  indicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 60
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 4
  },
  activeDot: {
    backgroundColor: '#17153A',
    width: 10,
    height: 10
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    position: 'absolute'
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
    elevation: 6
  }
});
