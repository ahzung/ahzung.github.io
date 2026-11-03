/* The landing page: pick a payload, then start the run.
 *
 * Leaving this page has to be a real navigation from it -- the referrer guard
 * in jb.js arms the chain only when the run page was reached from here. */

var TARGET = {
  goldhen: "log=1&afterglow=run&mode=goldhen",
};

var AUTOSTART_SECONDS = 3;
var cacheEl = document.getElementById("cache");
var waitingForCache = false;

/* The offline cache, and the one state that must not be run through.
 *
 * While the manifest is being checked or fetched, some modules are the ones
 * the page loaded with and some are not yet on disk -- starting there can mix
 * two builds. Every other state is fine to start from: IDLE is cached and
 * current, UNCACHED means no cache at all (which works as long as the server
 * answers), and a browser with no Application Cache at all -- every desktop
 * browser since Chrome 95 -- must obviously still be able to start.
 *
 * So this blocks on CHECKING and DOWNLOADING and nothing else. The inverse,
 * passing only on IDLE, leaves the button dead wherever the cache is absent.
 *
 * The idea is titotryh-ux's, from Fewi-PS4 911e08a. */
var appCache = (function () {
  try { return window.applicationCache || null; } catch (e) { return null; }
})();

function cacheBusy() {
  if (!appCache) return false;
  try {
    return appCache.status === appCache.CHECKING
        || appCache.status === appCache.DOWNLOADING;
  } catch (e) {
    return false;
  }
}

function cacheNote() {
  if (!cacheEl) return;
  if (!appCache) { cacheEl.textContent = ""; return; }
  var text = "";
  try {
    if (appCache.status === appCache.CHECKING) text = "checking for updates";
    else if (appCache.status === appCache.DOWNLOADING) text = "loading files - hold on";
    else if (appCache.status === appCache.UPDATEREADY) text = "a newer version is cached - reopen this page to use it";
    else if (appCache.status === appCache.OBSOLETE) text = "the cache was dropped - the server answers directly";
  } catch (e) {}
  cacheEl.textContent = text;
}

function cacheChanged() {
  cacheNote();
  /* Someone pressed start while the files were still coming down. Go now
     that they are here, rather than making them press again. */
  if (waitingForCache && !cacheBusy()) {
    waitingForCache = false;
    start();
  }
}

if (appCache) {
  var events = ["checking", "downloading", "progress", "cached", "noupdate",
                "updateready", "error", "obsolete"];
  for (var e = 0; e < events.length; e++) {
    try { appCache.addEventListener(events[e], cacheChanged, false); } catch (err) {}
  }
}

function picked() {
  return "goldhen";
}

function start() {
  /* Not a refusal -- a wait. The run begins by itself once the files are in. */
  if (cacheBusy()) {
    waitingForCache = true;
    cacheNote();
    return;
  }
  location.href = "jb.html?" + TARGET[picked()];
}

cacheNote();
start();