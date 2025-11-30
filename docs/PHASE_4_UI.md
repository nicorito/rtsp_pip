# Phase 4: User Interface Development

**Duration**: 2-3 days
**Complexity**: Medium
**Priority**: High
**Dependencies**: Phases 1, 2, and 3

## Overview

This phase focuses on building a polished, user-friendly interface for the RTSP camera viewer app. The UI will include camera management, connection screens, video playback controls, and settings.

## Learning Objectives

- Design mobile-first user interfaces
- Implement navigation between screens
- Create reusable UI components
- Manage application state effectively
- Implement persistent storage for camera configurations

## Prerequisites

### Completed Requirements
- ✅ Phases 1-3 completed
- ✅ RTSP playback working
- ✅ PiP functionality implemented

### Additional Dependencies

```bash
# Install navigation and state management libraries
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npm install zustand
npm install react-native-vector-icons
```

## Application Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Camera list and quick actions
│   ├── AddCameraScreen.tsx     # Add/edit camera form
│   ├── PlayerScreen.tsx        # Live video playback
│   └── SettingsScreen.tsx      # App settings
├── components/
│   ├── CameraCard.tsx          # Camera list item
│   ├── RTSPPlayer.tsx          # Video player (existing)
│   ├── PiPButton.tsx           # PiP control (existing)
│   ├── ConnectionStatus.tsx    # Connection indicator
│   └── PlayerControls.tsx      # Playback controls
├── store/
│   └── cameraStore.ts          # Zustand store for state
├── utils/
│   ├── rtspHelper.ts           # RTSP utilities (existing)
│   └── storage.ts              # AsyncStorage wrapper
├── types/
│   └── index.ts                # TypeScript types
└── navigation/
    └── AppNavigator.tsx        # Navigation configuration
```

## Step-by-Step Implementation

### Step 1: Define TypeScript Types

Create `src/types/index.ts`:

```typescript
export interface Camera {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  username: string;
  password: string;
  brand: 'tapo' | 'hikvision' | 'dahua' | 'onvif' | 'generic';
  streamPath?: string;
  thumbnail?: string;
  lastConnected?: string;
  favorite?: boolean;
}

export interface AppSettings {
  defaultStreamQuality: 'high' | 'low';
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  hardwareDecoding: boolean;
  showTimestamp: boolean;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
  timestamp?: string;
}
```

### Step 2: Create Storage Utility

Create `src/utils/storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, AppSettings } from '../types';

const CAMERAS_KEY = '@rtsp_cameras';
const SETTINGS_KEY = '@app_settings';

export const storage = {
  // Camera Management
  async getCameras(): Promise<Camera[]> {
    try {
      const data = await AsyncStorage.getItem(CAMERAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load cameras:', error);
      return [];
    }
  },

  async saveCameras(cameras: Camera[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CAMERAS_KEY, JSON.stringify(cameras));
    } catch (error) {
      console.error('Failed to save cameras:', error);
    }
  },

  async addCamera(camera: Camera): Promise<void> {
    const cameras = await this.getCameras();
    cameras.push(camera);
    await this.saveCameras(cameras);
  },

  async updateCamera(id: string, updates: Partial<Camera>): Promise<void> {
    const cameras = await this.getCameras();
    const index = cameras.findIndex((c) => c.id === id);
    if (index !== -1) {
      cameras[index] = { ...cameras[index], ...updates };
      await this.saveCameras(cameras);
    }
  },

  async deleteCamera(id: string): Promise<void> {
    const cameras = await this.getCameras();
    const filtered = cameras.filter((c) => c.id !== id);
    await this.saveCameras(filtered);
  },

  // Settings Management
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data
        ? JSON.parse(data)
        : {
            defaultStreamQuality: 'high',
            autoReconnect: true,
            reconnectAttempts: 3,
            reconnectDelay: 5000,
            hardwareDecoding: true,
            showTimestamp: true,
          };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {
        defaultStreamQuality: 'high',
        autoReconnect: true,
        reconnectAttempts: 3,
        reconnectDelay: 5000,
        hardwareDecoding: true,
        showTimestamp: true,
      };
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
};
```

### Step 3: Create State Management Store

Create `src/store/cameraStore.ts`:

```typescript
import { create } from 'zustand';
import { Camera, AppSettings, ConnectionState } from '../types';
import { storage } from '../utils/storage';

