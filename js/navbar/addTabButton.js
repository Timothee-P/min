var electron = require('electron')
var ipc1 = electron.ipcRenderer
var addTabButton = document.getElementById('add-tab-button')

addTabButton.title = l('newTabAction')
var getLocation = function(href) {
  var l = document.createElement("a");
  l.href = href;
  return l;
};

addTabButton.addEventListener('click', function (e) {
  var hetiic = tabs.getSelected()
  var heticTim = tabs.get(hetiic).url

  var l = getLocation(heticTim);
  
  ipc1.send('request-URL-list',{
    arg1:l.hostname,
    async: true});
})
