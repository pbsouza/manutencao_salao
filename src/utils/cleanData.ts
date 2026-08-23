/**
 * Removes any undefined values from an object before saving to Firestore.
 * Firestore throws a runtime error if any object or nested object contains undefined.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item)) as unknown as T;
  }

  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreData(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value
          .filter((item) => item !== undefined)
          .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned as T;
}