interface CameraStore {
  cameras: Camera[];
  activeCamera: Camera | null;
  connectionState: ConnectionState;
  settings: AppSettings;
  pipActive: boolean;

  // Actions
  loadCameras: () => Promise<void>;
  addCamera: (camera: Camera) => Promise<void>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  setActiveCamera: (camera: Camera | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  setPipActive: (active: boolean) => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameras: [],
  activeCamera: null,
  connectionState: { status: 'disconnected' },
  settings: {
    defaultStreamQuality: 'high',
    autoReconnect: true,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    hardwareDecoding: true,
    showTimestamp: true,
  },
  pipActive: false,

  loadCameras: async () => {
    const cameras = await storage.getCameras();
    set({ cameras });
  },

  addCamera: async (camera) => {
    await storage.addCamera(camera);
    const cameras = await storage.getCameras();
    set({ cameras });
  },

  updateCamera: async (id, updates) => {
    await storage.updateCamera(id, updates);
    const cameras = await storage.getCameras();
    set({ cameras });

    // Update active camera if it's the one being updated
    const { activeCamera } = get();
    if (activeCamera?.id === id) {
      set({ activeCamera: { ...activeCamera, ...updates } });
    }
  },

  deleteCamera: async (id) => {
    await storage.deleteCamera(id);
    const cameras = await storage.getCameras();
    set({ cameras });

    // Clear active camera if it's the one being deleted
    const { activeCamera } = get();
    if (activeCamera?.id === id) {
      set({ activeCamera: null });
    }
  },

  setActiveCamera: (camera) => {
    set({ activeCamera: camera });
  },

  setConnectionState: (state) => {
    set({ connectionState: state });
  },

  loadSettings: async () => {
    const settings = await storage.getSettings();
    set({ settings });
  },

  updateSettings: async (updates) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    await storage.saveSettings(newSettings);
    set({ settings: newSettings });
  },

  setPipActive: (active) => {
    set({ pipActive: active });
  },
}));
```

### Step 4: Set Up Navigation

Create `src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AddCameraScreen from '../screens/AddCameraScreen';
import PlayerScreen from '../screens/PlayerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Camera } from '../types';

export type RootStackParamList = {
  Home: undefined;
  AddCamera: { camera?: Camera; mode: 'add' | 'edit' };
  Player: { camera: Camera };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'My Cameras' }}
        />
        <Stack.Screen
          name="AddCamera"
          component={AddCameraScreen}
          options={({ route }) => ({
            title: route.params.mode === 'edit' ? 'Edit Camera' : 'Add Camera',
          })}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Step 5: Create Home Screen

Create `src/screens/HomeScreen.tsx`:

```typescript
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCameraStore } from '../store/cameraStore';
import CameraCard from '../components/CameraCard';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { cameras, loadCameras, loadSettings } = useCameraStore();

  useEffect(() => {
    loadCameras();
    loadSettings();
  }, []);

  const handleAddCamera = () => {
    navigation.navigate('AddCamera', { mode: 'add' });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cameras</Text>
        <TouchableOpacity onPress={handleSettings}>
          <Text style={styles.settingsButton}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {cameras.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>📷</Text>
          <Text style={styles.emptyTitle}>No Cameras Added</Text>
          <Text style={styles.emptySubtitle}>
            Add your first camera to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={cameras}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CameraCard camera={item} navigation={navigation} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleAddCamera}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    fontSize: 24,
  },
  list: {
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 32,
  },
});
```

### Step 6: Create Camera Card Component

