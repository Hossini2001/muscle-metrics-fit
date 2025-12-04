import { useState, useCallback } from 'react';
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
    acceptAllDevices?: boolean;
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
  txCharacteristic?: BluetoothRemoteGATTCharacteristic;
  rxCharacteristic?: BluetoothRemoteGATTCharacteristic;
  isConnected: boolean;
}

// Nordic UART Service UUIDs (used by Bitalino BLE)
const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write to device
const NORDIC_UART_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Receive from device

export const useBitalino = () => {
  const [device, setDevice] = useState<BitalinoDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestData, setLatestData] = useState<BitalinoData | null>(null);
  const { toast } = useToast();

  const handleDisconnection = useCallback(() => {
    setDevice(null);
    setIsStreaming(false);
    toast({
      title: "Device Disconnected",
      description: "Bitalino device was disconnected",
      variant: "destructive"
    });
  }, [toast]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Use Chrome, Edge, or Opera browser for Bluetooth",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Allow all devices to show in picker for maximum compatibility
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NORDIC_UART_SERVICE]
      });

      bluetoothDevice.addEventListener('gattserverdisconnected', handleDisconnection);

      const server = await bluetoothDevice.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
      const txCharacteristic = await service.getCharacteristic(NORDIC_UART_TX);
      const rxCharacteristic = await service.getCharacteristic(NORDIC_UART_RX);

      const newDevice: BitalinoDevice = {
        device: bluetoothDevice,
        server,
        service,
        txCharacteristic,
        rxCharacteristic,
        isConnected: true
      };

      setDevice(newDevice);
      
      toast({
        title: "Connected",
        description: `Connected to ${bluetoothDevice.name || 'Bitalino device'}`,
      });

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, handleDisconnection]);

  const disconnect = useCallback(async () => {
    if (device?.server) {
      if (isStreaming) {
        await stopStreaming();
      }
      device.server.disconnect();
      setDevice(null);
      toast({
        title: "Disconnected",
        description: "Device disconnected",
      });
    }
  }, [device, isStreaming]);

  const handleDataReceived = useCallback((event: Event) => {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const data = new Uint8Array(value.buffer);
    
    // Parse Bitalino frame format
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

      setLatestData({
        sequence,
        digital,
        analog,
        timestamp: Date.now()
      });
    }
  }, []);

  const startStreaming = useCallback(async (sampleRate: number = 1000, channels: number[] = [0, 1]) => {
    if (!device?.txCharacteristic || !device?.rxCharacteristic) return;

    try {
      await device.txCharacteristic.startNotifications();
      device.txCharacteristic.addEventListener('characteristicvaluechanged', handleDataReceived);

      // Bitalino start command
      const startCommand = new Uint8Array([0x01, sampleRate & 0xFF, (sampleRate >> 8) & 0xFF, channels.length, ...channels]);
      await device.rxCharacteristic.writeValue(startCommand);

      setIsStreaming(true);
      toast({
        title: "Streaming Started",
        description: `Acquiring at ${sampleRate}Hz`,
      });

    } catch (error) {
      console.error('Failed to start streaming:', error);
      toast({
        title: "Streaming Failed",
        description: "Failed to start data acquisition",
        variant: "destructive"
      });
    }
  }, [device, toast, handleDataReceived]);

  const stopStreaming = useCallback(async () => {
    if (!device?.txCharacteristic || !device?.rxCharacteristic) return;

    try {
      const stopCommand = new Uint8Array([0x00]);
      await device.rxCharacteristic.writeValue(stopCommand);

      await device.txCharacteristic.stopNotifications();
      device.txCharacteristic.removeEventListener('characteristicvaluechanged', handleDataReceived);

      setIsStreaming(false);
      toast({
        title: "Streaming Stopped",
        description: "Data acquisition stopped",
      });

    } catch (error) {
      console.error('Failed to stop streaming:', error);
    }
  }, [device, toast, handleDataReceived]);

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
