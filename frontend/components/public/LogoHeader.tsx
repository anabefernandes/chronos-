import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function EllipseHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/iniciais/circulo.png')}
        style={styles.ellipse}
        resizeMode="cover"
      />

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
    height: 300,     // AUMENTADO para acompanhar a imagem real
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    paddingTop: 0,
    overflow: 'hidden',  // evita sobras brancas
  },
  ellipse: {
    position: 'absolute',
    width: width * 1.1,  // ligeiramente maior para não deixar bordas
    height: 330,         // maior para cobrir toda a área curva
    top: -40             // sobe a imagem para tirar totalmente a faixa branca
  },
  logo: {
    width: 250,
    height: 100
  }
});
