/* v4.x -- in development */
function ViewStateFactory(opt = {
    selector: null,
    onHide: null,
    onBeforeShow: null,
    onShow: null,
}) {

    let isAnimationStart = false;
    let selector = opt.selector;
    let defaultTransitionTimeout = opt.transitionTimeout ?? 1;

    let views = DOMStates({
        selector,
    })

    let activeView = DOMStates({
        selector: `${selector.trim()}:not(template)`,
    })

    let stateManager = views.clone({
        onUpdate: async (nodes, { name, transitionTimeout }) => {
            
            if (isAnimationStart) return;

            if (!transitionTimeout) {
                transitionTimeout = defaultTransitionTimeout;
            }
            
            let targetNode = nodes.find(node => node.dataset.viewName == name) ?? nodes.find(node => node.tagName != 'TEMPLATE') ?? nodes[0];
            let targetViewName = targetNode.dataset.viewName;

            if (targetNode.tagName == 'TEMPLATE') {
                let isAlreadyActive = nodes.some(node => node.dataset.viewName == targetViewName && node.tagName != 'TEMPLATE');
                if (isAlreadyActive) return;
            }

            let promises = [];

            nodes
                .filter(node => node.tagName != 'TEMPLATE')
                .forEach(async node => {
                    let viewName = node.dataset.viewName;
                    if (viewName == targetViewName) return; // active view

                    let anchorNode = nodes.find(t => t.tagName == 'TEMPLATE' && t.dataset.viewName == viewName);

                    if (!anchorNode) {
                        anchorNode = document.createElement('template');
                        anchorNode.dataset.viewName = viewName;
                        node.insertAdjacentElement('beforebegin', anchorNode);
                    }

                    node.dataset.hidden = true;

                    let hidePromise = new Promise(async resolve => {
                        await new Promise(resolve => window.setTimeout(resolve, transitionTimeout));
                        delete node.dataset.viewName;
                        opt.onHide?.({
                            node,
                            viewName: viewName,
                        });
                        anchorNode.content.append(node);
                        resolve();
                    });
                    promises.push(hidePromise);
                });

            await Promise.all(promises);

            isAnimationStart = true;

            let node = targetNode.content?.firstElementChild ?? targetNode;
            
            if (node) {
                node.dataset.viewName = targetViewName;

                opt.onBeforeShow?.({ 
                    node, 
                    viewName: targetViewName, 
                });

                targetNode.parentNode.append(node); // highest element order
                
                let isFirstRender = !node.dataset.rendered

                opt.onShow?.({ 
                    node, 
                    isFirstRender,
                    viewName: targetViewName, 
                });

                node.dataset.rendered = true;

                // delay 1ms to allow browser to render initial element state before starting transition
                window.setTimeout(() => {
                    delete node.dataset.hidden;
                }, 1);
            }

            await new Promise(resolve => setTimeout(() => {
                resolve();
            }, transitionTimeout));
        
            isAnimationStart = false;
        }
    });

    // # function
    function GetActiveNode() {
        return activeView.getElements()[0];
    }

    // # self
    let SELF = {
        GetActiveNode,
        Update_: async (opt) => await stateManager.updateAsync(opt),
    }

    return SELF;
}
