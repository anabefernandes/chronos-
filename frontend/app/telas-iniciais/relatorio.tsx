import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Navbar from '../../components/public/Navbar';
import { PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';

interface Usuario {
  _id: string;
  nome: string;
  role: string;
}

interface PontoDetalhado {
  data: string;
  entrada?: string;
  almoco?: string;
  retorno?: string;
  saida?: string;
  horasTrabalhadas: string;
  horasExtras: string;
  horasFaltantes: string;
}

interface RelatorioType {
  funcionario: { nome: string };
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

export default function Relatorio() {
  const [relatorio, setRelatorio] = useState<RelatorioType | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
      const res = await api.get('/auth/userAuth');
      setUser(res.data);

      if (res.data.role === 'admin' || res.data.role === 'chefe') {
        carregarFuncionarios();
      } else {
        carregarRelatorio();
      }
    } catch (err) {
      console.log("Erro ao carregar usuário", err);
    }
  }

  async function carregarFuncionarios() {
    try {
      const res = await api.get('/user/listarFuncionarios');
      setFuncionarios(res.data);
    } catch (err) {
      console.log("Erro ao listar funcionários", err);
    }
  }

  // se for funcionário normal
  async function carregarRelatorio() {
    try {
      const res = await api.get('/relatorio/me');
      setRelatorio(res.data);
    } catch (err) {
      console.log("Erro ao carregar relatório", err);
    }
  }

  // se admin selecionar um funcionário
  async function carregarRelatorioFuncionario(id: string) {
    setSelectedId(id);
    try {
      const res = await api.get(`/relatorio/funcionario/${id}`);
      setRelatorio(res.data);
    } catch (err) {
      console.log("Erro ao carregar relatório do funcionário", err);
    }
  }

  async function baixarPDF() {
    if (!relatorio) return;

    const html = `
      <h1>Relatório de Ponto</h1>
      <p><strong>Funcionário:</strong> ${relatorio.funcionario.nome}</p>
      <p><strong>Período:</strong> ${relatorio.periodo.inicio} até ${relatorio.periodo.fim}</p>
      <h3>Total de Horas</h3>
      <p>Horas trabalhadas: ${relatorio.totais.horasTrabalhadas}</p>
      <p>Horas extras: ${relatorio.totais.horasExtras}</p>
      <p>Horas descontadas: ${relatorio.totais.horasDescontadas}</p>
      <p><strong>Salário líquido:</strong> R$ ${relatorio.totais.salarioLiquido.toFixed(2)}</p>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log('Erro ao gerar PDF:', error);
    }
  }

  // SE ADMIN: MOSTRA LISTA DE FUNCIONÁRIOS PRIMEIRO
  if (user && (user.role === "admin" || user.role === "chefe") && !selectedId) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.content}>
          <Text style={styles.title}>Selecione um Funcionário</Text>

          <FlatList
            data={funcionarios}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => carregarRelatorioFuncionario(item._id)}
              >
                <Text style={styles.cardDate}>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  }

  // CARREGANDO
  if (!relatorio)
    return (
      <View style={styles.loading}>
        <Text>Carregando relatório...</Text>
      </View>
    );

  const chartData = [
    { name: 'Horas Trabalhadas', population: relatorio.totais.horasTrabalhadasDecimal, color: '#4CAF50' },
    { name: 'Horas Extras', population: relatorio.totais.horasExtrasDecimal, color: '#2196F3' },
    { name: 'Descontadas', population: relatorio.totais.horasDescontadasDecimal, color: '#F44336' }
  ];

  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>
        <Text style={styles.title}>Relatório de Pontos — {relatorio.funcionario.nome}</Text>

        <PieChart
          data={chartData}
          width={350}
          height={220}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="25"
          hasLegend={true}
          chartConfig={{
            color: () => '#000',
            labelColor: () => '#000',
            decimalPlaces: 1,
          }}
        />

        <Text style={styles.subTitle}>Dias Registrados</Text>

        <FlatList
          data={relatorio.pontosDetalhados}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardDate}>{item.data?.slice(0, 10) || '-'}</Text>

              <Text>Entrada: {item.entrada?.slice(11, 16) || '-'}</Text>
              <Text>Almoço: {item.almoco?.slice(11, 16) || '-'}</Text>
              <Text>Retorno: {item.retorno?.slice(11, 16) || '-'}</Text>
              <Text>Saída: {item.saida?.slice(11, 16) || '-'}</Text>

              <Text>Horas trabalhadas: {item.horasTrabalhadas}</Text>
            </View>
          )}
        />

        <TouchableOpacity style={styles.btn} onPress={baixarPDF}>
          <Text style={styles.btnText}>📄 Baixar PDF</Text>
        </TouchableOpacity>

        {(user?.role === "admin" || user?.role === "chefe") && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#555" }]}
            onPress={() => setSelectedId(null)}
          >
            <Text style={styles.btnText}>⬅ Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  subTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  card: { backgroundColor: '#eee', padding: 15, marginVertical: 8, borderRadius: 10 },
  cardDate: { fontWeight: 'bold', marginBottom: 5 },
  btn: { backgroundColor: '#212121', padding: 15, marginVertical: 5, borderRadius: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
