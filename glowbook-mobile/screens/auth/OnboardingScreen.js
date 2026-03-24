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
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Expert Services,\nTailored for You',
    description: 'Discover top-tier stylists and salons curated for your unique beauty aesthetic.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsHX5_H7n7W9HZNLZZYkE8sn3hR2HjoeRnmqjaUE2rHjwWeyj9_0Vbw-apzqm4swR80P25ubj9WWOEQKXJplokty52dqSd6Nu-0ItrlPy2fLJFy5nryhomwpdLEsilq-lOec7FaFS51HepRcxeJWtJBQkjUf1yXL5N3oMhKbxgh1udGyqn6tq84HxXns0i0NEoBJo3agbfSjEob5CS_w_BNcFKRO2LZupNMycrEpYWi3Tv3LMhtZ9sJELh81tFaKhy_AybBSNZcYpq',
  },
  {
    key: '2',
    title: 'Seamless Booking\nExperience',
    description: "Real-time availability and instant confirmations with the city's finest.",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIzs44-WnXGOXY2OjjMlcNwawCIae2vUGtbCZ39f8HwHiSWiQ98irfwxX4LW7eLYh7Y2LZ5FTitfvW23EeLLIMpcTnn00tJFHQLQlnqGz6ktwOX0ZoXpA9kSnG_7gqClVk2FWzdGJaxcqCRdqK9g0C_e8zS39NSv8Q43Kl2pu7SSLmY4XlSG9yntVLhFAiIKtENGR3Ss1uwFXW1ztAQM-iDkS3YVoHG8LlnVosDNTCsJXKm1zLT98cVSgoS3_RPyAbMXuBHLEgsAuv',
  },
  {
    key: '3',
    title: 'Elevate Your\nBeauty Ritual',
    description: 'Join GlowBook today and unlock exclusive rewards at your favorite spots.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAig_rtnPlcaXfMK1GxYjq6QjKaorDi3NepIBLfEgS35_HJGHVmoLXRfAA_2vD1nVH72amsgP606IFGqM5z2B--AsyRndUMUxUpsvRRlXQnSvwKrv1tpCou7MYUIDKPYZF9Kb8K6cYydcHzsqzk0xColhrEOAUwHFkOJAw5HNxN3QpVN0anP0KNWIPFq1Ho-d63YprLfjXxGUj1Ez3e4Li96DFLYpjmZDaFLA-5BAC1U4r4dIolsNiIW2p7pxAspxpW9ZEox9ExQGQn',
  },
];

const OnboardingScreen = ({ navigation }) => {
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
      <View style={styles.bottomContainer}>
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
    paddingBottom: theme.spacing.xl + 20, // ample space for safe area
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
