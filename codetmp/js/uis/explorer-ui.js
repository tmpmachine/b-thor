let uiExplorer = (function() {

    let SELF = {
        NavigationHandler,
        NavScrollDown,
        NavScrollUp,
        ToggleFileHighlight,
        ClearFileSelection,
        SelectAllFiles,
        PreviousFolder,
        DoubleClickOnFile,
        SelectFileByName,
        LoadBreadCrumbs,
        RenameFile,
        OpenFileConfirm,
        SetState,
    };

    let states = {
        lastClickEl: null,
        doubleClick: false,
    }

    function SetState(key, value) {
      if (typeof(states[key]) == 'undefined') return;

      states[key] = value;
    }

    function OpenFileConfirm(el) {

        let index = selectedFile.indexOf(el);
      
        if (compoKeyInput.pressedKeys.shiftKey || compoKeyInput.pressedKeys.ctrlKey) {
      
          states.doubleClick = false;
          if (index < 0) {
            if (compoKeyInput.pressedKeys.shiftKey) {
              if (selectedFile.length === 0) {
                selectedFile.push(el);
                ToggleFileHighlight(el, true);  
              } else {
                let last = selectedFile[selectedFile.length-1];
                ClearFileSelection();
                selectedFile.push(last)
      
                let direction = 'previousElementSibling';
                let ele = last.nextElementSibling; 
                while (ele) {
                  if (ele === el) {
                    direction = 'nextElementSibling';
                    break
                  } else {
                    ele = ele.nextElementSibling;
                  }
                }
      
                let next = last[direction];
                while (next) {
                  if (next.classList.contains('separator')) {
                    next = next[direction];
                  } else {
                    selectedFile.push(next);
                    if (next === el)
                      break;
                    next = next[direction];
                  }
                }
      
                for (let sel of selectedFile) {
                    ToggleFileHighlight(sel, true);  
                }
              }
            } else {
              selectedFile.push(el);
              ToggleFileHighlight(el, true);
            }
          } else {
            if (compoKeyInput.pressedKeys.shiftKey) {
      
            } else {
              selectedFile.splice(index, 1);
              ToggleFileHighlight(el, false);
            }
          }
          ui.toggleFileActionButton();
          return
          
        } else {
          
          for (let el of selectedFile) {
              ToggleFileHighlight(el, false);
            }
              
          if (selectedFile.length > 1) {
            selectedFile.length = 0;
            index = -1;
          }
      
          if (index < 0) {
            selectedFile[0] = el;
            states.doubleClick = false;
            ToggleFileHighlight(el, false);
          } 
        }
        
        if (!states.doubleClick) {
          states.lastClickEl = el;
          states.doubleClick = true;
          ToggleFileHighlight(states.lastClickEl, true);
          setTimeout(function(){
            states.doubleClick = false;
          }, 500);
        } else {
          let type = selectedFile[0].dataset.type;
          selectedFile.splice(0, 1);
          states.doubleClick = false;
          if (type == 'file') {
            fileManager.open(el.getAttribute('data'))
          } else {
            let folderId = Number(el.getAttribute('data'))
            fileManager.OpenFolder(folderId);
          }
          ToggleFileHighlight(states.lastClickEl, false);
        }
        
        ui.toggleFileActionButton();
      
    }

    function RenameFile() {
        if (selectedFile[0].dataset.type === 'folder') {
            ui.fileManager.renameFolder();
        } else {
            ui.fileManager.renameFile();
        }
    }
    
    function LoadBreadCrumbs() {
        $('#breadcrumbs').innerHTML = '';
        let i = 0;
        for (let b of breadcrumbs) {
            let button = $('#tmp-breadcrumb').content.cloneNode(true).firstElementChild;
            button.textContent = b.title;
            if (i == breadcrumbs.length-1) {
            button.classList.add('isActive');
            } else {
            button.dataset.fid = b.folderId;
            button.addEventListener('click', openBread);
            }
            $('#breadcrumbs').appendChild(button);
            i++;
        }
        let parentNode = $('#breadcrumbs').parentNode;
        parentNode.scrollTo(parentNode.scrollWidth, 0);
    }
    
    async function openBread() {
        let fid = this.dataset.fid;
        activeFolder = parseInt(fid);
        if (this.textContent == '..') {
            await fileManager.reloadBreadcrumb();
        } else {
            let idx = odin.idxOf(fid,breadcrumbs,'folderId');
            breadcrumbs = breadcrumbs.slice(0,idx+1);
        }
        await fileManager.list();
        ClearFileSelection();
    }

    function SelectFileByName(key) {

        let found = false;
        let matchName = [];
        for (let el of $('.folder-list')) {
          if (el.title.toLowerCase().startsWith(key)) {
            matchName.push(el);
          }
        }
      
        for (let el of $('.file-list')) {
          if (el.title.toLowerCase().startsWith(key)) {
            matchName.push(el);
          }
        }
      
        if (matchName.length == 0) {
          if (selectedFile.length > 0) {
            ToggleFileHighlight(states.lastClickEl, false);
            states.doubleClick = false;
            selectedFile.length = 0;
          }
        }
      
        if (typeof(selectedFile[0]) == 'undefined') {
          if (matchName.length > 0) {
            matchName[0].click();
            NavScrollUp();
            NavScrollDown();
          }
        } else {
          let selectedIndex = matchName.indexOf(selectedFile[0]);
          if (selectedIndex < 0) {
            if (matchName.length > 0) {
              matchName[0].click();
              NavScrollUp();
              NavScrollDown();
            }
          } else {
            if (matchName.length > 1) {
              selectedIndex = selectedIndex + 1 == matchName.length ? 0 : selectedIndex + 1;
              matchName[selectedIndex].click();
              NavScrollUp();
              NavScrollDown();
            }
          }
        }
      
    }

    function ToggleFileHighlight(el, isActive) {
        if (el === undefined) return;
        el.classList.toggle('isSelected', isActive);
    }
    
    function ClearFileSelection() {
        for (let el of selectedFile) {
            ToggleFileHighlight(el, false);
        }
        selectedFile.length = 0;
        states.lastClickEl = null;
        ui.toggleFileActionButton();
    }
    
    function SelectAllFiles() {
        if (compoStateManager.isState(0)) {
        event.preventDefault();
            selectedFile = [...$('.folder-list, .file-list')];
            for (let el of selectedFile)
                ToggleFileHighlight(el, true);
        ui.toggleFileActionButton();
        }
    }
    
    function PreviousFolder() {
        if ($('#btn-menu-my-files').classList.contains('active') && $('.breadcrumbs').length > 1) {
            event.preventDefault();
            $('.breadcrumbs')[$('.breadcrumbs').length-2].click()
        }
    }
    
    function DoubleClickOnFile() {
        selectedFile[0].click();
        if (selectedFile[0]) {
            selectedFile[0].click();
        }
    }

    function NavigationHandler() {
        
        if (compoStateManager.isState(1))
        return
    
        if (!$('#btn-menu-my-files').classList.contains('active')) return;
        event.preventDefault();
        switch (event.keyCode) {
        case 37:
        case 38:
            if (selectedFile.length > 0) {
            if (event.keyCode == 37 || (event.keyCode == 38 && settings.data.explorer.view == 'list'))
                navigateHorizontal('previousElementSibling');
            else
                navigateVertical('previousElementSibling');
            NavScrollUp();
            }
        break;
        case 39:
        case 40:
            if (selectedFile.length == 0) {
            if (selectFirstFile())
                NavScrollUp();
            } else {
            if (event.keyCode == 39 || (event.keyCode == 40 && settings.data.explorer.view == 'list'))
                navigateHorizontal('nextElementSibling');
            else
                navigateVertical('nextElementSibling');
            NavScrollDown();
            }
        break;
        }
    }

    function NavScrollUp() {
        let fileContainerOffsetTop = selectedFile[0].offsetTop;
        let customDefinedGap = 34;
        let scrollTop = (fileContainerOffsetTop - customDefinedGap + $('#status-bar').offsetHeight);
        if (scrollTop < $('#file-list').parentNode.scrollTop) {
          $('#file-list').parentNode.scrollTop = scrollTop;
        }
    }
    
    function NavScrollDown() {
        let fileContainerOffsetTop = selectedFile[0].offsetTop;
        let padding = 16;
        let customDefinedGap = 28;
        let scrollTop = (fileContainerOffsetTop + selectedFile[0].offsetHeight + padding + $('#status-bar').offsetHeight);
        let visibleScreenHeight = $('#file-list').parentNode.scrollTop + customDefinedGap + $('#file-list').parentNode.offsetHeight;
        if (scrollTop > visibleScreenHeight)
            $('#file-list').parentNode.scrollTop += scrollTop - visibleScreenHeight;
    }

    function navigateHorizontal(target) {
        let last = selectedFile[selectedFile.length-1];
        let next = last[target];
        while (next) {
          if (next.classList.contains('separator')) {
            next = next[target];
          } else {
            if (!compoKeyInput.pressedKeys.shiftKey) {
                ClearFileSelection();
            }
            next.click();
            break;
          }
        }
    }

    function navigateVertical(target) {

        let w = $('#file-list .separator').offsetWidth;
        let padding = 4;
        let f = selectedFile[0].offsetWidth + padding;
        let cols = Math.floor(w/f)
        let folders = $('.folder-list');
        let last = selectedFile[selectedFile.length-1];
        let no = parseInt(last.dataset.number);
        let targetNo = target == 'previousElementSibling' ? no - cols : no + cols;
        let selTarget = last;
        let next = last[target];

        while (next) {
            if (next.classList.contains('separator')) {
            next = next[target];
            if (targetNo < 1) {
                targetNo = Math.ceil(folders.length / cols) * cols + targetNo;
                if (targetNo > folders.length)
                targetNo = Math.max(folders.length % cols, targetNo - cols);
            } else {
                targetNo = targetNo % cols;
                if (targetNo === 0)
                targetNo = cols;
            }
            continue;
            }

            selTarget = next;
            if (parseInt(next.dataset.number) == targetNo)
            break;
            else 
            next = next[target];
        }

        if (!compoKeyInput.pressedKeys.shiftKey) {
            ClearFileSelection();
        }
        selTarget.click();
    }
    
    function selectFirstFile() {
        if ($('.folder-list').length > 0) {
            $('.folder-list')[0].click();
            return true;
        } else if ($('.file-list').length > 0) {
            $('.file-list')[0].click();
            return true;
        }
        return false;
    }

    return SELF;

})();