import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function EllipseHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/iniciais/circulo.png')} style={styles.ellipse} resizeMode="contain" />

      <TouchableOpacity onPress={() => router.push('/')}>
        <Image
          source={require('../../assets/images/iniciais/logo_chronos.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ellipse: {
    position: 'absolute',
    width: width,
    height: 300
  },
  logo: {
    width: 250,
    height: 100
  }
});
