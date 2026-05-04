import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, StatusBar, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import theme from '../../constants/theme';

const InputRow = ({ label, value, onChangeText, placeholder, multiline = false, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.labelTertiary}
      multiline={multiline}
      {...props}
    />
  </View>
);

const VendorCreateSalonScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [salonData, setSalonData] = useState({
    name: '',
    description: '',
    location: '',
    phoneNumber: '',
    category: 'Hair',
    openingHours: '',
  });

  const handleCreateSalon = async () => {
    if (!salonData.name.trim()) {
      Alert.alert('Missing Information', 'Please enter your salon name.');
      return;
    }
    if (!salonData.description.trim()) {
      Alert.alert('Missing Information', 'Please add a short description of your salon.');
      return;
    }
    if (!salonData.location.trim()) {
      Alert.alert('Missing Information', 'Please enter your salon\'s address or location.');
      return;
    }
    if (!salonData.phoneNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter a contact phone number for your salon.');
      return;
    }
    if (!salonData.openingHours.trim()) {
      Alert.alert('Missing Information', 'Please enter your salon\'s opening hours (e.g. Mon–Sat 9AM–8PM).');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/salons', salonData);

      if (response.data.success) {
        await updateUser({ ownedSalon: response.data.data._id });
      } else {
        Alert.alert('Something Went Wrong', 'We could not create your salon. Please try again.');
      }
    } catch (error) {
      Alert.alert('Something Went Wrong', 'We could not create your salon. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Salon</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <InputRow
            label="Salon Name"
            placeholder="e.g. Glow & Glamour"
            value={salonData.name}
            onChangeText={(text) => setSalonData({ ...salonData, name: text })}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={salonData.category}
                onValueChange={(itemValue) => setSalonData({ ...salonData, category: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="Hair" value="Hair" />
                <Picker.Item label="Nails" value="Nails" />
                <Picker.Item label="Skin" value="Skin" />
                <Picker.Item label="Makeup" value="Makeup" />
                <Picker.Item label="Spa" value="Spa" />
                <Picker.Item label="Waxing" value="Waxing" />
              </Picker>
            </View>
          </View>

          <InputRow
            label="Description"
            placeholder="Tell us about your salon..."
            value={salonData.description}
            onChangeText={(text) => setSalonData({ ...salonData, description: text })}
            multiline
            maxLength={500}
          />

          <InputRow
            label="Location / Address"
            placeholder="123 Beauty Lane, NY"
            value={salonData.location}
            onChangeText={(text) => setSalonData({ ...salonData, location: text })}
          />

          <InputRow
            label="Phone Number"
            placeholder="(555) 123-4567"
            value={salonData.phoneNumber}
            onChangeText={(text) => setSalonData({ ...salonData, phoneNumber: text })}
            keyboardType="phone-pad"
          />

          <InputRow
            label="Opening Hours"
            placeholder="e.g. Mon-Sat 9AM-8PM"
            value={salonData.openingHours}
            onChangeText={(text) => setSalonData({ ...salonData, openingHours: text })}
          />

        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footerAction, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity onPress={handleCreateSalon} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.primary, '#E40E5A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Salon Profile'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 44,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.separator,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.card,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.labelSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.labelPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.primary,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 45, 107, 0.05)',
  },
  imageUploadText: {
    color: theme.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  footerAction: {
    padding: 16,
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.separator,
  },
  submitButton: {
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default VendorCreateSalonScreen;
