let uploadBody = '';
let locked = -1;
let previewFrameResolver = null;
let previewWindow = null;
let PWALoadWindow = null;
let portResolver = null;
let PreviewLoadWindow = null;
let isPWAFrameLoaded = false;
let isPreviewFrameLoaded = false;
let isPortOpened = false;
let previewManager = new PreviewManager();
let windows = [];
let SPACache = [];

function Preview(fid) {
	return {
		id: fid,
		name: 'preview-'+fid,
	};
}

function PreviewManager() {

	this.fileResponseHandler = function (event) {
	  let mimeType = previewManager.getMimeType(event.data.path);
		previewLoadWindow.postMessage({
			message: 'response-file', 
			mime: mimeType,
			content: previewManager.getContent(decodeURI(event.data.path), mimeType),
			resolverUID: event.data.resolverUID,
		},'*');
  }

	this.getContent = function(src, mimeType) {

      for (let i=0; i<SPACache.length; i++) {
        if ('/'+SPACache[i].path == src) {
          return SPACache[i].content; 
        }
      }

      let preParent;
      if (locked >=0) {
        let file = odin.dataOf(locked, fileStorage.data.files, 'fid');
        preParent = file.parentId;
      } else {
	     preParent = activeFolder;
      }

      let relativeParent = preParent;
      path = ['root'];

      if (src == '/untitled.html') {
      	return plate.cook(fileTab[activeTab].editor.env.editor.getValue());
      }

      let parentId = previewManager.getDirectory(src, relativeParent, path);
      let files = odin.filterData(parentId, fileStorage.data.files, 'parentId');
      let name = src.replace(/.*?\//g,'');
      let file = odin.dataOf(name, files, 'name');
      let content;

      if (file === undefined) {
      	content = '<404/>';
      } else {
        if (typeof(file.loaded) != 'undefined' && !file.loaded) {
          aww.pop('Downloading required file : '+name);
          drive.downloadDependencies(file);
	      content = '<404/>';
        } else {

	        let tabIdx = odin.idxOf(file.fid, fileTab, 'fid');
	        if (tabIdx >= 0)
	          content = (activeFile && activeFile.fid === file.fid) ? fileTab[activeTab].editor.env.editor.getValue() : fileTab[tabIdx].editor.env.editor.getValue();
	        else
	          content = file.content;
        }
      }

      if ($('#chk-render-plate-html').checked && mimeType.includes('text/html')) {
      	content = plate.cook(content);
      }

      return content
  }


	this.getMimeType = function(path) {
  	let ext = path.split('.').reverse().slice(0,1)[0].toLowerCase();
  	let mimeType = 'text/html';
  	let charset = ';charset=UTF-8';
  	switch(ext) {
		case 'js':
			mimeType = 'application/javascript';
			break;
		case 'css':
			mimeType = 'text/css';
			break;
		case 'json':
			mimeType = 'application/json';
			break;
  	}
  	return mimeType+charset;
  }

  this.getFrameName = function() {
  	let file = activeFile;
    if (locked < 0 && typeof(file) == 'undefined') {
  		return 'preview';
  	}

    if (locked >= 0) {
      file = odin.dataOf(locked, fileStorage.data.files, 'fid');
    }

  	for (let frame of windows) {
  		if (frame.id == file.fid) {
  			return frame.name;
  		}
  	}

  	let preview = new Preview(file.fid);
  	windows.push(preview);

  	return preview.name;
  }

  this.getDirectory = function(source, parentId, path) {
    
    while (source.match('//')) {
      source = source.replace('//','/');
    }
    
    let dir = source.split('/').reverse();
    let folder;
    
    while (dir.length > 1) {
      
  	  let dirName = dir.pop();


      if (dirName === '') {
      	parentId = -1;
      } else if (dirName === '..' || dirName === '.') {
        
        folder = odin.dataOf(parentId, fileStorage.data.folders, 'fid');
        if (folder === undefined) {
          break;
        }
        path.pop();
        parentId = folder.parentId;
      } else {
        
        let folders = odin.filterData(parentId, fileStorage.data.folders, 'parentId');
        for (let f of folders) {
          if (f.name == dirName && !f.trashed) {
            folder = f;
            break;
          }
        }
        if (folder) {
          parentId = folder.fid;
          path.push(folder.name);
        } else {
          parentId = -2;
          break;
        }
      }
    }
    
    return parentId;
  }

  this.getPath = function() {

    let file;

    if (locked >= 0) {    
      file = odin.dataOf(locked, fileStorage.data.files, 'fid');
    } else {
      if (typeof(activeFile) != 'undefined') {
        file = activeFile;
      }
    }

  	if (typeof(file) == 'undefined') {
  		return 'untitled.html';
  	}

  	let path = [file.name];
  	let parentId = file.parentId;
  	
    while (parentId >= 0) {
  		let folder = odin.dataOf(parentId, fileStorage.data.folders, 'fid');
  		path.push(folder.name);
  		parentId = parseInt(folder.parentId);
  	}
    L(path)
  	return path.reverse().join('/');

  }

  return this;
}

(function() {
  
  function getMatch(content) {
    return content.match(/<file include=.*?><\/file>|<template include=.*?><\/template>|<script .*?src=.*?><\/script>|<link .*?href=.*?>/);
  }

  function replaceLocal(body, preParent = -1, path = ['root']) {

    if (body === undefined) {
      gitTree.length = 0;
      if (locked === -1 || (activeFile && locked === activeFile.fid)) {
      
        body = fileTab[activeTab].editor.env.editor.getValue();
        
        preParent = activeFile ? activeFile.parentId : activeFolder;
        // if (activeFile)
          // appendGitTree(activeFile.name, plate.cook(body).replace(/href="\$/g,'href="').replace(/__\//g,''));
      } else {
      
        let file = odin.dataOf(locked, fileStorage.data.files, 'fid');
        
        let tabIdx = odin.idxOf(file.fid, fileTab, 'fid');
        if (tabIdx >= 0)
          body = fileTab[tabIdx].editor.env.editor.getValue();
        else
          body = file.content;
        
        preParent = file.parentId;
        // appendGitTree(file.name, plate.cook(body).replace(/href="\$/g,'href="').replace(/__\//g,''));
      }
      
    }
    
  
    let match = getMatch(body);
    
    while (match !== null) {

      let tagName;
      let isScriptOrLink = false;
      let isFile = false;
      let isMinified = false;
      let start = 19;
      let end = 13;
      let src = '';
      
      if (match[0].includes('<script')) {
        src = match[0].match(/src=['|"].*?['|"]/)[0];
        src = src.substring(5, src.length - 1);
        isScriptOrLink = true;
        tagName = 'script';
      } else if (match[0].includes('<link')) {
        src = match[0].match(/href=['|"].*?['|"]/)[0];
        src = src.substring(6, src.length - 1);
        isScriptOrLink = true;
        tagName = 'style';
      } else if (match[0].includes('<file')) {
        start = 15;
        end = 9;
        isScriptOrLink = true;
        isFile = true;
      }
      
      src = (src.length > 0) ? src : match[0].substring(start, match[0].length-end);
      let relativeParent = preParent;
      
      if (src.startsWith('https://') || src.startsWith('http://')) {
        body = body.replace(match[0], match[0].replace('href=','href-web=').replace('src=','src-web='));
        match = getMatch(body);
        continue;
      }
      
      if (src.startsWith('__')) {
        relativeParent = -1;
        src = src.replace(/__\//, '');
      }
      
      let absolutePath = JSON.parse(JSON.stringify(path));
      let parentId = previewManager.getDirectory(src, relativeParent, path);
      let files = odin.filterData(parentId, fileStorage.data.files, 'parentId');
      let name = src.replace(/.*?\//g,'');
      let file = odin.dataOf(name, files, 'name');
      if (file === undefined) {
        body = body.replace(match[0], '');
        console.log(src+' not found');
      } else {
        if (!file.loaded) {
          aww.pop('Downloading required file : '+name);
          drive.downloadDependencies(file);
        }
        
        let ot = '', ct = '';
        if (tagName) {
          ot = '<'+tagName+'>\n';
          ct = '\n</'+tagName+'>';
        }
        
        
        let tabIdx = odin.idxOf(file.fid, fileTab, 'fid');
        let content;
        if (tabIdx >= 0)
          content = (activeFile && activeFile.fid === file.fid) ? fileTab[activeTab].editor.env.editor.getValue() : fileTab[tabIdx].editor.env.editor.getValue();
        else
          content = file.content;
        // appendGitTree((path.join('/') + '/').replace('root/','') + file.name, content);
        
        if ($('#chk-deploy-minified').checked && isMinified)
          content = content.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '').replace(/\n|\t+/g,'');
        else if (isFile)
          content = content.replace(/</g,'&lt;').replace(/\[/g,'&lsqb;').replace(/]/g,'&rsqb;');
      
        let swap = ot + replaceLocal(content, parentId, path) + ct;
        body = body.replace(new RegExp(match[0]), swap);
      }
     
      path = absolutePath;
      match = getMatch(body);
    }
    
    return body;
  }
  
  function clearComments(xml) {
    xml = xml.replace(new RegExp('<!--_(.|\n)*?-->','g'),'');
    return xml;
  }

  function getHTML(body, preParent = -1, path = ['root']) {

    if (body === undefined) {
      gitTree.length = 0;
      if (locked === -1 || (activeFile && locked === activeFile.fid)) {
      
        body = fileTab[activeTab].editor.env.editor.getValue();
        
        preParent = activeFile ? activeFile.parentId : activeFolder;
        // if (activeFile)
          // appendGitTree(activeFile.name, plate.cook(body).replace(/href="\$/g,'href="').replace(/__\//g,''));
      } else {
      
        let file = odin.dataOf(locked, fileStorage.data.files, 'fid');
        
        let tabIdx = odin.idxOf(file.fid, fileTab, 'fid');
        if (tabIdx >= 0)
          body = fileTab[tabIdx].editor.env.editor.getValue();
        else
          body = file.content;
        
        preParent = file.parentId;
        // appendGitTree(file.name, plate.cook(body).replace(/href="\$/g,'href="').replace(/__\//g,''));
      }
      
    }
    
    return body;
  }

  function previewPWA(body) {
  	if (!$('#PWAFrame'))
        $('#limbo-element').append(o.cel('iframe', {id:'PWAFrame',name:'PWAFrame'}));
      
      if (!isPWAFrameLoaded) {
        aww.pop('Waiting for PWA installer...');
        if (debugPWAUrl.length > 0)
          PWALoadWindow = window.open(debugPWAUrl,'PWAFrame');
        else
          PWALoadWindow = window.open('https://localpwa.web.app/','PWAFrame');
      }
      
      let waitFirstLoad = setInterval(() => {
        
        if (isPWAFrameLoaded) {
          aww.pop('Saving app data on device...');
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');
          let backgrounds = ['#000839','#ffa41b','#000000','#192b58','#ffa34d','#f67575','#d4f8e8'];
          let bg = backgrounds[Math.floor(Math.random()*6)+0];

          let src128 = {
            url: $('#in-PWA-src-128-url').value.trim(),
            type: $('#in-PWA-src-128-type').value.trim(),
          }
          if (!['image/png','image/jpg','image/jpeg'].includes(src128.type))
            src128.type = 'image/png';
          if (src128.url.length == 0)
            src128.url = location.origin+'/images/128.png';
          
          let src192 = {
            url: $('#in-PWA-src-192-url').value.trim(),
            type: $('#in-PWA-src-192-type').value.trim(),
          }
          if (!['image/png','image/jpg','image/jpeg'].includes(src192.type))
            src192.type = 'image/png';
          if (src192.url.length == 0)
            src192.url = location.origin+'/images/192.png';
          PWALoadWindow.postMessage({type:'install', appData:{
            src128,
            src192,
            url: $('#in-PWA-app-url').value.trim(),
            name: $('#in-PWA-app-name').value.trim(),
            html: body,
          }}, '*');
          clearInterval(waitFirstLoad);
        }
      }, 100)
  }

  function previewWeb(filePath) {
	  new Promise(function(resolve) {
	  	if (isPreviewFrameLoaded) 
	  		resolve();
	  	else {
	  		previewFrameResolver = resolve;
	  	}
	  })
	  .then(() => {
	  	  let messageChannel = new MessageChannel();
		    messageChannel.port1.onmessage = previewManager.fileResponseHandler;

	      previewLoadWindow.postMessage({ message: 'init-message-port' }, '*', [messageChannel.port2]);
	      new Promise(function(resolve) {
      		portResolver = resolve;
	      }).then(() => {
		      	window.open(previewUrl+filePath, previewManager.getFrameName());
	      })
	  });

	  if (!isPreviewFrameLoaded) {
	    if (previewUrl.length > 0) {
	      previewLoadWindow = window.open(previewUrl, 'PreviewFrame');
	    } else {
	      previewLoadWindow = window.open('https://attemp.web.app/','PreviewFrame');
	    }
	  }
  }
  
  function cacheContent(filePath, isForceDeploy) {
    let content = replaceLocal().replace(/src-web=/g, 'src=').replace(/href-web=/g, 'href=');
    if ($('#chk-render-plate-html').checked) {
      content = (typeof(plate) != 'undefined') ? plate.cook(content) : content;
    }

    content = clearComments(content);

    if (isForceDeploy) {
      uploadBody = content;
      return;
    }

    let isFound = false;
    for (let i=0; i<SPACache.length; i++) {
      if (SPACache[i].path == filePath) {
        isFound = true;
        SPACache[i].content = content;
        break;
      }
    }
    if (!isFound) {
      SPACache.push({
        path: filePath,
        content: content,
      });
    }
  }

  function previewHTML(isForceDeploy) {
    
    // appendGitTree('index.html', body);

    let isPWA = $('#in-PWA-enabled').checked;
    let isSPA = $('#in-SPA-mode').checked;

    if (isPWA) {
      previewPWA();
      // previewPWA(body);
    } else {
      let filePath = previewManager.getPath();
      if (isSPA) {
        cacheContent(filePath, isForceDeploy);
      }
      previewWeb(filePath);
    }
  }
  
  window.previewHTML = previewHTML;
  
})();

window.addEventListener('message', function(e) {
  if (e.data.message) {
    switch (e.data.message) {
    case 'port-opened':
	    isPortOpened = true;
	    portResolver();
    break;
    case 'port-closed':
	    isPortOpened = false;
    	portResolver();
    break;
    case 'message-port-opened':
    	portResolver();
    break;
    case 'pwa-frame-isReady':
        isPWAFrameLoaded = true;
        break;
    case 'preview-frame-isReady':
        isPreviewFrameLoaded = true;
        previewFrameResolver();
        break;
    case 'pwa-app-installed':
        aww.pop('PWA ready!');
        if ($('#in-seperate-PWA-process').checked) {
          let a = o.cel('a', {
            href: e.data.url,
            rel: 'noreferrer',
            target: '_blank'
          })
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(e.data.url, 'preview');
        }
        break;
    }
  }

}, false);

navigator.serviceWorker.addEventListener('message', e => {
  if (e.data.message) {
    if (e.data.message == 'emmet-cached') {
      editorManager.initEmmet();
    }
  }
});