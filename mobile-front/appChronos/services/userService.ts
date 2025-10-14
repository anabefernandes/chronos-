import api from './api';

export const criarUsuario = async (dados: {
  nome: string;
  email: string;
  senha: string;
  role: 'funcionario' | 'chefe';
  foto?: string;
}) => {
  const formData = new FormData();
  formData.append('nome', dados.nome);
  formData.append('email', dados.email);
  formData.append('senha', dados.senha);
  formData.append('role', dados.role);

  if (dados.foto) {
    formData.append('foto', {
      uri: dados.foto,
      name: 'foto.jpg',
      type: 'image/*',
    } as any);
  }

  const response = await api.post('/user/criarUsuario', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
  dados: { nome?: string; email?: string; senha?: string; role?: 'funcionario' | 'chefe'; foto?: string }
) => {
  const formData = new FormData();
  if (dados.nome) formData.append('nome', dados.nome);
  if (dados.email) formData.append('email', dados.email);
  if (dados.senha) formData.append('senha', dados.senha); // só envia se houver
  if (dados.role) formData.append('role', dados.role);
  if (dados.foto) {
    formData.append('foto', {
      uri: dados.foto,
      name: 'foto.jpg',
      type: 'image/*',
    } as any);
  }

  const response = await api.put(`/user/atualizarUsuario/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const excluirUsuario = async (id: string) => {
  const response = await api.delete(`/user/excluirUsuario/${id}`);
  return response.data;
};
