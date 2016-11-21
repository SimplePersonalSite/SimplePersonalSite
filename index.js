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
      console.error(err);
    });
}

function pFetch(url, times) {
  if (times === undefined) {
    times = 1;
  }
  if (times === 4) {
    return Promise.reject('tried 3 times and failed to get: ' + url);
  }

  return new Promise(function(res, rej) {
    var timeout = {};
    window.ajax().get(url)
        .then(function(response) {
          if (timeout.id !== undefined) {
            clearTimeout(timeout.id);
            res(response);
          } else {
            console.log('resolved after timeout: pFetch(' + url + ', ' + times + ')');
          }
        }).catch(function(response, xhr) {
          if (timeout.id !== undefined) {
            clearTimeout(timeout.id);
            rej(new Error(xhr.status));
          } else {
            console.log('rejected after timeout: pFetch(' + url + ', ' + times + ')');
          }
        });
    timeout.id = setTimeout(function() {
      delete timeout.id;
      console.log('timed out getting: ' + url);
      res(pFetch(url, times + 1));
    }, 500);
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
    console.log(filename);
    if (promises[filename] === undefined) {
      var p = pFetch(filename)
          .catch(function(err) {
            throw new Error(filename + ' failed to load with code: ' + err.message);
          });
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
