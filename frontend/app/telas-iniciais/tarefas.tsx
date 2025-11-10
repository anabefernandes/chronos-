import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native'; // ← Import do Lottie
import Navbar from '../../components/public/Navbar';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import TarefasPorPrioridade from '../../components/public/TarefasPrioridade';

interface Categoria {
  nome: string;
  cor: string;
  icone: string;
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
}

export default function Tarefas() {
  const { role } = useContext(AuthContext);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        let response;
        if (role === 'admin' || role === 'chefe') {
          response = await api.get('/tarefas');
        } else {
          response = await api.get('/tarefas/minhas');
        }

        const tarefasFormatadas: Tarefa[] = response.data.map((t: any) => ({
          ...t,
          categorias:
            t.categorias?.map((c: any) => {
              if (typeof c === 'string') {
                let cor = '#3C188F';
                let icone = '⭐';
                if (c.toLowerCase().includes('soro')) (cor = '#4ECDC4'), (icone = '💧');
                if (c.toLowerCase().includes('antibiótico')) (cor = '#FF9F1C'), (icone = '💊');
                if (c.toLowerCase().includes('curativo')) (cor = '#FF6B6B'), (icone = '🩹');
                return { nome: c, cor, icone };
              } else if (typeof c === 'object' && c.nome) {
                return { nome: c.nome, cor: c.cor || '#3C188F', icone: c.icone || '⭐' };
              } else {
                return { nome: String(c), cor: '#3C188F', icone: '⭐' };
              }
            }) || [],
          paciente: t.paciente || null
        }));

        setTarefas(tarefasFormatadas);
      } catch (err) {
        console.log('Erro ao carregar tarefas:', err);
      }
    };

    carregarTarefas();
  }, [role]);

  return (
    <View style={styles.container}>
      <Navbar />
      {tarefas.length === 0 ? (
        <View style={styles.semTarefasContainer}>
          <LottieView
            source={require('../../assets/lottie/sem_tarefas.json')} // coloque o arquivo na pasta correta
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.semTarefasTexto}>Nenhuma tarefa no momento</Text>
        </View>
      ) : (
        <TarefasPorPrioridade tarefas={tarefas} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  semTarefasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lottie: {
    width: 250,
    height: 250
  },
  semTarefasTexto: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    textAlign: 'center'
  }
});
