import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import FuncionarioCard, { Funcionario } from '../../components/admin/FuncionarioCard';
import FormAdicionarFuncionario from '../../components/admin/FormAddFuncionario';
import { criarUsuario, atualizarUsuario, excluirUsuario } from '../../services/userService';
import Navbar from '../../components/public/Navbar';

export default function GerenciarFuncionarios() {
  const { usuarios, carregarUsuarios } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);

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

  useEffect(() => {
    carregarUsuarios();
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
                  Alert.alert('Sucesso', 'Usuário criado!');
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
  }
});
