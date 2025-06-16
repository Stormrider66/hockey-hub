import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../config/logger';

// Directory where key files will live (relative to project root)
const KEY_DIR = process.env.JWT_KEY_DIR || path.join(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'jwt_private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'jwt_public.pem');

interface KeyPair {
  privateKey: string; // PEM
  publicKey: string;  // PEM
}

function generateKeyPair(): KeyPair {
  logger.warn('Generating new RSA key-pair for JWTs (development mode)');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return { privateKey, publicKey };
}

function ensureKeyFiles(): KeyPair {
  // Production first: allow env vars to override file loading completely
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    return {
      privateKey: process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      publicKey: process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
    };
  }

  // Dev / docker-volume path
  // Ensure key dir exists
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }

  const privateExists = fs.existsSync(PRIVATE_KEY_PATH);
  const publicExists  = fs.existsSync(PUBLIC_KEY_PATH);

  if (privateExists && publicExists) {
    return {
      privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
      publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf8'),
    };
  }

  const { privateKey, publicKey } = generateKeyPair();
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey,  { mode: 0o644 });
  logger.info({ keyDir: KEY_DIR }, 'RSA key-pair generated and saved');
  return { privateKey, publicKey };
}

// Singleton key-pair
const KEYS = ensureKeyFiles();

export const jwtPrivateKey = KEYS.privateKey;
export const jwtPublicKey  = KEYS.publicKey; 