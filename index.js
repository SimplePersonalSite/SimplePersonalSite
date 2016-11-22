function Placeholder() {
  this.id = Placeholder.randomId();
  this.replaced = false;
}
  Placeholder.randomId = function randomId() {
    var len = 12;
    // http://stackoverflow.com/a/1349426/1433127
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i=0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  Placeholder.prototype.toString = function toString() {
    return '<span display="none" id="' + this.id + '"></span>'
  };
  Placeholder.prototype.replace = function replace(html) {
    if (this.replaced) {
      throw new Error('can only replace once!');
    }
    this.replaced = true;
    var toReplace = document.getElementById(this.id);
    var elms = Util.toNodes(html);
    for (var i = 0; i < elms.length; ++i) {
      toReplace.parentNode.insertBefore(elms[i], toReplace);
    }
    toReplace.remove();
  };

function Context(opts) {
  if (opts.url === undefined) {
    throw new Error('url must be defined');
  }
  _.defaults(this, opts, Util.parseUrl(opts.url));
  /**
   * Guaranteed parameters:
   * url - the url of the page being rendered
   * query - query parameters for the page being rendered in object form
   * filename - the name of this file being rendered.
   *   Can be different than the url filename if, for example, its a partial.
   */
}
  Context.prototype.render_md = function render_md(filenameOrStr) {
    if (!filenameOrStr.endsWith('.md')) {
      return marked(filenameOrStr);
    }
    var ph = new Placeholder();
    Util.pFetch(filenameOrStr)
      .then(function(md) {
        ph.replace(marked(md));
      })
      .catch(function(err) {
        console.error(err);
        ph.replace('<p>' + err + '</p>');
      });
    return ph + '';
  };
  Context.prototype.render_ejs = function render_ejs(filename, ctx) {
    var ph = new Placeholder();
    var self = this;
    Util.pFetch(filename)
      .then(function(ejs) {
        var context = new Context(_.defaults({}, ctx, {'filename': filename}, self));
        ph.replace(Util.render(ejs, context));
      })
      .catch(function(err) {
        console.error(err);
        ph.replace('<p>' + err + '</p>');
      });
    return ph + '';
  }
  Context.prototype.render_css = function render_css(filename) {
    return '<link rel="stylesheet" type="text/css" href="' + filename + '">';
  }

function App(uberSecretCode) {
  if (uberSecretCode !== App._uberSecretCode) {
    throw new Error('App is a singleton. Call getInstance() to retrive instance.');
  }
  this.setConfig();
}
  App._instance = null;
  App._uberSecretCode = {};
  App._defaultConfig = {
    'hash': '#!',
  };
  App.getInstance = function getInstance() {
    if (App._instance === null) {
      App._instance = new App(App._uberSecretCode);
    }
    return App._instance;
  };
  App.prototype.setConfig = function setConfig(config) {
    this.config = _.defaults({}, config, App._defaultConfig);
  };
  App.prototype.run = function run() {
    if (window.location.hash === '') {
      window.location.hash = this.config['hash'];
    }
    this.processUrlChange();
    window.onhashchange = this.processUrlChange.bind(this);
  };
  App.prototype.getUrl = function getUrl() {
    return window.location.hash.substring(this.config['hash'].length);
  };
  App.prototype.processUrlChange = function processUrlChange() {
    var url = this.getUrl();
    Util.pFetch(url)
      .then(function(ejs) {
        var context = new Context({'url': url});
        return Util.render(ejs, context);
      })
      .then(function(html) {
        document.body.innerHTML = html;
      })
      .catch(function(err) {
        console.error(err);
        document.body.innerHTML = '<h2>Error</h2><p>' + err + '</p>'
      });
  };

var Util = {};
  Util.pFetch = function pFetch(url) {
    // ajax's promises don't work as expected.
    return new Promise(function (res, rej) {
      window.ajax().get(url)
          .then(res)
          .catch(function(response, xhr) {
            rej(new Error(url + ' failed to load with code: ' + xhr.status));
          });
    });
  };
  Util.render = function render(ejs, context) {
    var template = _.template(ejs);
    return template({'ctx': context});
  };
  Util.toNodes = function toNodes(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes;
  };
  Util.parseUrl = function parseUrl(url) {
    var qIdx = url.indexOf('?');
    if (qIdx === -1) {
      return {
        filename: url,
        query: {},
      };
    } else {
      return {
        filename: url.substr(0, qIdx),
        query: _.chain([url.substr(qIdx+1, url.length)])
            .map(function(str) { return str.split('&'); })
            .flatten()
            .reduce(function(memo, keyVal) {
              var keyVal = keyVal.split('=');
              var key = decodeURIComponent(keyVal[0]);
              var val = decodeURIComponent(keyVal[1] === undefined ? true : keyVal[1]);
              if (memo[key] !== undefined) {
                if (!Array.isArray(memo[key])) {
                  memo[key] = [memo[key]]
                }
                memo[key].push(val);
              } else {
                memo[key] = val;
              }
              return memo;
            }, {})
            .value(),
      }
    }
  };
