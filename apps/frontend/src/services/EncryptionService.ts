// Message Encryption Service for Hockey Hub
// Implements end-to-end encryption for direct messages

interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

interface EncryptedMessage {
  encryptedData: string;
  iv: string;
  ephemeralPublicKey?: string;
  signature?: string;
}

interface StoredKeyPair {
  publicKey: string;
  privateKey: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private keyPair: KeyPair | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize encryption service and load/generate key pair
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if we have stored keys
      const storedKeyPair = await this.loadStoredKeyPair();
      
      if (storedKeyPair) {
        this.keyPair = storedKeyPair;
        console.log('Loaded existing encryption keys');
      } else {
        // Generate new key pair
        this.keyPair = await this.generateKeyPair();
        await this.storeKeyPair(this.keyPair);
        console.log('Generated new encryption keys');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  /**
   * Generate a new RSA key pair for encryption
   */
  private async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * Store key pair in secure storage
   */
  private async storeKeyPair(keyPair: KeyPair): Promise<void> {
    try {
      const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const storedKeyPair: StoredKeyPair = {
        publicKey: this.arrayBufferToBase64(publicKeyData),
        privateKey: this.arrayBufferToBase64(privateKeyData),
      };

      // Store in IndexedDB for persistence
      await this.storeInIndexedDB('encryptionKeys', storedKeyPair);
      
      // Also send public key to server
      await this.uploadPublicKey(storedKeyPair.publicKey);
    } catch (error) {
      console.error('Failed to store key pair:', error);
      throw error;
    }
  }

  /**
   * Load stored key pair from secure storage
   */
  private async loadStoredKeyPair(): Promise<KeyPair | null> {
    try {
      const storedKeyPair = await this.getFromIndexedDB('encryptionKeys') as StoredKeyPair;
      
      if (!storedKeyPair) {
        return null;
      }

      const publicKeyData = this.base64ToArrayBuffer(storedKeyPair.publicKey);
      const privateKeyData = this.base64ToArrayBuffer(storedKeyPair.privateKey);

      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );

      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );

      return { publicKey, privateKey };
    } catch (error) {
      console.error('Failed to load stored key pair:', error);
      return null;
    }
  }

  /**
   * Encrypt a message for a specific recipient
   */
  public async encryptMessage(message: string, recipientPublicKey: string): Promise<EncryptedMessage> {
    if (!this.isInitialized || !this.keyPair) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Import recipient's public key
      const recipientKey = await this.importPublicKey(recipientPublicKey);

      // Generate AES key for message encryption
      const aesKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Generate IV for AES encryption
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the message with AES
      const messageData = new TextEncoder().encode(message);
      const encryptedMessage = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        messageData
      );

      // Export AES key and encrypt it with recipient's RSA public key
      const aesKeyData = await window.crypto.subtle.exportKey('raw', aesKey);
      const encryptedAesKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        recipientKey,
        aesKeyData
      );

      // Create final encrypted message structure
      const result: EncryptedMessage = {
        encryptedData: this.arrayBufferToBase64(encryptedMessage),
        iv: this.arrayBufferToBase64(iv),
        ephemeralPublicKey: this.arrayBufferToBase64(encryptedAesKey),
      };

      return result;
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw error;
    }
  }

  /**
   * Decrypt a received message
   */
  public async decryptMessage(encryptedMessage: EncryptedMessage): Promise<string> {
    if (!this.isInitialized || !this.keyPair) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Decrypt the AES key with our RSA private key
      const encryptedAesKeyData = this.base64ToArrayBuffer(encryptedMessage.ephemeralPublicKey!);
      const aesKeyData = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        this.keyPair.privateKey,
        encryptedAesKeyData
      );

      // Import the AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        aesKeyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt the message
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage.encryptedData);
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);

      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encryptedData
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
  }

  /**
   * Get public key for sharing
   */
  public async getPublicKey(): Promise<string> {
    if (!this.isInitialized || !this.keyPair) {
      throw new Error('Encryption service not initialized');
    }

    const publicKeyData = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);
    return this.arrayBufferToBase64(publicKeyData);
  }

  /**
   * Get recipient's public key from server
   */
  public async getRecipientPublicKey(userId: string): Promise<string> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/encryption/public-key/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get recipient public key');
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('Failed to get recipient public key:', error);
      throw error;
    }
  }

  /**
   * Upload public key to server
   */
  private async uploadPublicKey(publicKey: string): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/encryption/public-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ publicKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload public key');
      }
    } catch (error) {
      console.error('Failed to upload public key:', error);
      throw error;
    }
  }

  /**
   * Import public key from base64 string
   */
  private async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const publicKeyData = this.base64ToArrayBuffer(publicKeyBase64);
    
    return await window.crypto.subtle.importKey(
      'spki',
      publicKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );
  }

  /**
   * Check if encryption is supported
   */
  public static isSupported(): boolean {
    return !!(
      window.crypto &&
      window.crypto.subtle &&
      window.crypto.subtle.generateKey &&
      window.crypto.subtle.encrypt &&
      window.crypto.subtle.decrypt
    );
  }

  /**
   * Reset encryption keys (for logout or key rotation)
   */
  public async resetKeys(): Promise<void> {
    try {
      await this.deleteFromIndexedDB('encryptionKeys');
      this.keyPair = null;
      this.isInitialized = false;
      console.log('Encryption keys reset');
    } catch (error) {
      console.error('Failed to reset encryption keys:', error);
    }
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // IndexedDB operations
  private async storeInIndexedDB(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HockeyHubEncryption', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');
        const putRequest = store.put(value, key);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HockeyHubEncryption', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HockeyHubEncryption', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['keys'], 'readwrite');
        const store = transaction.objectStore('keys');
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export default EncryptionService.getInstance();