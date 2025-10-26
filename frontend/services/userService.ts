import api from './api';

export const criarUsuario = async (dados: {
  nome: string;
  email: string;
  senha: string;
  role: 'funcionario' | 'chefe';
  setor: string;
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
  dados: { nome?: string; email?: string; senha?: string; role?: 'funcionario' | 'chefe'; setor?: string }
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
  } catch (err) {
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
