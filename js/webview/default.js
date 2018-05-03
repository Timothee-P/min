/* imports common modules */

var electron = require('electron')
var ipc = electron.ipcRenderer
var webFrame
var html2canvas =require('html2canvas')

/* define window.chrome
   this is necessary because some websites (such as the Google Drive file viewer, see issue #378) check for a
   Chrome user agent, and then do things like if(chrome.<module>) {}
   so we need to define an empty chrome object to prevent errors
   */

window.chrome = {}



// Do something according to a request of your mainview
ipc.on('timhetic', function(){
    var colo = 1
    var colo1 = 'black'
    var lum = 1
    html2canvas(document.body,{height:800,
    width:1200}).then(function(canvas){
        var imgData = canvas.getContext('2d').getImageData(0, 0, 1, 1)
        colo = 'rgb(' + imgData.data[0] + ',' + imgData.data[1] + ',' + imgData.data[2] + ')'
        lum = (0.2125 * imgData.data[0]) + (0.2125 * imgData.data[2]) + (0.2125 * imgData.data[1])
        if ( lum <= 100 ){
            colo1 = 'white'
        }
        ipc.sendToHost('pong', colo, colo1)})
  ;
});
