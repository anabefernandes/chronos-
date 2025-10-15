import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Funcionario } from './FuncionarioCard';

interface FuncionarioCardSelectProps {
  funcionario: Funcionario;
  onSelect: (funcionario: Funcionario) => void;
}

export default function FuncionarioCardSelect({ funcionario, onSelect }: FuncionarioCardSelectProps) {
  const statusColorMap = {
    Ativo: '#C1E1C1',
    Atraso: '#F4C7C3',
    Folga: '#B9D7F0'
  };

  const getUserImage = () => {
    const foto = funcionario.foto;
    if (foto && (foto.startsWith('http') || foto.startsWith('https') || foto.startsWith('file://'))) {
      return { uri: foto };
    }
    return require('../../assets/images/telas-public/sem_foto.png');
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => onSelect(funcionario)}>
      <View style={styles.row}>
        <Image source={getUserImage()} style={styles.foto} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.nome}>{funcionario.nome || 'NOVO USUÁRIO'}</Text>
          <Text style={styles.cargo}>{funcionario.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
        </View>
        <View style={[styles.statusBox, { backgroundColor: statusColorMap[funcionario.status || 'Ativo'] }]}>
          <Text style={styles.statusText}>{funcionario.status || 'Ativo'}</Text>
        </View>
      </View>

      {/* Informações adicionais */}
      <View style={styles.infoBox}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Horário:</Text>
          <Text style={styles.infoValue}>{funcionario.horario || '-'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tarefas:</Text>
          <Text style={styles.infoValue}>{funcionario.tarefas || '-'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#504f5322',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222'
  },
  cargo: {
    fontSize: 14,
    color: '#555'
  },
  statusBox: {
    minWidth: 70,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 10
  },
  infoItem: {},
  infoLabel: {
    fontWeight: 'bold',
    color: '#3C188F'
  },
  infoValue: {
    color: '#555'
  }
});
