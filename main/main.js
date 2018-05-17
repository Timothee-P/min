const electron = require('electron')
const fs = require('fs')
const path = require('path')
const nativeImage = require('electron').nativeImage
const app = electron.app // Module to control application life.
const protocol = electron.protocol // Module to control protocol handling
const BrowserWindow = electron.BrowserWindow // Module to create native browser window.

const ipc= electron.ipcMain

var userDataPath = app.getPath('userData')
const remote = require('electron').remote;

const browserPage = 'file://' + __dirname + '/index.html'

var mainWindow = null
var windows1 = null
var windows2 = null
var mainMenu = null
var isFocusMode = false
var appIsReady = false



ipc.on('request-URL-list', function (e,myObj){
  saveSiteURLHeader(myObj.arg1,myObj.arg2)
})

ipc.on('capture-page',function(e,data){
 
    if (data.arg == true){
      var cadre = {
        x:1,
        y: 37,
        width: 1,
        height: 1
      }
    } else {
      var cadre = {
        x: 1,
        y: 1,
        width: 1,
        height: 1
      }
    }
    var selectedWindow = BrowserWindow.getFocusedWindow()
if(selectedWindow){


    selectedWindow.capturePage(cadre, function(png){
      var img = png.toBitmap()
    
      selectedWindow.webContents.send('ping', { image: img })
    
})}
})


var saveWindowBounds = function () {
  if (mainWindow) {
    fs.writeFile(path.join(userDataPath, 'windowBounds.json'), JSON.stringify(mainWindow.getBounds()))
  }
}



var saveSiteURLHeader = function(myObj,myobj1) {
  console.log('dffgfds')
  var data  = JSON.parse(fs.readFileSync(path.join(userDataPath, 'listeURL.json'), 'utf8'));
  var data2 = nativeImage.createFromPath(myobj1).toDataURL()
 
  data.items.push({url: myObj,favicon: data2}) 

  fs.writeFile(path.join(userDataPath, 'listeURL.json'), JSON.stringify(data))
  var selectedWindow = BrowserWindow.getFocusedWindow()


  selectedWindow.webContents.send('bookMarkdata-Test' , data);
}


function sendIPCToWindow (window, action, data) {
  // if there are no windows, create a new one
 
  if (!mainWindow) {
    createWindow('mainWindow', function () {
      mainWindow.webContents.send(action, data || {})

    })
  }  else if ( window == mainWindow) {
    mainWindow.webContents.send(action, data || {})
  } else if (!windows1) {
    createWindow( 'windows1',function () {
      windows1.webContents.send(action, data || {})
    })
  }  else if ( window == windows1) {
    windows1.webContents.send(action, data || {})
  } else if (!windows2) {
    createWindow('windows2',function () {
      windows2.webContents.send(action, data || {})
    })
  } else if ( window == windows2) {
    windows2.webContents.send(action, data || {})
  } else {
    createWindow('mainWindow',function () {
      mainWindow.webContents.send(action, data || {})
    })
  }
}

function openTabInWindow (window, url) {
  
  sendIPCToWindow(window, 'addTab', {
    url: url
  })
}

function createWindow (wintim, cb) {
  var savedBounds = fs.readFile(path.join(userDataPath, 'windowBounds.json'), 'utf-8', function (e, data) {
    if (e || !data) { // there was an error, probably because the file doesn't exist
      var size = electron.screen.getPrimaryDisplay().workAreaSize
      var bounds = {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
      }
    } else {
      var bounds = JSON.parse(data)
    }

    

    // maximizes the window frame in windows 10
    // fixes https://github.com/minbrowser/min/issues/214
    // should be removed once https://github.com/electron/electron/issues/4045 is fixed
    if (process.platform === 'win32') {
      if (bounds.x === 0 || bounds.y === 0 || bounds.x === -8 || bounds.y === -8) {
        var screenSize = electron.screen.getPrimaryDisplay().workAreaSize
        if ((screenSize.width === bounds.width || bounds.width - screenSize.width === 16) && (screenSize.height === bounds.height || bounds.height - screenSize.height === 16)) {
          var shouldMaximize = true
        }
      }
    }

    createWindowWithBounds(wintim, bounds, shouldMaximize)

    if (cb) {
      cb()
    }
  })
}

