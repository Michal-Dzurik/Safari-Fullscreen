// Function to toggle the variable and save it
function setExtentionEnabled(isOn) {
  chrome.storage.local.set({ extensionEnabled: isOn }, function() {});
}

chrome.runtime.onInstalled.addListener(function(details){
    setExtentionEnabled(true);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'makeTabASeparateWindow') {

    // Query all tabs in the current window
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
      if (tabs.length <= 1) {
        sendResponse({ success: false, message: "Only one tab open, nothing to move." });
        return; // Exit early if only one tab is open
      }

      // Get the currently active tab (assuming it's the one that triggered fullscreen)
      chrome.tabs.query({ active: true, currentWindow: true }, function(activeTabs) {
        if (activeTabs.length > 0) {
          const fullscreenTabId = activeTabs[0].id;

          // Filter out the fullscreen tab from the list of tabs
          const tabsToMove = tabs.filter(tab => tab.id !== fullscreenTabId);

          if (tabsToMove.length > 0) {
            // Move all other tabs to a new window
            const tabIds = tabsToMove.map(tab => tab.id);

            chrome.windows.create({ tabId: tabIds[0] }, function(newWindow) {
              // Once the first tab is moved, move the rest
              chrome.tabs.move(tabIds.slice(1), { windowId: newWindow.id, index: -1 }, function() {
                sendResponse({ success: true, message: "Tabs moved to a new window.", newWindow: newWindow });
              });
            });
          } else {
            sendResponse({ success: false, message: "No other tabs to move." });
          }
        } else {
          sendResponse({ success: false, message: "No active tab found." });
        }
      });
    });

    return true; // Keep the message channel open for async response
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'rollbackToOneWindow') {
    // Get all open windows
    chrome.windows.getAll({ populate: true }, function(windows) {
      // Find the window that has the fullscreen tab (original window)
      const mainWindow = windows.find(window => window.tabs.some(tab => tab.active));

      if (!mainWindow) {
        sendResponse({ success: false, message: "No active window found." });
        return;
      }

      const mainWindowId = mainWindow.id;
      let tabsToMove = [];

      // Loop through all windows and collect tabs to move (except the main window)
      windows.forEach(window => {
        if (window.id !== mainWindowId) {
          tabsToMove = tabsToMove.concat(window.tabs.map(tab => tab.id));
        }
      });

      if (tabsToMove.length > 0) {
        // Move all tabs to the original window
        chrome.tabs.move(tabsToMove, { windowId: mainWindowId, index: -1 }, function() {
          // Once tabs are moved, close the empty windows
          const windowsToClose = windows.filter(window => window.id !== mainWindowId && window.tabs.length === 0);
          windowsToClose.forEach(window => chrome.windows.remove(window.id));

          sendResponse({ success: true, message: "Tabs moved back to one window." });
        });
      } else {
        sendResponse({ success: false, message: "No tabs to move." });
      }
    });

    return true; // Keep the message channel open for async response
  }
});
