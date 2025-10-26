import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import NavegacaoAdmin from '../../components/admin/NavegacaoAdmin';
import { AuthContext } from '../../contexts/AuthContext';

import Ponto from '../telas-iniciais/ponto';
import Escalas from '../telas-iniciais/escalas';
import Holerite from '../telas-iniciais/holerite';
import Perfil from '../telas-iniciais/perfil';
import Dashboard from './dashboard-admin';
import GerenciarFuncionarios from './gerenciar-funcionarios';
import CriarTarefas from './criar-tarefas';
import TarefasAdmin from './tarefas-admin';
import Notificacoes from '../telas-iniciais/notificacoes';

type ScreenKey =
  | 'dashboard'
  | 'ponto'
  | 'tarefas'
  | 'criar-tarefas'
  | 'escalas'
  | 'holerite'
  | 'gerenciar-funcionarios'
  | 'notificacoes'
  | 'perfil';

export default function PainelAdmin() {
  const { role } = useContext(AuthContext);
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('dashboard');

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen as ScreenKey);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard setActiveScreen={handleScreenChange} />;
      case 'ponto':
        return <Ponto />;
      case 'tarefas':
        return <TarefasAdmin />;
      case 'criar-tarefas':
        return <CriarTarefas />;
      case 'notificacoes':
        return <Notificacoes />;
      case 'escalas':
        return <Escalas />;
      case 'holerite':
        return <Holerite />;
      case 'gerenciar-funcionarios':
        return <GerenciarFuncionarios />;
      case 'perfil':
        return <Perfil />;
      default:
        return <Dashboard setActiveScreen={handleScreenChange} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <NavegacaoAdmin activeScreen={activeScreen} onScreenChange={handleScreenChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1
  }
});
