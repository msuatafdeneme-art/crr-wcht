/**
 * WebChat - Modern Web Chat Widget
 * Kullanım: Sayfanıza script'i ekleyin ve WebChat.init() çağırın
 */

class WebChat {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'Web Chat',
      placeholder: config.placeholder || 'Mesajınızı yazın...',
      theme: config.theme || 'blue',
      position: config.position || 'bottom-right',
      botName: config.botName || 'Bot',
      userName: config.userName || 'Sen',
      ...config
    };
    
    this.isOpen = false;
    this.messages = [];
    this.container = null;
    this.customerData = null; // Kullanıcı verilerini tutmak için
    
    this.init();
  }

  init() {
    this.createStyles();
    this.createChatWidget();
    this.attachEventListeners();
  }

  createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
      }

      .cw-container {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      .cw-container.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .cw-container.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .cw-container.top-right {
        top: 20px;
        right: 20px;
      }

      .cw-container.top-left {
        top: 20px;
        left: 20px;
      }

      .cw-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
      }

      .cw-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }

      .cw-tooltip {
        position: absolute;
        right: 70px;
        top: 55%;
        transform: translateY(-50%);
        background: white;
        color: #333;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        opacity: 0.9;
        pointer-events: none;
        z-index: 10000;
      }

      .cw-tooltip::after {
        content: '';
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-left-color: white;
      }

      .cw-button img {
        width: 35px;
        height: 35px;
        display: block;
      }

      .cw-button .icon-chat {
        display: block;
      }

      /* Chat açıkken de normal ikonu göster, X'i gösterme */
      .cw-button.open .icon-chat {
        display: block;
      }

      .cw-button.open .icon-close {
        display: none;
      }

      .cw-button .icon-close {
        display: none;
      }

      .cw-button svg {
        width: 24px;
        height: 24px;
        fill: white;
      }

      .cw-notification {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .cw-window {
        position: absolute;
        width: 380px;
        height: 550px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .cw-window.open {
        display: flex;
        animation: slideUp 0.3s ease;
      }

      .cw-container.bottom-right .cw-window,
      .cw-container.bottom-left .cw-window {
        bottom: 80px;
      }

      .cw-container.top-right .cw-window,
      .cw-container.top-left .cw-window {
        top: 80px;
      }

      .cw-container.bottom-right .cw-window,
      .cw-container.top-right .cw-window {
        right: 0;
      }

      .cw-container.bottom-left .cw-window,
      .cw-container.top-left .cw-window {
        left: 0;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideDown {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }

      .cw-window.closing {
        animation: slideDown 0.3s ease forwards;
      }
 
      .cw-header {
        background: linear-gradient(135deg, #AD4E31 0%, #AD4E31 100%);
        color: white;
        padding: 20px;
        height: 12%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
      }

      .cw-header-logo {
        max-width: 150px;
        max-height: 60px;
        object-fit: contain;
        margin: 8px auto 0 auto;
        align-self: center;
      }

      .cw-header-text {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
        color: rgba(255, 255, 255, 0.9);
        max-width: 260px;
        margin: 0;
        text-align: left;
        width: 100%;
        align-self: flex-start;
      }

      .cw-close-btn {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        border-radius: 3px;
        transition: background-color 0.3s ease;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cw-close-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .cw-close-btn svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      .cw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cw-messages::-webkit-scrollbar {
        width: 6px;
      }

      .cw-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .cw-messages::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
      }

      .cw-message {
        display: flex;
        gap: 10px;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .cw-message.user {
        flex-direction: row-reverse;
      }

      .cw-message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .cw-message.bot .cw-message-avatar {
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        color: white;
      }

      .cw-message.user .cw-message-avatar {
        background: #48bb78;
        color: white;
      }

      .cw-message-content {
        max-width: 70%;
      }

      .cw-message-bubble {
        padding: 12px 16px;
        border-radius: 16px;
        word-wrap: break-word;
        line-height: 1.5;
      }

      .cw-message.bot .cw-message-bubble {
        background: white;
        color: #2d3748;
        border-bottom-left-radius: 4px;
      }

      .cw-message.user .cw-message-bubble {
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .cw-message-time {
        font-size: 11px;
        color: #a0aec0;
        margin-top: 4px;
        padding: 0 4px;
      }

      .cw-typing {
        display: flex;
        gap: 10px;
        animation: fadeIn 0.3s ease;
      }

      .cw-typing .cw-message-avatar {
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        color: white;
      }

      .cw-typing-bubble {
        background: white;
        padding: 12px 16px;
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        display: flex;
        gap: 4px;
      }

      .cw-typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #a0aec0;
        animation: typing 1.4s infinite;
      }

      .cw-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .cw-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-10px);
        }
      }

      .cw-input-container {
        padding: 20px;
        background: white;
        border-top: 1px solid #e2e8f0;
      }

      .cw-input-wrapper {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .cw-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .cw-input:focus {
        border-color: #AD4E31;
      }

      .cw-send-button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .cw-send-button:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(173, 78, 49, 0.4);
      }

      .cw-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .cw-send-button svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      .cw-welcome {
        text-align: center;
        padding: 40px 20px;
        color: #718096;
      }

      .cw-welcome-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .cw-welcome-icon svg {
        width: 40px;
        height: 40px;
        fill: white;
      }

      .cw-welcome h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        color: #2d3748;
      }

      .cw-welcome p {
        margin: 0;
        font-size: 14px;
      }

      /* Form Styles */
      .cw-form-container {
        padding: 12px 20px 20px 20px;
        height: 100%;
        overflow-y: auto;
        background:rgb(255, 255, 255);
      }

      .cw-form-welcome {
        font-size: 16px;
        font-weight: 700;
        color: #AD4E31;
        margin-bottom: 8px;
        text-align: left;
      }

      .cw-form-intro {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.3;
        color: #333;
        margin-bottom: 16px;
        text-align: left;
      }

      .cw-contact-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .cw-form-group {
        position: relative;
        margin-bottom: 12px;
      }

      .cw-form-group label {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        font-weight: 400;
        color: rgba(173, 78, 49, 0.6);
        pointer-events: none;
        transition: all 0.3s ease;
        background: white;
        padding: 0 4px;
        z-index: 1;
      }

      .cw-form-group input,
      .cw-form-group select,
      .cw-country-code {
        width: 100%;
        padding: 16px 12px 8px 12px;
         border: 2px solid rgba(173, 78, 49, 0.3);
        border-radius: 8px;
        font-size: 14px;
        background: #FEFEFE;
        transition: all 0.3s ease;
        position: relative;
      }

      .cw-form-group input:focus,
      .cw-form-group select:focus,
      .cw-country-code:focus,
      .cw-form-group input:not(:placeholder-shown),
      .cw-form-group select:not(:placeholder-shown) {
        outline: none;
        border-color: #AD4E31;
      }

      .cw-form-group input:focus + label,
      .cw-form-group input:not(:placeholder-shown) + label,
      .cw-form-group select:focus + label,
      .cw-form-group select:not(:placeholder-shown) + label,
      .cw-form-group.has-value label {
        top: 0;
        font-size: 12px;
        color: #AD4E31;
        font-weight: 500;
      }

      .cw-phone-group {
        display: flex;
        gap: 10px;
        align-items: stretch;
      }

      .cw-phone-input-wrapper {
        position: relative;
        flex: 1;
      }

      .cw-phone-input-wrapper input {
        width: 100%;
      }

      .cw-phone-input-wrapper label {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        font-weight: 400;
        color: rgba(173, 78, 49, 0.6);
        pointer-events: none;
        transition: all 0.3s ease;
        background: white;
        padding: 0 4px;
        z-index: 1;
      }

      .cw-phone-input-wrapper input:focus + label,
      .cw-phone-input-wrapper input:not(:placeholder-shown) + label {
        top: 0;
        font-size: 12px;
        color: #AD4E31;
        font-weight: 500;
      }

      .cw-country-code {
        width: 60px !important;
        min-width: 60px;
        max-width: 60px;
        flex-shrink: 0;
        padding: 16px 2px 8px 2px !important;
        font-size: 12px !important;
        font-family: Arial, sans-serif;
        text-align: center;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 4px center;
        background-size: 12px;
        padding-right: 20px !important;
      }

      .cw-phone-input {
        flex: 1;
      }

      .cw-permissions-section {
        margin-top: 2px;
      }

      .cw-checkbox-group {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
      }

      .cw-checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        line-height: 1.4;
        cursor: pointer;
        margin-bottom: 0 !important;
      }

      .cw-checkbox-label span {
        color: #AD4E31;
        text-decoration: underline;
      }

      .cw-permission-link {
        cursor: pointer;
        transition: color 0.3s ease;
      }

      .cw-permission-link:hover {
        color: #8B3A26;
      }

      .cw-checkbox-label input[type="checkbox"] {
        margin: 0;
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .cw-submit-btn {
        background: linear-gradient(135deg, #AD4E31, #C85A3C);
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 16px;
      }

      .cw-submit-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #8B3A26, #A64832);
        transform: translateY(-1px);
      }

      .cw-submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .cw-submit-btn:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: none;
      }

      .cw-error-message {
        color: #dc2626;
        font-size: 12px;
        margin-top: 2px;
        margin-bottom: -8px;
        padding-left: 4px;
      }

      .cw-warning-message {
        color: #f59e0b;
        font-size: 12px;
        margin-top: 2px;
        margin-bottom: -8px;
        padding-left: 4px;
      }

      /* Loading Page Styles */
      .cw-loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      }

      .cw-loading-content {
        text-align: center;
        max-width: 320px;
        width: 100%;
      }

      .cw-loading-spinner-container {
        margin-bottom: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }

      .cw-loading-spinner {
        width: 50px;
        height: 50px;
        border: 3px solid rgba(173, 78, 49, 0.1);
        border-top: 3px solid #AD4E31;
        border-radius: 50%;
        animation: spin 1.2s linear infinite;
      }

      .cw-loading-dots {
        display: flex;
        gap: 8px;
        justify-content: center;
      }

      .cw-dot {
        width: 8px;
        height: 8px;
        background: #AD4E31;
        border-radius: 50%;
        animation: bounce 1.4s ease-in-out infinite both;
      }

      .cw-dot:nth-child(1) { animation-delay: -0.32s; }
      .cw-dot:nth-child(2) { animation-delay: -0.16s; }
      .cw-dot:nth-child(3) { animation-delay: 0s; }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes bounce {
        0%, 80%, 100% {
          transform: scale(0);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .cw-loading-content h3 {
        color: #AD4E31;
        font-size: 20px;
        margin: 0 0 12px 0;
        font-weight: 600;
        letter-spacing: -0.5px;
      }

      .cw-loading-content p {
        color: #666;
        font-size: 14px;
        margin: 0 0 30px 0;
        line-height: 1.6;
      }

      .cw-loading-steps {
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: left;
      }

      .cw-step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid #e0e0e0;
        transition: all 0.3s ease;
      }

      .cw-step.active {
        background: rgba(173, 78, 49, 0.05);
        border-left-color: #AD4E31;
      }

      .cw-step.loading {
        background: rgba(173, 78, 49, 0.08);
        border-left-color: #C85A3C;
        animation: pulse 2s ease-in-out infinite;
      }

      .cw-step-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: #AD4E31;
      }

      .cw-step.active .cw-step-icon {
        background: #AD4E31;
        color: white;
        border-radius: 50%;
      }

      .cw-mini-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(173, 78, 49, 0.2);
        border-top: 2px solid #AD4E31;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .cw-step span {
        font-size: 13px;
        color: #555;
        font-weight: 500;
      }

      .cw-step.active span {
        color: #AD4E31;
        font-weight: 600;
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.02);
          opacity: 0.95;
        }
      }

      @media (max-width: 480px) {
        .cw-window {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          top: 0 !important;
        }

        .cw-container {
          bottom: 20px !important;
          right: 20px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  createChatWidget() {
    const container = document.createElement('div');
    container.className = `cw-container ${this.config.position}`;
    // Base64 icon - BURAYA BASE64 STRİNGİNİ YAPIŞTIR
     
    const iconBase64 = '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UvKhHA6E9drkmyZUblxRnBgKjTV1HSoBmP9bULl5fyg0hn177GD37u0LW7bwtfYkxk9H8qJ3Ebbj90PmMMPnF5oVHI6Klsi0U+VG5CiGisE1IdG2Z6To62aw98Hw2vHcMcsvQqWAYyglMVpb/UhR9l/LtCvCK9um6tEw9NODZfwktmN7KBSRqaUGxSIiIjJT9ORG5Cjmvf/FMG3qy4peaf7Io23b8LQmz/OfRpiPCD6G7ThruHdPGDNpfvNy1+LWELYjDDaJbTh70l8fisihU+VG5CiGSsFSTH4SF+0zYtpEPRwOin5/G9POuaTDVKDy0UdcHtJNc17sTdgE5ssBJ3+GaWzHVzgVERGRKYdKzsmI2xChI7iN8k3D+VwcZz8RWN4TYtxgsQ0U5/OmuAgRERE5kuBCfhpiZwhUTtajrkZDBuZxKbLJh3V4JFj2CYh/bEajlnGo8G8ZuxjIvglh30JZRJJSg2IRERGZKWpzIyIP8d4/OSb/vNq/ela5uBieWuT5978PqkfD1jf+/nJ+/t3MO+f+OPzgMMF2HIvJbzFdDVYvyDP3+HJh8VHPd63vuooZre5re4ubbsL6czBUbsc/hx+IyBFFlRsR+X/att2EeEWbtaHvmHpl39asV25BraEMvxB+pRlmbX43M6g4XJcXBbv7/3fmMT3sHcthBcP5DdOnYPIqX9cvYb5eWzkla7P4RlXb+jbf25ubD6OvlwsLn8LvfxqVmu+GH4vIEUmVGxH5gXDBfzziSUhu7koydtl7Hyox32YG092cHgmwHcuIrnKzuuqzpaXdqMyETvpEREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREDoMs+18pj9dSF3s3vQAAAABJRU5ErkJggg==';
    

    const headerLogoBase64 = '  iVBORw0KGgoAAAANSUhEUgAAAhsAAADBCAYAAABmHXLdAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYcAAB2HAY/l8WUAACq7SURBVHhe7d2JexRVvj7w3790Z+bO5ixeZ7k641xcYRBEEQVxAwVEFBdckEVlUdkEQRQVlewJZCGQfQOykIWQhIQkhCUQEkjIQuD86j1UO53kVHdVV510V/r9Ps/nmZHuWrrT3fXWqXNO/b8D//dfgoiIiEgXhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYICIiIq0YNoiIiEgrhg0iIiLSimGDiIiItGLYIPKxlJl/Emmz71E+FgsSHvil3L/k6XcpHyei+MCwQeRjl6rLBSrjqfuUj0db8QcvC3H7tmhJ/0EcmPYL5XOmEoSr/JXzxck9G6XcpY8rn0cUbxg2yPcSHvxvcfjlmaL8o9dF/bfbRMvBH0VbTorUmpUo/61y64ei8J3nxcGn/6lch18FwkZncY5InvEH5XOiJf3Jv4tr7S1y/+IlbLQfzTBe7W35mgNV/90O47X/Uvn8SKTN+asoem+RqNy+Rn628RkPfN6bkveJum+2iGMb35KhJ/Wxu5XrIJpsDBvkO5kLpomqHWuNH9dkcbXllBgdGTZ/1u3V6PCQuNrcIJfHD3bOohlaD4QdhZnmlu1XS/p+Y9nw+xQIG7Fe48NG/b6tssXDTWW9+OiY98KpS1Vl5pqcVbpxsFetr8r4LIlbt8xn/aduG/9WsmaZ8ZzIPmMHn/6HEZZXG4HysLhx+aK5Vvt1o/uCOF9RYISe7bKlKf2Jvym3Q6QTwwb5Qtqcv4iTX20Wfe1nzJ9Qb2v4Wq+4cLxIbiNz4QPKfYhU6dplorMo29xS6MKBCWfHRateVK5rPL+GjbzXn5Yh7ObgDfMZ9qu39bQ49eMukfr4X8a8F05VbHxTnD2SJt9zO3WlsUY07N8hkqb/fsK6cPlk8OoV85kTa+BSl0h8+DcTlrOSMvOP4uSeTUaYbrC9f06qp6lO1H6zRWQ+96By+0ReY9igmJb1/MOymdhp64Xb6m1tFNU7PxKps+40Q6P1I3/lggn758RFG2fSDT/sVC5rxa9hIyDp0d+JU8ZrHn/pIVQlGwfi8etx42Jliblm62owws2BB36lXB4yn50WNhSUrl9uPDdM64bxHlVuWS2Ge3vMpfQXQlTltjUTLjHi8mTwfxO5wbBBMengM/fLpt9oF0LOxeoy46z1smz9SDQOjqr9tcPO5ZRjG99WLmvF72Ej4HTiXuNZ9gJHc+r3IdflRMnqJcpLH8F1JivBCBqh+1zg0kS4sNGSYbwHIdaDYHvxRLH57OjU9a52ebmmu+6EbI1J4igi8gjDBsUcdPS8eWPA/PmLnTr+2bvK/bWLYcM6ICQ+9GtxtbnefHb4Knp3kXI9TiAgDPVcNteoLvTtSXzkt8rlx7tcV2kupa62w6mWYSNz4YPieker+czYqLYj6WFDFpFdDBsUO4yD0Z0z3NgrHNTdjihg2AjdGpH13ENi1GbIxFl38r9dXE4x9iVcK8LIQL/IfP4h9fIKh+b/S/S1NZtLT6zTSV8rD95Hls0RoxH0XdFZo0OD4uC8qTVyi6KLYYNiRs3uDeZPnfMauHRenMk8IE5s+UB2PgwoeOtZUbV9rex0OdjTbT7beR1Z9oRyn51g2Ah/6QMdP+2OUjm5d7Otdaqg9Szc5ZOi9xcrlw0F/RyK3n1J1O79VA7Bvj06aq5NiNJ1rxrPmbi/PQ5adFC3bo7IS3uNCV/J1rbgzzuGd+Pzjm1fPXPKXMJ5tWYns1WDPMWwQTHhxJb35Y+o3cL1cfxI137zuch+abpynSoYRojRIeh0OtRrPXoguJx22rSiM2z0nW2WQQuvzYnjm1eFPbiPDFyXB0rV8qHUfPmJGLx6J+DZDRuYK6T/fIdcJlyhD03GvH8o1xNKymN/FgMXOs21qKs1O8mTg22fOc8ILgtihMn4x0vWhO8zEiiMlir7aIWj+VTQDwT9Ulqzjc97n71Op7eMgJTz0gzl+ogixbBBUYeDpJPCMFI0uavW5QSGK2KI6fljheaaJ1ZXeZ5y2UjoDBsHn4msyRtTiYcLG0O9PUZQiOzAi9DhdAbRo8vnilvDQ+bWQxcOwE73rbMgy1xaXegk6eoSjQmhBnO6oKzCy5XGk/LxUIXOyflvPjthWafQ6lLw1kLRlp1sBPub5ton1hkjiLNVg7zGsEFRJa/TDw2aP3OhCz+6BW8/p1yPW7hujgNXcOGM3stpwHWEDbTUYHiw6jE7dIcNdPzE/jmdSAoh8NaIvcCBYZt2J8w68fl7aBYzl5xYOKvPfdX9JTNo/OlLuS18vg/Nv3/C45icLtwIFjyOz+b4Zd3Cti/I0V5j//aY9yRj7r3KZYjcYNigqLpYVWr+zIUuzBSK6a9V6/ASLssECi0uqudESkfYcEt32HADl2HC7RsKB3M7k1Mh9ITrgFr37TbbLTChlKx+Rdw2Ww+qdq5XrvPEZ0bwCRM2zpUc0drKgL4lwftQ//0OtmqQFgwbFDVopbBT18+dlU3SqnV4DU3NOHhhngGvD7AMGw4ZB+iLlfbmneg5XSsSQszQmTzjLtHb0mA+W12XG6pFwkPuJrLCJGX13237uVUm1BwdgZaPUNVRkKn94N9ZmC0/A/iexdr9dWjqYNigqGnPP2T+pIYu9LJXLa9LV9lRLU3XDBvOYf6JQAtBuGpO22+5n+eKD5vPsq7DS2Yrl7ULt/u/Ul9lrk2I7trj4kCIWThbUr8L+96jY2niw/bm+YhU6ZqlsnUjb8U85eNEXmDYoKjAREl2Ju46ZZz9qZbXCR1HVf/uFsNGZOTcK2H2MVCF702c7CtcPw1Ua1aSq9dYs+tjMRR0b5SOwmyRMit0a1xzyj5br6vReP06WzdSjc8AbiIXzb8xTX0MGxQVuPtkuELTuGpZv2LYiIycXbTJ3lwUg1e6Rerj9/y8rJ1+GvicuR190td6Wg7dbj96UBx+ZZbyOePV7t0UNgQFqqs8Xxx59Unleoj8gGGDouLMwZ/Mn1HrKv/kDeWyfsWwETkns4t2FGbJlgC0noXrp4H5Sby4sVvhqhdlC4HqMSslH9qfYyNQuMV8R36m7NhZ/slKOZQ1+4VH5F2RdbXIEXmBYYOiAqNLQhXOEpOn2E2gGDbcwcRvdi+nlKxZJprT94d8Pm6yl/PyTOW2JgMm3BodsT+RnZ3Cpckb3RdkiEIn53MluTLY1379qajYsFK2jiCYqPaHSCeGDYqKwGRHVoWRAarl/Ixhw72u0lxzr0LXcP818/9ZV82ejcbrcj/M1Y3zZXnm3kxuIZBgCn+0jiRP5wgU0o9hgyYdzujClZxxUbGsnzFsuIdLFdfO3pkC3E1dqqkQBx78lXIbkyn3ldm2R9voKkzkhdvfZz4X+eRwROEwbNCkQ6e9cOXV/UhiCcOGNzBr6s2BfnPvIqusFx9Vrjsa2nPTjD2yd3lId1Xv3sBJvUgLhg2adHbCRj1mclQs62cMG96p3rk+7H5bVXP69zH1etDSd6mqzNy76FfDj7sYOMhzDBs06eyEDdxqXLWsnzFseGjaL8SFE2PvZWOn+trPiMTpv1evM8ow14XdETe66+TeTxk4yFMMGzTpcI+TcNWWm6pc1s8YNryFm7sN9Vw29zJ8YYRTNEef2IFLRK2ZCWJ08Ia519Ep3maevMawQZMO9x8Jd7dLDI1VLetnDBveK35/sbH/9uaqiIXRJ3alzPyjqNj4pmjNShS9bU3y4D/Z1Vmcw7k7yDMMGxQV17vazZ80dSGMOJ0kKdYxbOjRaeN9vXQyNkafRAoTlB1ePFOUrl0manZvkFO4t2YnGp+pLDmyBrOgYm4NTPo1YmPYr51CS1DqJN0AkaY+hg2KCvxIhqvKrR8ql/Urhg09WtK+N/Yy9Gtoy0mN6degA+7gemj+v0T+G/PFiS0fGO9Bsryzq5MqfOc5Y13+aA2i2MawQVFRvetj8+fMuq5E+d4oiSFuWR4Jhg09GDacKf5gse2hw5Xb1/J9I08wbFBU5C6Zbf6cha6KT1Yql9etZPUSOctiymN3Kx+PBMOGHgwbzuUufVzcHBo03x3rqvtuG0elkCcYNihqMAwxXKHvBpqBVcvrVPjO89i6pzOZMmzoMVXCRsnql+WlD9VjOmDUS7jOtfXf72DYIE8wbFDU4DqynRrquyoOLZimXIcW034hb2CFQtgp/+h19fMcYtjQYyqEDTkr6o0Bea+SyRoxU/vVprB3nT359WcMG+QJhg2KmsSHfi0GLnWZP2uhC73scelFtR4v4cwSt/AOLvTKP/zyLOXznWDY0MP3YcMIF5eq78wgig6caXP+qn6ex+Q06WH+9uUfrZi08ENTG8MGRRX6Rtit0aFBUbUDHda8//HDBFG1ez+VoUZVPU11IuEBd0MnGTb08HvYKFr14pgWBgTwglUvKJ/rFfTZCHfnZdTBZ+5XLk/kFMMGRR3mCXBSF44XiZSZf1KuyylMMHbyq03yzpfhCnMcqNZhF8OGHn4PGx35h4w9nLj/LYd+EimzvOugHIBLNoM93eZWrOtaR6vrgE0UwLBBUYd7pQz1XjF/4uzV8LVeObsiZpDEhEeq9VrBpRIsdybzgKPtYtKkhAd/rVynHQwbevg5bGDiOvTVsCq0PnQUZouSD5c6/pyPl7N4pmg8sFsM9/WYaw9dtd9uZX8N8gzDBsUE3C8FB/NIanRkWLaOnE76WlRuXyNbIDCaJH/lAvn/0RG1MWGP6CrPE/3nO2Snz0jr5J5Nyv23g2FDDz+HjXrjgB5uREig0Pp2vqJAfgYxQivjqXstpxNHy1/2S9Nl5+am1G/F9XNt5lrsVf/Fc5M6MoamPoYNihm41Tb6RsRiIaDgHhUINKp9t4NhQw+/ho2kR38nBh3cSE5VuGcK5oNBUA9MV47w7aaw/NHlTyr3mShSDBsUU/ADPH40SDQLB1q0imDaZ9X+OsGwoYdfw8aJz98PO/R0sgutJ8UfLjHeK45AIW8xbFBMKv/kDdkvI1qFAyxueIXwo9q/SDBs6OHXsHGt886ljWjc0VVVPc31InfZHOW+ErnFsEExK+WxP8uRImgmnqzCrKY443TbGU/lXMlhcyvWVbV9nXJZXTDkN2zY6Lsa22Ejfb+xl6Ffw9nc9Jh7DehThLlj8FkreGuhaMtNEaMj4Yejel24A3PJulfZmkFaMWxQzMPwVFzKwORauqq79rjsVKravhfQmW+k/7q5NevCD3+aEQBU69Dh+Gfvhg0bqCPL5yqXjza0PPXbuJMpbrue8fQ/lOuIJVkLHxTdDoeCR1r4Pp06sEckeHzDQSIVhg3yjYy598pLG1caazxpekYrBkKM7plJm5K/cdRpD8Md6/ZtUa7LS+Ufv2EccG6aWw1dODBVfTG5rS7hoB/NcK+9YZwo/A0qt60xlo39M/gjrz4pmlL2id7W055eZsFnCyO3qnd+LNLn/q9y20Q6MGyQL+ESS/7K+cYBcL2cb6O77oQcrqeanAtntb2tjaKz+LA49dOXomz9ayJj3n3K9epwfPMq2dTvRNm65cp1eSlvxTzltq1gpkvVeqIFl4DQX0O1r1Zi7TXYgSGoBW89K05+tVm05STLzzpawNCXRhVE8B3ApF1Xz5ySQ2UxguqY8RnMfuGRmL4cRlMbwwYRERFpxbBBREREWjFsEBERkVYMG0RERKQVwwYRERFpxbBBREREWjFsEBERkVYMG0RERKQVwwYRERFpxbBBREREWjFsEBERkVYMG0RERKQVwwYRERFpxbBBREREWjFsEBERkVYMG0RERKQVwwYRERFpxbARJOnR34ms5x/2TMa8++Q6VdvSIfPZacr90CV19j3K/fBC6qy7Rf4b80X5R6+Lyu1rRP2326STX20WJ7Z8IIrfXyxyl8wWKY/9Wbm81xIf+rXyPQC3+5C58AHleiOR/sTfxIFpv1Bux2tef1/COTT/X8r9sCvU39DL9wzfC9U2Dj79D+XzdcI281cuEOUfvyEqt374s+ObV8nv0OGXHxPJ0+9SLus11XuiU8IDv1Tuh1tYL9aP9w/vZe03n//8+1T9xXpRsWGlfM8z5t6rXD5eMWwEyXv9aaGjRvqviSuna0VTyrfyAKrrYDBw8Zy5xckpfLlU+xGp7BceEY0Je8T1c2fNLdirfuN1nz2SJoNJysw/KtftFn5cxO3b5hbHFn5wVMvYNXT1irkmb+rWzRHR29Ykzhz8SZSte01bIJPfF4v3REf1nW0WB1wcQOTf8NYtc21jqzU72Vj3r5TLOVW/b4vxvkzczqWTFa72347sl6bL7+WlmgoxfK3X3HL4wnfofEWBqP9uu8hb8bRIePC/let349boqLm1yamMJ/6u3I9IIMTX7tkkLlaVipGBa+YWwtdQ31VxobJUNPywS+Qum2Osa3JOBGIRw0YQXWFjfOFAUPD2c8p9cMOvYQNnCAhjXtTo0KBozzsoit5bJM9kVduLhJ/CxvjCe9KSvl+kzfmLcvuRmkphA9Wc8YMnYWDSw4Zx8lK6dqnoaawxt+S+ho0TpNbsJHFk+VPqbUbAj2EjecYfjJPEffI75EVd72oXJ7/+TKQ+rq9VOFYxbASZrLARqPb8Q/LDrNqXSPgtbODsCT9oumrwSreo2b3Bk0tZfg4bgcKZbsmaZcp9iMRUCxuoxsSvjIO3u0AwmWEDrYGX6yrNLegptJIUrnrR2J67s3K/hY2cRTNE/4UOc23e1s3BG8Znba84OP9+5banIoaNIJMdNlDnSnKV+xIJX4UN42yssyjHXJPeQuhIevT36v2waSqEjUDV7N6o3A+npmLYQLkNHJMRNhCgG/bvEKPD3pxxh6vL9VUi8eHfKPfFLj+FDVyOGpyk72XD/i+09S+JJQwbQUKFje7a47Ip2g6creP658ClLnPp0FX4zvPK/XHKKmyg6U61n24VybMd9b6EU7Vjrbl36kIzbmfxYVH//Q5xbNPboui9l+TfB/+L/z714y75HuOaaLhqQfO4Yh+ciEbYcPJ3w6UjXE++cfmiuXToOp30tesz+FBhAyFatZ9u1H3zuQypqn2xw27YQLkJHLrDBoLGpaoyc62hC5+h1qxEUfPlJ6Js/WuidO0y2bcJHa078jNlEA9XeE7a4+4vwVmFjZ7Ttcq/t1vJ/46s/xbe3772M+beqQuXwpvTv5ff/eIPXpbfBcD7i/e6LSdZ9HeFbxVB/6qcF6cr92OqYdgIEipsRHpAOfraU+LKqdDXUvFjoFrWKauw0VGYpXx+1Bg/4oM91j9yZ3PTRPIMez3kcSnmxJb3ZTixqoNP/1O5rBPRCBvy7xbBwRUjDC4cLzTXYl2l615VLm9XqLCRh47QimWiyUnYQFXv/Dii91932GhO/U65/uDqaaoTBTZPYoo/WCz6Wk+bS06smq82ebLfVmEDJxRetfh4ofHAHsvPCU5uSj5cajuI4kQSrULGH+zOCsYVTprioVUDGDaC6AgbAbjkYFWyeVixjFN+CRuh3uem5H3KZcLBiAs0R+JaaHB1FmUrn++Un8JGAM6ybly+YK5tYuFzl/Bg5CMwpnrYQNXsMQ60Dv8GOsPGkVefFKMjI+YaJ1b/+U5R+K7z/hU44OHv2ZadJM+2AzV49bJImenNaCY/hA2MZhuyGMVzsbpMpM76H+Vy4eStmGf8/Y+N+b70n+8QKRG2vvgRw0YQnWEDP1hoelMVvtzKZRzyS9hAKLCqxEd+q1zGroyn7pNN+KjRkWFxaP7/KZ/nlB/DBqTM/JO4XHfCXOPEwvwLquXsiIewgXIaOHSFDQSCvvYWc20TCx05U2a5Dwbor3ClAWfjQlRsfsd47d4EAT+EjcK3FxofEfV+Fqx0P21B6RrjBKD7zglA+cevx1SLjm4MG0G0hg0D5j2wKi9GpfglbLQfzTD3bGJ5NScEepJjch3VY5Hwa9gATIY1OjxkrnVsoS9SpNuIl7CBqnJwSUVX2KjY8Kbl/l9uqBZJNi892oHLk9U71ooDLlq+xvND2Kj8/APjT6d+j4vQYuRB8MJvfdW2NXEVNIBhI4jusBFqmKfq+U75JWxgAi6rastNjclrmH4OG2AV8PDDmjo7wqbhKRQ2avZstHwtKLxPxz5911hP+L+HrrBxpfGkuaaxhUuHhxZ404Knk9/DBt5/tJyqlqPwGDaC6AwbmGDKaqQARq2olnHKL2Hj1E+7zT1T17XOVnFyzyZ5fTr1sbuV65hsfg8b6L9htf+Rzr0xlcIGAm7t3s3KkBAou4FDR9jArQ9uWzTvNyZ944uzZD+EjeL3XrJ8n1G45N1RmC3KPlohL9HGS+dOLzBsBNEVNnCvhHOlR8w1TSy0eKiWc8oqbFxtbpD7bxeGlqrW7xUMFXNS6HuB6ZTRwx7DO3EQxnDWhh92ymFm6B2O68w6plgO8HvYwD0yrPa/bt9W5TLhhAobTcnfTvhchYIOdKpteClc2MBzGg98afmaUHYCh46wUb5+heW+5xiffdUyscYqbJw/Vigqt61Rfi5UMITXq34k42Facvze2C28JpxE9rY2yj4zXeV5suUWQ8tP7tko+0RhRGL6k95Nne5XDBtBvA4bGU/da5zFf2l5vTxQd2bnU6/DCauw4bSGenuU6/cKhrUG93j3qtCc3JqdKLJffFS5XTf8Hjbw42y1/y0Hf4xoO6HChtNqSf/Bu9dqwU7YgPNleea/qguBIw+dBYPWHUxH2JCj2RT7js98gkf3dNHNKmw4LYyiSvSwL8l48sQwRAtXpHWto1VU7fpYJHowo7EfMWwECRU2cHMwJNdwuutOyC+DnclyUBiD7dWPrF/CBjSn7ze35n3hYIC5Tco/iXykxXi+DxuGket95prHVqTbmaphA2e3140DQ6jCCUTxh0vGrD9AR9hoSfte+V5fbTnlm6Z8v4SNzAXTLIe/elH4fa37bptImu5uVmO/YdgIEips6CiMBPCyec1PYQOz9F2u13tPB1RX2VG5LdU+ODEVwobX25mqYQPwvbwiJ2OyLrTOqQKHjrDRkX/IWMPE9xonOAwb3it653ntU8HjdeDeNqrtT0UMG0EmK2zgYH5s8yrlPrjhp7ABCAHNxhmbVz9CVoV7sKi27wTDxkRTOWxI034pzhUfNp+hLlXg0BE22o+kK99rBHaGDT1yl862nBvJq0ILmRfzd/gBw0YQnWED11YvHC8Sxz9715MzbRWrsDHQfUEeUOzyavp0uzAPRO3eT2VLj46+HCi3t/SfCmHD6jbZGBbrddjAGff4z1UoxzWE7/Echw0DOh2HCxx4X4P7cOgIG01J3yjXicu1fu+zgfCg+kxYkff1maSAhc9F6Zol4pxxwjIS4pYIbgqBJlFj5/ZYwbARJFTYwE2/0EnLSrg+CAVvPavcppeswga+oKrnxyLMIJq79HE5IVft15/K+0DgpkaYdhwHsCuNNfLHCdMoW42HVxVuOqXanl1+Dxups+623P/GhD3Gc7wNG34c+qpaBjBsPdyNz3AyEQgcOsKGvHGhxb77YY4NsAobsTT0NRR8RnBihBtQVm5fI+9rcibzgPyeYpQcfp8wKgXTkI8MXDdfnb3Ke+2pKd+6wbARJFTYsHNAQcuFVaEnsq7hWgFTIWw4hS8/bsTWG+JGUij8AERyQA3we9g4snSO9f5jNkPFMuHES9gATPt+49J589nqws0AMQKtft9Wz8NGwVsLLfcdIxx0/7Z4we9hwynMEVS27lVxNjdVjBphNFRVbV83Jd+DYAwbQdyGDfyYhRqjjUsFquW8Eo9hIwAHi6ov1puveGLh7+LmwO33sHHnlv4WwcD43KuWCSeewgbkLpktbg70m0uoC3PayFZOxfviJmxgGn+r3xY0w7u5od5kibewESxj7r2iu/aE5fel8cBuW59BP2PYCOI2bABmvrQq9EfArJiq5bwQz2EjIFTrUjyHjSunqs21jq2bNwZEwkO/Vi4TTryFDcBrDhc4rMpN2IDz5fnmmibWSZzIaGjdwGR5hxfPVD7mVDyHDcDIk1ujN81XPbYw141f+t5EimEjiBdhAwcHzJ1hVZgJE7cxVi7rkt/Chpz10+MfGav7ruCgGq+XUUpWL7Hcd/SHiXQb8Rg2AP2vwjWLq8pt2EAnZ6v9R/+lO9POexNO8Zmo3rFOjBrfG7TWJD7s7m7M4KewgY7B+LyoHosUhlNbhY0G4z1gy0Yc8SRsGNCPAAc3q+osPqxczi0/hY3AvWLQ16L4/cWenJWhqRLXzVWFydZUy9jl17BR9N4iMdx31Vzj2MIBKuflxyYsY1e8hg3IXPhg2Im/xpfbsAEXKgrMtU0s/D1rv90qEh5yN7LhyLI5P99iPlAdRdmuL9X4KWxUfPy6GB0ZkS0OGc/8U/kcp9D6ZNWpvXTN0infusOwEcSrsAF4fqhye4BS8VPYqNj4lrl3d2r4Wq+838nR5XMjOsCihzhajawKfRZUy9nlt7CRufABI9TmmGtSF1qB3ISZeA4bgDPVcJ1Gg8uLsIG7jmIenFCF0VqV29eKtCf+qlyHCt4b9Hm6XGc90d7xLe+7OinwU9joaW4w9874yBj73VlyRBSvfkUkPuJ82oK0OX8VjT99KW7fVLdq4AQp5d96WrtjCcNGEC/DBn7EQ/UfwNh8r4fDWoWN613toiV9v+dwgFfthx2hJsvB3AFo3secJBhFkTbnL2OWxciAw8YZOW7IhGGbuEtsqOo/3ymSHnU3NXA0wgaG0uEzGU7+yvnyrq4Yjtec9p1s9g5XaFGK9NbyAdi21XtyriRX+Zlxo+6bz12FI6/DBhxaMM124PAibADedzv9RnCQxGeo/rvt8rsS/JnBzRBrdm+Qc6yECunBhROCtDl/U+6THVZho+d0rfLv7VZyhAfwULeZx79fbqgRDT/uEkXvLpI3OAz+TOJzhDv05q9cIO8i3F17zPI7EigMHJjql1CAYSOI/PG0qEgOKPLHLURh9jj5YVUsGwmrsKGrML+Iaj/CQa9+p4XOtXh9Vj8CoarE4h4WTkQjbOgqXL5Kffwe5b44Ib8vYX5IvSycsbs5WOsIG4BO31brDS6vwgZUbHjT1ja9rNbsZJHw8G+U+2OHVdjQVRlPOL8VRKLx+ob6QrccqQq/TZFM+tXdUCUvKav2Zaph2AjiddiAcJN94ZbEbs7WgvklbODW8JNRCCY4q1Ptg1NTJWxgNlm0Cqn2wymGjf/AWazxgTPXpi4vwwYUvfeS6D/Xbq5dT2G4bUvGjyLLgzsp+yFsFL+/yPgzTs5+dpbkxtXN2Bg2gugIG8nT7xI9zfXmWtSFa6WqZZ3yS9jAD3vpuuW2mvsjLbznbqcoDzYVwgY6Jju5jh8Ow8ZYbVlJId8Pr8MG4PfldMJXnt80DDOiNqV+LzLmedfy6oewAficNB7YY3mXZLeFPhrVO43ffB/MjeIlho0gOsIGJM+4S96i3qpwicCLs02/hI1g6PmOKX8He+zdkj9UoR9Me95BLXOZ+DVs4LOF/hP4bKu27QbDxlgYLnm59ri5xomlI2wEYCRWU9LXYTuPhivcsh4nP5hETLUdN/wSNgIQ5E58+q7oPnnMk9YO9C2r3fe5SJnl/XvrBwwbQdCXAD9oKuhgpVrGLhxUVesNwK3Q3f7gXawsUa5bl8qtq5X7EanMBdPkOtFpDfcYQJ8Wq8KZFwIcOuHiskzhqhe13eAOMJxZ9R6A288GbkCnWm8k0CEQo0zQ6SxvxTx5DVq1TS/I70tbk3I/dMB3xM1oCPk3bD2tXLdXISB19j2W30M5p4mmsBGAwIMWPZwI4BLtje4L5jdmYiGIoqM2wj4+wxg1oVqnV/CdVr0vuqQZfwvVfkQCndTL168QpxP3igvG33fgUpf5LqoLndwx3B4dttHRPduDy1B+x7BBMQ2tQhhiiLNSwP9PnvEH5XOJaCLc3PDgM/f//B0CjJjwojUnniHYIdAE3tPMZ6fJ/+b7qsawQURERFoxbBAREZFWDBtERESkFcMGERERacWwQURERFoxbBAREZFWDBtERESkFcMGERERacWwQURERFoxbBAREZFWDBtERESkFcMGERERacWwQURERFoxbBAREZFWDBsU1w4vnilSZv5R+RgREXmDYYPiVvYLjwghbou2nGTl40RE5A2GDYpbSY/+TpxO3CvyVy5QPk5ERN5g2KC4Vvz+YnFo/r+UjzmFlpK6fVtES/p+cerHXaLik5Xi4NP/UD43nKznHxala5eF5MV+Zzx1n1xXymN/Vj7uVN7rT4sjrz6pfAyOLJsjL12pHnPC6v05+tpccWDaL5TLOFW06kX5elSPAV5HqMfDwWtwszyRnzBsUFwb6r0iKrd+qHzMieqdH4nbt26JvrPNoqMwS5w/VihuXL4o/+3knk3KZUKp2b3B2Leen90aHRWjw0Nj/q34g1eUyzqBYISq2b1R+bhTl6rLxOjIsMh64VHl4x0FmXKbbgNB/b6t4uaNAfl+B1w/d1a+T72tjSJ97v8ql3Oi/3yHuFRTIQ488Evl4y1p34V8PJx6I5i6WZ7ITxg2KK55ETYy5t0nbt28KVs1xj+Ws2iGOPjM/RP+3am+tibRlpNi/H9vztoh8ZHfiuHrfaLXWDcO1l60CCBsoC7XVxkH0V9NeNzLsKE6UGcumCYGLnSK9qMZxjbcHcQZNoi8w7BBcc2LsIHmdlTaE39TPu4FHWGj8O3nxe3RUZH/5gIhbt8Wmc8+oHyeEwgbOICiildPbHnRHTYCj/Vf7HR9EGfYIPIOwwbFNS/CxtHlc41D622Rs+jfyse9oCNs4KB/sbpcHuxuXDovL924XT/CBtZ79kiabC1JfPi3Yx6fjLBR8+UnRlBod30QZ9gg8g7DBsU1L8JGgnGw6G07La53tYuCt59TPsctr8NG8oy7xEj/NVGx8W3536d+3OnJpZRA2EiZdbcY6rks6r/dPmadusNG2py/iOsdraLZCAK8jEIUOxg2KK551UEUBzkcSNEhtP/iOXHqp90id8ls5XMj4XXYOPXTLnFz8IYROv4g/xsjI3ApJeflxyY814lA2ECYKFu3XHZqzXtj/s+Pexk2hvv75ME6AP1E8Jp6W0+LJCNMqZZzgmGDyDsMGxTXvAobARjqWvvN5+JaZ6vst9Bdd0KkP+l+ZISXYSN19j1idGjQ7ET5n/Vdbao3WwQi30Zw2MB/d5UekQEg87mH5H97GTYw+qRy6xr59wto+GGnbLFp+HGX620wbBB5h2GD4prXYeNnxoGu4K1n5QGxp6nO9YHPy7BR/cV62cek4J3nJ/z7UF+PSHzkd2P+3YnxYSP9yb+LoavdMnRhdMpk9NnA3BXi1i2R/dL0CY85wbBB5B2GDYpr2sKGqfiDl+WBPXX2/ygft8vLsHG1ueHnVhcc7AIC/15nHMgj3c74sAG4RHNz4Lqo3LZGzkGiO2wAhvQe//w94/9Hvp3ellOi53St5Tbac9NEV+lRhg0iGxg2KK7pDhuY1VKGjVmxETZwmQd9My5Wlcr1jdd/4ZwY6rsqEh76jXL5cFRhAzCjKt7rrrKj2sMGOr+i70z5xysnPOYE9vPWzWHjb3f3hMcSHviVnLStMeEr47UwbBCFw7BBcc2LsIEpzwGjUoL/HQc9HHxxKcXtwdWrsIFLJSMD10Tyv+90DJ3w+M6PZBgZf4nFLquwgQM2RqfcujmiN2wY621K+lrcGhkWGc/8c+xjDmUtfFDc7L8uL/0EdzhFZ+DzZXky0OQunTNmGScYNiieMGxQXPMibDTs/0JO0Y0WgcCZe1d5nuwYOTJwXRxd/pRyOSe8Chu4VHIm84DlwT79ib8ZB+oheYCNJBBYhQ0oW/+aDDIt6T94EjbGj0aBgUtdMtCc2LLaeJ67bQAug43eGBDD13rl3/RCZYn8uyJoVO/6xNXrQNjA5Z7xrwHkJSCX7xFRLGHYoLh2bNPb8gZqqsecwJl7xca3RFPKt3f6JWT8IEMMDt6q5zuFA3X+yv8MIY0EpifHPh1aME35eEDRe4vk+6J6LBwcnPNWzFM+BhUb3gz5uF25r8yWr2W845tXyenjVctEKmPuvaJ272Y5eqctN1VUbl8j0ub8VflcJ6xeA2Cae9UyRH7FsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFERERaMWwQERGRVgwbREREpBXDBhEREWnFsEFEREQa/Zf4/x1RlYYEmYheAAAAAElFTkSuQmCC';
    
    container.innerHTML = `
      <button class="cw-button" id="cw-toggle">
        <div class="cw-tooltip">Canlı Destek</div>
        <img class="icon-chat" src="data:image/png;base64,${iconBase64}" alt="Chat">
        <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      
        <div class="cw-window" id="cw-window">
        <div class="cw-header">
          <img class="cw-header-logo" src="data:image/png;base64,${headerLogoBase64}" alt="Logo">
           
          <button class="cw-close-btn" id="cw-close-btn" type="button">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
          </button>
        </div>
        
        <div class="cw-form-container">
          <div class="cw-form-welcome">Hoş Geldiniz</div>
          <div class="cw-form-intro">
            Müşteri temsilcilerimizin size daha iyi hizmet verebilmesi için formu doldurmanızı rica ederiz.
          </div>
          <form class="cw-contact-form" id="cw-contact-form">
            
            <div class="cw-form-group">
              <input type="text" id="cw-name" name="name" placeholder=" " required>
              <label for="cw-name">Adınız Soyadınız*</label>
            </div>
            
            <div class="cw-form-group">
              <input type="email" id="cw-email" name="email" placeholder=" " required>
              <label for="cw-email">E-Posta*</label>
              <div class="cw-error-message" id="cw-email-error" style="display: none;">
                Geçerli bir e-posta adresi giriniz. (örn: ornek@domain.com)
              </div>
            </div>
             
            <div class="cw-form-group">
              <div class="cw-phone-group">
                <select class="cw-country-code" id="cw-country-code" name="countryCode">
                  <option value="+90" selected>+90</option>
                </select>
                <div class="cw-phone-input-wrapper">
                  <input type="tel" class="cw-phone-input" id="cw-phone" name="phone" placeholder=" " minlength="10" maxlength="15" required>
                  <label for="cw-phone">Telefon Numarası*</label>
                </div>
              </div>
              <div class="cw-error-message" id="cw-phone-error" style="display: none;">
                Telefon numarası en az 10, en fazla 15 karakter olmalıdır.
              </div>
              <div class="cw-warning-message" id="cw-phone-warning" style="display: none;">
                Lütfen telefon numaranızı eksiksiz giriniz.
              </div>
            </div>
            
            <div class="cw-permissions-section">
              <div class="cw-checkbox-group">
                <label class="cw-checkbox-label">
                  <input type="checkbox" id="cw-permission1" name="permission1" required>
                  <span class="cw-permission-link" data-link="https://www.citysresidences.com/kvkk/kvkk-iliskin-aydinlatma-metni" onclick="openPermissionLink(this)">Kişisel Verilerin Korunması Kanunu Aydınlatma Metni</span>
                </label>
              </div>
              
              <div class="cw-checkbox-group">
                <label class="cw-checkbox-label">
                  <input type="checkbox" id="cw-permission2" name="permission2" required>
                  <span class="cw-permission-link" data-link="https://www.citysresidences.com/kvkk/ticari-elektronik-ileti-aydinlatma-metni" onclick="openPermissionLink(this)">Ticari Elektronik İleti Onayı</span>
                </label>
              </div>
              
              <div class="cw-checkbox-group">
                <label class="cw-checkbox-label">
                  <input type="checkbox" id="cw-permission3" name="permission3" required>
                  <span class="cw-permission-link" data-link="https://www.citysresidences.com/kvkk/acik-riza-metni" onclick="openPermissionLink(this)">Açık Rıza Metni</span>
                </label>
              </div>
              
              <button type="button" class="cw-submit-btn" id="cw-continue-btn" disabled>
                Devam Et
              </button>
            </div>
            
          </form>
        </div>
        
      </div>
    `;
    
    document.body.appendChild(container);
    this.container = container;
  }

  attachEventListeners() {
    const toggleButton = document.getElementById('cw-toggle');
    const closeButton = document.getElementById('cw-close-btn');
    const continueButton = document.getElementById('cw-continue-btn');
    const checkboxes = document.querySelectorAll('#cw-contact-form input[type="checkbox"]');
    const emailInput = document.getElementById('cw-email');
    const nameInput = document.getElementById('cw-name');
    const phoneInput = document.getElementById('cw-phone');
    
    toggleButton.addEventListener('click', () => this.toggle());
    
    // Close button - sadece pencereyi kapat, verileri koru
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }
    
    // Form validation
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.validateForm());
    });
    
    // Input field validation
    emailInput.addEventListener('input', () => this.validateForm());
    nameInput.addEventListener('input', () => this.validateForm());
    phoneInput.addEventListener('input', () => this.validateForm());
    
    continueButton.addEventListener('click', () => this.handleFormSubmit());
    
    // Initial validation
    this.validateForm();
  }

  toggle() {
    const window = document.getElementById('cw-window');
    const button = document.getElementById('cw-toggle');
    
    if (!this.isOpen) {
      // Açılırken
      this.isOpen = true;
      window.style.display = 'flex';
      window.classList.remove('closing');
      window.classList.add('open');
      button.classList.add('open');
      
      // Focus için input kontrolü
      const inputElement = document.getElementById('cw-input');
      if (inputElement) {
        inputElement.focus();
      }
    } else {
      // Chat açıkken butona basıldığında animasyonlu kapatma
      this.close();
    }
  }

  sendMessage() {
    const input = document.getElementById('cw-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    this.addMessage(message, 'user');
    input.value = '';
    
    // Bot cevabı için typing indicator göster
    setTimeout(() => {
      this.showTyping();
      
      // Bot cevabını simüle et
      setTimeout(() => {
        this.hideTyping();
        this.addBotResponse(message);
      }, 1000 + Math.random() * 1000);
    }, 500);
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('cw-messages');
    const welcome = messagesContainer.querySelector('.cw-welcome');
    
    if (welcome) {
      welcome.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `cw-message ${sender}`;
    
    const time = new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const avatar = sender === 'user' ? 
      this.config.userName.charAt(0).toUpperCase() : 
      this.config.botName.charAt(0).toUpperCase();
    
    messageElement.innerHTML = `
      <div class="cw-message-avatar">${avatar}</div>
      <div class="cw-message-content">
        <div class="cw-message-bubble">${this.escapeHtml(text)}</div>
        <div class="cw-message-time">${time}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    this.messages.push({ text, sender, time });
  }

  addBotResponse(userMessage) {
    // Basit bot cevapları - gerçek bir chatbot için API entegrasyonu yapılabilir
    const responses = {
      'merhaba': 'Merhaba! Size nasıl yardımcı olabilirim?',
      'selam': 'Selam! Hoş geldiniz! 😊',
      'nasılsın': 'İyiyim, teşekkür ederim! Siz nasılsınız?',
      'nasıl gidiyor': 'Her şey yolunda! Size nasıl yardımcı olabilirim?',
      'yardım': 'Tabii, size yardımcı olmaktan mutluluk duyarım. Ne konuda yardıma ihtiyacınız var?',
      'teşekkürler': 'Rica ederim! Başka bir konuda yardımcı olabilir miyim?',
      'teşekkür ederim': 'Rica ederim! Başka bir şey için buradayım.',
      'güle güle': 'Görüşmek üzere! İyi günler! 👋',
      'hoşça kal': 'Hoşça kalın! Tekrar görüşmek üzere! 😊'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    let response = null;
    
    // Anahtar kelime eşleştir
    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }
    
    // Varsayılan cevap
    if (!response) {
      const defaultResponses = [
        'İlginç bir soru! Bunun hakkında daha fazla bilgi verebilir misiniz?',
        'Anlıyorum. Başka ne söylemek istersiniz?',
        'Bu konuda size nasıl yardımcı olabilirim?',
        'Daha fazla detay verebilir misiniz?',
        'İlginç! Devam edin lütfen.',
        'Sizinle konuşmak çok güzel! Başka ne düşünüyorsunuz?'
      ];
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    this.addMessage(response, 'bot');
  }

  showTyping() {
    const messagesContainer = document.getElementById('cw-messages');
    const typingElement = document.createElement('div');
    typingElement.className = 'cw-typing';
    typingElement.id = 'cw-typing';
    typingElement.innerHTML = `
      <div class="cw-message-avatar">${this.config.botName.charAt(0).toUpperCase()}</div>
      <div class="cw-typing-bubble">
        <div class="cw-typing-dot"></div>
        <div class="cw-typing-dot"></div>
        <div class="cw-typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingElement);
    this.scrollToBottom();
  }

  hideTyping() {
    const typingElement = document.getElementById('cw-typing');
    if (typingElement) {
      typingElement.remove();
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('cw-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  validateForm() {
    const checkboxes = document.querySelectorAll('#cw-contact-form input[type="checkbox"]');
    const continueButton = document.getElementById('cw-continue-btn');
    const emailInput = document.getElementById('cw-email');
    const nameInput = document.getElementById('cw-name');
    const phoneInput = document.getElementById('cw-phone');
    
    // Checkbox kontrolü
    let allChecked = true;
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        allChecked = false;
      }
    });
    
    // E-posta formatı kontrolü
    const emailValue = emailInput.value.trim();
    let emailValid = false;
    if (emailValue) {
      const atIndex = emailValue.indexOf('@');
      if (atIndex > 0) {
        const domainPart = emailValue.substring(atIndex + 1);
        emailValid = domainPart.includes('.');
      }
    }
    
    // Telefon numarası kontrolü
    const phoneValue = phoneInput.value.trim();
    let phoneValid = false;
    let phoneWarning = false;
    
    if (phoneValue.length >= 3 && phoneValue.length <= 4) {
      phoneWarning = true;
      phoneValid = false;
    } else if (phoneValue.length >= 10 && phoneValue.length <= 15) {
      phoneValid = true;
      phoneWarning = false;
    } else if (phoneValue.length > 0) {
      phoneValid = false;
      phoneWarning = false;
    } else {
      phoneValid = false;
      phoneWarning = false;
    }
    
    // Diğer alanların dolu olup olmadığını kontrol et
    const nameValid = nameInput.value.trim().length > 0;
    
    // Tüm koşullar sağlandığında butonu aktif et
    const allValid = allChecked && emailValid && nameValid && phoneValid;
    continueButton.disabled = !allValid;
    
    // Mesajları göster/gizle
    this.showEmailError(!emailValid && emailValue.length > 0);
    this.showPhoneError(!phoneValid && phoneValue.length > 0 && !phoneWarning);
    this.showPhoneWarning(phoneWarning);
  }
  
  showEmailError(show) {
    const errorElement = document.getElementById('cw-email-error');
    if (errorElement) {
      errorElement.style.display = show ? 'block' : 'none';
    }
  }
  
  showPhoneError(show) {
    const errorElement = document.getElementById('cw-phone-error');
    if (errorElement) {
      errorElement.style.display = show ? 'block' : 'none';
    }
  }
  
  showPhoneWarning(show) {
    const warningElement = document.getElementById('cw-phone-warning');
    if (warningElement) {
      warningElement.style.display = show ? 'block' : 'none';
    }
  }
  
  handleFormSubmit() {
    const form = document.getElementById('cw-contact-form');
    const formData = new FormData(form);
    
    // Form verilerini obje olarak tut
    this.customerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('countryCode') + formData.get('phone'),
      permissions: {
        kvkk: formData.get('permission1') === 'on',
        commercial: formData.get('permission2') === 'on',
        consent: formData.get('permission3') === 'on'
      }
    };
    
    // Loading sayfasını göster
    this.showLoadingPage();
  }
  
  showLoadingPage() {
    const formContainer = document.querySelector('.cw-form-container');
    if (formContainer) {
      formContainer.innerHTML = `
        <div class="cw-loading-container">
          <div class="cw-loading-content">
            <div class="cw-loading-spinner-container">
               
              <div class="cw-loading-dots">
                <div class="cw-dot"></div>
                <div class="cw-dot"></div>
                <div class="cw-dot"></div>
              </div>
            </div>
            <h3>Müşteri Hizmetlerimize Bağlanıyorsunuz</h3>
            <p>Lütfen bekleyiniz, temsilcimiz kısa sürede burada olacaktır.</p>
             
          </div>
        </div>
      `;
    }
  }

  // Açık API - dışarıdan mesaj göndermek için
  sendBotMessage(message) {
    this.addMessage(message, 'bot');
  }

  open() {
    if (!this.isOpen) {
      this.toggle();
    }
  }

  close() {
    if (this.isOpen) {
      const window = document.getElementById('cw-window');
      const button = document.getElementById('cw-toggle');
      
      if (window && button) {
        // Kapatma animasyonunu başlat
        window.classList.add('closing');
        button.classList.remove('open');
        
        // Animasyon tamamlandıktan sonra pencereyi gizle
        setTimeout(() => {
          window.classList.remove('open', 'closing');
          window.style.display = 'none';
          this.isOpen = false;
        }, 300); // Animasyon süresi
        
        // Verileri koruyoruz - sadece pencereyi kapatıyoruz
        // customerData ve form durumu korunuyor
      }
    }
  }

  getMessages() {
    return this.messages;
  }

  clearMessages() {
    const messagesContainer = document.getElementById('cw-messages');
    messagesContainer.innerHTML = `
      <div class="cw-welcome">
        <div class="cw-welcome-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <h3>Merhaba! 👋</h3>
        <p>Size nasıl yardımcı olabilirim?</p>
      </div>
    `;
    this.messages = [];
  }
}

// Global erişim için
// İzin linklerini açmak için global fonksiyon
function openPermissionLink(element) {
  const link = element.getAttribute('data-link');
  if (link && link !== 'BURAYA_KVKK_LINKINI_YAPISTIRIR' && link !== 'BURAYA_TICARI_LINKINI_YAPISTIRIR' && link !== 'BURAYA_ACIK_RIZA_LINKINI_YAPISTIRIR') {
    window.open(link, '_blank');
  }
}

window.WebChat = WebChat;

// Otomatik başlatma (opsiyonel)
// document.addEventListener('DOMContentLoaded', () => {
//   new WebChat();
// });

