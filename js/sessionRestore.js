var sessionRestore = {
  save: function () {
    var data = {
      version: 2,
      state: JSON.parse(JSON.stringify(tabState))
    }

    // save all tabs that aren't private

    for (var i = 1; i < data.state.tasks.length; i++) {
      data.state.tasks[i].tabs = data.state.tasks[i].tabs.filter(function (tab) {
        return !tab.private
      })
    }

    localStorage.setItem('sessionrestoredata', JSON.stringify(data))
  },
  restore: function () {
    var savedStringData = localStorage.getItem('sessionrestoredata')

    try {
      // first run, show the tour
      if (!savedStringData) {
        tasks.setSelected(tasks.add()) // create a new task

        var newTab = currentTask.tabs.add({
          url: 'https://google.fr'
        })
        addTab(newTab, {
          enterEditMode: false
        })
        settings.set('headerTop',true)
        return
      }

      console.log(savedStringData)

      var data = JSON.parse(savedStringData)

      // the data isn't restorable
      if ((data.version && data.version !== 2) || (data.state && data.state.tasks && data.state.tasks.length === 0)) {
        tasks.setSelected(tasks.add())

        addTab(currentTask.tabs.add(), {
          enterEditMode: false,
          leaveEditMode: false // we know we aren't in edit mode yet, so we don't have to leave it
        })
        return
      }

      // add the saved tasks
      hometask = {name:'Accueil'}
      timopoi = tasks.add(hometask)
      data.state.tasks.forEach(function (task) {
        if (task.name != 'Accueil')
        // restore the task item
        {tasks.add(task)}
      })

      // switch to the previously selected tasks
      
      switchToTask(timopoi)

      if (currentTask.tabs.isEmpty()) {
        tabBar.enterEditMode(currentTask.tabs.getSelected())
      }
    } catch (e) {
      // an error occured while restoring the session data

      console.error('restoring session failed: ', e)

      var backupSavePath = require('path').join(remote.app.getPath('userData'), 'sessionRestoreBackup-' + Date.now() + '.json')

      require('fs').writeFileSync(backupSavePath, savedStringData)

      // destroy any tabs that were created during the restore attempt
      initializeTabState()

      // create a new tab with an explanation of what happened
      var newTask = tasks.add()
      var newSessionErrorTab = tasks.get(newTask).tabs.add({
        url: 'file://' + __dirname + '/pages/sessionRestoreError/index.html?backupLoc=' + encodeURIComponent(backupSavePath)
      })

      switchToTask(newTask)
      switchToTab(newSessionErrorTab)
    }
  }
}

// TODO make this a preference

sessionRestore.restore()

setInterval(sessionRestore.save, 12500)
