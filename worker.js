// Cloudflare Worker for Microsoft 365 Sub-Account Creation

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

/**
 * Handles incoming requests and routes them based on method.
 * @param {Request} request
 * @param {Object} env - Environment variables
 * @returns {Response}
 */
async function handleRequest(request, env) {
  if (request.method === 'GET') {
    return serveRegistrationForm(env);
  } else if (request.method === 'POST') {
    return handleRegistration(request, env);
  } else {
    return new Response('Method Not Allowed', { status: 405 });
  }
}

/**
 * Generates a random password.
 * @returns {string}
 */
function generateRandomPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
* Serves the HTML registration form.
 * @param {Object} env - Environment variables
 * @returns {Response}
 */
function serveRegistrationForm(env) {
  const msDomain = env.MS_DOMAIN || 'yourdomain.onmicrosoft.com';
  const TURNSTILE_SITE_KEY = env.TURNSTILE_SITE_KEY || 'YOUR_TURNSTILE_SITE_KEY'; // Fallback for safety

  const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <title>微软子号在线注册/Online Registration for Microsoft Sub-Accounts</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { background-color: white; padding: 30px 40px; border-radius: 10px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1); max-width: 450px; width: 100%; box-sizing: border-box; }
        h2 { text-align: center; color: #1a1a1a; font-size: 24px; margin-bottom: 25px; font-weight: 600; }
        form { display: flex; flex-direction: column; }
        label { font-size: 14px; color: #333; margin-bottom: 6px; font-weight: 500; }
        input[type="text"], input[type="password"] { width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; font-size: 14px; transition: border-color 0.3s ease; }
        input[type="text"]:focus, input[type="password"]:focus { border-color: #0078d4; outline: none; box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2); }
        .input-group { display: flex; align-items: center; margin-bottom: 15px; }
        .input-group input[type="text"] { flex-grow: 1; }
        .input-group span { padding-left: 8px; font-size: 14px; color: #555; }
        input[type="submit"] { width: 100%; padding: 12px; background-color: #0078d4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px; font-weight: 600; transition: background-color 0.3s ease; }
        input[type="submit"]:hover { background-color: #005a9e; }
        small { font-size: 12px; color: #666; margin-top: -10px; margin-bottom: 15px; display: block; }
        .password-options { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
        .password-options label { margin-bottom: 0; font-size: 14px; font-weight: normal; }
        .cf-turnstile { margin-bottom: 20px; margin-top: 5px; }
        .footer { text-align: center; font-size: 12px; padding-top: 20px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>微软子号在线注册/Online Registration for Microsoft Sub-Accounts</h2>
        <form method="POST">
          <label for="firstName">名 (First Name):</label>
          <input type="text" id="firstName" name="firstName" required pattern="[A-Za-z0-9]{1,50}" title="">

          <label for="lastName">姓 (Last Name):</label>
          <input type="text" id="lastName" name="lastName" required pattern="[A-Za-z0-9]{1,50}" title="">

          <label for="username">邮箱前缀 (Username):</label>
          <div class="input-group">
             <input type="text" id="username" name="username" required pattern="[A-Za-z0-9.-_]{1,64}" title="">
             <span>@${escapeHtml(msDomain)}</span>
          </div>

          <label for="password">密码 (Password):</label>
          <input type="password" id="password" name="password" pattern=".{8,}" title="">

          <div class="password-options">
            <input type="checkbox" id="generatePassword" name="generatePassword" checked>
            <label for="generatePassword">自动生成强密码/Automatically generate a strong password</label>
          </div>

          <label for="verificationCode">管理员密码:/Admin Password:</label>
          <input type="text" id="verificationCode" name="verificationCode" required title="">

          <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}"></div>

          <input type="submit" value="注册/Register">
        </form>
        <div class="footer">
          </div>
        <script>
          const firstNameInput = document.getElementById('firstName');
          const lastNameInput = document.getElementById('lastName');
          const usernameInput = document.getElementById('username');

          function suggestUsername() {
            if (!firstNameInput || !lastNameInput || !usernameInput) {
                console.error('One or more input elements (firstName, lastName, username) not found.');
                return;
            }
            const fn = firstNameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
            const ln = lastNameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');

            if (fn && ln) {
              usernameInput.value = fn + '.' + ln;
            } else if (fn) {
              usernameInput.value = fn;
            } else if (ln) {
              usernameInput.value = ln;
            } else {
              usernameInput.value = '';
            }
          }

          if (firstNameInput && lastNameInput && usernameInput) {
            firstNameInput.addEventListener('input', suggestUsername);
            lastNameInput.addEventListener('input', suggestUsername);
          } else {
            console.error('Could not attach event listeners because one or more input elements were not found on page load.');
          }
        <\/script>
      </div>
    </body>
  </html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

/**
 * Handles the registration form submission.
 * @param {Request} request
 * @param {Object} env - Environment variables
 * @returns {Response}
 */
async function handleRegistration(request, env) {
  try {
    const formData = await request.formData();
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const username = formData.get('username');
    let password = formData.get('password');
    const captchaToken = formData.get('cf-turnstile-response');
    const generatePasswordOpt = formData.get('generatePassword') === 'on';
    const verificationCodeInput = formData.get('verificationCode');

    if (!firstName || !lastName || !username || !captchaToken || !verificationCodeInput) {
      return new Response('所有必填字段均不能为空。/All required fields must not be empty.', { status: 400 });
    }
    if (!generatePasswordOpt && (!password || password.length < 8)) {
      return new Response('若不自动生成密码，密码长度至少为8位。/If not auto-generating a password, it must be at least 8 characters long.', { status: 400 });
    }
    if (!/^[A-Za-z0-9.-_]{1,64}$/.test(username)) {
        return new Response('邮箱前缀包含无效字符或长度不符合要求。/Invalid email prefix or length.', { status: 400 });
    }

    if (!env.FORM_VERIFICATION_CODE) {
        console.error("FORM_VERIFICATION_CODE is not configured in environment variables.");
        return new Response('服务器配置错误：内部验证码功能未正确设置。/Server configuration error: the internal verification code is not set up correctly.', { status: 500 });
    }
    if (verificationCodeInput !== env.FORM_VERIFICATION_CODE) {
        return new Response('输入的管理员密码不正确。请核实后重试。/Admin password incorrect. Please check and try again.', { status: 403 });
    }

    const isHuman = await verifyTurnstile(captchaToken, env, request.headers.get('CF-Connecting-IP'));
    if (!isHuman) {
      return new Response('人机验证失败，请刷新页面后重试。/Captcha verification failed. Refresh the page and try again.', { status: 403 });
    }

    const finalPassword = generatePasswordOpt ? generateRandomPassword() : password;
    const userPrincipalName = `${username}@${env.MS_DOMAIN}`;
    const displayName = `${firstName} ${lastName}`;

    const accessToken = await getMicrosoftGraphToken(env);

    const createUserPayload = {
      accountEnabled: true,
      displayName: displayName,
      givenName: firstName,
      surname: lastName,
      mailNickname: username,
      userPrincipalName: userPrincipalName,
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: finalPassword,
      },
      passwordPolicies: "DisablePasswordExpiration, DisableStrongPassword",
      usageLocation: "US",
    };

    const createUserResponse = await fetch('https://graph.microsoft.com/v1.0/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createUserPayload),
    });

    const createdUserData = await createUserResponse.json();

    if (!createUserResponse.ok) {
      console.error('MS Graph API Create User Error:', JSON.stringify(createdUserData, null, 2));
      let errorMessage = `创建用户失败:/Failed to create user: ${createdUserData.error?.code || createUserResponse.status}`;
      if (createdUserData.error && createdUserData.error.message) {
        if (createdUserData.error.message.toLowerCase().includes('userprincipalname already exists') ||
            createdUserData.error.message.toLowerCase().includes('proxyaddress already exists')) {
          errorMessage = '创建失败：此邮箱前缀已被占用或与现有别名冲突。/Creation failed: this email prefix is already in use or conflicts with an existing alias.';
        } else {
          errorMessage = `创建用户 API 错误:/User creation API error: ${createdUserData.error.message}`;
        }
      }
      return new Response(errorMessage, { status: createUserResponse.status });
    }

    if (env.MS_SKU_ID) {
        const assignLicensePayload = {
          addLicenses: [{
            disabledPlans: [],
            skuId: env.MS_SKU_ID,
          }],
          removeLicenses: [],
        };

        const assignLicenseResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userPrincipalName}/assignLicense`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assignLicensePayload),
        });

        if (!assignLicenseResponse.ok) {
          const licenseErrorData = await assignLicenseResponse.json();
          console.error('MS Graph API Assign License Error:', JSON.stringify(licenseErrorData, null, 2));
          return new Response(
            `用户/User ${escapeHtml(userPrincipalName)} 已创建，但分配许可证失败:/Created, but license assignment failed: ${licenseErrorData.error?.message || '未知许可证错误/Unknown license error'}。请联系管理员处理。/Please contact the admin.`,
            { status: 500 }
          );
        }
    } else {
        console.warn(`MS_SKU_ID not configured. User ${userPrincipalName} created without license.`);
    }

    return new Response(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>注册成功/Registration successful</title><style>body{font-family: Segoe UI, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5;} .card{background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px;} h2{color:#28a745;} p{margin: 10px 0; font-size: 16px;} strong{color: #0078d4;} a button{padding:10px 20px; background-color:#0078d4; color:white; border:none; border-radius:4px; cursor:pointer; text-decoration:none; font-size:16px; margin-top:15px;} a button:hover{background-color:#005a9e;}</style></head><body><div class="card">
      <h2>🎉 注册成功/Registration successful</h2>
      <p>邮箱账号:/Email:<strong>${escapeHtml(userPrincipalName)}</strong><br>
      密码:/Password:<strong>${escapeHtml(finalPassword)}</strong></p>
      <p>登录:/Login:https://www.office.com/login</p>
      <a href="/"><button style="background-color:#6c757d;">返回首页/Back to Home</button></a>
      </div></body></html>`,
      { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );

  } catch (error) {
    console.error('Internal Server Error in handleRegistration:', error);
    return new Response(`服务器内部错误:/Internal Server Error: ${error.message}`, { status: 500 });
  }
}

/**
 * Fetches Microsoft Graph API access token.
 * @param {Object} env - Environment variables
 * @returns {Promise<string>} Access token
 */
async function getMicrosoftGraphToken(env) {
  if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    throw new Error("Microsoft Graph API credentials (TENANT_ID, CLIENT_ID, CLIENT_SECRET) are not configured in environment variables.");
  }
  const tokenEndpoint = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', env.MS_CLIENT_ID);
  params.append('client_secret', env.MS_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'https://graph.microsoft.com/.default');

  const tokenResponse = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error(`Error fetching MS Graph token: ${tokenResponse.status} ${errorText}`);
    throw new Error(`无法获取 Microsoft Graph API 访问令牌。请检查 Worker 的环境变量和 Microsoft Entra 应用配置。/Failed to get Microsoft Graph API access token. Verify Worker environment variables and Microsoft Entra app settings.`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

/**
 * Verifies Cloudflare Turnstile token.
 * @param {string} token - The Turnstile token from the form.
 * @param {Object} env - Environment variables
 * @param {string} [ip] - Optional IP address of the client
 * @returns {Promise<boolean>} True if human, false otherwise.
 */
async function verifyTurnstile(token, env, ip) {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("TURNSTILE_SECRET_KEY is not configured. Assuming human for dev purposes ONLY if no key.");
    return true;
  }
  const verifyEndpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const formData = new FormData(); // Use FormData for siteverify
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  if (ip) {
    formData.append('remoteip', ip);
  }

  const response = await fetch(verifyEndpoint, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log("Turnstile verification result:", data); // Log Turnstile result for debugging
  return data.success;
}

/**
 * Escapes HTML to prevent XSS.
 * @param {string} unsafe
 * @returns {string}
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
