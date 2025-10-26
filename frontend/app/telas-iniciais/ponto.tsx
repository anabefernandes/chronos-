import api from '../../services/api';
import * as Location from 'expo-location';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  FlatList,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import PontoHeader from '../../components/public/PontoHeader';

const { width } = Dimensions.get('window');

// Tipagens ---------------------
interface Ponto {
  _id: string;
  status: string;
  horario: string;
}

interface StatusDoDia {
  label: string;
  value: string;
}

// Constantes -------------------
const statusDoDia: StatusDoDia[] = [
  { label: 'Entrada', value: 'entrada' },
  { label: 'Almoço', value: 'almoco' },
  { label: 'Retorno', value: 'retorno' },
  { label: 'Saída', value: 'saida' }
];

const colors: Record<string, string> = {
  entrada: '#469348',
  almoco: '#3493B4',
  retorno: '#c8951eff',
  saida: '#AB3838'
};

// SUBSTITUIR PELAS COORDENADAS!! 
const LOCAL_FIXO = {
latitude: -24.024736511022894,
  longitude: -46.488954928836364
};
const RAIO_PERMITIDO = 50; //DEFINIR AQUI OS METROS

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Componente -------------------
export default function Ponto() {
  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList<StatusDoDia[]>>(null);
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);

  const pedirPermissaoLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da sua localização para registrar o ponto.');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setLocalizacao(coords);
    return coords;
  };

  useEffect(() => {
    fetchUser();
    fetchPontos();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/userAuth');
      setUser(res.data);
    } catch (err) {
      console.log('Erro ao buscar usuário:', err);
    }
  };

  const fetchPontos = async () => {
    try {
      const res = await api.get('/api/ponto/meus');
      const hoje = new Date().toISOString().slice(0, 10);
      const pontosHoje = res.data.filter((p: Ponto) => new Date(p.horario).toISOString().slice(0, 10) === hoje);
      setPontos(pontosHoje);
    } catch (err) {
      console.log('Erro ao buscar pontos:', err);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const isRegistered = (status: string) => pontos.some(p => p.status === status);

  const registrarPonto = async (status: string) => {
    if (pontos.find(p => p.status === status)) {
      Alert.alert('Aviso', `O ponto de ${capitalize(status)} já foi registrado hoje.`);
      return;
    }

    const coords = await pedirPermissaoLocalizacao();
    if (!coords) return;

    const distancia = getDistanceFromLatLonInMeters(
      coords.latitude,
      coords.longitude,
      LOCAL_FIXO.latitude,
      LOCAL_FIXO.longitude
    );

    if (distancia > RAIO_PERMITIDO) {
      Alert.alert('Fora do local permitido', `Você precisa estar a até ${RAIO_PERMITIDO}m do local.`);
      return;
    }

    try {
      const res = await api.post('/api/ponto', { status, localizacao: coords });
      Alert.alert('Sucesso', `Ponto de ${capitalize(status)} registrado!`);
      setPontos(prev => [...prev, res.data.ponto]);
    } catch (err) {
      console.log('Erro ao registrar ponto:', err);
      Alert.alert('Erro', 'Não foi possível registrar o ponto');
    }
  };

  // Divide os botões do carrossel em grupos de 2
  const slides: StatusDoDia[][] = [];
  for (let i = 0; i < statusDoDia.length; i += 2) {
    slides.push(statusDoDia.slice(i, i + 2));
  }

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <PontoHeader horario={undefined} data={undefined} />

      {/* Carrossel de botões */}
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={slides}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.map((status: StatusDoDia) => (
              <TouchableOpacity
                key={status.value}
                style={styles.buttonCarrossel}
                onPress={() => registrarPonto(status.value)}
              >
                <View
                  style={[
                    styles.circleCarrossel,
                    {
                      backgroundColor: isRegistered(status.value) ? colors[status.value] : '#fff',
                      borderColor: colors[status.value],
                      borderWidth: 2
                    }
                  ]}
                />
                <Text style={styles.label}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Bolinhas do slide */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: currentSlide === index ? '#3C188F' : '#777779ff' }]}
          />
        ))}
      </View>

      {/* Linha do tempo */}
      <Text style={styles.titulo}>Registros do dia</Text>
      <View style={styles.timeline}>
        {statusDoDia.map((status: StatusDoDia, index: number) => {
          const ponto = pontos.find(p => p.status === status.value);
          const isFirstAndEmpty = index === 0 && pontos.length === 0;
          const color = ponto ? colors[status.value] : isFirstAndEmpty ? '#3C188F' : '#9e9e9eff';
          const dateText = ponto
            ? new Date(ponto.horario).toLocaleDateString('pt-BR').replace(/\//g, '-')
            : isFirstAndEmpty
            ? 'sem registros'
            : '--/--/----';
          const timeText = ponto ? new Date(ponto.horario).toLocaleTimeString('pt-BR') : '--:--';

          return (
            <View key={status.value} style={styles.timelineItem}>
              <View style={[styles.circle, { backgroundColor: color }]} />
              {index !== statusDoDia.length - 1 && (
                <View style={[styles.lineVertical, { backgroundColor: '#433466ff' }]} />
              )}
              <View style={styles.lineContent}>
                <Text style={styles.status}>{status.label}</Text>
                <View style={styles.row}>
                  <Text style={styles.date}>{dateText}</Text>
                  <Text style={styles.time}>{timeText}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20
  },
  buttonCarrossel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3C188F',
    padding: 12,
    borderRadius: 30,
    minWidth: 130,
    justifyContent: 'flex-start'
  },
  circleCarrossel: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5
  },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center'
  },
  timeline: {
    width: '90%',
    marginVertical: 10,
    alignSelf: 'center'
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 20,
    position: 'relative'
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: 4
  },
  lineVertical: {
    position: 'absolute',
    left: 11,
    top: 28,
    height: 80,
    width: 2
  },
  lineContent: {
    flex: 1,
    marginLeft: 16
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  date: {
    fontSize: 12,
    color: '#333'
  },
  time: {
    fontSize: 12,
    color: '#333'
  }
});
