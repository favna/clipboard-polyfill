import {DT, suppressDTWarnings} from "./DT";

// Debug log strings should be short, since they are copmiled into the production build.
// TODO: Compile debug logging code out of production builds?
var debugLog: (s: string) => void = function(s: string) {};

var TEXT_PLAIN = "text/plain";

declare global {
  interface Navigator {
    clipboard: {
      writeText?: (s: string) => Promise<void>;
      readText?: () => Promise<string>;
    };
  }
}

export default class ClipboardPolyfill {
  public static readonly DT = DT;

  public static setDebugLog(f: (s: string) => void): void {
    debugLog = f;
  }

  public static suppressWarnings() {
    suppressDTWarnings();
  }

  public static async write(data: DT): Promise<void> {
    if (execCopy(data)) {
      debugLog("regular execCopy worked");
      return;
    }

    throw "Copy command failed.";
  }

  public static async writeText(s: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      debugLog("Using `navigator.clipboard.writeText()`.");
      return navigator.clipboard.writeText(s);
    }
    return this.write(DTFromText(s));
  }

  public static async read(): Promise<DT> {
    return DTFromText(await this.readText());
  }

  public static async readText(): Promise<string> {
    if (navigator.clipboard && navigator.clipboard.readText) {
      debugLog("Using `navigator.clipboard.readText()`.");
      return navigator.clipboard.readText();
    }
    throw "Read is not supported in your browser.";
  }
}

/******** Implementations ********/

class FallbackTracker {
  public success: boolean = false;
}

function copyListener(tracker: FallbackTracker, data: DT, e: ClipboardEvent): void {
  debugLog("listener called");
  tracker.success = true;
  data.forEach((value: string, key: string) => {
    e.clipboardData.setData(key, value);
    if (key === TEXT_PLAIN && e.clipboardData.getData(key) != value) {
      debugLog("setting text/plain failed");
      tracker.success = false;
    }
  });
  e.preventDefault();
}

function execCopy(data: DT): boolean {
  var tracker = new FallbackTracker();
  var listener = copyListener.bind(this, tracker, data);

  document.addEventListener("copy", listener);
  try {
    // We ignore the return value, since FallbackTracker tells us whether the
    // listener was called. It seems that checking the return value here gives
    // us no extra information in any browser.
    document.execCommand("copy");
  } finally {
    document.removeEventListener("copy", listener);
  }
  return tracker.success;
}

/******** Convenience ********/

function DTFromText(s: string): DT {
  var dt = new DT();
  dt.setData(TEXT_PLAIN, s);
  return dt;
}
