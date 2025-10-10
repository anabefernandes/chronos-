import React, { useState, useContext, JSX } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import Navegacao from '../../components/public/Navegacao';
import Ponto from '../telas-iniciais/ponto';
import Tarefas from '../telas-iniciais/tarefas';
import Escalas from '../telas-iniciais/escalas';
import Holerite from '../telas-iniciais/holerite';

export default function Painel() {
  const { role } = useContext(AuthContext);

  const [activeScreen, setActiveScreen] = useState('ponto');

  const screens: Record<string, JSX.Element> = {
    ponto: <Ponto />,
    tarefas: <Tarefas />,
    escalas: <Escalas />,
    holerite: <Holerite />
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{screens[activeScreen] || <Ponto />}</View>

      <Navegacao activeScreen={activeScreen} onScreenChange={setActiveScreen} />
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
