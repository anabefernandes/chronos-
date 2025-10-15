import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Funcionario {
  _id: string;
  nome: string;
  email?: string;
  role: 'funcionario' | 'chefe';
  cargo?: string;
  foto?: string;
  status?: 'Ativo' | 'Atraso' | 'Folga';
  horario?: string;
  observacao?: string;
  tarefas?: string;
  escala?: string;
}

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onEdit?: (funcionario: Funcionario) => void;
  onDelete?: (id: string) => void;
}

export default function FuncionarioCard({ funcionario, onEdit, onDelete }: FuncionarioCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const statusColorMap = {
    Ativo: '#C1E1C1',
    Atraso: '#F4C7C3',
    Folga: '#B9D7F0'
  };

  // Função para pegar a URL da imagem
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '');

  const getUserImage = () => {
    if (!funcionario.foto) return require('../../assets/images/telas-public/sem_foto.png');

    if (funcionario.foto.startsWith('http')) return { uri: funcionario.foto };

    // Se vier do backend como "/uploads/arquivo.png", converta em URL completa
    if (funcionario.foto.startsWith('/uploads')) {
      if (!baseUrl) return require('../../assets/images/telas-public/sem_foto.png');
      return { uri: `${baseUrl}${funcionario.foto}` };
    }

    return require('../../assets/images/telas-public/sem_foto.png');
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand} style={[styles.card, expanded && styles.cardExpanded]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Image source={getUserImage()} style={styles.foto} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.nome}>{funcionario.nome || 'NOVO USUÁRIO'}</Text>
          <Text style={styles.cargo}>{funcionario.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
        </View>

        <View style={styles.actionIcons}>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(funcionario)}>
              <Image source={require('../../assets/images/dashboard/icone_editar.png')} style={styles.iconImage} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(funcionario._id)}>
              <Image source={require('../../assets/images/dashboard/icone_excluir.png')} style={styles.iconImage} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.statusBox, { backgroundColor: statusColorMap[funcionario.status || 'Ativo'] }]}>
          <Text style={styles.statusText}>{funcionario.status || 'Ativo'}</Text>
        </View>
      </View>

      {/* Conteúdo expandido */}
      {expanded && (
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
