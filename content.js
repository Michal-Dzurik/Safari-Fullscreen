// Function to check if the extension is enabled
function checkExtensionEnabled(callback) {
  chrome.storage.local.get(['extensionEnabled'], function(result) {
    const isEnabled = result.extensionEnabled || false; // Default to false if not set
    callback(isEnabled);
  });
}

function makeASeparateWindow(rollback = false){
	if (!rollback) chrome.runtime.sendMessage({ action: 'makeTabASeparateWindow' }, function (response) {});
	else chrome.runtime.sendMessage({ action: 'rollbackToOneWindow' }, function (response) {});
}

document.addEventListener('fullscreenchange', function(event) {
	checkExtensionEnabled( (isEnabled) => {
		if (isEnabled) {
			makeASeparateWindow(!document.fullscreenElement);
		}
	});

});