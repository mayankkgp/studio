
/**
 * DEPRECATED: Use the unified initialization in @/firebase/index.ts instead.
 * This file is maintained only for legacy imports during transition.
 */
import { initializeFirebase } from '@/firebase';

const { db } = initializeFirebase();
export { db };