Create `src/components/CameraCard.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Camera } from '../types';
import { useCameraStore } from '../store/cameraStore';

interface CameraCardProps {
  camera: Camera;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

export default function CameraCard({ camera, navigation }: CameraCardProps) {
  const { deleteCamera, updateCamera } = useCameraStore();

  const handleConnect = () => {
    navigation.navigate('Player', { camera });
  };

  const handleEdit = () => {
    navigation.navigate('AddCamera', { camera, mode: 'edit' });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Camera',
      `Are you sure you want to delete "${camera.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCamera(camera.id),
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    updateCamera(camera.id, { favorite: !camera.favorite });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleConnect}>
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{camera.name}</Text>
          <Text style={styles.brand}>{camera.brand.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Text style={styles.favorite}>{camera.favorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.address}>{camera.ipAddress}</Text>

      {camera.lastConnected && (
        <Text style={styles.lastConnected}>
          Last: {new Date(camera.lastConnected).toLocaleString()}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleConnect}>
          <Text style={styles.actionText}>▶️ Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleEdit}
        >
          <Text style={styles.actionText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  favorite: {
    fontSize: 24,
  },
  address: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  lastConnected: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#555',
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
    flex: 0,
    paddingHorizontal: 15,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
```

### Step 7: Create Add/Edit Camera Screen

Create `src/screens/AddCameraScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCameraStore } from '../store/cameraStore';
import { Camera } from '../types';

type AddCameraScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddCamera'>;
  route: RouteProp<RootStackParamList, 'AddCamera'>;
};

