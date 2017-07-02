/**
 * Namespace for the app.
 * (fields are set at end of file).
 */
var SimplePersonalSite = {};



/**
 * Utility/global functions that are specific to this app but don't really belong anywhere else.
 */
var Util = {};

/**
 * Return true if the parameter is "then-able".
 */
Util.isPromise = function isPromise(p) {
  return p !== undefined && p !== null && typeof p.then == 'function';
};

/**
 * Promise the data contained at `url`.
 */
Util.pFetch = function pFetch(url) {
  return Util.pAjax(url, 'get');
};

/**
 * Promise the data contained at `url` using `method` as the http method and `data` as the
 * post-data.
 */
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

/**
 * Render the `ejs` template using `context`.
 * ejs - the source code of the template
 * context - the context inside of the template, referred to inside the template as "ctx"
 */
Util.render_ejs = function render_ejs(ejs, context) {
  var template = _.template(ejs);
  return template({'ctx': context});
};

/**
 * Turn `html` into dom notes that can be manipulated or appended to the document model.
 */
Util.toNodes = function toNodes(html) {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.childNodes;
};

/**
 * Create a singleton class names `name` with `constructor` as its constructor. It has a method
 * `getInstance` which retrieves the single instance of the class.
 */
Util.createSingleton = function createSingleton(name, constructor) {
  var singleton = function(uberSecretCode) {
    if (uberSecretCode !== singleton._uberSecretCode) {
      throw new Error(name + ' is a singleton. Call getInstance() to retrieve instance.');
    }
    if (constructor) {
      constructor.call(this);
    }
  }
  singleton._uberSecretCode = {};
  singleton._instance = null;
  singleton.getInstance = function getInstance() {
    if (singleton._instance === null) {
      singleton._instance = new singleton(singleton._uberSecretCode);
    }
    return singleton._instance;
  };
  Object.defineProperty(singleton, 'name', {value: name});
  return singleton;
};

/**
 * Alter the DOM to link to the css at the url: `href`.
 */
Util.linkCss = function linkCss(href) {
  var link = Util.toNodes('<link rel="stylesheet" type="text/css" href="' + href + '">')[0];
  document.head.appendChild(link);
};

/**
 * Alter the dom to run the javascript at the url: `src`. If the script is loaded successfully,
 * the returned promise will resolve, otherwise it will reject to the error.
 */
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

/**
 * Create a promise that has the methods `resolve` and `reject`. The promise can then be
 * resolved at any time by calling its `resolve` or `reject` methods.
 */
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

/**
 * Get the pathname of the browser's current location.
 */
Util.getPathname = function getPathname() {
  return Util.getQuery()[App.getInstance().config['pageQueryParam']] || '';
};

/**
 * Get the search string of the browser's current location.
 */
Util.getSearch = function getSearch() {
  var search = window.location.search;
  var idx = search.indexOf('?');
  if (idx == -1) {
    return '';
  }
  return search.substring(idx + 1);
};

/**
 * Get the query parameters of the browser's current location. Equivalent to Util.getSearch(),
 * except rather than returning a string, it parses the search string and returns a dict of the
 * parameters.
 */
Util.getQuery = function getQuery() {
  return Util.parseQuery(Util.getSearch());
};

/**
 * Parse the search/query string and return a dictionary of the parameters.
 */
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

/**
 * Assert `cond` is true, throwing an error with `msg` (optional) if `cond` is not true.
 */
Util.assert = function assert(cond, msg) {
  if (!cond) {
    msg = msg || 'Assertion failed';
    throw new Error(msg);
  }
};

/**
 * Escape html special chars.
 * https://stackoverflow.com/a/12034334
 */
Util.escapeHtml = function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, Util.escapeHtmlChar);
}
Util.escapeHtmlChar = function escapeHtmlChar(c) {
  return Util._entityMap[c];
};
Util._entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
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

/**
 * Set the configuration for this app.
 */
App.prototype.setConfig = function setConfig(config) {
  this.config = _.defaults({}, config, App._defaultConfig);
};

