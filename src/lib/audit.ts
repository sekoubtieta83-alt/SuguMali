'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export type AuditAction = 
  | 'LOGIN' | 'SIGNUP' | 'PROMOTE_ANNONCE' | 'REPORT_ANNONCE' | 'DELETE_ANNONCE' 
  | 'VERIFY_USER' | 'DEVERIFY_USER' | 'BAN_USER' | 'REHABILITATE_USER'
  | 'APPROVE_ANNONCE' | 'REJECT_ANNONCE' | 'SHADOW_ANNONCE'
  | 'REQUEST_MANUAL_REVIEW' | 'AUTO_MODERATION'
  | 'SUBMIT_ID_VERIFICATION' | 'APPROVE_ID_VERIFICATION' 
  | 'REJECT_ID_VERIFICATION' | 'PAY_VERIFICATION' | 'DELETE_REVIEW';

export const logActivity = (
  db: Firestore | null,
  data: {
    action: AuditAction;
    userId: string;
    userName: string;
    targetId?: string;
    targetName?: string;
    details?: string;
  }
) => {
  if (!db) return;

  const logsRef = collection(db, 'auditLogs');
  const logData = {
    ...data,
    timestamp: serverTimestamp(),
  };

  addDoc(logsRef, logData).catch(async (serverError: any) => {
    const permissionError = new FirestorePermissionError({
      path: logsRef.path,
      operation: 'create',
      requestResourceData: logData,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
};