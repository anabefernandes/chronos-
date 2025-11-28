import React, { Key } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export interface Funcionario {
  id: Key | null | undefined;
  _id: string;
  nome: string;
  role: 'funcionario' | 'chefe';
  foto?: string;
  status?: 'Ativo' | 'Atraso' | 'Folga' | 'Almoço' | 'Inativo';
  setor: string;
}

interface FuncionarioCardProps {
  funcionario: Funcionario;
  onEdit?: (funcionario: Funcionario) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export default function FuncionarioCard({ funcionario, onEdit, onDelete, showActions = true }: FuncionarioCardProps) {
  // Status já vem padronizado do backend
  const displayStatus = () => {
    return funcionario.status || 'Inativo';
  };

  const statusColorMap: Record<string, string> = {
    Ativo: '#C1E1C1',
    Atraso: '#F4C7C3',
    Folga: '#B9D7F0',
    Almoço: '#FFD580',
    Inativo: '#BDBDBD'
  };

  const getRoleIcon = () => {
    if (funcionario.role === 'chefe') return require('../../assets/images/telas-admin/icone_chefe.png');
    return require('../../assets/images/telas-admin/icone_funcionario.png');
  };

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');

    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');

    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  return (
    <View style={styles.card}>
      <Image source={getUserImage(funcionario.foto)} style={styles.foto} />

      <View style={styles.infoContainer}>
        <Text style={styles.nome} numberOfLines={1} ellipsizeMode="tail">
          {funcionario.nome || 'NOVO USUÁRIO'}
        </Text>

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
        <View style={styles.actionContainer}>
          <View style={[styles.statusBox, { backgroundColor: statusColorMap[displayStatus()] || '#BDBDBD' }]}>
            <Text style={styles.statusText}>{displayStatus()}</Text>
          </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#504f5322',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 70
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: 200,
    flexShrink: 1
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  infoIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain'
  },
  infoText: {
    fontSize: 14,
    color: '#131212ff',
    flexShrink: 1
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8
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
  iconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain'
  }
});
