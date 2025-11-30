import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RTSPPlayer from './src/components/RTSPPlayer';
import { buildTapoRTSPUrl } from './src/utils/rtspHelper';

export default function App() {
  const [cameraConfig, setCameraConfig] = useState({
    ipAddress: '192.168.1.100',
    username: 'admin',
    password: '',
    port: 554,
  });

  const [rtspUrl, setRtspUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    const url = buildTapoRTSPUrl(cameraConfig);
    setRtspUrl(url);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setRtspUrl(null);
    setIsConnected(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {!isConnected ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Camera IP Address"
            value={cameraConfig.ipAddress}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, ipAddress: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={cameraConfig.username}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, username: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={cameraConfig.password}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, password: text })
            }
          />

          <Button title="Connect to Camera" onPress={handleConnect} />
        </View>
      ) : (
        <>
          <RTSPPlayer
            rtspUrl={rtspUrl!}
            autoplay={true}
            onStateChange={(state) => console.log('Player state:', state)}
            onError={(error) => console.error('Player error:', error)}
            style={styles.player}
          />

          <View style={styles.controls}>
            <Button title="Disconnect" onPress={handleDisconnect} color="#ff6b6b" />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  player: {
    flex: 1,
  },
  controls: {
    padding: 20,
  },
});
