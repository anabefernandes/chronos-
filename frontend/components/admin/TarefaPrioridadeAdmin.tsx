import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated, TextInput, Image } from 'react-native';
import TarefaCardAdmin from './TarefaCardAdmin';
import { AuthContext } from '../../contexts/AuthContext';

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

interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  paciente?: string;
  categorias?: Categoria[];
  prioridade: 'baixa' | 'media' | 'alta';
  dataPrevista?: string;
  funcionario: Funcionario;
  concluida?: boolean;
}

interface Props {
  tarefas: Tarefa[];
  usuarioLogadoId?: string;
}

const coresPrioridade = { alta: '#FF6B6B', media: '#FFD93D', baixa: '#4ECDC4' };
const larguraTela = Dimensions.get('window').width;

const TarefasPrioridadeAdmin: React.FC<Props> = ({ tarefas, usuarioLogadoId }) => {
  const { role } = useContext(AuthContext);
  const [expandido, setExpandido] = useState({ alta: false, media: false, baixa: false });
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'minhas'>('todas');
  const [showFiltroModal, setShowFiltroModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Filtra tarefas
  const tarefasFiltradas = tarefas
    .filter(t => {
      if (filtro === 'todas') return true; // mostra todas
      return t.funcionario._id === usuarioLogadoId; // minhas tarefas
    })
    .filter(t => t.funcionario.nome.toLowerCase().includes(search.toLowerCase()));

  const tarefasConcluidas = tarefasFiltradas.filter(t => t.concluida);
  const totalTarefas = tarefasFiltradas.length;
  const progresso = totalTarefas ? Math.round((tarefasConcluidas.length / totalTarefas) * 100) : 0;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: tarefasFiltradas.length === 0 ? 1 : 0,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [tarefasFiltradas]);

  const renderPrioridade = (prio: 'alta' | 'media' | 'baixa') => {
    const filtradas = tarefasFiltradas.filter(t => t.prioridade === prio);
    const mostrarTodos = expandido[prio];
    const exibidas = mostrarTodos ? filtradas : filtradas.slice(0, 3);

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={styles.headerPrioridade}>
          <View style={[styles.bolaPrioridade, { backgroundColor: coresPrioridade[prio] }]} />
          <Text style={styles.titlePrioridade}>
            {prio.toUpperCase()} ({filtradas.length})
          </Text>
          {filtradas.length > 3 && (
            <TouchableOpacity onPress={() => setExpandido(prev => ({ ...prev, [prio]: !prev[prio] }))}>
              <Text style={styles.expandText}>{mostrarTodos ? 'Mostrar menos' : 'Mostrar todos'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {exibidas.map(t => (
          <TarefaCardAdmin
            key={t._id}
            titulo={t.titulo}
            descricao={t.descricao}
            paciente={t.paciente}
            funcionario={t.funcionario}
            categorias={t.categorias}
            dataPrevista={t.dataPrevista}
            onEditar={() => console.log('Editar', t._id)}
            onDeletar={() => console.log('Deletar', t._id)}
          />
        ))}
      </View>
    );
  };

  const opcoesFiltro = [
    { label: 'Todas as tarefas', value: 'todas' },
    { label: 'Minhas tarefas', value: 'minhas' }
  ];

  return (
    <>
      <View style={{ marginBottom: 16, width: larguraTela - 40, alignSelf: 'center' }}>
        <Text style={styles.progressoTitulo}>Progresso da equipe</Text>
        <View style={styles.progressoContainer}>
          <View style={[styles.progressoFill, { width: `${progresso}%` }]} />
          <Text style={styles.progressoText}>{progresso}% concluído</Text>
        </View>
        <Text style={styles.progressoContador}>
          {tarefasConcluidas.length} de {totalTarefas} tarefas concluídas
        </Text>
      </View>

      <View style={styles.filterSearchRow}>
        <View style={[styles.searchContainer, { flex: 0.58 }]}>
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
          style={[styles.inputWrapper, { flex: 0.4, marginLeft: 8 }]}
          onPress={() => setShowFiltroModal(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputLabel}>Filtrar</Text>
          <Text style={styles.input}>{filtro === 'todas' ? 'Todas as tarefas' : 'Minhas tarefas'}</Text>
        </TouchableOpacity>
      </View>

      {showFiltroModal && (
        <View
          style={[
            styles.modalContainer,
            { left: larguraTela * 0.58 + 8, width: larguraTela * 0.4, position: 'absolute', top: 105 }
          ]}
        >
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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {renderPrioridade('alta')}
        {renderPrioridade('media')}
        {renderPrioridade('baixa')}
      </ScrollView>

      {tarefasFiltradas.length === 0 && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Text style={styles.overlayTexto}>Nenhuma tarefa disponível</Text>
        </Animated.View>
      )}
    </>
  );
};

export default TarefasPrioridadeAdmin;

const styles = StyleSheet.create({
  headerPrioridade: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
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
    marginBottom: 20 
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
    marginBottom: 4 
  },
  progressoContador: { 
    textAlign: 'center', 
    marginBottom: 10, 
    fontSize: 14, 
    color: '#555', 
    fontWeight: '500' 
  },
  filterSearchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  inputWrapper: { 
    marginBottom: 0, 
    position: 'relative' 
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
  input: {
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 45,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#000',
    justifyContent: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C188F',
    borderRadius: 28,
    height: 45,
    paddingHorizontal: 12,
    backgroundColor: '#fff'
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
  modalContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 8, 
    elevation: 5 
  },
  modalOption: { 
    paddingVertical: 10, 
    paddingHorizontal: 16 
  },
  modalOptionText: { 
    fontSize: 14, 
    color: '#1B0A43' 
  },
  overlay: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayTexto: { 
    fontSize: 16, 
    color: '#555', 
    fontWeight: '500' 
  }
});
