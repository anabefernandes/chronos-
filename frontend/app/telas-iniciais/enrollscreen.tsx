import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

// Tipagem da navegação
type RootStackParamList = {
  Painel: undefined;
  Enroll: undefined;
  Verify: undefined;
};

type EnrollNavigationProp = NativeStackNavigationProp<RootStackParamList, "Enroll">;

export default function EnrollScreen() {

  const navigation = useNavigation<EnrollNavigationProp>();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const handleTakePhoto = async () => {
  try {
    // Solicita permissão para câmera
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      Alert.alert(
        "Permissão necessária",
        "É preciso permitir o acesso à câmera para tirar fotos."
      );
      return;
    }

    // Solicita permissão para galeria (necessário para manipulação no ImageManipulator)
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus !== 'granted') {
      Alert.alert(
        "Permissão necessária",
        "É preciso permitir o acesso à galeria para salvar fotos."
      );
      return;
    }

    // Abre a câmera
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const original = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.8, base64: true }
      );

      if (manipulated && manipulated.uri) {
        const correctedPhoto = {
          ...original,
          uri: manipulated.uri,
          base64: manipulated.base64,
        };
        setPhoto(correctedPhoto);
      } else {
        console.error("Falha: o ImageManipulator não retornou um URI válido");
      }
    }
  } catch (error) {
    console.error("Erro ao abrir a câmera:", error);
    Alert.alert("Erro", "Não foi possível acessar a câmera.");
  }
};


const handleEnroll = async () => {
  if (!photo?.base64) {
    Alert.alert("Erro", "Por favor, tire uma foto antes de cadastrar.");
    return;
  }

  try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Erro", "Usuário não encontrado. Faça login novamente.");
        return;
      }

    const response = await fetch("http://192.168.0.214:5001/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: photo.base64,
         user_id: userId, // envia o ID correto
      }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert("Sucesso", data.message || "Rosto cadastrado com sucesso!");
    } else {
      Alert.alert("Erro", data.error || "Falha ao cadastrar rosto.");
    }
  } catch (error) {
    Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    console.error(error);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar Rosto</Text>

      {photo && (
        <Image source={{ uri: photo.uri }} style={styles.image} />
      )}

      <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>Tirar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleEnroll}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate("Verify")}
      >
        <Text style={styles.buttonText}>Ir para Verificação</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  image: { width: 200, height: 200, borderRadius: 12, marginBottom: 20 },
  button: { backgroundColor: "#ff69b4", padding: 12, borderRadius: 10, marginVertical: 8, width: "70%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  secondaryButton: { backgroundColor: "#ff85c1" },
});
