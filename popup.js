const form = document.getElementById('control-row');
const targetInput = document.getElementById('target');
const sourceInput = document.getElementById('source');
const message = document.getElementById('message');

// The async IIFE is necessary because Chrome <89 does not support top level await.
(async function initPopupWindow() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 从Chrome存储中获取默认源域名
  chrome.storage.sync.get(['defaultSource'], function(result) {
    if (result.defaultSource) {
      sourceInput.value = result.defaultSource;
    } else {
      sourceInput.value = 'test.com';  // 初始默认值
    }
  });

  if (tab?.url) {
    try {
      let url = new URL(tab.url)
      targetInput.value = url.hostname
    } catch {
      // ignore
    }
  } else {
    targetInput.value = 'localhost';
  }

  input.focus();
})();

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
  event.preventDefault();

  clearMessage();

  // 保存用户设置的源域名到Chrome存储中
  chrome.storage.sync.set({defaultSource: sourceInput.value}, function() {
    console.log('Default source domain saved: ' + sourceInput.value);
  });


  let targetUrl = stringToUrl(targetInput.value);
  if (!targetUrl) {
    setMessage('Invalid URL');
    return;
  }

  let message = await copyCookie(sourceInput.value, targetInput.value);
  setMessage(message);
}

function stringToUrl(input) {
  // Start with treating the provided value as a URL
  try {
    return new URL(input);
  } catch {
    // ignore
  }
  // If that fails, try assuming the provided input is an HTTP host
  try {
    return new URL('http://' + input);
  } catch {
    // ignore
  }
  // If that fails ¯\_(ツ)_/¯
  return null;
}

async function copyCookie(url) {
  let totalCookies = 0;
  try {
    const cookies = await chrome.cookies.getAll({ domain: sourceInput.value });

    if (cookies.length === 0) {
      return 'No cookies found';
    }

    cookies.forEach(function(cookie) {
      chrome.cookies.set({
        url: url.href,
        name: cookie.name,
        value: cookie.value,
        domain: url.hostname,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate
      });
      totalCookies++;
    });
  } catch (error) {
    return `Unexpected error: ${error.message}`;
  }

  return `复制成功`;
}

function deleteCookie(cookie) {
  // Cookie deletion is largely modeled off of how deleting cookies works when using HTTP headers.
  // Specific flags on the cookie object like `secure` or `hostOnly` are not exposed for deletion
  // purposes. Instead, cookies are deleted by URL, name, and storeId. Unlike HTTP headers, though,
  // we don't have to delete cookies by setting Max-Age=0; we have a method for that ;)
  //
  // To remove cookies set with a Secure attribute, we must provide the correct protocol in the
  // details object's `url` property.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Secure
  const protocol = cookie.secure ? 'https:' : 'http:';

  // Note that the final URL may not be valid. The domain value for a standard cookie is prefixed
  // with a period (invalid) while cookies that are set to `cookie.hostOnly == true` do not have
  // this prefix (valid).
  // https://developer.chrome.com/docs/extensions/reference/cookies/#type-Cookie
  const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;

  return chrome.cookies.remove({
    url: cookieUrl,
    name: cookie.name,
    storeId: cookie.storeId
  });
}

function setMessage(str) {
  message.textContent = str;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = '';
}