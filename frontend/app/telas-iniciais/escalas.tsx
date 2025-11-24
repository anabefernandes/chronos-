import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Animated } from 'react-native';
import Navbar from '../../components/public/Navbar';
import { listarTodasEscalas, minhasEscalas, getUserRole } from '../../services/userService';
import { Calendar } from 'react-native-calendars';

export default function Escalas() {
  const [escalas, setEscalas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<any>({});
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    carregarEscalas();
  }, []);

  const formatarDataLocal = (data: string | Date) => {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const carregarEscalas = async () => {
    try {
      const userRole = await getUserRole();
      setRole(userRole);

      let data;
      if (userRole === 'admin' || userRole === 'chefe') {
        data = await listarTodasEscalas();
      } else {
        data = await minhasEscalas();
      }

      setEscalas(data);

      const marks: any = {};
      data.forEach((escala: any) => {
        escala.dias.forEach((dia: any) => {
          const dateStr = formatarDataLocal(dia.data);
          marks[dateStr] = {
            marked: true,
            dotColor: dia.folga ? '#81d4fa8b' : '#a8e6cf89',
            customStyles: {
              container: {
                backgroundColor: dia.folga ? '#81d4fa8b' : '#a8e6cf89',
                borderRadius: 6
              },
              text: {
                color: '#000',
                fontWeight: '600'
              }
            }
          };
        });
      });

      setMarcados(marks);
    } catch (err) {
      console.error('Erro ao carregar escalas:', err);
    } finally {
      setCarregando(false);
    }
  };

  const abrirAnimacao = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true })
    ]).start();
  };

  const aoSelecionarDia = (day: any) => {
    setDiaSelecionado(day.dateString);
    abrirAnimacao();
  };

  if (carregando) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text>Carregando escalas...</Text>
        </View>
      </View>
    );
  }

  if (escalas.length === 0) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Text>Nenhuma escala encontrada.</Text>
        </View>
      </View>
    );
  }

  const horariosDoDia = diaSelecionado
    ? escalas.flatMap(e => e.dias).filter((d: any) => formatarDataLocal(d.data) === diaSelecionado)
    : [];

  const getDiaSemana = (dateStr: string) => {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const d = new Date(dateStr + 'T00:00');
    return dias[d.getDay()];
  };

  const getDiaSemanaCurto = (data: string) => {
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const d = new Date(data + (data.length === 10 ? 'T00:00' : ''));
    return dias[d.getDay()];
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Navbar />

      <Calendar
        markingType={'custom'}
        markedDates={{
          ...marcados,
          ...(diaSelecionado
            ? { [diaSelecionado]: { ...marcados[diaSelecionado], selected: true, selectedColor: '#4A90E2' } }
            : {})
        }}
        onDayPress={aoSelecionarDia}
        style={styles.calendar}
        theme={{
          todayTextColor: '#4A90E2',
          arrowColor: '#4A90E2',
          monthTextColor: '#17153A',
          textMonthFontWeight: 'bold'
        }}
      />

      {/* CARD DO DIA SELECIONADO COM ANIMAÇÃO */}
      {diaSelecionado && (
        <Animated.View
          style={[
            styles.cardDiaSelecionado,
            {
              backgroundColor:
                horariosDoDia.length === 0 ? '#ddd' : horariosDoDia[0]?.folga ? '#eaf2f8ff' : '#f3f0f9ff',
              borderWidth: 1,
              borderColor:
                horariosDoDia.length === 0 ? '#cdcdcdff' : horariosDoDia[0]?.folga ? '#e3edfdff' : '#ece3fdff',

              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.closeIconContainer} onPress={() => setDiaSelecionado(null)}>
            <Image source={require('../../assets/images/telas-admin/icone_excluir.png')} style={styles.closeIcon} />
          </TouchableOpacity>

          <View style={styles.cardDiaContent}>
            <Image
              source={
                horariosDoDia.length === 0
                  ? require('../../assets/images/telas-admin/icone_sem-registro.png')
                  : horariosDoDia[0]?.folga
                    ? require('../../assets/images/telas-admin/icone_folga.png')
                    : require('../../assets/images/telas-admin/icone_trabalho.png')
              }
              style={styles.cardImage}
            />

            <View style={styles.cardInfo}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitleText}>{getDiaSemana(diaSelecionado)}</Text>
                <Image
                  source={require('../../assets/images/telas-admin/icone_calendario.png')}
                  style={styles.dataIcon}
                />
                <Text style={styles.cardData}>
                  {(() => {
                    const [ano, mes, dia] = diaSelecionado.split('-');
                    return `${dia}/${mes}/${ano}`;
                  })()}
                </Text>
              </View>

              {horariosDoDia.length > 0 ? (
                horariosDoDia.map((dia: any, idx: number) => (
                  <View key={idx} style={styles.horarioColumn}>
                    {dia.folga ? (
                      <View style={[styles.horarioBox, styles.folgaBox]}>
                        <Text style={styles.horarioText}>Folga</Text>
                      </View>
                    ) : (
                      <>
                        <View style={[styles.horarioBox, styles.entradaBox]}>
                          <Text style={styles.horarioText}>Entrada: {dia.horaEntrada}</Text>
                        </View>
                        <View style={[styles.horarioBox, styles.saidaBox]}>
                          <Text style={styles.horarioText}>Saída: {dia.horaSaida}</Text>
                        </View>
                      </>
                    )}
                  </View>
                ))
              ) : (
                <View style={[styles.horarioBox, styles.semRegistroBox]}>
                  <Text style={styles.horarioText}>Nenhum registro neste dia</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      )}

      {/* LISTA SEMANAL */}
      <Text style={styles.tituloLista}>Minhas Escalas Semanais</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {escalas.map((e, i) => (
          <View key={i} style={styles.cardSemana}>
            {(role === 'admin' || role === 'chefe') && (
              <Text style={styles.cardTitle}>{e.funcionario?.nome || 'Funcionário'}</Text>
            )}
            <Text style={styles.cardSub}>
              Semana: {new Date(e.semanaInicio).toLocaleDateString('pt-BR')} -{' '}
              {new Date(e.semanaFim).toLocaleDateString('pt-BR')}
            </Text>

            {e.dias?.map((dia: any, idx: number) => {
              const diaTrabalho = !dia.folga;
              return (
                <View key={idx} style={[styles.diaLinha, diaTrabalho ? styles.trabalhoLinha : styles.folgaLinha]}>
                  <View style={[styles.colunaData, diaTrabalho ? styles.dataTrabalho : styles.dataFolga]}>
                    <Text style={styles.dataNumero}>{String(new Date(dia.data).getDate()).padStart(2, '0')}</Text>
                    <Text style={styles.dataDia}>{getDiaSemanaCurto(dia.data)}</Text>
                  </View>

                  <View style={styles.colunaCentro}>
                    {dia.folga ? (
                      <View style={styles.tagFolgaBox}>
                        <Text style={styles.textFolga}>Folga</Text>
                      </View>
                    ) : (
                      <View style={styles.horariosContainer}>
                        <View style={[styles.tagBox, styles.tagEntrada]}>
                          <Text style={styles.textHora}>Entrada: {dia.horaEntrada}</Text>
                        </View>
                        <View style={[styles.tagBox, styles.tagSaida]}>
                          <Text style={styles.textHora}>Saída: {dia.horaSaida}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.colunaIcone}>
                    <Image
                      source={
                        dia.folga
                          ? require('../../assets/images/telas-admin/icone_folga.png')
                          : require('../../assets/images/telas-admin/icone_trabalho.png')
                      }
                      style={styles.iconeDia}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6fb'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendar: {
    margin: 15,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: '#fff'
  },
  tituloLista: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C188F',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25
  },
  lista: {
    flex: 1,
    maxHeight: 500,
    paddingHorizontal: 12
  },
  cardSemana: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    elevation: 3,
    marginRight: 14,
    width: 320
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#17153A',
    marginBottom: 2
  },
  cardSub: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#17153A',
    marginBottom: 8,
    alignSelf: 'center'
  },
  diaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 4,
    padding: 10
  },
  trabalhoLinha: {
    backgroundColor: '#f3f0f9ff',
    borderWidth: 1,
    borderColor: '#d6c9faff'
  },
  folgaLinha: {
    backgroundColor: '#eaf2f8ff',
    borderWidth: 1,
    borderColor: '#c9e1faff'
  },
  colunaData: {
    width: 68,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 6
  },
  dataTrabalho: {
    backgroundColor: '#c5a3ff'
  },
  dataFolga: {
    backgroundColor: '#a8dbff'
  },
  dataNumero: {
    fontWeight: '700',
    fontSize: 18,
    color: '#001a33',
    marginBottom: 2
  },
  dataDia: {
    fontSize: 12,
    textTransform: 'lowercase',
    color: '#001a33'
  },
  colunaCentro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  horariosContainer: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagBox: {
    borderRadius: 14,
    paddingVertical: 4, // 🔥 MENOR
    paddingHorizontal: 10,
    width: 110, // 🔥 MENOR
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagEntrada: {
    backgroundColor: '#C7F4C7'
  },
  tagSaida: {
    backgroundColor: '#CFCFCF'
  },
  tagFolgaBox: {
    backgroundColor: '#B8E1FF',
    borderRadius: 14,
    paddingVertical: 4, 
    paddingHorizontal: 10,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textHora: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center'
  },
  textFolga: {
    color: '#004d80',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center'
  },
  colunaIcone: {
    width: 50,
    alignItems: 'center'
  },
  iconeDia: {
    width: 38,
    height: 38,
    resizeMode: 'contain'
  },
  cardDiaSelecionado: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 10,
    elevation: 3
  },
  cardDiaContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 15
  },
  cardInfo: {
    flex: 1
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitleText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#17153A'
  },
  cardData: {
    color: '#383838ff',
    fontWeight: 'normal',
    left: 20
  },
  dataIcon: {
    width: 16,
    height: 16,
    left: 20
  },
  horarioColumn: {
    flexDirection: 'column',
    marginVertical: 2
  },
  horarioBox: {
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  horarioText: {
    color: '#17153ac5',
    fontWeight: 'bold'
  },
  closeIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10
  },
  closeIcon: {
    width: 24,
    height: 24
  },
  entradaBox: {
    backgroundColor: '#C7F4C7',
    width: '70%'
  },
  saidaBox: {
    backgroundColor: '#CFCFCF',
    width: '70%'
  },
  folgaBox: {
    backgroundColor: '#B8E1FF',
    width: '70%',
    marginTop: 10
  },
  semRegistroBox: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  }
});
