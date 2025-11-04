import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  TextInput,
  Image,
  Alert
} from 'react-native';
import TarefaCardAdmin from './TarefaCardAdmin';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import EditarTarefaModal from './EditarTarefaModal';
import LottieView from 'lottie-react-native';
import { atualizarTarefaAdmin } from '../../services/userService';

interface Categoria {
  nome: string;
  cor: string;
  icone: string;
}
interface Funcionario {
  nome: string;
  setor?: string;
  foto?: string;
  _id: string;
}
interface Paciente {
  nome: string;
  idade?: string;
  temperatura?: string;
  saturacao?: string;
  sintomas?: string;
}
interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  paciente?: Paciente | null;
  categorias?: Categoria[];
  prioridade: 'baixa' | 'media' | 'alta';
  dataPrevista?: string;
  funcionario: Funcionario;
  concluida?: boolean;
  status?: 'pendente' | 'em_andamento' | 'concluida';
}
interface Props {
  tarefas: Tarefa[];
  usuarioLogadoId?: string;
}

const coresPrioridade = { alta: '#FF6B6B', media: '#FFD93D', baixa: '#4ECDC4' };
const larguraTela = Dimensions.get('window').width;

const TarefasPrioridadeAdmin: React.FC<Props> = ({ tarefas, usuarioLogadoId }) => {
  const { userId } = useContext(AuthContext);
  const usuarioId = usuarioLogadoId || userId;

  const [expandido, setExpandido] = useState<{ alta: boolean; media: boolean; baixa: boolean; concluidas: boolean }>({
    alta: false,
    media: false,
    baixa: false,
    concluidas: false
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [animacao, setAnimacao] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [listaTarefas, setListaTarefas] = useState<Tarefa[]>(tarefas);

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [showFiltroModal, setShowFiltroModal] = useState(false);

  useEffect(() => setListaTarefas(tarefas), [tarefas]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: listaTarefas.filter(t => t.status !== 'concluida').length === 0 ? 1 : 0,
      duration: 400,
      useNativeDriver: true
    }).start();
  }, [listaTarefas]);

  const atualizarTarefas = async () => {
    try {
      const response = await api.get('/tarefas');
      setListaTarefas(response.data);
    } catch (err) {
      console.log('Erro ao atualizar tarefas', err);
    }
  };

  const excluirTarefa = (id: string) => {
    Alert.alert('Confirmação', 'Deseja mesmo excluir essa tarefa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/tarefas/${id}`);
            Alert.alert('Sucesso', 'Tarefa excluída com sucesso!');
            atualizarTarefas();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
          }
        }
      }
    ]);
  };

  const alternarConcluida = async (tarefa: Tarefa, novaConcluida: boolean) => {
    try {
      const novoStatus = novaConcluida ? 'concluida' : 'pendente';
      await atualizarTarefaAdmin(tarefa._id, novoStatus);
      setListaTarefas(prev => prev.map(t => (t._id === tarefa._id ? { ...t, status: novoStatus } : t)));
      if (novaConcluida) {
        setAnimacao(true);
        setTimeout(() => setAnimacao(false), 2000);
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o status da tarefa.');
    }
  };

  const tarefasNaoConcluidas = listaTarefas.filter(t => t.status !== 'concluida');
  const tarefasConcluidas = listaTarefas.filter(t => t.status === 'concluida');

  // Filtra por “todas” ou “minhas” e pesquisa por nome do funcionário
  const filtrarTarefas = (lista: Tarefa[]) =>
    lista
      .filter(t => filtro === 'todas' || (t.funcionario && t.funcionario._id === usuarioId))
      .filter(t => t.funcionario.nome.toLowerCase().includes(search.toLowerCase()));

  const tarefasNaoConcluidasFiltradas = filtrarTarefas(tarefasNaoConcluidas);
  const tarefasConcluidasFiltradas = filtrarTarefas(tarefasConcluidas);

  const nenhumaTarefa = tarefasNaoConcluidasFiltradas.length === 0;

  const progresso =
    tarefasNaoConcluidasFiltradas.length + tarefasConcluidasFiltradas.length
      ? Math.round(
          (tarefasConcluidasFiltradas.length /
            (tarefasNaoConcluidasFiltradas.length + tarefasConcluidasFiltradas.length)) *
            100
        )
      : 0;

  const rolarParaConcluidas = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    setAnimacao(false);
  };

  const opcoesFiltro = [
    { label: 'Todas as tarefas', value: 'todas' },
    { label: 'Minhas tarefas', value: 'minhas' }
  ];

  const renderPrioridade = (prio: 'alta' | 'media' | 'baixa', tarefasFiltradas: Tarefa[]) => {
    const filtradas = tarefasFiltradas.filter(t => t.prioridade === prio);
    const mostrarTodos = expandido[prio];
    const exibidas = mostrarTodos ? filtradas : filtradas.slice(0, 3);

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={styles.headerPrioridade}>
          <View style={styles.leftHeader}>
            <View style={[styles.bolaPrioridade, { backgroundColor: coresPrioridade[prio] }]} />
            <Text style={styles.titlePrioridade}>
              {prio === 'alta' ? 'Prioridade Alta' : prio === 'media' ? 'Prioridade Média' : 'Prioridade Baixa'}
            </Text>
          </View>
          <View style={styles.rightHeader}>
            <Image
              source={require('../../assets/images/telas-public/icone_contador.png')}
              style={styles.contadorIcon}
              resizeMode="contain"
            />
            <Text style={styles.contadorTexto}>
              {filtradas.length} <Text style={styles.contadorLabel}>tarefas</Text>
            </Text>
          </View>
        </View>

        {exibidas.length > 0 ? (
          <>
            {exibidas.map(t => (
              <TarefaCardAdmin
                key={t._id}
                tarefa={{ ...t, funcionario: t.funcionario ? { ...t.funcionario, id: t.funcionario._id } : undefined }}
                onEditar={() => {
                  setTarefaSelecionada(t);
                  setModalEditarVisible(true);
                }}
                onDeletar={() => excluirTarefa(t._id)}
                onToggleConcluida={novaConcluida => alternarConcluida(t, novaConcluida)}
              />
            ))}

            {filtradas.length > 3 && (
              <TouchableOpacity
                style={styles.verMaisBotao}
                onPress={() => setExpandido(prev => ({ ...prev, [prio]: !prev[prio] }))}
              >
                <Text style={styles.verMaisTexto}>{mostrarTodos ? 'Ver menos' : 'Ver mais'}</Text>
                <Image
                  source={
                    mostrarTodos
                      ? require('../../assets/images/telas-public/icone_cima.png')
                      : require('../../assets/images/telas-public/icone_baixo.png')
                  }
                  style={styles.verMaisIcone}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.tarefasVaziasContainer}>
            <LottieView
              source={require('../../assets/lottie/sem_tarefas2.json')}
              autoPlay
              loop
              style={{ width: larguraTela * 0.4, height: larguraTela * 0.4 }}
            />
            <Text style={styles.overlayTexto}>Parabéns, todas as tarefas dessa prioridade foram concluídas!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 20, paddingTop: 1, flexGrow: 1 }}>
        <Text style={styles.progressoTitulo}>{filtro === 'todas' ? 'Progresso da equipe' : 'Meu progresso'}</Text>
        <View style={styles.progressoContainer}>
          <View style={[styles.progressoFill, { width: `${progresso}%` }]} />
          <Text style={styles.progressoText}>{progresso}% concluído</Text>
        </View>

        <Text style={styles.progressoContador}>
          {tarefasConcluidasFiltradas.length} de{' '}
          {tarefasNaoConcluidasFiltradas.length + tarefasConcluidasFiltradas.length} tarefas concluídas
        </Text>

        {/* Pesquisa e filtro */}
        <View style={styles.filterSearchRow}>
          <View style={styles.searchWrapper}>
            <Image source={require('../../assets/images/telas-admin/icone_lupa.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar funcionário"
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.filterWrapper}
            onPress={() => setShowFiltroModal(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.inputLabel}>Filtrar</Text>
            <Text style={styles.inputFiltro}>{filtro === 'todas' ? 'Todas as tarefas' : 'Minhas tarefas'}</Text>
          </TouchableOpacity>
        </View>

        {showFiltroModal && (
          <View style={styles.modalFiltro}>
            {opcoesFiltro.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.modalOption}
                onPress={() => {
                  setFiltro(opt.value as 'todas' | 'minhas');
                  setShowFiltroModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ position: 'relative' }}>
          {nenhumaTarefa && (
            <View style={styles.overlayPrioridades}>
              <LottieView
                source={require('../../assets/lottie/sem_tarefas.json')}
                autoPlay
                loop
                style={{ width: larguraTela * 0.55, height: larguraTela * 0.55, marginTop: -250 }}
              />
              <Text style={styles.overlayTexto}>Nenhuma tarefa disponível</Text>
              <TouchableOpacity style={styles.botaoVerConcluidas} onPress={rolarParaConcluidas}>
                <Text style={styles.botaoTexto}>Ver concluídas</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderPrioridade('alta', tarefasNaoConcluidasFiltradas)}
          {renderPrioridade('media', tarefasNaoConcluidasFiltradas)}
          {renderPrioridade('baixa', tarefasNaoConcluidasFiltradas)}
        </View>

        {tarefasConcluidasFiltradas.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.headerPrioridade}>
              <View style={[styles.bolaPrioridade, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.titlePrioridade}>Tarefas Concluídas</Text>
              <View style={styles.rightHeader}>
                <Image
                  source={require('../../assets/images/telas-public/icone_contador.png')}
                  style={styles.contadorIcon}
                  resizeMode="contain"
                />
                <Text style={styles.contadorTexto}>
                  {tarefasConcluidasFiltradas.length} <Text style={styles.contadorLabel}>tarefas</Text>
                </Text>
              </View>
            </View>

            {tarefasConcluidasFiltradas
              .slice(0, expandido.concluidas ? tarefasConcluidasFiltradas.length : 3)
              .map(t => (
                <TarefaCardAdmin
                  key={t._id}
                  tarefa={{
                    ...t,
                    funcionario: t.funcionario ? { ...t.funcionario, id: t.funcionario._id } : undefined
                  }}
                  onEditar={() => {
                    setTarefaSelecionada(t);
                    setModalEditarVisible(true);
                  }}
                  onDeletar={() => excluirTarefa(t._id)}
                  onToggleConcluida={novaConcluida => alternarConcluida(t, novaConcluida)}
                />
              ))}

            {tarefasConcluidasFiltradas.length > 3 && (
              <TouchableOpacity
                style={styles.verMaisBotao}
                onPress={() => setExpandido(prev => ({ ...prev, concluidas: !prev.concluidas }))}
              >
                <Text style={styles.verMaisTexto}>{expandido.concluidas ? 'Ver menos' : 'Ver mais'}</Text>
                <Image
                  source={
                    expandido.concluidas
                      ? require('../../assets/images/telas-public/icone_cima.png')
                      : require('../../assets/images/telas-public/icone_baixo.png')
                  }
                  style={styles.verMaisIcone}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de edição */}
      {tarefaSelecionada && (
        <EditarTarefaModal
          visible={modalEditarVisible}
          onClose={() => setModalEditarVisible(false)}
          tarefa={tarefaSelecionada}
          onSave={() => {
            setModalEditarVisible(false);
            atualizarTarefas();
          }}
        />
      )}

      {animacao && (
        <View style={[styles.successOverlay, { bottom: 60 }]} pointerEvents="box-none">
          <LottieView
            source={require('../../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </View>
      )}
    </View>
  );
};

export default TarefasPrioridadeAdmin;

const styles = StyleSheet.create({
  headerPrioridade: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  contadorIcon: {
    width: 22,
    height: 22,
    marginRight: 6
  },
  contadorTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3C188F',
    textAlign: 'center'
  },
  contadorLabel: {
    fontSize: 10,
    color: '#3C188F',
    textAlign: 'center'
  },
  verMaisBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f6fbff',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    width: '100%',
    alignSelf: 'center',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    borderColor: '#3C188F',
    borderWidth: 1
  },
  verMaisTexto: {
    color: '#3C188F',
    fontWeight: '600',
    fontSize: 13
  },
  verMaisIcone: {
    width: 14,
    height: 14,
    marginLeft: 4
  },
  tarefasVaziasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bolaPrioridade: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  titlePrioridade: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C188F',
    flex: 1,
    marginBottom: 0
  },
  expandText: {
    color: '#3C188F',
    fontWeight: '500',
    marginTop: 4
  },
  progressoContainer: {
    height: 20,
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#A4A4A4'
  },
  progressoFill: {
    height: '100%',
    backgroundColor: '#377ACF'
  },
  progressoText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    color: '#fff'
  },
  progressoTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#377ACF',
    marginBottom: 10,
    marginTop: 20
  },
  progressoContador: {
    textAlign: 'center',
    marginBottom: 1,
    fontSize: 14,
    color: '#555',
    fontWeight: '500'
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
    marginRight: 6,
    marginLeft: 6
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 6
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
    backgroundColor: '#fff'
  },
  inputFiltro: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    lineHeight: 45
  },
  modalFiltro: {
    position: 'absolute',
    top: 180,
    right: 29,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  modalOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1B0A43',
    textAlign: 'center'
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
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 5
  },
  overlayPrioridades: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
  },
  overlayTexto: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center'
  },
  successOverlay: {
    top: 0,
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
  botaoVerConcluidas: {
    marginTop: 20,
    backgroundColor: '#3C188F',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    elevation: 4
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  }
});
