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

## How to use it
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
