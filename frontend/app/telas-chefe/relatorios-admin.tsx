import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import Navbar from '../../components/public/Navbar';
import Relatorio from '../telas-iniciais/relatorio';
import { listarFuncionarios, listarChefe } from '../../services/userService';
import LottieView from 'lottie-react-native';
import api from '../../services/api';

interface Usuario {
  _id: string;
  nome: string;
  role: string;
  setor?: string;
  foto?: string;
}

export default function GerenciarRelatorios() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const iconeChefe = require('../../assets/images/telas-admin/icone_chefe.png');
  const iconeFuncionario = require('../../assets/images/telas-admin/icone_funcionario.png');
  const iconeLupa = require('../../assets/images/telas-admin/icone_lupa.png');

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  const getRoleIcon = (role: string) => (role === 'chefe' ? iconeChefe : iconeFuncionario);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
      const res = await api.get('/auth/userAuth');
      setUser(res.data);
      carregarFuncionariosList();
    } catch (err) {
      console.log('Erro ao carregar usuário', err);
    }
  }

  async function carregarFuncionariosList() {
    try {
      const [funcionariosRes, chefesRes] = await Promise.all([listarFuncionarios(), listarChefe()]);
      const todosUsuarios = [...chefesRes, ...funcionariosRes];
      setFuncionarios(todosUsuarios);
    } catch (err) {
      console.log('Erro ao listar usuários', err);
    }
  }

  const funcionariosFiltrados = funcionarios.filter(f => {
    const matchesSearch =
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      (f.setor?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesFiltro = filtro === 'todas' || f._id === user?._id;
    return matchesSearch && matchesFiltro;
  });

  if (selectedId) {
    return <Relatorio selectedId={selectedId} voltar={() => setSelectedId(null)} />;
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.title}>Gerenciar Relatórios</Text>

        {/* Pesquisa e filtro */}
        <View style={styles.filterSearchRow}>
          <View style={styles.searchWrapper}>
            <Image source={iconeLupa} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar..."
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterWrapper}
            onPress={() => setFiltro(filtro === 'todas' ? 'minhas' : 'todas')}
            activeOpacity={0.8}
          >
            <Text style={styles.inputLabel}>Filtrar</Text>
            <Text style={styles.inputFiltro}>{filtro === 'todas' ? 'Todos ' : 'Meu relatório'}</Text>
          </TouchableOpacity>
        </View>
        {/* Nenhum funcionário cadastrado */}
        {funcionarios.length === 0 && (
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

        {/* Pesquisa sem resultados */}
        {funcionarios.length > 0 && funcionariosFiltrados.length === 0 && (
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

        <FlatList
          data={funcionariosFiltrados}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedId(item._id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={getUserImage(item.foto)}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.nome}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Image source={getRoleIcon(item.role)} style={{ width: 16, height: 16, marginRight: 5 }} />
                    <Text>{item.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Image source={setorIcon} style={{ width: 16, height: 16, marginRight: 5 }} />
                    <Text>{item.setor || 'Sem setor'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3C188F',
    marginLeft: 5
  },
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 18
  },
  searchWrapper: {
    flex: 0.58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 45,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000'
  },
  filterWrapper: {
    flex: 0.4,
    height: 45,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginLeft: 0
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 5
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#696868ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ddddddff'
  },
  inputFiltro: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    lineHeight: 45
  },
  inputLabel: {
    position: 'absolute',
    top: -8,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#1B0A43',
    zIndex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center'
  }
});
