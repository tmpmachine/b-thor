let eventsMap = {
    /* ----- */
    /*
        DOM event handlers are structured as below :

        className {
            data-callback-attribute: callbackFunction
        }
    */
    onclick: {
        'navigate': (evt) => ui.NavigateView(evt),
        'authorize': () => compoGsi.RequestToken(),
        'revoke-access': () => ui.RevokeAccess(),
        'handle-sidebar-btn-click': (evt) => ui.HandleSidebarBtnClick(evt.target), 
        'btn-menu-preview': () => compoPreview.previewPath(),
        'create-session': () => ui.CreateSession(),
        'handle-file-list-click': (evt) => uiFileExplorer.HandleClickList(evt.target),
        'upload-file': (evt) => ui.uploadFile(evt),
        'file-rename': () => uiFileExplorer.RenameFile(),
        'file-delete': (evt) => uiFileExplorer.deleteSelected(evt),
        'file-unload': (evt) => uiFileExplorer.UnloadSelected(evt.target),
        'file-download': (evt) => ui.toggleFileDownload(evt),
        'copy': () => compoClipboard.copy(),
        'move': () => compoClipboard.cut(),
        'paste': () => compoClipboard.paste(),
        'modal': (evt) => ui.ToggleModalByClick(evt),

        'sync-from-drive': () => compoDrive.syncFromDrive(),

        'clone-repo': () => ui.cloneRepo(),
        'toggle-homepage': () => ui.ToggleHomepage(),
        'toggle-settings': () => ui.ToggleModal('settings'),
        'toggle-account': () => ui.ToggleModal('account'),
        'new-folder': () => uiFileExplorer.newFolder(),
        'new-file': () => uiFileExplorer.newFile(),
        'sign-out': () => app.SignOut(),
        'grant-firebase-access': () => compoGsi.Grant('https://www.googleapis.com/auth/firebase'),

        'change-workspace': (evt) => ui.changeWorkspace(evt.target.closest('[data-kind="item"]')),
        'change-file-list-view': () => ui.changeFileListView(),

        'btn-menu-template': () => ui.toggleInsertSnippet(),
        'btn-menu-save': () => fileManager.save(),
        'btn-undo': () => { fileTab[activeTab].editor.env.editor.undo(); fileTab[activeTab].editor.env.editor.focus(); },
        'btn-redo': () => { fileTab[activeTab].editor.env.editor.redo(); fileTab[activeTab].editor.env.editor.focus(); },
        'more-tab': () => ui.switchTab(1),

        'expand-tree-explorer': function () {
            settings.data.explorer.tree = true;
            settings.save();
            document.body.classList.toggle('--tree-explorer', true);
        },
        'collapse-tree-explorer': function () {
            settings.data.explorer.tree = false;
            settings.save();
            document.body.classList.toggle('--tree-explorer', false);
        },
        'reload-file-tree': () => ui.reloadFileTree(),
        'generate-single-file': () => ui.fileGenerator.generate(),
        'copy-generated-file': () => ui.fileGenerator.copy(),
        'create-workspace': () => uiTreeExplorer.CreateWorkspace(),
    },
    onchange: {
        'apply-preferences': (evt) => preferences.ApplyCheckboxSettings(evt),
    },
    onmousedown: {
        'handle-click-file-tab': (evt) => uiFileTab.HandleClick(evt),
    },
    onsubmit: {
        'confirm-download': () => ui.fileDownload(),
        'deploy-hosting': (e) => compoFirebaseHosting.deploy(e),
    },
    oninput: {
        'select-project': () => compoFirebaseHosting.selectProject(this.value),
        'select-site': () => compoFirebaseHosting.selectSite(this.value),
        'cmd-search-command': (evt) => compoSnippet.find(evt.target.value),
    },
    onkeydown: {
        'cmd-select-command': () => compoSnippet.selectHints(),
    },
};

let eventsMapOld = {
    contextmenu: {
        'handle-ctxmenu-file-tab': (evt) => uiFileTab.HandleContextMenu(evt),
    },
    

    /*
        Similiar to clickable group with addition of handling menu UI i.e closing selected sub menu parent
        
        actual className : menu-link
        to do : determine a fitting className
    */
    clickableMenu: {
        'command-palette': () => ui.toggleTemplate(),
        'open-in-explorer': () => uiFileExplorer.OpenFileDirectoryAsync(),
        'new-file': () => ui.newFile(),
        'new-file-on-disk': () => ui.newDiskFile(),
        'open-disk-folder': () => ui.OpenDiskFile(),
        'new-folder': () => uiFileExplorer.newFolder(),
        'save': () => fileManager.save(),
        'save-all': () => fileManager.TaskSaveAll(),
        'preview': () => compoPreview.previewPath(),
        'preview-at-pwa': () => compoPreview.previewPathAtPWA(),
        'my-files': () => ui.myFiles(),
        'trash': () => ui.trash(),
        'toggle-editor-theme': () => ui.toggleTheme(),
        'toggle-word-wrap': () => preferences.toggleWordWrap(),
        'set-font-size': () => ui.setFontSize(),
        'about': () => ui.ToggleHomepage(),
        'sign-out': () => app.SignOut(),
        'generate-single-file': () => ui.toggleGenerateSingleFile(),
    },

    keyboardShortcuts: {
        'Alt+Shift+N': () => uiFileExplorer.newFolder(),
        'Alt+<': () => ui.switchTab(-1),
        'Alt+>': () => ui.switchTab(1),
        'Alt+P': () => ui.toggleGenerateSingleFile(),
        'Alt+M': () => {
            // if (!document.querySelector('#in-home').classList.contains('active'))
                // ui.toggleMyFiles();
        },
        'Alt+R': () => compoEditor.ToggleWrapMode(),
        'Alt+N': () => uiFileExplorer.newFile(),
        'Alt+Q': () => {
            document.body.classList.toggle('--tree-explorer');
            settings.data.explorer.tree = document.body.classList.contains('--tree-explorer');
            settings.save();
            ui.resizeEditor();
        },
        'Alt+W': () => compoFileTab.ConfirmCloseTab(),
        'Alt+O': () => uiFileExplorer.OpenFileDirectoryAsync(),
        'Ctrl+Shift+S': () => { event.preventDefault(); fileManager.TaskSaveAll(); },
        'Ctrl+S': () => { event.preventDefault(); fileManager.save(); },
        'Ctrl+D': () => { event.preventDefault(); uiFileExplorer.deleteSelected(); },
        'Ctrl+A': () => uiFileExplorer.SelectAllFiles(),
        'Ctrl+V': () => compoEditor.HandlePasteRow(),
        'Ctrl+O': () => { fileManager.TaskOpenLocal(event); },
        'Alt+D': () => {
            event.preventDefault();
            ui.toggleTemplate();
        },
        'Ctrl+Enter': function () {
            if (document.querySelector('#btn-menu-my-files').classList.contains('active')) {
                if (selectedFile.length > 0) {
                    uiFileExplorer.RenameFile();
                }
            } else {
                compoPreview.previewPath();
            }
        },
        'Ctrl+Shift+Enter': function () {
            if (!document.querySelector('#btn-menu-my-files').classList.contains('active')) {
                compoPreview.previewPathAtPWA();
            }
        },
        'Ctrl+O': function (evt) {
            evt.preventDefault();
            // check if is file system mode
            if (activeWorkspace == 2) {
                ui.OpenDiskFile();
            } else {
                alert('Feature not implemented. Try dragging and dropping the file into the editor.')
            }
        },
    },
}