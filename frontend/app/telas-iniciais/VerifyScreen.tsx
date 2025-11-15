import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";


// Tipagem da navegação
type RootStackParamList = {
  Painel: undefined;
  Enroll: undefined;
  Verify: undefined;
};

type VerifyNavigationProp = NativeStackNavigationProp<RootStackParamList, "Verify">;

export default function VerifyScreen() {
  const navigation = useNavigation<VerifyNavigationProp>();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
    try {
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
    } catch (error) {
      console.error("Erro ao processar a imagem:", error);
    }
  }
};

  const handleVerify = async () => {
    if (!photo?.base64) {
      Alert.alert("Erro", "Por favor, tire uma foto para verificar.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photo.base64,
          user_id: "usuario_teste3",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Resultado", data.message || "Rosto verificado com sucesso!");
      } else {
        Alert.alert("Erro", data.error || "Falha na verificação.");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificar Rosto</Text>

      {photo && <Image source={{ uri: photo.uri }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
        <Text style={styles.buttonText}>Tirar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verificar</Text>
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
});
