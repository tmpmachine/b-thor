/* v1 */
let compoAppData = (function() {
  
  // # self  
  let SELF = {
    GetActiveWorkspaceId,
    Init_,
    Configure,
    ChangeWorkspace_,
    Add,
    Delete_,
    Rename,
    SetActiveWorkspaceId,
    ClearData_,
    Save_,
    server: {
      RemoveItem: (id) => server.RemoveItem(id),
      // AddItem: (item) => server.AddItem(item),
      GetAll: () => server.GetAll(),
      GetById: (id) => server.GetItem(id),
      GetIndex: (id) => server.GetIndex(id),
      Clear: () => server.Clear()
    },
    GetStoreData_,
  };
  
  let data = {
    activeId: -1,
    items: [],
  };
  
  // # local
  let local = {
    storageName: 'app-profiles',
    serversConfig: { },
    storeKeyPrefixes: { }
  };
  
  let server = new DataServer({
    dataItems: data.items,
    adaptor: {
      lookupKey: 'id',
      GetItem: (item, value) => item.id == value,
    }
  });
  
  // # function
  
  function Configure(serversConfig) {
    for (let key in serversConfig) {
      local.storeKeyPrefixes[key] = '';
    }

    local.serversConfig = serversConfig;
  }

  async function GetStoreData_() {
    let workspaceMap = await storageUtil.getItem_(local.storageName);
    let entries = [];
    
    for (let workspace of workspaceMap.items) {
      let {id} = workspace;
      
      for (let key in local.storeKeyPrefixes) {
        let storeKey = `${key}-${id}`;
        let value = await storageUtil.getItem_(storeKey);
        
        if (value === null) continue;
        entries.push({
          key: storeKey,
          value,
        });
      }
    }
    
    
    entries.push({
      key: local.storageName,
      value: workspaceMap,
    })
    
    return {
      entries,
    };
  }
  
  // # delete
  async function Delete_(id) {
    let item = server.GetItem(id);
    
    server.RemoveItem(id);
    let storeKeys = getStoreKeys(id);
    
    for (let key in storeKeys) {
      let storeKey = storeKeys[key];
      await storageUtil.removeItem_(storeKey);
    }
  }
  
  // # change, # restore
  async function ChangeWorkspace_(id) {
    SetActiveWorkspaceId(id);
    
    let item = server.GetItem(id);
    let storeKeys = getStoreKeys(item.id);
    
    for (let key in local.serversConfig) {
      let serverObj = local.serversConfig[key];
      await serverObj.ChangeWorkspace_(storeKeys[key]);
    }

  }
  
  function getStoreKeys(id) {
    let storekeys = {};
    
    for (let key in local.storeKeyPrefixes) {
      let value = `${key}-${id}`;
      storekeys[key] = value;
    }
    
    return storekeys;
  }
  
  function SetActiveWorkspaceId(id) {
    data.activeId = id;
  } 
  
  function Rename(id, name) {
    let item = server.GetItem(id);
    item.name = name;
  }
  
  function GetActiveWorkspaceId() {
    return data.activeId;
  }
      
  // # add, # create
  function Add({name}) {
    let id = Date.now();
    let item = {
      name,
      id,
    };
    
    data.items.push(item);
    
    return id;
  }
  
  async function ClearData_() {
    await storageUtil.removeItem_(local.storageName);
  }
  
  // # init
  async function Init_() {
    await restoreData_();
    
    if (data.items.length == 0) {
      let id = await Add({
        name: 'Default',
      });
      SetActiveWorkspaceId(id);
      await Save_();
    }
    
    await ChangeWorkspace_(data.activeId);
  }
  
  async function Save_() {
    await storageUtil.setItem_(local.storageName, data);
  }
  
  // # restore
  async function restoreData_() {
    let storeData = await storageUtil.getItem_(local.storageName);
    
    if (!storeData) return;
    
    data = storeData;
    server.SetDataItems(data.items);
  }
  
  
  return SELF;
  
})();