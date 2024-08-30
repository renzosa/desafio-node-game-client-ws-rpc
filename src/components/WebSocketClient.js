import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserIcon, KeyIcon, ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon, ShieldExclamationIcon } from '@heroicons/react/16/solid';
import languages from '../config/languages.json';

const WebSocketClient = () => {
  const { t, i18n } = useTranslation();
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [credit, setCredit] = useState(0.0);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket('ws://localhost:3000');

      websocket.onopen = () => {
        console.log('Conectado ao servidor');
        setIsConnected(true);
        setError(null);
      };

      websocket.onmessage = (message) => handleMessage(JSON.parse(message.data));

      websocket.onclose = () => {
        console.log('Conexão fechada');
        setIsConnected(false);
        setError(t('connectionClosed'));
        retryConnection();
      };

      websocket.onerror = (error) => {
        console.log('Erro:', error.message);
        setError(t('connectionClosed'));
        setIsConnected(false);
        retryConnection();
      };

      setWs(websocket);
    };

    const retryConnection = () => {
      setTimeout(() => {
        console.log('Tentando reconectar ao servidor...');
        connectWebSocket();
      }, 5000);
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleMessage = (response) => {
    if (response.id === 1) {
      if (response.result.success) {
        console.log(response.result);
        setToken(response.result.token);
        setName(response.result.data.name);
        setCredit(response.result.data.credit);
        sessionStorage.setItem('token', response.result.token);
        setLoginError(null);
        setActionMessage(null);
        console.log('Login bem-sucedido! Token:', response.result.token);
      } else {
        setLoginError(response.result.message);
      }
    } else if (response.id === 2) {
      if (response.result.success) {
        console.log(response.result);
        console.log('Ação bem-sucedida:', response.result.message);
        setActionMessage(response.result.message);
        setCredit(response.result.data.credit);
      } else if (response.result.message === "Not authenticated") {
        console.log('Sessão inválida:', response.result.message);
        sessionStorage.removeItem('token');
        setToken(null);
        setUsername('');
        setPassword('');
        setName('');
        setCredit('');
        setLoginError(t('sessionExpired'));
      } else {
        console.log('Erro na ação:', response.result.message);
        setActionMessage(response.result.message);
      }
    }
  };

  const handleLogin = () => {
    const loginRequest = {
      jsonrpc: '2.0',
      method: 'login',
      params: { username, password },
      id: 1,
    };
    ws.send(JSON.stringify(loginRequest));
  };

  const handleAction = (action) => {
    const actionRequest = {
      jsonrpc: '2.0',
      method: action === 'logout' ? 'logout' : 'action',
      params: { username, token, data: action },
      id: action === 'logout' ? 0 : 2,
    };
    ws.send(JSON.stringify(actionRequest));

    if (action === 'logout') {
      sessionStorage.removeItem('token');
      setToken(null);
      setUsername('');
      setPassword('');
    }
  };

  const invalidateToken = () => {
    sessionStorage.setItem('token', 'tokeninvalido');
    setToken('tokeninvalido');
    setActionMessage(t('tokenInvalidated'));
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    document.getElementById('html-root').lang = lang;
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const serverStatus = isConnected ? t('online') : t('offline');
  const statusClass = isConnected ? 'text-success' : 'text-danger';

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark" sticky="top">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">MyGame <small className="text-primary">{t('welcome')}</small></span>

          <div className="d-flex justify-content-between align-items-center">
            <span className="navbar-text">
              {t('serverStatus')}: <strong className={statusClass}>{serverStatus}</strong>
            </span>

            <div className="dropdown ms-2">
              <button
                className="btn btn-outline-light btn-sm dropdown-toggle"
                type="button"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                {currentLanguage.flag}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                {languages.map((lang) => (
                  <li key={lang.code}>
                    <a className="dropdown-item d-flex justify-content-between align-items-center"
                      onClick={() => changeLanguage(lang.code)} style={{ cursor: 'pointer' }}>
                      {lang.name}
                      <span className="badge bg-primary p-1 ms-5">{lang.flag}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {token && isConnected ? (
              <div className="ms-2">
                <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
                  <UserIcon className='icon-text' />
                </button>

                <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel">
                  <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="offcanvasNavbarLabel">{name}<br />
                      <small className="text-muted fs-6">R$ {credit.toFixed(2)}</small></h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                  </div>

                  <div className="offcanvas-body">
                    <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                      <li><a className="dropdown-item text-primary" onClick={invalidateToken} style={{ cursor: 'pointer' }} data-bs-dismiss="offcanvas">
                        <ShieldExclamationIcon className='icon-text' /> {t('invalidateToken')}</a>
                      </li>
                      <li><a className="dropdown-item text-danger" onClick={() => handleAction('logout')} style={{ cursor: 'pointer' }} data-bs-dismiss="offcanvas">
                        <ArrowRightStartOnRectangleIcon className='icon-text' /> {t('logout')}</a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>) : ("")}
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        {!token && isConnected ? (
          <div className="card p-4">
            <div className="mb-3">
              <label htmlFor="username" className="form-label"><UserIcon className="icon-text" /> {t('username')}</label>
              <input
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('enterUsername')}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label"><KeyIcon className="icon-text" /> {t('password')}</label>
              <input
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                type="password"
              />
            </div>
            <button
              onClick={handleLogin}
              className="btn btn-primary"
              disabled={!isConnected}
            >
              <ArrowRightEndOnRectangleIcon className='icon-text' /> {t('login')}
            </button>
            {loginError && <strong className="text-danger mt-3">{loginError}</strong>}
            {error && <strong className='alert-danger'>{error}</strong>}
          </div>
        ) : isConnected ? (
          <div className="card p-4">
            {actionMessage && <strong className={`alert ${actionMessage.includes('Erro') ? 'alert-danger' : 'alert-success'}`}>{actionMessage}</strong>}
            {error && <strong className='alert-danger'>{error}</strong>}
            <div className="d-flex gap-2 mb-3">
              <button className="btn btn-secondary" onClick={() => handleAction('request')}>{t('actions.request')}</button>
              <button className="btn btn-secondary" onClick={() => handleAction('pay')}>{t('actions.pay')}</button>
              <button className="btn btn-secondary" onClick={() => handleAction('skip')}>{t('actions.skip')}</button>
            </div>
          </div>
        ) : (t('serversOffline'))}
      </div>
    </div>
  );
};

export default WebSocketClient;
