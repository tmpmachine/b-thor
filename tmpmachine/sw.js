self.addEventListener('message', function(e) {
  if (e.data.action == 'skipWaiting')
    self.skipWaiting();
});


let cacheVersion = '1.0181';
let cacheItem = 'tmp-'+cacheVersion;

self.addEventListener('install', function(event) {

  let urls = [
    '/',
    '/404.html',
    '/TOS.html',
    '/PP.html',
    '/css/style.css',
    '/ace/theme-monokai.js',
    '/ace/mode-html.js',
    '/ace/mode-json.js',
    '/ace/mode-php.js',
    '/ace/mode-css.js',
    '/ace/mode-javascript.js',
    '/ace/worker-html.js',
    '/ace/worker-json.js',
    '/ace/worker-php.js',
    '/ace/worker-css.js',
    '/ace/worker-javascript.js',

    '/images/128.png',
    '/images/128ap.png',
    '/images/192.png',
    '/images/google/1x/btn_google_signin_dark_normal_web.png',
    '/images/google/1x/btn_google_signin_dark_focus_web.png',
    '/images/google/1x/btn_google_signin_dark_pressed_web.png',

    '/require/anibar.js',
    '/require/plate.js',
    '/require/o.js',
    '/require/opopnomi.js',
    '/require/lsdb.js',
    '/require/odin.js',
    '/require/auth0.js',
    '/require/oblog.js',
    '/require/aww.js',
    '/require/w3-4.10.css',

    '/js/engine.js',
    '/js/template.js',
    '/js/idb.js',
    '/js/renderer.js',
    '/js/ux.js',
    '/js/file-manager.js',
    '/js/drive.js',
    '/js/debug.js',
    
    '/ace/ace.js',
    
    '/plugins/custom-editor-init.js',
    '/plugins/drag-drop.js',
    
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
    ];
 
  event.waitUntil(
    caches.open(cacheItem).then(function(cache) {
      return cache.addAll(urls);
    })
  );
  
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(c) {
      c.map(function(cname) {
        if (!cname.endsWith(cacheVersion))
          caches.delete(cname);
      });
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(resp) {
      if (resp)
        return resp;
      
      return fetch(e.request).then(function(r) {
        return r;
      }).catch(function() {
        console.error('Check connection.');
      });
    })
  );
});