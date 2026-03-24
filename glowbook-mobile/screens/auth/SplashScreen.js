import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import theme from '../../constants/theme';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      // Navigate to Onboarding after 2 seconds
      setTimeout(() => {
        navigation.replace('Onboarding');
      }, 1000);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          {/* Simple SVG-like shape using Views for the logo */}
          <View style={styles.logoIcon}>
            <View style={styles.logoShape} />
          </View>
        </View>
        <Text style={styles.title}>GlowBook</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // iOS surface-container-lowest
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  logoIcon: {
    width: 101,
    height: 101,
    backgroundColor: theme.primary, // Using primary color instead of gradient
    borderRadius: 22, // squircle-lg approx
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, // Reduced for solid color
    shadowRadius: 30,
    elevation: 10,
  },
  logoShape: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 27, // ~20pt
    fontWeight: '600',
    color: theme.labelPrimary,
    letterSpacing: -0.5,
    fontFamily: theme.fontFamily,
  },
});

export default SplashScreen;
