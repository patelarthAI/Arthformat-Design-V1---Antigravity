import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  collection, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where
} from 'firebase/firestore';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Define the core server secret token used for secure Attribute-Based Access Control (ABAC) in security rules
const SYSTEM_SECRET = 'SERVER_SECRET_ee62ff41-5153-437f-b485-66227c47d53d';

import firebaseConfig from '../firebase-applet-config';

export const isFirebaseConfigured = () => {
  return !!(firebaseConfig && firebaseConfig.projectId);
};

// Initialize Web Firebase App on the Server
let app: any;
let firestoreInstance: any;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Server] Initialized Web client SDK instance on Node server backend.");
  } else {
    app = getApps()[0];
  }
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log(`[Firebase Server] Initialized Firestore Instance for DB: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
} catch (e: any) {
  console.error("[Firebase Server] Failed to initialize Firebase/Firestore:", e.message);
}

// Shim to mimic firebase-admin API using the standard client SDK
class DocRef {
  private colName: string;
  private docId: string;

  constructor(colName: string, docId?: string) {
    this.colName = colName;
    this.docId = docId || crypto.randomUUID();
  }

  get id() {
    return this.docId;
  }

  async set(data: any) {
    if (!firestoreInstance) throw new Error("Firestore is not initialized");
    const dRef = doc(firestoreInstance, this.colName, this.docId);
    // Automatically inject system_secret to align with secure Firestore rules
    await setDoc(dRef, { 
      ...data, 
      system_secret: SYSTEM_SECRET 
    });
  }

  async update(data: any) {
    if (!firestoreInstance) throw new Error("Firestore is not initialized");
    const dRef = doc(firestoreInstance, this.colName, this.docId);
    // Explicitly update while preserving or enforcing the secret key validation
    await updateDoc(dRef, { 
      ...data, 
      system_secret: SYSTEM_SECRET 
    });
  }

  async get() {
    if (!firestoreInstance) throw new Error("Firestore is not initialized");
    const dRef = doc(firestoreInstance, this.colName, this.docId);
    const snap = await getDoc(dRef);
    return {
      id: snap.id,
      exists: snap.exists(),
      data: () => snap.data()
    };
  }

  async delete() {
    if (!firestoreInstance) throw new Error("Firestore is not initialized");
    const dRef = doc(firestoreInstance, this.colName, this.docId);
    await deleteDoc(dRef);
  }
}

class QueryBuilder {
  private colName: string;
  private conditions: any[] = [];

  constructor(colName: string) {
    this.colName = colName;
  }

  where(field: string, op: any, value: any) {
    this.conditions.push(where(field, op, value));
    return this;
  }

  doc(docId?: string) {
    return new DocRef(this.colName, docId);
  }

  async get() {
    if (!firestoreInstance) throw new Error("Firestore is not initialized");
    const colRef = collection(firestoreInstance, this.colName);
    // Ensure the system_secret validation is passed by explicitly appending the filter
    const securityQuery = query(colRef, where('system_secret', '==', SYSTEM_SECRET), ...this.conditions);
    const snap = await getDocs(securityQuery);
    return {
      docs: snap.docs.map(d => ({
        id: d.id,
        data: () => d.data()
      }))
    };
  }
}

class CollectionBuilder {
  collection(collectionName: string) {
    return new QueryBuilder(collectionName);
  }
}

export const db = new CollectionBuilder();
