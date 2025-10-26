import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ScrollView
} from 'react-native';
import { Categoria } from '../admin/CategoriaSelector';
import { AuthContext } from '../../contexts/AuthContext';
import { atualizarTarefa } from '../../services/userService';

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
  (UIManager as any).setLayoutAnimationEnabledExperimental(true);
}

interface Paciente {
  nome: string;
  idade?: string;
  temperatura?: string;
  saturacao?: string;
  sintomas?: string;
}

interface Funcionario {
  id: string;
  nome: string;
  foto?: string;
  setor?: string;
  role?: 'chefe' | 'funcionario' | 'admin';
}

interface TarefaCardAdminProps {
  tarefa: {
    _id: string;
    titulo: string;
    descricao?: string;
    paciente?: Paciente | null;
    funcionario?: Funcionario;
    categorias?: Categoria[];
    dataPrevista?: string;
    status?: 'pendente' | 'em_andamento' | 'concluida';
  };
  onEditar?: () => void;
  onDeletar?: () => void;
  isLoggedUser?: boolean;
  onToggleConcluida?: (novaConcluida: boolean) => void;
}

const TarefaCardAdmin: React.FC<TarefaCardAdminProps> = ({
  tarefa,
  onEditar,
  onDeletar,
  isLoggedUser,
  onToggleConcluida
}) => {
  const { userId: loggedUserId } = useContext(AuthContext);
  const [showPaciente, setShowPaciente] = useState(false);
  const [concluida, setConcluida] = useState(tarefa.status === 'concluida');

  const togglePaciente = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {}
    setShowPaciente(prev => !prev);
  };

  const handlePressCheck = async () => {
    if (!tarefa._id) return;

    const novaConcluida = !concluida;

    Alert.alert(
      novaConcluida ? 'Concluir tarefa' : 'Remover conclusão',
      novaConcluida
        ? 'Deseja marcar esta tarefa como concluída?'
        : 'Deseja marcar esta tarefa como pendente novamente?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await atualizarTarefa(tarefa._id, novaConcluida ? 'concluida' : 'pendente');
              setConcluida(novaConcluida);
              if (onToggleConcluida) {
                onToggleConcluida(novaConcluida);
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Erro', 'Não foi possível atualizar o status da tarefa.');
            }
          }
        }
      ]
    );
  };
  const funcionario = tarefa.funcionario;
  const isUser = isLoggedUser ?? funcionario?.id === loggedUserId;

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const chefeIcon = require('../../assets/images/telas-admin/icone_chefe.png');
  const funcIcon = require('../../assets/images/telas-admin/icone_funcionario.png');

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  return (
    <View style={[styles.card, concluida && styles.cardConcluida]}>
      {funcionario && (
        <View style={styles.topContainer}>
          <View style={styles.funcionarioContainer}>
            <Image source={getUserImage(funcionario.foto)} style={styles.foto} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.funcionarioNome}>{funcionario.nome}</Text>
              {(() => {
                const roleNormalizada =
                  funcionario.role === 'chefe' || funcionario.role === 'admin' ? 'chefe' : 'funcionario';
                const cargoIcon = roleNormalizada === 'chefe' ? chefeIcon : funcIcon;

                return (
                  <View style={styles.infoRow}>
                    <Image source={cargoIcon} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{roleNormalizada === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
                  </View>
                );
              })()}
              <View style={styles.infoRow}>
                <Image source={setorIcon} style={styles.infoIcon} />
                <Text style={styles.infoText}>{funcionario.setor || 'Sem setor'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {isUser ? (
              <TouchableOpacity style={styles.checkContainer} onPress={handlePressCheck}>
                <View
                  style={[styles.checkCircle, concluida ? styles.checkCircleConcluida : styles.checkCirclePendente]}
                >
                  {concluida && (
                    <Image
                      source={require('../../assets/images/telas-public/icone_check.png')}
                      style={styles.checkIconInside}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <>
                {onEditar && (
                  <TouchableOpacity onPress={onEditar}>
                    <Image
                      source={require('../../assets/images/telas-admin/icone_editar.png')}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                )}
                {onDeletar && (
                  <TouchableOpacity onPress={onDeletar}>
                    <Image
                      source={require('../../assets/images/telas-admin/icone_excluir.png')}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.blocoFundo}>
        <Text style={[styles.titulo, { textAlign: 'center' }]}>{tarefa.titulo}</Text>
        {tarefa.descricao && <Text style={[styles.descricao, { textAlign: 'center' }]}>{tarefa.descricao}</Text>}

        {tarefa.paciente && (
          <View style={styles.pacienteCard}>
            <TouchableOpacity style={styles.pacienteHeader} onPress={togglePaciente}>
              <Image
                source={require('../../assets/images/telas-admin/icone_informacao.png')}
                style={styles.pacienteIcon}
              />
              <Text style={styles.pacienteHeaderTitle}>
                {showPaciente ? 'Ocultar informações do paciente' : 'Ver informações do paciente'}
              </Text>
              <Image
                source={require('../../assets/images/telas-admin/icone_seta.png')}
                style={[styles.setaIcon, { transform: [{ rotate: showPaciente ? '180deg' : '0deg' }] }]}
              />
            </TouchableOpacity>

            {showPaciente && (
              <View style={styles.pacienteGrid}>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_paciente.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Paciente</Text>
                  <Text style={styles.pacienteHeaderValue}>{tarefa.paciente.nome}</Text>
                  <Text style={styles.pacienteHeaderValue}>
                    {tarefa.paciente.idade ? `${tarefa.paciente.idade} anos` : '-'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_sintomas.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Sintomas</Text>
                  <Text style={styles.gridValue}>{tarefa.paciente.sintomas || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_temperatura.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Temperatura</Text>
                  <Text style={styles.gridValue}>
                    {tarefa.paciente.temperatura ? `${tarefa.paciente.temperatura}°C` : '-'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_saturacao.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Saturação</Text>
                  <Text style={styles.gridValue}>
                    {tarefa.paciente.saturacao ? `${tarefa.paciente.saturacao}%` : '-'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {tarefa.dataPrevista && (
        <View style={styles.dataWrapper}>
          <Text style={styles.dataHeader}>Data e Horário</Text>
          <View style={styles.dataCardsContainer}>
            <View style={styles.dataCard}>
              <Image
                source={require('../../assets/images/telas-admin/icone_calendario.png')}
                style={styles.dataCardIcon}
              />
              <Text style={styles.dataCardText}>{new Date(tarefa.dataPrevista).toLocaleDateString('pt-BR')}</Text>
            </View>
            <View style={styles.dataCard}>
              <Image
                source={require('../../assets/images/telas-admin/icone_relogio.png')}
                style={styles.dataCardIcon}
              />
              <Text style={styles.dataCardText}>
                {new Date(tarefa.dataPrevista).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {tarefa.categorias && tarefa.categorias.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasContainer}
        >
          <View style={styles.tagsWrapper}>
            {tarefa.categorias.map(cat => (
              <View key={cat.nome} style={[styles.tag, { backgroundColor: cat.cor }]}>
                <Text style={styles.tagText}>
                  {cat.icone} {cat.nome}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default TarefaCardAdmin;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    borderColor: '#ccc',
    borderWidth: 1
  },
  cardConcluida: {
    opacity: 0.6
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  funcionarioContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  funcionarioNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 4
  },
  infoText: {
    fontSize: 14,
    color: '#333'
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionIcon: {
    width: 24,
    height: 24,
    marginLeft: 12
  },
  checkContainer: {
    padding: 6
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3C188F',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkCircleConcluida: {
    backgroundColor: '#fff'
  },
  checkCirclePendente: {
    backgroundColor: '#fff'
  },
  checkIconInside: {
    width: 20,
    height: 20,
    resizeMode: 'contain'
  },
  blocoFundo: {
    backgroundColor: '#91cbd3',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B0A43',
    marginBottom: 4,
    textAlign: 'center'
  },
  descricao: {
    fontSize: 14,
    color: '#222121ff',
    marginBottom: 8,
    textAlign: 'center'
  },
  separator: {
    height: 1,
    backgroundColor: '#cccccc7c',
    marginVertical: 10
  },
  pacienteCard: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8
  },
  pacienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  pacienteIcon: {
    width: 30,
    height: 30
  },
  pacienteHeaderTitle: {
    fontSize: 14,
    color: '#1B0A43',
    fontWeight: '700',
    marginLeft: 8
  },
  setaIcon: {
    width: 16,
    height: 16,
    marginLeft: 'auto'
  },
  pacienteHeaderValue: {
    fontSize: 14,
    color: '#555'
  },
  pacienteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1
  },
  gridIcon: {
    width: 24,
    height: 24,
    marginBottom: 4
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3C188F',
    marginBottom: 2
  },
  gridValue: {
    fontSize: 13,
    color: '#555'
  },
  dataWrapper: {
    marginBottom: 8
  },
  dataHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B0A43',
    marginBottom: 4,
    textAlign: 'center'
  },
  dataCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8
  },
  dataCard: {
    flex: 1,
    backgroundColor: '#fbfafaff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e6e4e4ff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: Platform.OS === 'android' ? 0 : 2
  },
  dataCardIcon: {
    width: 18,
    height: 18,
    marginRight: 4
  },
  dataCardText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center'
  },
  categoriasContainer: {
    width: '100%',
    paddingVertical: 4
  },
  tagsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 3
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6
  },
  tagText: {
    fontSize: 12,
    color: '#fff'
  }
});
