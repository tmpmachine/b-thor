/* v1 */
let DOMStates = (function() {
  
  function query(opt, extraParams, resolve) {
    let {selector='', selectorBuilder, onUpdate} = opt;
    const nodes = extraParams?._elements ? extraParams._elements : document.querySelectorAll(`${selectorBuilder?.(extraParams) ?? selector}`);
    
    if (resolve) {
      (async function() {
        let result = await onUpdate(Array.from(nodes), extraParams);
        resolve(result);
      })();
      return;  
    } 
    
    return onUpdate(Array.from(nodes), extraParams);
  }
  
  function update(opt, extraParams, resolve) {
    return query(opt, {...(opt.extraParams ?? {}), ...extraParams}, resolve);
  }
  
  function getElements(selector='') {
    return Array.from(document.querySelectorAll(`${selector}`));
  }
  
  function create(opt) {
    
    let SELF = {
      update: (extraParams) => update(opt, extraParams),
      updateAsync: (extraParams) => {
        return new Promise(resolve => {
          update(opt, extraParams, resolve);
        });
      }, 
      getElements: () => getElements(opt.selector),
      clone: (options = {}) => {
        return create({...opt, ...options});
      },
    };
    
    return SELF;
  }
  
  return create;
})();