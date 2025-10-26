import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Categoria } from '../admin/CategoriaSelector';

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

interface TarefaCardFuncionarioProps {
  titulo: string;
  descricao?: string;
  paciente?: Paciente | null;
  categorias?: Categoria[];
  dataPrevista?: string;
  concluida?: boolean;
  onToggleConcluida?: () => void;
}

const TarefaCardFuncionario: React.FC<TarefaCardFuncionarioProps> = ({
  titulo,
  descricao,
  paciente,
  categorias,
  dataPrevista,
  concluida = false,
  onToggleConcluida
}) => {
  const [showPaciente, setShowPaciente] = useState(false);

  const togglePaciente = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (e) {}
    setShowPaciente(prev => !prev);
  };

  const handlePressCheck = () => {
    onToggleConcluida && onToggleConcluida();
  };

  return (
    <View style={[styles.card, concluida && styles.cardConcluida]}>
      {onToggleConcluida && (
        <TouchableOpacity style={styles.checkContainer} onPress={handlePressCheck}>
          <View style={[styles.checkCircle, concluida ? styles.checkCircleConcluida : styles.checkCirclePendente]}>
            {concluida && (
              <Image
                source={require('../../assets/images/telas-public/icone_check.png')}
                style={styles.checkIconInside}
              />
            )}
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.blocoFundo}>
        <Text style={[styles.titulo, { textAlign: 'center' }]}>{titulo}</Text>
        {descricao && <Text style={[styles.descricao, { textAlign: 'center' }]}>{descricao}</Text>}

        {paciente && (
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
                  <Text style={styles.pacienteHeaderValue}>{paciente.nome}</Text>
                  <Text style={styles.pacienteHeaderValue}>{paciente.idade ? `${paciente.idade} anos` : '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_sintomas.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Sintomas</Text>
                  <Text style={styles.gridValue}>{paciente.sintomas || '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_temperatura.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Temperatura</Text>
                  <Text style={styles.gridValue}>{paciente.temperatura ? `${paciente.temperatura}°C` : '-'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Image
                    source={require('../../assets/images/telas-admin/icone_saturacao.png')}
                    style={styles.gridIcon}
                  />
                  <Text style={styles.gridTitle}>Saturação</Text>
                  <Text style={styles.gridValue}>{paciente.saturacao ? `${paciente.saturacao}%` : '-'}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {dataPrevista && (
        <View style={styles.dataWrapper}>
          <Text style={styles.dataHeader}>Data e Horário</Text>
          <View style={styles.dataCardsContainer}>
            <View style={styles.dataCard}>
              <Image
                source={require('../../assets/images/telas-admin/icone_calendario.png')}
                style={styles.dataCardIcon}
              />
              <Text style={styles.dataCardText}>{new Date(dataPrevista).toLocaleDateString('pt-BR')}</Text>
            </View>
            <View style={styles.dataCard}>
              <Image
                source={require('../../assets/images/telas-admin/icone_relogio.png')}
                style={styles.dataCardIcon}
              />
              <Text style={styles.dataCardText}>
                {new Date(dataPrevista).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      )}

      {categorias && categorias.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasContainer}
        >
          <View style={styles.tagsWrapper}>
            {categorias.map(cat => (
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

export default TarefaCardFuncionario;

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
    borderWidth: 1,
    position: 'relative'
  },
  cardConcluida: {
    opacity: 0.6
  },
  checkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10
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
    borderColor: '#f3f2f2ff',
    shadowColor: '#060606ff',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: Platform.OS === 'android' ? 0 : 2
  },
  dataCardIcon: {
    width: 18,
    height: 18,
    marginRight: 3
  },
  dataCardText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center'
  },
  categoriasContainer: {
    width: '100%'
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
  checkCirclePendente: {
    backgroundColor: '#fff'
  },
  checkCircleConcluida: {
    backgroundColor: '#ffffffff'
  },
  checkIconInside: {
    width: 20,
    height: 20,
    resizeMode: 'contain'
  }
});
