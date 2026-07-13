"use strict";

hexo.extend.filter.register(
  "server_middleware",
  function addGiscusThemeCors(app) {
    app.use((request, response, next) => {
      if (/^\/css\/giscus-comment-(?:dark|light)\.css(?:\?|$)/.test(request.url)) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Cache-Control", "no-store");
      }
      next();
    });
  },
  0,
);
