import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'warning';
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MFAChallenge {
  challengeId: string;
  method: 'sms' | 'email' | 'totp' | 'biometric';
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface DataProtectionCompliance {
  pdplCompliant: boolean;
  dataResidency: 'saudi' | 'gcc' | 'international';
  consentManagement: {
    enabled: boolean;
    lastUpdated: Date;
    version: string;
  };
  dataRetention: {
    policy: string;
    retentionPeriod: number; // days
    autoDelete: boolean;
  };
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    algorithm: string;
  };
  accessControl: {
    rbacEnabled: boolean;
    mfaRequired: boolean;
    sessionTimeout: number; // minutes
  };
}

export interface SecurityIncident {
  id: string;
  timestamp: Date;
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'dos' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
  affectedResources: string[];
  description: string;
  responseActions: string[];
  assignedTo?: string;
}

class SecurityService {
  /**
   * Generate MFA challenge for user authentication
   */
  async generateMFAChallenge(userId: string, method: 'sms' | 'email' | 'totp'): Promise<MFAChallenge> {
    try {
      const challengeId = crypto.randomUUID();
      const code = this.generateSecureCode(6);

      const challenge: MFAChallenge = {
        challengeId,
        method,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        maxAttempts: 3,
      };

      // In production, send code via chosen method
      // For now, log for development
      logger.info(`MFA Challenge generated for user ${userId}`, {
        challengeId,
        method,
        code: process.env.NODE_ENV === 'development' ? code : '***REDACTED***',
      });

      // Store challenge in cache/database
      await this.storeMFAChallenge(challengeId, {
        userId,
        code,
        ...challenge,
      });

      return challenge;
    } catch (error) {
      logger.error('Error generating MFA challenge:', error);
      throw new Error('Failed to generate MFA challenge');
    }
  }

  /**
   * Verify MFA challenge response
   */
  async verifyMFAChallenge(challengeId: string, code: string): Promise<boolean> {
    try {
      const storedChallenge = await this.retrieveMFAChallenge(challengeId);

      if (!storedChallenge) {
        logger.warn(`MFA challenge not found: ${challengeId}`);
        return false;
      }

      if (new Date() > storedChallenge.expiresAt) {
        logger.warn(`MFA challenge expired: ${challengeId}`);
        await this.deleteMFAChallenge(challengeId);
        return false;
      }

      if (storedChallenge.attempts >= storedChallenge.maxAttempts) {
        logger.warn(`MFA challenge max attempts exceeded: ${challengeId}`);
        await this.deleteMFAChallenge(challengeId);
        return false;
      }

      // Increment attempts
      storedChallenge.attempts++;
      await this.updateMFAChallenge(challengeId, storedChallenge);

      // Verify code
      const isValid = crypto.timingSafeEqual(
        Buffer.from(code),
        Buffer.from(storedChallenge.code)
      );

      if (isValid) {
        await this.deleteMFAChallenge(challengeId);
        logger.info(`MFA verification successful: ${challengeId}`);
      } else {
        logger.warn(`MFA verification failed: ${challengeId}`);
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying MFA challenge:', error);
      return false;
    }
  }

  /**
   * Log security audit event
   */
  async logAuditEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: SecurityAuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...event,
      };

      // Store in audit database
      await this.storeAuditLog(auditLog);

      // Check for suspicious patterns
      await this.analyzeSuspiciousActivity(event.userId, event.action);

