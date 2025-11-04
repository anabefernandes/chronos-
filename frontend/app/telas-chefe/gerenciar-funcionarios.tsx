import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { AuthContext, AuthContextType } from '../../contexts/AuthContext';
import FuncionarioCard, { Funcionario } from '../../components/admin/FuncionarioCard';
import FormAdicionarFuncionario from '../../components/admin/FormAddFuncionario';
import { criarUsuario, atualizarUsuario, excluirUsuario } from '../../services/userService';
import Navbar from '../../components/public/Navbar';
import LottieView from 'lottie-react-native';
import { io } from 'socket.io-client';

export default function GerenciarFuncionarios() {
  const { usuarios, carregarUsuarios, setUsuarios } = useContext(AuthContext) as AuthContextType;
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [animacao, setAnimacao] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente excluir este funcionário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirUsuario(id);
            Alert.alert('Sucesso', 'Usuário excluído!');
            carregarUsuarios();
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.msg || err.message || 'Erro ao excluir usuário');
          }
        }
      }
    ]);
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case 'entrada':
        return 'Ativo';
      case 'saida':
        return 'Inativo';
      case 'almoco':
        return 'Almoço';
      case 'retorno':
        return 'Ativo';
      default:
        return 'Inativo';
    }
  };

  useEffect(() => {
    carregarUsuarios();
    const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('🟢 Conectado ao servidor Socket.io');
    });

    socket.on('statusAtualizado', ({ userId, novoStatus }) => {
      console.log('📡 Atualização recebida:', userId, novoStatus);

      const statusFormatado = mapStatus(novoStatus);
      setUsuarios(prevUsuarios => prevUsuarios.map(u => (u._id === userId ? { ...u, status: statusFormatado } : u)));
    });

    socket.on('disconnect', () => {
      console.log('🔴 Desconectado do Socket.io');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredUsuarios = usuarios.filter(u => {
    const searchLower = search.toLowerCase();
    return (
      u.nome.toLowerCase().includes(searchLower) ||
      u.setor.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <Navbar />
      <View style={styles.container}>
        <Text style={styles.title}>Gerenciar Funcionários</Text>

        {/* Barra de pesquisa */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Image source={require('../../assets/images/telas-admin/icone_lupa.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar"
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
            <Image source={require('../../assets/images/telas-admin/icone_add.png')} style={styles.addIcon} />
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredUsuarios}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <FuncionarioCard funcionario={item as unknown as Funcionario} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          contentContainerStyle={{ paddingBottom: 50 }}
        />

        {showForm && (
          <FormAdicionarFuncionario
            onClose={() => {
              setShowForm(false);
              setEditingFuncionario(null);
            }}
            onAdd={async dados => {
              try {
                if (editingFuncionario) {
                  await atualizarUsuario(editingFuncionario._id, dados);
                  Alert.alert('Sucesso', 'Usuário atualizado!');
                } else {
                  await criarUsuario(
                    dados as {
                      nome: string;
                      email: string;
                      senha: string;
                      role: 'funcionario' | 'chefe';
                      foto?: string;
                      setor: string;
                    }
                  );
                  setMensagemSucesso('Usuário adicionado com sucesso!');
                  setAnimacao(true);

                  setTimeout(() => {
                    setAnimacao(false);
                    setMensagemSucesso('');
                  }, 3000);
                }

                setShowForm(false);
                setEditingFuncionario(null);
                await carregarUsuarios();
              } catch (err: any) {
                Alert.alert('Erro', err?.response?.data?.msg || err.message || 'Erro ao salvar usuário');
              }
            }}
            funcionario={editingFuncionario ?? undefined}
          />
        )}
      </View>
      {animacao && (
        <View style={[styles.successOverlay, { bottom: 60, top: 100 }]} pointerEvents="box-none">
          <LottieView
            source={require('../../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
          {mensagemSucesso !== '' && <Text style={styles.successText}>{mensagemSucesso}</Text>}
        </View>
      )}
      {!animacao && usuarios.length === 0 && (
        <View style={styles.emptyContainer}>
          <LottieView
            source={require('../../assets/lottie/sem_funcionario.json')}
            autoPlay
            loop
            style={{ width: 250, height: 250 }}
          />
          <Text style={styles.emptyText}>Nenhum funcionário cadastrado.</Text>
        </View>
      )}

      {usuarios.length > 0 && filteredUsuarios.length === 0 && (
        <View style={styles.emptyContainer}>
          <LottieView
            source={require('../../assets/lottie/nenhum_funcionario_encontrado.json')}
            autoPlay
            loop
            style={{ width: 250, height: 250 }}
          />
          <Text style={styles.emptyText}>Nenhum funcionário encontrado.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3C188F'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#377ACF',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    backgroundColor: 'transparent'
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#377ACF'
  },
  searchInput: {
    flex: 1,
    height: 30,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#377ACF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30
  },
  addIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#fff'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: -190
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#858383ff',
    fontFamily: 'Poppins_600SemiBold'
  },
  successOverlay: {
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    pointerEvents: 'box-none',
    position: 'absolute',
    justifyContent: 'center',
    zIndex: 1
  },
  successText: {
    fontSize: 16,
    color: '#3C188F',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: -20
  }
});
