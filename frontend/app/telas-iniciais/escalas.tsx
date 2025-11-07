import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Navbar from '../../components/public/Navbar';
import { listarTodasEscalas, minhasEscalas, getUserRole } from '../../services/userService';

export default function Escalas() {
  const [escalas, setEscalas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    carregarEscalas();
  }, []);

  const carregarEscalas = async () => {
    try {
      const userRole = await getUserRole(); // pega o role do usuário logado
      setRole(userRole);

      let data;
      if (userRole === 'admin' || userRole === 'chefe') {
        data = await listarTodasEscalas(); // rota admin
      } else {
        data = await minhasEscalas(); // rota funcionário
      }

      setEscalas(data);
    } catch (err) {
      console.error('Erro ao carregar escalas:', err);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
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

  return (
    <View style={styles.container}>
      <Navbar />
      <ScrollView style={styles.lista}>
        {escalas.map((e, i) => (
          <View key={i} style={styles.card}>
            {(role === 'admin' || role === 'chefe') && (
              <Text style={styles.cardTitle}>{e.funcionario?.nome || 'Funcionário'}</Text>
            )}
            <Text style={styles.cardSub}>
              Semana: {new Date(e.semanaInicio).toLocaleDateString('pt-BR')} - {new Date(e.semanaFim).toLocaleDateString('pt-BR')}
            </Text>
            {e.dias?.map((dia: any, idx: number) => (
              <View key={idx} style={styles.diaItem}>
                <Text style={styles.diaTexto}>{new Date(dia.data).toLocaleDateString('pt-BR')}:</Text>
                {dia.folga ? (
                  <Text style={{ color: 'red' }}>Folga</Text>
                ) : (
                  <Text>{dia.horaEntrada} - {dia.horaSaida}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: 15 },
  card: { backgroundColor: '#f2f2f2', padding: 10, marginVertical: 5, borderRadius: 8 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#555', marginBottom: 6 },
  diaItem: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  diaTexto: { fontSize: 14 },
});
