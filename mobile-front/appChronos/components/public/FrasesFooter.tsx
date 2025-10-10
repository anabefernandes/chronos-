import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

const frases = [
  'Organize sua rotina com o Chronos ⏳',
  'Um dia bem planejado vale por dois 💡',
  'Seu tempo, sua produtividade 🚀',
  'Controle e praticidade na palma da mão 📱',
  'Cada segundo conta ⌛'
];

export default function Footer() {
  const [frase, setFrase] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * frases.length);
    setFrase(frases[randomIndex]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{frase}</Text>
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
