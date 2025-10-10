import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listarFuncionarios, listarChefe } from '../services/userService';

interface User {
  _id: string;
  nome: string;
  email: string;
  role: 'funcionario' | 'chefe';
  foto?: string;
  status?: 'Ativo' | 'Atraso' | 'Folga';
  horario?: string;
  observacao?: string;
  tarefas?: string;
  escala?: string;
}

interface AuthContextType {
  role: string | null;
  nome: string | null;
  foto: string | null;
  usuarios: User[];
  setRole: (role: string) => void;
  setNome: (nome: string) => void;
  setFoto: (foto: string) => void;
  carregarUsuarios: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  role: null,
  nome: null,
  foto: null,
  usuarios: [],
  setRole: () => {},
  setNome: () => {},
  setFoto: () => {},
  carregarUsuarios: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<string | null>(null);
  const [nome, setNomeState] = useState<string | null>(null);
  const [foto, setFotoState] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  const setRole = (newRole: string) => {
    setRoleState(newRole);
    AsyncStorage.setItem('role', newRole);
  };

  const setNome = (newNome: string) => {
    setNomeState(newNome);
    AsyncStorage.setItem('nome', newNome);
  };

  const setFoto = (newFoto: string) => {
    setFotoState(newFoto);
    AsyncStorage.setItem('foto', newFoto);
  };

  // Função para carregar usuários do back
  const carregarUsuarios = async () => {
    try {
      const funcionarios = await listarFuncionarios();
      const chefe = await listarChefe();
      setUsuarios([...funcionarios, ...chefe]);
    } catch (error) {
      console.log('Erro ao carregar usuários:', error);
    }
  };

  // Recupera role, nome, foto e carrega usuários se admin
  useEffect(() => {
    const carregarAuth = async () => {
      const storedRole = await AsyncStorage.getItem('role');
      const storedNome = await AsyncStorage.getItem('nome');
      const storedFoto = await AsyncStorage.getItem('foto');

      if (storedRole) setRoleState(storedRole);
      if (storedNome) setNomeState(storedNome);
      if (storedFoto) setFotoState(storedFoto);

      if (storedRole === 'admin') {
        carregarUsuarios();
      }
    };
    carregarAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        nome,
        foto,
        usuarios,
        setRole,
        setNome,
        setFoto,
        carregarUsuarios
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