export default function AddCameraScreen({
  navigation,
  route,
}: AddCameraScreenProps) {
  const { mode, camera } = route.params;
  const { addCamera, updateCamera } = useCameraStore();

  const [formData, setFormData] = useState<Partial<Camera>>({
    name: camera?.name || '',
    ipAddress: camera?.ipAddress || '',
    port: camera?.port || 554,
    username: camera?.username || 'admin',
    password: camera?.password || '',
    brand: camera?.brand || 'tapo',
    streamPath: camera?.streamPath || '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.ipAddress || !formData.username) {
      alert('Please fill in all required fields');
      return;
    }

    const cameraData: Camera = {
      id: camera?.id || Date.now().toString(),
      name: formData.name,
      ipAddress: formData.ipAddress,
      port: formData.port || 554,
      username: formData.username,
      password: formData.password || '',
      brand: formData.brand || 'tapo',
      streamPath: formData.streamPath,
      favorite: camera?.favorite || false,
      lastConnected: camera?.lastConnected,
    };

    if (mode === 'edit' && camera) {
      await updateCamera(camera.id, cameraData);
    } else {
      await addCamera(cameraData);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Camera Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Living Room Camera"
          placeholderTextColor="#666"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Text style={styles.label}>IP Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.100"
          placeholderTextColor="#666"
          keyboardType="numbers-and-punctuation"
          value={formData.ipAddress}
          onChangeText={(text) => setFormData({ ...formData, ipAddress: text })}
        />

        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          placeholder="554"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={formData.port?.toString()}
          onChangeText={(text) =>
            setFormData({ ...formData, port: parseInt(text) || 554 })
          }
        />

        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          placeholder="admin"
          placeholderTextColor="#666"
          autoCapitalize="none"
          value={formData.username}
          onChangeText={(text) => setFormData({ ...formData, username: text })}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          placeholderTextColor="#666"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
        />

        <Text style={styles.label}>Camera Brand</Text>
        <View style={styles.brandContainer}>
          {(['tapo', 'hikvision', 'dahua', 'onvif', 'generic'] as const).map(
            (brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.brandButton,
                  formData.brand === brand && styles.brandButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, brand })}
              >
                <Text
                  style={[
                    styles.brandText,
                    formData.brand === brand && styles.brandTextActive,
                  ]}
                >
                  {brand.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text style={styles.label}>Custom Stream Path (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="stream1"
          placeholderTextColor="#666"
          value={formData.streamPath}
          onChangeText={(text) =>
            setFormData({ ...formData, streamPath: text })
          }
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {mode === 'edit' ? 'Update Camera' : 'Add Camera'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  brandButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  brandText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  brandTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

This completes the first part of Phase 4. Due to length, the remaining screens (PlayerScreen and SettingsScreen) will continue in the same file...

### Step 8: Create Player Screen

Add to `src/screens/PlayerScreen.tsx`:

```typescript
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import RTSPPlayer, { RTSPPlayerRef } from '../components/RTSPPlayer';
import { usePictureInPicture } from '../hooks/usePictureInPicture';
import { useCameraStore } from '../store/cameraStore';
import { buildRTSPUrl } from '../utils/rtspHelper';

type PlayerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Player'>;
  route: RouteProp<RootStackParamList, 'Player'>;
};

export default function PlayerScreen({ navigation, route }: PlayerScreenProps) {
  const { camera } = route.params;
  const playerRef = useRef<RTSPPlayerRef>(null);
  const { pipStatus, handlePiPStatusChange } = usePictureInPicture();
  const { setActiveCamera, updateCamera, settings } = useCameraStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const rtspUrl = buildRTSPUrl(camera);

  useEffect(() => {
    setActiveCamera(camera);
    updateCamera(camera.id, { lastConnected: new Date().toISOString() });

    return () => {
      setActiveCamera(null);
    };
  }, [camera.id]);

  const handlePiPToggle = async () => {
    if (pipStatus.isActive) {
      await playerRef.current?.stopPictureInPicture();
    } else {
      await playerRef.current?.startPictureInPicture();
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playerTouchable}
        activeOpacity={1}
        onPress={toggleControls}
      >
        <RTSPPlayer
          ref={playerRef}
          rtspUrl={rtspUrl}
          autoplay={true}
          paused={!isPlaying}
          onPiPStatusChange={handlePiPStatusChange}
          style={styles.player}
        />
      </TouchableOpacity>

      {showControls && !pipStatus.isActive && (
        <SafeAreaView style={styles.controlsOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.cameraName}>{camera.name}</Text>
          </View>

          <View style={styles.bottomControls}>
            {pipStatus.isSupported && (
              <TouchableOpacity
                style={styles.pipButton}
                onPress={handlePiPToggle}
                disabled={!pipStatus.isPossible && !pipStatus.isActive}
              >
                <Text style={styles.buttonText}>
                  {pipStatus.isActive ? '⬇️' : '⬆️'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerTouchable: {
    flex: 1,
  },
  player: {
    flex: 1,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cameraName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  bottomControls: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  pipButton: {
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
  },
});
```

### Step 9: Create Settings Screen

Add to `src/screens/SettingsScreen.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useCameraStore } from '../store/cameraStore';

export default function SettingsScreen() {
  const { settings, updateSettings } = useCameraStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Hardware Decoding</Text>
            <Switch
              value={settings.hardwareDecoding}
              onValueChange={(value) =>
                updateSettings({ hardwareDecoding: value })
              }
            />
          </View>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Show Timestamp</Text>
            <Switch
              value={settings.showTimestamp}
              onValueChange={(value) => updateSettings({ showTimestamp: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>Auto Reconnect</Text>
            <Switch
              value={settings.autoReconnect}
              onValueChange={(value) => updateSettings({ autoReconnect: value })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>RTSP PiP Camera Viewer</Text>
          <Text style={styles.aboutText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  aboutText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
});
```

## Testing & Verification

### Success Criteria

- [ ] Navigation works between all screens
- [ ] Can add/edit/delete cameras
- [ ] Camera list persists after app restart
- [ ] Settings save and load correctly
- [ ] Player screen displays video
- [ ] PiP controls work from player
- [ ] UI is responsive and polished

## Next Steps

Proceed to [Phase 5 - Advanced Features](./PHASE_5_ADVANCED.md)

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 5 - Advanced Features](./PHASE_5_ADVANCED.md)
**Previous Phase**: [Phase 3 - PiP Implementation](./PHASE_3_PIP.md)
**Last Updated**: 2025-11-30
