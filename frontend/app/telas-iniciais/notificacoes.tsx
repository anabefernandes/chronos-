import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../contexts/AuthContext';
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas
} from '../../services/userService';

export default function Notificacoes() {
  const router = useRouter();
  const { userId, role } = useContext(AuthContext);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

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

  const handleLerTodas = async () => {
    try {
      await marcarTodasNotificacoesComoLidas(userId!);
      carregarNotificacoes();
    } catch (err) {
      console.log(err);
    }
  };

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

  const renderNotificacao = ({ item }: any) => {
    const isTarefa = item.tipo === 'tarefa';
    return (
      <TouchableOpacity
        style={[styles.notificacaoCard, item.lida ? styles.lida : styles.naoLida]}
        onPress={() => handleLida(item._id)}
        activeOpacity={0.8}
      >
        <View style={styles.notificacaoRow}>
          <View style={[styles.bolinha, { backgroundColor: item.lida ? '#ccc' : '#1e90ff' }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>{isTarefa ? 'Nova tarefa pendente' : item.titulo}</Text>
            <Text style={styles.descricao}>{item.descricao}</Text>
            <Text style={styles.data}>{new Date(item.dataCriacao).toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#17153A', '#3e39a0fa']} locations={[0, 0.3]} style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Notificações</Text>
        <TouchableOpacity onPress={handleLerTodas} style={styles.lerTodasButton}>
          <Text style={styles.lerTodasText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* CONTEÚDO */}
      <View style={styles.content}>
        {notificacoes.length === 0 ? (
          <Text style={styles.vazioTexto}>Aqui aparecerão suas notificações...</Text>
        ) : (
          <FlatList
            data={notificacoes}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={renderNotificacao}
          />
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
  lerTodasButton: {
    marginLeft: 'auto',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  lerTodasText: {
    color: '#3e39a0fa',
    fontWeight: '600',
    fontSize: 12
  },
  content: {
    flex: 1,
    padding: 20
  },
  vazioTexto: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50
  },
  notificacaoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  notificacaoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  bolinha: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 6
  },
  naoLida: {
    backgroundColor: '#e3eaff'
  },
  lida: {
    backgroundColor: '#f5f5f5'
  },
  titulo: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  descricao: {
    marginTop: 6,
    fontSize: 14,
    color: '#555'
  },
  data: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textAlign: 'right'
  }
});
