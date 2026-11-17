(() => {
  'use strict';

  window.createBancadaCloud = function createBancadaCloud(ui) {
    const config = window.BancadaCloudConfig;
    const sessionKey = 'bancada-supabase-session:' + config.url;
    let session = null;
    let refreshing = null;
    let revision = null;
    let pending = null;
    let saving = null;
    let timer = null;
    let conflict = false;
    let busy = false;

    function storeSession(value) {
      session = value;
      try {
        if (value) localStorage.setItem(sessionKey, JSON.stringify(value));
        else localStorage.removeItem(sessionKey);
        sessionStorage.removeItem(sessionKey);
      } catch {
        // The current sign-in still works when browser storage is unavailable.
      }
    }

    async function request(path, { token, body, method = 'GET', headers = {} } = {}) {
      const response = await fetch(config.url + path, {
        method,
        cache: 'no-store',
        headers: {
          apikey: config.key,
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!response.ok) {
        const error = new Error('Supabase: ' + response.status);
        error.status = response.status;
        const detail = await response.json().catch(() => ({}));
        error.code = detail.code || detail.error_code || '';
        throw error;
      }
      if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
        return null;
      }
      return response.json();
    }

    function sessionFrom(data) {
      if (!data?.access_token || !data.refresh_token || !data.user?.id) throw new Error('Sessão inválida');
      return {
        access: data.access_token,
        refresh: data.refresh_token,
        expires: Date.now() + Number(data.expires_in || 3600) * 1000,
        userId: data.user.id,
        email: data.user.email || ''
      };
    }

    async function tokenGrant(grant, body) {
      return sessionFrom(await request('/auth/v1/token?grant_type=' + grant, { method: 'POST', body }));
    }

    async function accessToken() {
      if (!session) throw new Error('Sessão encerrada');
      if (session.expires > Date.now() + 60000) return session.access;
      if (!refreshing) {
        refreshing = tokenGrant('refresh_token', { refresh_token: session.refresh }).then(next => {
          if (next.userId !== session.userId) throw new Error('Sessão inválida');
          if (!next.email) next.email = session.email || '';
          storeSession(next);
          return next.access;
        }).finally(() => { refreshing = null; });
      }
      return refreshing;
    }

    function own() {
      return 'usuario=eq.' + encodeURIComponent(session.userId);
    }

    async function read() {
      const rows = await request('/rest/v1/bancada_estado?select=revisao,dados&' + own(), {
        token: await accessToken()
      });
      if (!Array.isArray(rows) || rows.length !== 1) return null;
      if (!Number.isSafeInteger(rows[0].revisao) || rows[0].revisao < 0) throw new Error('Revisão inválida');
      return rows[0];
    }

    function showLogin(message = '', options = {}) {
      const creating = options.create === true;
      ui.lock();
      ui.root().innerHTML = '<div class="bancada-login"><header class="bancada-login-brand">' +
        '<svg width="36" height="36" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="8" fill="currentColor"/><path d="M7 11.5h16M7 16h16M7 20.5h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="20.5" r="1.6" fill="var(--brown)"/></svg>' +
        '<div><strong>Bancada</strong><span>gestão de marcenaria</span></div></header><main class="bancada-login-center">' +
        '<form class="bancada-login-card" id="bancada-cloud-login"><h1>'+(creating?'Criar conta':'Entrar no Bancada')+'</h1>' +
        '<p class="bancada-login-intro">'+(creating?'Cadastre seu e-mail e defina sua senha.':'Acesse a sua marcenaria.')+'</p>' +
        '<div class="field"><label for="cloud-email">E-mail</label><input class="in" type="email" id="cloud-email" name="email" autocomplete="username" required></div>' +
        '<div class="field"><label for="cloud-password">Senha</label><div class="bancada-login-password"><input class="in" type="password" id="cloud-password" name="password" autocomplete="'+(creating?'new-password':'current-password')+'"'+(creating?' minlength="8" maxlength="128"':'')+' required>' +
        '<button class="bancada-login-toggle" type="button" aria-controls="cloud-password" aria-label="Mostrar senha">Mostrar</button></div></div>' +
        (creating?'<div class="field"><label for="cloud-confirm">Confirmar senha</label><input class="in" type="password" id="cloud-confirm" name="confirm" autocomplete="new-password" minlength="8" maxlength="128" required></div><p class="bancada-login-note">A conta começa com uma oficina vazia, só sua, com o catálogo de materiais pronto.</p>':'')+
        '<p class="bancada-login-status" role="status" aria-live="polite" id="cloud-message"></p><button class="btn btn-primary bancada-login-submit" type="submit">'+(creating?'Criar conta':'Entrar')+'</button>'+
        '<p class="bancada-login-footer">'+(creating?'Já tem conta? ':'Ainda não tem conta? ')+'<button type="button" class="bancada-login-switch">'+(creating?'Entrar':'Criar conta')+'</button></p></form></main></div>';
      const form = ui.root().querySelector('form');
      const feedback = form.querySelector('[role=status]');
      const button = form.querySelector('[type=submit]');
      const toggle = form.querySelector('.bancada-login-toggle');
      form.elements.email.value = options.email || '';
      form.querySelector('.bancada-login-switch').addEventListener('click', () => {
        if (!busy) showLogin('', { create: !creating, email: form.elements.email.value });
      });
      toggle.addEventListener('click', () => {
        const password = form.elements.password;
        const showing = password.type === 'password';
        password.type = showing ? 'text' : 'password';
        toggle.textContent = showing ? 'Ocultar' : 'Mostrar';
        toggle.setAttribute('aria-label', showing ? 'Ocultar senha' : 'Mostrar senha');
      });
      feedback.textContent = message;
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;
        if (creating && form.elements.password.value !== form.elements.confirm.value) {
          feedback.dataset.error = 'true';
          feedback.textContent = 'As senhas precisam ser iguais.';
          form.elements.confirm.focus();
          return;
        }
        busy = true;
        button.disabled = true;
        feedback.dataset.error = 'false';
        form.setAttribute('aria-busy', 'true');
        feedback.textContent = creating ? 'Criando sua conta…' : 'Verificando o acesso…';
        try {
          if (creating) {
            const created = await request('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + '/'), {
              method: 'POST',
              body: { email: form.elements.email.value.trim(), password: form.elements.password.value }
            });
            if (created?.access_token) {
              storeSession(sessionFrom(created));
              form.elements.password.value = '';
              form.elements.confirm.value = '';
              await openSession();
              return;
            }
            const email = form.elements.email.value;
            form.elements.password.value = '';
            form.elements.confirm.value = '';
            showLogin('Confira sua caixa de entrada e o spam para confirmar o cadastro. Se já tem conta, entre com sua senha.', { email });
            return;
          }
          storeSession(await tokenGrant('password', {
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
          }));
          form.elements.password.value = '';
          await openSession();
        } catch (error) {
          if (!creating) storeSession(null);
          feedback.dataset.error = 'true';
          feedback.textContent = creating ? signupError(error) : error.code === 'email_not_confirmed'
            ? 'Confirme seu e-mail pelo link recebido antes de entrar.' : error.status === 400 || error.status === 401
            ? 'Confira o e-mail e a senha.' : 'O Bancada não conseguiu conectar. Tente novamente.';
        } finally {
          busy = false;
          button.disabled = false;
          form.removeAttribute('aria-busy');
        }
      });
    }

    function signupError(error) {
      if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
        return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
      }
      if (error.code === 'email_address_not_authorized' || error.code === 'unexpected_failure' || error.status >= 500) {
        return 'O cadastro está indisponível agora. Tente de novo mais tarde.';
      }
      if (error.code === 'weak_password') return 'Escolha uma senha mais forte, com pelo menos 8 caracteres.';
      if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'Este e-mail já tem conta. Entre com sua senha.';
      if (error.code === 'signup_disabled') return 'O cadastro de contas novas está desligado.';
      return 'Não foi possível criar a conta. Confira o e-mail e a senha e tente novamente.';
    }

    // A primeira entrada cria a base vazia da conta; as seguintes só leem.
    async function openSession() {
      let row = await read();
      if (!row) {
        await request('/rest/v1/bancada_estado?on_conflict=usuario', {
          method: 'POST',
          token: await accessToken(),
          headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: { usuario: session.userId }
        });
        row = await read();
      }
      if (!row) throw new Error('Base não encontrada');
      ui.load(row.dados, session.email || 'Sua conta');
      revision = row.revisao;
      ui.status('ok');
    }

    async function start() {
      ui.root().innerHTML = '<p class="empty" role="status">Carregando o Bancada…</p>';
      const callback = new URLSearchParams(location.hash.replace(/^#/, ''));
      if (callback.has('access_token') || callback.has('error')) {
        history.replaceState(null, '', location.pathname + location.search + '#inicio');
        if (callback.has('error')) return showLogin('O link de confirmação expirou ou já foi usado. Tente entrar com sua senha.');
        try {
          const access = callback.get('access_token'), refresh = callback.get('refresh_token');
          if (!access || !refresh || callback.get('type') !== 'signup') throw new Error('Confirmação inválida');
          const user = await request('/auth/v1/user', { token: access });
          if (!user?.id || !user.email_confirmed_at) throw new Error('E-mail não confirmado');
          storeSession({
            access, refresh, userId: user.id,
            expires: Date.now() + Math.min(3600, Math.max(0, Number(callback.get('expires_in')) || 3600)) * 1000
          });
          await openSession();
        } catch (error) {
          storeSession(null);
          showLogin('Tente entrar com seu e-mail e senha para continuar.');
        }
        return;
      }
      try {
        const value = JSON.parse(localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey) || 'null');
        if (value?.refresh && value?.access && value?.userId) session = value;
      } catch {
        session = null;
      }
      if (!session) return showLogin();
      try {
        await openSession();
      } catch (error) {
        storeSession(null);
        showLogin(error.status === 401 ? 'Entre novamente para continuar.' : 'Não foi possível carregar a oficina. Tente novamente.');
      }
    }

    function enqueue(state) {
      if (revision === null || conflict) return false;
      pending = JSON.stringify(state);
      ui.status('saving');
      clearTimeout(timer);
      timer = setTimeout(flush, 300);
      return true;
    }

    async function send(snapshot) {
      return request('/rest/v1/bancada_estado?select=revisao&' + own() + '&revisao=eq.' + revision, {
        method: 'PATCH',
        token: await accessToken(),
        headers: { Prefer: 'return=representation' },
        body: { dados: JSON.parse(snapshot) }
      });
    }

    async function saveQueue() {
      while (pending && !conflict) {
        const snapshot = pending;
        try {
          const rows = await send(snapshot);
          if (!Array.isArray(rows) || rows.length !== 1 || rows[0].revisao !== revision + 1) {
            conflict = true;
            ui.status('conflict');
            return;
          }
          revision = rows[0].revisao;
          if (pending === snapshot) pending = null;
        } catch {
          ui.status('err');
          return;
        }
      }
      ui.status('ok');
    }

    async function flush() {
      clearTimeout(timer);
      if (!pending || conflict) return;
      if (!saving) saving = saveQueue().finally(() => { saving = null; });
      await saving;
    }

    async function refresh({ discard = false } = {}) {
      if (!session || saving || busy || revision === null) return;
      if (!discard && (pending || !ui.canReload())) return;
      busy = true;
      try {
        const row = await read();
        if (!row) {
          if (pending) ui.status('err');
          else {
            revision = null;
            storeSession(null);
            showLogin('Entre novamente para continuar.');
          }
          return;
        }
        if (!discard && (pending || !ui.canReload())) return;
        if (row.revisao !== revision || discard) ui.load(row.dados);
        revision = row.revisao;
        conflict = false;
        pending = null;
        ui.status('ok');
      } catch {
        ui.status(conflict ? 'conflict' : 'err');
      } finally {
        busy = false;
      }
    }

    async function signOut() {
      if (busy) return;
      if (pending) await flush();
      if (pending || !ui.canReload()) {
        ui.notify('Há alterações pendentes. Salve ou exporte um backup antes de sair.');
        return;
      }
      busy = true;
      try {
        await request('/auth/v1/logout?scope=local', { method: 'POST', token: await accessToken() });
      } catch {
        // Clean the browser session even if the server is temporarily unavailable.
      } finally {
        storeSession(null);
        revision = null;
        showLogin();
        busy = false;
      }
    }

    window.addEventListener('beforeunload', event => {
      if (!pending && (revision === null || ui.canReload())) return;
      event.preventDefault();
      event.returnValue = '';
    });
    window.addEventListener('focus', () => refresh());
    return { start, enqueue, flush, refresh, signOut, hasPending: () => pending !== null };
  };
})();
