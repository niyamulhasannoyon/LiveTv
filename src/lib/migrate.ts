import { db } from './firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function migrateLocalChannelsToFirestore() {
  try {
    const channelsCol = collection(db, 'channels');
    const snapshot = await getDocs(channelsCol);
    
    // If database is not empty, run a type normalization check to ensure failureCount/failure_count are stored as numbers
    if (!snapshot.empty) {
      console.log('[Migration] Firestore channels collection already has data. Checking type normalizations...');
      const batch = writeBatch(db);
      let needsUpdate = false;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const updates: any = {};
        
        if (typeof data.failureCount === 'string') {
          updates.failureCount = Number(data.failureCount) || 0;
        }
        if (typeof data.failure_count === 'string') {
          updates.failure_count = Number(data.failure_count) || 0;
        }
        
        if (Object.keys(updates).length > 0) {
          const docRef = doc(db, 'channels', docSnap.id);
          batch.update(docRef, updates);
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        await batch.commit();
        console.log('[Migration] Normalization complete. Fixed failureCount string-to-number types in Firestore.');
      } else {
        console.log('[Migration] No normalization needed. All failure counts are stored correctly.');
      }
      return;
    }

    const dataPath = path.join(process.cwd(), 'data', 'custom_channels.json');
    if (!fs.existsSync(dataPath)) {
      console.log('[Migration] No local custom_channels.json found to migrate.');
      return;
    }

    const content = fs.readFileSync(dataPath, 'utf8');
    const localChannels = JSON.parse(content);
    if (!Array.isArray(localChannels) || localChannels.length === 0) {
      console.log('[Migration] Local custom_channels.json is empty or invalid.');
      return;
    }

    console.log(`[Migration] Migrating ${localChannels.length} custom channels to Firestore...`);
    const batch = writeBatch(db);
    
    for (const ch of localChannels) {
      const docRef = doc(channelsCol);
      const docData = {
        name: ch.name || '',
        category: ch.category || 'General',
        url: ch.urls?.[0] || '',
        urls: ch.urls || [],
        logo: ch.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
        country: ch.country || 'Bangladesh',
        status: ch.status || 'Smooth',
        lastChecked: new Date().toISOString(),
        failureCount: Number(ch.failure_count) || 0,
        failure_count: Number(ch.failure_count) || 0,
        isGeoBlocked: !!ch.isGeoBlocked
      };
      batch.set(docRef, docData);
    }
    
    await batch.commit();
    console.log('[Migration] Channel migration to Firestore completed successfully.');
  } catch (err) {
    console.error('[Migration] Failed to migrate local channels to Firestore:', err);
  }
}
