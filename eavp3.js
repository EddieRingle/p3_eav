var port = chrome.extension.connect({name: "show_page_action"});
port.postMessage({action: "show_page_action"});
