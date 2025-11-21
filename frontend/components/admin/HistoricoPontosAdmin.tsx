import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView
} from 'react-native';
import { pontosDoFuncionario } from '../../services/userService';

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

interface Funcionario {
  _id: string;
  nome: string;
  foto?: string;
  role: string;
  setor?: string;
}

interface Props {
  funcionario: Funcionario;
}

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const NOME_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const ORDEM: (keyof RegistrosDia)[] = ['entrada', 'almoco', 'retorno', 'saida'];

const HistoricoPontoAdmin = ({ funcionario }: Props) => {
  const [aberto, setAberto] = useState<string | null>(null);
  const [offsetSemana, setOffsetSemana] = useState(0);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [historico, setHistorico] = useState<PontoDia[]>([]);

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const iconeChefe = require('../../assets/images/telas-admin/icone_chefe.png');
  const iconeFuncionario = require('../../assets/images/telas-admin/icone_funcionario.png');

  const mapTipo = (tipo: string | number): keyof RegistrosDia | undefined => {
    switch (String(tipo).toLowerCase()) {
      case 'entrada':
        return 'entrada';
      case 'almoco':
        return 'almoco';
      case 'retorno':
        return 'retorno';
      case 'saida':
        return 'saida';
      default:
        return undefined;
    }
  };

  const formatHora = (hora: string | number) => {
    if (!hora) return '--:--';
    const d = new Date(hora);
    if (isNaN(d.getTime())) return String(hora);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Busca pontos do funcionário
  useEffect(() => {
    const carregarHistorico = async () => {
      try {
        const pontos = await pontosDoFuncionario(funcionario._id);
        const agrupado: Record<string, RegistrosDia> = {};

        pontos.forEach((p: { status: string; horario: any }) => {
          const tipoKey = mapTipo(p.status); // ✅ usar status aqui
          if (!tipoKey) return;
          const dataStr = new Date(p.horario).toISOString().split('T')[0];
          if (!agrupado[dataStr]) agrupado[dataStr] = {};
          agrupado[dataStr][tipoKey] = formatHora(p.horario);
        });

        const historicoArray: PontoDia[] = Object.entries(agrupado).map(([data, registros]) => ({ data, registros }));

        setHistorico(historicoArray.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
      } catch (err) {
        console.log('Erro ao buscar pontos:', err);
        setHistorico([]);
      }
    };

    carregarHistorico();
  }, [funcionario]);

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

  const toLocalISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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

  const semanaComRegistros = semana.map(d => {
    const registro = historico.find(h => h.data === d.iso);
    return { data: d.iso, registros: registro?.registros ?? {} };
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

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  const getRoleIcon = (role: string) => (role === 'chefe' ? iconeChefe : iconeFuncionario);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ marginTop: 20 }}>
        <View style={styles.funcionarioCard}>
          <Image source={getUserImage(funcionario.foto)} style={styles.foto} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.nome}>{funcionario.nome}</Text>
            <View style={styles.row}>
              <Image source={getRoleIcon(funcionario.role)} style={styles.icon} />
              <Text style={styles.infoText}>
                {funcionario.role.charAt(0).toUpperCase() + funcionario.role.slice(1)}
              </Text>
            </View>
            {funcionario.setor && (
              <View style={styles.row}>
                <Image source={setorIcon} style={styles.icon} />
                <Text style={styles.infoText}>{funcionario.setor}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Calendário */}
        <View style={styles.semanaNav}>
          <TouchableOpacity onPress={() => mudarSemana(offsetSemana - 1)}>
            <Text style={styles.navBtn}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.semanaTexto}>Calendário Semanal</Text>
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
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => {
            const isOpen = diaSelecionado === item.data; // 🔹 só precisa do diaSelecionado
            const temRegistro = Object.values(item.registros).some(v => v);
            return (
              <View style={styles.itemWrapper}>
                <View style={styles.linhaVertical} />
                <View style={[styles.bolinhaDia, { backgroundColor: temRegistro ? '#3C188F' : '#C6C6C6' }]} />
                <TouchableOpacity
                  style={[
                    styles.card,
                    isOpen && styles.cardAberto,
                    !isOpen && { backgroundColor: '#FFFFFF' } // 🔹 garante card visível mesmo fechado
                  ]}
                  onPress={() => onPressCard(item.data)}
                >
                  <Text style={styles.data}>{formatarData(item.data)}</Text>
                  {isOpen && (
                    <View style={styles.infoContainer}>
                      {ORDEM.map(tipo => (
                        <View key={tipo} style={styles.linhaInfo}>
                          <View style={[styles.bolinhaTipo, { backgroundColor: cores[tipo] }]} />
                          <Text style={styles.tipo}>
                            {tipo === 'almoco'
                              ? 'Almoço'
                              : tipo === 'saida'
                                ? 'Saída'
                                : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  funcionarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 15
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 30
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 5
  },
  infoText: {
    fontSize: 14,
    color: '#333'
  },
  semanaNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10
  },
  navBtn: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold'
  },
  semanaTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  itemWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
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

export default HistoricoPontoAdmin;
