import api from './api';

export const criarUsuario = async (dados: {
  nome: string;
  email: string;
  senha: string;
  role: 'funcionario' | 'chefe';
  setor: string;
  cargaHorariaDiaria?: number;
  salario: number;
}) => {
  const response = await api.post('/user/criarUsuario', dados, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const listarFuncionarios = async () => {
  const response = await api.get('/user/listarFuncionarios');
  return response.data;
};

export const listarChefe = async () => {
  const response = await api.get('/user/listarChefe');
  return response.data;
};

export const atualizarUsuario = async (
  id: string,
  dados: {
    nome?: string;
    email?: string;
    senha?: string;
    role?: 'funcionario' | 'chefe';
    setor?: string;
    cargaHorariaDiaria?: number;
  }
) => {
  const response = await api.put(`/user/atualizarUsuario/${id}`, dados, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const excluirUsuario = async (id: string) => {
  const response = await api.delete(`/user/excluirUsuario/${id}`);
  return response.data;
};

export const meusPontos = async (_id: string) => {
  try {
    const response = await api.get(`/ponto/meusPontos`);
    return response.data;
  } catch (err) {
    console.error('Erro ao buscar pontos:', err);
    throw err;
  }
};

export const todosPontos = async () => {
  try {
    const response = await api.get('/ponto/todos');
    return response.data;
  } catch (err) {
    console.error('Erro ao buscar todos os pontos:', err);
    throw err;
  }
};

export const pontosDoFuncionario = async (funcionarioId: string) => {
  const pontos = await todosPontos();
  return pontos.filter((p: { funcionario?: { _id: string } }) => p.funcionario?._id === funcionarioId);
};

export const atualizarTarefa = async (id: string, status: 'pendente' | 'em_andamento' | 'concluida') => {
  try {
    const response = await api.put(`/tarefas/minha/${id}`, { status });
    return response.data;
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    throw err;
  }
};
export const atualizarTarefaAdmin = async (id: string, status: 'pendente' | 'em_andamento' | 'concluida') => {
  try {
    const response = await api.put(`/tarefas/${id}`, { status });
    return response.data;
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    throw err;
  }
};

export const listarNotificacoes = async (usuarioId: string) => {
  try {
    const response = await api.get(`/notificacoes/${usuarioId}`);
    return response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      return [];
    }
    console.error('Erro ao listar notificações:', err);
    throw err;
  }
};

export const marcarNotificacaoComoLida = async (id: string) => {
  try {
    const response = await api.patch(`/notificacoes/${id}/lida`);
    return response.data;
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    throw err;
  }
};

export const marcarTodasNotificacoesComoLidas = async (usuarioId: string) => {
  try {
    const response = await api.patch(`/notificacoes/usuario/${usuarioId}/lidas`);
    return response.data;
  } catch (err) {
    console.error('Erro ao marcar todas notificações como lidas:', err);
    throw err;
  }
};

export const excluirNotificacao = async (id: string) => {
  try {
    const response = await api.delete(`/notificacoes/${id}`);
    return response.data;
  } catch (err) {
    console.error('Erro ao excluir notificação:', err);
    throw err;
  }
};

// userService.ts

export interface Escala {
  _id: string;
  data: string;
  horaEntrada?: string;
  horaSaida?: string;
  folga?: boolean;
}

export const excluirEscala = async (idEscala: string) => {
  const response = await api.delete(`/escala/${idEscala}`);
  return response.data;
};

// Tipo base para uma escala
export interface EscalaRequest {
  funcionario: string;
  data: string;
  horaEntrada?: string;
  horaSaida?: string;
  folga?: boolean; // opcional — útil se quiser registrar folgas
}

// Criar ou editar uma escala (chefe/admin)
export const criarOuEditarEscala = async (dados: EscalaRequest) => {
  try {
    const response = await api.post('/escala/criarOuEditarEscala', dados, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar/editar escala:', error.response?.data || error.message);
    throw error;
  }
};

// Listar todas as escalas (admin)
export const listarTodasEscalas = async () => {
  try {
    const response = await api.get('/escala/todasEscalas');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao listar escalas:', error.response?.data || error.message);
    throw error;
  }
};

// Listar escalas do funcionário logado
export const minhasEscalas = async () => {
  try {
    const response = await api.get('/escala/minhasEscalas');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao listar minhas escalas:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserRole = async (): Promise<'admin' | 'chefe' | 'funcionario'> => {
  try {
    const response = await api.get('/user/me'); // rota que retorna info do usuário logado
    return response.data.role; // assume que vem { role: 'admin' | 'chefe' | 'funcionario', ... }
  } catch (err) {
    console.error('Erro ao buscar role do usuário:', err);
    return 'funcionario';
  }
};

export interface NotificacaoRequest {
  titulo: string;
  descricao: string;
  destinatario: string;
  tipo?: 'escala' | 'tarefa' | 'geral';
}

export const criarNotificacao = async (dados: NotificacaoRequest) => {
  try {
    const response = await api.post('/notificacoes/criar', dados, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (err: any) {
    console.error('Erro ao criar notificação:', err.response?.data || err.message);
    throw err;
  }
};

export const listarEscalasPorFuncionario = async (funcionarioId: string) => {
  try {
    const response = await api.get(`/escala/${funcionarioId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar escalas do funcionário:', error.response?.data || error.message);
    throw error;
  }
};
