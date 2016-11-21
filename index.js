if (window.location.hash === '') {
  window.location = '#!';
}
window.onhashchange = changeUrl;
changeUrl();

function changeUrl() {
  var url = window.location.hash.substring('#!'.length);
  pFetch(url)
    .then(pRender)
    .then(function(html) {
      document.body.innerHTML = html;
    })
    .catch(function(err) {
      document.body.innerHTML = '<h2>Error</h2><p>' + err + '</p>'
    });
}

function pFetch(url) {
  // ajax's promises don't work as expected.
  return new Promise(function (res, rej) {
    window.ajax().get(url)
        .then(res)
        .catch(function(response, xhr) {
          rej(new Error(url + ' failed to load with code: ' + xhr.status));
        });
  });
}

function pRender(ejs) {
  return pLoadDependencies(ejs)
      .then(function(dependencies) {
        var template = _.template(ejs);
        var context = {
          'dependencies': dependencies,
          'render_md': function render_md(filename) {
            return marked(dependencies[filename]);
          },
        };
        return template(context);
      });
}

function pLoadDependencies(ejs) {
  var mdRex = /render_md\('([^']+)'\)/g;
  var promises = {};

  var matches = null;
  while (matches = mdRex.exec(ejs)) {
    var filename = matches[1];
    if (promises[filename] === undefined) {
      var p = pFetch(filename);
      promises[filename] = p;
    }
  }

  return Promise.all(_.values(promises))
    .then(function(responses) {
      var dependencies = {};
      for (var i = 0; i < responses.length; ++i) {
        var response = responses[i];
        var filename = _.keys(promises)[i];
        dependencies[filename] = response;
      }
      return dependencies;
    });
}
