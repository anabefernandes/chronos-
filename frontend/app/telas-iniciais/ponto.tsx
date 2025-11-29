import api from '../../services/api';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Dimensions,
  ScrollView,
  Image,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert
} from 'react-native';
import PontoHeader from '../../components/public/PontoHeader';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import LottieView from 'lottie-react-native';
import HistoricoPontos from '../../components/public/HistoricoPontos';
import Cronometro from '../../components/public/Cronometro';

const { width } = Dimensions.get('window');

type status = 'entrada' | 'almoco' | 'retorno' | 'saida';

interface Ponto {
  _id: string;
  status: status;
  horario: string;
}

interface StatusDoDia {
  label: string;
  value: string;
}

const statusDoDia: StatusDoDia[] = [
  { label: 'Entrada', value: 'entrada' },
  { label: 'Almoço', value: 'almoco' },
  { label: 'Retorno', value: 'retorno' },
  { label: 'Saída', value: 'saida' }
] as const;
type Status = (typeof statusDoDia)[number]['value'];

const colors: Record<Status, string> = {
  entrada: '#469348',
  almoco: '#c8951eff',
  retorno: '#3493B4',
  saida: '#AB3838'
};

const LOCAL_FIXO = {
  latitude: -24.024648294927673, 
  longitude: -46.488965661504366
  //fatec -24.005000134697887, -46.41235625962236
  //casa ju -24.00013549493022, -46.43179800176456
  //casa ana -24.02469729192365, -46.488944203831636
};

