import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../../components/public/Navbar';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import TarefasPorPrioridade from '../../components/public/TarefasPrioridade';
import { Categoria } from '../../components/admin/CategoriaSelector';

interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  paciente?: string;
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
        const tarefasFormatadas = response.data.map((t: any) => ({
          ...t,
          categorias:
            t.categorias?.map((c: any) => {
              if (typeof c === 'string') {
                let cor = '#3C188F';
                let icone = '⭐';
                if (c.toLowerCase().includes('soro')) {
                  cor = '#4ECDC4';
                  icone = '💧';
                }
                if (c.toLowerCase().includes('antibiótico')) {
                  cor = '#FF9F1C';
                  icone = '💊';
                }
                if (c.toLowerCase().includes('curativo')) {
                  cor = '#FF6B6B';
                  icone = '🩹';
                }
                return { nome: c, cor, icone };
              } else if (typeof c === 'object' && c.nome) {
                return c;
              } else {
                return { nome: String(c), cor: '#3C188F', icone: '⭐' };
              }
            }) || []
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

      <TarefasPorPrioridade tarefas={tarefas} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