function createWindowWithBounds (wintim, bounds, shouldMaximize) {
  if (wintim == 'mainWindow'){
    mainWindow = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      minWidth: 320,
      minHeight: 350,
      name:'mainWindow',
      
      icon: __dirname + '/icons/icon256.png',
      frame: false
    })

    // and load the index.html of the app.
    mainWindow.loadURL(browserPage)
    mainWindow.focus()
    if (shouldMaximize) {
      mainWindow.maximize()

      mainWindow.webContents.on('did-finish-load', function () {
        sendIPCToWindow(mainWindow, 'maximize')
      })
    }

    mainWindow.webContents.on('did-finish-load', function () {
      
      var savedBookmark = fs.readFile(path.join(userDataPath, 'listeURL.json'), 'utf-8', function (e, data) {
        if (e || !data) { // there was an error, probably because the file doesn't exist
          var size = electron.screen.getPrimaryDisplay().workAreaSize
          var bounds = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height
          }
        } else {
         
          var bookmarkData = JSON.parse(data)
          mainWindow.webContents.send('bookMarkdata-Test' , bookmarkData);
        }
      })
    })

    // save the window size for the next launch of the app
    mainWindow.on('close', function () {
      saveWindowBounds()
    })

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null
    })

    /* handle pdf downloads - ipc recieved in fileDownloadManager.js */

    mainWindow.webContents.session.on('will-download', function (event, item, webContents) {
      var itemURL = item.getURL()
      if (item.getMimeType() === 'application/pdf' && itemURL.indexOf('blob:') !== 0 && itemURL.indexOf('#pdfjs.action=download') === -1) { // clicking the download button in the viewer opens a blob url, so we don't want to open those in the viewer (since that would make it impossible to download a PDF)
        event.preventDefault()
        sendIPCToWindow(mainWindow, 'openPDF', {
          url: itemURL,
          webContentsId: webContents.getId(),
          event: event,
          item: item // as of electron 0.35.1, this is an empty object
        })
      }
      return true
    })

    mainWindow.on('minimize', function () {
      sendIPCToWindow(mainWindow, 'minimize')
    })

    mainWindow.on('maximize', function () {
      sendIPCToWindow(mainWindow, 'maximize')
    })

    mainWindow.on('unmaximize', function () {
      sendIPCToWindow(mainWindow, 'unmaximize')
    })

    mainWindow.on('enter-full-screen', function () {
      sendIPCToWindow(mainWindow, 'enter-full-screen')
    })

    mainWindow.on('leave-full-screen', function () {
      sendIPCToWindow(mainWindow, 'leave-full-screen')
    })

    mainWindow.on('app-command', function (e, command) {
      if (command === 'browser-backward') {
        sendIPCToWindow(mainWindow, 'goBack')
      } else if (command === 'browser-forward') {
        sendIPCToWindow(mainWindow, 'goForward')
      }
    })

    // prevent remote pages from being loaded using drag-and-drop, since they would have node access
    mainWindow.webContents.on('will-navigate', function (e, url) {
      if (url !== browserPage) {
        e.preventDefault()
      }
    })

    registerFiltering() // register filtering for the default session

    return mainWindow
  } else if (wintim == 'windows1'){
    windows1 = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      minWidth: 320,
      minHeight: 350,
      
      icon: __dirname + '/icons/icon256.png',
      frame: false
    })
    windows1.focus()
    // and load the index.html of the app.
    windows1.loadURL(browserPage)

    if (shouldMaximize) {
      windows1.maximize()


      windows1.webContents.on('did-finish-load', function () {
        sendIPCToWindow(windows1, 'maximize')
      })
    }
    windows1.webContents.on('did-finish-load', function () {
      
      var savedBookmark = fs.readFile(path.join(userDataPath, 'listeURL.json'), 'utf-8', function (e, data) {
        if (e || !data) { // there was an error, probably because the file doesn't exist
          var size = electron.screen.getPrimaryDisplay().workAreaSize
          var bounds = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height
          }
        } else {
         
          var bookmarkData = JSON.parse(data)
          windows1.webContents.send('bookMarkdata-Test' , bookmarkData);
        }
      })
    })
    // save the window size for the next launch of the app
    windows1.on('close', function () {
      saveWindowBounds()
    })

    // Emitted when the window is closed.
    windows1.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      windows1 = null
    })

    /* handle pdf downloads - ipc recieved in fileDownloadManager.js */

    windows1.webContents.session.on('will-download', function (event, item, webContents) {
      var itemURL = item.getURL()
      if (item.getMimeType() === 'application/pdf' && itemURL.indexOf('blob:') !== 0 && itemURL.indexOf('#pdfjs.action=download') === -1) { // clicking the download button in the viewer opens a blob url, so we don't want to open those in the viewer (since that would make it impossible to download a PDF)
        event.preventDefault()
        sendIPCToWindow(windows1, 'openPDF', {
          url: itemURL,
          webContentsId: webContents.getId(),
          event: event,
          item: item // as of electron 0.35.1, this is an empty object
        })
      }
      return true
    })

    windows1.on('minimize', function () {
      sendIPCToWindow(windows1, 'minimize')
    })

    windows1.on('maximize', function () {
      sendIPCToWindow(windows1, 'maximize')
    })

    windows1.on('unmaximize', function () {
      sendIPCToWindow(windows1, 'unmaximize')
    })

    windows1.on('enter-full-screen', function () {
      sendIPCToWindow(windows1, 'enter-full-screen')
    })

    windows1.on('leave-full-screen', function () {
      sendIPCToWindow(windows1, 'leave-full-screen')
    })

    windows1.on('app-command', function (e, command) {
      if (command === 'browser-backward') {
        sendIPCToWindow(windows1, 'goBack')
      } else if (command === 'browser-forward') {
        sendIPCToWindow(windows1, 'goForward')
      }
    })

    // prevent remote pages from being loaded using drag-and-drop, since they would have node access
    windows1.webContents.on('will-navigate', function (e, url) {
      if (url !== browserPage) {
        e.preventDefault()
      }
    })

    registerFiltering() // register filtering for the default session

    return windows1
  } else if (wintim == 'windows2'){
    windows2 = new BrowserWindow({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      minWidth: 320,
      minHeight: 350,
      
      icon: __dirname + '/icons/icon256.png',
      frame: false
    })

    // and load the index.html of the app.
    windows2.loadURL(browserPage)
    windows2.focus()
    if (shouldMaximize) {
      windows2.maximize()

      windows2.webContents.on('did-finish-load', function () {
        sendIPCToWindow(windows2, 'maximize')
      })
    }
    windows2.webContents.on('did-finish-load', function () {
      
      var savedBookmark = fs.readFile(path.join(userDataPath, 'listeURL.json'), 'utf-8', function (e, data) {
        if (e || !data) { // there was an error, probably because the file doesn't exist
          var size = electron.screen.getPrimaryDisplay().workAreaSize
          var bounds = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height
          }
        } else {
         
          var bookmarkData = JSON.parse(data)
          windows2.webContents.send('bookMarkdata-Test' , bookmarkData);
        }
      })
    })
    // save the window size for the next launch of the app
    windows2.on('close', function () {
      saveWindowBounds()
    })

    // Emitted when the window is closed.
    windows2.on('closed', function () {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      windows2 = null
    })

    /* handle pdf downloads - ipc recieved in fileDownloadManager.js */

    windows2.webContents.session.on('will-download', function (event, item, webContents) {
      var itemURL = item.getURL()
      if (item.getMimeType() === 'application/pdf' && itemURL.indexOf('blob:') !== 0 && itemURL.indexOf('#pdfjs.action=download') === -1) { // clicking the download button in the viewer opens a blob url, so we don't want to open those in the viewer (since that would make it impossible to download a PDF)
        event.preventDefault()
        sendIPCToWindow(windows2, 'openPDF', {
          url: itemURL,
          webContentsId: webContents.getId(),
          event: event,
          item: item // as of electron 0.35.1, this is an empty object
        })
      }
      return true
    })

    windows2.on('minimize', function () {
      sendIPCToWindow(windows2, 'minimize')
    })

    windows2.on('maximize', function () {
      sendIPCToWindow(windows2, 'maximize')
    })

    windows2.on('unmaximize', function () {
      sendIPCToWindow(windows2, 'unmaximize')
    })

    windows2.on('enter-full-screen', function () {
      sendIPCToWindow(windows2, 'enter-full-screen')
    })

    windows2.on('leave-full-screen', function () {
      sendIPCToWindow(windows2, 'leave-full-screen')
    })

    windows2.on('app-command', function (e, command) {
      if (command === 'browser-backward') {
        sendIPCToWindow(windows2, 'goBack')
      } else if (command === 'browser-forward') {
        sendIPCToWindow(windows2, 'goForward')
      }
    })

    // prevent remote pages from being loaded using drag-and-drop, since they would have node access
    windows2.webContents.on('will-navigate', function (e, url) {
      if (url !== browserPage) {
        e.preventDefault()
      }
    })

    registerFiltering() // register filtering for the default session

    return windows2
  } 
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  appIsReady = true

  createWindow('mainWindow', function () {
    mainWindow.webContents.on('did-finish-load', function () {
      // if a URL was passed as a command line argument (probably because Min is set as the default browser on Linux), open it.
      if (process.argv && process.argv[1] && process.argv[1].toLowerCase() !== __dirname.toLowerCase() && process.argv[1].indexOf('://') !== -1) {
        sendIPCToWindow(mainWindow, 'addTab', {
          url: process.argv[1]
        })
      } else if (global.URLToOpen) {
        // if there is a previously set URL to open (probably from opening a link on macOS), open it
        sendIPCToWindow(mainWindow, 'addTab', {
          url: global.URLToOpen
        })
        global.URLToOpen = null
      }
    })
  })

  // Open the DevTools.
  // mainWindow.openDevTools()

  createAppMenu()
  createDockMenu()
  registerProtocols()
})

