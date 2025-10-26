import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listarFuncionarios, listarChefe } from '../services/userService';

interface User {
  _id: string;
  nome: string;
  email: string;
  role: 'funcionario' | 'chefe' | 'admin';
  setor: string;
  foto?: string;
}

interface AuthContextType {
  userId: string | null;
  role: string | null;
  nome: string | null;
  foto: string | null;
  setor: string | null;
  usuarios: User[];
  setUserId: (id: string) => void;
  setRole: (role: string) => void;
  setNome: (nome: string) => void;
  setFoto: (foto: string) => void;
  setSetor: (setor: string) => void;
  carregarUsuarios: () => void;
  getFoto: () => any; 
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  role: null,
  nome: null,
  foto: null,
  setor: null,
  usuarios: [],
  setUserId: () => {},
  setRole: () => {},
  setNome: () => {},
  setFoto: () => {},
  setSetor: () => {},
  carregarUsuarios: () => {},
  getFoto: () => require('../assets/images/telas-public/sem_foto.png')
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);
  const [nome, setNomeState] = useState<string | null>(null);
  const [foto, setFotoState] = useState<string | null>(null);
  const [setor, setSetorState] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  const setUserId = (id: string) => {
    setUserIdState(id);
    AsyncStorage.setItem('userId', id);
  };

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

  const setSetor = (newSetor: string) => {
    setSetorState(newSetor);
    AsyncStorage.setItem('setor', newSetor);
  };

  const getFoto = () => {
    // Se não houver foto definida ou for vazia, usa a padrão local
    if (!foto || typeof foto !== 'string' || foto.trim() === '') {
      return require('../assets/images/telas-public/sem_foto.png');
    }

    // Se for a foto padrão, usa require
    if (foto.includes('sem_foto.png')) {
      return require('../assets/images/telas-public/sem_foto.png');
    }

    // Para fotos enviadas pelo usuário
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');

    // Remove duplicação de 'uploads/' se houver
    const cleanFoto = foto.replace(/^\/+/, '').replace(/^uploads\//, '');

    return { uri: `${baseURL}/uploads/${cleanFoto}` };
  };

  const carregarUsuarios = async () => {
    try {
      const funcionarios = await listarFuncionarios();
      const chefe = await listarChefe();
      setUsuarios([...funcionarios, ...chefe]);
    } catch (error) {
      console.log('Erro ao carregar usuários:', error);
    }
  };

  useEffect(() => {
    const carregarAuth = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedRole = await AsyncStorage.getItem('role');
      const storedNome = await AsyncStorage.getItem('nome');
      const storedFoto = await AsyncStorage.getItem('foto');
      const storedSetor = await AsyncStorage.getItem('setor');

      if (storedUserId) setUserIdState(storedUserId);
      if (storedRole) setRoleState(storedRole);
      if (storedNome) setNomeState(storedNome);
      if (storedFoto) setFotoState(storedFoto);
      if (storedSetor) setSetorState(storedSetor);

      if (storedRole === 'admin') carregarUsuarios();
    };
    carregarAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        role,
        nome,
        foto,
        setor,
        usuarios,
        setUserId,
        setRole,
        setNome,
        setFoto,
        setSetor,
        carregarUsuarios,
        getFoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
