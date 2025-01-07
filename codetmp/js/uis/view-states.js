let viewStateRoot = ViewStateFactory({
  selector: 'body > [data-view-name]',
  transitionTimeout: 150, // adjust to your screen transition time
  onHide: ({node, viewName}) => {
    // reset form, empty element, reset UI, etc.
  },
  onShow: ({node, viewName, isFirstRender}) => {
    if (isFirstRender) {
      DOMEvents.Listen(eventsMap, node);

      switch (viewName) {
        case 'editor': ui.HandleFirstRenderEditor(); break;
      }
    }
  },
});