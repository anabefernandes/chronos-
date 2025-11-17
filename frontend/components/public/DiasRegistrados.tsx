import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PontoDetalhado {
  data: string;
  entrada?: string;
  almoco?: string;
  retorno?: string;
  saida?: string;
  horasTrabalhadas: number; // agora number
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

export default function DiasRegistrados({ pontos }: DiasRegistradosProps) {
  const formatHora = (hora?: string) => (hora ? hora.slice(11, 16) : '-/-');

  const formatHorasTrabalhadas = (horas: number) => {
    // arredonda para 2 casas decimais ou converte para h:min
    if (horas < 0.01) return '0h';
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
  };

  const renderItem = ({ item }: { item: PontoDetalhado }) => {
    const diaSemana = format(parseISO(item.data), 'EEEE', { locale: ptBR });
    const dataFormatada = format(parseISO(item.data), 'dd-MM-yyyy');

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
            {/* Linha vertical roxa conectando os pontos */}
            {index < pontosDia.length - 1 && <View style={[styles.verticalLine, { backgroundColor: '#3C188F' }]} />}

            {/* Bolinha com cor específica */}
            <View style={[styles.circle, { backgroundColor: pontoCores[ponto.tipo as keyof typeof pontoCores] }]} />

            {/* Tipo de ponto e horário */}
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
            source={require('../../assets/images/telas-admin/icone_relogio.png')} // caminho do seu PNG
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
    borderWidth: 1, // adiciona borda
    borderColor: '#ddd', // cor da borda
    shadowColor: '#000',
    shadowOpacity: 0.2, // aumenta um pouco a opacidade da sombra
    shadowOffset: { width: 0, height: 4 }, // deixa a sombra mais visível
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
