// Namespace for the app
var SimplePersonalSite = {};



/**
 * Utility/global functions that are specific to this app but don't really belong anywhere else.
 */
var Util = {};
Util.isPromise = function isPromise(p) {
  return p !== undefined && p !== null && typeof p.then == 'function';
};
Util.pFetch = function pFetch(url) {
  return Util.pAjax(url, 'get');
};
Util.pAjax = function pFetch(url, method, data) {
  // ajax's promises don't work as expected.
  return new Promise(function (res, rej) {
    (data === undefined ? window.ajax()[method](url) : window.ajax()[method](url, data))
        .then(res)
        .catch(function(response, xhr) {
          rej(new Error(url + ' failed to load with code: ' + xhr.status));
        });
  });
};
Util.render_ejs = function render_ejs(ejs, context) {
  var template = _.template(ejs);
  return template({'ctx': context});
};
Util.toNodes = function toNodes(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.childNodes;
};
Util.createSingleton = function createSingleton(name, constructor) {
  var S = function(uberSecretCode) {
    if (uberSecretCode !== S._uberSecretCode) {
      throw new Error(name + ' is a singleton. Call getInstance() to retrieve instance.');
    }
    if (constructor) {
      constructor.call(this);
    }
  }
  S._uberSecretCode = {};
  S._instance = null;
  S.getInstance = function getInstance() {
    if (S._instance === null) {
      S._instance = new S(S._uberSecretCode);
    }
    return S._instance;
  };
  Object.defineProperty(S, 'name', {value: name});
  return S;
};
Util.linkCss = function linkCss(href) {
  var link = Util.toNodes('<link rel="stylesheet" type="text/css" href="' + href + '">')[0];
  document.head.appendChild(link);
};
Util.pLinkJs = function pLinkJs(src) {
  return new Promise(function(res, rej) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = res;
    script.onerror = rej;
    document.head.appendChild(script);
  });
};
Util.ResolvablePromise = function ResolvablePromise() {
  var _res = null;
  var _rej = null;

  var p = new Promise(function(res, rej) {
    _res = res;
    _rej = rej;
  });
  p.resolve = function resolve() {
    var args = arguments;
    Promise.resolve().then(function() {
      assertDefined();
      _res.apply(this, args);
    }).catch(console.error.bind(console));
  };
  p.reject = function reject() {
    var args = arguments;
    Promise.resolve().then(function() {
      assertDefined();
      _rej.apply(this, args);
    }).catch(console.error.bind(console));
  };
  return p;

  function assertDefined() {
    if (_res === null || _rej === null) {
      throw new Error('Util.ResolvablePromise: expected _res and _rej to be defined by now.');
    }
  }
};
Util.getPathname = function getPathname() {
  return Util.getQuery()[App.getInstance().config['pageQueryParam']] || '';
};
Util.getSearch = function getSearch() {
  var search = window.location.search;
  var idx = search.indexOf('?');
  if (idx == -1) {
    return '';
  }
  return search.substring(idx + 1);
};
Util.getQuery = function getQuery() {
  return Util.parseQuery(Util.getSearch());
};
Util.parseQuery = function parseQuery(search) {
  if (search == '') {
    return {};
  }
  return _.chain([search])
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
      .value();
};
Util.assert = function assert(cond, msg) {
  if (!cond) {
    msg = msg || 'Assertion failed';
    throw new Error(msg);
  }
};



/**
 * The entry point for SimplePersonalSite.
 */
var App = Util.createSingleton('App', function() {
  this.setConfig();
  this._inited = false;
});
App._defaultConfig = {
  'index': 'index.ejs',
  'pageQueryParam': 'page',
};
App.prototype.setConfig = function setConfig(config) {
  this.config = _.defaults({}, config, App._defaultConfig);
};
App.prototype.pInit = function pInit(plugins) {
  if (this._inited !== false) {
    return Promise.resolve();
  }
  this._inited = true;
  return plugins.reduce(function(memoP, plugin) {
    var res = plugin();
    if (Util.isPromise(res)) {
      memoP = memoP.then(res);
    }
    return memoP;
  }, Promise.resolve());
};
/**
 * plugins - a list of functions which will be called in order. The plugins may return a promise if
 * they do asychronous work. If a plugin returns a promise, the app will wait until it resolves
 * before calling the next plugin.
 */
App.prototype.run = function run(plugins) {
  plugins = plugins || [];
  var self = this;

  this.pInit(plugins).then(function() {
    self.load();
  }).catch(console.error.bind(console));
};
App.prototype.load = function load() {
  var query = Util.getQuery();
  var url = Util.getPathname();
  if (url == '' || url.endsWith('/')) {
    url += this.config['index'];
  }
  Util.pFetch(url)
    .then(function(ejs) {
      var context = new Context({'url': url, 'query': query, 'filename': url});
      return Util.render_ejs(ejs, context);
    })
    .then(function(html) {
      document.body.innerHTML = html;
    })
    .catch(function(err) {
      console.error(err);
      document.body.innerHTML = '<h2>Error</h2><p>' + err + '</p>'
    });
};
App.prototype.refresh = function refresh() {
  this.load();
};



/**
 * A placeholder facilitates rendering files asynchronously. We create a placeholder for every
 * ctx.render* we encounter, start loading the file, and when the file has loaded, we replace the
 * placeholder with the file's rendered contents.
 */
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



/**
 * The context is the context/environment exposed to each rendered file as "ctx". The user can store
 * functions and variables on the context for use when rendering.
 */
function Context(opts) {
  if (opts.url === undefined || opts.query === undefined || opts.filename === undefined) {
    throw new Error('url, query, and filename must be defined');
  }
  _.defaults(this, opts);
  /**
   * Guaranteed parameters available to every rendered file:
   * url - the url of the page being rendered
   * query - query parameters for the page being rendered in object form
   * filename - the name of this file/template being rendered. May be a markup file.
   */
}
Context.prototype.create = function create(opts) {
  return new Context(_.defaults({}, this, opts));
};
Context.prototype.render_md = function render_md(filenameOrStr) {
  return filenameOrStr.endsWith('.md') ?
      this.render_md_file(filenameOrStr) : this.render_md_str(filenameOrStr);
};
Context.prototype.render_md_str = function render_md_str(str) {
  return marked(Util.render_ejs(str, this));
};
Context.prototype.render_md_file = function render_md_file(filename) {
  var ph = new Placeholder();
  var self = this;
  Util.pFetch(filename)
    .then(function(md) {
      var ctx = self.create({'filename': filename});
      ph.replace(marked(Util.render_ejs(md, ctx)));
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
      var context = self.create({'filename': filename});
      ph.replace(Util.render_ejs(ejs, context));
    })
    .catch(function(err) {
      console.error(err);
      ph.replace('<p>' + err + '</p>');
    });
  return ph + '';
};
Context.prototype.render_css = function render_css(filename) {
  return '<link rel="stylesheet" type="text/css" href="' + filename + '">';
};
Context.prototype.render_js = function render_js(filename) {
  return '<script src="' + filename + '">';
};



SimplePersonalSite.App = App;
SimplePersonalSite.Context = Context;
SimplePersonalSite.Placeholder = Placeholder;
SimplePersonalSite.Util = Util;
