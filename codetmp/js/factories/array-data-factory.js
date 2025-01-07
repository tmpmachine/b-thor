/* v1 */
function ArrayDataFactory(opt) {
  
  let SELF = {
    Remove: (id) => server.RemoveItem(id),
    Add: (item) => server.AddItem(item),
    GetAll: () => server.GetAll(),
    GetById: (id) => server.GetItem(id),
    GetIndex: (id) => server.GetIndex(id),
    Reset: () => {
      data = JSON.parse(defaultDataJSON);
      server.SetDataItems(data.items);
    },
    Clear: () => server.Clear(),
    
    ChangeWorkspace_,
    Save_,
    Extends,
  };
  
  // # data
  let data = {
    items: opt?.defaultData ?? [],
  };
  let defaultDataJSON = JSON.stringify(data);
  
  let local = {
    storageName: '', // assigned on workspace change
  };

  let server = new DataServer({
    dataItems: data.items,
    adaptor: {
      lookupKey: 'id',
      GetItem: (item, value) => item.id == value,
    }
  });
  
  // # functions
  
  function Extends(builder) {
    let keys = builder(server);
    for (let key in keys) {
      SELF[key] = keys[key];
    }

    return SELF;
  }

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
    server.SetDataItems(data.items);
  }
  
  return SELF;
    
}