app.on('open-url', function (e, url) {
  if (appIsReady) {
    sendIPCToWindow(mainWindow, 'addTab', {
      url: url
    })
  } else {
    global.URLToOpen = url // this will be handled later in the createWindow callback
  }
})

/**
 * Emitted when the application is activated, which usually happens when clicks on the applications's dock icon
 * https://github.com/electron/electron/blob/master/docs/api/app.md#event-activate-os-x
 *
 * Opens a new tab when all tabs are closed, and min is still open by clicking on the application dock icon
 */
app.on('activate', function ( /* e, hasVisibleWindows */) {
  if (!mainWindow && appIsReady) { // sometimes, the event will be triggered before the app is ready, and creating new windows will fail
    
  }
})

ipc.on('task-window', function (event){
  mainWindow.webContents.send('info-tasks' , 'windowName');
  
})



ipc.on('showSecondaryMenu', function (event, data) {
  if (mainMenu) {
    mainMenu.popup(mainWindow, {
      x: data.x,
      y: data.y,
      async: true
    })
  }
})

function registerProtocols () {
  protocol.registerStringProtocol('mailto', function (req, cb) {
    electron.shell.openExternal(req.url)
    return null
  }, function (error) {
    if (error) {
      console.log('Could not register mailto protocol.')
    }
  })
}

