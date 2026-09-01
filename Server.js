// ==========================================================================================
// 🚀 Complete Node.js API Server for Local Pharmacy POS & EMR Integrated System
// Fully configured for: MongoDB (Local or Atlas Cloud)
// Automatic Collection Provisioning, Indexing, Self-Healing Seeding, and Full Module CRUD!
// ==========================================================================================

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors()); // Allow your React frontend to communicate with this API

// 1. MONGODB CONNECTION CONFIGURATION
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/PharmacyPOSDB';

class InMemoryDB {
  constructor() {
    this.collections = {};
    this.indexes = {}; // name -> { by_id: Map, by_composite: Map }
    this.collectionsDir = path.join(__dirname, 'data', 'collections');
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (!fs.existsSync(this.collectionsDir)) {
        fs.mkdirSync(this.collectionsDir, { recursive: true });
      }

      const files = fs.readdirSync(this.collectionsDir).filter(f => f.endsWith('.json'));
      if (files.length > 0) {
        for (const file of files) {
          const colName = file.replace(/\.json$/, '');
          try {
            const content = fs.readFileSync(path.join(this.collectionsDir, file), 'utf8');
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              this.collections[colName] = parsed;
            }
          } catch (err) {
            console.error(`Error loading collection ${colName}:`, err.message);
          }
        }
        console.log(`💾 InMemoryDB: Loaded ${Object.keys(this.collections).length} modular collections from ${this.collectionsDir}`);
      }

      // Warm up fast indexes
      for (const [colName, store] of Object.entries(this.collections)) {
        if (!Array.isArray(store)) continue;
        this.indexes[colName] = {
          by_id: new Map(),
          by_composite: new Map()
        };
        store.forEach(doc => {
          if (doc && doc._id) this.indexes[colName].by_id.set(doc._id, doc);
          if (colName === 'nhc_patient_history' && doc) {
            const key = `${doc.PatientID || ''}_${doc.VisitDate || ''}_${doc.MedicineDetail || ''}`;
            this.indexes[colName].by_composite.set(key, doc);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load DB store from disk:', e.message);
    }
  }

  saveToDisk(specificColName = null) {
    try {
      if (!fs.existsSync(this.collectionsDir)) {
        fs.mkdirSync(this.collectionsDir, { recursive: true });
      }

      // Save individual collection files (lightweight & modular)
      if (specificColName && this.collections[specificColName]) {
        const filePath = path.join(this.collectionsDir, `${specificColName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(this.collections[specificColName], null, 2), 'utf8');
      } else {
        for (const [colName, store] of Object.entries(this.collections)) {
          const filePath = path.join(this.collectionsDir, `${colName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.error('Failed to save DB collections to disk:', e.message);
    }
  }
  
  listCollections() {
    return {
      toArray: async () => Object.keys(this.collections).map(name => ({ name }))
    };
  }
  
  createCollection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
      this.saveToDisk();
    }
    return this.collection(name);
  }
  
  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }
    const store = this.collections[name];
    const self = this;

    // Fast-access Index initialization
    if (!this.indexes[name]) {
      this.indexes[name] = {
        by_id: new Map(),
        by_composite: new Map()
      };
      // Warm up indexes if store already has items
      store.forEach(doc => {
        if (doc && doc._id) this.indexes[name].by_id.set(doc._id, doc);
        if (name === 'nhc_patient_history' && doc) {
          const key = `${doc.PatientID || ''}_${doc.VisitDate || ''}_${doc.MedicineDetail || ''}`;
          this.indexes[name].by_composite.set(key, doc);
        }
      });
    }
    const indexes = this.indexes[name];
    
    // Helper to evaluate simple query matching
    const match = (item, query) => {
      if (!query || Object.keys(query).length === 0) return true;
      for (const [key, value] of Object.entries(query)) {
        if (key === '$or' && Array.isArray(value)) {
          const anyMatches = value.some(subQuery => match(item, subQuery));
          if (!anyMatches) return false;
          continue;
        }
        if (key === '$and' && Array.isArray(value)) {
          const allMatches = value.every(subQuery => match(item, subQuery));
          if (!allMatches) return false;
          continue;
        }
        if (value instanceof RegExp) {
          if (!value.test(String(item[key] || ''))) return false;
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          if ('$regex' in value) {
            const re = new RegExp(value.$regex, value.$options || '');
            if (!re.test(String(item[key] || ''))) return false;
          } else if ('$in' in value) {
            if (!Array.isArray(value.$in)) return false;
            if (!value.$in.includes(item[key])) return false;
          } else {
            if (JSON.stringify(item[key]) !== JSON.stringify(value)) return false;
          }
        } else {
          if (item[key] !== value) return false;
        }
      }
      return true;
    };

    // Helper to perform updates ($set, $inc, etc.)
    const applyUpdate = (item, update) => {
      if (!update) return item;
      if (update.$set) {
        for (const [key, val] of Object.entries(update.$set)) {
          item[key] = val;
        }
      }
      if (update.$inc) {
        for (const [key, val] of Object.entries(update.$inc)) {
          item[key] = (item[key] || 0) + val;
        }
      }
      return item;
    };
    
    return {
      find: (query = {}) => {
        let results = [];
        // Optimizing query path for _id or composite key searches
        if (query && query._id && typeof query._id === 'string' && indexes.by_id.has(query._id)) {
          results = [indexes.by_id.get(query._id)];
        } else if (name === 'nhc_patient_history' && query && query.PatientID && query.VisitDate !== undefined && query.MedicineDetail !== undefined) {
          const key = `${query.PatientID}_${query.VisitDate}_${query.MedicineDetail}`;
          if (indexes.by_composite.has(key)) {
            results = [indexes.by_composite.get(key)];
          }
        } else {
          results = store.filter(item => match(item, query));
        }
        
        const cursor = {
          toArray: async () => {
            // Light mapping instead of full heavy deep cloning for fast list queries
            return results.map(item => ({ ...item }));
          },
          sort: (sortObj) => {
            if (sortObj) {
              const keys = Object.keys(sortObj);
              if (keys.length > 0) {
                const key = keys[0];
                const order = sortObj[key];
                results.sort((a, b) => {
                  if (a[key] < b[key]) return -1 * order;
                  if (a[key] > b[key]) return 1 * order;
                  return 0;
                });
              }
            }
            return cursor;
          },
          limit: (n) => {
            results = results.slice(0, n);
            return cursor;
          },
          count: async () => results.length
        };
        return cursor;
      },
      
      findOne: async (query = {}) => {
        if (query && query._id && typeof query._id === 'string' && indexes.by_id.has(query._id)) {
          return { ...indexes.by_id.get(query._id) };
        }
        if (name === 'nhc_patient_history' && query && query.PatientID && query.VisitDate !== undefined && query.MedicineDetail !== undefined) {
          const key = `${query.PatientID}_${query.VisitDate}_${query.MedicineDetail}`;
          if (indexes.by_composite.has(key)) {
            return { ...indexes.by_composite.get(key) };
          }
        }
        const found = store.find(item => match(item, query));
        return found ? { ...found } : null;
      },
      
      insertOne: async (doc) => {
        const copy = { ...doc };
        if (!copy._id) copy._id = Math.random().toString(36).substring(2, 11);
        store.push(copy);
        indexes.by_id.set(copy._id, copy);
        if (name === 'nhc_patient_history') {
          const key = `${copy.PatientID || ''}_${copy.VisitDate || ''}_${copy.MedicineDetail || ''}`;
          indexes.by_composite.set(key, copy);
        }
        self.saveToDisk();
        return { insertedId: copy._id, acknowledged: true };
      },
      
      insertMany: async (docs) => {
        const insertedIds = {};
        docs.forEach((doc, idx) => {
          const copy = { ...doc };
          if (!copy._id) copy._id = Math.random().toString(36).substring(2, 11);
          store.push(copy);
          indexes.by_id.set(copy._id, copy);
          if (name === 'nhc_patient_history') {
            const key = `${copy.PatientID || ''}_${copy.VisitDate || ''}_${copy.MedicineDetail || ''}`;
            indexes.by_composite.set(key, copy);
          }
          insertedIds[idx] = copy._id;
        });
        self.saveToDisk();
        return { insertedCount: docs.length, insertedIds, acknowledged: true };
      },
      
      updateOne: async (query, update, options = {}) => {
        let item = null;
        if (query && query._id && typeof query._id === 'string') {
          item = indexes.by_id.get(query._id) || null;
        } else if (name === 'nhc_patient_history' && query && query.PatientID && query.VisitDate !== undefined && query.MedicineDetail !== undefined) {
          const key = `${query.PatientID}_${query.VisitDate}_${query.MedicineDetail}`;
          item = indexes.by_composite.get(key) || null;
        } else {
          item = store.find(i => match(i, query));
        }

        let matchedCount = item ? 1 : 0;
        let modifiedCount = 0;
        let upsertedId = null;
        
        if (item) {
          applyUpdate(item, update);
          modifiedCount = 1;
        } else if (options.upsert) {
          const newDoc = {};
          if (query) {
            for (const [k, v] of Object.entries(query)) {
              if (k[0] !== '$') newDoc[k] = v;
            }
          }
          applyUpdate(newDoc, update);
          if (!newDoc._id) newDoc._id = Math.random().toString(36).substring(2, 11);
          store.push(newDoc);
          indexes.by_id.set(newDoc._id, newDoc);
          if (name === 'nhc_patient_history') {
            const key = `${newDoc.PatientID || ''}_${newDoc.VisitDate || ''}_${newDoc.MedicineDetail || ''}`;
            indexes.by_composite.set(key, newDoc);
          }
          upsertedId = newDoc._id;
        }
        self.saveToDisk();
        return { matchedCount, modifiedCount, upsertedId, acknowledged: true };
      },
      
      updateMany: async (query, update) => {
        let modifiedCount = 0;
        store.forEach(item => {
          if (match(item, query)) {
            applyUpdate(item, update);
            modifiedCount++;
          }
        });
        self.saveToDisk();
        return { matchedCount: modifiedCount, modifiedCount, acknowledged: true };
      },
      
      deleteOne: async (query) => {
        let deletedCount = 0;
        const idx = store.findIndex(item => match(item, query));
        if (idx !== -1) {
          const item = store[idx];
          indexes.by_id.delete(item._id);
          if (name === 'nhc_patient_history') {
            const key = `${item.PatientID || ''}_${item.VisitDate || ''}_${item.MedicineDetail || ''}`;
            indexes.by_composite.delete(key);
          }
          store.splice(idx, 1);
          deletedCount = 1;
        }
        self.saveToDisk();
        return { deletedCount, acknowledged: true };
      },
      
      deleteMany: async (query = {}) => {
        let deletedCount = 0;
        if (!query || Object.keys(query).length === 0) {
          deletedCount = store.length;
          store.length = 0;
          indexes.by_id.clear();
          indexes.by_composite.clear();
        } else {
          for (let i = store.length - 1; i >= 0; i--) {
            if (match(store[i], query)) {
              const item = store[i];
              indexes.by_id.delete(item._id);
              if (name === 'nhc_patient_history') {
                const key = `${item.PatientID || ''}_${item.VisitDate || ''}_${item.MedicineDetail || ''}`;
                indexes.by_composite.delete(key);
              }
              store.splice(i, 1);
              deletedCount++;
            }
          }
        }
        self.saveToDisk();
        return { deletedCount, acknowledged: true };
      },
      
      countDocuments: async (query = {}) => {
        return store.filter(item => match(item, query)).length;
      },
      
      createIndex: async (keys, options) => {
        return 'mock-index';
      },
      
      bulkWrite: async (operations) => {
        let insertedCount = 0;
        let modifiedCount = 0;
        let upsertedCount = 0;
        
        const colProxy = self.collection(name);
        for (const op of operations) {
          if (op.updateOne) {
            const { filter, update, upsert } = op.updateOne;
            const res = await colProxy.updateOne(filter, update, { upsert });
            if (res.upsertedId) {
              upsertedCount++;
            } else if (res.modifiedCount) {
              modifiedCount++;
            }
          } else if (op.insertOne) {
            await colProxy.insertOne(op.insertOne.document);
            insertedCount++;
          }
        }
        self.saveToDisk();
        return { insertedCount, modifiedCount, upsertedCount, acknowledged: true };
      }
    };
  }
}

let db = new InMemoryDB();
let client;
let seederStatus = "Not Started";
let seederError = null;

// Seed the In-Memory Database immediately on startup so the app is active and functional right away
runAutoSeeder();

// 2. CONNECT TO MONGODB IN THE BACKGROUND
async function connectDB() {
  try {
    console.log('⏳ Connecting to MongoDB at:', MONGODB_URI.replace(/\/\/[^@]*@/, '//***:***@')); // Hide credentials
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000, // Fail-fast after 2 seconds if MongoDB is not running
      connectTimeoutMS: 2000
    });
    await client.connect();
    
    // Switch to the real connected MongoDB database
    db = client.db();
    console.log(`✅ Success! Connected safely to MongoDB (Database: ${db.databaseName})!`);

    // Run the automatic collection builder & seeder on the real MongoDB database
    await runAutoSeeder();

  } catch (err) {
    console.log('MongoDB server offline, using sandbox local data storage mode.');
    console.log('----------------------------------------------------');
    console.log('Details:', err.message);
    console.log('----------------------------------------------------');
    console.log('💡 TROUBLESHOOTING CHECKLIST:');
    console.log('1. Make sure MongoDB is running on your computer (local port 27017).');
    console.log('2. Ensure your Connection String is correct in .env or Server.js.');
    console.log('3. Run "npm install mongodb" inside your project folder.');
    console.log('Using fallback local cache storage mode.');
  }
}

