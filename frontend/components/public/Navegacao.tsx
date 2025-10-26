import React, { useRef, useEffect, useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { icons, activeIconsUser } from '../../assets/images/navegacao';

interface NavegacaoProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

const Navegacao: React.FC<NavegacaoProps> = ({ activeScreen, onScreenChange }) => {
  const { role } = useContext(AuthContext);

  const menuItems = [
    { key: 'ponto', label: 'Ponto' },
    { key: 'tarefas', label: 'Tarefas' },
    { key: 'escalas', label: 'Escalas' },
    { key: 'holerite', label: 'Holerite' }
  ];

  const screenWidth = Dimensions.get('window').width - 20;
  const itemWidth = screenWidth / menuItems.length;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = menuItems.findIndex(item => item.key === activeScreen);
    const offset = (itemWidth - (itemWidth - 11)) / 2;
    Animated.spring(slideAnim, {
      toValue: index * itemWidth + offset,
      useNativeDriver: true,
      bounciness: 10
    }).start();
  }, [activeScreen]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: screenWidth }]}>
        <Animated.View style={[styles.activeBg, { width: itemWidth - 14, transform: [{ translateX: slideAnim }] }]} />
        {menuItems.map(item => {
          const isActive = activeScreen === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => onScreenChange(item.key)}
              activeOpacity={1}
            >
              <Image
                source={isActive ? (activeIconsUser as any)[item.key] : (icons as any)[item.key]}
                style={styles.icon}
              />

              <Text style={[styles.activeMenuText, isActive && { color: '#fff' }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Navegacao;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f4f50ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'visible'
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(98, 116, 140, 0.21)',
    borderRadius: 40,
    position: 'relative',
    paddingVertical: 6
  },
  activeBg: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: '#377ACF',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 8
  },
  icon: {
    width: 28,
    height: 28,
    marginBottom: 3
  },
  activeMenuText: {
    color: '#444',
    fontSize: 12,
    marginTop: 2,
    fontWeight: 'bold'
  }
});
