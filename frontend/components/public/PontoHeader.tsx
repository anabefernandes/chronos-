// Mantive todos os imports
import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { listarNotificacoes } from '../../services/userService';
import Cronometro from './Cronometro';

import { io } from 'socket.io-client';

interface PontoHeaderProps {
  horario?: string;
  data?: string;

  horaEntrada?: string | Date | null;
  duracaoAlmocoMinutos?: number;
  horaAlmocoReal?: string | Date | null;
  horaRetornoReal?: string | Date | null;
  horaEntradaReal?: string | Date | null;
  horaSaidaReal?: string | Date | null;
  horaSaida?: string | Date | null;
  pontoBatido?: any;
}

export default function PontoHeader({
  horario: backendHorario,
  data: backendData,

  horaEntrada,
  duracaoAlmocoMinutos,
  horaAlmocoReal,
  horaRetornoReal,
  horaEntradaReal,
  horaSaidaReal,
  horaSaida,
  pontoBatido
}: PontoHeaderProps) {
  const router = useRouter();
  const { nome, setor, getFoto, userId } = useContext(AuthContext);
  const [mostrarCronometro, setMostrarCronometro] = useState(false);

  // 🔹 Normaliza a foto para aceitar require ou uri
  const fotoURL = (() => {
    const f = getFoto();
    return typeof f === 'number' ? f : { uri: f.uri };
  })();

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

  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState<number>(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const socketRef = useRef<any>(null); // 🔹 Ref para socket

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
      setNotificacoesNaoLidas(naoLidas);

      if (naoLidas > 0) animarSininho();
    } catch (err) {
      console.log('Erro ao listar notificações:', err);
    }
  };

  // Atualiza horário e data a cada segundo
  useEffect(() => {
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
  }, []);

  // 🔹 Conecta socket
  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || '', { transports: ['websocket'], reconnection: true });
    socketRef.current.emit('join', userId);

    socketRef.current.on('nova_notificacao', async (data: any) => {
      if (data.usuario === userId) {
        await carregarNotificacoes();
      }
    });

    carregarNotificacoes();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId]);

  const handleNotificacoes = () => router.push('/telas-iniciais/notificacoes');
  const handlePerfil = () => router.push('/telas-iniciais/perfil');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.topBackground}>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleNotificacoes}>
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
          <TouchableOpacity onPress={handlePerfil}>
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Image source={fotoURL} style={styles.foto} />
        <Text style={styles.nome}>{nome || 'NOVO USUÁRIO'}</Text>
        <View style={styles.setorContainer}>
          <Image source={require('../../assets/images/telas-admin/icone_setor.png')} style={styles.setorIcon} />
          <Text style={styles.setor}>{setor || 'Setor não informado'}</Text>
        </View>
        <View style={styles.card}>
          {/* 🔘 BOTÃO PNG PARA ALTERNAR */}
          <TouchableOpacity style={styles.toggleButton} onPress={() => setMostrarCronometro(prev => !prev)}>
            <Image
              source={require('../../assets/images/telas-public/icone_alternar.png')}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {mostrarCronometro ? (
            <Cronometro
              horaEntrada={horaEntrada}
              duracaoAlmocoMinutos={duracaoAlmocoMinutos ?? 60}
              horaAlmocoReal={horaAlmocoReal}
              horaRetornoReal={horaRetornoReal}
              horaEntradaReal={horaEntradaReal}
              horaSaidaReal={horaSaidaReal}
              horaSaida={horaSaida}
              pontoBatido={pontoBatido}
            />
          ) : (
            <>
              <Text style={styles.horario}>{horario}</Text>
              <Text style={styles.data}>{data}</Text>
            </>
          )}
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
    height: 270,
    width: '100%',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
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
  setorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  setorIcon: {
    width: 16,
    height: 16,
    marginRight: 1
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
    minHeight: 120,
    height: 120,
    width: 300,
    justifyContent: 'center'
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
  },
  toggleButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    zIndex: 20
  }
});
