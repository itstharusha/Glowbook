import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import theme from '../../constants/theme';
import { config } from '../../config/appConfig';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, socialLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);

  // Google OAuth Setup
  // UPDATE config/appConfig.js with your Google CLIENT_ID from Google Cloud Console
  // See OAUTH_SETUP_GUIDE.md for detailed instructions
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: config.GOOGLE_CLIENT_ID,
    redirectUrl: config.GOOGLE_REDIRECT_URL,
  });

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Missing Information', 'Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        Alert.alert('Sign In Failed', 'Incorrect email or password. Please try again.');
      }
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    try {
      const result = await googlePromptAsync();
      if (result?.type === 'success' && result?.authentication?.accessToken) {
        const token = result.authentication.accessToken;
        await verifyGoogleToken(token);
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const verifyGoogleToken = async (accessToken) => {
    try {
      const response = await api.post('/api/auth/google', { accessToken });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        await socialLogin(user, token);
      } else {
        Alert.alert('Sign In Failed', response.data.message || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google token verification error:', error);
      Alert.alert('Sign In Failed', error.response?.data?.message || 'Failed to sign in with Google');
    }
  };

  const handleAppleLogin = async () => {
    setSocialLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.identityToken) {
        await verifyAppleToken(credential);
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // User cancelled
      } else {
        console.error('Apple login error:', error);
        Alert.alert('Sign In Failed', 'Could not sign in with Apple. Please try again.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const verifyAppleToken = async (credential) => {
    try {
      const response = await api.post('/api/auth/apple', {
        identityToken: credential.identityToken,
        user: credential.user,
        email: credential.email,
        name: credential.fullName,
      });
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        await socialLogin(user, token);
      } else {
        Alert.alert('Sign In Failed', response.data.message || 'Failed to sign in with Apple');
      }
    } catch (error) {
      console.error('Apple token verification error:', error);
      Alert.alert('Sign In Failed', error.response?.data?.message || 'Failed to sign in with Apple');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              
              <View style={styles.heroSection}>
                <Text style={styles.heroTitle}>Welcome Back</Text>
                <Text style={styles.heroSubtitle}>Sign in to book your next appointment.</Text>
              </View>

              <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.labelTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.labelTertiary}
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={theme.labelSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>


            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                <LinearGradient
                  colors={[theme.primary, '#E40E5A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleAppleLogin}
                disabled={socialLoading !== null}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator color={theme.labelPrimary} />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={20} color={theme.labelPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.socialButtonText}>Sign in with Apple</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={socialLoading !== null || !googleRequest}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color={theme.labelPrimary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={theme.labelPrimary} style={{ marginRight: 8 }} /> 
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerText}>
                  Don't have an account? <Text style={styles.footerLink}>Signup</Text>
                </Text>
              </TouchableOpacity>
            </View>



            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.labelPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 17,
    color: theme.labelSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.background,
    padding: theme.spacing.md,
    borderRadius: 14,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.labelSecondary,
    marginBottom: 4,
    marginLeft: 2,
    opacity: 0.6,
  },
  input: {
    backgroundColor: theme.systemGray6,
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 17,
    color: theme.labelPrimary,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    height: 56,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    marginTop: 16,
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.systemGray5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: theme.labelSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
});

export default LoginScreen;
