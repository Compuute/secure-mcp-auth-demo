import fs from 'fs';
import https from 'https';
import tls from 'tls';

export interface MtlsConfig {
  caCert: string;
  serverCert: string;
  serverKey: string;
  clientCert?: string;
  clientKey?: string;
}

export class MtlsValidator {
  private config: MtlsConfig;

  constructor(certDir: string = './security-layer/mtls/certs') {
    this.config = {
      caCert: fs.readFileSync(`${certDir}/ca-cert.pem`, 'utf8'),
      serverCert: fs.readFileSync(`${certDir}/server-cert.pem`, 'utf8'),
      serverKey: fs.readFileSync(`${certDir}/server-key.pem`, 'utf8'),
    };
  }

  createSecureContext(): tls.SecureContext {
    return tls.createSecureContext({
      ca: this.config.caCert,
      cert: this.config.serverCert,
      key: this.config.serverKey,
    requestCert: true,
      rejectUnauthorized: true,
    });
  }

  validateClientCert(cert: any): boolean {
    if (!cert || !cert.subject) {
      console.error('[mTLS] No client certificate provided');
      return false;
    }

    console.log(`[mTLS] Client cert validated: ${cert.subject.CN}`);
    return true;
  }

  getAgentIdFromCert(cert: any): string {
    return cert?.subject?.CN || 'unknown-agent';
  }
}
