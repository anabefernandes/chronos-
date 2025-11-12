import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';

interface Props {
  escalas: any[];
  role: string | null;
  onEdit?: (escala: any) => void;
  onDelete?: (escala: any) => void;
}

export default function ListaSemanal({ escalas, role, onEdit, onDelete }: Props) {
  const { usuarios } = useContext(AuthContext);

  const getDiaSemanaCurto = (dataString: string) => {
    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '';
    return diasSemana[data.getDay()];
  };

  const getFuncionarioInfo = (funcionarioIdOrObj: any) => {
    if (!funcionarioIdOrObj) return null;
    if (typeof funcionarioIdOrObj === 'object') return funcionarioIdOrObj;
    return usuarios.find(u => u._id === funcionarioIdOrObj) || null;
  };

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.startsWith('http')) return { uri: foto };
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '').replace(/^uploads\//, '');
    return { uri: `${baseURL}/uploads/${cleanFoto}` };
  };

  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const getRoleIcon = (role: string | undefined) => {
    if (role === 'chefe') return require('../../assets/images/telas-admin/icone_chefe.png');
    return require('../../assets/images/telas-admin/icone_funcionario.png');
  };

  return (
    <>
      <Text style={styles.tituloLista}>Escalas Semanais</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {escalas.map((e, i) => {
          const funcionario = getFuncionarioInfo(e?.funcionario) || getFuncionarioInfo(e?.escalaOrigem?.funcionario);

          return (
            <View key={i} style={styles.cardSemana}>
              {(role === 'admin' || role === 'chefe') && funcionario && (
                <View style={styles.funcionarioHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Image source={getUserImage(funcionario?.foto)} style={styles.foto} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitle}>{funcionario?.nome || 'Funcionário'}</Text>

                      <View style={styles.infoRow}>
                        <Image source={getRoleIcon(funcionario?.role)} style={styles.infoIcon} />
                        <Text style={styles.infoText}>{funcionario?.role === 'chefe' ? 'Chefe' : 'Funcionário'}</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Image source={setorIcon} style={styles.infoIcon} />
                        <Text style={styles.infoText}>{funcionario?.setor || 'Sem setor'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Ícones de ação */}
                  <View style={styles.acoesContainerInline}>
                    <TouchableOpacity onPress={() => onEdit && onEdit(e)}>
                      <Image
                        source={require('../../assets/images/telas-admin/icone_editar.png')}
                        style={styles.iconeAcao}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => onDelete && onDelete(e)} style={{ marginLeft: 10 }}>
                      <Image
                        source={require('../../assets/images/telas-admin/icone_excluir.png')}
                        style={styles.iconeAcao}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.separador} />

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
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tituloLista: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C188F',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25
  },
  cardSemana: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    width: 320,
    marginRight: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  funcionarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  acoesContainerInline: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconeAcao: {
    width: 22,
    height: 22,
    resizeMode: 'contain'
  },
  foto: {
    width: 55,
    height: 55,
    borderRadius: 100
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#17153A'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3
  },
  infoIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
    marginRight: 5
  },
  infoText: {
    fontSize: 12,
    color: '#444'
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
    backgroundColor: '#f1ebfcff'
  },
  folgaLinha: {
    backgroundColor: '#e2f3ffff'
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
    backgroundColor: '#d2b9fcff'
  },
  dataFolga: {
    backgroundColor: '#b6dffdff'
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
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagBox: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagEntrada: {
    backgroundColor: '#c6edc6'
  },
  tagSaida: {
    backgroundColor: '#ffc8a8'
  },
  tagFolgaBox: {
    backgroundColor: '#a8dbff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120
  },
  textHora: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center'
  },
  textFolga: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 12,
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
  separador: {
    height: 1,
    backgroundColor: '#e5e2e2ff',
    marginVertical: 10
  }
});
