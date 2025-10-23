import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
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
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {tarefas.length === 0 && <Text>Nenhuma tarefa encontrada.</Text>}
        {tarefas.map(tarefa => (
          <View
            key={tarefa._id}
            style={{
              padding: 12,
              marginBottom: 12,
              borderRadius: 12,
              backgroundColor: '#F9FAFF',
              borderWidth: 1,
              borderColor: '#E0E0E0'
            }}
          >
            <Text style={{ fontWeight: '600', fontSize: 16, color: '#3C188F' }}>{tarefa.titulo}</Text>

            {tarefa.descricao && <Text style={{ marginTop: 4 }}>{tarefa.descricao}</Text>}

            {tarefa.paciente && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontWeight: '500' }}>
                  Paciente: {tarefa.paciente.nome} ({tarefa.paciente.idade || '?'} anos)
                </Text>
                {tarefa.paciente.sintomas && <Text>Sintomas: {tarefa.paciente.sintomas}</Text>}
                {tarefa.paciente.temperatura && <Text>Temperatura: {tarefa.paciente.temperatura}°C</Text>}
                {tarefa.paciente.saturacao && <Text>Saturação: {tarefa.paciente.saturacao}%</Text>}
              </View>
            )}

            {tarefa.categorias && tarefa.categorias.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {tarefa.categorias.map((c, idx) => (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: c.cor + '33',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 6,
                      marginTop: 4,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ marginRight: 4 }}>{c.icone}</Text>
                    <Text>{c.nome}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  }
});
