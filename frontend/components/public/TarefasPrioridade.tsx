import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions, Animated } from 'react-native';
import TarefaCard from './TarefaCard';
import LottieView from 'lottie-react-native';

// ✅ Tipo local
interface Categoria {
  nome: string;
  cor: string;
  icone: string;
}

interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  paciente?: string;
  categorias?: Categoria[];
  prioridade: 'baixa' | 'media' | 'alta';
  dataPrevista?: string;
}

interface Props {
  tarefas: Tarefa[];
}

const coresPrioridade = { alta: '#FF6B6B', media: '#FFD93D', baixa: '#4ECDC4' };
const larguraTela = Dimensions.get('window').width;

const TarefasPorPrioridade: React.FC<Props> = ({ tarefas }) => {
  const [concluidas, setConcluidas] = useState<string[]>([]);
  const [expandido, setExpandido] = useState<{ [key: string]: boolean }>({
    alta: false,
    media: false,
    baixa: false,
    concluidas: false
  });
  const [animacao, setAnimacao] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const tarefasNaoConcluidas = tarefas.filter(t => !concluidas.includes(t._id));
  const nenhumaTarefa = tarefasNaoConcluidas.length === 0;
  const tarefasConcluidas = tarefas.filter(t => concluidas.includes(t._id));
  const mostrarConcluidas = expandido['concluidas'];
  const concluidasExibidas = mostrarConcluidas ? tarefasConcluidas : tarefasConcluidas.slice(0, 3);
  const progresso = tarefas.length ? Math.round((concluidas.length / tarefas.length) * 100) : 0;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: nenhumaTarefa ? 1 : 0,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [nenhumaTarefa]);

  const rolarParaConcluidas = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    setAnimacao(false);
  };

  const marcarConcluida = (id: string) => {
    Alert.alert('Confirmação', 'Você realmente quer marcar como concluída?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        onPress: () => {
          setConcluidas(prev => [...prev, id]);
          setAnimacao(true);
          setTimeout(() => setAnimacao(false), 2000);
        }
      }
    ]);
  };

  const renderPrioridade = (prio: 'alta' | 'media' | 'baixa') => {
    const tarefasFiltradas = tarefas.filter(t => t.prioridade === prio && !concluidas.includes(t._id));
    const mostrarTodos = expandido[prio];
    const tarefasExibidas = mostrarTodos ? tarefasFiltradas : tarefasFiltradas.slice(0, 3);

    return (
      <View
        style={{ flex: 1, justifyContent: tarefasExibidas.length === 0 ? 'center' : 'flex-start', marginBottom: 24 }}
      >
        <View style={styles.headerPrioridade}>
          <View style={[styles.bolaPrioridade, { backgroundColor: coresPrioridade[prio] }]} />
          <Text style={styles.titlePrioridade}>
            {prio.toUpperCase()} ({tarefasFiltradas.length})
          </Text>
          {tarefasFiltradas.length > 3 && (
            <TouchableOpacity onPress={() => setExpandido(prev => ({ ...prev, [prio]: !prev[prio] }))}>
              <Text style={styles.expandText}>{mostrarTodos ? 'Mostrar menos' : 'Mostrar todos'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {tarefasExibidas.length > 0 ? (
          tarefasExibidas.map(t => (
            <TarefaCard
              key={t._id}
              titulo={t.titulo}
              descricao={t.descricao}
              paciente={t.paciente}
              categorias={t.categorias || []} // ✅ garante array
              dataPrevista={t.dataPrevista}
              concluida={false}
              onToggleConcluida={() => marcarConcluida(t._id)}
            />
          ))
        ) : (
          <View style={styles.tarefasVaziasContainer}>
            <LottieView
              source={require('../../assets/lottie/sem_tarefas2.json')}
              autoPlay
              loop
              style={{ width: larguraTela * 0.4, height: larguraTela * 0.4 }}
            />
            <Text style={styles.overlayTexto}>Parabéns, todas as tarefas foram concluidas!</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {animacao && (
        <View style={styles.successOverlay}>
          <LottieView
            source={require('../../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={{ width: 300, height: 300 }}
          />
        </View>
      )}

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 20, flexGrow: nenhumaTarefa ? 1 : undefined }}>
        <Text style={styles.progressoTitulo}>Progresso do dia</Text>
        <View style={styles.progressoContainer}>
          <View style={[styles.progressoFill, { width: `${progresso}%` }]} />
          <Text style={styles.progressoText}>{progresso}% concluído</Text>
        </View>
        <Text style={styles.progressoContador}>
          {concluidas.length} de {tarefas.length} {tarefas.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
        </Text>

        <View style={{ flex: nenhumaTarefa ? 1 : undefined, position: 'relative' }}>
          <View style={{ flex: 1 }}>{renderPrioridade('alta')}</View>
          <View style={{ flex: 1 }}>{renderPrioridade('media')}</View>
          <View style={{ flex: 1 }}>{renderPrioridade('baixa')}</View>

          {nenhumaTarefa && (
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
              <LottieView
                source={require('../../assets/lottie/sem_tarefas.json')}
                autoPlay
                loop
                style={{ width: larguraTela * 0.55, height: larguraTela * 0.55, marginBottom: 10 }}
              />
              <Text style={styles.overlayTexto}>Nenhuma tarefa disponível</Text>

              <TouchableOpacity style={styles.botaoVerConcluidas} onPress={rolarParaConcluidas}>
                <Text style={styles.botaoTexto}>Ver concluídas</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {tarefasConcluidas.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.titlePrioridade}>TAREFAS CONCLUÍDAS ({tarefasConcluidas.length})</Text>
            {concluidasExibidas.map(t => (
              <TarefaCard
                key={t._id}
                titulo={t.titulo}
                descricao={t.descricao}
                paciente={t.paciente}
                categorias={t.categorias || []} // ✅ garante array
                dataPrevista={t.dataPrevista}
                concluida={true}
                onToggleConcluida={() => {}}
              />
            ))}
            {tarefasConcluidas.length > 3 && (
              <TouchableOpacity onPress={() => setExpandido(prev => ({ ...prev, concluidas: !prev.concluidas }))}>
                <Text style={styles.expandText}>{mostrarConcluidas ? 'Ver menos' : 'Ver mais'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default TarefasPorPrioridade;

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
    color: '#e1e2e4ff'
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
  emptyText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center'
  },
  tarefasVaziasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 150,
    zIndex: 10
  },
  overlayTexto: {
    marginTop: 5,
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    textAlign: 'center'
  },
  successOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
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
