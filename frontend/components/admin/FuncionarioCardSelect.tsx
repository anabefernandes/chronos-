import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Funcionario } from './FuncionarioCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FuncionarioCardSelectProps {
  funcionario: Funcionario;
  onSelect: (funcionario: Funcionario) => void;
}

export default function FuncionarioCardSelect({ funcionario, onSelect }: FuncionarioCardSelectProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (onSelect) onSelect(funcionario);
    toggleExpand();
  };

  // Função para mapear status corretamente
  const displayStatus = () => {
    if (!funcionario.status) return 'Inativo';

    switch (funcionario.status.toLowerCase()) {
      case 'almoco':
      case 'almoço':
        return 'Almoço';
      case 'entrada':
      case 'ativo':
        return 'Ativo';
      case 'saida':
      case 'inativo':
        return 'Inativo';
      case 'folga':
        return 'Folga';
      case 'atraso':
        return 'Atraso';
      default:
        return funcionario.status;
    }
  };

  const statusColorMap: Record<string, string> = {
    Ativo: '#C1E1C1',
    Atraso: '#F4C7C3',
    Folga: '#B9D7F0',
    Almoço: '#FFD580',
    Inativo: '#BDBDBD'
  };

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const cargoIcon =
    funcionario.role === 'chefe'
      ? require('../../assets/images/telas-admin/icone_chefe.png')
      : require('../../assets/images/telas-admin/icone_funcionario.png');

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');

    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  return (
    <TouchableOpacity style={[styles.card, expanded && styles.cardExpanded]} activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.row}>
        <Image source={getUserImage(funcionario.foto)} style={styles.foto} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.nome}>{funcionario.nome || 'NOVO USUÁRIO'}</Text>

          <View style={styles.infoRow}>
            <Image source={cargoIcon} style={styles.infoIcon} />
            <Text style={styles.infoText}>{funcionario.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Image source={setorIcon} style={styles.infoIcon} />
            <Text style={styles.infoText}>{funcionario.setor}</Text>
          </View>
        </View>

        <View style={[styles.statusBox, { backgroundColor: statusColorMap[displayStatus()] || '#BDBDBD' }]}>
          <Text style={styles.statusText}>{displayStatus()}</Text>
        </View>

        <TouchableOpacity onPress={toggleExpand} style={{ marginLeft: 8 }}>
          <Image
            source={
              expanded
                ? require('../../assets/images/telas-admin/icone_olho-aberto.png')
                : require('../../assets/images/telas-admin/icone_olho-fechado.png')
            }
            style={{ width: 24, height: 24 }}
          />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expandedContainer}>
          <View style={styles.expandedBox}>
            <View style={styles.row}>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Horário:</Text>
                <Text style={styles.value}>{funcionario.horario || '-'}</Text>
                <Text style={styles.label}>Observação:</Text>
                <Text style={styles.value}>{funcionario.observacao || '-'}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.label}>Tarefas:</Text>
                <Text style={styles.value}>{funcionario.tarefas || '-'}</Text>
                <Text style={styles.label}>Escala:</Text>
                <Text style={styles.value}>{funcionario.escala || '-'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  cardExpanded: {
    paddingBottom: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  nome: {
    fontSize: 16,
    fontWeight: '600'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 4
  },
  infoText: {
    fontSize: 14,
    color: '#555'
  },
  statusBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    width: 70,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center'
  },
  expandedContainer: {
    marginTop: 12
  },
  expandedBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 8
  },
  infoBox: {
    flex: 1
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginTop: 4
  },
  value: {
    fontSize: 14,
    color: '#333'
  }
});
