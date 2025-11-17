import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, FlatList } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';
import Navbar from '../../components/public/Navbar';
import DiasRegistrados, { PontoDetalhado } from '../../components/public/DiasRegistrados';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ActivityIndicator } from 'react-native';

const screenWidth = Dimensions.get('window').width - 40;

interface RelatorioProps {
  selectedId?: string;
  voltar?: () => void;
}

interface Usuario {
  _id: string;
  nome: string;
  role: string;
  setor?: string;
  foto?: string;
}

interface RelatorioType {
  funcionario: {
    nome: string;
    role: string;
    setor?: string;
    foto?: string;
  };
  periodo: { inicio: string; fim: string };
  totais: {
    horasTrabalhadas: string;
    horasExtras: string;
    horasDescontadas: string;
    salarioLiquido: number;
    horasTrabalhadasDecimal: number;
    horasExtrasDecimal: number;
    horasDescontadasDecimal: number;
  };
  pontosDetalhados: PontoDetalhado[];
}

export default function Relatorio({ selectedId, voltar }: RelatorioProps) {
  const [relatorio, setRelatorio] = useState<RelatorioType | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const setorIcon = require('../../assets/images/telas-admin/icone_setor.png');
  const iconeChefe = require('../../assets/images/telas-admin/icone_chefe.png');
  const iconeFuncionario = require('../../assets/images/telas-admin/icone_funcionario.png');

  const getRoleIcon = (role: string) => (role === 'chefe' ? iconeChefe : iconeFuncionario);

  const getUserImage = (foto?: string) => {
    if (!foto || foto.trim() === '') return require('../../assets/images/telas-public/sem_foto.png');
    if (foto.includes('sem_foto.png')) return require('../../assets/images/telas-public/sem_foto.png');
    let baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    if (baseURL?.endsWith('/api')) baseURL = baseURL.replace(/\/api$/, '');
    const cleanFoto = foto.replace(/^\/+/, '');
    return { uri: `${baseURL}/${cleanFoto}` };
  };

  useEffect(() => {
    carregarUsuario();
  }, [selectedId]);

  async function carregarUsuario() {
    try {
      const res = await api.get('/auth/userAuth');
      setUser(res.data);
      if (selectedId) await carregarRelatorioFuncionario(selectedId);
      else await carregarRelatorio();
    } catch (err) {
      console.log('Erro ao carregar usuário', err);
    }
  }

  async function carregarRelatorio() {
    try {
      const res = await api.get('/relatorio/me');
      setRelatorio(res.data);
    } catch (err) {
      console.log('Erro ao carregar relatório', err);
    }
  }

  async function carregarRelatorioFuncionario(id: string) {
    try {
      const res = await api.get(`/relatorio/funcionario/${id}`);
      setRelatorio(res.data);
    } catch (err) {
      console.log('Erro ao carregar relatório do funcionário', err);
    } finally {
      setCarregando(false);
    }
  }

  async function baixarPDF() {
    if (!relatorio) return;

    const periodoInicio = format(parseISO(relatorio.periodo.inicio), 'dd/MM/yyyy', { locale: ptBR });
    const periodoFim = format(parseISO(relatorio.periodo.fim), 'dd/MM/yyyy', { locale: ptBR });

    const pontoCores = {
      Entrada: '#4CAF50',
      Almoço: '#FFA500',
      Retorno: '#2196F3',
      Saída: '#F44336'
    };

    const formatHoras = (horas: string | number) => {
      const decimal = typeof horas === 'string' ? parseFloat(horas.replace(',', '.')) : horas;
      if (isNaN(decimal) || decimal < 0.01) return '0h';
      const h = Math.floor(decimal);
      const m = Math.round((decimal - h) * 60);
      return `${h}h${m > 0 ? ' ' + m + 'min' : ''}`;
    };

    const pontosHTML = relatorio.pontosDetalhados
      .map(item => {
        const diaSemana = format(parseISO(item.data), 'EEEE', { locale: ptBR });
        const dataFormatada = format(parseISO(item.data), 'dd/MM/yyyy', { locale: ptBR });

        const bolinha = (tipo?: string) =>
          `<span style="display:inline-block; width:12px; height:12px; border-radius:6px; background-color:${tipo ? pontoCores[tipo as keyof typeof pontoCores] : '#ccc'}; margin-right:5px;"></span>`;

        return `
        <tr style="background-color:#f9f9f9;">
          <td style="padding:8px; border:1px solid #ddd; font-weight:bold;">${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}</td>
          <td style="padding:8px; border:1px solid #ddd;">${dataFormatada}</td>
          <td style="padding:8px; border:1px solid #ddd;">${bolinha('Entrada')}${item.entrada ? format(parseISO(item.entrada), 'HH:mm') : '-/-'}</td>
          <td style="padding:8px; border:1px solid #ddd;">${bolinha('Almoço')}${item.almoco ? format(parseISO(item.almoco), 'HH:mm') : '-/-'}</td>
          <td style="padding:8px; border:1px solid #ddd;">${bolinha('Retorno')}${item.retorno ? format(parseISO(item.retorno), 'HH:mm') : '-/-'}</td>
          <td style="padding:8px; border:1px solid #ddd;">${bolinha('Saída')}${item.saida ? format(parseISO(item.saida), 'HH:mm') : '-/-'}</td>
          <td style="padding:8px; border:1px solid #ddd;">${formatHoras(item.horasTrabalhadas)}</td>
        </tr>
      `;
      })
      .join('');

    const html = `
    <div style="font-family:sans-serif; margin:20px;">
      <h1 style="color:#3C188F;">Relatório de Ponto</h1>
      <p><strong>Funcionário:</strong> ${relatorio.funcionario.nome}</p>
      <p><strong>Período:</strong> ${periodoInicio} até ${periodoFim}</p>
      <h3 style="color:#3C188F;">Totais</h3>
      <ul>
        <li>Horas trabalhadas: ${formatHoras(relatorio.totais.horasTrabalhadas)}</li>
        <li>Horas extras: ${formatHoras(relatorio.totais.horasExtras)}</li>
        <li>Horas descontadas: ${formatHoras(relatorio.totais.horasDescontadas)}</li>
        <li>Salário líquido: R$ ${relatorio.totais.salarioLiquido.toFixed(2)}</li>
      </ul>

      <h3 style="color:#3C188F;">Pontos Detalhados</h3>
      <table style="border-collapse:collapse; width:100%;">
        <thead>
          <tr style="background-color:#3C188F; color:#fff;">
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Dia</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Data</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Entrada</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Almoço</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Retorno</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Saída</th>
            <th style="padding:8px; border:1px solid #ddd; color:#fff;">Horas</th>
          </tr>
        </thead>
        <tbody>
          ${pontosHTML}
        </tbody>
      </table>
    </div>
  `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log('Erro ao gerar PDF:', error);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <Navbar />
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </View>
    );
  }

  const chartData = [
    { name: 'Horas Trabalhadas', population: relatorio!.totais.horasTrabalhadasDecimal, color: '#4CAF50' },
    { name: 'Horas Extras', population: relatorio!.totais.horasExtrasDecimal, color: '#2196F3' },
    { name: 'Descontadas', population: relatorio!.totais.horasDescontadasDecimal, color: '#F44336' }
  ];

  return (
    <>
      <Navbar />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Título + botão Voltar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.title}>Relatório do Funcionario</Text>
          {voltar && (
            <TouchableOpacity onPress={voltar} style={styles.btnSmall}>
              <Text style={styles.btnSmallText}>Voltar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          {/* Informações do funcionário */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Image
              source={getUserImage(relatorio!.funcionario.foto)}
              style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{relatorio!.funcionario.nome}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Image
                  source={getRoleIcon(relatorio!.funcionario.role)}
                  style={{ width: 18, height: 18, marginRight: 6 }}
                />
                <Text style={{ fontSize: 14 }}>
                  {relatorio!.funcionario.role === 'chefe' ? 'Chefe' : 'Funcionário'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Image source={setorIcon} style={{ width: 18, height: 18, marginRight: 6 }} />
                <Text style={{ fontSize: 14 }}>{relatorio!.funcionario.setor || 'Sem setor'}</Text>
              </View>
            </View>
          </View>

          {/* Linha separadora */}
          <View style={styles.divider} />

          {/* Gráfico */}
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <PieChart
              data={chartData}
              width={screenWidth - 20}
              height={180}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="-15"
              hasLegend={true}
              chartConfig={{
                color: () => '#000',
                labelColor: () => '#000',
                decimalPlaces: 1
              }}
              center={[0, 0]}
            />
          </View>
        </View>

        <Text style={styles.subTitle}>Registrados Semanais</Text>

        {/* Dias Registrados em scroll horizontal */}
        <FlatList
          data={relatorio!.pontosDetalhados}
          keyExtractor={(item, index) => item.data + index}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <DiasRegistrados pontos={[item]} />
            </View>
          )}
        />

        <TouchableOpacity style={styles.btn} onPress={baixarPDF}>
          <Text style={styles.btnText}>📄 Baixar PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3C188F',
    marginTop: 10
  },
  subTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#3C188F',
    marginTop: 10,
    textAlign: 'center'
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10
  },
  slide: {
    width: screenWidth - 60,
    marginRight: 5
  },
  btn: {
    backgroundColor: '#3C188F',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    marginBottom: 20
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  btnSmall: {
    backgroundColor: '#3C188F',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  btnSmallText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
