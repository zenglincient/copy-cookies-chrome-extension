export function copyCookie(sourceDomain, targetDomain) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs && tabs.length > 0) {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: function(sourceDomain, targetDomain) {
          chrome.cookies.getAll({ domain: sourceDomain }, function(cookies) {
            cookies.forEach(function(cookie) {
              chrome.cookies.set({
                url: `http://${targetDomain}`,
                name: cookie.name,
                value: cookie.value,
                domain: targetDomain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                expirationDate: cookie.expirationDate
              });
            });
          });
        },
        args: [sourceDomain, targetDomain]
      });
    } else {
      alert('No active tab found');
    }
  });
}