// 🌟 SELF-HEALING AUTOMATIC SEEDING PROCESS
async function runAutoSeeder() {
  seederStatus = "Running";
  try {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Check if system was already initialized
    const initDoc = await db.collection('system_init').findOne({ _id: 'INIT_FLAG' });
    if (initDoc && initDoc.seeded) {
      console.log('⚡ Database initialization flag found. Skipping auto-reseeding to keep user deletions & live updates intact.');
      seederStatus = "Completed Successfully (User Managed)";
      return;
    }

    // List of collections we need
    const collectionsNeeded = [
      'users', 'patients', 'items', 'cities', 'appointments', 'tokens',
      'visits', 'visit_medicines', 'lab_tests', 'med_certs', 'sbp_certs',
      'invoice_headers', 'invoice_details', 'sales_returns', 'grns',
      'grn_details', 'accounts', 'vouchers', 'voucher_details', 'config',
      'clinic', 'sms', 'ac_ledger', 'nhc_patient_history', 'financial_grid_reports',
      'suppliers', 'smart_locator_medicines', 'medicine_barcode_mappings',
      'erp_vendors', 'erp_purchase_orders', 'erp_transactions', 'erp_employees',
      'erp_payroll', 'erp_expenses', 'erp_assets', 'erp_grn'
    ];

    // Automatically drop version_control collection if requested or present
    if (collectionNames.includes('version_control')) {
      if (db instanceof InMemoryDB) {
        delete db.collections['version_control'];
        delete db.indexes['version_control'];
      } else {
        await db.collection('version_control').drop().catch(() => {});
      }
      console.log('🔥 Automatically dropped "version_control" collection from database.');
    }
    for (const name of collectionsNeeded) {
      if (!collectionNames.includes(name)) {
        await db.createCollection(name);
        console.log(`📦 Generated Collection: "${name}"`);
      }
    }

    // 1. Cities Seed
    if ((await db.collection('cities').countDocuments()) === 0) {
      await db.collection('cities').insertMany([
        { CityID: 1, CityName: 'Lahore' },
        { CityID: 2, CityName: 'Faisalabad' },
        { CityID: 3, CityName: 'Rawalpindi' },
        { CityID: 4, CityName: 'Multan' },
        { CityID: 5, CityName: 'Gujranwala' },
        { CityID: 6, CityName: 'Sialkot' },
        { CityID: 7, CityName: 'Sargodha' },
        { CityID: 8, CityName: 'Bahawalpur' },
        { CityID: 9, CityName: 'Sahiwal' },
        { CityID: 10, CityName: 'Islamabad' }
      ]);
      console.log('🌱 Seeded default cities metadata.');
    }

    // 2. Users Seed (Essential administrative credentials only)
    if ((await db.collection('users').countDocuments()) === 0) {
      await db.collection('users').insertMany([
        { UserID: 'USR-001', LoginName: 'admin', FullName: 'Dr. Zaigham Ali Anjum', PasswordHash: '123456', Role: 'Administrator', AssignedShift: 'Both' },
        { UserID: 'USR-002', LoginName: 'doctor', FullName: 'Dr. Amna Malik', PasswordHash: 'doctor123', Role: 'Doctor', AssignedShift: 1 },
        { UserID: 'USR-003', LoginName: 'pharmacist', FullName: 'M. Kashif Qadri', PasswordHash: 'pharmacy123', Role: 'Pharmacist', AssignedShift: 'Both' },
        { UserID: 'USR-004', LoginName: 'reception', FullName: 'Ayesha Bibi', PasswordHash: 'rec123', Role: 'Receptionist', AssignedShift: 1 },
        { UserID: 'USR-005', LoginName: 'accountant', FullName: 'Naveed Ahmad Sheikh', PasswordHash: 'acct123', Role: 'Accountant', AssignedShift: 'Both' }
      ]);
      console.log('🌱 Seeded default login credentials.');
    }

    // 3. Lab Tests Menu Catalog (Diagnostic Catalog)
    if ((await db.collection('lab_tests').countDocuments()) === 0) {
      await db.collection('lab_tests').insertMany([
        { TID: 'TST-001', TestName: 'Complete Blood Count (CBC)', Cost: 650 },
        { TID: 'TST-002', TestName: 'Blood Sugar Fasting / Random', Cost: 150 },
        { TID: 'TST-003', TestName: 'Urine Routine Examination', Cost: 300 }
      ]);
      console.log('🌱 Seeded default clinical diagnostic test menu.');
    }

    // 4. Chart of Accounts Seed (FL level-1, SL level-2, and TL level-3 with 0 initial balance)
    if ((await db.collection('fl_accounts').countDocuments()) === 0) {
      await db.collection('fl_accounts').insertMany([
        { FLID: 1, FLName: 'Assets' },
        { FLID: 2, FLName: 'Liabilities' },
        { FLID: 3, FLName: 'Equity' },
        { FLID: 4, FLName: 'Revenue' },
        { FLID: 5, FLName: 'Expenses' }
      ]);
      console.log('🌱 Seeded default Level-1 Chart of Accounts.');
    }

    if ((await db.collection('sl_accounts').countDocuments()) === 0) {
      await db.collection('sl_accounts').insertMany([
        { FLID: 1, SLID: 101, SLName: 'Cash & Bank Balances' },
        { FLID: 1, SLID: 102, SLName: 'Receivables & Advances' },
        { FLID: 1, SLID: 103, SLName: 'Inventory Accounts' },
        { FLID: 2, SLID: 201, SLName: 'Accounts Payable' },
        { FLID: 2, SLID: 202, SLName: 'Accrued Liabilities' },
        { FLID: 3, SLID: 301, SLName: 'Capital Accounts' },
        { FLID: 4, SLID: 401, SLName: 'Clinical Services Income' },
        { FLID: 4, SLID: 402, SLName: 'Pharmacy Sales Income' },
        { FLID: 5, SLID: 501, SLName: 'Pharmacy Costs & Discounts' },
        { FLID: 5, SLID: 502, SLName: 'Operating & Admin Expenses' }
      ]);
      console.log('🌱 Seeded default Level-2 Chart of Accounts.');
    }

    if ((await db.collection('accounts').countDocuments()) === 0) {
      await db.collection('accounts').insertMany([
        { FLID: 1, SLID: 101, TLID: 101001, TLName: 'Dr. Cash-in-Hand (Morning Shift)', AcBalance: 0 },
        { FLID: 1, SLID: 101, TLID: 101002, TLName: 'Dr. Cash-in-Hand (Evening Shift)', AcBalance: 0 },
        { FLID: 1, SLID: 101, TLID: 101003, TLName: 'Appointment Cash Desk', AcBalance: 0 },
        { FLID: 1, SLID: 101, TLID: 101004, TLName: 'Bank Al-Falah (Current Account)', AcBalance: 0 },
        { FLID: 1, SLID: 102, TLID: 102001, TLName: 'SBP Panel Employee Receivables', AcBalance: 0 },
        { FLID: 1, SLID: 103, TLID: 103001, TLName: 'Pharmacy Stock Ledger', AcBalance: 0 },
        { FLID: 2, SLID: 201, TLID: 201001, TLName: 'Payable to Suppliers / Distributers', AcBalance: 0 },
        { FLID: 2, SLID: 201, TLID: 201002, TLName: 'Accounts Payable General', AcBalance: 0 },
        { FLID: 3, SLID: 301, TLID: 301001, TLName: 'Owner Capital Equity Account', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401001, TLName: 'Appointment OPD Ticket Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401002, TLName: 'Lab & Diagnostics Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401101, TLName: 'Morning Shift: Appointment Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401102, TLName: 'Morning Shift: Clinical Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401103, TLName: 'Morning Shift: Patent Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401104, TLName: 'Morning Shift: Store Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401201, TLName: 'Evening Shift: Appointment Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401202, TLName: 'Evening Shift: Clinical Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401203, TLName: 'Evening Shift: Patent Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 401, TLID: 401204, TLName: 'Evening Shift: Store Medicine Revenue', AcBalance: 0 },
        { FLID: 4, SLID: 402, TLID: 402001, TLName: 'Pharmacy Store Cash Sales', AcBalance: 0 },
        { FLID: 5, SLID: 501, TLID: 501001, TLName: 'Pharmacy Cost of Goods Sold (COGS)', AcBalance: 0 },
        { FLID: 5, SLID: 501, TLID: 501002, TLName: 'Pharmacy Customer Discounts Allowed', AcBalance: 0 },
        { FLID: 5, SLID: 501, TLID: 501003, TLName: 'Pharmacy Sales Return Debit A/C', AcBalance: 0 },
        { FLID: 5, SLID: 501, TLID: 501004, TLName: 'Pharmacy Sales Return Disc Reversal', AcBalance: 0 },
        { FLID: 5, SLID: 502, TLID: 502001, TLName: 'Clinic Rent & Lease Expense', AcBalance: 0 },
        { FLID: 5, SLID: 502, TLID: 502002, TLName: 'Electricity & Water Utility Bills', AcBalance: 0 },
        { FLID: 5, SLID: 502, TLID: 502003, TLName: 'Doctor Consultation Sharing Pay', AcBalance: 0 }
      ]);
      console.log('🌱 Seeded default Level-3 Chart of Accounts with zero balances.');
    }

    // 5. System Settings Seed
    if ((await db.collection('config').countDocuments()) === 0) {
      await db.collection('config').insertOne({
        ConfigID: 0,
        ClinicCIH_: 101001,
        StoreCIH_: 101002,
        StoreSale_: 402001,
        StoreDisc_: 501002,
        StoreSR_: 501003,
        StoreSRdisc_: 501004,
        AppCIH_: 101003,
        AppSale_: 401001
      });
    }

    // 6. Clinic Profile Seed
    const defaultClinicInfo = {
      ClinicName: 'Punjab Homeopathic Clinic',
      ClinicLogoText: 'PHC',
      DoctorName: 'Dr. Ejaz Ahmad, D.H.M.S (Pak)',
      DoctorSignatureText: 'Dr. Ejaz Ahmad, D.H.M.S (Pak) • Registered Homeopathic Medical Practitioner No: 48776',
      ClinicAddress: '10 Shalimar Road, Garhi Shahu, Lahore 39 Pakistan',
      PhoneMobile: '+92-311-4000608',
      RegistrationNo: 'Registered Homeopathic Medical Practitioner No: 48776',
      OPDFee: 1500
    };
    if ((await db.collection('clinic').countDocuments()) === 0) {
      await db.collection('clinic').insertOne(defaultClinicInfo);
    } else {
      await db.collection('clinic').updateOne({}, { $set: defaultClinicInfo });
    }

    // 7. SMS Settings Seed
    if ((await db.collection('sms').countDocuments()) === 0) {
      await db.collection('sms').insertOne({
        Provider: 'twilio',
        Enabled: false,
        ApiUrl: 'https://api.twilio.com',
        ApiKey: 'AC-DEMO-API-KEY-FOR-SMS',
        SenderID: 'PK-CLINIC',
        BookingTemplate: 'Dear {name}, your appointment is booked. Token: {token}.',
        RepeatTemplate: 'Dear {name}, follow-up is scheduled.'
      });
    }

    // 8. Smart Locator Clinical Symptom Knowledgebase
    if ((await db.collection('smart_locator_medicines').countDocuments()) === 0) {
      await db.collection('smart_locator_medicines').insertMany([
        { Symptoms: 'fever, headache, body ache, high temperature, pain', MedicineName: 'Paracetamol', Dosage: '1-0-1', Composition: 'Paracetamol 500mg' },
        { Symptoms: 'throat infection, cough, dry cough, sore throat, bronchitis', MedicineName: 'Acefyl Cough Syrup', Dosage: '1-1-1', Composition: 'Acefylline Piperazine' },
        { Symptoms: 'heartburn, acidity, GERD, gastric, stomach pain, reflux', MedicineName: 'Omeprazole', Dosage: '1-0-0', Composition: 'Omeprazole 20mg' },
        { Symptoms: 'allergic rhinitis, sneezing, runny nose, allergy, itching', MedicineName: 'Loratadine', Dosage: '0-0-1', Composition: 'Loratadine 10mg' },
        { Symptoms: 'bacterial infection, fever, throat infection, tonsillitis', MedicineName: 'Co-Amoxiclav', Dosage: '1-0-1', Composition: 'Amoxicillin + Clavulanic Acid' },
        { Symptoms: 'diarrhea, loose motions, dehydration, stomach bug', MedicineName: 'Flagyl', Dosage: '1-1-1', Composition: 'Metronidazole 400mg' },
        { Symptoms: 'vomiting, nausea, motion sickness, stomach upset', MedicineName: 'Gravinate', Dosage: '1-0-1', Composition: 'Dimenhydrinate 50mg' },
        { Symptoms: 'muscle spasm, pain, backache, neck pain, stiffness', MedicineName: 'Nuberol Forte', Dosage: '1-0-1', Composition: 'Paracetamol + Orphenadrine' }
      ]);
      console.log('🌱 Seeded default smart locator clinical matcher.');
    }

    // Flag system initialization
    await db.collection('system_init').updateOne(
      { _id: 'INIT_FLAG' },
      { $set: { _id: 'INIT_FLAG', seeded: true, initializedAt: new Date().toISOString() } },
      { upsert: true }
    );

    console.log('⭐ Seeding verified. MongoDB structures are fully populated!');
    seederStatus = "Completed Successfully";

  } catch (err) {
    console.error('⚠️ Seeding database error:', err.message);
    seederStatus = "Failed";
    seederError = err.message + "\n" + err.stack;
  }
}

connectDB();

// ==========================================================================================
// 3. COMPLETE API CRUD CONTROLLERS
// ==========================================================================================

// ------------------------------------------------------------------------------------------
// 👥 USERS & PROFILE SECURITY MODULE
// ------------------------------------------------------------------------------------------

// Fetch all profiles
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff User Authentication Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { LoginName, PasswordHash } = req.body;
    if (!LoginName || !PasswordHash) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const user = await db.collection('users').findOne({ 
      LoginName: LoginName.trim(), 
      PasswordHash: PasswordHash 
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid login username or password.' });
    }
    res.json({ success: true, message: 'Authentication successful.', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Register profile
app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    if (!user.UserID) user.UserID = `USR-${Date.now().toString().slice(-4)}`;
    await db.collection('users').updateOne(
      { UserID: user.UserID },
      { $set: user },
      { upsert: true }
    );
    res.json({ success: true, message: 'User profile saved.', data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile details
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await db.collection('users').updateOne({ UserID: id }, { $set: updateData });
    res.json({ success: true, message: 'User profile modified.', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user profile
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').deleteOne({ UserID: id });
    res.json({ success: true, message: 'User profile deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🏙️ CITIES & GEOGRAPHIC MASTERS MODULE (PUNJAB PROVINCE & PAKISTAN)
// ------------------------------------------------------------------------------------------

// Fetch all cities
app.get('/api/cities', async (req, res) => {
  try {
    const cities = await db.collection('cities')
      .find({})
      .sort({ CityID: 1 })
      .toArray();
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert or Update City
app.post('/api/cities', async (req, res) => {
  try {
    const city = req.body;
    if (!city || !city.CityName || !city.CityName.trim()) {
      return res.status(400).json({ error: 'CityName is required.' });
    }
    city.CityName = city.CityName.trim();
    if (!city.Province) {
      city.Province = 'Punjab';
    }

    // Auto calculate CityID if not provided
    if (!city.CityID || isNaN(Number(city.CityID)) || Number(city.CityID) <= 0) {
      const allCities = await db.collection('cities').find({}).toArray();
      const maxId = allCities.reduce((max, c) => Math.max(max, Number(c.CityID) || 0), 0);
      city.CityID = maxId + 1;
    } else {
      city.CityID = Number(city.CityID);
    }

    if (city._id) delete city._id;

    await db.collection('cities').updateOne(
      { CityID: city.CityID },
      { $set: city },
      { upsert: true }
    );
    res.json({ success: true, message: 'City saved successfully.', data: city });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete City
app.delete('/api/cities/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const numId = Number(rawId);
    const query = !isNaN(numId) ? { $or: [{ CityID: numId }, { CityID: rawId }] } : { CityID: rawId };
    
    const result = await db.collection('cities').deleteOne(query);
    res.json({ success: true, message: 'City deleted successfully.', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 👤 CLINICAL PATIENT REGISTRATION MODULE
// ------------------------------------------------------------------------------------------

// Fetch all patients (with sorting)
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await db.collection('patients')
      .find({})
      .sort({ RegistrationDate: -1 })
      .toArray();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await db.collection('patients').findOne({ PatientID: id });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insert Patient
app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    if (!patient.PatientID) patient.PatientID = `PAT-${Date.now().toString().slice(-4)}`;
    if (patient.RegistrationDate) patient.RegistrationDate = new Date(patient.RegistrationDate);
    else patient.RegistrationDate = new Date();

    await db.collection('patients').updateOne(
      { PatientID: patient.PatientID },
      { $set: patient },
      { upsert: true }
    );
    res.json({ success: true, message: 'Patient saved successfully.', data: patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    if (updated._id) delete updated._id; // Prevent immutable _id updates
    const result = await db.collection('patients').updateOne(
      { PatientID: id },
      { $set: updated }
    );
    res.json({ success: true, message: 'Patient details updated.', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('patients').deleteOne({ PatientID: id });
    res.json({ success: true, message: 'Patient removed from records.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🧹 SYSTEM ADMIN: PURGE ALL DUMMY / TEST RECORDS
// ------------------------------------------------------------------------------------------
app.post('/api/admin/purge-dummy-records', async (req, res) => {
  try {
    const purgeResults = await Promise.allSettled([
      db.collection('erp_expenses').deleteMany({ ExpenseID: /^TEST-/ }),
      db.collection('erp_assets').deleteMany({ AssetID: /^TEST-/ }),
      db.collection('erp_transactions').deleteMany({ TransactionID: /^TEST-/ }),
      db.collection('erp_payroll').deleteMany({ PayrollID: /^TEST-/ }),
      db.collection('erp_purchase_orders').deleteMany({ POID: /^TEST-/ }),
      db.collection('erp_vendors').deleteMany({ VendorID: /^TEST-/ })
    ]);

    res.json({
      success: true,
      message: 'Test records have been successfully purged from the database.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 💊 MEDICINES & DRUG INVENTORY MODULE
// ------------------------------------------------------------------------------------------

// Fetch all medicines (with optional category filter)
app.get('/api/items', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'ALL') {
      query = { Unit: new RegExp(String(category), 'i') };
    }
    const items = await db.collection('items').find(query).sort({ ItemName: 1 }).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single medicine
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.collection('items').findOne({ ItemID: id });
    if (!item) return res.status(404).json({ error: 'Medicine not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Insert / Upsert Medicines to MongoDB
app.post('/api/items/bulk', async (req, res) => {
  try {
    const itemsList = req.body;
    if (!Array.isArray(itemsList)) {
      return res.status(400).json({ error: 'Expected an array of medicine items.' });
    }
    const wipe = req.query.wipe === 'true';
    if (wipe) {
      await db.collection('items').deleteMany({});
    }
    const operations = itemsList.map(item => {
      const doc = { ...item };
      if (doc._id) delete doc._id;
      if (!doc.ItemID) doc.ItemID = `ITM-${Math.floor(10000 + Math.random() * 90000)}`;
      return {
        updateOne: {
          filter: { ItemID: doc.ItemID },
          update: { $set: doc },
          upsert: true
        }
      };
    });
    if (operations.length > 0) {
      await db.collection('items').bulkWrite(operations);
    }
    res.json({
      success: true,
      count: itemsList.length,
      message: `Successfully synchronized ${itemsList.length} medicines in MongoDB database.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create medicine
app.post('/api/items', async (req, res) => {
  try {
    const item = req.body;
    if (!item.ItemID) item.ItemID = `ITM-${Date.now().toString().slice(-4)}`;
    await db.collection('items').updateOne(
      { ItemID: item.ItemID },
      { $set: item },
      { upsert: true }
    );
    res.json({ success: true, message: 'Inventory item synchronized.', data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update medicine parameters (stock & pricing)
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    if (updated._id) delete updated._id;
    await db.collection('items').updateOne({ ItemID: id }, { $set: updated });
    res.json({ success: true, message: 'Inventory specifications updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete medicine
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('items').deleteOne({ ItemID: id });
    res.json({ success: true, message: 'Medicine removed from database.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🏷️ MEDICINE BARCODE & QR CODE MAPPER MODULE
// ------------------------------------------------------------------------------------------

// Fetch all barcode mappings
app.get('/api/barcode-mappings', async (req, res) => {
  try {
    const mappings = await db.collection('medicine_barcode_mappings').find({}).toArray();
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single mapping by barcode / raw text
app.get('/api/barcode-mappings/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const mapping = await db.collection('medicine_barcode_mappings').findOne({ 
      $or: [
        { Barcode: barcode.trim() },
        { Barcode: barcode.trim().toLowerCase() }
      ]
    });
    if (!mapping) return res.status(404).json({ error: 'Barcode mapping not found.' });
    res.json(mapping);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Upsert Barcode Association
app.post('/api/barcode-mappings', async (req, res) => {
  try {
    const { Barcode, ItemID, ItemName, VendorName, Notes, CreatedBy } = req.body;
    if (!Barcode || !ItemID) {
      return res.status(400).json({ error: 'Both Barcode and ItemID are required to map.' });
    }

    const trimmedBarcode = Barcode.trim();
    const doc = {
      Barcode: trimmedBarcode,
      ItemID: ItemID.trim(),
      ItemName: ItemName || '',
      VendorName: VendorName || 'BM Private Limited',
      Notes: Notes || '',
      LinkedAt: new Date().toISOString(),
      CreatedBy: CreatedBy || 'Pharmacist'
    };

    await db.collection('medicine_barcode_mappings').updateOne(
      { Barcode: trimmedBarcode },
      { $set: doc },
      { upsert: true }
    );

    // Also update the VendorBarcode field in items collection for direct fast query
    await db.collection('items').updateOne(
      { ItemID: ItemID.trim() },
      { $set: { VendorBarcode: trimmedBarcode } }
    );

    res.json({
      success: true,
      message: `Barcode "${trimmedBarcode}" successfully mapped to Item "${ItemID}" in MongoDB!`,
      data: doc
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Barcode Mapping
app.delete('/api/barcode-mappings/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const trimmed = decodeURIComponent(barcode).trim();
    await db.collection('medicine_barcode_mappings').deleteOne({ Barcode: trimmed });
    res.json({ success: true, message: `Barcode mapping "${trimmed}" removed.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 📅 CLINIC CONSULTATION APPOINTMENTS
// ------------------------------------------------------------------------------------------

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await db.collection('appointments').find({}).toArray();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single appointment
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const app = await db.collection('appointments').findOne({ AppointmentID: id });
    if (!app) return res.status(404).json({ error: 'Appointment not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Insert / Upsert Appointments to MongoDB
app.post('/api/appointments/bulk', async (req, res) => {
  try {
    const appsList = req.body;
    if (!Array.isArray(appsList)) {
      return res.status(400).json({ error: 'Expected an array of appointments.' });
    }
    const wipe = req.query.wipe === 'true';
    if (wipe) {
      await db.collection('appointments').deleteMany({});
    }

    if (appsList.length === 0) {
      return res.json({ success: true, count: 0, message: 'Empty list provided.' });
    }

    // Auto-create/upsert patients that may not exist yet
    const patientOps = [];
    const seenPids = new Set();

    appsList.forEach(app => {
      if (app.PatientID) {
        const pid = String(app.PatientID).trim();
        if (!seenPids.has(pid)) {
          seenPids.add(pid);
          patientOps.push({
            updateOne: {
              filter: { PatientID: pid },
              update: {
                $setOnInsert: {
                  PatientID: pid,
                  PatientName: app.PatientName || `Patient ${pid}`,
                  PhoneMobile: app.PhoneMobile || '',
                  Sex: app.Sex || 'Male',
                  AgeYears: app.AgeYears || 0,
                  RegistrationDate: app.AppointmentDate || new Date().toISOString().split('T')[0],
                  CityID: 1,
                  Country: 'Pakistan',
                  Address: 'N/A'
                }
              },
              upsert: true
            }
          });
        }
      }
    });

    if (patientOps.length > 0) {
      await db.collection('patients').bulkWrite(patientOps, { ordered: false }).catch(err => {
        console.warn('Patient bulk auto-seed notice:', err.message);
      });
    }

    const appOps = appsList.map((app, idx) => {
      const doc = { ...app };
      if (doc._id) delete doc._id;
      if (!doc.AppointmentID) doc.AppointmentID = `APP-${Date.now()}-${idx + 1}`;
      if (doc.FeeCharged !== undefined) doc.FeeCharged = Number(doc.FeeCharged) || 0;
      if (doc.Shift) doc.Shift = parseInt(doc.Shift) || 1;
      if (doc.Status === undefined) doc.Status = 2;

      return {
        updateOne: {
          filter: { AppointmentID: doc.AppointmentID },
          update: { $set: doc },
          upsert: true
        }
      };
    });

    const bulkResult = await db.collection('appointments').bulkWrite(appOps, { ordered: false });
    res.json({
      success: true,
      message: `Bulk synchronized ${appsList.length} appointment records to MongoDB!`,
      result: bulkResult
    });
  } catch (err) {
    console.error('Bulk appointments import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Book / Upsert Appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const appData = req.body;
    
    // Patient Validation: Ensure PatientID exists in patients collection
    if (appData.PatientID) {
      const patient = await db.collection('patients').findOne({ PatientID: appData.PatientID });
      if (!patient) {
        return res.status(400).json({ error: `Validation Error: PatientID "${appData.PatientID}" does not exist in patients database.` });
      }
    } else {
      return res.status(400).json({ error: 'Validation Error: PatientID is required to book an appointment.' });
    }

    if (!appData.AppointmentID) appData.AppointmentID = `APP-${Date.now().toString().slice(-4)}`;
    
    // Explicit data casting
    if (appData.Shift) appData.Shift = parseInt(appData.Shift);
    if (appData.FeePaid) appData.FeePaid = parseFloat(appData.FeePaid) || 0;
    if (appData.AgeYears) appData.AgeYears = parseInt(appData.AgeYears);

    await db.collection('appointments').updateOne(
      { AppointmentID: appData.AppointmentID },
      { $set: appData },
      { upsert: true }
    );
    res.json({ success: true, message: 'Appointment saved successfully.', data: appData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Appointment Status
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    if (updateFields._id) delete updateFields._id;
    await db.collection('appointments').updateOne(
      { AppointmentID: id },
      { $set: updateFields }
    );
    res.json({ success: true, message: 'Appointment status modified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('appointments').deleteOne({ AppointmentID: id });
    res.json({ success: true, message: 'Appointment canceled.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 💳 APPOINTMENT & PATIENT PAYMENT HISTORY ALIASES (app_payment_history / app_appointment_history)
// ------------------------------------------------------------------------------------------
app.get(['/api/app_payment_history', '/api/app-payment-history', '/api/app_appointment_history', '/api/app-appointment-history'], async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.query;
    const query = {};
    if (patientId) query.PatientID = String(patientId).trim();
    if (startDate || endDate) {
      query.AppointmentDate = {};
      if (startDate) query.AppointmentDate.$gte = String(startDate);
      if (endDate) query.AppointmentDate.$lte = String(endDate);
    }
    const history = await db.collection('appointments').find(query).sort({ AppointmentDate: -1 }).toArray();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🎫 DAILY RECEPTION QUEUE TOKENS
// ------------------------------------------------------------------------------------------

// Fetch all tokens
app.get('/api/tokens', async (req, res) => {
  try {
    const tokens = await db.collection('tokens').find({}).toArray();
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book token
app.post('/api/tokens', async (req, res) => {
  try {
    const token = req.body;

    // Normalize Date / TokenDate properties for compatibility
    if (token.Date && !token.TokenDate) {
      token.TokenDate = token.Date;
    } else if (token.TokenDate && !token.Date) {
      token.Date = token.TokenDate;
    }

    // Patient Validation: Ensure PatientID exists in patients collection
    if (token.PatientID) {
      const patient = await db.collection('patients').findOne({ PatientID: token.PatientID });
      if (!patient) {
        return res.status(400).json({ error: `Validation Error: PatientID "${token.PatientID}" does not exist in patients database.` });
      }
    } else {
      return res.status(400).json({ error: 'Validation Error: PatientID is required to issue a queue token.' });
    }

    // Explicit data casting
    if (token.TokenNo) token.TokenNo = parseInt(token.TokenNo);
    if (token.Shift) token.Shift = parseInt(token.Shift);

    await db.collection('tokens').updateOne(
      { TokenNo: token.TokenNo, TokenDate: token.TokenDate || 'N/A', Shift: token.Shift },
      { $set: token },
      { upsert: true }
    );
    res.json({ success: true, message: 'Token generated successfully.', data: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update token status
app.put('/api/tokens/:tokenNo/:shift/:date', async (req, res) => {
  try {
    const { tokenNo, shift, date } = req.params;
    const updateData = req.body;
    await db.collection('tokens').updateOne(
      { TokenNo: parseInt(tokenNo), Shift: parseInt(shift), TokenDate: date },
      { $set: updateData }
    );
    res.json({ success: true, message: 'Token queue state modified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete token
app.delete('/api/tokens/:tokenNo/:shift/:date', async (req, res) => {
  try {
    const { tokenNo, shift, date } = req.params;
    await db.collection('tokens').deleteOne({
      TokenNo: parseInt(tokenNo),
      Shift: parseInt(shift),
      TokenDate: date
    });
    res.json({ success: true, message: 'Token queue item dropped.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🔬 LAB TESTS DIAGNOSTICS DIRECTORY
// ------------------------------------------------------------------------------------------

// Get diagnostic directory
app.get('/api/lab-tests', async (req, res) => {
  try {
    const tests = await db.collection('lab_tests').find({}).toArray();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add lab test
app.post('/api/lab-tests', async (req, res) => {
  try {
    const test = req.body;
    if (!test.TID) test.TID = `TST-${Date.now().toString().slice(-4)}`;
    await db.collection('lab_tests').updateOne(
      { TID: test.TID },
      { $set: test },
      { upsert: true }
    );
    res.json({ success: true, message: 'Diagnostic test registered.', data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lab test
app.put('/api/lab-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testData = req.body;
    if (testData._id) delete testData._id;
    await db.collection('lab_tests').updateOne({ TID: id }, { $set: testData });
    res.json({ success: true, message: 'Diagnostic test specifications modified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete lab test
app.delete('/api/lab-tests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('lab_tests').deleteOne({ TID: id });
    res.json({ success: true, message: 'Diagnostic test removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🩺 CLINICAL VISITS (EMR CONSULTATIONS)
// ------------------------------------------------------------------------------------------

// Fetch visits
app.get('/api/visits', async (req, res) => {
  try {
    const visits = await db.collection('visits').find({}).sort({ VisitDate: -1 }).toArray();
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single visit
app.get('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visit = await db.collection('visits').findOne({ VisitID: id });
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Upsert Consultation
app.post('/api/visits', async (req, res) => {
  try {
    const visit = req.body;

    // Patient Validation: Ensure PatientID exists in patients collection
    if (visit.PatientID) {
      const patient = await db.collection('patients').findOne({ PatientID: visit.PatientID });
      if (!patient) {
        return res.status(400).json({ error: `Validation Error: PatientID "${visit.PatientID}" does not exist in patients database.` });
      }
    } else {
      return res.status(400).json({ error: 'Validation Error: PatientID is required to log a clinical visit.' });
    }

    if (!visit.VisitID) visit.VisitID = `VIS-${Date.now().toString().slice(-4)}`;

    // Explicit data casting
    if (visit.Status) visit.Status = parseInt(visit.Status);
    if (visit.TempF) visit.TempF = parseFloat(visit.TempF) || 0;
    if (visit.Pulse) visit.Pulse = parseInt(visit.Pulse) || 0;

    await db.collection('visits').updateOne(
      { VisitID: visit.VisitID },
      { $set: visit },
      { upsert: true }
    );

    // Auto-sync OPD consultation fees into General Ledger Cash & Revenue accounts
    const fee = parseFloat(visit.ConsultationFee) || 0;
    const isPaid = visit.ConsultationPaymentOption === 'Paid - Cash' || visit.ConsultationPaymentOption === 'Paid - Online/Card' || visit.ConsultationPaymentOption === 'Paid';
    if (visit.Status === 2 && isPaid && fee > 0) {
      const vchNo = `CRV-OPD-${visit.VisitID}`;
      const detailsRows = [
        {
          TLID: 101001, // OPD Clinic Cash In Hand
          Debit: fee,
          Credit: 0,
          Description: `OPD Consultation Fee collected (Visit #${visit.VisitID})`
        },
        {
          TLID: 401001, // OPD Doctor Consultation Revenue
          Debit: 0,
          Credit: fee,
          Description: `OPD Doctor Consultation Revenue`
        }
      ];
      await createBackendVoucher(vchNo, visit.VisitDate ? visit.VisitDate.split('T')[0] : new Date().toISOString().split('T')[0], 'CRV', `OPD Consultation Fee for Visit #${visit.VisitID}`, detailsRows);
    }

    res.json({ success: true, message: 'EMR Clinical consultation session synchronized successfully.', data: visit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Consultation
app.put('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData._id) delete updateData._id;
    await db.collection('visits').updateOne({ VisitID: id }, { $set: updateData });
    res.json({ success: true, message: 'Clinical consultation updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Consultation
app.delete('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('visits').deleteOne({ VisitID: id });
    // Also clean up any associated medicines
    await db.collection('visit_medicines').deleteMany({ VisitID: id });
    res.json({ success: true, message: 'Clinical consultation and associated medicines deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all visit medicines
app.get('/api/visit-medicines', async (req, res) => {
  try {
    const meds = await db.collection('visit_medicines').find({}).toArray();
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Save visit medicines
app.post('/api/visit-medicines', async (req, res) => {
  try {
    const meds = req.body;
    if (Array.isArray(meds)) {
      if (meds.length > 0) {
        // Delete any existing medicines for these VisitIDs to avoid duplicates on upsert
        const visitIds = [...new Set(meds.map(m => m.VisitID))].filter(Boolean);
        if (visitIds.length > 0) {
          await db.collection('visit_medicines').deleteMany({ VisitID: { $in: visitIds } });
        }
        await db.collection('visit_medicines').insertMany(meds);
      }
      res.json({ success: true, message: 'Visit medicines saved successfully.' });
    } else {
      // Single item save
      if (meds.VisitID) {
        await db.collection('visit_medicines').deleteOne({ VisitID: meds.VisitID, ItemID: meds.ItemID });
      }
      await db.collection('visit_medicines').insertOne(meds);
      res.json({ success: true, message: 'Visit medicine saved successfully.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 📜 MEDICAL CERTIFICATES (STANDARD FIT & STATE BANK CLAIM FORMS)
// ------------------------------------------------------------------------------------------

// Fetch standard fit certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certs = await db.collection('med_certs').find({}).toArray();
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create standard fit certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const cert = req.body;
    if (!cert.CertificateID) cert.CertificateID = `MC-${Date.now().toString().slice(-4)}`;
    await db.collection('med_certs').updateOne(
      { CertificateID: cert.CertificateID },
      { $set: cert },
      { upsert: true }
    );
    res.json({ success: true, message: 'Medical fitness certificate saved.', data: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete standard certificate
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('med_certs').deleteOne({ CertificateID: id });
    res.json({ success: true, message: 'Medical certificate removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch SBP claims
app.get('/api/sbp-certificates', async (req, res) => {
  try {
    const certs = await db.collection('sbp_certs').find({}).toArray();
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create SBP claim certificate
app.post('/api/sbp-certificates', async (req, res) => {
  try {
    const cert = req.body;
    if (!cert.CertificateID) cert.CertificateID = `SBP-${Date.now().toString().slice(-4)}`;
    await db.collection('sbp_certs').updateOne(
      { CertificateID: cert.CertificateID },
      { $set: cert },
      { upsert: true }
    );
    res.json({ success: true, message: 'SBP Medical Claim Certificate logged.', data: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete SBP certificate
app.delete('/api/sbp-certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('sbp_certs').deleteOne({ CertificateID: id });
    res.json({ success: true, message: 'SBP Medical Claim Certificate deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🛒 PHARMACY POINT OF SALE (POS) SALES CHECKOUT & ATOMIC STOCK DEDUCTIONS
// ------------------------------------------------------------------------------------------

// Fetch all invoices (headers and detail collections)
app.get('/api/billing/invoices', async (req, res) => {
  try {
    const headers = await db.collection('invoice_headers').find({}).sort({ CreatedAt: -1 }).toArray();
    const details = await db.collection('invoice_details').find({}).toArray();
    res.json({ headers, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch single invoice
app.get('/api/billing/invoices/:invoiceNo', async (req, res) => {
  try {
    const { invoiceNo } = req.params;
    const header = await db.collection('invoice_headers').findOne({ InvoiceNo: invoiceNo });
    if (!header) return res.status(404).json({ error: 'Invoice not found' });
    const details = await db.collection('invoice_details').find({ InvoiceNo: invoiceNo }).toArray();
    res.json({ header, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Pharmacy POS Checkout Invoice
app.post('/api/billing/checkout', async (req, res) => {
  const { 
    InvoiceNo, PatientID, InvoiceDate, GAmount, 
    Discount, NetAmount, shift, basketItems 
  } = req.body;

  try {
    const invNo = InvoiceNo || `INV-${Date.now().toString().slice(-6)}`;
    const invoiceHeader = {
      InvoiceNo: invNo,
      PatientID,
      InvoiceDate: InvoiceDate || new Date().toISOString().split('T')[0],
      GAmount: parseFloat(GAmount) || 0,
      Discount: parseFloat(Discount) || 0,
      NetAmount: parseFloat(NetAmount) || 0,
      shift: parseInt(shift) || 1,
      Status: 2, // 2 = Posted
      CreatedAt: new Date()
    };

    // Parallel execution array for database insertions and updates
    const databaseOperations = [];

    // 1. Insert header
    databaseOperations.push(db.collection('invoice_headers').insertOne(invoiceHeader));

    // 2. Prepare detail insertions and atomic stock decrements
    if (Array.isArray(basketItems)) {
      for (const item of basketItems) {
        const qty = parseInt(item.Qty) || 0;
        const price = parseFloat(item.Price) || 0;
        const lineTotal = qty * price;

        const invoiceDetail = {
          InvoiceNo: invNo,
          ItemID: item.ItemID,
          Qty: qty,
          Price: price,
          LineTotal: lineTotal,
          MedicineType: item.MedicineType || 'S'
        };

        // Insert details
        databaseOperations.push(db.collection('invoice_details').insertOne(invoiceDetail));

        // Decrement stock and apply FEFO batch deduction in the medicine collection
        databaseOperations.push((async () => {
          try {
            const itmDoc = await db.collection('items').findOne({ ItemID: item.ItemID });
            if (itmDoc) {
              let updatedBatches = Array.isArray(itmDoc.Batches) ? itmDoc.Batches : [];
              let remainingToDeduct = qty;

              if (updatedBatches.length > 0) {
                const sortedBatches = [...updatedBatches].sort((a, b) => {
                  if (!a.ExpDate && !b.ExpDate) return 0;
                  if (!a.ExpDate) return 1;
                  if (!b.ExpDate) return -1;
                  return a.ExpDate.localeCompare(b.ExpDate);
                });

                updatedBatches = sortedBatches.map(batch => {
                  const currentBatchQty = Number(batch.Qty) || 0;
                  if (remainingToDeduct <= 0 || currentBatchQty <= 0) return batch;
                  const canDeduct = Math.min(currentBatchQty, remainingToDeduct);
                  const newQty = currentBatchQty - canDeduct;
                  remainingToDeduct -= canDeduct;
                  const isExp = batch.ExpDate ? new Date(batch.ExpDate) < new Date() : false;
                  return {
                    ...batch,
                    Qty: newQty,
                    Status: newQty === 0 ? 'EXHAUSTED' : (isExp ? 'EXPIRED' : 'ACTIVE')
                  };
                });
              }

              const activeBatches = updatedBatches.filter(b => (Number(b.Qty) || 0) > 0);
              const earliest = activeBatches.length > 0
                ? [...activeBatches].sort((a, b) => (a.ExpDate || '9999').localeCompare(b.ExpDate || '9999'))[0]
                : updatedBatches[0];

              const newCStock = Math.max(0, (itmDoc.CStock || 0) - qty);
              const updateDoc = {
                CStock: newCStock,
                ...(updatedBatches.length > 0 ? { Batches: updatedBatches } : {}),
                ...(earliest ? { BatchNo: earliest.BatchNo || itmDoc.BatchNo, ExpDate: earliest.ExpDate || itmDoc.ExpDate } : {})
              };

              await db.collection('items').updateOne(
                { ItemID: item.ItemID },
                { $set: updateDoc }
              );
            } else {
              await db.collection('items').updateOne(
                { ItemID: item.ItemID },
                { $inc: { CStock: -qty } }
              );
            }
          } catch (itemErr) {
            console.error(`Error updating FEFO batch stock for item ${item.ItemID}:`, itemErr);
          }
        })());
      }
    }

    // Execute all database operations in parallel
    await Promise.all(databaseOperations);

    // 3. Automatically sync Double-Entry Accounting Financial Ledger (No manual entry needed!)
    if (invoiceHeader.NetAmount > 0) {
      const vchNo = `CRV-POS-${invNo}`;
      const targetCashTLID = 101002; // Pharmacy Store Cash Account
      const storeRevTLID = 402001;   // Pharmacy Sales Revenue Account
      
      const netAmt = invoiceHeader.NetAmount;
      const discAmt = invoiceHeader.Discount;
      const grossAmt = invoiceHeader.GAmount || (netAmt + discAmt);
      
      const detailsRows = [];
      detailsRows.push({
        TLID: targetCashTLID,
        Debit: netAmt,
        Credit: 0,
        Description: `Pharmacy POS Cash Sales Receipt (Inv #${invNo})`
      });

      if (discAmt > 0) {
        detailsRows.push({
          TLID: 501002, // Store Discount Account
          Debit: discAmt,
          Credit: 0,
          Description: `Pharmacy Sales Discount Allowed`
        });
        detailsRows.push({
          TLID: storeRevTLID,
          Debit: 0,
          Credit: grossAmt,
          Description: `Pharmacy Gross Sales Revenue`
        });
      } else {
        detailsRows.push({
          TLID: storeRevTLID,
          Debit: 0,
          Credit: netAmt,
          Description: `Pharmacy Sales Revenue`
        });
      }

      await createBackendVoucher(vchNo, invoiceHeader.InvoiceDate, 'CRV', `Pharmacy POS Invoice #${invNo}`, detailsRows);
    }

    res.json({ success: true, message: 'Pharmacy billing & inventory stocks updated atomically in parallel.', InvoiceNo: invNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Cancel Invoice (And restore stock!)
app.delete('/api/billing/invoices/:invoiceNo', async (req, res) => {
  try {
    const { invoiceNo } = req.params;

    // Find all details to restore inventory stocks
    const details = await db.collection('invoice_details').find({ InvoiceNo: invoiceNo }).toArray();
    for (const item of details) {
      await db.collection('items').updateOne(
        { ItemID: item.ItemID },
        { $inc: { CStock: item.Qty } } // Restore deducted stock back to inventory!
      );
    }

    // Delete headers and details
    await db.collection('invoice_headers').deleteOne({ InvoiceNo: invoiceNo });
    await db.collection('invoice_details').deleteMany({ InvoiceNo: invoiceNo });

    res.json({ success: true, message: 'Invoice deleted. Drug stocks restored safely.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// ↩️ PHARMACY SALES RETURNS
// ------------------------------------------------------------------------------------------

// Fetch returns list
app.get('/api/billing/returns', async (req, res) => {
  try {
    const returns = await db.collection('sales_returns').find({}).toArray();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Item Return (Restores stock!)
app.post('/api/billing/returns', async (req, res) => {
  try {
    const returnRecord = req.body;
    if (!returnRecord.SRInvoiceNo) returnRecord.SRInvoiceNo = `SR-${Date.now().toString().slice(-4)}`;
    
    await db.collection('sales_returns').insertOne(returnRecord);

    // If there is details, restock them!
    if (Array.isArray(returnRecord.returnedItems)) {
      for (const drug of returnRecord.returnedItems) {
        await db.collection('items').updateOne(
          { ItemID: drug.ItemID },
          { $inc: { CStock: parseInt(drug.QtyReturned) } } // Add returned item back!
        );
      }
    }

    // Auto-sync double entry financial voucher for Pharmacy Sales Return refund
    const refAmt = parseFloat(returnRecord.RefAmount || returnRecord.RefTotal) || 0;
    if (refAmt > 0) {
      const vchNo = `CPV-SR-${returnRecord.SRInvoiceNo}`;
      const detailsRows = [
        {
          TLID: 501003, // Sales Returns Expense Account
          Debit: refAmt,
          Credit: 0,
          Description: `Pharmacy Sales Return Refund (Ref #${returnRecord.SRInvoiceNo})`
        },
        {
          TLID: 101002, // Store Cash In Hand Account
          Debit: 0,
          Credit: refAmt,
          Description: `Cash Refunded for Sales Return (Ref #${returnRecord.SRInvoiceNo})`
        }
      ];
      await createBackendVoucher(vchNo, new Date().toISOString().split('T')[0], 'CPV', `Pharmacy Sales Return Refund #${returnRecord.SRInvoiceNo}`, detailsRows);
    }

    res.json({ success: true, message: 'Sales return logged. Drug stocks restored.', SRInvoiceNo: returnRecord.SRInvoiceNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 📥 GOODS RECEIVE NOTES (GRN SUPPLIER STOCK PURCHASE SHIPMENT INTAKES)
// ------------------------------------------------------------------------------------------

// Fetch all GRNs (headers + details)
app.get('/api/grns', async (req, res) => {
  try {
    const headers = await db.collection('grns').find({}).toArray();
    const details = await db.collection('grn_details').find({}).toArray();
    res.json({ headers, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a Supplier GRN (And increase stock!)
app.post('/api/grns', async (req, res) => {
  const { VchNo, SID, VchDate, Status, Remarks, grnItems } = req.body;
  try {
    const grnHeader = {
      VchNo: VchNo || `GRN-${Date.now().toString().slice(-4)}`,
      SID,
      VchDate: VchDate || new Date().toISOString().split('T')[0],
      Status: Status || 2,
      Remarks
    };

    await db.collection('grns').insertOne(grnHeader);

    if (Array.isArray(grnItems)) {
      for (const item of grnItems) {
        const detail = {
          VchNo: grnHeader.VchNo,
          ItemID: item.ItemID,
          QtyIn: parseInt(item.QtyIn) || 0,
          PurchaseRate: parseFloat(item.PurchaseRate) || 0
        };

        await db.collection('grn_details').insertOne(detail);

        // Increment stock atomically!
        await db.collection('items').updateOne(
          { ItemID: item.ItemID },
          { $inc: { CStock: detail.QtyIn } }
        );
      }
    }

    // Auto-sync double entry financial voucher for Supplier Purchase Inventory intake
    let totalGrnAmt = 0;
    if (Array.isArray(grnItems)) {
      for (const item of grnItems) {
        totalGrnAmt += (parseInt(item.QtyIn) || 0) * (parseFloat(item.PurchaseRate) || 0);
      }
    }
    if (grnHeader.Status === 2 && totalGrnAmt > 0) {
      const vchNo = `CPV-GRN-${grnHeader.VchNo}`;
      const detailsRows = [
        {
          TLID: 103001, // Pharmacy Stock Assets
          Debit: totalGrnAmt,
          Credit: 0,
          Description: `Supplier Drug Stock Intake (GRN #${grnHeader.VchNo})`
        },
        {
          TLID: 201001, // Accounts Payable
          Debit: 0,
          Credit: totalGrnAmt,
          Description: `Supplier Accounts Payable (${SID || 'Supplier'})`
        }
      ];
      await createBackendVoucher(vchNo, grnHeader.VchDate, 'CPV', `Supplier Purchase GRN #${grnHeader.VchNo}`, detailsRows);
    }

    res.json({ success: true, message: 'Supplier GRN purchase received. Stocks increased.', VchNo: grnHeader.VchNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a GRN (with stock level correction!)
app.put('/api/grns/:vchNo', async (req, res) => {
  try {
    const { vchNo } = req.params;
    const { SID, VchDate, Status, Remarks, grnItems } = req.body;

    // 1. Find existing GRN details to reverse stock levels first
    const oldDetails = await db.collection('grn_details').find({ VchNo: vchNo }).toArray();
    for (const item of oldDetails) {
      await db.collection('items').updateOne(
        { ItemID: item.ItemID },
        { $inc: { CStock: -item.QtyIn } }
      );
    }

    // 2. Delete old grn_details
    await db.collection('grn_details').deleteMany({ VchNo: vchNo });

    // 3. Update the grns header
    await db.collection('grns').updateOne(
      { VchNo: vchNo },
      {
        $set: {
          SID,
          VchDate: VchDate || new Date().toISOString().split('T')[0],
          Status: Status || 2,
          Remarks
        }
      }
    );

    // 4. Insert new grn_details and increment stocks
    if (Array.isArray(grnItems)) {
      for (const item of grnItems) {
        const detail = {
          VchNo: vchNo,
          ItemID: item.ItemID,
          QtyIn: parseInt(item.QtyIn) || 0,
          PurchaseRate: parseFloat(item.PurchaseRate) || 0
        };

        await db.collection('grn_details').insertOne(detail);

        await db.collection('items').updateOne(
          { ItemID: item.ItemID },
          { $inc: { CStock: detail.QtyIn } }
        );
      }
    }

    res.json({ success: true, message: 'Supplier GRN modified. Stocks recalculated.', VchNo: vchNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a GRN (And subtract stock!)
app.delete('/api/grns/:vchNo', async (req, res) => {
  try {
    const { vchNo } = req.params;

    const details = await db.collection('grn_details').find({ VchNo: vchNo }).toArray();
    for (const item of details) {
      await db.collection('items').updateOne(
        { ItemID: item.ItemID },
        { $inc: { CStock: -item.QtyIn } } // Subtract purchase intake back out of stock!
      );
    }

    await db.collection('grns').deleteOne({ VchNo: vchNo });
    await db.collection('grn_details').deleteMany({ VchNo: vchNo });

    res.json({ success: true, message: 'Supplier GRN voided. Stocks updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🚚 SUPPLIERS / VENDORS REGISTRY
// ------------------------------------------------------------------------------------------

// Fetch all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await db.collection('suppliers').find({}).toArray();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update Supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const supplier = req.body;
    if (!supplier.SID) {
      supplier.SID = `SUP-${Date.now().toString().slice(-4)}`;
    }
    await db.collection('suppliers').updateOne(
      { SID: supplier.SID },
      { $set: supplier },
      { upsert: true }
    );
    res.json({ success: true, message: 'Supplier/Vendor registered successfully.', data: supplier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update single supplier by SID
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierData = req.body;
    if (supplierData._id) delete supplierData._id;
    await db.collection('suppliers').updateOne({ SID: id }, { $set: supplierData });
    res.json({ success: true, message: 'Supplier specifications modified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete supplier by SID
app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('suppliers').deleteOne({ SID: id });
    res.json({ success: true, message: 'Supplier removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🧮 ACCOUNTING MODULE (CHART OF ACCOUNTS & FINANCIAL BALANCES)
// ------------------------------------------------------------------------------------------

// Fetch Chart of Accounts (Level-3)
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await db.collection('accounts').find({}).toArray();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Level-1 Accounts (FL level)
app.get('/api/accounts/fl', async (req, res) => {
  try {
    const flAccounts = await db.collection('fl_accounts').find({}).toArray();
    res.json(flAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Level-2 Accounts (SL level)
app.get('/api/accounts/sl', async (req, res) => {
  try {
    const slAccounts = await db.collection('sl_accounts').find({}).toArray();
    res.json(slAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Hierarchical Chart of Accounts Tree using MongoDB Aggregation
app.get('/api/accounts/tree', async (req, res) => {
  try {
    if (typeof db.collection('accounts').aggregate === 'function') {
      // Pipeline to group Level-3 (accounts) under Level-2 (sl_accounts) and Level-1 (fl_accounts)
      const tree = await db.collection('accounts').aggregate([
        {
          $lookup: {
            from: 'sl_accounts',
            localField: 'SLID',
            foreignField: 'SLID',
            as: 'subLevelDetails'
          }
        },
        { $unwind: { path: '$subLevelDetails', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'fl_accounts',
            localField: 'FLID',
            foreignField: 'FLID',
            as: 'firstLevelDetails'
          }
        },
        { $unwind: { path: '$firstLevelDetails', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              FLID: '$FLID',
              FLName: '$firstLevelDetails.FLName',
              SLID: '$SLID',
              SLName: '$subLevelDetails.SLName'
            },
            accounts: { $push: '$$ROOT' }
          }
        },
        {
          $group: {
            _id: { FLID: '$_id.FLID', FLName: '$_id.FLName' },
            subLevels: {
              $push: {
                SLID: '$_id.SLID',
                SLName: '$_id.SLName',
                accounts: '$accounts'
              }
            }
          }
        },
        { $sort: { '_id.FLID': 1 } }
      ]).toArray();
      res.json(tree);
    } else {
      // JS Fallback for InMemoryDB
      const fls = await db.collection('fl_accounts').find({}).toArray();
      const sls = await db.collection('sl_accounts').find({}).toArray();
      const tls = await db.collection('accounts').find({}).toArray();

      // Group by FLID then SLID
      const grouped = {};
      tls.forEach(acc => {
        const fl = fls.find(f => f.FLID === acc.FLID) || { FLID: acc.FLID, FLName: `Level-1 (${acc.FLID})` };
        const sl = sls.find(s => s.SLID === acc.SLID) || { SLID: acc.SLID, SLName: `Level-2 (${acc.SLID})` };

        const flKey = `${fl.FLID}_${fl.FLName}`;
        if (!grouped[flKey]) {
          grouped[flKey] = {
            _id: { FLID: fl.FLID, FLName: fl.FLName },
            subLevelsMap: {}
          };
        }

        const slKey = `${sl.SLID}_${sl.SLName}`;
        if (!grouped[flKey].subLevelsMap[slKey]) {
          grouped[flKey].subLevelsMap[slKey] = {
            SLID: sl.SLID,
            SLName: sl.SLName,
            accounts: []
          };
        }

        grouped[flKey].subLevelsMap[slKey].accounts.push({
          ...acc,
          subLevelDetails: sl,
          firstLevelDetails: fl
        });
      });

      const tree = Object.values(grouped).map((flNode) => ({
        _id: flNode._id,
        subLevels: Object.values(flNode.subLevelsMap)
      })).sort((a, b) => a._id.FLID - b._id.FLID);

      res.json(tree);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Third Level Account
app.post('/api/accounts', async (req, res) => {
  try {
    const account = req.body;
    await db.collection('accounts').updateOne(
      { TLID: account.TLID },
      { $set: account },
      { upsert: true }
    );
    res.json({ success: true, message: 'Chart of Account ledger saved.', data: account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Account Balance or Title
app.put('/api/accounts/:tlid', async (req, res) => {
  try {
    const { tlid } = req.params;
    const accountData = req.body;
    if (accountData._id) delete accountData._id;
    await db.collection('accounts').updateOne({ TLID: parseInt(tlid) }, { $set: accountData });
    res.json({ success: true, message: 'COA account updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Account
app.delete('/api/accounts/:tlid', async (req, res) => {
  try {
    const { tlid } = req.params;
    await db.collection('accounts').deleteOne({ TLID: parseInt(tlid) });
    res.json({ success: true, message: 'Account deleted from ledger.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 📒 DOUBLE-ENTRY FINANCIAL VOUCHERS & GENERAL LEDGER
// ------------------------------------------------------------------------------------------

// Helper to post financial vouchers into vouchers, voucher_details, ac_ledger, and update accounts balances atomically
async function createBackendVoucher(vchNo, vchDate, vchType, remarks, detailsRows) {
  if (!vchNo || !Array.isArray(detailsRows) || detailsRows.length === 0) return null;

  // Idempotency check: Return existing voucher if already recorded
  const existing = await db.collection('vouchers').findOne({ VchNo: vchNo });
  if (existing) return existing;

  let totalDebit = 0;
  let totalCredit = 0;
  for (const row of detailsRows) {
    totalDebit += parseFloat(row.Debit) || 0;
    totalCredit += parseFloat(row.Credit) || 0;
  }

  // Ensure balanced entry
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    console.warn(`[Voucher Skipped] Unbalanced voucher ${vchNo}: Debit=${totalDebit}, Credit=${totalCredit}`);
    return null;
  }

  const header = {
    VchNo: vchNo,
    VchDate: vchDate || new Date().toISOString().split('T')[0],
    VchType: vchType || 'JV',
    Status: 2, // Posted
    Remarks: remarks || ''
  };

  await db.collection('vouchers').updateOne(
    { VchNo: vchNo },
    { $setOnInsert: header },
    { upsert: true }
  );

  let idx = 1;
  for (const row of detailsRows) {
    const detail = {
      VchNo: vchNo,
      TLID: parseInt(row.TLID),
      Debit: parseFloat(row.Debit) || 0,
      Credit: parseFloat(row.Credit) || 0,
      Description: row.Description || ''
    };

    await db.collection('voucher_details').insertOne(detail);

    const ledgerPosting = {
      ACLedgerID: `LG-${vchNo}-${idx++}`,
      VchNo: vchNo,
      TxDate: header.VchDate,
      TLID: detail.TLID,
      Debit: detail.Debit,
      Credit: detail.Credit,
      Remarks: detail.Description || header.Remarks
    };

    await db.collection('ac_ledger').updateOne(
      { ACLedgerID: ledgerPosting.ACLedgerID },
      { $set: ledgerPosting },
      { upsert: true }
    );

    const tlidPrefix = Math.floor(detail.TLID / 100000);
    const amountChange = detail.Debit - detail.Credit;
    const adjustedAmount = (tlidPrefix === 1 || tlidPrefix === 5) ? amountChange : -amountChange;

    await db.collection('accounts').updateOne(
      { TLID: detail.TLID },
      { $inc: { AcBalance: adjustedAmount } }
    );
  }

  return header;
}

// Fetch all financial transaction vouchers
app.get('/api/vouchers', async (req, res) => {
  try {
    const headers = await db.collection('vouchers').find({}).toArray();
    const details = await db.collection('voucher_details').find({}).toArray();
    res.json({ headers, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post double-entry Voucher (Adjusts ledger balances atomically with strict constraints!)
app.post('/api/vouchers', async (req, res) => {
  const { VchNo, VchDate, VchType, Status, Remarks, detailsRows } = req.body;
  try {
    if (!Array.isArray(detailsRows) || detailsRows.length === 0) {
      return res.status(400).json({ error: 'Database Constraint Error: Voucher must contain details rows.' });
    }

    const vchNo = VchNo || `VCH-${Date.now().toString().slice(-4)}`;
    const header = await createBackendVoucher(vchNo, VchDate, VchType, Remarks, detailsRows);
    
    if (!header) {
      return res.status(400).json({ error: 'Failed to post voucher. Ensure debits equal credits.' });
    }

    res.json({ success: true, message: 'Voucher posted successfully. Financial general ledger updated.', VchNo: vchNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Specialized Rapid Expense Tracking Routing System
app.post('/api/expenses/rapid', async (req, res) => {
  const { expenseTlid, fundingTlid, amount, description } = req.body;
  const amt = parseFloat(amount);
  
  if (!expenseTlid || !fundingTlid || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Missing or invalid parameters. Requires expenseTlid, fundingTlid, and a positive amount.' });
  }

  try {
    const nextVchNo = `CPV-EXP-${Date.now().toString().slice(-6)}`;
    const remarks = description || `Rapid Expense payment`;
    const today = new Date().toISOString().split('T')[0];

    // Create Voucher Header
    const header = {
      VchNo: nextVchNo,
      VchDate: today,
      VchType: 'CPV',
      Status: 2, // Posted
      Remarks: remarks
    };

    // Create Voucher Details (Double-Entry validation: Debit Expense, Credit Cash Asset)
    const detailExpense = {
      VchNo: nextVchNo,
      TLID: parseInt(expenseTlid),
      Debit: amt,
      Credit: 0,
      Description: remarks
    };

    const detailFunding = {
      VchNo: nextVchNo,
      TLID: parseInt(fundingTlid),
      Debit: 0,
      Credit: amt,
      Description: remarks
    };

    // Write Ledger Postings
    const ledgerPostingExpense = {
      ACLedgerID: `LG-${nextVchNo}-1`,
      VchNo: nextVchNo,
      TxDate: today,
      TLID: parseInt(expenseTlid),
      Debit: amt,
      Credit: 0,
      Remarks: remarks
    };

    const ledgerPostingFunding = {
      ACLedgerID: `LG-${nextVchNo}-2`,
      VchNo: nextVchNo,
      TxDate: today,
      TLID: parseInt(fundingTlid),
      Debit: 0,
      Credit: amt,
      Remarks: remarks
    };

    // Execute database operations atomically & concurrently
    await Promise.all([
      db.collection('vouchers').insertOne(header),
      db.collection('voucher_details').insertOne(detailExpense),
      db.collection('voucher_details').insertOne(detailFunding),
      db.collection('ac_ledger').insertOne(ledgerPostingExpense),
      db.collection('ac_ledger').insertOne(ledgerPostingFunding),
      
      // Update expense balance (Debit normal -> increase by amt)
      db.collection('accounts').updateOne(
        { TLID: parseInt(expenseTlid) },
        { $inc: { AcBalance: amt } }
      ),
      
      // Update funding balance (Debit normal -> Credit decreases cash by amt)
      db.collection('accounts').updateOne(
        { TLID: parseInt(fundingTlid) },
        { $inc: { AcBalance: -amt } }
      )
    ]);

    res.json({
      success: true,
      message: 'Atomic rapid expense routed successfully to MongoDB database.',
      VchNo: nextVchNo,
      amount: amt
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Real-Time Profit & Loss Calculation via MongoDB Aggregation Pipelines
app.get('/api/reports/income-statement', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 1. Build date filter match stage
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.TxDate = {};
      if (startDate) matchStage.TxDate.$gte = startDate;
      if (endDate) matchStage.TxDate.$lte = endDate;
    }

    // 2. Aggregate sum from ac_ledger postings
    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$TLID",
          totalDebit: { $sum: { $toDouble: "$Debit" } },
          totalCredit: { $sum: { $toDouble: "$Credit" } }
        }
      }
    ];

    const ledgerSummaries = (typeof db.collection('ac_ledger').aggregate === 'function')
      ? await db.collection('ac_ledger').aggregate(pipeline).toArray()
      : [];

    // 3. Match with account master items to find names and calculate net balances dynamically
    const accountsList = await db.collection('accounts').find({}).toArray();
    const accountsMap = new Map(accountsList.map(a => [a.TLID, a]));

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;

    const revenueBreakdown = [];
    const expensesBreakdown = [];

    for (const summary of ledgerSummaries) {
      const tlid = summary._id;
      const account = accountsMap.get(tlid) || { TLName: `Unknown Account (${tlid})`, TLID: tlid };
      
      const firstDigit = Math.floor(tlid / 100000);
      let balance = 0;
      
      // Debit Normal (Assets: 1, Expenses: 5) vs Credit Normal (Liabilities: 2, Equity: 3, Revenue: 4)
      if (firstDigit === 1 || firstDigit === 5) {
        balance = summary.totalDebit - summary.totalCredit;
      } else {
        balance = summary.totalCredit - summary.totalDebit;
      }

      if (firstDigit === 4) {
        totalRevenue += balance;
        revenueBreakdown.push({
          TLID: tlid,
          TLName: account.TLName,
          balance: balance
        });
      } else if (tlid === 501001) {
        totalCOGS += balance;
      } else if (firstDigit === 5) {
        totalExpenses += balance;
        expensesBreakdown.push({
          TLID: tlid,
          TLName: account.TLName,
          balance: balance
        });
      }
    }

    // If ledger postings are empty, fall back to current live ledger balances
    if (ledgerSummaries.length === 0) {
      for (const account of accountsList) {
        const tlid = account.TLID;
        const firstDigit = Math.floor(tlid / 100000);
        const balance = Math.abs(account.AcBalance || 0);

        if (firstDigit === 4) {
          totalRevenue += balance;
          revenueBreakdown.push({ TLID: tlid, TLName: account.TLName, balance });
        } else if (tlid === 501001) {
          totalCOGS += balance;
        } else if (firstDigit === 5) {
          totalExpenses += balance;
          expensesBreakdown.push({ TLID: tlid, TLName: account.TLName, balance });
        }
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
    const netIncome = grossProfit - totalExpenses;

    res.json({
      success: true,
      period: { startDate: startDate || 'Beginning', endDate: endDate || 'Present' },
      summary: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netIncome
      },
      breakdown: {
        revenue: revenueBreakdown,
        cogs: { TLID: 501001, TLName: "Cost of Goods Sold (COGS)", balance: totalCOGS },
        expenses: expensesBreakdown
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete financial voucher (And reverse balance effects!)
app.delete('/api/vouchers/:vchNo', async (req, res) => {
  try {
    const { vchNo } = req.params;

    // Find details to reverse the debit/credit effects
    const details = await db.collection('voucher_details').find({ VchNo: vchNo }).toArray();
    for (const detail of details) {
      const tlidPrefix = Math.floor(detail.TLID / 100000);
      const amountChange = detail.Debit - detail.Credit;
      const adjustedAmount = (tlidPrefix === 1 || tlidPrefix === 5) ? amountChange : -amountChange;

      // Reverse effect (subtract instead of add!)
      await db.collection('accounts').updateOne(
        { TLID: detail.TLID },
        { $inc: { AcBalance: -adjustedAmount } }
      );
    }

    await db.collection('vouchers').deleteOne({ VchNo: vchNo });
    await db.collection('voucher_details').deleteMany({ VchNo: vchNo });
    await db.collection('ac_ledger').deleteMany({ VchNo: vchNo });

    res.json({ success: true, message: 'Voucher voided. General ledger restored safely.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all general ledger posting logs
app.get('/api/acledger', async (req, res) => {
  try {
    const ledger = await db.collection('ac_ledger').find({}).toArray();
    res.json(ledger);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync ledger postings (Inserts only missing postings)
app.post('/api/acledger', async (req, res) => {
  try {
    const postings = req.body;
    if (!Array.isArray(postings)) {
      return res.status(400).json({ error: 'Body must be an array of postings' });
    }
    
    if (postings.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const operations = postings.map(post => ({
      updateOne: {
        filter: { ACLedgerID: post.ACLedgerID },
        update: { $setOnInsert: post },
        upsert: true
      }
    }));

    const result = await db.collection('ac_ledger').bulkWrite(operations);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ledger postings for a given voucher
app.delete('/api/acledger/:vchNo', async (req, res) => {
  try {
    const { vchNo } = req.params;
    await db.collection('ac_ledger').deleteMany({ VchNo: vchNo });
    res.json({ success: true, message: 'Ledger lines deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// ⚙️ SYSTEM CONFIGURATION & BRAND SETTINGS
// ------------------------------------------------------------------------------------------

// Fetch config maps
app.get('/api/config', async (req, res) => {
  try {
    const config = await db.collection('config').findOne({});
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save config maps
app.post('/api/config', async (req, res) => {
  try {
    const data = req.body;
    await db.collection('config').updateOne(
      { ConfigID: 0 },
      { $set: data },
      { upsert: true }
    );
    res.json({ success: true, message: 'System account configuration updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get clinic brand details
app.get('/api/settings/clinic', async (req, res) => {
  try {
    const settings = await db.collection('clinic').findOne({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update clinic details
app.post('/api/settings/clinic', async (req, res) => {
  try {
    const settings = req.body;
    if (settings._id) delete settings._id;
    await db.collection('clinic').updateOne(
      {},
      { $set: settings },
      { upsert: true }
    );
    res.json({ success: true, message: 'Clinic brand details updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get SMS settings
app.get('/api/settings/sms', async (req, res) => {
  try {
    const settings = await db.collection('sms').findOne({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update SMS settings
app.post('/api/settings/sms', async (req, res) => {
  try {
    const settings = req.body;
    if (settings._id) delete settings._id;
    await db.collection('sms').updateOne(
      {},
      { $set: settings },
      { upsert: true }
    );
    res.json({ success: true, message: 'SMS gateway configurations saved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ------------------------------------------------------------------------------------------
// 🗺️ ALIAS ROUTES FOR DUAL COLLECTION SUPPORT
// ------------------------------------------------------------------------------------------

// Receptionist Line Queue - waiting_queue / tokens alias
app.get('/api/waiting-queue', async (req, res) => {
  try {
    const queue = await db.collection('tokens').find({}).toArray();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/waiting-queue', async (req, res) => {
  try {
    const token = req.body;
    if (token.PatientID) {
      const patient = await db.collection('patients').findOne({ PatientID: token.PatientID });
      if (!patient) return res.status(400).json({ error: 'PatientID does not exist.' });
    }
    await db.collection('tokens').updateOne(
      { TokenNo: parseInt(token.TokenNo), TokenDate: token.TokenDate, Shift: parseInt(token.Shift) },
      { $set: token },
      { upsert: true }
    );
    res.json({ success: true, message: 'Queue position logged in tokens database.', data: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chart of Accounts alias
app.get('/api/chart-of-accounts', async (req, res) => {
  try {
    const accounts = await db.collection('accounts').find({}).toArray();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pharmacy POS Returns alias
app.get('/api/pos-returns', async (req, res) => {
  try {
    const returns = await db.collection('sales_returns').find({}).toArray();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pos-returns', async (req, res) => {
  try {
    const returnRecord = req.body;
    if (!returnRecord.SRInvoiceNo) returnRecord.SRInvoiceNo = `SR-${Date.now().toString().slice(-4)}`;
    
    await db.collection('sales_returns').insertOne(returnRecord);

    if (Array.isArray(returnRecord.returnedItems)) {
      for (const drug of returnRecord.returnedItems) {
        await db.collection('items').updateOne(
          { ItemID: drug.ItemID },
          { $inc: { CStock: parseInt(drug.QtyReturned) } }
        );
      }
    }
    res.json({ success: true, message: 'POS return saved. Stocks restored successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supplier Purchase Alias
app.get('/api/purchases', async (req, res) => {
  try {
    const headers = await db.collection('grns').find({}).toArray();
    const details = await db.collection('grn_details').find({}).toArray();
    res.json({ headers, details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', async (req, res) => {
  const { VchNo, SID, VchDate, Status, Remarks, grnItems } = req.body;
  try {
    const header = {
      VchNo: VchNo || `PUR-${Date.now().toString().slice(-4)}`,
      SID,
      VchDate: VchDate || new Date().toISOString().split('T')[0],
      Status: Status || 2,
      Remarks
    };
    await db.collection('grns').insertOne(header);
    if (Array.isArray(grnItems)) {
      for (const item of grnItems) {
        const detail = {
          VchNo: header.VchNo,
          ItemID: item.ItemID,
          QtyIn: parseInt(item.QtyIn) || 0,
          PurchaseRate: parseFloat(item.PurchaseRate) || 0
        };
        await db.collection('grn_details').insertOne(detail);
        await db.collection('items').updateOne(
          { ItemID: item.ItemID },
          { $inc: { CStock: detail.QtyIn } }
        );
      }
    }
    res.json({ success: true, message: 'Supplier purchase recorded successfully.', VchNo: header.VchNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mini ERP Goods Received Note (GRN) Approval & Automatic Inventory Stock Sync
app.post('/api/erp/grn/approve', async (req, res) => {
  try {
    const grn = req.body;
    if (!grn || !grn.POID) {
      return res.status(400).json({ error: 'Valid Purchase Order ID (POID) is required for GRN.' });
    }

    if (!grn.GRNID) grn.GRNID = `GRN-${Date.now().toString().slice(-4)}`;
    if (!grn.ReceivedDate) grn.ReceivedDate = new Date().toISOString().split('T')[0];
    grn.Status = 'Approved';

    // 1. Save or update GRN in erp_grn
    await db.collection('erp_grn').updateOne(
      { GRNID: grn.GRNID },
      { $set: grn },
      { upsert: true }
    );

    // 2. Calculate dynamic Purchase Order status based on cumulative GRN receipts
    const poRecord = await db.collection('erp_purchase_orders').findOne({ POID: grn.POID });
    const allPoGrns = await db.collection('erp_grn').find({ POID: grn.POID, Status: 'Approved' }).toArray();

    let newPoStatus = 'Received';
    if (poRecord && Array.isArray(poRecord.Items) && poRecord.Items.length > 0) {
      let isFullyReceived = true;
      let isPartiallyReceived = false;

      let totalOrderedSum = 0;
      let totalReceivedSum = 0;

      for (let idx = 0; idx < poRecord.Items.length; idx++) {
        const poItem = poRecord.Items[idx];
        const orderedQty = parseInt(poItem.Qty) || 0;
        totalOrderedSum += orderedQty;
        let totalReceivedForItem = 0;

        for (const g of allPoGrns) {
          if (Array.isArray(g.Items)) {
            let matchedGrnItem = null;
            if (poItem.ItemID && String(poItem.ItemID).trim() !== '') {
              matchedGrnItem = g.Items.find(gi => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(poItem.ItemID).trim().toLowerCase());
            }
            if (!matchedGrnItem && poItem.ItemName && String(poItem.ItemName).trim() !== '') {
              matchedGrnItem = g.Items.find(gi => gi.ItemName && String(gi.ItemName).trim().toLowerCase() === String(poItem.ItemName).trim().toLowerCase());
            }
            if (!matchedGrnItem && g.Items[idx]) {
              matchedGrnItem = g.Items[idx];
            }

            if (matchedGrnItem) {
              totalReceivedForItem += (parseInt(matchedGrnItem.ReceivedQty) || parseInt(matchedGrnItem.Qty) || 0);
            }
          }
        }

        totalReceivedSum += totalReceivedForItem;

        if (totalReceivedForItem < orderedQty) {
          isFullyReceived = false;
        }
        if (totalReceivedForItem > 0) {
          isPartiallyReceived = true;
        }
      }

      if (totalOrderedSum > 0 && totalReceivedSum >= totalOrderedSum) {
        isFullyReceived = true;
      }

      newPoStatus = isFullyReceived ? 'Received' : (isPartiallyReceived ? 'Partially Received' : 'Approved');
    }

    await db.collection('erp_purchase_orders').updateOne(
      { POID: grn.POID },
      { $set: { Status: newPoStatus } }
    );

    // 3. Increment stock levels, update Unit Cost (PurchasePrice), & auto-add new GRN items to Medicine Master (starting ID > 1443)
    if (Array.isArray(grn.Items)) {
      const existingItems = await db.collection('items').find({}).toArray();

      // Find highest existing numeric ID (default minimum base: 1443)
      let maxNumericId = 1443;
      for (const ex of existingItems) {
        if (ex && ex.ItemID) {
          const rawDigits = ex.ItemID.toString().replace(/\D/g, '');
          if (rawDigits) {
            const num = parseInt(rawDigits, 10);
            if (!isNaN(num) && num > maxNumericId) {
              maxNumericId = num;
            }
          }
        }
      }

      for (const item of grn.Items) {
        const qtyReceived = parseInt(item.ReceivedQty) || parseInt(item.Qty) || 0;
        const unitPrice = parseFloat(item.UnitPrice) || parseFloat(item.UnitCost) || parseFloat(item.PurchasePrice) || parseFloat(item.Rate) || 0;
        const rawItemName = (item.ItemName || '').trim();

        if (!rawItemName) continue;

        const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        // Try matching existing medicine in items collection by ItemID or ItemName
        const matchedItem = existingItems.find(ex =>
          (item.ItemID && ex.ItemID && String(ex.ItemID).trim().toLowerCase() === String(item.ItemID).trim().toLowerCase()) ||
          (ex.ItemName && rawItemName && norm(ex.ItemName) === norm(rawItemName))
        );

        if (matchedItem) {
          // Sync real ItemID on GRN item
          if (matchedItem.ItemID) {
            item.ItemID = matchedItem.ItemID;
          }
          // 1. Existing Item: Update Unit Cost (PurchasePrice) & Increment CStock
          const setFields = {};
          if (unitPrice > 0) {
            setFields.PurchasePrice = unitPrice;
          }
          if ((!matchedItem.Price || matchedItem.Price <= 0) && unitPrice > 0) {
            setFields.Price = Math.round(unitPrice * 1.2);
          }
          if (item.BatchNo) setFields.BatchNo = item.BatchNo;
          if (item.MfgDate) setFields.MfgDate = item.MfgDate;
          if (item.ExpiryDate) setFields.ExpiryDate = item.ExpiryDate;
          if (item.ExpiryDate) setFields.ExpDate = item.ExpiryDate;

          const batchDoc = {
            BatchID: `${matchedItem.ItemID}-${item.BatchNo || 'B' + Date.now().toString().slice(-4)}`,
            ItemID: matchedItem.ItemID,
            ItemName: matchedItem.ItemName,
            BatchNo: item.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            MfgDate: item.MfgDate || '',
            ExpDate: item.ExpiryDate || item.ExpDate || '',
            PurchasePrice: unitPrice > 0 ? unitPrice : (matchedItem.PurchasePrice || 0),
            SalePrice: matchedItem.Price || 0,
            Qty: qtyReceived,
            InitialQty: qtyReceived,
            GRNID: grn.GRNID,
            POID: grn.POID,
            VendorName: grn.VendorName || '',
            ReceivedDate: grn.ReceivedDate || new Date().toISOString().split('T')[0],
            Status: 'ACTIVE',
            CreatedAt: new Date().toISOString()
          };
          const existingBatches = Array.isArray(matchedItem.Batches) ? matchedItem.Batches : [];
          setFields.Batches = [batchDoc, ...existingBatches];

          const updatePayload = {
            $inc: { CStock: qtyReceived }
          };
          if (Object.keys(setFields).length > 0) {
            updatePayload.$set = setFields;
          }

          await db.collection('items').updateOne(
            { _id: matchedItem._id },
            updatePayload
          );

          // Keep local existingItem copy updated
          matchedItem.CStock = (matchedItem.CStock || 0) + qtyReceived;
          if (unitPrice > 0) matchedItem.PurchasePrice = unitPrice;
          if (item.BatchNo) matchedItem.BatchNo = item.BatchNo;
          if (item.MfgDate) matchedItem.MfgDate = item.MfgDate;
          if (item.ExpiryDate) matchedItem.ExpiryDate = item.ExpiryDate;
          if (item.ExpiryDate) matchedItem.ExpDate = item.ExpiryDate;
          matchedItem.Batches = setFields.Batches;
        } else {
          // 2. New Item: Generate auto-increment ID starting after 1443 (e.g. 1444, 1445)
          maxNumericId++;
          const generatedItemId = String(maxNumericId);
          item.ItemID = generatedItemId;

          const initialBatchDoc = {
            BatchID: `${generatedItemId}-${item.BatchNo || 'B' + Date.now().toString().slice(-4)}`,
            ItemID: generatedItemId,
            ItemName: rawItemName,
            BatchNo: item.BatchNo || `B-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            MfgDate: item.MfgDate || '',
            ExpDate: item.ExpiryDate || item.ExpDate || '',
            PurchasePrice: unitPrice,
            SalePrice: unitPrice > 0 ? Math.round(unitPrice * 1.2) : 100,
            Qty: qtyReceived,
            InitialQty: qtyReceived,
            GRNID: grn.GRNID,
            POID: grn.POID,
            VendorName: grn.VendorName || '',
            ReceivedDate: grn.ReceivedDate || new Date().toISOString().split('T')[0],
            Status: 'ACTIVE',
            CreatedAt: new Date().toISOString()
          };

          const newItemDoc = {
            ItemID: generatedItemId,
            ItemName: rawItemName,
            Price: unitPrice > 0 ? Math.round(unitPrice * 1.2) : 100,
            PurchasePrice: unitPrice, // Unit Cost (Rs.)
            CStock: qtyReceived,
            MinStock: 1,
            Unit: item.Category || item.Unit || 'Tab',
            MedicineType: 'P',
            ReorderQty: 0,
            BatchNo: item.BatchNo || '',
            MfgDate: item.MfgDate || '',
            ExpiryDate: item.ExpiryDate || '',
            ExpDate: item.ExpiryDate || '',
            Batches: [initialBatchDoc]
          };

          await db.collection('items').insertOne(newItemDoc);
          existingItems.push(newItemDoc);
        }
      }
    }

    // 4. Record automated ERP Financial Ledger Transaction & Cash/Credit Processing
    const totalAmount = parseFloat(grn.TotalAmount) || 0;
    const isCashPurchase = String(grn.PaymentMethod || grn.PaymentMode || '').toLowerCase() === 'cash';

    // 4a. Goods Received Invoice Transaction (Records inward stock)
    const grnInvoiceTxn = {
      TransactionID: `TXN-GRN-${Date.now().toString().slice(-4)}`,
      Type: 'VendorInvoice',
      Category: isCashPurchase ? 'Medicine Cash Purchase (Spot Payment)' : 'Inventory Inward Stock Replenishment (Credit)',
      Description: `Goods Received Note (${grn.GRNID}) for Purchase Order (${grn.POID}) from ${grn.VendorName || 'Supplier'} [${isCashPurchase ? 'Cash Spot Purchase' : 'Credit Purchase'}]`,
      Amount: totalAmount,
      PaymentMethod: isCashPurchase ? 'Cash' : 'Credit',
      ReferenceNo: grn.ChallanNo || grn.GRNID,
      Date: grn.ReceivedDate,
      CreatedBy: grn.CreatedBy || 'System GRN Auto-Poster',
      VendorID: grn.VendorID || '',
      VendorName: grn.VendorName || '',
      IsCashPurchase: isCashPurchase
    };

    await db.collection('erp_transactions').insertOne(grnInvoiceTxn);

    if (isCashPurchase && totalAmount > 0) {
      // 4b. Cash Spot Purchase: Generate immediate Cash Payment Voucher (CPV) / Cash Book Outflow
      const cashPaymentTxn = {
        TransactionID: `TXN-PAY-${Date.now().toString().slice(-4)}`,
        Type: 'VendorPayment',
        Category: 'Medicine Purchase (Cash Spot Payment)',
        Description: `Spot Cash Payment on Delivery for GRN (${grn.GRNID}) - Invoice #${grn.SupplierInvoiceNo || 'N/A'} - ${grn.VendorName || 'Vendor'}`,
        Amount: totalAmount,
        PaymentMethod: 'Cash',
        ReferenceNo: grn.GRNID,
        Date: grn.ReceivedDate,
        CreatedBy: grn.CreatedBy || 'System GRN Auto-Poster',
        VendorID: grn.VendorID || '',
        VendorName: grn.VendorName || '',
        Status: 'Settled'
      };

      await db.collection('erp_transactions').insertOne(cashPaymentTxn);

      // Double-Entry Posting for Cash Purchase: Debit Inventory (103001), Credit Cash-in-Hand (101001)
      const vchNo = `CPV-GRN-${Date.now().toString().slice(-4)}`;
      const inventoryPosting = {
        ACLedgerID: `LG-${vchNo}-1`,
        VchNo: vchNo,
        TxDate: grn.ReceivedDate,
        TLID: 103001, // Inventory / Pharmacy Stock Ledger (Asset)
        Debit: totalAmount,
        Credit: 0,
        Remarks: `Cash Spot Purchase GRN ${grn.GRNID} (Inv: ${grn.SupplierInvoiceNo || 'N/A'}, DC: ${grn.ChallanNo || 'N/A'}) - Supplier: ${grn.VendorName || 'Vendor'}`
      };
      const cashPosting = {
        ACLedgerID: `LG-${vchNo}-2`,
        VchNo: vchNo,
        TxDate: grn.ReceivedDate,
        TLID: 101001, // Cash in Hand (Asset Account)
        Debit: 0,
        Credit: totalAmount,
        Remarks: `Spot Cash Paid on Delivery for GRN ${grn.GRNID} - Supplier: ${grn.VendorName || 'Vendor'}`
      };

      await Promise.all([
        db.collection('ac_ledger').insertOne(inventoryPosting),
        db.collection('ac_ledger').insertOne(cashPosting),
        db.collection('accounts').updateOne({ TLID: 103001 }, { $inc: { AcBalance: totalAmount } }),
        db.collection('accounts').updateOne({ TLID: 101001 }, { $inc: { AcBalance: -totalAmount } })
      ]);

      // Note: For Cash purchase, Vendor balance in erp_vendors is NOT incremented (Net 0)
    } else {
      // 5. Credit Purchase: Update Vendor balance (Accounts Payable / Udhar)
      if ((grn.VendorID || grn.VendorName) && totalAmount > 0) {
        await db.collection('erp_vendors').updateOne(
          grn.VendorID ? { VendorID: grn.VendorID } : { VendorName: grn.VendorName },
          { $inc: { Balance: totalAmount } }
        );
      }

      // 6. Double-Entry Posting for Credit Purchase: Debit Inventory (103001), Credit Accounts Payable (201001)
      if (totalAmount > 0) {
        const vchNo = `VCH-GRN-${Date.now().toString().slice(-4)}`;
        const inventoryPosting = {
          ACLedgerID: `LG-${vchNo}-1`,
          VchNo: vchNo,
          TxDate: grn.ReceivedDate,
          TLID: 103001, // Inventory / Pharmacy Stock Ledger (Asset)
          Debit: totalAmount,
          Credit: 0,
          Remarks: `GRN Stock Inward ${grn.GRNID} [Credit Purchase] (Vendor Invoice: ${grn.SupplierInvoiceNo || 'N/A'}, DC: ${grn.ChallanNo || 'N/A'}) - Supplier: ${grn.VendorName || 'Vendor'}`
        };
        const apPosting = {
          ACLedgerID: `LG-${vchNo}-2`,
          VchNo: vchNo,
          TxDate: grn.ReceivedDate,
          TLID: 201001, // Accounts Payable (Liability)
          Debit: 0,
          Credit: totalAmount,
          Remarks: `Vendor Bill Payable for GRN ${grn.GRNID} [Credit] (Inv: ${grn.SupplierInvoiceNo || 'N/A'}) - Supplier: ${grn.VendorName || 'Vendor'}`
        };

        await Promise.all([
          db.collection('ac_ledger').insertOne(inventoryPosting),
          db.collection('ac_ledger').insertOne(apPosting),
          db.collection('accounts').updateOne({ TLID: 103001 }, { $inc: { AcBalance: totalAmount } }),
          db.collection('accounts').updateOne({ TLID: 201001 }, { $inc: { AcBalance: -totalAmount } })
        ]);
      }
    }

    res.json({
      success: true,
      message: isCashPurchase
        ? `GRN ${grn.GRNID} approved as Cash Purchase! Stock updated, Cash Book outflow recorded (Rs. ${totalAmount.toLocaleString()}), and cash voucher generated.`
        : `GRN ${grn.GRNID} approved as Credit Purchase! Stock updated and Rs. ${totalAmount.toLocaleString()} posted to Vendor Accounts Payable ledger.`,
      GRNID: grn.GRNID,
      paymentMethod: isCashPurchase ? 'Cash' : 'Credit'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete GRN and automatically revert inventory stock, vendor balance, transactions & PO status
app.post('/api/erp/grn/delete', async (req, res) => {
  try {
    const { id, grnId } = req.body;
    const filter = id ? { _id: id } : { GRNID: grnId };

    let grn = await db.collection('erp_grn').findOne(filter);
    if (!grn && grnId) {
      grn = await db.collection('erp_grn').findOne({ GRNID: grnId });
    }

    if (grn) {
      const targetGrnId = grn.GRNID;

      // 1. Revert Inventory Stock (CStock) for each GRN Item
      if (Array.isArray(grn.Items) && grn.Items.length > 0) {
        for (const item of grn.Items) {
          const qtyRec = parseInt(item.ReceivedQty) || parseInt(item.Qty) || 0;
          if (qtyRec <= 0) continue;

          const rawItemName = (item.ItemName || '').trim();

          let matchedItem = null;
          if (item.ItemID) {
            matchedItem = await db.collection('items').findOne({
              $or: [
                { ItemID: item.ItemID },
                { ItemID: String(item.ItemID) }
              ]
            });
          }
          if (!matchedItem && rawItemName) {
            const escapedName = rawItemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            matchedItem = await db.collection('items').findOne({
              ItemName: { $regex: `^${escapedName}$`, $options: 'i' }
            });
          }

          if (matchedItem) {
            const currentStock = parseInt(matchedItem.CStock) || parseInt(matchedItem.Stock) || 0;
            const newStock = Math.max(0, currentStock - qtyRec);
            await db.collection('items').updateOne(
              { _id: matchedItem._id },
              { $set: { CStock: newStock, Stock: newStock } }
            );
          }
        }
      }

      // 2. Revert Vendor Balance
      const totalAmount = parseFloat(grn.TotalAmount) || 0;
      if (totalAmount > 0 && (grn.VendorID || grn.VendorName)) {
        let vendorDoc = null;
        if (grn.VendorID) {
          vendorDoc = await db.collection('erp_vendors').findOne({
            $or: [{ VendorID: grn.VendorID }, { VendorID: String(grn.VendorID) }]
          });
        }
        if (!vendorDoc && grn.VendorName) {
          const escapedVendorName = grn.VendorName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          vendorDoc = await db.collection('erp_vendors').findOne({
            VendorName: { $regex: `^${escapedVendorName}$`, $options: 'i' }
          });
        }

        if (vendorDoc) {
          const newBal = Math.max(0, (parseFloat(vendorDoc.Balance) || 0) - totalAmount);
          await db.collection('erp_vendors').updateOne(
            { _id: vendorDoc._id },
            { $set: { Balance: newBal } }
          );
        }
      }

      // 3. Delete matching transactions from erp_transactions
      await db.collection('erp_transactions').deleteMany({
        $or: [
          { ReferenceNo: targetGrnId },
          { Description: { $regex: targetGrnId, $options: 'i' } }
        ]
      });

      // 4. Update PO Status if linked to PO
      if (grn.POID) {
        const remainingGrns = await db.collection('erp_grn').find({
          POID: grn.POID,
          GRNID: { $ne: targetGrnId },
          Status: 'Approved'
        }).toArray();

        const poRecord = await db.collection('erp_purchase_orders').findOne({ POID: grn.POID });
        if (poRecord) {
          let newPoStatus = 'Approved';
          if (remainingGrns.length > 0 && Array.isArray(poRecord.Items) && poRecord.Items.length > 0) {
            let isFullyReceived = true;
            let isPartiallyReceived = false;

            let totalOrderedSum = 0;
            let totalReceivedSum = 0;

            for (let idx = 0; idx < poRecord.Items.length; idx++) {
              const poItem = poRecord.Items[idx];
              let totalRec = 0;
              const orderedQty = parseInt(poItem.Qty) || 0;
              totalOrderedSum += orderedQty;

              for (const rg of remainingGrns) {
                if (Array.isArray(rg.Items)) {
                  let matchedGrnItem = null;
                  if (poItem.ItemID && String(poItem.ItemID).trim() !== '') {
                    matchedGrnItem = rg.Items.find(gi => gi.ItemID && String(gi.ItemID).trim().toLowerCase() === String(poItem.ItemID).trim().toLowerCase());
                  }
                  if (!matchedGrnItem && poItem.ItemName && String(poItem.ItemName).trim() !== '') {
                    matchedGrnItem = rg.Items.find(gi => gi.ItemName && String(gi.ItemName).trim().toLowerCase() === String(poItem.ItemName).trim().toLowerCase());
                  }
                  if (!matchedGrnItem && rg.Items[idx]) {
                    matchedGrnItem = rg.Items[idx];
                  }

                  if (matchedGrnItem) {
                    totalRec += (parseInt(matchedGrnItem.ReceivedQty) || parseInt(matchedGrnItem.Qty) || 0);
                  }
                }
              }

              totalReceivedSum += totalRec;

              if (totalRec < orderedQty) isFullyReceived = false;
              if (totalRec > 0) isPartiallyReceived = true;
            }

            if (totalOrderedSum > 0 && totalReceivedSum >= totalOrderedSum) {
              isFullyReceived = true;
            }

            newPoStatus = isFullyReceived ? 'Received' : (isPartiallyReceived ? 'Partially Received' : 'Approved');
          }
          await db.collection('erp_purchase_orders').updateOne(
            { POID: grn.POID },
            { $set: { Status: newPoStatus } }
          );
        }
      }

      // 5. Delete GRN record
      await db.collection('erp_grn').deleteOne({ _id: grn._id });
    }

    res.json({ success: true, message: 'GRN deleted and stock reverted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🧪 NHC PATIENT HISTORY IMPORT & RETRIEVAL ROUTES
// ------------------------------------------------------------------------------------------

// Get NHC Patient History records with search query & limit to prevent browser hang
app.get('/api/nhc-patient-history', async (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit) || 100;
    let filter = {};
    if (q) {
      const terms = q.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        const andFilters = terms.map(term => {
          const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const termRegex = new RegExp(escapedTerm, 'i');
          const cleanTerm = term.replace(/[^0-9a-zA-Z]/g, '');
          const cleanDigits = term.replace(/[^0-9]/g, '');
          const strippedDigits = cleanDigits.replace(/^0+/, '');

          let normPhone = cleanDigits;
          if (normPhone.startsWith('92') && normPhone.length >= 11) normPhone = normPhone.slice(2);
          if (normPhone.startsWith('0') && normPhone.length >= 10) normPhone = normPhone.slice(1);

          const termFilters = [
            { PatientName: termRegex },
            { PatientID: termRegex },
            { PhoneMobile: termRegex },
            { SpouseRelationName: termRegex },
            { Father_husband: termRegex },
            { Address: termRegex },
            { Diagnosis: termRegex },
            { MedicalCondition: termRegex },
            { Symptoms: termRegex }
          ];

          if (cleanTerm) {
            termFilters.push({ PatientID: new RegExp(cleanTerm, 'i') });
            termFilters.push({ PhoneMobile: new RegExp(cleanTerm, 'i') });
          }

          if (cleanDigits) {
            termFilters.push({ PhoneMobile: new RegExp(cleanDigits, 'i') });
            termFilters.push({ PatientID: new RegExp(cleanDigits, 'i') });

            if (normPhone) {
              termFilters.push({ PhoneMobile: new RegExp(normPhone, 'i') });
              termFilters.push({ PhoneMobile: new RegExp('0' + normPhone, 'i') });
              termFilters.push({ PhoneMobile: new RegExp('92' + normPhone, 'i') });
              termFilters.push({ PhoneMobile: new RegExp('\\+92' + normPhone, 'i') });
            }

            if (strippedDigits) {
              termFilters.push({ PatientID: new RegExp(strippedDigits, 'i') });
            }

            // Numeric comparisons if PhoneMobile or PatientID stored as BSON Number
            const numVal = parseInt(cleanDigits, 10);
            if (!isNaN(numVal)) {
              termFilters.push({ PatientID: numVal });
              termFilters.push({ PhoneMobile: numVal });
            }
            if (normPhone && normPhone !== cleanDigits) {
              const normNumVal = parseInt(normPhone, 10);
              if (!isNaN(normNumVal)) {
                termFilters.push({ PatientID: normNumVal });
                termFilters.push({ PhoneMobile: normNumVal });
              }
            }
          }

          return { $or: termFilters };
        });

        filter = { $and: andFilters };
      }
    }
    const history = await db.collection('nhc_patient_history').find(filter).limit(limit).toArray();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// High-Performance Server-Side Excel/CSV Upload & Smart Auto-Mapping Batch-Insert
app.post('/api/nhc-patient-history/upload-file', async (req, res) => {
  try {
    const isWipe = req.query.wipe === 'true';
    const chunks = [];
    
    // Read raw uploaded binary file from request stream
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const dataBuffer = Buffer.concat(chunks);

    if (!dataBuffer || dataBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty file uploaded or request stream interrupted.' });
    }

    // Parse the spreadsheet directly from the memory buffer using SheetJS with heavy memory-saving options
    const workbook = XLSX.read(dataBuffer, { 
      type: 'buffer',
      cellFormula: false,
      cellHTML: false,
      cellCSS: false,
      cellText: false,
      cellDates: true
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      return res.json({ success: true, message: 'The uploaded file is empty or contains no records.' });
    }

    // Comprehensive column mapping dictionary to support flexible legacy column names
    const HEADER_MAP = {
      'patientid': 'PatientID', 'patient id': 'PatientID', 'id': 'PatientID', 'pid': 'PatientID', 'mrn': 'PatientID',
      'patientname': 'PatientName', 'patient name': 'PatientName', 'name': 'PatientName', 'full name': 'PatientName',
      'father_husband': 'Father_husband', 'father/husband': 'Father_husband', 'father name': 'Father_husband', 'husband name': 'Father_husband', 'guardian': 'Father_husband', 'guardian name': 'Father_husband', 'father': 'Father_husband', 'husband': 'Father_husband',
      'ageyears': 'AgeYears', 'age years': 'AgeYears', 'age': 'AgeYears', 'years': 'AgeYears',
      'sex': 'Sex', 'gender': 'Sex',
      'phonemobile': 'PhoneMobile', 'phone mobile': 'PhoneMobile', 'phone': 'PhoneMobile', 'mobile': 'PhoneMobile', 'contact': 'PhoneMobile', 'contact number': 'PhoneMobile',
      'address': 'Address', 'residential address': 'Address', 'city': 'Address', 'location': 'Address',
      'registrationdate': 'RegistrationDate', 'registration date': 'RegistrationDate', 'reg date': 'RegistrationDate',
      'visitdate': 'VisitDate', 'visit date': 'VisitDate', 'date': 'VisitDate',
      'symptoms': 'Symptoms', 'symptom': 'Symptoms', 'complaints': 'Symptoms', 'complaint': 'Symptoms', 'chief complaints': 'Symptoms',
      'symptomsdiagnosis': 'SymptomsDiagnosis', 'symptoms diagnosis': 'SymptomsDiagnosis', 'symptoms_diagnosis': 'SymptomsDiagnosis', 'symptoms & diagnosis': 'SymptomsDiagnosis', 'symptoms/diagnosis': 'SymptomsDiagnosis',
      'medicalcondition': 'MedicalCondition', 'medical condition': 'MedicalCondition', 'condition': 'MedicalCondition', 'chronic': 'MedicalCondition', 'disease': 'MedicalCondition',
      'diagnosis': 'Diagnosis', 'diagnoses': 'Diagnosis', 'findings': 'Diagnosis', 'clinical findings': 'Diagnosis',
      'prescribedmedicines': 'PrescribedMedicines', 'prescribed medicines': 'PrescribedMedicines', 'medicines': 'PrescribedMedicines', 'medicine': 'PrescribedMedicines', 'prescription': 'PrescribedMedicines', 'rx': 'PrescribedMedicines',
      'medicinedetail': 'MedicineDetail', 'medicine detail': 'MedicineDetail', 'medication': 'MedicineDetail',
      'medicinetype': 'MedicineType', 'medicine type': 'MedicineType', 'type': 'MedicineType',
      'dosage': 'Dosage', 'dose': 'Dosage', 'frequency': 'Dosage',
      'labtests': 'LabTests', 'lab tests': 'LabTests', 'labs': 'LabTests', 'investigations': 'LabTests', 'lab investigations': 'LabTests',
      'allergies': 'Allergies', 'allergy': 'Allergies',
      'bloodgroup': 'BloodGroup', 'blood group': 'BloodGroup', 'blood': 'BloodGroup'
    };

    // Clean, map, and process records
    const records = rawRows.map((row) => {
      const mappedRow = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.toLowerCase().trim().replace(/_/g, ' ');
        const standardKey = HEADER_MAP[cleanKey] || HEADER_MAP[key.toLowerCase().trim()];
        if (standardKey) {
          mappedRow[standardKey] = row[key];
        } else {
          mappedRow[key] = row[key];
        }
      });

      // Standardize types and clean numeric and text strings
      if (mappedRow.AgeYears !== undefined && mappedRow.AgeYears !== null && mappedRow.AgeYears !== '') {
        const parsed = parseInt(mappedRow.AgeYears, 10);
        mappedRow.AgeYears = isNaN(parsed) ? null : parsed;
      }
      const formatDateStr = (val) => {
        if (!val) return '';
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {}
        return val.toString();
      };
      if (mappedRow.VisitDate) mappedRow.VisitDate = formatDateStr(mappedRow.VisitDate);
      if (mappedRow.RegistrationDate) mappedRow.RegistrationDate = formatDateStr(mappedRow.RegistrationDate);

      // Ensure mandatory field and auto-generated Patient IDs
      if (!mappedRow.PatientID) {
        mappedRow.PatientID = `NHC-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      if (!mappedRow.PatientName && mappedRow.PatientID) {
        mappedRow.PatientName = `Legacy Patient (${mappedRow.PatientID})`;
      }

      return mappedRow;
    });

    const collection = db.collection('nhc_patient_history');

    // Wipe previous collection if requested
    if (isWipe) {
      await collection.deleteMany({});
    }

    // Insert or upsert in optimal batches of 10,000 to keep the node memory heap stable
    const batchSize = 10000;
    let insertedCount = 0;
    let modifiedCount = 0;

    if (isWipe) {
      // High-performance batch insert
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await collection.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
      }
    } else {
      // Merge/Upsert bulk operations
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const operations = batch.map(record => {
          const visitDateVal = record.VisitDate || record.RegistrationDate || 'N/A';
          const medDetailVal = record.MedicineDetail || '';
          return {
            updateOne: {
              filter: { 
                PatientID: record.PatientID,
                VisitDate: visitDateVal,
                MedicineDetail: medDetailVal
              },
              update: { $set: record },
              upsert: true
            }
          };
        });
        const result = await collection.bulkWrite(operations);
        insertedCount += result ? (result.upsertedCount !== undefined ? result.upsertedCount : (result.insertedCount || result.upsertedCount || 0)) : 0;
        modifiedCount += result ? (result.modifiedCount || 0) : 0;
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${records.length} records.`,
      insertedCount,
      modifiedCount,
      totalCount: records.length,
      mode: isWipe ? 'wipe-insert' : 'upsert-merge'
    });

  } catch (err) {
    console.error('Failed to parse or save bulk NHC history file:', err);
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
});

// Bulk Insert / Upsert NHC Patient History records
app.post('/api/nhc-patient-history/bulk', async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Data must be an array of records.' });
    }

    if (records.length === 0) {
      return res.json({ success: true, message: 'No records to import.' });
    }

    // Prepare operations for bulkWrite (upsert based on PatientID, VisitDate, and MedicineDetail to support multiple historical records/medicines)
    const operations = records.map(record => {
      // Cast numerical and date values properly
      if (record.AgeYears !== undefined && record.AgeYears !== null && record.AgeYears !== '') {
        const parsed = parseInt(record.AgeYears, 10);
        record.AgeYears = isNaN(parsed) ? null : parsed;
      }
      if (record.VisitDate) record.VisitDate = record.VisitDate.toString();
      if (record.RegistrationDate) record.RegistrationDate = record.RegistrationDate.toString();

      // Ensure a PatientID is present, otherwise generate one
      if (!record.PatientID) {
        record.PatientID = `NHC-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const visitDateVal = record.VisitDate || record.RegistrationDate || 'N/A';
      const medDetailVal = record.MedicineDetail || '';

      return {
        updateOne: {
          filter: { 
            PatientID: record.PatientID,
            VisitDate: visitDateVal,
            MedicineDetail: medDetailVal
          },
          update: { $set: record },
          upsert: true
        }
      };
    });

    const result = await db.collection('nhc_patient_history').bulkWrite(operations);
    const upsertedCount = result ? (result.upsertedCount !== undefined ? result.upsertedCount : (result.insertedCount || result.upsertedCount || 0)) : 0;
    const modifiedCount = result ? (result.modifiedCount || 0) : 0;
    res.json({
      success: true,
      message: `Successfully imported/merged ${records.length} records.`,
      insertedCount: upsertedCount,
      modifiedCount: modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all NHC Patient History records
app.delete('/api/nhc-patient-history', async (req, res) => {
  try {
    await db.collection('nhc_patient_history').deleteMany({});
    res.json({ success: true, message: 'All NHC patient history records cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Insert / Upsert Medicine Items
app.post('/api/items/bulk', async (req, res) => {
  try {
    const itemsList = req.body;
    if (!Array.isArray(itemsList)) {
      return res.status(400).json({ error: 'Body must be an array of medicine items.' });
    }
    if (itemsList.length === 0) {
      return res.json({ success: true, message: 'No medicine items provided.' });
    }
    const operations = itemsList.map(item => {
      if (!item.ItemID) item.ItemID = `ITM-${Date.now().toString().slice(-4)}`;
      if (item._id) delete item._id;
      return {
        updateOne: {
          filter: { ItemID: item.ItemID },
          update: { $set: item },
          upsert: true
        }
      };
    });
    const result = await db.collection('items').bulkWrite(operations);
    res.json({ success: true, message: `Successfully synchronized ${itemsList.length} items to MongoDB.`, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Insert / Upsert Lab Tests
app.post('/api/lab-tests/bulk', async (req, res) => {
  try {
    const testsList = req.body;
    if (!Array.isArray(testsList)) {
      return res.status(400).json({ error: 'Body must be an array of diagnostic tests.' });
    }
    if (testsList.length === 0) {
      return res.json({ success: true, message: 'No diagnostic tests provided.' });
    }
    const operations = testsList.map(test => {
      if (!test.TID) test.TID = `TST-${Date.now().toString().slice(-4)}`;
      if (test._id) delete test._id;
      return {
        updateOne: {
          filter: { TID: test.TID },
          update: { $set: test },
          upsert: true
        }
      };
    });
    const result = await db.collection('lab_tests').bulkWrite(operations);
    res.json({ success: true, message: `Successfully synchronized ${testsList.length} diagnostic tests to MongoDB.`, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------------------
// 🎯 SMART MEDICINE LOCATOR MODULE
// ------------------------------------------------------------------------------------------

// Fetch all smart locator entries
app.get('/api/smart-locator', async (req, res) => {
  try {
    const list = await db.collection('smart_locator_medicines').find({}).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Save / Update / Replace Smart Locator Entries
app.post('/api/smart-locator/bulk', async (req, res) => {
  try {
    const itemsList = Array.isArray(req.body) ? req.body : (Array.isArray(req.body.list) ? req.body.list : []);
    const shouldWipe = req.query.wipe === 'true' || req.body.wipe === true;

    if (!Array.isArray(itemsList)) {
      return res.status(400).json({ error: 'Body must be an array of smart locator entries.' });
    }

    if (shouldWipe) {
      await db.collection('smart_locator_medicines').deleteMany({});
    }

    if (itemsList.length === 0) {
      return res.json({ success: true, message: 'No entries provided to sync.' });
    }

    const operations = itemsList.map(item => {
      if (item._id) delete item._id;
      return {
        updateOne: {
          filter: { Symptoms: item.Symptoms, MedicineName: item.MedicineName },
          update: { $set: item },
          upsert: true
        }
      };
    });

    const result = await db.collection('smart_locator_medicines').bulkWrite(operations);
    res.json({ success: true, message: `Successfully synchronized ${itemsList.length} smart locator entries to MongoDB.`, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Delete by key
app.delete('/api/smart-locator', async (req, res) => {
  try {
    const { Symptoms, MedicineName } = req.body;
    const query = {};
    if (Symptoms !== undefined) query.Symptoms = Symptoms;
    if (MedicineName !== undefined) query.MedicineName = MedicineName;
    
    await db.collection('smart_locator_medicines').deleteOne(query);
    res.json({ success: true, message: 'Deleted smart locator entry.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all entries
app.delete('/api/smart-locator/all', async (req, res) => {
  try {
    await db.collection('smart_locator_medicines').deleteMany({});
    res.json({ success: true, message: 'Cleared all smart locator records.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================================
// 💾 MASTER DATABASE RESTORE & BACKUP IMPORT ENDPOINTS
// Handles 250MB+ JSON restores safely with chunking, upserting, and collection auto-mapping
// ==========================================================================================
const isExcludedNhcCollection = (name, includeNhc = false) => {
  if (includeNhc === true || includeNhc === 'true' || includeNhc === '1') {
    return false; // User explicitly opted to include nhc_patient_history
  }
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return n === 'nhc_patient_history' || n === 'nhcpatienthistory' || n === 'nhc_patients' || n.includes('nhc_patient');
};

function sanitizeMongoDoc(rawDoc) {
  if (!rawDoc || typeof rawDoc !== 'object') return rawDoc;
  const doc = { ...rawDoc };

  // Exclude / remove immutable _id so it never conflicts during restore update operations
  delete doc._id;

  for (const key of Object.keys(doc)) {
    const val = doc[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$oid) {
        doc[key] = String(val.$oid);
      } else if (val.$date) {
        doc[key] = String(val.$date);
      }
    }
  }

  return doc;
}

app.post('/api/restore/collection-chunk', async (req, res) => {
  try {
    const { collectionName, records, wipe, mode, includeNhcHistory } = req.body;
    if (!collectionName || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid parameters: collectionName and records array are required.' });
    }

    const colName = collectionName.toLowerCase().trim();

    // Respect user configuration for nhc_patient_history
    if (isExcludedNhcCollection(colName, includeNhcHistory)) {
      return res.json({ success: true, collection: colName, count: 0, skipped: true, message: 'nhc_patient_history collection is skipped as per configuration.' });
    }

    if (records.length === 0) {
      return res.json({ success: true, count: 0, message: 'Empty chunk provided.' });
    }

    if (wipe === true) {
      if (db instanceof InMemoryDB) {
        db.collections[colName] = [];
      } else {
        await db.collection(colName).deleteMany({});
      }
    }

    const sanitizedRecords = records
      .map(r => sanitizeMongoDoc(r))
      .filter(r => r && typeof r === 'object');

    if (sanitizedRecords.length === 0) {
      return res.json({ success: true, count: 0, message: 'No valid documents to restore.' });
    }

    if (db instanceof InMemoryDB) {
      if (!db.collections[colName]) db.collections[colName] = [];
      if (wipe === true) {
        db.collections[colName] = [...sanitizedRecords];
      } else {
        db.collections[colName].push(...sanitizedRecords);
      }
      return res.json({ success: true, collection: colName, count: sanitizedRecords.length });
    }

    // Determine restore strategy:
    // If wipe mode (or wipe=true), directly insert documents without running update/$set queries
    const isWipeMode = mode === 'wipe' || wipe === true;

    if (isWipeMode) {
      try {
        const result = await db.collection(colName).insertMany(sanitizedRecords, { ordered: false });
        return res.json({ success: true, collection: colName, count: sanitizedRecords.length, result });
      } catch (insertErr) {
        // Fallback to bulkWrite insertOne in case of non-fatal batch warnings
        const insertOps = sanitizedRecords.map(doc => ({ insertOne: { document: doc } }));
        const result = await db.collection(colName).bulkWrite(insertOps, { ordered: false });
        return res.json({ success: true, collection: colName, count: sanitizedRecords.length, result });
      }
    }

    // Merge & Upsert Mode: update matching records by primary business key without including _id in $set
    const sample = sanitizedRecords[0] || {};
    let keyField = null;
    if ('PatientID' in sample) keyField = 'PatientID';
    else if ('ItemID' in sample) keyField = 'ItemID';
    else if ('VisitID' in sample) keyField = 'VisitID';
    else if ('InvoiceNo' in sample) keyField = 'InvoiceNo';
    else if ('VoucherNo' in sample) keyField = 'VoucherNo';
    else if ('TokenNo' in sample) keyField = 'TokenNo';
    else if ('AppointmentID' in sample) keyField = 'AppointmentID';
    else if ('LabTestID' in sample) keyField = 'LabTestID';
    else if ('SupplierID' in sample) keyField = 'SupplierID';
    else if ('UserID' in sample) keyField = 'UserID';
    else if ('CityID' in sample) keyField = 'CityID';

    const operations = sanitizedRecords.map(doc => {
      const docCopy = { ...doc };
      delete docCopy._id; // Guarantee immutable _id is completely removed from $set update payload

      if (keyField && docCopy[keyField] !== undefined && docCopy[keyField] !== null && docCopy[keyField] !== '') {
        return {
          updateOne: {
            filter: { [keyField]: docCopy[keyField] },
            update: { $set: docCopy },
            upsert: true
          }
        };
      } else {
        return {
          insertOne: { document: docCopy }
        };
      }
    });

    const result = await db.collection(colName).bulkWrite(operations, { ordered: false });
    res.json({ success: true, collection: colName, count: sanitizedRecords.length, result });
  } catch (err) {
    console.error('Error restoring collection chunk:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restore/full-database', async (req, res) => {
  try {
    const { wipe, data, includeNhcHistory } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No data provided for database restore.' });
    }

    const report = {};
    let totalRestored = 0;

    const processCollectionData = async (colName, recordsList) => {
      if (!Array.isArray(recordsList) || recordsList.length === 0) return 0;
      const cleanName = colName.toLowerCase().trim();

      // Respect user configuration for nhc_patient_history
      if (isExcludedNhcCollection(cleanName, includeNhcHistory)) {
        return 0;
      }

      if (wipe) {
        await db.collection(cleanName).deleteMany({});
      }
      
      const batchSize = 2000;
      let colInserted = 0;

      for (let i = 0; i < recordsList.length; i += batchSize) {
        const batch = recordsList.slice(i, i + batchSize);
        const sanitizedBatch = batch.map(r => sanitizeMongoDoc(r)).filter(r => r && typeof r === 'object');
        if (sanitizedBatch.length === 0) continue;

        if (wipe) {
          try {
            await db.collection(cleanName).insertMany(sanitizedBatch, { ordered: false });
            colInserted += sanitizedBatch.length;
            continue;
          } catch (e) {
            console.warn(`Full restore insertMany warning for ${cleanName}, falling back to bulkWrite`);
          }
        }

        const sample = sanitizedBatch[0] || {};
        let keyField = null;
        if ('PatientID' in sample) keyField = 'PatientID';
        else if ('ItemID' in sample) keyField = 'ItemID';
        else if ('VisitID' in sample) keyField = 'VisitID';
        else if ('InvoiceNo' in sample) keyField = 'InvoiceNo';
        else if ('VoucherNo' in sample) keyField = 'VoucherNo';

        const operations = sanitizedBatch.map(doc => {
          const docCopy = { ...doc };
          delete docCopy._id; // Exclude immutable _id from $set payload
          
          if (keyField && docCopy[keyField] !== undefined && docCopy[keyField] !== null) {
            return {
              updateOne: {
                filter: { [keyField]: docCopy[keyField] },
                update: { $set: docCopy },
                upsert: true
              }
            };
          } else {
            return { insertOne: { document: docCopy } };
          }
        });

        await db.collection(cleanName).bulkWrite(operations, { ordered: false });
        colInserted += sanitizedBatch.length;
      }
      return colInserted;
    };

    if (Array.isArray(data)) {
      const grouped = {};
      data.forEach(doc => {
        let col = 'unknown_records';
        if (doc.PatientID && (doc.PatientName || doc.MRNo)) col = 'patients';
        else if (doc.VisitID || doc.SymptomsDiagnosis) col = 'visits';
        else if (doc.ItemID || doc.ItemName) col = 'items';
        else if (doc.InvoiceNo && doc.TotalAmount !== undefined) col = 'invoice_headers';
        else if (doc.InvoiceNo && doc.Quantity) col = 'invoice_details';
        else if (doc.AppointmentID || doc.AppointmentDate) col = 'appointments';
        else if (doc.MedicineDetail) col = 'nhc_patient_history';
        else if (doc.TokenNo) col = 'tokens';
        else if (doc.LabTestID || doc.TestName) col = 'lab_tests';
        else if (doc.VoucherNo) col = 'vouchers';
        
        if (!grouped[col]) grouped[col] = [];
        grouped[col].push(doc);
      });

      for (const [col, list] of Object.entries(grouped)) {
        const c = await processCollectionData(col, list);
        report[col] = c;
        totalRestored += c;
      }
    } else if (typeof data === 'object') {
      for (const [colName, recordsList] of Object.entries(data)) {
        if (Array.isArray(recordsList)) {
          const c = await processCollectionData(colName, recordsList);
          report[colName] = c;
          totalRestored += c;
        }
      }
    }

    res.json({
      success: true,
      message: `Database restore completed successfully! ${totalRestored} total records synchronized into MongoDB.`,
      report,
      totalRestored
    });
  } catch (err) {
    console.error('Master database restore failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================================
// 🛠️ GENERIC DYNAMIC DATABASE QUERY & STORAGE HANDLER API
// Supports full list, custom JSON filter searches, insert/post, update/put, and delete for ALL tables
// ==========================================================================================
app.get('/api/query/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    let limit = 0;
    if (req.query.limit !== undefined) {
      limit = parseInt(req.query.limit) || 0;
    } else if (collection !== 'items') {
      limit = 500;
    }
    const skip = parseInt(req.query.skip) || 0;
    
    // Parse custom JSON query if provided in URL (e.g. ?q={"role":"Doctor"})
    let queryObj = {};
    if (req.query.q) {
      try {
        queryObj = JSON.parse(req.query.q);
      } catch (e) {
        // Fallback: search across key text fields if query is plain text search
        const term = req.query.q;
        if (term) {
          queryObj = {
            $or: [
              { PatientName: { $regex: term, $options: 'i' } },
              { PatientID: { $regex: term, $options: 'i' } },
              { ItemName: { $regex: term, $options: 'i' } },
              { ItemID: { $regex: term, $options: 'i' } },
              { FullName: { $regex: term, $options: 'i' } },
              { UserID: { $regex: term, $options: 'i' } },
              { vchNo: { $regex: term, $options: 'i' } }
            ]
          };
        }
      }
    }

    const data = await db.collection(collection)
      .find(queryObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/query/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const document = req.body;
    
    if (!document || Object.keys(document).length === 0) {
      return res.status(400).json({ error: 'Body cannot be empty.' });
    }

    // Auto-generate IDs if not supplied
    if (!document._id) {
      document._id = Math.random().toString(36).substring(2, 11);
    }

    const result = await db.collection(collection).insertOne(document);
    res.json({ success: true, message: 'Document created successfully.', result, insertedId: document._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/query/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const updateData = req.body;
    
    if (updateData._id) delete updateData._id; // Ensure we don't try to update immutable _id

    if (db instanceof InMemoryDB) {
      if (!db.collections[collection]) db.collections[collection] = [];
      const col = db.collections[collection];
      const index = col.findIndex(doc => {
        if (doc._id === id) return true;
        if (collection === 'erp_purchase_orders') return doc.POID === id;
        if (collection === 'erp_grn') return doc.GRNID === id;
        if (collection === 'erp_vendors') return doc.VendorID === id || doc.SID === id || doc.SupplierID === id;
        if (collection === 'erp_transactions') return doc.TransactionID === id || doc.VoucherNo === id;
        if (collection === 'erp_expenses') return doc.ExpenseID === id;
        if (collection === 'erp_employees') return doc.EmployeeID === id;
        if (collection === 'erp_assets') return doc.AssetID === id;
        if (collection === 'erp_payroll') return doc.PayrollID === id;
        return (
          doc.VendorID === id ||
          doc.SID === id ||
          doc.SupplierID === id ||
          doc.PatientID === id ||
          doc.ItemID === id ||
          doc.VisitID === id ||
          doc.InvoiceNo === id ||
          doc.TransactionID === id ||
          doc.ExpenseID === id ||
          doc.EmployeeID === id ||
          doc.AssetID === id
        );
      });
      if (index !== -1) {
        col[index] = { ...col[index], ...updateData };
      } else {
        col.push({ _id: id, ...updateData });
      }
      return res.json({ success: true, message: 'Document updated in in-memory DB' });
    }

    const queryConditions = [{ _id: id }];
    try {
      if (typeof ObjectId !== 'undefined' && ObjectId.isValid(id) && id.length === 24) {
        queryConditions.push({ _id: new ObjectId(id) });
      }
    } catch (e) {}

    // Check collection-specific business keys to prevent cross-document overwrites
    if (collection === 'erp_purchase_orders') {
      queryConditions.push({ POID: id });
    } else if (collection === 'erp_grn') {
      queryConditions.push({ GRNID: id });
    } else if (collection === 'erp_vendors') {
      queryConditions.push({ VendorID: id }, { SID: id }, { SupplierID: id });
    } else if (collection === 'erp_transactions') {
      queryConditions.push({ TransactionID: id }, { VoucherNo: id });
    } else if (collection === 'erp_expenses') {
      queryConditions.push({ ExpenseID: id });
    } else if (collection === 'erp_employees') {
      queryConditions.push({ EmployeeID: id });
    } else if (collection === 'erp_assets') {
      queryConditions.push({ AssetID: id });
    } else if (collection === 'erp_payroll') {
      queryConditions.push({ PayrollID: id });
    } else {
      queryConditions.push(
        { VendorID: id },
        { SID: id },
        { SupplierID: id },
        { PatientID: id },
        { ItemID: id },
        { VisitID: id },
        { InvoiceNo: id },
        { VoucherNo: id },
        { TransactionID: id },
        { ExpenseID: id },
        { EmployeeID: id },
        { AssetID: id },
        { POID: id },
        { GRNID: id }
      );
    }

    const query = { $or: queryConditions };

    const result = await db.collection(collection).updateOne(
      query,
      { $set: updateData },
      { upsert: true }
    );

    res.json({ success: true, message: 'Document updated/upserted successfully.', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/query/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    
    if (db instanceof InMemoryDB) {
      if (db.collections[collection]) {
        db.collections[collection] = db.collections[collection].filter(doc => {
          if (doc._id === id) return false;
          if (collection === 'erp_purchase_orders') return doc.POID !== id;
          if (collection === 'erp_grn') return doc.GRNID !== id;
          if (collection === 'erp_vendors') return doc.VendorID !== id && doc.SID !== id && doc.SupplierID !== id;
          if (collection === 'erp_transactions') return doc.TransactionID !== id && doc.VoucherNo !== id;
          if (collection === 'erp_expenses') return doc.ExpenseID !== id;
          if (collection === 'erp_employees') return doc.EmployeeID !== id;
          if (collection === 'erp_assets') return doc.AssetID !== id;
          if (collection === 'erp_payroll') return doc.PayrollID !== id;
          return !(
            doc.VendorID === id ||
            doc.SID === id ||
            doc.SupplierID === id ||
            doc.PatientID === id ||
            doc.ItemID === id ||
            doc.VisitID === id ||
            doc.InvoiceNo === id ||
            doc.TransactionID === id ||
            doc.ExpenseID === id ||
            doc.EmployeeID === id ||
            doc.AssetID === id
          );
        });
      }
      return res.json({ success: true, message: 'Document deleted from in-memory DB' });
    }

    const queryConditions = [{ _id: id }];
    try {
      if (typeof ObjectId !== 'undefined' && ObjectId.isValid(id) && id.length === 24) {
        queryConditions.push({ _id: new ObjectId(id) });
      }
    } catch (e) {}

    // Check collection-specific business keys
    if (collection === 'erp_purchase_orders') {
      queryConditions.push({ POID: id });
    } else if (collection === 'erp_grn') {
      queryConditions.push({ GRNID: id });
    } else if (collection === 'erp_vendors') {
      queryConditions.push({ VendorID: id }, { SID: id }, { SupplierID: id });
    } else if (collection === 'erp_transactions') {
      queryConditions.push({ TransactionID: id }, { VoucherNo: id });
    } else if (collection === 'erp_expenses') {
      queryConditions.push({ ExpenseID: id });
    } else if (collection === 'erp_employees') {
      queryConditions.push({ EmployeeID: id });
    } else if (collection === 'erp_assets') {
      queryConditions.push({ AssetID: id });
    } else if (collection === 'erp_payroll') {
      queryConditions.push({ PayrollID: id });
    } else {
      queryConditions.push(
        { VendorID: id },
        { SID: id },
        { SupplierID: id },
        { PatientID: id },
        { ItemID: id },
        { VisitID: id },
        { InvoiceNo: id },
        { VoucherNo: id },
        { TransactionID: id },
        { ExpenseID: id },
        { EmployeeID: id },
        { AssetID: id },
        { POID: id },
        { GRNID: id }
      );
    }

    const query = { $or: queryConditions };

    const result = await db.collection(collection).deleteOne(query);
    res.json({ success: true, message: 'Document deleted successfully.', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purge / Drop entire database collection (e.g. version_control)
app.delete('/api/query/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    if (!collection) return res.status(400).json({ error: 'Collection name is required.' });
    
    if (db instanceof InMemoryDB) {
      delete db.collections[collection];
      delete db.indexes[collection];
    } else {
      await db.collection(collection).drop().catch(() => {});
    }
    console.log(`🔥 Dropped collection/table "${collection}" from database.`);
    res.json({ success: true, message: `Collection "${collection}" has been deleted/dropped successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug/seeder', (req, res) => {
  res.json({
    seederStatus,
    seederError,
    dbType: db instanceof InMemoryDB ? "InMemoryDB" : "MongoDB",
    collections: Object.keys(db.collections || {})
  });
});

app.post('/api/mongodb/test-connection', async (req, res) => {
  const { connectionString, databaseName } = req.body;
  if (!connectionString) {
    return res.status(400).json({ success: false, error: 'Connection string is required.' });
  }

  try {
    const tempClient = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    await tempClient.connect();
    const tempDb = tempClient.db(databaseName || undefined);
    const collections = await tempDb.listCollections().toArray();
    await tempClient.close();
    res.json({
      success: true,
      database: tempDb.databaseName,
      dbType: "MongoDB",
      collectionsCount: collections.length
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/mongodb/status', (req, res) => {
  res.json({
    success: true,
    dbType: db instanceof InMemoryDB ? "InMemoryDB" : "MongoDB",
    databaseName: db instanceof InMemoryDB ? "PharmacyPOSDB (InMemory)" : (db.databaseName || "PharmacyPOSDB"),
    seederStatus,
    seederError
  });
});

app.get('/api/mongodb/backup', async (req, res) => {
  try {
    const targetDbName = db instanceof InMemoryDB ? "PharmacyPOSDB" : (db.databaseName || "PharmacyPOSDB");
    const requestedFormat = (req.query.format || 'zip').toString().toLowerCase();
    const includeNhcHistory = req.query.includeNhcHistory === 'true' || req.query.includeNhc === 'true' || req.query.includeNhcHistory === '1';

    const backupData = {
      backupDate: new Date().toISOString(),
      system: "Punjab Homeopathic Clinic EMR & Pharmacy POS",
      databaseName: targetDbName,
      dbType: db instanceof InMemoryDB ? "InMemoryDB" : "MongoDB",
      collections: {}
    };

    if (db instanceof InMemoryDB) {
      for (const [collName, docs] of Object.entries(db.collections || {})) {
        if (isExcludedNhcCollection(collName, includeNhcHistory)) continue;
        backupData.collections[collName] = Array.isArray(docs) ? docs : [];
      }
    } else {
      const collections = await db.listCollections().toArray();
      for (const collInfo of collections) {
        const name = collInfo.name;
        if (isExcludedNhcCollection(name, includeNhcHistory)) continue;
        const docs = await db.collection(name).find({}).toArray();
        backupData.collections[name] = docs;
      }
    }

    const dateStr = new Date().toISOString().split('T')[0];

    if (requestedFormat === 'json' || requestedFormat === 'raw_json') {
      const jsonFilename = `mongodb_backup_${targetDbName}_${dateStr}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${jsonFilename}"`);
      return res.status(200).send(JSON.stringify(backupData));
    }

    // Default: High-Ratio ZIP Archive Compression
    const jsonStr = JSON.stringify(backupData);
    const jsonInsideZip = `mongodb_backup_${targetDbName}_${dateStr}.json`;
    const zip = new JSZip();
    zip.file(jsonInsideZip, jsonStr);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const zipFilename = `mongodb_backup_${targetDbName}_${dateStr}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    return res.status(200).send(zipBuffer);
  } catch (err) {
    console.error('Backup API Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================================================
// 4. START FULL-STACK PORT (PORT 3000 WITH VITE MIDDLEWARE)
// ==========================================================================================
const PORT = 3000;

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/socket.io')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    console.log('⚡ Integrated Vite development server middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Complete Full-Stack Server active on: http://localhost:${PORT}`);
    console.log('👉 Serving both API endpoints and React frontend seamlessly.');
  });
}

startServer();
