import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../../constants/theme';

const { height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.86)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo block: spring scale + fade together
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Tagline trickles in after logo settles
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => navigation.replace('Onboarding'), 820);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />

      {/* Decorative ambient circles — rose warmth, very low opacity */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Brand block */}
      <Animated.View
        style={[
          styles.brandBlock,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />

        {/* Split-colour wordmark */}
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordGlow}>Glow</Text>
          <Text style={styles.wordBook}>Book</Text>
        </View>

        {/* Brand accent line — matches button gradient */}
        <LinearGradient
          colors={[theme.primary, '#E40E5A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />

        {/* Staggered tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
          Beauty, on your schedule.
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ambient background decoration — pure rose at 6-7% opacity
  circleTopRight: {
    position: 'absolute',
    top: -(height * 0.12),
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.primary,
    opacity: 0.06,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -(height * 0.1),
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: theme.primary,
    opacity: 0.05,
  },

  // Center content
  brandBlock: {
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
    marginBottom: 4,
  },

  // Wordmark
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordGlow: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
    color: theme.primary,
  },
  wordBook: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
    color: theme.labelPrimary,
  },

  // 40 × 3 gradient rule — same colours as CTA button
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: -4,
  },

  // Tagline — secondary label, light weight
  tagline: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.labelSecondary,
    letterSpacing: 0.1,
    marginTop: 2,
  },
});

export default SplashScreen;
