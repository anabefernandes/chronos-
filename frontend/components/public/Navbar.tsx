import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../../assets/images/iniciais/logo_chronos.png');

type NavbarProps = {
  notificacoes?: number;
  onPressNotificacao?: () => void;
  onPressPerfil?: () => void;
};

export default function Navbar({ notificacoes = 0, onPressNotificacao, onPressPerfil }: NavbarProps) {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.icons}>
        <TouchableOpacity onPress={onPressNotificacao} style={styles.iconWrapper}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
          {notificacoes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificacoes}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onPressPerfil} style={styles.iconWrapper}>
          <Ionicons name="person-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: '#3e39a0fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: 30
  },
  logo: {
    width: 160,
    height: 60
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconWrapper: {
    marginLeft: 20
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
