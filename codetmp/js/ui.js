let ui = (function() {
  
  let SELF = {
    OpenDiskFile,
    states: {
      storage: constant.STORAGE_STATE.Default,
    },
    tab: {
      openDirectory: function(self) {
        if (self.dataset.parentId != '' && self.classList.contains('isActive')) {
          let parentId = parseInt(self.dataset.parentId);
          tabManager.openDirectory(parentId);
        }
        event.preventDefault();
      },
    },
    fileGenerator: {
      generate: function() {
        let form = this.form;
        singleFileGenerator.generate(form);
      },
      copy: function() {
        let form = this.form;
        singleFileGenerator.copy(form);
      },
    },
    tree: {
      renameFolder: function(folder) {
        app.getComponent('fileTree').then(fileTree => {
          fileTree.renameItem(folder, 'folder');
        });
      },
      renameFile: function(file) {
        app.getComponent('fileTree').then(fileTree => {
          fileTree.renameItem(file, 'file');
        });
      },
      appendFile: function(file) {
        app.getComponent('fileTree').then(ft => {
          ft.appendFile(file);
        });
      },
      appendFolder: function(folder) {
        app.getComponent('fileTree').then(ft => {
          ft.appendFolder(folder);
        });
      },
      createWorkspace: function() {
        app.getComponent('fileTree').then(ft => {
          ft.createWorkspace(activeFolder);
        });
      },
    },
    
    highlightTree,
    reloadFileTree,
    myFiles,
    trash,
    toggleTheme,
    toggleInFrame,
    setFontSize,
    changeFileListView,
    reloadOpenTab,
    toggleFileDownload,
    toggleGenerateSingleFile,
    previewMedia,
    closeMediaPreview,
    enableJSZip,
    toggleMyFiles,
    toggleFileActionButton,
    setGitToken,
  
    fileManager: (function() {
  
      function commit(data) {
        fileManager.sync(data);
        drive.syncToDrive();
        fileStorage.save();
        fileManager.list();
      }
  
      function getSelected(el) {
        return {
          title: el.getAttribute('title'),
          id: Number(el.getAttribute('data')),
        };
      }
  
      function renameFolder() {
  
          if (activeWorkspace == 2) {
            alert('Renaming folder in file system mode is not yet supported.');
            return;
          }
  
          let selection = getSelected(selectedFile[0]);
          modal.prompt('Rename', selection.title, '', helper.getFileNameLength(selection.title)).then(async (name) => {
            if (!name || name === selection.title) return;
          
              let folder = await fileManager.RenameFolder(selection.id, name);
              ui.tree.renameFolder(folder);
  
          });
        }
        
        function renameFile() {
          let selection = getSelected(selectedFile[0]);
          let fid = selection.id;
            modal.prompt('Rename', selection.title, '', helper.getFileNameLength(selection.title)).then(async (name) => {
              if (!name || name == selection.title) 
                return;
  
              let file = await fileManager.RenameFile(fid, name);
              ui.tree.renameFile(file);
  
              if (activeFile) {
                if (fid === activeFile.fid)
                  compoEditor.SetMode(file.name);
                
                let index = 0
                for (let tab of fileTab) {
                  if (tab.fid == fid) {
                    $('.file-name')[index].textContent = file.name;
                    break;
                  }
                  index++;
                }
              }
            });
        }
        function newFolder() {
            if (!$('#in-my-files').classList.contains('active'))
              return;
            
            modal.prompt('Folder name', 'New Folder').then(async (name) => {
              if (!name) 
                return;
  
              let folder = await fileManager.CreateFolder({
                  name: await fileManager.getDuplicateName(activeFolder, name, 'folder'),
                  modifiedTime: new Date().toISOString(),
                  parentId: activeFolder,
              });
              commit({
                fid: folder.fid,
                action: 'create',
                type: 'folders',
              });
              uiExplorer.ClearFileSelection();
              ui.tree.appendFolder(folder);
  
            });
        }
  
        function newFile() {
            if (!$('#in-my-files').classList.contains('active')) {
              ui.openNewTab();
              return;
            }
            
            modal.prompt('File name', 'Untitled').then(async (name) => {
              if (!name) 
                return;
              let file = await fileManager.CreateFile({
                  name: await fileManager.getDuplicateName(activeFolder, name),
                  modifiedTime: new Date().toISOString(),
                  content: '',
              });
              commit({
                fid: file.fid,
                action: 'create',
                type: 'files',
              });
              uiExplorer.ClearFileSelection();
              ui.tree.appendFile(file);
  
            });
        }
        
        function confirmDeletion(message) {
          return new Promise(resolve => {
            modal.confirm(message).then(() => {
              resolve();
            })
          })
        }
  
        async function deleteFolder(selectedFile) {
          let selection = getSelected(selectedFile);
          let fid = selection.id;
          await fileManager.TaskDeleteFolder(fid);
        }
  
        async function deleteFile(selectedFile) {
          let selection = getSelected(selectedFile);
          let fid = selection.id;
          await fileManager.TaskDeleteFile(fid);
  
          if (activeFile && parseInt(fid) == parseInt(activeFile.fid)) {
            activeFile = null;
            fileTab[activeTab].fiber = 'fiber_manual_record';
            $('.icon-rename')[activeTab].textContent = 'fiber_manual_record';
          }
        }
  
        async function unloadSelection(selectedFile, type) {
          let selection = getSelected(selectedFile);
          let fid = selection.id;
          await fileManager.UnloadItem(fid, type);
        }
  
        function deleteSelected() {
          if (selectedFile.length === 1) {
            confirmDeletion('Move selected item to trash?').then(async () => {
              if (selectedFile[0].getAttribute('data-type') === 'folder')
                deleteFolder(selectedFile[0]);
              else if (selectedFile[0].getAttribute('data-type') === 'file')
                deleteFile(selectedFile[0]);
              uiExplorer.ClearFileSelection();
            })
          } else if (selectedFile.length > 1) {
            confirmDeletion('Move selected items to trash?').then(async () => {
              while (selectedFile.length > 0) {
                let selection = selectedFile[0];
                if (selection.getAttribute('data-type') === 'folder')
                  await deleteFolder(selection);
                else if (selection.getAttribute('data-type') === 'file')
                  await deleteFile(selection);  
              }
              uiExplorer.ClearFileSelection();
            });
          }
        }
  
        function UnloadSelected() {
          if (selectedFile.length === 1) {
            confirmDeletion('Unload selected item?').then(async () => {
              if (selectedFile[0].getAttribute('data-type') === 'folder')
                unloadSelection(selectedFile[0], 'folders');
              else if (selectedFile[0].getAttribute('data-type') === 'file')
                unloadSelection(selectedFile[0], 'files');
              uiExplorer.ClearFileSelection();
            })
          } else if (selectedFile.length > 1) {
            alert('Multiple unload currently not suppoerted')
          }
        }
  
      return {
        renameFolder,
        renameFile,
        newFolder,
        newFile,
        deleteSelected,
        getSelected,
        UnloadSelected,
      };
  
    })(), // end of ui.fileManager
  
    Init,
    hidePalette,
    toggleBreakPoint,
    initEditorSmartBookmark,
    newFile,
    newDiskFile,
    resizeEditor,
    fileDownload,
    alert,
    cloneRepo,
    confirmClearData,
    switchTab,
    openNewTab,
    toggleAutoSync,
    toggleSaveToken,
    ToggleHomepageSetting,
    ToggleHomepage,
    toggleMenu,
    toggleActionMenu,
    toggleInsertSnippet,
    changeWorkspace,
    uploadFile,

    ToggleModalByClick,
    toggleModal,
    InitFileHandler,
  };

  // init workspace data
  {

    let navStructure = {
      root: {
        activeFile: null,
        fileTab: [],
        selectedFile: [],
        activeTab: 0,
        activeFolder: -1,
        breadcrumbs: [{folderId:-1,title:'My Files'}],
      },
    };
    
    let navMain = new lsdb('nav-main', navStructure);
    let navTemp = new lsdb('nav-temp', navStructure);
    let navLocal = new lsdb('nav-local', navStructure);
    let navs = [navMain, navTemp, navLocal];
    
    for (let key in navStructure.root) {
      Object.defineProperty(window, key, { 
        get: () => navs[activeWorkspace].data[key],
        set: value => navs[activeWorkspace].data[key] = value,
      })
    }

  }

  function ToggleModalByClick() {
    toggleModal(this.dataset.target);
  }

  function toggleModal(name) {
    let modal = $(`.modal-component[data-name="${name}"]`)[0];
    modal.addEventListener('onclose', onclosemodal);
    modal.toggle();
    compoStateManager.pushState([0]);
  }
    
  function onclosemodal(event) {
    let modal = event.target;
    modal.removeEventListener('onclose', onclosemodal);
    // delay to handle global key listener
    window.setTimeout(() => {
      compoStateManager.popState([0]);
    }, 50)
  }

  function highlightTree(fid, isRevealFileTree = true) {
    app.getComponent('fileTree').then(ft => {
      ft.highlightTree(fid, isRevealFileTree);
    });
  }

  function reloadFileTree() {
    app.getComponent('fileTree').then(ft => {
      ft.reload();
    });
  }

  async function changeWorkspace(targetEl) {

    let dataTarget = targetEl.dataset.target;
    let dataStorage = targetEl.dataset.storage;
    let dataIndex = targetEl.dataset.index;

    if (dataTarget != $('#workspace-title').textContent) {
      for (let node of $('.workspace .Btn')) {
        node.classList.toggle('active', false);
        if (targetEl == node) {
          node.classList.toggle('active', true);
        }
      }
      $('#workspace-title').textContent = dataTarget;
      let index = parseInt(dataIndex);
      document.body.stateList.toggle('fs-mode', (index == 2));
      ui.states.storage = constant.STORAGE_STATE[dataStorage];
      activeWorkspace = index;
      await fileManager.list();
      tabManager.list();
      if (fileTab.length === 0) {
        ui.openNewTab();
      }
      tabManager.focusTab(fileTab[activeTab].fid);
      uiExplorer.LoadBreadCrumbs();
      app.getComponent('fileTree').then(ft => {
        app.fileTree.reset();
      });
    }

  }

  function myFiles() {
    $('#btn-menu-my-files').click();
  }

  function trash() {
    if (!$('#in-trash').classList.contains('active'))
      $('#btn-menu-trash').click();
  }

  function toggleTheme() {
    let editor = fileTab[activeTab].editor.env.editor;
    if (editor.getTheme().includes('codetmp')) {
      editor.setTheme('ace/theme/github');
    } else {
      ace.config.set('basePath', 'assets/ace');
      editor.setTheme('ace/theme/codetmp');
      ace.config.set('basePath', ACE_CDN_BASEPATH);
    }
  }

  function toggleInFrame() {
    $('#main-layout').classList.toggle('inframe-mode');
    $('#main-layout').classList.toggle('normal-mode');
    previewHandler.previewMode = (previewHandler.previewMode == 'normal') ? 'inframe' : 'normal';
    fileTab[activeTab].editor.env.editor.session.setUseWrapMode(settings.data.editor.wordWrapEnabled);
  }

  function setFontSize() {
    modal.prompt('Editor Font Size', 16).then(size => {
      size = parseInt(size);
      if (size) {
        for (let tab of fileTab) {
          tab.editor.env.editor.setFontSize(size);
        }
      }
    });
  }

  function changeFileListView() {
    changeExplorerView(this.dataset.type);
  }

  async function uploadFile(self) {
    $('#file-upload').click();
  }

  function reloadOpenTab(fid, content) {
    for (let tab of fileTab) {
      if (tab.fid == fid) {
        tab.editor.env.editor.setValue(content);
      }
    }
  }

  function toggleFileDownload() {
    toggleModal('file-download');
  }

  function toggleGenerateSingleFile() {
    toggleModal('generate-single-file');
  }

  function previewMedia(file, mimeType) {
    toggleModal('media-preview');

    let media;
    if (mimeType.includes('audio')) 
      media = document.createElement('audio');
    else if (mimeType.includes('video'))
      media = document.createElement('video');
    else if (mimeType.includes('image')) {
      media = document.createElement('img');
    }
    media.classList.add('Medial-el');
    media.setAttribute('controls','controls');
    let modal = $('.modal-component[data-name="media-preview"]')[0];
    $('.media', modal)[0].innerHTML = '';
    $('.media', modal)[0].append(media);
    
    return new Promise((resolve, reject) => {
      fileManager.TaskGetPreviewLink(file).then(resolve).catch(reject);
    }).then(src => {
      media.src = src;
      $('.title', modal)[0].textContent = file.name;
      $('.download', modal)[0].onclick = () => {
        let a = document.createElement('a');
        a.href = src;
        a.target = '_blank';
        a.download = file.name;
        $('#limbo').appendChild(a);
        a.click();
        $('#limbo').removeChild(a);
      };
    }).catch(() => {
      aww.pop('Failed to preview media.');
    });
  }

  function closeMediaPreview() {
    let src = $('.media-preview .Media')[0].src;
    $('.media-preview .Title')[0].textContent = '';
    $('.media-preview .Download')[0].onclick = null;
    $('.media-preview .Medial-el')[0].remove();
    URL.revokeObjectURL(src);
  }

  function enableJSZip() {
    $('.clickable[data-callback="file-download"]')[0].classList.toggle('hide', false);
  }

  function toggleMyFiles() {
    if (compoStateManager.isState(1)) return;
    
    $('#btn-menu-my-files').click()
    if ($('#btn-menu-my-files').classList.contains('active')) {
      fileTab[activeTab].editor.env.editor.blur();
      compoStateManager.pushState([1]);
      setTimeout(() => { document.activeElement.blur() }, 1);
    } else {
      // fileClipBoard.clipBoard.length = 0;
      compoStateManager.popState([1]);
      setTimeout(() => { 
        ui.resizeEditor();
        fileTab[activeTab].editor.env.editor.focus(); 
        
      }, 1);
    }
  }

  function toggleFileActionButton() {
    let isHide = (selectedFile.length === 0);
    o.classList.toggle($('.btn-file-action'), 'w3-hide', isHide);
  }

  function setGitToken() {
    toggleModal('settings');
    modal.prompt('Personal access token').then(token => {
      if (token !== null) {
        git.setToken(token);
        aww.pop('Personal access token has been set.');
      }
    });
  }
  
  function toggleMenu() {
    let targetId = this.getAttribute('target');
    let useCallback = true;
    let targetNode = this;
    ui.toggleActionMenu(targetId, useCallback, targetNode);
  }
  
  function toggleActionMenu(targetId, useCallback, targetNode) {
    let target;
    if (targetId)
      target = $('#'+targetId);
    else
      target = targetNode;

    target.classList.toggle('active');
    
    
    target.lastElementChild.classList.toggle('active');
    target.firstElementChild.classList.toggle('active');
    let menuId = target.getAttribute('menu');
    let menu = $('#'+menuId);
    let block = $('#'+menuId+'-block');
    
    if (target.classList.contains('active') && (menuId === 'in-my-files' || menuId === 'in-trash')) {
      
      if (useCallback) {
        $('#list-trash').innerHTML = '';
        $('#file-list').innerHTML = '';
        if (menuId === 'in-my-files') {
          fileManager.list();
        } else if (menuId === 'in-trash') {
          trashList();
        }
      }

      toggleInsertSnippet(false);
    }

    if (!menu) {
      setTimeout(function(){
        target.classList.toggle('active',false);
        target.lastElementChild.classList.toggle('active',false);
        target.firstElementChild.classList.toggle('active',false);
      }, 500);
      return;
    }
    
    for (let el of $('.btn-material')) {
      
      if (el !== target) {
        
        if (!el.classList.contains('active')) continue;
        el.classList.toggle('active',false);
        el.lastElementChild.classList.toggle('active',false);
        el.firstElementChild.classList.toggle('active',false);
        let menuId = el.getAttribute('menu');
        if (menuId === null) continue
        let menu = $('#'+menuId);
        let block = $('#'+menuId+'-block');
        menu.classList.toggle('active',false);
        block.classList.toggle('active',false);
      }
    }
     
    menu.classList.toggle('active');
    if (typeof(block) != 'undefined')
      block.classList.toggle('active');
    
    if (!menu.classList.contains('active')) {
      selectedFile = [];
    }

    if ($('#in-my-files').classList.contains('active')) {
      $('#btn-menu-save-wrapper').classList.toggle('hide', true);
      $('#btn-menu-preview-wrapper').classList.toggle('hide', true);
      $('#btn-menu-template').classList.toggle('hide', true);

      $('#btn-home-wrapper').classList.toggle('hide', false);
      $('#btn-account-wrapper').classList.toggle('hide', false);
      $('#btn-undo').classList.toggle('hide', true);
      $('#btn-redo').classList.toggle('hide', true);
      compoStateManager.pushState([1]);
    } else {
      $('#btn-menu-save-wrapper').classList.toggle('hide', false);
      $('#btn-menu-preview-wrapper').classList.toggle('hide', false);
      $('#btn-menu-template').classList.toggle('hide', false);
      $('#btn-home-wrapper').classList.toggle('hide', true);
      $('#btn-account-wrapper').classList.toggle('hide', true);
      $('#btn-undo').classList.toggle('hide', false);
      $('#btn-redo').classList.toggle('hide', false);
      compoStateManager.popState([1]);
    }
  }
  
  function toggleInsertSnippet(persistent) {
    if ($('#in-my-files').classList.contains('active')) return
  
    let el = $('.search-box')[0];
    if (typeof(persistent) == 'undefined')
      el.classList.toggle('w3-hide');
    else
      el.classList.toggle('w3-hide', !persistent);
  
    $('#search-input').addEventListener('blur', ui.hidePalette);
  
    if (!el.classList.contains('w3-hide')) {
      $('#search-input').value = '';
      setTimeout(() => { $('#search-input').focus(); }, 1);
    } else {
      setTimeout(() => { document.activeElement.blur() }, 1);
      if (typeof(persistent) === 'undefined')
        fileTab[activeTab].editor.env.editor.focus();
      $('#search-input').value = '';
      $('#search-input').blur();
    }
  }

  function switchTab(direction = 1) {
    if ($('#in-my-files').classList.contains('active') || fileTab.length == 1) 
      return;
    let fid;
    if (activeTab + direction > 0 && activeTab + direction < fileTab.length)
      fid = fileTab[activeTab + direction].fid
    else
      fid = (activeTab + direction == -1) ? fileTab[fileTab.length - 1].fid : fileTab[0].fid;
      tabManager.focusTab(fid);
  }
  
  function openNewTab(position, data) {
    tabManager.newTab(position, data);
  }
  
  function toggleAutoSync() {
    settings.data.autoSync = !settings.data.autoSync;
    settings.save();
    $('#check-auto-sync').checked = settings.data.autoSync ? true : false;
  }

  function toggleSaveToken() {
    settings.data.saveGitToken = !settings.data.saveGitToken;
    settings.save();
    $('#check-save-token').checked = settings.data.saveGitToken ? true : false;
  }

  function ToggleHomepageSetting() {
    settings.data.showHomepage = !settings.data.showHomepage;
    settings.save();
    $('#check-show-homepage').checked = settings.data.showHomepage ? true : false;
  }

  function ToggleHomepage() {
    $('#sidebar').classList.toggle('HIDE');
    $('#in-home').classList.toggle('active');
    $('#main-editor').classList.toggle('editor-mode');
    if ($('#in-my-files').classList.contains('active')) {
      $('#btn-menu-my-files').click();
    }
  }
  
  function cloneRepo() {
    let message = $('#msg-git-rate-limit').content.cloneNode(true).firstElementChild;
    $('.Rate', message)[0].textContent = git.rateLimit;
    modal.prompt('Repository web URL', 'https://github.com/username/repository', message.innerHTML).then(url => {
      if (!url) 
        return;
      ui.alert({text:'Cloning repository...'});
      git.clone(url);
    });
  }

  function confirmClearData() {
    modal.confirm('This will delete all Codetmp saved files & folders on current browser. Continue?', false).then(async () => {
      await fileManager.TaskClearStorage();
      location.reload();
    });
  }
  
  function alert({text, isPersistent = false, timeout}) {
    aww.pop(text, isPersistent, timeout);
  }
  
  function fileDownload(self) {
    app.getComponent('fileBundler').then(fb => {
      fb.fileDownload(self);
    }).catch((e) => {
      console.log(e);
      aww.pop('Component is not ready. Try again later.');
    });
  }

  function resizeEditor() {
    let editor = fileTab[activeTab].editor;
    editor.env.editor.resize()
  }

  function newFile() {
    if (!$('#btn-menu-my-files').classList.contains('active')) {
      ui.openNewTab();
    }
  }
  
  function newDiskFile() {
    if (!$('#btn-menu-my-files').classList.contains('active')) {
      window.showSaveFilePicker({
        types: [
          {
            description: 'HTML (.html)',
            accept: {
              'text/javascript': ['.html'],
            },
          },
        ],
      }).then(fileHandle => {
        let tabData = {
          fileHandle,
          content: '',
          fid: '-' + (new Date).getTime(),
          name: fileHandle.name,
          editor: compoEditor.Init(),
        };
        ui.openNewTab(-1, tabData);
      });
    }
  }
  
  function OpenDiskFile() {
    fileReaderModule.OpenDirectory();
  }

  function InitFileHandler() {
  
    if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
      launchQueue.setConsumer((launchParams) => {
        if (!launchParams.files.length) {
          return;
        }
        for (const fileHandle of launchParams.files) {
          fileHandle.getFile().then(openOnEditor.bind(fileHandle));
        }
      });
      
      async function openOnEditor(fileRef) {
        let content = await fileRef.text();
        let tabData = {
          content,
          fileHandle: this,
          fid: '-' + (new Date).getTime(),
          name: fileRef.name,
          editor: compoEditor.Init(content),
        };
        ui.openNewTab(-1, tabData);
      }
      
    }
    
  }

  // init
  function Init() {
    
    attachListeners();

    compoNotif.Init();

    // initInframeLayout();
    fileManager.TaskOnStorageReady().then(() => {
      fileManager.list();
    });
    preferences.loadSettings();
    ui.openNewTab();
    tabManager.InitTabFocusHandler();
    window.setTimeout(() => { 
      ui.resizeEditor();
    }, 350)
    
    // initMenuBar();
    changeExplorerView(settings.data.explorer.view);

    for (let modal of $('.modal-window')) {
      modal.classList.toggle('transition-enabled', true);
      $('.Overlay',modal)[0].addEventListener('click', ui.ToggleModalByClick);
      $('.Btn-close',modal)[0].addEventListener('click', ui.ToggleModalByClick);
    }
    
    function preventDefault(event) {
      event.preventDefault();
    }
    
    function blur() {
      document.activeElement.blur();
    }
    
    attachSubmitable('.submittable', DOMEvents.submittable);
    attachClickable('.clickable', DOMEvents.clickable);
    attachInputable('.inputable', DOMEvents.inputable);

    function attachSubmitable(selector, callback) {
      for (let node of document.querySelectorAll(selector)) {
        if (node.classList.contains('preventDefault'))
          node.addEventListener('submit', preventDefault);
        node.addEventListener('submit', callback[node.dataset.callback]);
      }
    }

    function attachClickable(selector, callback) {
      for (let element of document.querySelectorAll(selector)) {
        element.addEventListener('click', callback[element.dataset.callback]);
        element.addEventListener('click', blur);
      }
    }

    function attachInputable(selector, callback) {
      for (let element of document.querySelectorAll(selector))
        element.addEventListener('input', callback[element.dataset.callback]);
    }

    o.listen({
      '.btn-material': ui.toggleMenu,
    });
    // initNavMenus();
    // attachMouseListener();
  }

  function changeExplorerView(type) {
    if (!['list', 'grid'].includes(type))
      return;
  
    settings.data.explorer.view = type;
    settings.save();
    $('#file-list').classList.toggle('list-view', (type == 'list'));
    for (let node of $('.Btn[data-callback="change-file-list-view"]')) {
      node.classList.toggle('active', false);
      if (node.dataset.type == type) {
        node.classList.toggle('active', true);
        $('#view-type-icon').innerHTML = $('.material-icons', node)[0].innerHTML;
      }
    }
  }

  function attachListeners() {
    window.addEventListener('online', () => app.AutoSync());
    window.addEventListener('cut', (evt) => fileClipBoard.handler(evt));
    window.addEventListener('copy', (evt) => fileClipBoard.handler(evt));
    window.addEventListener('paste', (evt) => fileClipBoard.handler(evt));
    window.onbeforeunload = function(evt) {
      return helper.redirectWarning(evt);
    };
  }

  async function hidePalette(event) {
    await delayMs(10);
    let el = $('.search-box')[0];
    el.classList.toggle('w3-hide', true);
    $('#search-input').value = '';
    $('#search-input').removeEventListener('blur', ui.hidePalette);
  }

  function delayMs(timeout) {
    return new Promise(resolve => window.setTimeout(resolve, timeout));
  }


  function toggleBreakPoint(editor) {
    let row = editor.selection.getCursor().row;
    if(editor.session.getBreakpoints()[row] ) {
      editor.session.clearBreakpoint(row);
    } else {
      editor.session.setBreakpoint(row);
    }
  }

  function initEditorSmartBookmark(editor) {
    
    editor.commands.addCommand({
      name: "custom-bookmark",
      bindKey: {win: "Alt-K Alt-K"},
      exec: function(editor) {
        ui.toggleBreakPoint(editor);
      }
    });
    
    editor.session.doc.on('change', updateDataOnDocChange.bind(editor.session));
    
    function updateDataOnDocChange(e) {
      let delta = e;
      let range = e;
      let len, firstRow, f1;
              
      if (range.end.row == range.start.row)
        return;
                  
      if (delta.action == 'insert') {
        len = range.end.row - range.start.row;
        firstRow = range.start.row;
      } else if (delta.action == 'remove') {
        len = range.start.row - range.end.row;
        firstRow = range.start.row;
      }
      if (len > 0) {
        args = Array(len);
        args.unshift(firstRow, 0)
        this.$breakpoints.splice.apply(this.$breakpoints, args);
      } else if (len < 0) {
        let rem = this.$breakpoints.splice(firstRow + 1, -len);
        if(!this.$breakpoints[firstRow]){
          for (let oldBP in rem) {
            if (rem[oldBP]) {
              this.$breakpoints[firstRow] = rem[oldBP]
              break 
            }
          }
        }
      }
    }
    
    editor.commands.addCommand({
      name: "custom-clear-bookmark",
      bindKey: {win: "Alt-K Alt-L"},
      exec: function(editor) {
        if (window.confirm('Clear all bookmark?')) {
          editor.session.clearBreakpoints();
        }
      }
    });
    
    editor.commands.addCommand({
      name: "custom-next-bookmark",
      bindKey: {win: "Ctrl-Alt-."},
      exec: function(editor) {
        let row = editor.selection.getCursor().row+1;
        
        let found = false;
        
        for (let i=row; i<editor.session.$breakpoints.length; i++) {
          if (editor.session.$breakpoints[i] !== undefined) {
            editor.gotoLine(i+1)
            found = true;
            break;
          }
        }
        if (!found) {
        for (let i=0; i<row; i++) {
            if (editor.session.$breakpoints[i] !== undefined) {
              editor.gotoLine(i+1)
              break;
            }
          } 
        }
      }
  
    });
    
    editor.commands.addCommand({
      name: "custom-previous-bookmark",
      bindKey: {win: "Ctrl-Alt-,"},
      exec: function(editor) {
        let row = editor.selection.getCursor().row+1;
        let found = false;
        for (let i=row-2; i>=0; i--) {
          if (editor.session.$breakpoints[i] !== undefined) {
            editor.gotoLine(i+1)
            found = true;
            break;
          }
        }
        if (!found) {
        for (let i=editor.session.$breakpoints.length; i>row; i--) {
            if (editor.session.$breakpoints[i] !== undefined) {
              editor.gotoLine(i+1)
              break;
            }
          } 
        }
      }
    });
  }

  return SELF;
  
})();