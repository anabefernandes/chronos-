import React, { useEffect, useRef, useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

interface Props {
  diaSelecionado: string;
  escalas: any[];
  onClose: () => void;
}

export default function CardDiaSelecionado({ diaSelecionado, escalas, onClose }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;
  const { getFoto } = useContext(AuthContext);

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const chefeIcon = require('../../assets/images/telas-admin/icone_chefe.png');
  const funcIcon = require('../../assets/images/telas-admin/icone_funcionario.png');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true })
    ]).start();
  }, []);

  const formatarDataLocal = (data: string | Date) => {
    const d = new Date(data);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const horariosDoDia = escalas
    .flatMap(e => e.dias.map((d: any) => ({ ...d, funcionario: e.funcionario })))
    .filter((d: any) => formatarDataLocal(d.data) === diaSelecionado);

  const getDiaSemana = (dateStr: string) => {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[new Date(dateStr + 'T00:00').getDay()];
  };

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '').replace(/^uploads\//, '');
    return { uri: `${baseURL}/uploads/${cleanFoto}` };
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: '#fff',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity style={styles.closeIconContainer} onPress={onClose}>
        <Image source={require('../../assets/images/telas-admin/icone_excluir.png')} style={styles.closeIcon} />
      </TouchableOpacity>

      <Text style={styles.title}>
        {getDiaSemana(diaSelecionado)}{' '}
        {(() => {
          const [ano, mes, dia] = diaSelecionado.split('-');
          return `${dia}/${mes}/${ano}`;
        })()}
      </Text>
      <View style={styles.separador} />

      <ScrollView style={{ marginTop: 8 }}>
        {horariosDoDia.length > 0 ? (
          horariosDoDia.map((dia: any, idx: number) => {
            const funcionario = dia.funcionario;
            const roleIcon = funcionario?.role === 'chefe' ? chefeIcon : funcIcon;

            return (
              <View
                key={idx}
                style={[
                  styles.funcionarioCard,
                  dia.folga ? { backgroundColor: '#e2f3ffff' } : { backgroundColor: '#f1ebfcff' }
                ]}
              >
                <View style={styles.row}>
                  <Image source={getUserImage(funcionario?.foto)} style={styles.foto} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{funcionario?.nome}</Text>
                    <View style={styles.infoRow}>
                      <Image source={roleIcon} style={styles.icon} />
                      <Text style={styles.infoText}>{funcionario?.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Image source={setorIcon} style={styles.icon} />
                      <Text style={styles.infoText}>{funcionario?.setor || 'Sem setor'}</Text>
                    </View>
                  </View>
                </View>

                {dia.folga ? (
                  <View style={[styles.statusBox, { backgroundColor: '#B8E1FF' }]}>
                    <Text style={styles.statusText}>Folga</Text>
                  </View>
                ) : (
                  <View style={styles.horariosContainer}>
                    <View style={[styles.horaBox, { backgroundColor: '#C7F4C7', flex: 1, marginRight: 4 }]}>
                      <Text style={styles.horaText}>Entrada: {dia.horaEntrada}</Text>
                    </View>
                    <View style={[styles.horaBox, { backgroundColor: '#FFD9C7', flex: 1, marginLeft: 4 }]}>
                      <Text style={styles.horaText}>Saída: {dia.horaSaida}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.semRegistroBox}>
            <Text style={styles.horaText}>Nenhum funcionário com escala neste dia</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 15,
    marginVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  closeIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10
  },
  closeIcon: {
    width: 22,
    height: 22
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#17153A',
    textAlign: 'center',
    marginBottom: 10
  },
  funcionarioCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10
  },
  nome: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#17153A'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6
  },
  infoText: {
    color: '#444'
  },
  horariosContainer: {
    flexDirection: 'row',
    marginTop: 10
  },
  horaBox: {
    borderRadius: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  horaText: {
    fontWeight: 'bold',
    color: '#17153ac5'
  },
  statusBox: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center'
  },
  statusText: {
    fontWeight: 'bold',
    color: '#17153A'
  },
  semRegistroBox: {
    backgroundColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginTop: 10
  },
  separador: {
    height: 1,
    backgroundColor: '#e5e2e2ff',
    marginVertical: 10
  }
});
