// Function to toggle the variable and save it
function setExtentionEnabled(isOn) {
  chrome.storage.local.set({ extensionEnabled: isOn }, function() {});
}

// Function to check if the extension is enabled
function checkExtensionEnabled(callback) {
  chrome.storage.local.get(['extensionEnabled'], function(result) {
    const isEnabled = result.extensionEnabled || false; // Default to false if not set
    callback(isEnabled);
  });
}

var checkbox = document.getElementById("switch");

checkExtensionEnabled((isEnabled) => {
	checkbox.checked = isEnabled;
})

checkbox.addEventListener('change', (event) => {
	setExtentionEnabled(event.currentTarget.checked);
})