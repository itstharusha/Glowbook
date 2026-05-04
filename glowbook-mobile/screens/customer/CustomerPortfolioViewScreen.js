import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomerPortfolioViewScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const images = item.images || [];

  const onScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Back button overlaid on carousel — positioned below the status bar */}
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
        <View style={styles.backBtnInner}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </View>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {images.length > 0 ? (
          <View>
            <FlatList
              ref={flatListRef}
              data={images}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={({ item: imgUrl }) => (
                <Image
                  source={{ uri: imgUrl }}
                  style={{ width: SCREEN_WIDTH, height: 300 }}
                  resizeMode="cover"
                />
              )}
            />
            {/* Dot pagination */}
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color={theme.systemGray3} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title + Category */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          {/* Stylist attribution */}
          {item.stylistId?.name && (
            <View style={styles.stylistRow}>
              <Ionicons name="person-circle-outline" size={18} color={theme.primary} />
              <Text style={styles.stylistName}>By {item.stylistId.name}</Text>
            </View>
          )}

          {/* Description */}
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Tags</Text>
              <View style={styles.tagsWrap}>
                {item.tags.map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: theme.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.systemGray3,
  },
  dotActive: {
    backgroundColor: theme.primary,
    width: 18,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.labelPrimary,
    flex: 1,
    marginRight: 12,
  },
  categoryChip: {
    backgroundColor: '#FFF0F4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  stylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  stylistName: {
    fontSize: 15,
    color: theme.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: theme.labelSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  tagsSection: {
    marginTop: 4,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.labelSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.systemGray6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 13,
    color: theme.labelSecondary,
  },

});

export default CustomerPortfolioViewScreen;
