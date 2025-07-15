import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
  
  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }
  
  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }
  
  interface BluetoothLEScanFilter {
    name?: string;
    namePrefix?: string;
    services?: BluetoothServiceUUID[];
  }
  
  type BluetoothServiceUUID = string;
  
  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
  
  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }
  
  interface BluetoothRemoteGATTService {
    device: BluetoothDevice;
    uuid: string;
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }
  
  interface BluetoothRemoteGATTCharacteristic {
    service: BluetoothRemoteGATTService;
    uuid: string;
    value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    writeValue(value: BufferSource): Promise<void>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

export interface BitalinoData {
  sequence: number;
  digital: number[];
  analog: number[];
  timestamp: number;
}

export interface BitalinoDevice {
  device: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  service?: BluetoothRemoteGATTService;
  characteristic?: BluetoothRemoteGATTCharacteristic;
  isConnected: boolean;
}

const BITALINO_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const BITALINO_RX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const BITALINO_TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

export const useBitalino = () => {
  const [device, setDevice] = useState<BitalinoDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestData, setLatestData] = useState<BitalinoData | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Web Bluetooth is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [
          { name: 'BITalino' },
          { namePrefix: 'BITalino' },
          { services: [BITALINO_SERVICE_UUID] }
        ],
        optionalServices: [BITALINO_SERVICE_UUID]
      });

      bluetoothDevice.addEventListener('gattserverdisconnected', handleDisconnection);

      const server = await bluetoothDevice.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService(BITALINO_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(BITALINO_TX_CHARACTERISTIC_UUID);

      const newDevice: BitalinoDevice = {
        device: bluetoothDevice,
        server,
        service,
        characteristic,
        isConnected: true
      };

      setDevice(newDevice);
      
      toast({
        title: "Connected to Bitalino",
        description: `Connected to ${bluetoothDevice.name || 'Bitalino device'}`,
      });

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Bitalino device",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    if (device?.server) {
      await stopStreaming();
      device.server.disconnect();
      setDevice(null);
      toast({
        title: "Disconnected",
        description: "Disconnected from Bitalino device",
      });
    }
  }, [device]);

  const handleDisconnection = useCallback(() => {
    setDevice(null);
    setIsStreaming(false);
    toast({
      title: "Device Disconnected",
      description: "Bitalino device was disconnected",
      variant: "destructive"
    });
  }, [toast]);

  const startStreaming = useCallback(async (sampleRate: number = 1000, channels: number[] = [0, 1]) => {
    if (!device?.characteristic) return;

    try {
      // Start notifications
      await device.characteristic.startNotifications();
      device.characteristic.addEventListener('characteristicvaluechanged', handleDataReceived);

      // Send start command to Bitalino
      const startCommand = new Uint8Array([0x01, sampleRate & 0xFF, (sampleRate >> 8) & 0xFF, channels.length, ...channels]);
      
      const rxCharacteristic = await device.service?.getCharacteristic(BITALINO_RX_CHARACTERISTIC_UUID);
      if (rxCharacteristic) {
        await rxCharacteristic.writeValue(startCommand);
      }

      setIsStreaming(true);
      toast({
        title: "Streaming Started",
        description: `Acquiring data at ${sampleRate}Hz`,
      });

    } catch (error) {
      console.error('Failed to start streaming:', error);
      toast({
        title: "Streaming Failed",
        description: "Failed to start data acquisition",
        variant: "destructive"
      });
    }
  }, [device, toast]);

  const stopStreaming = useCallback(async () => {
    if (!device?.characteristic) return;

    try {
      // Send stop command
      const stopCommand = new Uint8Array([0x00]);
      const rxCharacteristic = await device.service?.getCharacteristic(BITALINO_RX_CHARACTERISTIC_UUID);
      if (rxCharacteristic) {
        await rxCharacteristic.writeValue(stopCommand);
      }

      // Stop notifications
      await device.characteristic.stopNotifications();
      device.characteristic.removeEventListener('characteristicvaluechanged', handleDataReceived);

      setIsStreaming(false);
      toast({
        title: "Streaming Stopped",
        description: "Data acquisition stopped",
      });

    } catch (error) {
      console.error('Failed to stop streaming:', error);
    }
  }, [device, toast]);

  const handleDataReceived = useCallback((event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    // Parse Bitalino data packet
    const data = new Uint8Array(value.buffer);
    
    // Bitalino frame format: [sequence(4bits) + digital(4bits), analog0(10bits), analog1(10bits), ...]
    if (data.length >= 2) {
      const sequence = data[0] >> 4;
      const digital = [(data[0] & 0x0F)];
      
      const analog: number[] = [];
      for (let i = 1; i < data.length - 1; i += 2) {
        if (i + 1 < data.length) {
          const analogValue = (data[i] << 8) | data[i + 1];
          analog.push(analogValue);
        }
      }

      const bitalinoData: BitalinoData = {
        sequence,
        digital,
        analog,
        timestamp: Date.now()
      };

      setLatestData(bitalinoData);
    }
  }, []);

  return {
    device,
    isConnecting,
    isStreaming,
    latestData,
    connect,
    disconnect,
    startStreaming,
    stopStreaming
  };
};