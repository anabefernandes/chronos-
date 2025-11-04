import React, { useState, useRef } from 'react';
import { View, FlatList, TouchableOpacity, ImageBackground, Text, StyleSheet, Dimensions } from 'react-native';

interface ActionItem {
  key: string;
  label?: string;
}

const actions: ActionItem[] = [{ key: 'holerite' }, { key: 'tarefas' }, { key: 'escalas' }, { key: 'equipe' }];

const screenWidth = Dimensions.get('window').width;
const slideWidth = screenWidth;
const cardWidth = screenWidth * 0.42;

const actionImages: Record<string, any> = {
  holerite: require('../../assets/images/dashboard/criar_holerite.png'),
  tarefas: require('../../assets/images/dashboard/criar_tarefas.png'),
  escalas: require('../../assets/images/dashboard/criar_escalas.png'),
  equipe: require('../../assets/images/dashboard/criar_equipe.png')
};

interface DashboardCarouselProps {
  setActiveScreen: (screen: string) => void;
}

export default function DashboardCarousel({ setActiveScreen }: DashboardCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const groupedActions = [];
  for (let i = 0; i < actions.length; i += 2) {
    groupedActions.push(actions.slice(i, i + 2));
  }

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveSlide(slideIndex);
  };

  const actionToScreen: Record<string, string> = {
    holerite: 'criar-holerite',
    tarefas: 'criar-tarefas',
    escalas: 'criar-escalas',
    equipe: 'gerenciar-funcionarios'
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
        contentContainerStyle={{ paddingHorizontal: (screenWidth - slideWidth) / 2 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: slideWidth }]}>
            {item.map((action: ActionItem, index: number) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.actionCard,
                  { width: cardWidth },
                  index === 0 ? { marginRight: 10 } : { marginLeft: 10 }
                ]}
                activeOpacity={0.8}
                onPress={() => setActiveScreen(actionToScreen[action.key])}
              >
                <ImageBackground
                  source={actionImages[action.key]}
                  style={styles.background}
                  imageStyle={{ borderRadius: 16 }}
                  resizeMode="cover"
                >
                  <View style={styles.textContainer}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
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
    height: 120
  },
  background: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 16
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start'
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
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
