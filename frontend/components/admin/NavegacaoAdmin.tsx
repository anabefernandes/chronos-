import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { icons, activeIconsAdmin } from '../../assets/images/navegacao';

type MenuKey =
  | 'dashboard'
  | 'ponto'
  | 'tarefas'
  | 'criar-tarefas'
  | 'escalas'
  | 'holerite'
  | 'gerenciar-funcionarios'
  | 'perfil'
  | 'notificacoes'
  | '';


interface NavegacaoAdminProps {
  activeScreen: MenuKey | '';
  onScreenChange: (screen: MenuKey) => void;
}

const NavegacaoAdmin: React.FC<NavegacaoAdminProps> = ({ activeScreen, onScreenChange }) => {
  const menuItems: { key: MenuKey; label: string }[] = [
    { key: 'ponto', label: 'Ponto' },
    { key: 'tarefas', label: 'Tarefas' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'escalas', label: 'Escalas' },
    { key: 'holerite', label: 'Holerite' }
  ];

  const normalItems = menuItems.filter(item => item.key !== 'dashboard');
  const dashboardItem = menuItems.find(item => item.key === 'dashboard');

  const screenWidth = Dimensions.get('window').width - 20;
  const itemWidth = screenWidth / normalItems.length;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dashboardScale = useRef(new Animated.Value(1)).current;

  const validActive = menuItems.some(item => item.key === activeScreen) ? activeScreen : '';

  useEffect(() => {
    Animated.spring(dashboardScale, {
      toValue: validActive === 'dashboard' ? 1.1 : 1,
      useNativeDriver: true,
      friction: 5
    }).start();

    if (!validActive || validActive === 'dashboard') return;

    const index = normalItems.findIndex(item => item.key === validActive);
    if (index < 0) return;

    const offset = (itemWidth - 80) / 2;
    Animated.spring(slideAnim, {
      toValue: index * itemWidth + offset,
      useNativeDriver: true,
      bounciness: 10
    }).start();
  }, [validActive]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: screenWidth }]}>
        {validActive && validActive !== 'dashboard' && (
          <Animated.View style={[styles.activeBg, { width: itemWidth - 20, transform: [{ translateX: slideAnim }] }]} />
        )}

        {dashboardItem && (
          <View style={styles.dashboardWrapper}>
            <TouchableOpacity onPress={() => onScreenChange('dashboard')} activeOpacity={1}>
              <Animated.View
                style={[
                  styles.dashboardCircle,
                  validActive === 'dashboard' && styles.dashboardActive,
                  { transform: [{ scale: dashboardScale }] }
                ]}
              >
                <Image source={activeIconsAdmin.dashboard} style={{ width: 36, height: 36, tintColor: '#fff' }} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}

        {normalItems.map(item => {
          const isActive = validActive === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => onScreenChange(item.key)}
              activeOpacity={1}
            >
              <Image
                source={
                  isActive
                    ? activeIconsAdmin[item.key as keyof typeof activeIconsAdmin]
                    : icons[item.key as keyof typeof icons]
                }
                style={styles.icon}
              />
              <Text style={[styles.label, isActive && { color: '#377ACF' }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
export default NavegacaoAdmin;
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 18,
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
    borderColor: 'rgba(138, 167, 205, 0.33)',
    borderRadius: 40,
    position: 'relative',
    paddingVertical: 6
  },
  activeBg: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: '#d0e1f8e2',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 8
  },
  dashboardWrapper: {
    position: 'absolute',
    top: -48,
    left: '50%',
    transform: [{ translateX: -37.5 }],
    zIndex: 20
  },
  dashboardCircle: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#377ACF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dashboardActive: {
    backgroundColor: '#0674d4ff'
  },
  icon: { width: 28, height: 28, marginBottom: 3 },
  label: { color: '#767272ff', fontSize: 12, marginTop: 2, fontWeight: 'bold' }
});
