/* Service worker do app CheckLove: só existe para o app poder ser instalado na tela inicial.
   Não guarda nada em cache, então cada abertura carrega a versão mais nova do app. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* deixa a rede responder normalmente */ });
