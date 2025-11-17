import React, { useState, useRef } from 'react';
import { View, FlatList, TouchableOpacity, ImageBackground, Text, StyleSheet, Dimensions } from 'react-native';

interface ActionItem {
  key: string;
  label?: string;
}

const actions: ActionItem[] = [
  { key: 'tarefas', label: 'Criar\nTarefas' },
  { key: 'escalas', label: 'Criar\nEscalas' },
  { key: 'equipe', label: 'Ver\nEquipe' },
  { key: 'pontos', label: 'Ver\nPontos' }
];

const screenWidth = Dimensions.get('window').width;
const slideWidth = screenWidth;
const cardWidth = screenWidth * 0.42;

const actionImages: Record<string, any> = {
  tarefas: require('../../assets/images/dashboard/criar_tarefas.png'),
  escalas: require('../../assets/images/dashboard/criar_escalas.png'),
  equipe: require('../../assets/images/dashboard/ver_equipe.png'),
  pontos: require('../../assets/images/dashboard/ver_pontos.png')
};

const titleColors: Record<string, string> = {
  tarefas: '#4aa4ed',
  escalas: '#489da5',
  equipe: '#ff7e4d',
  pontos: '#7417bd'
};

interface DashboardCarouselProps {
  setActiveScreen: (screen: string) => void;
}

export default function DashboardCarousel({ setActiveScreen }: DashboardCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const groupedActions: ActionItem[][] = [];
  for (let i = 0; i < actions.length; i += 2) {
    const group = actions.slice(i, i + 2);
    if (group.length === 1) group.push({ key: 'placeholder' });
    groupedActions.push(group);
  }

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveSlide(slideIndex);
  };

  const actionToScreen: Record<string, string> = {
    tarefas: 'criar-tarefas',
    escalas: 'criar-escalas',
    equipe: 'gerenciar-funcionarios',
    pontos: 'gerenciar-pontos'
  };

  return (
    <View style={{ width: '100%', paddingVertical: 20 }}>
      <FlatList
        ref={flatListRef}
        data={groupedActions}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            {item.map((action: ActionItem, index: number) =>
              action.key === 'placeholder' ? (
                <View key={'placeholder'} style={[styles.actionCard, { width: cardWidth, opacity: 0 }]} />
              ) : (
                <TouchableOpacity
                  key={action.key}
                  style={[
                    styles.actionCard,
                    { width: cardWidth },
                    index === 0 ? { marginRight: 10 } : { marginLeft: 10 }
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setActiveScreen(actionToScreen[action.key])}
                >
                  <ImageBackground
                    source={actionImages[action.key]}
                    style={styles.background}
                    imageStyle={{ borderRadius: 16 }}
                    resizeMode="cover"
                  >
                    <View style={styles.textContainer}>
                      <Text style={[styles.actionLabel, { color: titleColors[action.key] }]}>{action.label}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      />

      <View style={styles.pagination}>
        {groupedActions.map((_, index) => (
          <View key={index} style={[styles.dot, { opacity: index === activeSlide ? 1 : 0.3 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#ffffffff',
    elevation: 0
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 17
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 22,
    top: -28,
    left: -2,
    textShadowColor: 'rgba(255, 255, 255, 0.67)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4
  }
});
