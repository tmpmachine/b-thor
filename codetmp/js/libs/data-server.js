function DataServer(config = {
    lookupKey: 'id',
}) {

  let SELF = {
      GetAll,
      GetItem,
      AddItem,
      UpdateItem,
      GetIndex,
      Clear,
      RemoveItem,
      SetDataItems,
  };
  
  function SetDataItems(dataItems) {
    config.dataItems = dataItems;
  }

  function AddItem(itemObj) {
      if (config.lookupKey) {
          let index = GetIndex(itemObj[config.lookupKey]);
          if (index >= 0) return false;
      }
      
      config.dataItems.push(itemObj);
      return itemObj;
  }
  
  function UpdateItem(value, itemObj) {
      let itemIndex = GetIndex(value);
      if (itemIndex < 0) return false;
      
      config.dataItems[itemIndex] = itemObj;
      return itemObj;
  }

  function Clear() {
      config.dataItems.length = 0;
  }
  
  function GetIndex(value) {
      let items = GetAll();
      let lookupCallback = config.adaptor?.GetItem ?? lookup;
      return items.findIndex(item => lookupCallback(item, value));
  }
  
  function GetAll() {
      return config.dataItems;
  }
  
  function GetItem(value) {
      let lookupCallback = config.adaptor?.GetItem ?? lookup;
      let itemObj = config.dataItems.find(item => lookupCallback(item, value));
      if (itemObj !== undefined) return itemObj;
  
      return null;
  }

  function lookup(item, value) {
      return item[config.lookupKey] == value;
  }
  
  function RemoveItem(value) {
      let itemIndex = GetIndex(value);
      if (itemIndex < 0) return null;
      
      let item = config.dataItems.splice(itemIndex, 1);
      return item;
  }

  return SELF;

}