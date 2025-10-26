import React, { useEffect, useState, useContext } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { listarNotificacoes } from '../../services/userService';

const logo = require('../../assets/images/iniciais/logo_chronos.png');

export default function Navbar() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  useEffect(() => {
    const carregarNotificacoes = async () => {
      try {
        if (!userId) return;
        const data = await listarNotificacoes(userId);
        const naoLidas = data.filter((n: any) => !n.lida).length;
        setNotificacoesNaoLidas(naoLidas);
      } catch (err) {
        console.log('Erro carregar notificacoes:', err);
      }
    };

    carregarNotificacoes();

    const interval = setInterval(carregarNotificacoes, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleNotificacoes = () => {
    router.push('/telas-iniciais/notificacoes');
  };

  const handlePerfil = () => {
    router.push('/telas-iniciais/perfil');
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.icons}>
        <TouchableOpacity onPress={handleNotificacoes} style={styles.iconWrapper}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
          {notificacoesNaoLidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificacoesNaoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePerfil} style={styles.iconWrapper}>
          <Ionicons name="person-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: '#3e39a0fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: 30
  },
  logo: {
    width: 160,
    height: 60
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconWrapper: {
    marginLeft: 20
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
