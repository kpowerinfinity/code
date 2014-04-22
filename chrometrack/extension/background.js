// Krishna Mehra

chrome.cookies.onChanged.addListener(function(info) {
  //console.log("onchanged" + JSON.stringify(info));
});

function focusOrCreateTab(url) {
  chrome.windows.getAll({"populate":true}, function(windows) {
    var existing_tab = null;
    for (var i in windows) {
      var tabs = windows[i].tabs;
      for (var j in tabs) {
        var tab=tabs[j];
	console.log("tab url: "+tab.url);
	if (tab.url == url) {
	  existing_tab = tab;
	  break;
	  
	}
      }
    }
    if (existing_tab) {
      chrome.tabs.update(existing_tab.id, {"selected" : true});
    } else {
      chrome.tabs.create({"url":url, "selected":true});
    }
    
  });
}

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log("setting browser action");
  var manager_url = chrome.extension.getURL("manager.html");
  console.log("manager url "+manager_url);
  focusOrCreateTab(manager_url);
});
