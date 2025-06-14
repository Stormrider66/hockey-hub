import { Router } from 'express';
import { jwtPublicKey } from '../utils/keyManager';
import { importSPKI, exportJWK, JWK } from 'jose';
import logger from '../config/logger';

const jwksRouter: Router = Router();

let jwkCache: { keys: JWK[] } | null = null;

jwksRouter.get('/', async (_req, res) => {
  try {
    if (!jwkCache) {
      const key = await importSPKI(jwtPublicKey, 'RS256');
      const jwk = await exportJWK(key);
      jwk.use = 'sig';
      jwk.alg = 'RS256';
      jwk.kid = 'user-service-rsa';
      jwkCache = { keys: [jwk] };
    }
    res.json(jwkCache);
  } catch (err) {
    logger.error({ err }, 'Failed to produce JWKS');
    res.status(500).json({ error: 'Unable to provide JWKS' });
  }
});

export default jwksRouter; 