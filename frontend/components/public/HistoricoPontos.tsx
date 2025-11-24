import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, LayoutAnimation, Platform, UIManager } from 'react-native';

interface RegistrosDia {
  entrada?: string;
  almoco?: string;
  retorno?: string;
  saida?: string;
}

interface PontoDia {
  data: string;
  registros: RegistrosDia;
}

interface Props {
  historico: PontoDia[];
}

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const NOME_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const ORDEM: (keyof RegistrosDia)[] = ['entrada', 'almoco', 'retorno', 'saida'];

const toLocalISO = (d: Date) => {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const HistoricoPontos = ({ historico }: Props) => {
  const [aberto, setAberto] = useState<string | null>(null);
  const [offsetSemana, setOffsetSemana] = useState(0);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const formatarData = (dataISO: string) => {
    const [yyyy, mm, dd] = dataISO.split('-');
    const data = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const diaSemana = NOME_DIAS[data.getDay()];
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return `${diaSemana}, ${dia} ${mes}`;
  };

  const cores: Record<keyof RegistrosDia, string> = {
    entrada: '#4CAF50',
    almoco: '#FF9800',
    retorno: '#2196F3',
    saida: '#F44336'
  };

  const getSemana = (offset = 0) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    hoje.setDate(hoje.getDate() + offset * 7);

    const diaSemana = hoje.getDay();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - diaSemana);
    inicio.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dias.push({
        label: DIAS_SEMANA[d.getDay()],
        numero: d.getDate(),
        iso: toLocalISO(d),
        isHoje: toLocalISO(d) === toLocalISO(new Date())
      });
    }

    return dias;
  };

  const semana = getSemana(offsetSemana);

  // ✅ Normaliza histórico para horário local
  const normalizeHistorico = historico.map(h => {
    const dataUTC = new Date(h.data);
    // A dataLocal deve ser a data UTC convertida para o horário local
    const dataLocal = new Date(dataUTC.getTime() + dataUTC.getTimezoneOffset() * 60000);
    return {
      ...h,
      dateOnly: toLocalISO(dataLocal) // Use dataLocal aqui para garantir a conversão correta
    };
  });

  const semanaComRegistros = semana.map(d => {
    const registro = normalizeHistorico.find(h => h.dateOnly === d.iso);
    return {
      data: d.iso,
      registros: registro?.registros ?? {}
    };
  });

  const mudarSemana = (novoOffset: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOffsetSemana(novoOffset);
    setDiaSelecionado(null);
    setAberto(null);
  };

  const onPressDiaCalendario = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDiaSelecionado(iso);
    setAberto(iso);
  };

  const onPressCard = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAberto(prev => (prev === iso ? null : iso));
    setDiaSelecionado(iso);
  };

  return (
    <View style={{ marginTop: 30 }}>
      <View style={styles.semanaNav}>
        <TouchableOpacity onPress={() => mudarSemana(offsetSemana - 1)}>
          <Text style={styles.navBtn}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.semanaTexto}>Histórico de Pontos</Text>

        <TouchableOpacity onPress={() => mudarSemana(offsetSemana + 1)}>
          <Text style={styles.navBtn}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarioWrapper}>
        {semana.map(d => {
          const ativo = diaSelecionado === d.iso;
          return (
            <TouchableOpacity
              key={d.iso}
              onPress={() => onPressDiaCalendario(d.iso)}
              style={[styles.diaItem, ativo && styles.diaItemAtivo]}
            >
              <Text style={[styles.diaLabel, ativo && styles.diaLabelAtivo]}>{d.label}</Text>
              <Text style={[styles.diaNumero, ativo && styles.diaNumeroAtivo]}>{d.numero}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={semanaComRegistros}
        keyExtractor={item => item.data}
        scrollEnabled={false}
        contentContainerStyle={{ paddingLeft: 25, paddingRight: 25 }}
        renderItem={({ item }) => {
          const isOpen = diaSelecionado === item.data && aberto === item.data;

          return (
            <View style={styles.itemWrapper}>
              <View style={styles.linhaVertical} />
              <View
                style={[
                  styles.bolinhaDia,
                  {
                    backgroundColor: Object.values(item.registros).some(v => v) ? '#3C188F' : '#C6C6C6'
                  }
                ]}
              />

              <TouchableOpacity
                style={[styles.card, isOpen && styles.cardAberto]}
                onPress={() => onPressCard(item.data)}
                activeOpacity={0.8}
              >
                <Text style={styles.data}>{formatarData(item.data)}</Text>

                {isOpen && (
                  <View style={styles.infoContainer}>
                    {ORDEM.map(tipo => (
                      <View key={tipo} style={styles.linhaInfo}>
                        <View style={[styles.bolinhaTipo, { backgroundColor: cores[tipo] }]} />
                        <Text style={styles.tipo}>
                          {tipo === 'almoco' ? 'ALMOÇO' : tipo === 'saida' ? 'SAÍDA' : tipo.toUpperCase()}
                        </Text>

                        <Text style={styles.hora}>{item.registros[tipo] ?? '--:--'}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  semanaNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 10
  },
  navBtn: {
    fontSize: 22,
    color: '#7850C5',
    fontWeight: 'bold'
  },
  semanaTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#313131ff',
    marginBottom: 20
  },
  itemWrapper: {
    flexDirection: 'row',
    marginBottom: 30,
    position: 'relative'
  },
  linhaVertical: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#E0E0E0',
    left: 7,
    top: 0,
    bottom: -10
  },
  bolinhaDia: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 18,
    marginTop: 5,
    zIndex: 10,
    backgroundColor: '#3C188F'
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    elevation: 3
  },
  cardAberto: {
    backgroundColor: '#F8F6FF'
  },
  data: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  infoContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingTop: 10
  },
  linhaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8
  },
  bolinhaTipo: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  tipo: {
    fontWeight: '600',
    color: '#494848ff',
    flex: 1,
    textTransform: 'capitalize'
  },
  hora: {
    fontWeight: '600',
    color: '#7850C5'
  },
  calendarioWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10
  },
  diaItem: {
    width: 45,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2'
  },
  diaItemAtivo: {
    backgroundColor: '#3C188F'
  },
  diaLabel: {
    fontSize: 12,
    color: '#777'
  },
  diaLabelAtivo: {
    color: '#FFF',
    fontWeight: 'bold'
  },
  diaNumero: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444'
  },
  diaNumeroAtivo: {
    color: '#FFF'
  }
});

export default HistoricoPontos;
