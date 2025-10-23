import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Categoria } from '../admin/CategoriaSelector';

interface Paciente {
  nome: string;
  idade?: string;
  temperatura?: string;
  saturacao?: string;
  sintomas?: string;
}

interface TarefaCardProps {
  titulo: string;
  descricao?: string;
  paciente?: Paciente | null;
  categorias?: Categoria[];
  dataPrevista?: string;
  concluida?: boolean;
  onToggleConcluida?: () => void;
}

const TarefaCard: React.FC<TarefaCardProps> = ({
  titulo,
  descricao,
  paciente,
  categorias,
  dataPrevista,
  concluida = false,
  onToggleConcluida
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();

    if (onToggleConcluida) {
      onToggleConcluida();
    }
  };

  return (
    <View style={[styles.card, concluida && styles.cardConcluida]}>
      {onToggleConcluida && (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <Animated.View
            style={[
              styles.checkCircle,
              concluida && styles.checkCircleConcluido,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            {concluida && <FontAwesome5 name="check" size={16} color="#fff" />}
          </Animated.View>
        </TouchableOpacity>
      )}

      <Text style={styles.titulo}>{titulo}</Text>
      {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}

      {/* Informações do paciente */}
      {paciente && (
        <View style={{ marginTop: 6 }}>
          <Text style={styles.paciente}>
            Paciente: {paciente.nome} {paciente.idade ? `(${paciente.idade} anos)` : ''}
          </Text>
          {paciente.sintomas && <Text style={styles.paciente}>Sintomas: {paciente.sintomas}</Text>}
          {paciente.temperatura && <Text style={styles.paciente}>Temperatura: {paciente.temperatura}°C</Text>}
          {paciente.saturacao && <Text style={styles.paciente}>Saturação: {paciente.saturacao}%</Text>}
        </View>
      )}

      {(dataPrevista || (categorias && categorias.length > 0)) && (
        <View style={styles.rowBottom}>
          {dataPrevista && (
            <View style={styles.dataContainer}>
              <FontAwesome5 name="calendar-alt" size={14} color="#555" />
              <Text style={styles.dataText}>{new Date(dataPrevista).toLocaleDateString('pt-BR')}</Text>
              <FontAwesome5 name="clock" size={14} color="#555" style={{ marginLeft: 12 }} />
              <Text style={styles.dataText}>
                {new Date(dataPrevista).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}

          {categorias && categorias.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 'auto' }}>
              <View style={styles.categoriasContainer}>
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
      )}
    </View>
  );
};

export default TarefaCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: '#3C188F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFF',
    position: 'relative',
    overflow: 'hidden'
  },
  cardConcluida: { 
    opacity: 0.6 
  },
  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#3C188F',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  checkCircleConcluido: {
    backgroundColor: '#3C188F',
    borderColor: '#3C188F'
  },
  titulo: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4, 
    color: '#1B0A43' 
  },
  descricao: {
    fontSize: 14,
    marginBottom: 4,
    color: '#222'
  },
  paciente: {
    fontSize: 14,
    marginBottom: 2,
    color: '#555'
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dataText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4
  },
  categoriasContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tag: {
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  }
});
