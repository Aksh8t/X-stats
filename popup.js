document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["sessionData"], (result) => {
    console.log(result);
    let usageDiv = document.getElementById("usage");
    let sessions = result.sessionData || [];
    sessions.forEach((session, index) => {
      let div = document.createElement("div");
      div.classList.add("usage-item");
      div.textContent = `Session ${index + 1}: ${session.duration} seconds`;
      usageDiv.appendChild(div);
    });
  });
});
