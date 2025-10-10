import api from './api';

export const criarUsuario = async (dados: {
  nome: string;
  email: string;
  senha: string;
  role: 'funcionario' | 'chefe';
}) => {
  const response = await api.post('/user/criarUsuario', dados);
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
  dados: { nome?: string; email?: string; senha?: string; role?: 'funcionario' | 'chefe' }
) => {
  const response = await api.put(`/user/atualizarUsuario/${id}`, dados);
  return response.data;
};

export const excluirUsuario = async (id: string) => {
  const response = await api.delete(`/user/excluirUsuario/${id}`);
  return response.data;
};
