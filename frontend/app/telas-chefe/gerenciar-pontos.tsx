import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import Navbar from '../../components/public/Navbar';
import LottieView from 'lottie-react-native';
import HistoricoPontosAdmin from '../../components/admin/HistoricoPontosAdmin';
import { listarChefe, listarFuncionarios, pontosDoFuncionario } from '../../services/userService';

interface Usuario {
  _id: string;
  nome: string;
  role: string;
  setor?: string;
  foto?: string;
}

interface RegistrosDia {
  entrada?: string;
  almoco?: string;
  retorno?: string;
  saida?: string;
}

interface PontoDia {
  data: string;
  registros: RegistrosDia;
}

export default function GerenciarPontos() {
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Usuario | null>(null);
  const [historico, setHistorico] = useState<PontoDia[]>([]);
  const [search, setSearch] = useState('');

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
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      const [funcionariosRes, chefesRes] = await Promise.all([listarFuncionarios(), listarChefe()]);
      const todosUsuarios = [...chefesRes, ...funcionariosRes];
      setFuncionarios(todosUsuarios);
    } catch (err) {
      console.log('Erro ao carregar funcionários', err);
    }
  };

  const carregarHistorico = async (funcionarioId: string) => {
    try {
      const pontos = await pontosDoFuncionario(funcionarioId);

      // Agrupar pontos por dia
      const dias: Record<string, PontoDia> = {};
      pontos.forEach((p: { horario: string | number | Date; status: string }) => {
        const dataISO = new Date(p.horario).toISOString().slice(0, 10);
        if (!dias[dataISO]) dias[dataISO] = { data: dataISO, registros: {} };
        dias[dataISO].registros[p.status as keyof RegistrosDia] = new Date(p.horario).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      });

      // Ordenar do mais recente para o mais antigo
      const historicoFormatado = Object.values(dias).sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setHistorico(historicoFormatado);
    } catch (err) {
      console.log('Erro ao carregar histórico', err);
      setHistorico([]);
    }
  };

  const funcionariosFiltrados = funcionarios.filter(
    f =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      (f.setor?.toLowerCase() || '').includes(search.toLowerCase())
  );

  if (selectedFuncionario) {
    return (
      <View style={{ flex: 1 }}>
        <Navbar />

        <View style={styles.header}>
          <Text style={styles.titleHeader}>Histórico de Pontos</Text>
          <TouchableOpacity onPress={() => setSelectedFuncionario(null)} style={styles.btnVoltar}>
            <Text style={styles.btnVoltarText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <HistoricoPontosAdmin funcionario={selectedFuncionario} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.title}>Gerenciar Pontos</Text>
        <View style={styles.searchWrapper}>
          <Image source={iconeLupa} style={{ width: 20, height: 20, marginRight: 5 }} />
          <TextInput style={{ flex: 1 }} placeholder="Pesquisar..." value={search} onChangeText={setSearch} />
        </View>

        {funcionarios.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <LottieView
              source={require('../../assets/lottie/sem_funcionario.json')}
              autoPlay
              loop
              style={{ width: 250, height: 250 }}
            />
            <Text>Nenhum funcionário cadastrado.</Text>
          </View>
        ) : funcionariosFiltrados.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <LottieView
              source={require('../../assets/lottie/nenhum_funcionario_encontrado.json')}
              autoPlay
              loop
              style={{ width: 250, height: 250 }}
            />
            <Text>Nenhum funcionário encontrado.</Text>
          </View>
        ) : null}

        <FlatList
          data={funcionariosFiltrados}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                setSelectedFuncionario(item);
                carregarHistorico(item._id);
              }}
            >
              <Image source={getUserImage(item.foto)} style={styles.foto} />
              <View style={styles.cardContent}>
                <Text style={styles.nome}>{item.nome}</Text>

                <View style={styles.infoRow}>
                  <Image source={getRoleIcon(item.role)} style={styles.icone} />
                  <Text style={styles.infoText}>{item.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Image source={setorIcon} style={styles.icone} />
                  <Text style={styles.infoText}>{item.setor || 'Sem setor'}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  titleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C188F'
  },
  btnVoltar: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#3C188F'
  },
  btnVoltarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3C188F',
    marginBottom: 15,
    fontFamily: 'Poppins_600SemiBold'
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 15
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f7f7f7',
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  cardContent: {
    flex: 1
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    flexWrap: 'wrap'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  icone: {
    width: 16,
    height: 16,
    marginRight: 5
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1
  }
});
