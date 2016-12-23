# &lt;Title&gt;

&lt;Title&gt; is a small framework written for developers to write personal websites such as journals and wikis. Developers can write these websites in a mix of javascript, css, html, ejs, and markdown.

### Why developers use &lt;Title&gt;
- you can benefit from a centralized location for all your notes, tools, reminders, todos, etc
- you are tired of repeating yourself when using stright markdown to write notes
- you don't want to wait to render your website every time you make a change

### Why developers choose other tools
- you don't host your notes on localhost or otherwise care about the many requests sent for each page
- you prefer another toolset other than ejs and markdown, and are not willing to spend time reading ~200 lines of code to make your change

## Features
- dynamic markdown ; variables in markdown
- instantaneous changes upon refresh ; (client-side rendering)
- 100% customizable

## How to make your own website
1. create a new directory for your website; `cd` to into it
1. copy or symlink "index.html" and "index.js" from this project
1. create `index.ejs` with `<body>Hello, world!</body>`
1. run `python path/to/this/project/server.py`
  - it may help to symlink or copy this file to your project for easy access
1. enter `localhost:8000` in your browser
  - you can change the port with the `--port` argument to `server.py`
1. Happy editing! You can create new pages, render markdown, style with css&hellip;Edit/create your `.ejs` and `.md` files and refresh your browser to instantly see the changes! See the [sample\_site](sample_site) for an exmple.

## Example website
[sample\_site](sample_site) shows an example of a website. Poke around in here to see how to render markdown, render other ejs files inside of your ejs file, and include css.

```sh
cd sample_site # directory containing your ejs and md files
python ../server.py # or any other tool which will serve everything in this directory without caching (eg nginx, apache)
name_of_your_browser index.html # or open this page in your browser by entering its location in the location bar
```

That's it! The entry point should be clear by reading [index.html](index.html). By default, the index for any page ending in `/` or the `''` page is `index.ejs`. This, and many other settings are configurable in [index.js](index.js).

Remember, this is just a starting point. Feel free to modify code!

## TODO
- This project needs a title.
- rename index.js to `title of this application`.js
- document that you need to use a non-caching http server and give sample python code
