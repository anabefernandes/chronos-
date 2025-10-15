import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../../components/public/Navbar';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import TarefasPrioridadeAdmin from '../../components/admin/TarefaPrioridadeAdmin';

interface Funcionario {
  _id: string;
  nome: string;
  foto?: string;
}

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
  funcionario: Funcionario;
}

export default function TarefasAdmin() {
  const { role, nome, usuarios } = useContext(AuthContext);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Pega o ID do usuário logado pelo nome
    const usuario = usuarios.find(u => u.nome === nome);
    setUsuarioLogadoId(usuario?._id);
  }, [nome, usuarios]);

  useEffect(() => {
    const carregarTarefas = async () => {
      try {
        const response = await api.get('/tarefas');

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
            }) || [],
          funcionario: t.funcionario || { _id: '', nome: 'Sem funcionário', foto: undefined }
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
      <TarefasPrioridadeAdmin tarefas={tarefas} usuarioLogadoId={usuarioLogadoId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});
