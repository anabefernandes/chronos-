import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

export interface PontoDetalhado {
  data: string;
  entrada?: string;
  almoco?: string;
  retorno?: string;
  saida?: string;
  horasTrabalhadas: number;
  horasExtras?: number;
  horasFaltantes?: number;
}

interface DiasRegistradosProps {
  pontos: PontoDetalhado[];
}

const pontoCores = {
  Entrada: '#4CAF50',
  Almoço: '#FFA500',
  Retorno: '#2196F3',
  Saída: '#F44336'
};

// Converte string ISO UTC para horário local de SP
const toLocalDate = (iso: string) => {
  const dataUTC = new Date(iso);
  const dataLocal = new Date(dataUTC.getTime() - dataUTC.getTimezoneOffset() * 60000);
  return dataLocal;
};

export default function DiasRegistrados({ pontos }: DiasRegistradosProps) {
  const formatHora = (hora?: string) => {
    if (!hora) return '-/-';
    const dataLocal = toLocalDate(hora);
    return format(dataLocal, 'HH:mm');
  };

  const formatHorasTrabalhadas = (horas: number) => {
    if (horas < 0.01) return '0h';
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
  };

  const renderItem = ({ item }: { item: PontoDetalhado }) => {
    const dataLocal = toLocalDate(item.data);
    const diaSemana = format(dataLocal, 'EEEE', { locale: ptBR });
    const dataFormatada = format(dataLocal, 'dd/MM/yyyy', { locale: ptBR });

    const pontosDia = [
      { tipo: 'Entrada', hora: item.entrada },
      { tipo: 'Almoço', hora: item.almoco },
      { tipo: 'Retorno', hora: item.retorno },
      { tipo: 'Saída', hora: item.saida }
    ];

    return (
      <View style={styles.card}>
        <Text style={styles.diaSemana}>{diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}</Text>

        {pontosDia.map((ponto, index) => (
          <View key={index} style={styles.linha}>
            {index < pontosDia.length - 1 && <View style={[styles.verticalLine, { backgroundColor: '#3C188F' }]} />}
            <View style={[styles.circle, { backgroundColor: pontoCores[ponto.tipo as keyof typeof pontoCores] }]} />

            <View style={styles.infoPonto}>
              <View style={styles.tipoHora}>
                <Text style={styles.label}>{ponto.tipo}</Text>
                <Text style={styles.hora}>{formatHora(ponto.hora)}</Text>
              </View>
              <Text style={styles.data}>{dataFormatada}</Text>
            </View>
          </View>
        ))}

        <View style={styles.horasContainer}>
          <Image
            source={require('../../assets/images/telas-admin/icone_relogio.png')}
            style={styles.horasIcon}
          />
          <Text style={styles.horasLabel}>Horas Trabalhadas:</Text>
          <Text style={styles.horas}>{formatHorasTrabalhadas(item.horasTrabalhadas)}</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={pontos}
      keyExtractor={(item, index) => item.data + index}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 5 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: 250,
    minHeight: 300,
    backgroundColor: '#fff',
    padding: 15,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: '#ddd', 
    shadowColor: '#000',
    shadowOpacity: 0.2, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 6,
    elevation: 5
  },
  diaSemana: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#17153A',
    marginBottom: 15,
    textAlign: 'center'
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative'
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    top: 12,
    bottom: -12,
    left: 5
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 2
  },
  infoPonto: {
    flex: 1
  },
  label: {
    fontSize: 14,
    color: '#333'
  },
  data: {
    fontSize: 12,
    color: '#666'
  },
  hora: {
    fontSize: 14,
    color: '#666'
  },
  horasContainer: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  horasLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 5
  },
  horas: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#17153A'
  },
  tipoHora: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  horasIcon: {
    width: 18,
    height: 18,
    marginRight: 5
  }
});
