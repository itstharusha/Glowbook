import React, { useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Expert Services,\nTailored for You',
    description: 'Discover top-tier stylists and salons curated for your unique beauty aesthetic.',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=626&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    key: '2',
    title: 'Seamless Booking\nExperience',
    description: "Real-time availability and instant confirmations with the city's finest.",
    image: 'https://images.unsplash.com/photo-1589710751893-f9a6770ad71b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    key: '3',
    title: 'Elevate Your\nBeauty Ritual',
    description: 'Join GlowBook today and unlock exclusive rewards at your favorite spots.',
    image: 'https://images.unsplash.com/photo-1630595271375-5073a6c0638b?q=80&w=1152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Register'); // Or Login depending on flow
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slideContainer}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  // Dot Indicator
  const Indicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {slides.map((_, i) => {
          const isActive = i === currentIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isActive ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      {/* Bottom Controls */}
      <View style={[styles.bottomContainer, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
        <Indicator />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  slideContainer: {
    width,
    height,
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: height * 0.55,
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    ...theme.typography.largeTitle,
    fontSize: 32,
    textAlign: 'center',
    color: theme.labelPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 38,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.labelSecondary,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.background,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.primary,
  },
  inactiveDot: {
    backgroundColor: theme.systemGray5,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    width: '100%',
    height: 52,
    borderRadius: 14, // iOS style
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: theme.spacing.sm,
  },
  textButtonLabel: {
    color: theme.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
