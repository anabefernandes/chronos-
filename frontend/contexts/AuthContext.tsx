import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listarFuncionarios, listarChefe, listarNotificacoes } from '../services/userService';
import { Alert, Vibration } from 'react-native';
import { io } from 'socket.io-client';

export interface Funcionario {
  _id: string;
  nome: string;
  email?: string;
  role: 'funcionario' | 'chefe' | 'admin';
  setor: string;
  foto?: string;
  status?: 'Ativo' | 'Atraso' | 'Folga' | 'Almoço' | 'Inativo';
  horario?: string;
  observacao?: string;
  tarefas?: string;
  escala?: string;
  cargo?: string;
  cargaHorariaDiaria?: number;
  salario?: number;
}

export interface AuthContextType {
  userId: string | null;
  role: string | null;
  nome: string | null;
  foto: string | null;
  setor: string | null;
  usuarios: Funcionario[];
  notificacoesNaoLidas: number;
  setUserId: (id: string) => void;
  setRole: (role: string) => void;
  setNome: (nome: string) => void;
  setFoto: (foto: string) => void;
  setSetor: (setor: string) => void;
  setUsuarios: (usuarios: Funcionario[] | ((prev: Funcionario[]) => Funcionario[])) => void;
  carregarUsuarios: () => void;
  getFoto: () => any;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  role: null,
  nome: null,
  foto: null,
  setor: null,
  usuarios: [],
  notificacoesNaoLidas: 0,
  setUserId: () => {},
  setRole: () => {},
  setNome: () => {},
  setFoto: () => {},
  setSetor: () => {},
  setUsuarios: () => {},
  carregarUsuarios: () => {},
  getFoto: () => require('../assets/images/telas-public/sem_foto.png'),
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);
  const [nome, setNomeState] = useState<string | null>(null);
  const [foto, setFotoState] = useState<string | null>(null);
  const [setor, setSetorState] = useState<string | null>(null);
  const [usuarios, setUsuariosState] = useState<Funcionario[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState<number>(0);

  const prevNotificacoesRef = useRef<number>(0);

  // Funções set + AsyncStorage
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
  const setUsuarios = (u: Funcionario[] | ((prev: Funcionario[]) => Funcionario[])) => {
    setUsuariosState(u);
  };

  const logout = async () => {
    try {
      setUserIdState(null);
      setRoleState(null);
      setNomeState(null);
      setFotoState(null);
      setSetorState(null);
      setUsuariosState([]);
      setNotificacoesNaoLidas(0);

      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('nome');
      await AsyncStorage.removeItem('foto');
      await AsyncStorage.removeItem('setor');
    } catch (err) {
      console.log('Erro ao fazer logout:', err);
    }
  };

  const getFoto = () => {
    if (!foto || foto.trim() === '') return require('../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
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

  const carregarNotificacoes = async (showAlert = false) => {
    if (!userId) return;
    try {
      const notificacoes = await listarNotificacoes(userId);
      const naoLidas = notificacoes.filter((n: any) => !n.lida).length;
      if (showAlert && naoLidas > prevNotificacoesRef.current) {
        Alert.alert('📢 Nova tarefa!', 'Você recebeu uma nova tarefa.');
        Vibration.vibrate(500);
      }
      prevNotificacoesRef.current = naoLidas;
      setNotificacoesNaoLidas(naoLidas);
    } catch (err) {
      console.log('Erro ao listar notificações:', err);
    }
  };

  // Carrega dados do AsyncStorage
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

  // Socket de notificações
  useEffect(() => {
    if (!userId) return;

    const socket = io(process.env.EXPO_PUBLIC_API_URL || '', { transports: ['websocket'], reconnection: true });
    socket.emit('join', userId);

    socket.on('nova_notificacao', (data: any) => {
      if (data.usuario === userId) carregarNotificacoes(true);
    });

    carregarNotificacoes(false);
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{
        userId,
        role,
        nome,
        foto,
        setor,
        usuarios,
        notificacoesNaoLidas,
        setUserId,
        setRole,
        setNome,
        setFoto,
        setSetor,
        setUsuarios,
        carregarUsuarios,
        getFoto,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};