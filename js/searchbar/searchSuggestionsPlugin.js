var ddgAttribution = l('resultsFromDDG')

function showSearchSuggestions (text, input, event, container) {
  // TODO support search suggestions for other search engines
  if (currentSearchEngine.name == 'DuckDuckGo') {
    return
  }

  if (searchbarResultCount > 3) {
    empty(container)
    return
  }

  fetch('http://suggestqueries.google.com/complete/search?output=firefox&hl=en&q=' + encodeURIComponent(text), {
    cache: 'force-cache'
  })
    .then(function (response) {
      
      return response.json()
    })
    .then(function (results) {
      console.log(results)
      empty(container)

      if (results) {
          
          var data = {
            title: results[1][0]
          }

          if (urlParser.isURL(results[1][0]) || urlParser.isURLMissingProtocol(results[1][0])) { // website suggestions
            data.icon = 'fa-globe'
          } else { // regular search results
            data.icon = 'fa-search'
          }

          var item = createSearchbarItem(data)

          item.addEventListener('click', function (e) {
            openURLFromSearchbar(results[1][0], e)
          })

          container.appendChild(item)

          var data = {
            title: results[1][1]
          }

          if (urlParser.isURL(results[1][1]) || urlParser.isURLMissingProtocol(results[1][1])) { // website suggestions
            data.icon = 'fa-globe'
          } else { // regular search results
            data.icon = 'fa-search'
          }

          var item = createSearchbarItem(data)

          item.addEventListener('click', function (e) {
            openURLFromSearchbar(results[1][1], e)
          })

          container.appendChild(item)

          var data = {
            title: results[1][2]
          }

          if (urlParser.isURL(results[1][2]) || urlParser.isURLMissingProtocol(results[1][2])) { // website suggestions
            data.icon = 'fa-globe'
          } else { // regular search results
            data.icon = 'fa-search'
          }

          var item = createSearchbarItem(data)

          item.addEventListener('click', function (e) {
            openURLFromSearchbar(results[1][2], e)
          })

          container.appendChild(item)
        
      }
      searchbarResultCount += results.length
    })
}

registerSearchbarPlugin('searchSuggestions', {
  index: 4,
  trigger: function (text) {
    return !!text && text.indexOf('!') !== 0 && !tabs.get(tabs.getSelected()).private
  },
  showResults: debounce(showSearchSuggestions, 200)
})
