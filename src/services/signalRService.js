import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.listeners = {
      stationStatus: [],
      slotStatus: [],
      alert: [],
      stationUpdate: [],
      chargingUpdate: []  // 🔥 Thêm listener cho charging updates
    };
  }

  async connect() {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/hubs/station-monitoring', {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register all event listeners
    this.connection.on('ReceiveStationStatus', (data) => {
      console.log('📡 SignalR: Received station status:', data);
      this.listeners.stationStatus.forEach(callback => callback(data));
    });

    this.connection.on('ReceiveSlotStatus', (data) => {
      console.log('📡 SignalR: Received slot status:', data);
      this.listeners.slotStatus.forEach(callback => callback(data));
    });

    this.connection.on('ReceiveAlert', (data) => {
      console.log('📡 SignalR: Received alert:', data);
      this.listeners.alert.forEach(callback => callback(data));
    });

    this.connection.on('ReceiveStationUpdate', (data) => {
      console.log('📡 SignalR: Received station update:', data);
      this.listeners.stationUpdate.forEach(callback => callback(data));
    });

    // 🔥 Thêm listener cho charging updates (từ Customer)
    this.connection.on('ReceiveChargingUpdate', (data) => {
      console.log('🔌 SignalR: Received charging update:', data);
      console.log('  → Event:', data.EventType);
      console.log('  → Booking:', data.BookingId);
      console.log('  → Connector:', data.ConnectorCode);
      console.log('  → Status:', data.Status);
      this.listeners.chargingUpdate.forEach(callback => callback(data));
    });

    // Handle reconnection
    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting...', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
    });

    this.connection.onclose((error) => {
      console.error('SignalR connection closed', error);
    });

    try {
      await this.connection.start();
      console.log('SignalR connected successfully');
    } catch (error) {
      console.error('Error connecting to SignalR:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR disconnected');
    }
  }

  // Subscribe to station updates
  async subscribeToStation(stationId) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('SubscribeToStation', stationId);
      console.log(`Subscribed to station ${stationId}`);
    }
  }

  // Unsubscribe from station updates
  async unsubscribeFromStation(stationId) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('UnsubscribeFromStation', stationId);
      console.log(`Unsubscribed from station ${stationId}`);
    }
  }

  // Add event listeners
  onStationStatus(callback) {
    this.listeners.stationStatus.push(callback);
    return () => {
      this.listeners.stationStatus = this.listeners.stationStatus.filter(cb => cb !== callback);
    };
  }

  onSlotStatus(callback) {
    this.listeners.slotStatus.push(callback);
    return () => {
      this.listeners.slotStatus = this.listeners.slotStatus.filter(cb => cb !== callback);
  onStationUpdate(callback) {
    this.listeners.stationUpdate.push(callback);
    return () => {
      this.listeners.stationUpdate = this.listeners.stationUpdate.filter(cb => cb !== callback);
    };
  }

  // 🔥 Thêm method để lắng nghe charging updates
  onChargingUpdate(callback) {
    this.listeners.chargingUpdate.push(callback);
    return () => {
      this.listeners.chargingUpdate = this.listeners.chargingUpdate.filter(cb => cb !== callback);
    };
  }

  isConnected() {
  }

  onStationUpdate(callback) {
    this.listeners.stationUpdate.push(callback);
    return () => {
      this.listeners.stationUpdate = this.listeners.stationUpdate.filter(cb => cb !== callback);
    };
  }

  isConnected() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();

export default signalRService;
