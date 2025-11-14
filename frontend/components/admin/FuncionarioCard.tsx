import React, { Key, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Funcionario {
  id: Key | null | undefined;
  _id: string;
  nome: string;
  email?: string;
  role: 'funcionario' | 'chefe';
  cargo?: string;
  cargaHorariaDiaria?: number;
  salario: number;
  foto?: string;
  status?: 'Ativo' | 'Atraso' | 'Folga' | 'Almoço' | 'Inativo';
  horario?: string;
  observacao?: string;
  tarefas?: string;
  escala?: string;
  setor: string;
}

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onEdit?: (funcionario: Funcionario) => void;
  onDelete?: (id: string) => void;
  onSelect?: (funcionario: Funcionario) => void;
  showActions?: boolean;
}

export default function FuncionarioCard({
  funcionario,
  onEdit,
  onDelete,
  onSelect,
  showActions = true
}: FuncionarioCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handlePress = () => {
    if (onSelect) {
      onSelect(funcionario);
    } else {
      toggleExpand();
    }
  };

  // Mapear status para exibição correta
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
    Almoço: '#FFD580', // cor laranja
    Inativo: '#BDBDBD'
  };

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');

  const getRoleIcon = () => {
    if (funcionario.role === 'chefe') return require('../../assets/images/telas-admin/icone_chefe.png');
    return require('../../assets/images/telas-admin/icone_funcionario.png');
  };

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');

    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={[styles.card, expanded && styles.cardExpanded]}>
      <View style={styles.header}>
        <Image source={getUserImage(funcionario.foto)} style={styles.foto} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.nome}>{funcionario.nome || 'NOVO USUÁRIO'}</Text>

          <View style={styles.infoRow}>
            <Image source={getRoleIcon()} style={styles.infoIcon} />
            <Text style={styles.infoText}>{funcionario.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Image source={setorIcon} style={styles.infoIcon} />
            <Text style={styles.infoText}>{funcionario.setor}</Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actionIcons}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(funcionario)}>
                <Image source={require('../../assets/images/telas-admin/icone_editar.png')} style={styles.iconImage} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(funcionario._id)}>
                <Image source={require('../../assets/images/telas-admin/icone_excluir.png')} style={styles.iconImage} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.statusBox, { backgroundColor: statusColorMap[displayStatus()] || '#BDBDBD' }]}>
          <Text style={styles.statusText}>{displayStatus()}</Text>
        </View>
      </View>

      {!onSelect && expanded && (
        <View style={styles.expandedContainer}>
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
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#504f5322'
  },
  cardExpanded: {
    borderWidth: 1.5,
    borderColor: '#2e1b694b',
    shadowOpacity: 0,
    elevation: 0
  },
  header: {
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
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  infoIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain'
  },
  infoText: {
    fontSize: 14,
    color: '#131212ff'
  },
  statusBox: {
    minWidth: 70,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginLeft: 8
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  expandedContainer: {
    marginTop: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4
  },
  value: {
    color: '#555',
    marginBottom: 4
  },
  actionIcons: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 8
  },
  iconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginLeft: 8
  }
});
