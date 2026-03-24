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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import theme from '../../constants/theme';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      // Show simple alert or toast
      console.warn("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      // Pass phone if backend supports it, otherwise just name/email/pass/role
      const result = await register(name, email, password, selectedRole); 
      if (!result.success) {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.labelPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Create Account</Text>
              <Text style={styles.heroSubtitle}>Join GlowBook for luxury wellness</Text>
            </View>

            {/* Section 1: Your Information */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Required"
                  placeholderTextColor={theme.labelTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@me.com"
                  placeholderTextColor={theme.labelTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 000-0000"
                  placeholderTextColor={theme.labelTertiary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Section 2: Password */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Required"
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Verify"
                  placeholderTextColor={theme.labelTertiary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Section 3: Role Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>I AM A</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleCard, selectedRole === 'customer' && styles.roleCardActive]}
                  onPress={() => setSelectedRole('customer')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconContainer, selectedRole === 'customer' && styles.roleIconContainerActive]}>
                    <Ionicons name="person" size={24} color={selectedRole === 'customer' ? theme.primary : theme.labelSecondary} />
                  </View>
                  <Text style={[styles.roleTitle, selectedRole === 'customer' && styles.roleTitleActive]}>Customer</Text>
                  <Text style={styles.roleSubtitle}>Book beauty services</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, selectedRole === 'vendor' && styles.roleCardActive]}
                  onPress={() => setSelectedRole('vendor')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconContainer, selectedRole === 'vendor' && styles.roleIconContainerActive]}>
                    <Ionicons name="storefront" size={24} color={selectedRole === 'vendor' ? theme.primary : theme.labelSecondary} />
                  </View>
                  <Text style={[styles.roleTitle, selectedRole === 'vendor' && styles.roleTitleActive]}>Vendor</Text>
                  <Text style={styles.roleSubtitle}>List my salon</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                onPress={handleRegister}
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
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#000000' }]}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>Sign in with Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.separator }]}>
                <Ionicons name="logo-google" size={20} color={theme.labelPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.socialButtonText, { color: theme.labelPrimary }]}>Continue with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Footnote */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to GlowBook's{' '}
                <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
                <Text style={styles.footerLink}>Privacy Policy</Text>.
              </Text>
            </View>

          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.labelPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 17,
    color: theme.labelSecondary,
    opacity: 0.8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.labelSecondary,
    marginBottom: 8,
    marginLeft: 2,
    opacity: 0.6,
  },
  groupedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.separator,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 17,
    color: theme.labelPrimary,
    width: 90,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: theme.labelPrimary,
    paddingHorizontal: 16,
    backgroundColor: '#F3F3F8',
    height: 56,
    borderRadius: 8,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    height: 56,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  actionContainer: {
    gap: 12,
    marginTop: 24,
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: theme.primary,
    backgroundColor: 'rgba(255, 45, 107, 0.05)',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconContainerActive: {
    backgroundColor: 'rgba(255, 45, 107, 0.1)',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.labelPrimary,
    marginBottom: 4,
  },
  roleTitleActive: {
    color: theme.primary,
  },
  roleSubtitle: {
    fontSize: 12,
    color: theme.labelSecondary,
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 0.5,
    backgroundColor: theme.separator,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
    color: theme.labelTertiary,
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.labelSecondary,
    lineHeight: 20,
    opacity: 0.7,
  },
  footerLink: {
    color: theme.primary,
    fontWeight: '500',
  },
});

export default RegisterScreen;
