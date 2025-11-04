import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  excluirNotificacao
} from '../../services/userService';
import LottieView from 'lottie-react-native';
import { io } from 'socket.io-client';

export default function Notificacoes() {
  const router = useRouter();
  const { userId, role } = useContext(AuthContext);
  const { showToast } = useToast();
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const carregarNotificacoes = async () => {
    if (!userId) return;
    try {
      const data = await listarNotificacoes(userId);
      setNotificacoes(data);
    } catch (err) {
      console.log('Erro ao carregar notificações:', err);
    }
  };

  const handleLida = async (id: string) => {
    try {
      await marcarNotificacaoComoLida(id);
      carregarNotificacoes();
    } catch (err) {
      console.log(err);
    }
  };

  const handleMarcarTodas = () => {
    if (notificacoes.length === 0) {
      showToast('Nenhuma notificação disponível para acionar essa função.', 'error');
      return;
    }
    Alert.alert('Confirmação', 'Deseja marcar todas como lidas?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          try {
            await marcarTodasNotificacoesComoLidas(userId!);
            carregarNotificacoes();
            showToast('Todas as notificações foram marcadas como lidas.', 'success');
          } catch (err) {
            console.log(err);
          }
        }
      }
    ]);
  };

  const handleExcluirTodas = () => {
    if (notificacoes.length === 0) {
      showToast('Nenhuma notificação disponível para acionar essa função.', 'error');
      return;
    }
    Alert.alert('Confirmação', 'Deseja excluir todas as notificações?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          try {
            for (const n of notificacoes) await excluirNotificacao(n._id);
            carregarNotificacoes();
            showToast('Todas as notificações foram excluídas.', 'success');
          } catch (err) {
            console.log('Erro ao excluir todas:', err);
          }
        }
      }
    ]);
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirNotificacao(id);
      carregarNotificacoes();
      showToast('Notificação excluída com sucesso.', 'success');
    } catch (err) {
      console.log('Erro ao excluir notificação:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const socket = io(process.env.EXPO_PUBLIC_API_URL || '', { transports: ['websocket'], reconnection: true });
    socket.emit('join', userId);
    socket.on('nova_notificacao', (notificacao: any) => {
      setNotificacoes(prev => [notificacao, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    carregarNotificacoes();
  }, [userId]);

  const handleBack = () => {
    if (role === 'chefe' || role === 'admin') {
      router.replace('/telas-chefe/painel-admin');
    } else {
      router.replace('/telas-iniciais/painel');
    }
  };

  const iconeTarefa = require('../../assets/images/telas-public/icone_tarefa.png');
  const iconeLerTodas = require('../../assets/images/telas-public/icone_ler_todas.png');
  const iconeExcluirTodas = require('../../assets/images/telas-public/icone_excluir_todas.png');
  const coresTarefa = ['#4B47B8', '#5E59D1'] as const;

  const renderNotificacao = ({ item }: any) => (
    <View style={[styles.notificacaoCard, item.lida ? styles.lida : styles.naoLida]}>
      <TouchableOpacity style={styles.notificacaoConteudo} onPress={() => handleLida(item._id)} activeOpacity={0.8}>
        <LinearGradient colors={coresTarefa} style={styles.iconeContainer}>
          <Image source={iconeTarefa} style={styles.iconeImagem} resizeMode="contain" />
        </LinearGradient>

        <View style={styles.textoContainer}>
          <Text style={styles.titulo}>Nova Tarefa!</Text>
          <Text style={styles.subtitulo}>{item.titulo}</Text>
          <Text style={styles.descricao}>{item.descricao}</Text>
        </View>

        <TouchableOpacity onPress={() => handleExcluir(item._id)}>
          <Image
            source={require('../../assets/images/telas-public/icone_excluir.png')}
            style={{ width: 20, height: 20, tintColor: '#5e0d86ff', top: -18, left: 5 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 8 }}>
          <Text style={styles.data}>{new Date(item.dataCriacao).toLocaleString()}</Text>
          {!item.lida && <View style={styles.bolinhaAzul} />}
        </View>
      </View>
    </View>
  );

  const notificacoesVisiveis = mostrarTodas ? notificacoes : notificacoes.slice(0, 6);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notificações</Text>

        <View style={styles.iconesHeader}>
          <TouchableOpacity onPress={handleMarcarTodas}>
            <Image source={iconeLerTodas} style={styles.iconeHeaderVerTodos} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExcluirTodas}>
            <Image source={iconeExcluirTodas} style={styles.iconeHeader} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {notificacoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LottieView
              source={require('../../assets/lottie/sem_notificacao.json')}
              autoPlay
              loop
              style={styles.emptyAnimation}
            />
            <Text style={styles.vazioTexto}>Nenhuma notificação no momento.</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={notificacoesVisiveis}
              keyExtractor={item => item._id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={renderNotificacao}
            />
            {notificacoes.length > 6 && (
              <TouchableOpacity onPress={() => setMostrarTodas(!mostrarTodas)} style={styles.verMaisButton}>
                <Text style={styles.verMaisText}>{mostrarTodas ? 'Ver menos' : 'Ver mais'}</Text>
                <Ionicons name={mostrarTodas ? 'chevron-up' : 'chevron-down'} size={18} color="#3e39a0fa" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  backButton: {
    marginRight: 10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold'
  },
  iconeHeaderVerTodos: {
    width: 30,
    height: 30,
    tintColor: '#fff'
  },
  iconesHeader: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 8
  },
  iconeHeader: {
    width: 27,
    height: 27,
    tintColor: '#fff',
    top: 1
  },
  content: {
    flex: 1,
    padding: 20
  },
  vazioTexto: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: -10
  },
  notificacaoCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  notificacaoConteudo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconeContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  iconeImagem: {
    width: 28,
    height: 28
  },
  textoContainer: {
    flex: 1
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2
  },
  subtitulo: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500'
  },
  descricao: {
    fontSize: 13,
    color: '#555'
  },
  bolinhaAzul: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2B77E7',
    alignSelf: 'flex-end',
    top: -3
  },
  data: {
    fontSize: 12,
    color: '#888'
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  verMaisButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8
  },
  verMaisText: {
    color: '#3e39a0fa',
    fontWeight: '600',
    fontSize: 15
  },
  naoLida: {
    backgroundColor: '#E8F0FE'
  },
  lida: {
    backgroundColor: '#f2f2f2'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -180
  },
  emptyAnimation: {
    width: 300,
    height: 220
  }
});
