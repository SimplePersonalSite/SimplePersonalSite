(function() {
  if (window.location.hash === '') {
    window.location = '#!';
  }
  window.onhashchange = changeUrl;
  changeUrl();

  function changeUrl() {
    var url = window.location.hash.substring('#!'.length);
    pFetch(url)
      .then(render)
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

  var defaultContext = {
    'render_md': render_md,
    'render_ejs': render_ejs,
    'render_css': render_css,
  };

  function render(ejs, ctx) {
    var template = _.template(ejs);
    var context = _.defaults({}, ctx, defaultContext);
    return template({'ctx' : context});
  }

  function render_md(filenameOrStr) {
    if (!filenameOrStr.endsWith('.md')) {
      return marked(filenameOrStr);
    }
    var ph = new Placeholder();
    pFetch(filenameOrStr)
      .then(function(md) {
        ph.replace(marked(md));
      })
      .catch(function(err) {
        console.error(err);
        ph.replace('<p>' + err + '</p>');
      });
    return ph + '';
  };

  function render_ejs(filename, ctx) {
    var ph = new Placeholder();
    pFetch(filename)
      .then(function(ejs) {
        ph.replace(render(ejs, ctx));
      })
      .catch(function(err) {
        console.error(err);
        ph.replace('<p>' + err + '</p>');
      });
    return ph + '';
  }

  function render_css(filename) {
    return '<link rel="stylesheet" type="text/css" href="' + filename + '">';
  }

  function Placeholder() {
    this.id = randomId(10);
    this.replaced = false;
  }

  Placeholder.prototype.toString = function toString() {
    return '<span display="none" id="' + this.id + '"></span>'
  };

  Placeholder.prototype.replace = function replace(html) {
    if (this.replaced) {
      throw new Error('can only replace once!');
    }
    this.replaced = true;
    var toReplace = document.getElementById(this.id);
    var elms = toNodes(html);
    for (var i = 0; i < elms.length; ++i) {
      toReplace.parentNode.insertBefore(elms[i], toReplace);
    }
    toReplace.remove();
  };

  function randomId(len) {
    // http://stackoverflow.com/a/1349426/1433127
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  function toNodes(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes;
  }
})();
