/* v1 */
function StructuredDataFactory(opt) {
  

  let SELF = {
    Add_,
  //   Init,
  //   openDb_,
  //   setItem_,
  //   getItem_,
  //   removeItem_,
  //   clearStore_,
    ChangeWorkspace_,
  };

  // # local
  let storeName, db, dbVersion, dbName;

  //  # function

  function setStorageKey(storeKey) {
    if (!storeKey || storeKey?.trim().length == 0) return false;
    
    storeName = storeKey;
    return true;
  }

  async function ChangeWorkspace_(storeKey) {
    let isChanged = setStorageKey(storeKey);
    if (isChanged) {
      init();
    }
  }

  // # init
  function init() {
    let config = storageUtil.GetConfig();
    dbName = config.dbName;
    dbVersion = config.dbVersion;
  }

  // # Open IndexedDB
  async function openDb_() {
    return new Promise((resolve, reject) => {
      if (db) resolve(db);

      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = (event) => reject('Error opening database: ' + event.target.errorCode);
      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };
      request.onupgradeneeded = (event) => {
        db = event.target.result;
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' });
        }
      };
    });
  }

   // # Set Item in IndexedDB
  async function setItem_(key, value) {
    return new Promise(async (resolve, reject) => {
      await openDb_();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve(true);
      };
      request.onerror = (event) => reject('Error storing item: ' + event.target.errorCode);
    });
  }

  async function Add_(item) {
    let {id} = item;
    await setItem_(id, item);
  }

  // // # init
  // function Init(_dbName, _dbVersion) {
  //   dbName = _dbName;
  //   dbVersion = _dbVersion;
  // }
  
  // // # Clear all items from a specific object store
  // async function clearStore_() {
  //   return new Promise(async (resolve, reject) => {
  //     await openDb_(); // Ensure the database is open
  //     const transaction = db.transaction([storeName], 'readwrite');
  //     const store = transaction.objectStore(storeName);
  //     const request = store.clear();
  
  //     request.onsuccess = () => resolve(true);
  //     request.onerror = (event) => reject('Error clearing store: ' + event.target.errorCode);
  //   });
  // }

  // // # Open IndexedDB
  // async function openDb_() {
  //   return new Promise((resolve, reject) => {
  //     if (db) resolve(db);

  //     const request = indexedDB.open(dbName, dbVersion);
  //     request.onerror = (event) => reject('Error opening database: ' + event.target.errorCode);
  //     request.onsuccess = (event) => {
  //       db = event.target.result;
  //       resolve(db);
  //     };
  //     request.onupgradeneeded = (event) => {
  //       db = event.target.result;
  //       // Create object stores if they don't exist
  //       if (!db.objectStoreNames.contains(storeName)) {
  //         db.createObjectStore(storeName, { keyPath: 'key' });
  //       }
  //     };
  //   });
  // }

  // // # Set Item in IndexedDB
  // async function setItem_(key, value) {
  //   return new Promise(async (resolve, reject) => {
  //     await openDb_();
  //     const transaction = db.transaction([storeName], 'readwrite');
  //     const store = transaction.objectStore(storeName);
  //     const request = store.put({ key, value });

  //     request.onsuccess = () => {
  //       resolve(true);
  //     };
  //     request.onerror = (event) => reject('Error storing item: ' + event.target.errorCode);
  //   });
  // }

  // // # Get Item from IndexedDB or fallback to localStorage
  // async function getItem_(key) {
  //   return new Promise(async (resolve, reject) => {
  //     await openDb_();
  //     const transaction = db.transaction([storeName], 'readonly');
  //     const store = transaction.objectStore(storeName);
  //     const request = store.get(key);

  //     request.onsuccess = (event) => {
  //       const result = event.target.result;
  //       if (result) {
  //         resolve(result.value);
  //       } else {
  //         resolve(null); // return null if not found
  //       }
  //     };
  //     request.onerror = (event) => reject('Error retrieving item: ' + event.target.errorCode);
  //   });
  // }

  // // # Remove Item from IndexedDB and localStorage
  // async function removeItem_(key) {
  //   return new Promise(async (resolve, reject) => {
  //     await openDb_();
  //     const transaction = db.transaction([storeName], 'readwrite');
  //     const store = transaction.objectStore(storeName);
  //     const request = store.delete(key);

  //     request.onsuccess = () => {
  //       resolve(true);
  //     };
  //     request.onerror = (event) => reject('Error removing item: ' + event.target.errorCode);
  //   });
  // }

  return SELF;
    
}