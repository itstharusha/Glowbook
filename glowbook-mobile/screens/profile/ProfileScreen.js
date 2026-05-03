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

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import theme from '../../constants/theme';

const InitialsAvatar = ({ name, uri, size, style }) => {
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
  }
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ color: '#fff', fontSize: size * 0.36, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ completed: 0, upcoming: 0 });

  useEffect(() => {
    refreshProfile();
    if (user?.role === 'customer' || user?.role === 'user') {
      api.get('/api/appointments/my')
        .then(res => {
          const apts = res.data.data || [];
          setStats({
            completed: apts.filter(a => a.status === 'Completed').length,
            upcoming: apts.filter(a => ['Pending', 'Confirmed'].includes(a.status)).length,
          });
        })
        .catch(() => {});
    }
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
            <InitialsAvatar
              name={user?.name}
              uri={selectedImage?.uri || user?.profilePhoto}
              size={80}
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

        {/* Stats Row — customer only */}
        {(user?.role === 'customer' || user?.role === 'user') && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>VISITS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.upcoming}</Text>
              <Text style={styles.statLabel}>UPCOMING</Text>
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {(user?.role === 'customer' || user?.role === 'user') && (
          <View style={styles.menuSection}>
            <MenuItem
              icon="calendar-today"
              label="My Bookings"
              onPress={() => navigation.navigate('Bookings')}
              isLast
            />
          </View>
        )}

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
        animationType="slide"
        onRequestClose={() => !isLoading && setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />

          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
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
                <InitialsAvatar
                  name={user?.name}
                  uri={selectedImage?.uri || user?.profilePhoto}
                  size={120}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
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