function createAppMenu () {
  // create the menu. based on example from http://electron.atom.io/docs/v0.34.0/api/menu/

  var Menu = electron.Menu
  var MenuItem = electron.MenuItem

  var appName = app.getName()

  var template = [
    {
      label: l('appMenuFile'),
      submenu: [
        {
          label: l('appMenuNewTab'),
          accelerator: 'CmdOrCtrl+t',
          click: function (item, window) {
            
            openTabInWindow(window, "https://google.fr")
            
          }
        },
        {
          label: l('appMenuNewPrivateTab'),
          accelerator: 'shift+CmdOrCtrl+p',
          click: function (item, window) {
            sendIPCToWindow(window, 'addPrivateTab')
          }
        },
        {
          label: l('appMenuNewTask'),
          accelerator: 'CmdOrCtrl+n',
          click: function (item, window) {
            sendIPCToWindow('newwindow', 'addTask')
          }
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuSavePageAs'),
          accelerator: 'CmdOrCtrl+s',
          click: function (item, window) {
            sendIPCToWindow(window, 'saveCurrentPage')
          }
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuPrint'),
          accelerator: 'CmdOrCtrl+p',
          click: function (item, window) {
            sendIPCToWindow(window, 'print')
          }
        }
      ]
    },
    {
      label: l('appMenuEdit'),
      submenu: [
        {
          label: l('appMenuUndo'),
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: l('appMenuRedo'),
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuCut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: l('appMenuCopy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: l('appMenuPaste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: l('appMenuSelectAll'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuFind'),
          accelerator: 'CmdOrCtrl+F',
          click: function (item, window) {
            sendIPCToWindow(window, 'findInPage')
          }
        }
      ]
    },
    /* these items are added by os x */
    {
      label: l('appMenuView'),
      submenu: [
        {
          label: l('appMenuZoomIn'),
          accelerator: 'CmdOrCtrl+=',
          click: function (item, window) {
            sendIPCToWindow(window, 'zoomIn')
          }
        },
        {
          label: l('appMenuZoomOut'),
          accelerator: 'CmdOrCtrl+-',
          click: function (item, window) {
            sendIPCToWindow(window, 'zoomOut')
          }
        },
        {
          label: l('appMenuActualSize'),
          accelerator: 'CmdOrCtrl+0',
          click: function (item, window) {
            sendIPCToWindow(window, 'zoomReset')
          }
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuFullScreen'),
          accelerator: (function () {
            if (process.platform == 'darwin')
              return 'Ctrl+Command+F'
            else
              return 'F11'
          })(),
          role: 'togglefullscreen'
        },
        {
          label: l('appMenuFocusMode'),
          accelerator: undefined,
          type: 'checkbox',
          checked: false,
          click: function (item, window) {
            if (isFocusMode) {
              item.checked = false
              isFocusMode = false
              sendIPCToWindow(window, 'exitFocusMode')
            } else {
              item.checked = true
              isFocusMode = true
              sendIPCToWindow(window, 'enterFocusMode')
            }
          }
        },
        {
          label: l('appMenuReadingList'),
          accelerator: undefined,
          click: function (item, window) {
            sendIPCToWindow(window, 'showReadingList')
          }
        }
      ]
    },
    {
      label: l('appMenuDeveloper'),
      submenu: [
        {
          label: l('appMenuReloadBrowser'),
          accelerator: undefined,
          click: function (item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: l('appMenuInspectBrowser'),
          click: function (item, focusedWindow) {
            if (focusedWindow) focusedWindow.toggleDevTools()
          }
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuInspectPage'),
          accelerator: (function () {
            if (process.platform == 'darwin')
              return 'Cmd+Alt+I'
            else
              return 'Ctrl+Shift+I'
          })(),
          click: function (item, window) {
            sendIPCToWindow(window, 'inspectPage')
          }
        }
      ]
    },
    {
      label: l('appMenuWindow'),
      role: 'window',
      submenu: [
        {
          label: l('appMenuMinimize'),
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: l('appMenuClose'),
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: l('appMenuHelp'),
      role: 'help',
      submenu: [
        {
          label: l('appMenuKeyboardShortcuts'),
          click: function () {
            openTabInWindow('https://github.com/minbrowser/min/wiki#keyboard-shortcuts')
          }
        },
        {
          label: l('appMenuReportBug'),
          click: function () {
            openTabInWindow('https://github.com/minbrowser/min/issues/new')
          }
        },
        {
          label: l('appMenuTakeTour'),
          click: function () {
            openTabInWindow('https://minbrowser.github.io/min/tour/')
          }
        },
        {
          label: l('appMenuViewGithub'),
          click: function () {
            openTabInWindow('https://github.com/minbrowser/min')
          }
        }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: appName,
      submenu: [
        {
          label: l('appMenuAbout').replace('%n', appName),
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuPreferences'),
          accelerator: 'CmdOrCtrl+,',
          click: function (item, window) {
            sendIPCToWindow(window, 'addTab', {
              url: 'file://' + __dirname + '/pages/settings/index.html'
            })
          }
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuHide').replace('%n', appName),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide'
        },
        {
          label: l('appMenuHideOthers'),
          accelerator: 'CmdOrCtrl+Shift+H',
          role: 'hideothers'
        },
        {
          label: l('appMenuShowAll'),
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: l('appMenuQuit').replace('%n', appName),
          accelerator: 'CmdOrCtrl+Q',
          click: function () {
            app.quit()
          }
        }
      ]
    })
    // Window menu.
    template[3].submenu.push({
      type: 'separator'
    }, {
      label: l('appMenuBringToFront'),
      role: 'front'
    })
  }

  // preferences item on linux and windows

  if (process.platform !== 'darwin') {
    template[1].submenu.push({
      type: 'separator'
    })

    template[1].submenu.push({
      label: l('appMenuPreferences'),
      accelerator: 'CmdOrCtrl+,',
      click: function (item, window) {
        sendIPCToWindow(window, 'addTab', {
          url: 'file://' + __dirname + '/pages/settings/index.html'
        })
      }
    })

    // about item on linux and windows

    template[5].submenu.push({
      type: 'separator'
    })

    template[5].submenu.push({
      label: l('appMenuAbout').replace('%n', appName),
      click: function (item, window) {
        var info = [
          'Min v' + app.getVersion(),
          'Chromium v' + process.versions.chrome
        ]
        electron.dialog.showMessageBox({
          type: 'info',
          title: l('appMenuAbout').replace('%n', appName),
          message: info.join('\n'),
          buttons: [l('closeDialog')]
        })
      }
    })
  }

  mainMenu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(mainMenu)
}

function createDockMenu () {
  // create the menu. based on example from https://github.com/electron/electron/blob/master/docs/tutorial/desktop-environment-integration.md#custom-dock-menu-macos
  if (process.platform === 'darwin') {
    var Menu = electron.Menu

    var template = [
      {
        label: l('appMenuNewTab'),
        click: function (item, window) {
          sendIPCToWindow(window, 'addTab')
        }
      },
      {
        label: l('appMenuNewPrivateTab'),
        click: function (item, window) {
          sendIPCToWindow(window, 'addPrivateTab')
        }
      },
      {
        label: l('appMenuNewTask'),
        click: function (item, window) {
          sendIPCToWindow(window, 'addTask')
        }
      }
    ]

    var dockMenu = Menu.buildFromTemplate(template)
    app.dock.setMenu(dockMenu)
  }
}
