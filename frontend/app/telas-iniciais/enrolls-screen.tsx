import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../contexts/ToastContext';
import LottieView from 'lottie-react-native';

export default function EnrollScreen() {
  const router = useRouter();
  const toast = useToast();

  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'success' | 'error'>('success');

  const infoAnimated = useRef(new Animated.Value(0)).current;
  const msg1Anim = useRef(new Animated.Value(0)).current;
  const msg2Anim = useRef(new Animated.Value(0)).current;
  const animatedValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    if (photo) {
      msg1Anim.setValue(0);
      msg2Anim.setValue(0);

      Animated.sequence([
        Animated.timing(msg1Anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(msg2Anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [photo]);

  const startAnimations = () =>
    animatedValues.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: i * 400,
        useNativeDriver: true
      }).start();
    });

  useEffect(() => {
    if (!photo) startAnimations();
  }, [photo]);

  useEffect(() => {
    if (photo) {
      Animated.spring(infoAnimated, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      }).start();
    }
  }, [photo]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.showToast('É preciso permitir o acesso à câmera.', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: false,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front
    });

    if (!result.canceled && result.assets.length > 0) {
      const original = result.assets[0];

      const visual = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.8 }
      );

      const resizedForAPI = await ImageManipulator.manipulateAsync(original.uri, [{ resize: { width: 600 } }], {
        compress: 0.8,
        base64: true
      });

      let base64ForAPI = resizedForAPI.base64 || '';
      if (base64ForAPI.startsWith('data:image')) base64ForAPI = base64ForAPI.split(',')[1];

      setPhoto({
        ...original,
        uri: visual.uri,
        base64: base64ForAPI
      });
    }
  };

  const handleEnroll = async () => {
    if (!photo?.base64) {
      toast.showToast('Tire uma foto antes de cadastrar.', 'error');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        toast.showToast('Usuário não encontrado. Faça login novamente.', 'error');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_FACEAPI_URL}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          image: photo.base64
        })
      });

      const data = await response.json();

      // --- SUCESSO ---
      if (response.ok) {
        // CASO 1 — Rosto já cadastrado
        if (data?.status === 'already_enrolled' || data?.message?.includes('já cadastrado')) {
          toast.showToast('Atenção, seu rosto já foi cadastrado!', 'error');
          setTimeout(() => {
            router.replace('/telas-iniciais/perfil');
          }, 800);
          return;
        }

        // CASO 2 — Primeiro cadastro realizado
        toast.showToast('Rosto cadastrado com sucesso!', 'success');
        setTimeout(() => {
          router.replace('/telas-iniciais/perfil');
        }, 800);
        return;
      }

      // --- ERRO TRATADO PELO SERVIDOR ---
      toast.showToast(data?.error || 'Não foi possível cadastrar, tente novamente.', 'error');
    } catch (error) {
      console.error(error);

      // --- ERRO DE CONEXÃO ---
      toast.showToast('Não foi possível cadastrar, tente novamente.', 'error');
    }
  };

  const instructions = [
    { icon: require('../../assets/images/telas-public/icone_lampada.png'), text: 'Prefira ambientes bem iluminados.' },
    {
      icon: require('../../assets/images/telas-public/icone_scan.png'),
      text: 'Mantenha o celular na altura do rosto e olhe diretamente para a câmera.'
    },
    {
      icon: require('../../assets/images/telas-public/icone_semacessorio.png'),
      text: 'Remova óculos escuros, chapéus, bonés ou qualquer objeto que cubra o rosto.'
    }
  ];

  return (
    <ScrollView contentContainerStyle={{ ...styles.container, flexGrow: 1 }}>
      {!photo ? (
        <>
          <Text style={styles.title}>Cadastro Facial</Text>

          <Image source={require('../../assets/images/telas-public/reconhecimento.jpg')} style={styles.faceImage} />

          <View style={styles.card}>
            <Text style={styles.subtitle}>Pronto para capturar sua foto?{'\n'}Siga as instruções abaixo!</Text>
          </View>

          <View style={styles.instructions}>
            {instructions.map((item, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: animatedValues[index],
                  transform: [
                    {
                      scale: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }
                  ],
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 10
                }}
              >
                <Image
                  source={item.icon}
                  style={[styles.icon, index === instructions.length - 1 && { width: 30, height: 30 }]}
                />

                <View style={styles.instructionCard}>
                  <Text style={styles.instructionText}>{item.text}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/telas-iniciais/perfil')}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startButton} onPress={handleTakePhoto}>
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* --- Tela COM foto (preview) --- */}
          <Text style={styles.titleVisualizacao}>Pré-visualização da Foto</Text>

          <Image source={{ uri: photo.uri }} style={styles.preview} />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPhoto(null)}>
              <Text style={styles.buttonText}>Tentar de Novo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startButton} onPress={handleEnroll}>
              <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>
          </View>

          {/* Mensagem 1 */}
          <Animated.View
            style={[
              styles.msgBubble,
              {
                opacity: msg1Anim,
                transform: [
                  {
                    translateY: msg1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Image source={require('../../assets/images/telas-public/icone_robo.png')} style={styles.robotFloat} />

            <Text style={styles.infoTitle}>Você sabia?</Text>

            <Text style={styles.msgText}>
              O reconhecimento facial protege sua conta, garantindo que apenas você tenha acesso.
            </Text>
          </Animated.View>

          {/* Mensagem 2 */}
          <Animated.View
            style={[
              styles.msgBubble,
              {
                opacity: msg2Anim,
                transform: [
                  {
                    translateY: msg2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.msgText}>Além de agilizar seus pontos e manter seus dados seguros!</Text>
          </Animated.View>
        </>
      )}

      {/* Overlay de Sucesso/Erro */}
      {showOverlay && (
        <View style={styles.overlay}>
          <LottieView
            source={
              overlayType === 'success'
                ? require('../../assets/lottie/success.json')
                : require('../../assets/lottie/fail.json')
            }
            autoPlay
            loop={false}
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.overlayText}>
            {overlayType === 'success' ? 'Cadastro facial realizado!' : 'Falha no cadastro facial.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f7'
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    color: '#3C188F',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 50
  },
  titleVisualizacao: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    color: '#3C188F',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 55
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Poppins_400Regular',
    color: '#3C188F',
    textAlign: 'center',
    lineHeight: 22
  },
  faceImage: {
    width: 300,
    height: 270,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 30
  },
  instructions: {
    marginHorizontal: 5
  },
  instructionCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    flex: 1,
    shadowColor: '#3C188F',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333'
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: 12
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#B0B0B0',
    paddingVertical: 16,
    borderRadius: 30,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  startButton: {
    flex: 1,
    backgroundColor: '#3C188F',
    paddingVertical: 16,
    borderRadius: 30,
    marginLeft: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20
  },
  msgBubble: {
    backgroundColor: '#dfeaf5ff',
    padding: 16,
    borderRadius: 18,
    width: '88%',
    alignSelf: 'center',
    marginTop: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 }
  },
  infoIcon: {
    width: 55,
    height: 55,
    alignSelf: 'center',
    marginBottom: 10
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3C188F',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular'
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4c24a9ff',
    marginBottom: 15,
    marginLeft: 3,
    textAlign: 'center'
  },
  infoText: {
    fontSize: 15,
    color: '#3C188F',
    lineHeight: 20
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.79)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  overlayText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  robotFloat: {
    width: 60,
    height: 60,
    position: 'absolute',
    top: -25,
    right: 1,
    zIndex: 99
  }
});
