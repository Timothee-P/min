var electron = require('electron')
var ipc1 = electron.ipcRenderer
var addTabButton = document.getElementById('add-tab-button')

addTabButton.title = l('newTabAction')
var getLocation = function(href) {
  var l = document.createElement("a");
  l.href = href;
  return l;
};
function showRestartRequiredBanner () {
  document.getElementById('image-bookmark-banner').style.display = 'block'
}
addTabButton.addEventListener('click', function (e) {
  var hetiic = tabs.getSelected()
  var heticTim = tabs.get(hetiic).url
  var l = getLocation(heticTim).hostname
  
  var newIndex = tabs.getIndex(tabs.getSelected()) + 1
    var newTab = tabs.add({
      url:  'https://www.google.fr/search?hl=fr&biw=1521&bih=898&tbs=isz%3Aex%2Ciszw%3A500%2Ciszh%3A500%2Cic%3Atrans&tbm=isch&sa=1&ei=wFn5WofXK8PEwQLc1pUo&q=logo+'+ l
    }, newIndex)

    addTab(newTab, {
      enterEditMode: false // only enter edit mode if the new tab is about:blank
    })
  showRestartRequiredBanner()
    document.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      
        console.log(e.dataTransfer.files[0].path)
        ipc1.send('request-URL-list',{
          arg1: heticTim,
          arg2: e.dataTransfer.files[0].path,
          async: true})
          
          document.getElementById('image-bookmark-banner').style.display = 'none'
      
    });
    document.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
  
 
  
  
})
