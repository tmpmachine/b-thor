function ObjectDataFactory(opt) {
  
  let SELF = {
    SetItem: (key, value) => data[key] = value,
    GetAll: () => data,
    GetItem: (key) => data[key],
    ClearItem: (key) => delete data[key],
    Reset: () => data = JSON.parse(defaultDataJSON),
    Clear: () => storageUtil.clearStore_(),
    
    ChangeWorkspace_,
    Save_,
  };
  
  // # data
  let data = opt?.defaultData ?? {};
  let defaultDataJSON = JSON.stringify(data);
  
  let local = {
    storageName: '', // assigned on workspace change
  };

  // # functions
  
  function setStorageKey(storeKey) {
    if (!storeKey || storeKey?.trim().length == 0) return false;
    
    local.storageName = storeKey;
    return true;
  }
  
  async function ChangeWorkspace_(storeKey) {
    let isChanged = setStorageKey(storeKey);
    if (isChanged) {
      await restoreData_();
    }
  }
  
  // # save
  async function Save_() {
    await storageUtil.setItem_(local.storageName, data);
  }
  
  async function restoreData_() {
    let storeData = await storageUtil.getItem_(local.storageName);
    data = storeData ?? JSON.parse(defaultDataJSON);
  }
  
  return SELF;
    
}