import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import theme from '../../constants/theme';

const ProfileScreen = () => {
  const { user, logout, refreshProfile, updateUser } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setEditedName(user.name);
    }
  }, [user?.name]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const uploadProfilePhoto = async (imageAsset) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Append image to form data
      formData.append('profilePhoto', {
        uri: imageAsset.uri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      });

      const response = await api.put('/api/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await refreshProfile();
        setSelectedImage(null);
        return true;
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Failed to upload profile photo');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);

      // Update name
      if (editedName !== user?.name) {
        const response = await api.put('/api/users/profile', {
          name: editedName.trim(),
        });

        if (!response.data.success) {
          throw new Error(response.data.message);
        }
      }

      // Upload photo if selected
      if (selectedImage) {
        const photoUploaded = await uploadProfilePhoto(selectedImage);
        if (!photoUploaded) return;
      }

      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const MenuItem = ({ icon, label, onPress, isLast }) => (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={22} color={theme.primary} />
        </View>
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={theme.systemGray3} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.largeTitle}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: selectedImage?.uri || user?.profilePhoto || 'https://via.placeholder.com/150' }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.editBadge}
              onPress={() => setEditModalVisible(true)}
            >
              <MaterialIcons name="edit" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>VISITS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>REVIEWS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>SAVED</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <MenuItem icon="calendar-today" label="My Bookings" />
          <MenuItem icon="favorite" label="Saved Salons" />
          <MenuItem icon="notifications" label="Notifications" isLast />
        </View>

        <View style={styles.menuSection}>
          <MenuItem icon="help" label="Help" />
          <MenuItem icon="lock" label="Privacy" />
          <MenuItem icon="description" label="Terms" isLast />
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>GlowBook v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isLoading && setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => !isLoading && setEditModalVisible(false)}
              disabled={isLoading}
            >
              <Text style={[styles.modalHeaderButton, isLoading && { opacity: 0.5 }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              onPress={updateProfile}
              disabled={isLoading}
            >
              <Text style={[styles.modalHeaderButton, styles.modalHeaderSave, isLoading && { opacity: 0.5 }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>Profile Photo</Text>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: selectedImage?.uri || user?.profilePhoto || 'https://via.placeholder.com/150' }}
                  style={styles.largeAvatar}
                />
              </View>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={pickImage}
                disabled={isLoading}
              >
                <MaterialIcons name="photo-library" size={20} color={theme.primary} />
                <Text style={styles.changePhotoText}>Choose Photo</Text>
              </TouchableOpacity>
              {selectedImage && (
                <Text style={styles.photoSelectedText}>Photo selected</Text>
              )}
            </View>

            {/* Edit Name Section */}
            <View style={styles.editSection}>
              <Text style={styles.sectionTitle}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={theme.labelTertiary}
                value={editedName}
                onChangeText={setEditedName}
                editable={!isLoading}
                maxLength={50}
              />
              <Text style={styles.charCount}>{editedName.length}/50</Text>
            </View>

            {/* Email Section (Read-only) */}
            <View style={styles.editSection}>
              <Text style={styles.sectionTitle}>Email</Text>
              <View style={styles.input}>
                <Text style={styles.readOnlyText}>{user?.email}</Text>
              </View>
              <Text style={styles.readOnlyHint}>Email cannot be changed</Text>
            </View>

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Updating profile...</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 16,
    backgroundColor: theme.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: theme.labelPrimary,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  profileCard: {
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.systemGray6,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.labelPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.labelSecondary,
    marginBottom: 8,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 45, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.labelPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.labelSecondary,
    letterSpacing: 0.5,
  },
  menuSection: {
    backgroundColor: theme.background,
    borderRadius: 14,
    overflow: 'hidden',
    ...theme.shadows.card,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.systemGray6,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: theme.labelPrimary,
  },
  signOutButton: {
    marginTop: 24,
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.destructive,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.labelTertiary,
    marginTop: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.separator,
    backgroundColor: theme.background,
  },
  modalHeaderButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  modalHeaderSave: {
    color: theme.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.labelPrimary,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.labelPrimary,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  photoContainer: {
    marginBottom: 16,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.systemGray6,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.separator,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  photoSelectedText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.labelSecondary,
    fontStyle: 'italic',
  },
  editSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.labelPrimary,
    borderWidth: 1,
    borderColor: theme.separator,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: theme.labelTertiary,
    textAlign: 'right',
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.labelPrimary,
  },
  readOnlyHint: {
    fontSize: 12,
    color: theme.labelTertiary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.labelSecondary,
  },
});

export default ProfileScreen;