/**
 * Initialize the application. Returna promise that resolves when the application has been
 * initialized.
 *
 * plugins - a list of functions which will be called in order. The plugins may return a promise if
 * they do asychronous work. If a plugin returns a promise, the app will wait until it resolves
 * before calling the next plugin.
 */
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
 * Actually start the application.
 */
App.prototype.run = function run(plugins) {
  plugins = plugins || [];
  var self = this;

  this.pInit(plugins).then(function() {
    self.load();
  }).catch(console.error.bind(console));
};

/**
 * Load the page in the url and display it.
 */
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

/**
 * Synonym to App.load()
 */
App.prototype.refresh = function refresh() {
  this.load();
};



/**
 * A placeholder facilitates rendering files asynchronously. We create a placeholder for every
 * ctx.render* we encounter, start loading the file, and when the file has loaded, we replace the
 * placeholder with the file's rendered contents.
 *
 * To use the placeholder, first create a new placeholder:
 *   ```js
 *   var ph = new Placeholder()
 *   ```
 *
 * Then insert it into the dom wherever the asynchronously loaded content should go:
 *   ```js
 *   dom.findElementById('some-id').append(ph.toString());
 *   ```
 *
 * Finally, when the asynchronous page has loaded, replace the placeholder with the page's contents:
 *   ```js
 *   Util.pFetch('url').then(function(data){ph.replace(data);}).catch(console.error.bind(console));
 *   ```
 */
function Placeholder() {
  this.id = Placeholder.randomId();
  this.replaced = false;
}

/**
 * Create a random identifier which can identify a placeholder.
 */
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

/**
 * Create an html string of the placeholder which can be inserted into the page.
 */
Placeholder.prototype.toString = function toString() {
  return '<span display="none" id="' + this.id + '"></span>'
};

/**
 * Replace the placeholder with `html`.
 */
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
 *
 * The guaranteed parameters available to every rendered file:
 * url - the url of the page being rendered
 * query - query parameters for the page being rendered in dictionary form
 * filename - the name of this file/template being rendered. May be a markup file.
 */
function Context(opts) {
  if (opts.url === undefined || opts.query === undefined || opts.filename === undefined) {
    throw new Error('url, query, and filename must be defined');
  }
  _.defaults(this, opts);
}

/**
 * Create a new context. `opt` is required, see the constructor above for required fields.
 */
Context.prototype.create = function create(opts) {
  return new Context(_.defaults({}, this, opts));
};

/**
 * Render a markdown file in place.
 * If the parameter ends with `.md`, this function will fetch the file first, then display it
 * (recursively fetching any files it requires). Otherwise the parameter is assumed to be the string
 * containing the markdown.
 *
 * Note: the parameter is rendered as EJS before rendering it as markdown.
 */
Context.prototype.render_md = function render_md(filenameOrStr) {
  return filenameOrStr.endsWith('.md') ?
      this.render_md_file(filenameOrStr) : this.render_md_str(filenameOrStr);
};

/**
 * Render a markdown string in place.
 * Note: the parameter is rendered as EJS before rendering it as markdown.
 */
Context.prototype.render_md_str = function render_md_str(str) {
  return marked(Util.render_ejs(str, this));
};

/**
 * Render a markdown file in place. First fetch the file, then render it. Uses a placeholder to
 * temporarily store where the markdown file should be displayed until the markdown file has
 * finished loading.
 */
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

/**
 * Render an ejs file in place.
 */
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

/**
 * Insert a css <link> tag in place.
 */
Context.prototype.render_css = function render_css(filename) {
  return '<link rel="stylesheet" type="text/css" href="' + filename + '">';
};

/**
 * Insert a javascript <script> tag in place.
 */
Context.prototype.render_js = function render_js(filename) {
  return '<script src="' + filename + '">';
};



SimplePersonalSite.App = App;
SimplePersonalSite.Context = Context;
SimplePersonalSite.Placeholder = Placeholder;
SimplePersonalSite.Util = Util;
