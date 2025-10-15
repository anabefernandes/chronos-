import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';

interface PontoHeaderProps {
  horario?: string;
  data?: string;
}

export default function PontoHeader({ horario: backendHorario, data: backendData }: PontoHeaderProps) {
  const { nome, foto } = useContext(AuthContext);

  const defaultUser = {
    nome: nome || 'NOVO USUÁRIO',
    setor: 'setor',
    foto: foto || undefined
  };

  const getUserImage = () => {
    if (defaultUser.foto) return { uri: defaultUser.foto };
    return require('../../assets/images/telas-public/sem_foto.png');
  };

  const now = new Date();
  const [horario, setHorario] = useState<string>(backendHorario || now.toLocaleTimeString());
  const [data, setData] = useState<string>(
    backendData ||
      now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
  );

  useFocusEffect(
    React.useCallback(() => {
      const timer = setInterval(() => {
        const now = new Date();
        setHorario(now.toLocaleTimeString());
        setData(
          now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        );
      }, 1000);
      return () => clearInterval(timer);
    }, [])
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.topBackground}>
        <View style={styles.iconRow}>
          <Link href="/telas-iniciais/notificacoes">
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </Link>
          <Link href="/telas-iniciais/perfil">
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </Link>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Image source={getUserImage()} style={styles.foto} />
        <Text style={styles.nome}>{defaultUser.nome}</Text>
        <Text style={styles.setor}>{defaultUser.setor}</Text>

        <View style={styles.card}>
          <Text style={styles.horario}>{horario}</Text>
          <Text style={styles.data}>{data}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: '100%', 
    alignItems: 'center' 
  },
  topBackground: {
    height: 260,
    width: '100%',
    borderBottomLeftRadius: 110,
    borderBottomRightRadius: 110,
    paddingHorizontal: 20,
    paddingTop: 50
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  content: {
    alignItems: 'center',
    marginTop: -180
  },
  foto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff'
  },
  nome: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#fff', 
    marginTop: 8 
  },
  setor: { 
    fontSize: 14, 
    color: '#E0E0E0' 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    minHeight: 100
  },
  horario: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  data: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4 
  }
});
