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
        if (value) sessionStorage.setItem(sessionKey, JSON.stringify(value));
        else sessionStorage.removeItem(sessionKey);
      } catch {
        // The current sign-in still works when session storage is unavailable.
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
        throw error;
      }
      if (response.status === 204 || !response.headers.get('content-type')?.includes('application/json')) {
        return null;
      }
      return response.json();
    }

    async function tokenGrant(grant, body) {
      const data = await request('/auth/v1/token?grant_type=' + grant, { method: 'POST', body });
      if (!data?.access_token || !data.refresh_token || !data.user?.id) throw new Error('Sessão inválida');
      return {
        access: data.access_token,
        refresh: data.refresh_token,
        expires: Date.now() + Number(data.expires_in) * 1000,
        userId: data.user.id
      };
    }

    async function accessToken() {
      if (!session) throw new Error('Sessão encerrada');
      if (session.expires > Date.now() + 60000) return session.access;
      if (!refreshing) {
        refreshing = tokenGrant('refresh_token', { refresh_token: session.refresh }).then(next => {
          if (next.userId !== session.userId) throw new Error('Sessão inválida');
          storeSession(next);
          return next.access;
        }).finally(() => { refreshing = null; });
      }
      return refreshing;
    }

    async function read() {
      const rows = await request('/rest/v1/bancada_estado?select=revisao,dados&id=eq.1', {
        token: await accessToken()
      });
      if (!Array.isArray(rows) || rows.length !== 1) return null;
      if (!Number.isSafeInteger(rows[0].revisao) || rows[0].revisao < 0) throw new Error('Revisão inválida');
      return rows[0];
    }

    function showLogin(message = '') {
      ui.lock();
      ui.root().innerHTML = '<div class="bancada-login"><header class="bancada-login-brand">' +
        '<svg width="36" height="36" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="8" fill="currentColor"/><path d="M7 11.5h16M7 16h16M7 20.5h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="20.5" r="1.6" fill="var(--brown)"/></svg>' +
        '<div><strong>Bancada</strong><span>gestão de marcenaria</span></div></header><main class="bancada-login-center">' +
        '<form class="bancada-login-card" id="bancada-cloud-login"><h1>Entrar no Bancada</h1>' +
        '<p class="bancada-login-intro">Acesse a sua marcenaria.</p>' +
        '<div class="field"><label for="cloud-email">E-mail</label><input class="in" type="email" id="cloud-email" name="email" autocomplete="username" required></div>' +
        '<div class="field"><label for="cloud-password">Senha</label><div class="bancada-login-password"><input class="in" type="password" id="cloud-password" name="password" autocomplete="current-password" required>' +
        '<button class="bancada-login-toggle" type="button" aria-controls="cloud-password" aria-label="Mostrar senha">Mostrar</button></div></div>' +
        '<p class="bancada-login-status" role="status" aria-live="polite" id="cloud-message"></p><button class="btn btn-primary bancada-login-submit" type="submit">Entrar</button></form></main></div>';
      const form = ui.root().querySelector('form');
      const feedback = form.querySelector('[role=status]');
      const button = form.querySelector('[type=submit]');
      const toggle = form.querySelector('.bancada-login-toggle');
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
        busy = true;
        button.disabled = true;
        feedback.dataset.error = 'false';
        form.setAttribute('aria-busy', 'true');
        feedback.textContent = 'Verificando o acesso…';
        try {
          storeSession(await tokenGrant('password', {
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
          }));
          form.elements.password.value = '';
          await openSession();
        } catch (error) {
          storeSession(null);
          feedback.dataset.error = 'true';
          feedback.textContent = error.status === 400 || error.status === 401
            ? 'Confira o e-mail e a senha.' : error.status === 403
              ? 'Esta conta ainda não tem acesso à oficina.' : 'O Bancada não conseguiu conectar. Tente novamente.';
        } finally {
          busy = false;
          button.disabled = false;
          form.removeAttribute('aria-busy');
        }
      });
    }

    async function openSession() {
      const profile = await request('/rest/v1/rpc/bancada_entrar', {
        token: await accessToken(), method: 'POST', body: {}
      });
      if (!['master', 'operacao'].includes(profile)) throw new Error('Acesso inválido');
      const row = await read();
      if (!row) {
        storeSession(null);
        showLogin('Esta conta ainda não tem acesso à oficina.');
        return;
      }
      ui.load(row.dados, profile);
      revision = row.revisao;
      ui.status('ok');
    }

    async function start() {
      ui.root().innerHTML = '<p class="empty" role="status">Carregando o Bancada…</p>';
      try {
        const value = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
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
      return request('/rest/v1/bancada_estado?select=revisao&id=eq.1&revisao=eq.' + revision, {
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
            showLogin('Esta conta não tem acesso à oficina.');
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
