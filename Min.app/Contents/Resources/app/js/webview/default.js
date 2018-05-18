/* imports common modules */

var electron = require('electron')

var ipc = electron.ipcRenderer
var webFrame


/* define window.chrome
   this is necessary because some websites (such as the Google Drive file viewer, see issue #378) check for a
   Chrome user agent, and then do things like if(chrome.<module>) {}
   so we need to define an empty chrome object to prevent errors
   */

window.chrome = {}

// Do something according to a request of your mainview
