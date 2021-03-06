'use strict';

import { remote } from 'electron';
import path from 'path';

var Tray = remote.Tray;
var Menu = remote.Menu;

var quit = remote.require('./quit');

let _tray;
let _mainWindow = null;
let _callbackOnQuit;

var icons = {
    'win32': {
        dir: 'windows'
    },

    'linux': {
        dir: 'linux'
    },

    'darwin': {
        dir: 'osx',
        icon: 'icon-trayTemplate.png'
    }
};

let _iconTray = path.join(__dirname, 'images', icons[process.platform].dir, icons[process.platform].icon || 'icon-tray.png');
let _iconTrayAlert = path.join(__dirname, 'images', icons[process.platform].dir, icons[process.platform].iconAlert || 'icon-tray-alert.png');

function createAppTray(mainWindow) {
    _tray = new Tray(_iconTray);
    var contextMenu = Menu.buildFromTemplate([{
        label: 'Hide',
        click: function() {
            showMainWindow(false);
        }
    }, {
        label: 'Show',
        click: function() {
            showMainWindow(true);
        }
    }, {
        label: 'Quit',
        click: function() {
            quit.forceQuit();
            doQuit();
        }
    }]);
    _tray.setToolTip('Rocket.Chat');
    _tray.setContextMenu(contextMenu);

    if (process.platform === 'darwin' || process.platform === 'win32') {
        _tray.on('double-click', function() {
            showMainWindow(true);
        });
    } else {
        let dblClickDelay = 500,
            dblClickTimeoutFct = null;
        _tray.on('click', function() {
            if (!dblClickTimeoutFct) {
                dblClickTimeoutFct = setTimeout(function() {
                    // Single click, do nothing for now
                    dblClickTimeoutFct = null;
                }, dblClickDelay);
            } else {
                clearTimeout(dblClickTimeoutFct);
                dblClickTimeoutFct = null;
                showMainWindow(true);
            }
        });
    }

    _mainWindow = mainWindow;
    _mainWindow.tray = _tray;
}

function destroy() {
    if (_tray !== null && _tray !== undefined) {
        _tray.destroy();
        _tray = null;
    }
    _mainWindow = null;
    _callbackOnQuit = null;
}

function doQuit() {
    if (typeof _callbackOnQuit === 'function') {
        _callbackOnQuit();
    }
}

function showTrayAlert(showAlert, title) {
    if ((_tray !== null && _tray !== undefined) && (_mainWindow !== null && _mainWindow !== undefined)) {
        _mainWindow.flashFrame(showAlert);
        if (showAlert) {
            _tray.setImage(_iconTrayAlert);
            if (process.platform === 'darwin') {
                _tray.setTitle(title);
            }
        } else {
            _tray.setImage(_iconTray);
            if (process.platform === 'darwin') {
                _tray.setTitle('');
            }
        }
    }
}

function minimizeMainWindow() {
    showMainWindow(false);
}

function restoreMainWindow() {
    showMainWindow(true);
}

function showMainWindow(show) {
    if (_mainWindow !== null && _mainWindow !== undefined) {
        if (show) {
            _mainWindow.restore();
            _mainWindow.show();
        } else {
            _mainWindow.minimize();
        }
    }
}

function bindOnQuit(callback) {
    _callbackOnQuit = callback;
}

createAppTray(remote.getCurrentWindow());

bindOnQuit(function() {
    remote.app.quit();
});


export default {
    createAppTray: createAppTray,
    showTrayAlert: showTrayAlert,
    minimizeMainWindow: minimizeMainWindow,
    restoreMainWindow: restoreMainWindow,
    bindOnQuit: bindOnQuit,
    destroy: destroy
};
