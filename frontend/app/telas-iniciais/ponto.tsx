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
import { CameraCapturedPicture } from 'expo-camera';
import { EXPO_PUBLIC_FACEAPI_URL } from '@env';
import LottieView from 'lottie-react-native';

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
]as const;
type Status = typeof statusDoDia[number]['value'];


const colors: Record<Status, string> = {
  entrada: '#469348',
  almoco: '#c8951eff',
  retorno: '#3493B4',
  saida: '#AB3838'
};

const LOCAL_FIXO = {
  latitude: -24.00499845450938, 
  longitude: -46.412365233301664
};
const RAIO_PERMITIDO = 100;
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
  const [modalSuccessVisible, setModalSuccessVisible] = useState(false);
  const [modalFailVisible, setModalFailVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const isRegistered = (status: Status) => pontos.some(p => p.status === status);

  const pedirPermissaoLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setModalMessage('Precisamos da sua localização para registrar o ponto.');
      setModalFailVisible(true);
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
      console.error("Erro ao capturar foto:", error);
      return null;
    }
  };

  const handleVerifyAndRegister = async (status: Status) => {
    try {
      const capturedPhoto = await handleTakePhoto();
      if (!capturedPhoto?.base64) {
        Alert.alert("Erro", "Falha ao capturar a foto. Tente novamente.");
        return;
      }
      setPhoto(capturedPhoto);

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
        return;
      }

      const verifyResponse = await fetch(`${process.env.EXPO_PUBLIC_FACEAPI_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedPhoto.base64, user_id: userId }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        Alert.alert("Erro", verifyData.error || "Falha na verificação do rosto.");
        return;
      }
      Alert.alert("Verificado", verifyData.message || "Rosto confirmado!");

      // 3️⃣ Verifica localização
      const coords = await pedirPermissaoLocalizacao();
      if (!coords) return;

      const distancia = getDistanceFromLatLonInMeters(
        coords.latitude,
        coords.longitude,
        LOCAL_FIXO.latitude,
        LOCAL_FIXO.longitude
      );

      if (distancia > RAIO_PERMITIDO) {
        Alert.alert(
          "Fora do local permitido",
          `Você precisa estar a até ${RAIO_PERMITIDO}m do local.`
        );
        return;
      }

      // 4️⃣ Registrar ponto no backend
      const res = await api.post('/ponto', { status, localizacao: coords });
      const pontoRegistrado = res.data.ponto;

      // Atualiza estado local imediatamente
      setPontos(prev => [...prev, pontoRegistrado]);

      // 5️⃣ Mostrar overlay de sucesso
      setVerificationResult('success');
      setModalMessage(`Ponto de ${capitalize(status)} registrado com sucesso!`);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setModalMessage('Não foi possível conectar ao servidor ou registrar o ponto.');
      setModalFailVisible(true);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPontos();
  }, []);

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
    } catch (err) {
      console.log('Erro ao buscar pontos:', err);
    }
  };

  const slides: StatusDoDia[][] = [];
  for (let i = 0; i < statusDoDia.length; i += 2) slides.push(statusDoDia.slice(i, i + 2));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      <PontoHeader horario={undefined} data={undefined} />

      {/* Overlay de carregamento */}
      <Modal transparent visible={loading}>
        <View style={styles.overlayContainer}>
          <LottieView
            source={require('../../assets/lottie/reconhecimento.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.overlayText}>Reconhecimento facial em andamento...</Text>
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
              setVerificationResult(null);
              setPhoto(null); // libera para bater outro ponto
            }}
          />
          <Text style={styles.overlayText}>Rosto verificado! O ponto foi batido.</Text>
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
          <Text style={styles.overlayText}>Rosto não reconhecido, tente novamente.</Text>
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

      {/* Modal de sucesso */}
      <Modal
        transparent
        animationType="slide"
        visible={modalSuccessVisible}
        onRequestClose={() => setModalSuccessVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, { backgroundColor: '#469348' }]}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalSuccessVisible(false)}>
              <Text style={styles.modalButton}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de falha */}
      <Modal
        transparent
        animationType="slide"
        visible={modalFailVisible}
        onRequestClose={() => setModalFailVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalBox, { backgroundColor: '#AB3838' }]}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalFailVisible(false)}>
              <Text style={styles.modalButton}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  takePhotoButton: {
    backgroundColor: '#ff69b4',
    padding: 12,
    borderRadius: 10
  },
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
  }
});