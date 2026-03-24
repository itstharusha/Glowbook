import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const VendorWelcomeScreen = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleStart = () => {
    navigation.navigate('VendorCreateSalon');
  };

  const StepItem = ({ icon, text }) => (
    <View style={styles.stepItem}>
      <View style={styles.stepIconContainer}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Ionicons name="storefront" size={80} color={theme.primary} />
          <Ionicons name="sparkles" size={30} color={theme.primary} style={styles.sparkleIcon} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to GlowBook for Vendors</Text>
          <Text style={styles.subtitle}>
            Let's get your salon listed. It only takes a few minutes.
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          <StepItem icon="checkmark-circle" text="Set up your salon profile" />
          <StepItem icon="checkmark-circle" text="Add your services" />
          <StepItem icon="checkmark-circle" text="Add your stylists" />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={handleStart} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, '#E40E5A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Let's Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>I'll do this later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginBottom: 32,
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: 20,
    right: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.labelPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.labelSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 16,
    paddingHorizontal: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 45, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.labelPrimary,
  },
  actionContainer: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 14,
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
  secondaryButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.labelSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VendorWelcomeScreen;