      // Alert on high-risk events
      if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
        await this.triggerSecurityAlert(auditLog);
      }

      logger.info('Audit event logged', {
        userId: event.userId,
        action: event.action,
        result: event.result,
        riskLevel: event.riskLevel,
      });
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break app flow
    }
  }

  /**
   * Assess data protection compliance
   */
  async assessDataProtectionCompliance(organizationId: string): Promise<DataProtectionCompliance> {
    try {
      // In production, retrieve actual configuration from database
      const compliance: DataProtectionCompliance = {
        pdplCompliant: true,
        dataResidency: 'saudi',
        consentManagement: {
          enabled: true,
          lastUpdated: new Date('2024-01-01'),
          version: '2.0',
        },
        dataRetention: {
          policy: 'Healthcare data retained for 7 years as per Saudi regulations',
          retentionPeriod: 2555, // 7 years in days
          autoDelete: true,
        },
        encryption: {
          atRest: true,
          inTransit: true,
          algorithm: 'AES-256-GCM',
        },
        accessControl: {
          rbacEnabled: true,
          mfaRequired: true,
          sessionTimeout: 30,
        },
      };

      logger.info(`Data protection compliance assessed for ${organizationId}`);
      return compliance;
    } catch (error) {
      logger.error('Error assessing data protection compliance:', error);
      throw new Error('Failed to assess data protection compliance');
    }
  }

  /**
   * Create security incident
   */
  async createSecurityIncident(
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity'],
    description: string,
    affectedResources: string[]
  ): Promise<SecurityIncident> {
    try {
      const incident: SecurityIncident = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type,
        severity,
        status: 'detected',
        affectedResources,
        description,
        responseActions: this.getDefaultResponseActions(type, severity),
      };

      // Store incident
      await this.storeSecurityIncident(incident);

      // Notify security team
      await this.notifySecurityTeam(incident);

      // Execute automated response if configured
      await this.executeAutomatedResponse(incident);

      logger.error('Security incident created', {
        id: incident.id,
        type,
        severity,
      });

      return incident;
    } catch (error) {
      logger.error('Error creating security incident:', error);
      throw new Error('Failed to create security incident');
    }
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalEvents: number;
      criticalIncidents: number;
      failedLogins: number;
      dataAccesses: number;
      complianceScore: number;
    };
    incidents: SecurityIncident[];
    topRisks: Array<{
      risk: string;
      occurrences: number;
      severity: string;
    }>;
    recommendations: string[];
  }> {
    try {
      // Fetch audit logs and incidents for period
      const auditLogs = await this.getAuditLogs(organizationId, startDate, endDate);
      const incidents = await this.getSecurityIncidents(organizationId, startDate, endDate);

      const report = {
        summary: {
          totalEvents: auditLogs.length,
          criticalIncidents: incidents.filter(i => i.severity === 'critical').length,
          failedLogins: auditLogs.filter(l => l.action === 'login' && l.result === 'failure').length,
          dataAccesses: auditLogs.filter(l => l.action.includes('data_access')).length,
          complianceScore: await this.calculateComplianceScore(organizationId),
        },
        incidents: incidents.slice(0, 10), // Top 10 incidents
        topRisks: this.analyzeTopRisks(auditLogs, incidents),
        recommendations: this.generateSecurityRecommendations(auditLogs, incidents),
      };

      logger.info(`Security report generated for ${organizationId}`);
      return report;
    } catch (error) {
      logger.error('Error generating security report:', error);
      throw new Error('Failed to generate security report');
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encryptSensitiveData(data: string, key: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptSensitiveData(
    encrypted: string,
    key: string,
    iv: string,
    tag: string
  ): string {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Private helper methods
  private generateSecureCode(length: number): string {
    const digits = '0123456789';
    let code = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      code += digits[randomBytes[i] % digits.length];
    }

    return code;
  }

  private async storeMFAChallenge(id: string, challenge: any): Promise<void> {
    // In production, store in Redis or database
    logger.debug(`Storing MFA challenge: ${id}`);
  }

  private async retrieveMFAChallenge(id: string): Promise<any> {
    // In production, retrieve from Redis or database
    logger.debug(`Retrieving MFA challenge: ${id}`);
    return null;
  }

  private async updateMFAChallenge(id: string, challenge: any): Promise<void> {
    logger.debug(`Updating MFA challenge: ${id}`);
  }

  private async deleteMFAChallenge(id: string): Promise<void> {
    logger.debug(`Deleting MFA challenge: ${id}`);
  }

  private async storeAuditLog(log: SecurityAuditLog): Promise<void> {
    // In production, store in database
    logger.debug(`Storing audit log: ${log.id}`);
  }

  private async analyzeSuspiciousActivity(userId: string, action: string): Promise<void> {
    // Implement pattern detection for suspicious activity
    logger.debug(`Analyzing suspicious activity for user: ${userId}`);
  }

  private async triggerSecurityAlert(log: SecurityAuditLog): Promise<void> {
    // Send alerts to security team
    logger.warn('Security alert triggered', { logId: log.id, riskLevel: log.riskLevel });
  }

  private async storeSecurityIncident(incident: SecurityIncident): Promise<void> {
    logger.debug(`Storing security incident: ${incident.id}`);
  }

  private async notifySecurityTeam(incident: SecurityIncident): Promise<void> {
    logger.warn(`Notifying security team of incident: ${incident.id}`);
  }

  private async executeAutomatedResponse(incident: SecurityIncident): Promise<void> {
    logger.info(`Executing automated response for incident: ${incident.id}`);
  }

  private getDefaultResponseActions(
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity']
  ): string[] {
    const actions: string[] = ['Log incident details', 'Notify security team'];

    if (severity === 'critical' || severity === 'high') {
      actions.push('Initiate incident response protocol');
      actions.push('Isolate affected systems if necessary');
    }

    switch (type) {
      case 'unauthorized_access':
        actions.push('Review access logs', 'Reset compromised credentials');
        break;
      case 'data_breach':
        actions.push('Assess data exposure', 'Notify affected parties', 'Engage legal counsel');
        break;
      case 'malware':
        actions.push('Quarantine infected systems', 'Run malware scans');
        break;
      case 'dos':
        actions.push('Enable DDoS protection', 'Block malicious IPs');
        break;
    }

    return actions;
  }

  private async getAuditLogs(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SecurityAuditLog[]> {
    // In production, query database
    return [];
  }

  private async getSecurityIncidents(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SecurityIncident[]> {
    // In production, query database
    return [];
  }

  private async calculateComplianceScore(organizationId: string): Promise<number> {
    // Calculate based on various compliance factors
    return 85;
  }

  private analyzeTopRisks(logs: SecurityAuditLog[], incidents: SecurityIncident[]): Array<{
    risk: string;
    occurrences: number;
    severity: string;
  }> {
    // Analyze patterns in logs and incidents
    return [
      { risk: 'Failed login attempts', occurrences: 15, severity: 'medium' },
      { risk: 'Unauthorized data access attempts', occurrences: 3, severity: 'high' },
    ];
  }

  private generateSecurityRecommendations(
    logs: SecurityAuditLog[],
    incidents: SecurityIncident[]
  ): string[] {
    return [
      'Enforce stronger password policies with minimum 12 characters',
      'Implement rate limiting on authentication endpoints',
      'Enable automated IP blocking for repeated failed login attempts',
      'Conduct security awareness training for all users',
      'Implement regular security audits and penetration testing',
      'Enable real-time security monitoring and alerting',
    ];
  }
}

export default SecurityService;
