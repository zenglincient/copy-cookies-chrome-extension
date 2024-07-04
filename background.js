export function copyCookie() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs.length > 0) {
      const tabId = tabs[0].id;
      alert('tabs[0]: ' + tabId);
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: function() {
          chrome.cookies.getAll({ url: window.location.href }, function(cookies) {
            console.log('cookies: ' + JSON.stringify(cookies));
            cookies.forEach(function(cookie) {
              chrome.cookies.set({
                url: "http://localhost:8081",
                name: cookie.name,
                value: cookie.value,
                domain: "localhost",
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                expirationDate: cookie.expirationDate
              });
            });
          });
        },
      });
    } else {
      alert('No active tab found');
    }
  });
}
