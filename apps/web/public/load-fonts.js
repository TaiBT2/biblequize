// Activate non-render-blocking font stylesheets. CSP-safe replacement for the
// inline `onload="this.media='all'"` handlers, which require an unsafe
// `script-src 'unsafe-inline'` CSP. Each font <link> ships render-inert with
// `media="print" data-font-swap`; once its stylesheet is parsed we flip the
// media query to `all` so it applies without ever blocking first paint.
(function () {
  function activate(link) { link.media = 'all' }
  var links = document.querySelectorAll('link[data-font-swap]')
  for (var i = 0; i < links.length; i++) {
    var link = links[i]
    // Preloaded sheets may already be parsed by the time this runs.
    if (link.sheet) activate(link)
    else link.addEventListener('load', function () { activate(this) }, { once: true })
  }
})()
