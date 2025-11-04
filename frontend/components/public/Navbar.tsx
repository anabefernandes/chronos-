import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { listarNotificacoes } from '../../services/userService';
import { io } from 'socket.io-client';

const logo = require('../../assets/images/iniciais/logo_chronos.png');

export default function Navbar() {
  const router = useRouter();
  const { userId } = useContext(AuthContext);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const socketRef = useRef<any>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const animarSininho = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 100, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, easing: Easing.linear, useNativeDriver: true })
    ]).start();
  };

  const carregarNotificacoes = async () => {
    if (!userId) return;

    try {
      const notificacoes = await listarNotificacoes(userId);
      const naoLidas = notificacoes.filter((n: any) => !n.lida).length;

      // animação do sininho sempre que houver notificações
      if (naoLidas > 0) animarSininho();

      setNotificacoesNaoLidas(naoLidas);
    } catch (err) {
      console.log('Erro ao listar notificações:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.EXPO_PUBLIC_API_URL || '', { transports: ['websocket'], reconnection: true });
    socketRef.current = socket;
    socket.emit('join', userId);

    socket.on('nova_notificacao', (data: any) => {
      if (data.usuario === userId) {
        carregarNotificacoes();
      }
    });

    carregarNotificacoes();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const handleNotificacoes = () => router.push('/telas-iniciais/notificacoes');
  const handlePerfil = () => router.push('/telas-iniciais/perfil');

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <View style={styles.icons}>
        <TouchableOpacity onPress={handleNotificacoes} style={styles.iconWrapper}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-15deg', '15deg']
                  })
                }
              ]
            }}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </Animated.View>

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
