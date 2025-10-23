import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Notificacoes() {
  const router = useRouter();

  const handleBack = () => {
    router.replace('/telas-iniciais/painel');
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Notificações</Text>
      </LinearGradient>

      {/* CONTEÚDO */}
      <View style={styles.content}>
        <Text>Aqui aparecerão suas notificações...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40
  },
  backButton: {
    marginRight: 10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 20
  }
});
