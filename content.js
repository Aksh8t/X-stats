let startTime = Date.now();

// Track message input or submission
document.querySelector("textarea").addEventListener("keydown", () => {
  chrome.storage.local.get(["usageData"], (result) => {
    let data = result.usageData || [];
    data.push({ timestamp: Date.now(), action: "message sent" });
    chrome.storage.local.set({ usageData: data });
  });
});

// Store session time on unload
window.addEventListener("beforeunload", () => {
  let endTime = Date.now();
  let sessionDuration = (endTime - startTime) / 1000; // in seconds
  chrome.storage.local.get(["sessionData"], (result) => {
    let sessionData = result.sessionData || [];
    sessionData.push({ start: startTime, end: endTime, duration: sessionDuration });
    chrome.storage.local.set({ sessionData: sessionData });
  });
});
console.log("Content script is running");
