// hosts are parsed in util/urlParser

function showHostsSuggestions (text, input, event, container) {
  empty(container)

  var results = hosts.filter(function (host) {
    // only match start of host string
    return host.indexOf(text) === 0
  })

  results.slice(0, 4).forEach(function (result) {
    var item = createSearchbarItem({
      title: result,
      secondaryText: l('hostsFileEntry'),
      url: 'http://' + result
    })

    container.appendChild(item)
  })
}

registerSearchbarPlugin('hostsSuggestions', {
  index: 8,
  trigger: function (text) {
    return (hosts.length && typeof text === 'string' && text.length > 2)
  },
  showResults: showHostsSuggestions
})