const RAIO_PERMITIDO = 500;
type CapturedPhoto = { uri: string; base64?: string };

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Ponto() {
  const [user, setUser] = useState<any>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList<StatusDoDia[]>>(null);
  const [localizacao, setLocalizacao] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);

  // estados centralizados e únicos para overlays
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | 'folga' | null>(null);
  const [modalMessage, setModalMessage] = useState('');

  const [historico, setHistorico] = useState<any[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const historicoRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  // tempoInfo vem do endpoint /ponto/tempo-restante
  const [tempoInfo, setTempoInfo] = useState<{
    pontoBatido: { entrada: boolean; almoco: boolean; retorno: boolean; saida: boolean };
    horaEntrada?: string | Date | null;
    horaAlmoco?: string | Date | null;
    horaSaida?: string | Date | null;
    duracaoAlmocoMinutos?: number;
  } | null>(null);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const isRegistered = (status: Status) => pontos.some(p => p.status === status);

  const pedirPermissaoLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setModalMessage('Precisamos da sua localização para registrar o ponto.');
      setVerificationResult('fail');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
    setLocalizacao(coords);
    return coords;
  };

  const handleTakePhoto = async (): Promise<CapturedPhoto | null> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const original = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          original.uri,
          [{ flip: ImageManipulator.FlipType.Horizontal }],
          { compress: 0.8, base64: true }
        );
        return { uri: manipulated.uri, base64: manipulated.base64 };
      }
      return null;
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      return null;
    }
  };

  const handleVerifyAndRegister = async (status: Status) => {
    try {
      if (user?.folgaHoje) {
        setVerificationResult('folga');
        setModalMessage('Você está de folga hoje!');
        return;
      }
      // reset previous states
      setVerificationResult(null);
      setModalMessage('');
      setPhoto(null);

      // 1) FOTO
      const capturedPhoto = await handleTakePhoto();
      if (!capturedPhoto?.base64) {
        setVerificationResult('fail');
        setModalMessage('Falha ao capturar a foto.');
        return;
      }
      setPhoto(capturedPhoto);

      setLoading(true);

      // 2) LOCALIZAÇÃO
      const coords = await pedirPermissaoLocalizacao();
      if (!coords) {
        setLoading(false);
        return;
      }

      const distancia = getDistanceFromLatLonInMeters(
        coords.latitude,
        coords.longitude,
        LOCAL_FIXO.latitude,
        LOCAL_FIXO.longitude
      );

      if (distancia > RAIO_PERMITIDO) {
        setLoading(false);
        setVerificationResult('fail');
        setModalMessage('Você está fora da localização permitida!');
        return;
      }

      // 3) VERIFICA FACE (API externa)
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        setVerificationResult('fail');
        setModalMessage('Usuário não encontrado. Faça login novamente.');
        return;
      }

      // ATENÇÃO: variável de ambiente EXPO_PUBLIC_FACEAPI_URL deve estar configurada
      const verifyResponse = await fetch(`${process.env.EXPO_PUBLIC_FACEAPI_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedPhoto.base64, user_id: userId })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData || verifyData.success === false) {
        setLoading(false);
        setVerificationResult('fail');
        setModalMessage('Falha de reconhecimento!');
        return;
      }

      // 4) REGISTRAR PONTO NO BACKEND
      const res = await api.post('/ponto', { status, localizacao: coords });
      const pontoRegistrado = res.data.ponto;
      // Atualiza array local e refaz fetch do histórico completo
      setPontos(prev => [...prev, pontoRegistrado]);
      await fetchPontos();

      // atualizar o tempoInfo (puxa do endpoint que fornece horários)
      await carregarTempoRestante();

      setLoading(false);
      setVerificationResult('success');
      setModalMessage(`Ponto de ${capitalize(status)}\n registrado com sucesso!`);
    } catch (err) {
      console.error('Erro em handleVerifyAndRegister:', err);
      setLoading(false);
      setVerificationResult('fail');
      setModalMessage('Erro ao conectar ao servidor.');
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPontos();
    carregarTempoRestante();
  }, []);

  // sempre que pontos mudarem, atualiza tempoInfo para garantir que cronometro resete
  useEffect(() => {
    carregarTempoRestante().catch(() => {});
  }, [pontos]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/userAuth');
      setUser(res.data);
    } catch (err) {
      console.log('Erro ao buscar usuário:', err);
    }
  };

  const fetchPontos = async () => {
    try {
      const res = await api.get('/ponto/meus');
      const hoje = new Date().toISOString().slice(0, 10);
      const pontosHoje = res.data.filter((p: Ponto) => new Date(p.horario).toISOString().slice(0, 10) === hoje);
      setPontos(pontosHoje);

      // Montar histórico agrupado por dia
      const agrupado: any = {};
      res.data.forEach((p: Ponto) => {
        const data = new Date(p.horario).toISOString().slice(0, 10); // yyyy-mm-dd
        const hora = new Date(p.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (!agrupado[data]) {
          agrupado[data] = {
            data,
            registros: {}
          };
        }
        agrupado[data].registros[p.status] = hora;
      });

      const historicoArray = Object.values(agrupado).sort((a: any, b: any) => b.data.localeCompare(a.data));
      setHistorico(historicoArray);
    } catch (err) {
      console.log('Erro ao buscar pontos:', err);
    }
  };

  // chama endpoint /ponto/tempo-restante e guarda os horários esperados e flags
  const carregarTempoRestante = async () => {
    try {
      const res = await api.get('/ponto/tempo-restante');
      // backend envia: pontoBatido, horaEntrada, horaAlmoco, horaSaida, duracaoAlmocoMinutos
      const data = res.data;
      setTempoInfo({
        pontoBatido: data.pontoBatido ?? {
          entrada: false,
          almoco: false,
          retorno: false,
          saida: false
        },
        horaEntrada: data.horaEntrada ?? null,
        horaAlmoco: data.horaAlmoco ?? null,
        horaSaida: data.horaSaida ?? null,
        duracaoAlmocoMinutos: data.duracaoAlmocoMinutos ?? 60
      });
    } catch (err) {
      console.log('Erro ao carregar tempo restante:', err);
    }
  };

  const slides: StatusDoDia[][] = [];
  for (let i = 0; i < statusDoDia.length; i += 2) slides.push(statusDoDia.slice(i, i + 2));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 20 }}>
      <PontoHeader
        horaEntrada={tempoInfo?.horaEntrada ?? user?.horaEntradaEscala ?? null}
        duracaoAlmocoMinutos={tempoInfo?.duracaoAlmocoMinutos ?? user?.duracaoAlmoco ?? 60}
        horaEntradaReal={pontos.find(p => p.status === 'entrada')?.horario ?? null}
        horaAlmocoReal={pontos.find(p => p.status === 'almoco')?.horario ?? null}
        horaRetornoReal={pontos.find(p => p.status === 'retorno')?.horario ?? null}
        horaSaidaReal={pontos.find(p => p.status === 'saida')?.horario ?? null}
        horaSaida={tempoInfo?.horaSaida ?? user?.horaSaidaEscala ?? null}
        pontoBatido={{
          entrada: pontos.some(p => p.status === 'entrada'),
          almoco: pontos.some(p => p.status === 'almoco'),
          retorno: pontos.some(p => p.status === 'retorno'),
          saida: pontos.some(p => p.status === 'saida')
        }}
      />

      {/* Overlay de carregamento */}
      <Modal transparent visible={loading}>
        <View style={styles.overlayContainer}>
          <LottieView
            source={require('../../assets/lottie/reconhecimento.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.overlayText}>Reconhecimento em andamento...</Text>
        </View>
      </Modal>

      <Modal transparent visible={verificationResult === 'folga'}>
        <View style={styles.overlayContainer}>
          <LottieView
            source={require('../../assets/lottie/folga.json')} // seu Lottie de folga
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
            onAnimationFinish={() => setVerificationResult(null)}
          />
          <Text style={styles.overlayText}>{modalMessage}</Text>
        </View>
      </Modal>

      {/* Overlay de sucesso */}
      <Modal transparent visible={verificationResult === 'success'}>
        <View style={styles.overlayContainer}>
          <LottieView
            source={require('../../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
            onAnimationFinish={() => {
              // após o sucesso, limpa estado e atualiza dados
              setVerificationResult(null);
              setPhoto(null);
              fetchPontos().catch(() => {});
            }}
          />
          <Text style={styles.overlayText}>{modalMessage}</Text>
        </View>
      </Modal>

      {/* Overlay de falha */}
      <Modal transparent visible={verificationResult === 'fail'}>
        <View style={styles.overlayContainer}>
          <LottieView
            source={require('../../assets/lottie/fail.json')}
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
            onAnimationFinish={() => setVerificationResult(null)}
          />
          <Text style={styles.overlayText}>{modalMessage}</Text>
        </View>
      </Modal>

      {/* Carrossel de status */}
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
                onPress={() => handleVerifyAndRegister(status.value)}
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

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: currentSlide === index ? '#3C188F' : '#777779ff' }]}
          />
        ))}
      </View>

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

      <TouchableOpacity style={styles.botaoHistorico} onPress={() => setMostrarHistorico(prev => !prev)}>
        <Text style={styles.botaoHistoricoTexto}>{mostrarHistorico ? 'Ocultar histórico ▲' : 'Ver histórico ▼'}</Text>
      </TouchableOpacity>

      {mostrarHistorico && (
        <View
          onLayout={event => {
            const { y } = event.nativeEvent.layout;
            scrollRef.current?.scrollTo({ y, animated: true });
          }}
        >
          <HistoricoPontos historico={historico} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  previewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10
  },
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000066'
  },
  modalBox: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%'
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center'
  },
  modalButton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 14, 14, 0.87)'
  },
  overlayText: {
    fontSize: 15,
    color: '#fbfbfbff',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 15,
    textAlign: 'center'
  },
  botaoHistorico: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3C188F',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 10,
    alignSelf: 'center'
  },
  botaoHistoricoTexto: {
    color: '#3C188F',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
