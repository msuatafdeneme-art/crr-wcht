/**
 * WebChat - Modern Web Chat Widget
 * Kullanım: Sayfanıza script'i ekleyin ve WebChat.init() çağırın
 */

class WebChat {
  constructor(config = {}) {
    this.config = {
       
      // API Configuration
      apiUrl: config.apiUrl || 'https://chatserver.alo-tech.com/chat-api',
      cwid: config.cwid || 'chat-widget-key',
      securityToken: config.securityToken || 'security-token-from-chat-widget',
      namespace: config.namespace || '',
      // AloTech polling endpoint for incoming messages
        pollingUrl: config.pollingUrl || 'https://chatserver.alo-tech.com/chat-api/get_message',
        pollingInterval: config.pollingInterval || 2000, // 2 seconds
      ...config
    };
    
    this.isOpen = false;
    this.messages = [];
    this.container = null;
    this.customerData = null; // Kullanıcı verilerini tutmak için
    
    // API Related Properties
    this.chatToken = null; // API'den dönen token
    this.chatSessionActive = false;
    this.isConnecting = false;
    this.typingTimeout = null; // Typing indicator timeout
    this.messageQueue = []; // Mesaj kuyruğu
    this.isProcessingMessage = false; // Mesaj işleniyor mu?
    this.hasReceivedAgentMessage = false; // İlk agent mesajı alındı mı?
    
    this.init();
  }

  init() {
    this.createStyles();
    this.createChatWidget();
    this.attachEventListeners();
    // Start polling to receive incoming messages
    this.startPolling();
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
        background: linear-gradient(135deg, #AF3F27 0%, #AF3F27 100%);
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
        background: linear-gradient(135deg, #AB3D26 0%, #AB3D26 100%);
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
        flex: 1 1 auto !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding: 15px !important;
        background: white !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        min-height: 0 !important;
        position: relative !important;
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
        align-items: flex-end;
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
        margin-bottom: 4px;
      }

      .cw-message.bot .cw-message-avatar {
        background: linear-gradient(135deg, #AD4E31 0%, #C85A3C 100%);
        color: white;
      }

      .cw-message.user .cw-message-avatar {
        background: #C85A3C;
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
        background:rgb(225, 225, 225);
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
        color: #C85A3C;
        margin-top: 4px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .cw-agent-name {
        font-size: 10px;
        color: #888;
        margin-top: 2px;
        padding: 0 4px;
        font-style: italic;
        text-align: left;
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

      .cw-chat-container {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        width: 100% !important;
        position: relative !important;
        overflow: hidden !important;
      }

      .cw-input-container {
        display: flex !important;
        flex-shrink: 0 !important;
        padding: 15px !important;
        border-top: 1px solid #e2e8f0 !important;
        background: white !important;
        align-items: center !important;
        gap: 10px !important;
        position: relative !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .cw-input {
        flex: 1 1 auto !important;
        padding: 12px 16px !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 25px !important;
        outline: none !important;
        font-size: 14px !important;
        font-family: inherit !important;
        background: #f8fafc !important;
        transition: all 0.2s ease !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-width: 0 !important;
      }

      .cw-input:focus {
        border-color: #667eea;
        background: white;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .cw-send-btn {
        width: 40px !important;
        height: 40px !important;
        border: none !important;
        border-radius: 50% !important;
        background: #AF3F27 !important;
        color: white !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        flex-shrink: 0 !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
      }

      .cw-send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(175, 63, 39, 0.3);
      }

      .cw-send-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }

      .cw-end-chat-btn {
        padding: 8px 12px !important;
        border: 1px solid #dc2626 !important;
        border-radius: 20px !important;
        background: white !important;
        color: #dc2626 !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        display: flex !important;
        align-items: center !important;
        gap: 5px !important;
        flex-shrink: 0 !important;
        transition: all 0.2s ease !important;
      }

      .cw-end-chat-btn:hover {
        background: #dc2626 !important;
        color: white !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2) !important;
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
    

    const headerLogoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAhsAAADBCAYAAABmHXLdAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAHYYAAB2GAV2iE4EAAETbSURBVHhe7Z0HmCRV2bYnbGATeVGUIBJ2QZISRAkrUYKAsIAEFRRFBFQQBQkKAgoooIAgQVSC/Aq7LEjOLCqoCJJhlSBRFBDYZcPs9PT899NdPV/3dFWHCjM9O899Xe91qk5VnVSnznnrxParN1+jt80YY4wxJiM6AtMYY4wxJhOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlOsbBhjjDEmU6xsGGOMMSZTrGwYY4wxJlPar958jd7g2BgzxJg68+kjZCA7TZ8y+Z2CZQtB+D6IcRlyNeE7u2C5iLPHvbOW7u3tXZVD/cw93YrvxZiBxsqGGdJQsHdQsC/N4fLI6u3t7ZM4fx8ynuM8diro/428gvwLeQmZPdAVAJWuwtOuY8LWwaEqosI55LHLY9czbYtJcwO7hsDd32Dsi5yMnIn04M7IwI+Kbxu7kn9c6gtLn10ghYsyo+CZkrsye7m9fxnSwy057MdhXsT5TsiJpPlJhasRlKVRJ9IXHoE7ipfSSf7Jfi5ppfebCPKPwljwR+5yXHo3BeQvRp6wv1u0qQ1x+BrGwYiULLnzGHIUz9+FmQqEeSLhkjIzuS2fX7mto2Mix4shC5G3kf8iLyPPyyQ+80irORwbM2hY2TBDCgrzsRSe76Gw/TinH0M+hKyILBFIJ9dVWfXBvTkMVUyzEVUab3DP89g/wfFDyKOcv0qBrMI6dQjzNzA+gyyFjA5kJDIeEaoI5iNSgBS+15AfUkE9iFkT3J5B2HcjLt2cvooo7nK7r6IO6H9eoTAEIsLKg/JndVw672+OC0yheCjNVRHqeoWyQbgnYehcaaIwL47o/SltdF7exaswKX5dyHziK2VmFuYXeGeyiwVhOAxjd2QZZAyiCltpV/JbisY85E3kf4je0wPE48eYVeDeFIwrCJfyYx+E9RHsPk1YVfk3De4ui7EJsi2yHrIS8j5EeV3hrSDI7wr7W4FI0f4n8iii/P4McVCcjBkwrGyYIQEF7vsxPo3siKyFvJ+CdhRmbIJCWaLC+DnkAeRO3H2QikF/iKmgihU3v4h/B2Kq4oiEe/QnfDr3/ZYwKGw1we2buFdp0rIQJykdJ1DBqfWlD8Kuin4bRIrHh4jHe2VfC9yScvFrZDru3VawjAn+ry0DOQi/lb9CwU8pgjORq5Bb8Vf5pQrcuwF3PhWc9sHzKmMv5Dm1eDQEbknx+QSyB/JRZDXclkIUG4IhZVpKhlo9pMgq/f5IuNQSYkymWNkwLQ2FrhSLLyKqUFXgJlIwakFhrEpRFcss5H7kSgriP2EqHIvjdy8KQKzm6D3undWZ7+29oaO9fYfAKopt8eP24LguhOsWwrV9cNqSkK76yz6WtDy9aFNJ8I5PIx67FG2iwa3nuG8D0kh/7InhvYzK53tu6Ojo3C6wqgI//4SfX8LPpwKrUIjHQ9z3keC0Atx4kmub4YZaSGqCO1IuvolsxjORSlBSCNMCjH8gf0FmyOQducXDZEJ5U6UxLQOVwMoUuudyeD1yBIXuWkhmiobAffXXj0M+ghyK1dWE4VbCokrycgrnrxZujAGVTE97sUk7EtzX9b8VzxqmbutHixDZ3UEF9yTGycRfrTr1eD/3aQxIKuDWmrz2DYPTKriuLrfj6ykaAbXG26iLSOM4IiGfjSC/HcXhlcie+JuZoiFwfzFkXeTLnE5D7sH/K5ATkZ8hZ0pJLtxsTEKsbJiWg0JuOwp5NVkfTEG4KjIoBR7+ql98W8KyD+YERGFKQs1WRPzT99jsuBH9nQ4F1LoRCQqHurB+hdQcuEsaaUzHCeSRxBUxbqir4ie4qQHGoXDtTBSNu4PTmnDvTeQVdVGEocGnGpcSCpX6GK5rts7JuKM8P6BlM/5pLNQ6HO6N7I9shTwhJRnTmMRY2TAtBRXAIRi/oOD7KFI1+K0WFNZvIk8gf0TuQu5B7kMeR94IbmuKoNDXAMdLqBA1myU2vW29I4LDKPT32yyxB0gOFKRhabBoTbjvbN7TjcFpJNy3OsYZxbNEHIdbqlRDISzqWjireNYQZ+DeeZgzefZZpLzLRPEPHQeEoqGBtZoerLEjUqbqgtvzkNeQR5H7kT8gyvc6fgR5BWlaEcV/5VEp2f/i+IqCpTEp4DEbpmVA0dDYDBXYkX+a5VCYqtn6BeQZRE3wGsSnJnk1fatw19+kRuxrRsQaHGtEv8YHrIJo/EfNwZoleO467t096V/e7nc/PqOjc+RuwWkU4/Cn4emvpJkUsy8FaaHZDgqjlDR915rBoSm1XC6MRymv8KVASZFSt9GaBZsa8LxmVOQw1cpUcktSKj+43N4ZXC/N6JiA3QrYqdLVmI0LMGtCfPR+ruY5zTKKBDelZE3BzT8XbZoDf9bFuB1/3lO0qQT31W2yDe6HDgatBW5rlpGmYq+GnI0fyntPYW4Y9m65XwNnj+F6TWUUNzSbSmMs5JYUi79z/CLH73BcmhKsqeCaXbMC8mFkfUTdN2tyWUpEXXheivnBxF1dK8akgpUN0xJQ4GpmwrkUiHWbxykMtW6GRtOrsriN8+cpGBv6i1O/OPerBUEFsfr+NX12bdwpTUOtQG5j7Ib7Dxdt4rPrHQ/fMHLUmKrZCuXg33j8amhNB0G6nYZRag06l+dVmZUqLSkemiqKdXFtDB3L1HlgL4XrrxyrcgyFe57F0KDFedxX6NLSgzJL7gmsVNmVo3d5DKLWg+8QL41FqAtx+i7G8bhd8y8f/+7inh2owJtq3cF9dZ/8jmd3LdpUgrtqgfgs4b2haBMf/LoRf3bCzWtxT7OpKiA/Ls81pX/FdNlyuK40vg+5FLkZd7RWTMMQBr1jTZnVQOKNEM38kQIeCt4pXbcnXTOZCm6GJ1Y2zKBDgbs5BdxlFHBqcYiEe/Qnrel6Gjh6J4Vu4vEK+K0Fknbm8PPIxwhDXwWHvQrbb+HPOUWbZOxy64M3jxozvuZsFPxsVtnQLIqdCfe3mq10BfHXn/A/eV6LRIXC9YcIU+gsi3oQPv1ln4BchBuPFyzrQJhG4+evCZPGykTCPRocezju/qxo0xiESauuavZLlTKDm93Yn0VaHh1YxSaIh5RUtSzsQTg12LkC7vk+htInFJ6XwqixLN/jea2jkgjirnEjWqPms8j2xLWidQ//1HqyX1hYjUmClQ0zqAR/Xfr7059zJKoEMM5HVOimvvonhb4WlzoYf75MWAqzBjjWugm7UfHI78Tscsvfbh01dsIng9MoJuDfgK72yDuQsqFxEKGQDo+S5up2GDAIk7o3phOuzYo24RA2rY+yA+HTdOW64K7+8K/HXS2MVQXuaczIVNxLrMjil9bwuByZiXtVSmag6D1IWNTKFgrXNQV7W55vWAFthEAR0hoemunVNxsHu2s434s8OFRmOZkhggeImsHmWxRu9RQNtTCcwn3fptDNZJlxCte3kFPxY3/8exHRYNCj0lI0CvT2tOr3Vm/gakODFtOE9/wfjCN5D1pNNRLelxTDM6nY1TVSEypYLYp1Ps9EKRrqLtLS4mkoGqUVUhWPb8suBIWn3kJmN6ataAjydRfuaqn7rxDvR2SHqcW9TrOiYbLAyoYZNCj81W2yX/GsJqogfkghOBB9yOob14DTyymMNdg0NXrzVWMaBh39XWPUUzaamhWUFqS/Fpv6GZVg+cDWMNRq8PXiYTS48wPy0abBaRin4aeWsE8Eisam+KM9YdRq913cjOo+kqIRuXYM4VUXSnrKbgiETWOfLsAvDQrVOJZm13kxpiGsbJhBgwJufwq3yIFxgntu456TUm1hqAH+qIBXRRG6/0Uievv2EGk16q1jMijrnAjevTaXkwIYCfcofN+gktdso1C4pvUjvlA8q4Z8pi4zLYMeG3VN4E9hPAjuacDtz6jMa00f1fiJyDwRxGvr4lmmaLaV1hJRq0Y9xc6YWFjZMIMCBbP+6KpG55dDga1R91q9se4Sz2lCBfFbRAPlhgs1lSDew9jgcMDh3Wv5+O8QBnVHREJlqZkvZ1DZV61VErSgHcs9GpdTBW6ry+y4JAot/q6LO+fhh/K0wnoSx6cWLkbA/equqNdlsRFuTw1aoDKBvK6BpxoI3fQ0X2MaxcqGGSw0++EDxcNqKIj1h6UZDH8t2iwK1O9GId6D0fpR289BbpEhD/wRQ9N6ayoDVO4aTPq94lkRtTbwnNZuCR3gyjXN4FH3SWHcQgI0pVTuaebSAbh3BcpLPUVCSrSUqUgCBeks3P0+cVkTxSMTxY+war0aYzLDs1HMoEChqX1GtK5G6HgBClf9bW1MoR21/POQY+cb7r9r9OJLR65YKYj34sR5wFpV9MestOY9RA5UzPfk37hmyzUrpkgONIHScBXhDF0bowT3aCOxvUjDO3VOPjsRQwtmhQ5y5f6zufcbwWlsCJ9WAV3YTOsIz2gRNG3ephkyNeE+KUVq6XsaeYxn/oGdFITXOVZ+mc25ugALi7jJlBCepqdDG5MFVjbMoEAlMI1CUVPvQqHgvIPr21FYLjJ9yFY2kkGe0YqcNxPWyGm6AVpJ9vPEawPMS7g/qvvkLoxdSO/UZ3s0QpD2MwhfTQUqDJ5TmKVIKK9o4LSUHJmaSaPWEi3upmsa+KlF8F7Cn5d4Tl0l/x2sOJvhi7tRzGCxRmBG8ZdFSdFocQa1m6RRqCA1S+gUKsx6U1OncM8tmFooLkrR0DLfmuY6aJVukL9nEJamF+si7OORZZBVkEmIVsHVbsUfR7ZGdkE+ixzO7ZqCeyH+XIt5O3IHis6lKG9fRiZznOluysYIKxtmsAhdHlxQKOoPrZHtxhdFhkTFP1hQeWp2h6bD1myR5T7tBRKZx+BsKvtBn+ZJGK/GeKh4lg34MRrRPjVSTrSjrGbtaGdX7TJ7M0l5FQrHXigekbvSGpMUKxtmsKi1toMG1mmBIdMStE5PKwpCD5WllhIvjMmIA5Xr3bih1WgHHeKj7o5fEqakA1SbhjTQtvJqGfk0/v8Cq2koHFrK3JjUsbJhBotaf/Cq3TTYzZgqpHBgHE4FWXM6bBg8o26T7+JGzVkgA8n0KZOvwfgJYau5nkiWoHAsjmifnfNQOLRhmzGpYmXDDBa1lAkpIoO2toNpfaigtSrnGVTQzS6trYW2NJW2pSBMWlBMS4efjzyLDMp4JRQO7dPyfRSOLYo2xqSDlQ0zWNSqJLRyYuSW5yY9+MNXpVZvnEhLjiOhYtSYA22c1hBU4H/imR8Epy0HCsdjyCEcfhE5k/DehWifngFZPbcM7fB7DArHoM9AMosOVjbMYBE5C4AKQWsi1F17wAxvUJQ0kPhQKmPt/FoT7tH6G9/kmQHdUTcOKBzaJVabt+2LaIn1Ywn/JciNyP3I08gryHwk9f2C+P60F876SM0t/o1pBq+zYQYF/pq0zffOwWkVFKJ/5vrHgz/vRYIG19lYgoomk51to+Bd/Je0Xi44rSLf0/PmNVuutUxw2nIQfu0IfHxwGgrp+hvStZFN/1qWPe6dNY54aIaN1kRRy5+24Vfrw5KI7LWLrAZ9juE+HUtpkOKuHXE100TvcFmu193rhufVzXkf927JN9hsV5UxVVjZMIMCBef3MU4onlVDYafFhz5BBfHPos3Qx8pGNhD+/dvb2y6lOAtsqiFdv0e6ar2JYQffmpSRpUgDrcfxMUyNx9iM45q7+XKfVijdiHTzzDCTGHejmEGBguxepFaTtv7c9iwemsGE9xQctSx1xzRQsQ70uIeWYdoWk95GnkdpuAVTCr6+q/N4r/VmfKlFJFIJNaYZrGyYQYHC/+8Y2ushFK4rb+7LX+vkos3Awt/gBPz+iczAaqBwS2PztOQA1lYFpeMNvq/jOLypaBOJvsGqXXSNiYOVDTMo8IelHS9rritAgbg2xo+o9AejCX8FZDf+/g4qnpoWppExCC1f1pHPB2z2B9+fFhP7NekiMwopvlbkTCpY2TCDycUUdjUXZkLh2AXjnKDfecAgXAfjt7bAP5RKIHR78hi41SIbGinH6iokgwl5TC0IV6WY1xrhZfJ4rcGf6mZp+dk7ZmhgZcMMGtOnTP4LhnberAkF4n5U/udQEGfef4xSMxp/1MSsLfDl9wcxLsJO/dcJKWz9PeQgDYKjlqURRaKlI0EaH4to8PBJ5EHNJMkc/FsfrbpWN4mm1Ta9SqsxYVjZMIONdvF8NjiOhILx8xi/ptLX/P/UoYAfh9t7EhZtT34y/pXvhLkxcmLxMD64WVfZaOSeDBjqLS4t3WpRD/Lde8l3pWm5u3J8OXbaTj8zyO8T8edAMlxgE8o75EetT2JMYqxsmEFl+pTJT2BcTsFXdy4/Bd+OGL+hIP6SlIOibTJwZwTuqYC/jVNtSb4JUvFdBOd7c+/KRZuYdHa26poh9ZSNVldGGinHWrllY1/qfI0RUl4Te3B4Dfnyc0jqO7GSj5cmv/8Uf6REh8J1zd65f9oWk4btLB6TLlY2zKBDofdTjN9RwDXy5/8hDG1a9VsVxhScqyAN/9nqXkStGOshR+LOXbgpJWNTJLL5mmsf4N5C10ps2jvrKlSNpEEG1PGz5btRGglgSypM5EWVwfv2jwL5TWM3LkJu4R4tHb4OZq2dkmsif3DjvYha77Stfb3VQZ9Hflk8NCY5XtTLtAQUhlp06EwOv0BB21Dtxv3663oZUcH4EPI4j2oTKy1CNA9R3taGbhrrsSoiRWUtRC0UE7lXKzE2DO5qA68Dpk+Z/EzRpjl2u/OxaztHjvp0cBoKfozH/cil3LOACuhV0uJ9wWkVhOkFwpSsVSdDyDtfIZQX1tI5iMPxxOGU4LRlIO0/iXEF6T+xaBMO4X8N4ylEeVB7vMzC1MJ3GsQZVoYrMZbgObmrzdW2QTZEVubZpTAj4Zm53POzaVtM0lb+xqSCWzZMS0DB9hYF3Dc4PIfCbnbRtjbcPxJZBdkK+RaiqXzXceluRIWyptZqDMbvuXYpchTyKWQdpCFFA/fEy8itnM7kuZqrLtaivbOzZpM0fszB/cFQ/uv5mfr+G2lCutVsMeK6tpNvuTiotQFDU6vrzrRSfkW2RL7L6Q3E6T7kCeRvyB+QO5DbkXu5/gDmw4gGYOtbuIjnvoSsj9RTNJQXtLnd6QULY1LCyoZpGVA4VNkexaE2nlJB2nTFy/NLI+9D9Ae3ErK87ILLDSO/QUulX4zsiRs78Gd8HGHU32Us2ts7alZ4+JHHz4ZaddIiqPDqpXOr741RbyVMjZWpd8+Aw7tWS4Na3JrqHiGfjAjy9erIhxF1AUrh3hrZjFs2wJRCrev6Fhoa96EMj3Et8h3yudbBMSY1rGyYloJCrotK/Wccfg65kvLv34ULAwT+9SAPc6gund0Jy0GIBsqlMbizprKBvzkqhgFVNgLqKRstV1H3o967aVppHSA+jryIaDfXvyJvFGwHGPwV2gflLOQw8nvdXXSNaRYrG6YlocB7CNF0wC8iV1MYZjoFD/fnIvdzqM269sbvbyGPFS6mRz1FIkcYIsdOZITCNNSVjQmkW6046FoK66SkC/nrp8guiLr2tsfqQKIxDRkwpQO/pMz/CtmVcByJaByIManjAaKm5dnj3lnaMnsnDrXWhpqNVyxcSAhu6o9Yf3Ra50P7REyjsNWfZuoQB003vImwbxJYVcF1fYsXcs+R04rLSWfO1OK6JRrTslLRphqC9QTXdyRMSquWgnTVtuu/Inx7BVahcM8dGFIiB6X1oFGITydh3Zf47IKpGSkrcqxBzqmBu8pnar14BPkVaXK97I3JEisbZshAQTyCclJrA2yHqL9bSodG26v/um73A89q4KmWX9ZsFSkVWuPjXh59kIr0dY4zgQp9U4yvIBsgGj8yGlkSf/taFoOwdSHqK38SOYFK4FHMzCBcSr8fIBshSscJhElhE+8QJo3VUKuGBliqa+kowqRZEC0DcdACbDsSVu0SPIbjvgGQQZoq/CrjpLxp8z+1WP0Ds6UhXuMx1kPU1SKFULOBNKh5KeLY8F5BpIHirrz9FiJFS7NaHsGNu7n0AGmxgHNjMsfKhhmSoHiool6RAlMrLU6i8FyZY01x1fLLqjC19obytipMKRgqcDVNVhWNKsyXKWgHZIppUKlr4J52kC2NL9CsFkkpnBrPURizQTxUud9F+BTezCBci+HdDvinCgyjVwMVC7NtONfYFaWdlDitpqrpkDdlqZTFgTjsSLiUD3oxFQmFVXEodQ9JlFcUN814mtFqcaiH8jrxkqIhhUMDSrWEvrrbpLhKKVF8S4qrlCvlJU39luL6CnGexfP/wFQXyZvEP43xR8Y0hZUNs8gQKCCRuJA1iwoheT107I3zvGkVrGwYY4wxJlNq/gkaY4wxxiTFyoYxxhhjMsXKhjHGGGMyxcqGMcYYYzLFyoYxxhhjMsXKhjHGGGMyxcqGMcYYYzLFyoYxxhhjMsXKhjHGGGMyxcqGMcYYYzLFyoYxxhhjMsXKhjHGGGMyxcqGMcYYYzLFyoYxxhhjMsXKhjHGGGMypf3qzdfoDY4NTJ359FiMghLWDr29vTIaVsq4v5SeMvNIbvqUyQsKNhmzx72zOvF+tI4V6IIlcVEcMEvncVAiKGoFs2DR29uTZbz0HvBrHP5M5HRJZHFEcZiLvIX8D3mXexZM22JSF8cDDmFcDP+78b8nsIpNkO9K7y3ynQXXC+h9BIcFuFTIb4RnftEme8hzowlGJ34rOIWwB1IV9hhU5DvipXefGL23Ut4l/GMw8lnkIfkjk7AX0mIg30sJwjAe78eQhPqO9A2NQJRf52E/G/NtrnWRHvM4zpwgvUUhn+B3VdlaSq9GUf4oHfKoTmX2ZJnepOsSGMsh70GWQkYiOfydg/eF8oljmXMJh77LYY+VjTLIQMtg3IQsjShd4hSafRkfySHvIv9GnkDuJQP+hcynijJ1CP/lGB9HFOby91qKQ1hcysPbn/L7db1QmSEqmF9HjqSQehQzFSiIpFRsyce6M+baiN6HPupRSKlQUhhUiKhwlKm0fBK5HfkT4XkVMxNI399irIJ0Iiq0Zf6Hd/o53qnecSxw90KMjyGFAhiRu0r7/u+tv9kfVSILCM//SMNZHCu/3Y/5IuHr1g1pEii313G4MiK/lSYqdGt9N/3zmc6j4lXKc3Jbchfv9xuYsQjC+zsOV0XktsIr0Td6Dm5fgZkY/FkZfy7icHlE7gvFYxp+nFg8zQbykhSKjyBbIRsj70dkp++o9F5K6Vr6jqR0vIA8iPyBPPMI+UUVZaoQtisx1kKUJvqmlc/DiMo7/SnFRZTipPJJx8+T1jthpgLvdBTvdD0Ola6bIR9ESj9B/dNVeVVp+g7yEvJ35A/Iw4TpNcxhiZWNMvgY3ovxHB9b4S8zTcioqqCl7b7KsRSa89LOeIT/YdxfPzjNFOIgZePzxOHmok18+JBXwb0vc7gdsgZx0AfcFDw/B+Nl5GHkt7gxkwLzbV1LC9L3Cdz9UHBaAH//i7Ex6fCvok3z4O7fcHfD4DQ1CJsqEoVPiu7F+HEzaZLaHzzvbSR+/BN3PxBYZQp+3U86SymLRVBhPEZ4JwVWfWD/H4wjcF8VYiJ4n+tg3Iw/KxRtiuDHFbj/2eA0VYjbqrh/AIefRFbFbynqTYMbUjJeRB5DpiF3E2ZVmokhXR4lXOsGp5lCPP6NXx8kvydu3SDc22MciugH6H24W2g9bpJ3CJPS9a88L6X2z2mEbSghjcz8H1K8MkkTZVBEfzobIIchvyYTq2BIkzgfQVykwZf+2mJDGuzHR6gWmYNInw2RphUNwXMTkDWRfTj9NW7ehts/RKoqlgSUmoDLwcv2pM37EwIzVQiXuqI+gOgP71zS5CzS433Fq6lR6CoYINL4MRofmBWQRmoOP430SeNvWH+5YemS+k8M4V0c+Q7v9mpOv008NkZiKRqCZ5dC1kOkFJ2LTMP9Q5HQdGuS1ONfA5Kk0K0XG8UZJe50DqWo74ysgsQtY5fg2XWQAwnX5cgluL81MpBpMqhY2ahEhVmiDNoIZDj18elP9hgy85YFy3TItODnA+lCFiD6Y36LeKj5OTZ8aF/D+D6yLm4tW7DsB37NRd5CXkJeQNR6ob+EyL8CpS+iJuSvIGeRxtsWLiRHTb/9UVOwmk2TkHmBQ3qsiLE3ciHprj+0tFC3Sabwrgv5jkO1PiRB33ekgkwarYSRRn5Ruapui/6E5Z/YqLLCmI4cT9g/gkR+/6TfHORN5HVE3Wx1v90gz2yOfAnZRHZxIU2V7gOZV94o2sSD8Opd/QC3DgzSoQqudSNKV5VPbwSitJ2NLAxuqwL31OI1FZEicwHvUV0yizzuRimDDDaRTPIymaFKe8Vef99qjtZHU/qo1T+oikZ/+aKDZ0dwr/6AVXmqL1vacGhm4j51o9zH9T2mpTCIiEz7PG5pTEEF+Xx+Fvb6S1HY1c+oAX15/JefEuWBgmDflx+4ruNS/EoidJ+6La4j3LHGn5DWG+L873BH/ecVYK+Wgr8idyKPIGp+lD9d3D+B6/pzWwNRK9GHEf2JSYGrgnvVbP4Fwvm3wCo2pO8ruKU+8D5w/23sVsH92H3cuKs8V9HkLnpyuec6OjvP41CVl/Kc0r/8fej9SDmWwqPWEbWcKc+tjHurY4ZCmDWO4/DpUyb/pWgTD96hulHm4ldVJYr9yRhSCPUtFAbPBVIKd0lEScEvnfcN9OO4FFehPu87guOmCcKrtFYrRiTc8xT3HMQ7VT970/A+1Y3yEG5UVK64eyvhT6U1Ez8OwjgGP6q+d4FfSuvnEI2pui8wVd5o7I7ykvKbvh8p5fp+QivUALWa7Ed6RFagjUCYXwrzh7DqnWp8kcbUKC/pfZfyeV+eCMwSyjMluzzP9vCs4iYpjKUirX+ji3EgrN/FOAB3K8on/FCYnkVUnvyJ609g9zrmfEx9p/pxUPk0GVGXn9J4kuKGWQH3qwzVu9mXsL5ZsFyEsbJRBhlMmUR9fRWFJ5lCsx4252PTQJ+mwE1VTkcg++OGRoT3gbuqVDWwUJlNlWsips58CmWjo6rwwZ+f4L7C0DKQLteQHrsHp30Q1mcwTuTadNK7bp8m7qjglMKhVpKteE7jbvrAvWux2ytpQSnw61Xc6t8Nof7sD+B+EmUjzF2F/Re8N/1VNoWUZowv8fyXcLdKmRNc+xPGbrivMR2xwB8p1prV0P970dik1UiTTAZCxyUIrxTGmsqG4L6HMDQm6fGiTePwPjUI8hH86a9s3IF72wSnscF9jW36Be6rJaYC/FA+fwq5Brkc/6Rw1AT3pJh+FZG76nbr6zLBPY172hF3VCkmAn+qlA3cV/1zAO5fWrQZfAinlIQzCKtaAPtaqAiqyiMNMD6Ta0+Qv0tKcCRB2n4O2QVZi+f6vhXc02D2rxN3jY1Z5HE3ShlkhCjFK0fGiNUsR0Z6BfkWh5/r7wb+jcPQzJd0xm70VncB4ac0/ZbSmvkApRBUDWQlrCrYDia9rmhE0RDcuwC5n7TU4Li9ceM6pDAIElMKwOVpKBpR4Ef5H1baxOqmIr6vI6eSJtsRvt8i+sutgGubYujvLQvkX0Pvb4Bp+D2RPuqWOA8FZc3AqhlCKyE8T1ze8u3oh+gUwhamaBRm1XBte76J7yN1FQ3Bff9Evslz6jL5PO7chJS+mQewT/wjVAO9k0RdHhmwP7IsadC/NeLHpMVXSavHGlE0RJC23+NQM+xOwU21hJSevQf3rg+OF3msbFQSWRiRKRKtKUGGuwWj6u8Ad6VspDITobctdEBUYc55cNwSEB41M4cNinyJdIrVTC6Fgmf18e7L6bf5oP+MqRkBmvmTCrgl5TALor7DqqbXZiBNniVNNE7jjKJNFftQeVV13yyqkB7NfgdTyEc/Cf5OUyDZgEVBHjwKQ1MwKyCcaiX9nq4Tz1jTsHnuLfKLWhw/w+mZuKkp5cdiX6WspkzW7jcMyqVaHvS+x5AO5S086oK6mLSIpUSTrirbTuJwN+RXuKeWxdNwL/X1XVoVKxuNofENafy9PtDfHU7Vbxc5sCsF0gh3qhBnNe2H5j01dQeHseDjnctHfQ6HahL+WtzCoUVIJV9QaH6PNA9TdDWu6JDi2fCG9Inq8tGaCj9F4ag1pqEC0jWxUhEG34bW79gF58NmRPycfH8W+b2hP+5a4MYc/Diew71x84GibTIIe626pmV+hkhfjWmTwtG/HFI5mniAK+n5D+RADtV1lNoaRUMBKxuNoQFIiT9iCJs6qUyczup94WpFJgVfQqLCtDwfeyoL8fAhz0aGxqCrkO6vgFRG71N5qElcA4TD2KdORRCHVsxzJaq+EvKcFP6PY2ohtAr47vV3K8VVs3gqxgMNNIRPlVRVSxT2jxPOHwanqUCe0QrBaVaGymOh+YKwt1TLK1TlEcKowdeH8K2oJToxpO0/g8Nhg5WNxpCikUjZIJPqb2RrMm3/D07uasZFciKKeAqjigF8LYBW1QsbR6A/7bNJq9Mp2DfAnKB0QxJ1J6QF6RiuzmVHmt/n9QQ/TPlaAfu0W9a0DHVLvLMGeZnC/2nMfQj3K0Wr/4N8ORLZkcNfki8bGVwapWwlzT+a6lqVJwjbuSgHLTUYN4LQ+JNeA7k+UD3UXS4JG+f1dWQGeeAIZF3KpXHIKCRRa+xwwbNRyiDTLE3Gf42Pt//oei1JPYkPOtaKlLirKXff5vC7uFPRuoG9NFzNRkncXLn7PU++0NHRqamPFeDHLzA0p1tLWWsVRVUEeu8SFYwyS9PHNMbjTeKayj4UYfChasXJu/EndNqeIBhaU0GVo1p9NPBNaS/RyqXqk1alIFPvRqO6u4I/+Mwg3JrmqmbWPgjnbOxWips3xNR7nv5Pe0f1DAncvox88fngNDGE/0WFNTgtgB/6q/xwnL9YFbI8HzYbRe9Mi6tpZpGmWWtKo/yRFPKajrFX96Tyn/KellTPtO8+CK+mvvafsfQk8dcMEqWRlqO+iHtW03l/uFdjGg4krJGzj1QRYTzIfRUtU0T2zmumTJbC0DS4qTDfjbwXd/umeRMe5bs1CH/sWUUDQZD2mprffzaK8oIGUN7FtYWcK3+U55OSqTyi+dBStjStNbNBpaT1ZRgfxbvQBQGDMKocUh4oLUsu0dpDWstE70KzGvVTpbJJ4z0WkmdS3zJgKOGWjcbQn1rdP5r+8IFJ692cZ7V/hBbe6a9o6G9E8/G1J0Fi2tsiZ9Oo4L8HmYmfMzFvC0SDVjWAUvJ7RNPlpnHPsZiZQUGhpb31IUZCmrwH0VQxrSr6CeTTiOa9a5XEs7jlYkRTxm4kvHcj11NInINMIc1b6U+plQgr7FTZp7qoEO9Haw1cghTyGO9G+esG5MbAlKilRQtSab+ZKznWktADQVirQ58defMujGMIz9NIWOvb7tifQx6rNVg4tPsLT1RpxkVTo/UH3b/LQeMrYiu6A0xV+UTYVQdp0Ot00lVlkGZnKL+obCqVU5Kbua78I9EaLlki/6U0hCq/hFksh2j9jI2QbZCpiKapH42pqbE/53mVpQq3yt0bKZvORDZWvVB0aXhhZaMMMkRYQaTMpXUL1LSvkekSVWoaNHYGGUf2pwXmjxB1A1yKqcL0z8gMnt8RqVglEnsNXNRqmJeh8SYphOqC3+OQ9yMfRFZANJdei42thqyOaD8SzSnfAFOL/AzE/gWXkAZVTdaNQjgXR/TBKw5SSD6JqJlTUz1vIv0PRyoW4GpdIvNdlPIYl6qWH/xQGZB6OuHusojynPaSWB5ZCVG+Ux7UO5uMrI9oJpZa4wZzPERF+qNwaBGr05CHyUth46n2xF7ffpRSG9WsnuR9StlQi2RFWcE/tqY5Z9qilzXkAX3LyiPKKyXReclOZVZhcUREraIpzQ6K5FpE032TtBZpeXL9MKlsVfm0HXIk9qoXrqZs2p78M6y6X6xsVBNV8OvP+ohAvo4cjmj9DGmy3wnMoxDtSqkFvLSWvubqVy3DTWZTE7KmlZ1NwSZNPRUipr7GIZO9Osoh3lrER3uY1GzhaBbSVQWUmqpPQX7LR63FdEyRqMquFVqCBnOPiKpykPz5awxNVaxqdSR/aYyLxnecG6FwRH2H/VslmkHKmMJZ4XZv98JEU/IHmLTKpyxn7+ndq7v5dOR23nGqihxuSgHZlcMLcPskyqfY+9gMNaxsVJLWxxAKmUtr6atyVZPhoWRqNTWnR8L/YMKkxcvU1J7O7Jg6EP/j+PCOxE81Nb6CpNbCg7vjkc2RE6gQUtkbBbcyzR8DQFT4B/zPmHct9D2oK1H5baD6s8PSILQcJH+qWf9kwlg1noWssCTyGa5dSP7qP8ssKh8nyd/6uhX2yrC23uDvWqT1/WSuYE3bYtK/ebdqiTgd8xEk1fUwyDtqodFmd2ohHxZr3VjZKKNWZUJm0+BJDWCKkpqFJdc1ZuJEZC+82YeCTItODQg9udzL+H8CchJyHnIRIs1ax9oNVAv4/IBb9Scn85d6biDgo74KQ4sI7YdohT315z+I+SzyH0RpG3vgIM+uiRxMhZB5a03aEO60u1Gq/sLxQhWgBrulCu7+EjkbUV7TsUzlt3MQjbk5FVFe0/GFfBOprOdQC/Ka8lHYNx753fOd3kbYlC/D0khLWWsA7wX9FA75E/bukigbatKXmxVldsfo0cvhd8uX40Hah0LaqjJX3iiVTRciGvNQyi8/QX7Mrar4f4Spfaoyh3f/BqJVdrUQ16H4rcW41Nqh7jVtCvkuIoU5bvmkweafQI7nHQ6l2Vux8GyUMnjh2ohN+1RUDfDC/mwMbVyla6UmX2Uyadkaf6Fmzu/wbNg8eI1N+AQZN9O51bvf/eQLHZ2hs1HOxW/tHTIkQNNfDkPpqX5q9dm+hziouVGFu9Y9UPprgJ4UCInmvqt5MrTS4FltoPc10kCD/2JD/tCI84rdPHE7hdkoT/23vaNDca4At39JmL8YnCaGdK3agwU/1LT/Mfxpeklq0iNqNorSZFXSJHUlJimkwRuEraJrk/A+R/xrDpLlOXWZnsazof3suKG9Sr5BnOdyr1bI1WyU/unye/yJ1a0XuDkDWRp3+9Z6wE3NgFBat/zUV+IQtTfKQaSLBny3POR5bQQpJUHxkGj9DY3pU7mgMkmi8knl1OKIZg5p7FJoC5TeH4a+k21IA204uchiZaOMKGUDO0272pgPuubOoXxMGlV9EvdW9SnixplkJjXLZUaNqa+n4LdWBFzkIM2lhGiaopYp1+qKYRvR6a/wYtLguKJNPLJTNiKnvsbaiC0Mwj4G97QJWcWiRNipRW5F/NH0vKaooWyoAH0/bg5Id1wzkF/ClI3nCWvkNGwRxFULox3M81FK7WVc+gKHWrvkHxxXtCRhdy3+fDo4bQr817R8tY5K+e4f/u1wVzM2WhrSPmzqteofrVSqDc4WKXhnSxI9/TRpELS2lP8U8Q/7kZWysT9poFkwiyzuRmkMFZqR8+rL+BkS1T2yOx/bRsGxSQk+0DeRvyAamKs+dG3/XAEfuFoNNNtmqBG3ebYK0mV1qsiw1Q9V+aa9ZoHWaonsmhhkmupGKYEymSNKh3H4/0jL0P57rmsTMzX9SxnQ+gv9if1jF7RcSCGscgN/vxwcmhZCPyCUS08jV3Cq5QfUlR02SFj1cNXGeosaVjaqCfuY+zbkqQWZSkrJcWQoLUhVAW7oz+lMtN3MBnSFrbNBWGIXcEMN0l9dARrUF0biEeyZpWV7ZCWU5qDJr8qjEJ5SRRocD1caUoxIJ80iO5TDq8gKoYvecf1gjFsx1bSeNlqvp8pfwrIt5Yp2bE0d3E1zLEFYPpdiusiXUZRNmuFyJodVP0Og+Gc6w6YVsLLRIHzQDX10ZCrt5ndl8ayKTXHnvOB4oFCFldosjyFAWGGsNIi1E+YAEVXYpqIETJ35tMYjVC2aRbrI3/OLZ6nSypVHrJaNEigcGiOh9VyuIPm0sm0VXK+a7h6QqOLG3f+H8SL+ai+XPrBXc73W+dEMh9TAvfVx9zpM/SSlUVeE5gv8GNLrhDSB4h/2Tat8brobc6hhZaMMMn0qhSQf//E4pcGkFWCvwmZPPl41qaVP9B9yS/65kg5nIEdTkPUtv5wE3CptmtWfN0l7rZzaqkS9tyTrMhQgTVQBXUD8w8YkPIH9rcFxmqTyHbUqUjgwjkA0y6YZRT50ZdFGwV91pUjhqNrjhvf4cYxL+JY0PiAR5JkVEM36uAl3P4X5BeKZxtihIVM+kY5LIlqccSfMRO+tBGmod9O33YHyDiLFUd1yGsS+SGNlo3Ga+fvR37XWj6jqC+fjVWY7igxcc0BaPEKbI2XXcNgHCj5ija7fE1GhfS3nmm++NelSaxnoSHhWlerFpK9WQO2Ppv7eHhynCv6lUbFGuRH7vamAJE3Ul38dYaxSwEgPdfn9mLxa8ZecEjjfO5RWR2w6ndVlSrpqvyOtWNtoHkicJvipael/xMsqJYdrW2P/G977qbz/NZGGy3fuHcFzmyEad6Z9SrRAYWHmEqbG+hzEtck6T0BoOuF+KpV5mpCO30G0+JYUynuJ+9HIas2kaQme6eRZzUI6r5SmuKm0kPKoVlcNnK3acXhRw7NRyiBDaGaDNtCpGldB3phEAdNUhsA9jV7/Ku5VFTK4pz+UL+NmaFNsHPDvWfxaNTjtA7+0h4gWEFPForDogylthNU3mE+HGCXpwFobaOnekp3yigo5uaEBc/dQWcVqAiWs2uzoM7hRGrH/Dn5ptoemCT+E3MI1Lab0En5UFaz66Llf/eIqAPdCtuL+NXWtHO7RtOSfks7HFG3iQ5irpo6CwrwyYYw/GyVkSqAg7JoOqD11GppCyv0a+S6lSyuo7oCsybNVrUbcp/f4c9LkkKJNPHgH2mDwXfzoP+tC+Uyzn9Q/rXcn/1SoKq/oL1bnpTymzbXU4leS8vwmKT2v45cI8+OYsSGt/4eX/WfkvIi7sQbokQbqwrgCN9UCUBPuux1/Ei8wRxyUB7XWhPK80qUK/NI0e61SrBks9yOq0NQiUxrcugz36Pv5EKK9PTbkfEXMqinYgmsah6YZXbFntRHuZ3C/YoM73NW71UaR6n4u/eWXdl0tvXvBo8WN2DD07Sve5flH5yrLtB6S8uNswnovZtMQTm3KNw23CpvzlcDd5zCUpzUJ4E7kKe7RcvEV5VOgkGj20hqYn0R2RrRseV/ZwTUp+4qvyo+jCKuWSF+ksbJRBplMyoYqlP6Fp1oq1idDNLVOBu5pmuR9uKcPugLcVCF9Hhn16MAqMfinzF9V4Qr8U4VVPuCw9N5LhbuQWS6iZOp+NeurECiNgTiYNHkMsykIpwq0OwmrWjdCIbyarqrmYn2MUsgkKoi0robmsWtAldJX6w5EbpKHOypodyOciftECbd2DK1YRwX3tRPsBxIqGy/gRtiUZRVi2jlVBZMqaaW7lLxC4cb1gqKIoXcoBVnpovSI3OtEz2BoA7QDSJNEim6gbEg5rxqjgL0qNuUV+ScpL5D75zGFX5TblZ5TnispKDcS5q9ixoLwqgLQrs79p46+gLtV6d8ovD9VIjfj7npFm3Dw51b8UeWTGPzU/kVqhdAquaU0qwI/NStGeVPvQ4q30lM/C1qETN+S9vAIm6XUB26o/JPifzrhj10pEmZNB1YFXAV+KIwKm/KJRO+7P+X5IyzOeq6U52YR1liKHeG8CGNXwhparhBWua/yTy3XSl99R0ojlUlK1xE8O47bVJ9IgZMyVAHX9E1rx+qr0qwDWpnSR26AFx+VHsrEkR90FGR2VZRa9a5qGhx+jcde02HT3O0yso8f/yYipU2OJFpoRqK9RLRttUQLY2lzM92rjbQkywSiY13Xx6MBh/qL1qI1cdDfjVbfi1x2GD8UDv2Zb4Loz0t706glRJvaaRdY2et6LUXjYYzjeQ9pDb4qrzBLxMob/YiaSqk/N/0RFTYsQz6GaNbBFAnHWn1QpiocbYm9DlJL0VA+VIualspPq0UtLE0U9qUQ5RflK+WxUn6TKP+V5zu96/75Tsey033Kc2p5iK0QlBEW3t7gbzQWpKW2ET+K9K23KFNoWsUBP1X5a8E3bWgYuWEY6aZNzrQJ3nqIvplNEeWVdRFtbhapaOCu0FgCtWbsgZ+xFQ0pehi1yict/65yRu+9lG/6S6l8KuWV/lIqn5RXYm0uSDhL3bhvKPLBcQW4L5SHlYabIdsj2vV1J0StTVtwmza11MaDVYpGgBQV7Q+lVZuHBVY2yiBvqe+wKoORYVRIxOpX5ANVd4GW5A5DH8VhKBxVTegxCf04MmI06aI/6aYhTe7DOBy5lDR/BFNKWSrgnpY3fw5RF8S++KXmzrQIKyyV5lXdZI1C4aZWtMwHyJEeT2Foc6lDSJOqqdkJGLDBfYQ91nieMlTehYVX7zCRwkiaaqDtj0nnWuvxpKZsCPx8BtHAzUPw91YklVVEced15I8caprvVvjxEyT2Ds1lpBr/OkygXG16Oum04ng7rRarZcqvJh1ekH1a4N5sRJMHpMCdFvg3LLCyUQaFmQr+qg+CzKE/8NgVCu5+Aze050d/lP7qStDa+BVdNzEJ/UPOCPWNxi6gKby0ENdXOJyKO8ci1yCPI3EKTI33eAa5hWPtwLsjbms8jPqs00RNtP1Rmje0DksEygNqUk0V0uJt5HlEgwlPxmov0uMHSbp7QlAz/IDlOeIR+WfcCDwfldapbOzFd67m918hocoz11N/z4L3qvEFe3Oo/Tu0yaP2FWoqTtz/JqLvT0r6AYi+ofORtBRTlRUDWT6JWGU2cdZ4j2tIU+3XtC9pcgZyH/IS0rRywDNKW5VPqgOORfbE/cuQVPLdUMFjNspAE1bT2wVIYYCR7EAtGho7cAKZI/Z26LitgXtqMlP3g9AfljKbRKs4XkZFUHM59HrghwakanyIFCY13+ljKx90V6L0zktm+bUwBaJkpzBL1PcrjV8DL1Op0INm7BX5INfF1IwS9e2qi0RdNXofiovCoXELKrTUDSDFRE3Xj5J+6jLRAlWZ/SmQvhdiaLyJwqq/Jpnqhz4ubiUuJZM4a5rh6ojeh1qMNBai/zsrKMFc6/teuUd2JVFFXMhLiMaAzOL6k5ivELZaf9uxIewKpyonDTQspYnGjpQG7JXon99E+XUdl877P6f8prjpvd9JftPmbbEI0lozlrR0uxRHtcypj/1x7I4inQppnAT8kNvalkCDC6WEKj00GHse9ncT/izWNelD3xH+aNzWRwJRl6XKHIWllGcVT31DKuPUYqFxVxrb9BjhfDWNdOgP4dJ4Ge0vpTFP+pbVSqXvuvzdl+ePcsrzRIn++USifCJR+DVY/jDiorIqMXz7GuejLs11iIfKWM0mlJ3ykOqIUndJKa9K4VT37dM8gxK3kG9x1AuEJ4vZX0MCKxv90MeKoYxcSpfCcUoFkdwuUfEB4b4yaSLKwt4M9e6Pyh+ppEkUZXGRsqHCSYWVwqIBkqqASh9tpuEop9/76yOp/02+t9J9g/Je+lOWJo2Ev9E4lqiIY4rfSDkKU+pp1s+fTPyoR1m+0iBijc1QpSg7hUMVovb16U4jXRsh47wiyvNLZuldlq5S3saStqV0lf8FZYN0lTKrlqwBf++tipUNY4wxxmRKSdM0xhhjjMkEKxvGGGOMyRQrG8YYY4zJFCsbxhhjjMkUKxvGGGOMyRQrG8YYY4zJFCsbxhhjjMkUKxvGGGOMyRQrG8YYY4zJFCsbxhhjjMkUKxvGGGOMyRQrG8YYY4zJFCsbxhhjjMkUKxvGGGOMyRQrG2bYsse9szqmznz6TGT/wMoYY0wGWNkww5ruBfPG9HR1/Tc4NcYYkwHtV2++Rm9wbMyw4xMXXX3W6CUmXnLrZz7xRGAVmz3unbVUb2/vxhxObG9v/w/HL2D+e9oWk+YU72icqTOfHouxEs+3Yy7ErR4dY3Zy3sFhF+6+oHuTgl8fnD5l8nPBaSJIg3GEcQTuvRNYVbDHjX+b2Dt+7vzpU6a8G1jFgjAvRhosH5zmkQ75i7kA+9dIm+7ClQTgxwcwuonLK0WbSohrZ9vcuctN2+Ej/w6smoLnx2Asl9Z7NKaVccuGGbaoslhm0jpbjZm41AqBVWyomKZQ2f2Gw32QVTj+CJXegZgncG1y4abm2Ag5muePR47i+GzMCzBPwt3jOD4Cd9+nG5OAG7tinIa5WdEmGYRrX4zTcW+lok0lvePHH93W9p4Dg9Mk7IRf5yPfRr6OfBO7Q5BjOT5Wil/hrpjwvMrGU5DDCxYh4M+neseO/X5w2jQ8rzicGJwas0hjZcMMZ9RqMLqzc7T+iGNDxapWiOPa8vnrMQ/jT/hkFIIzqUh+0NbVJQXhX7qvGXBjJoYqOirQuSdgLtM9Z84c3D0Ud7+OeSL3vKp740K4F8NQxf8osj8VbKJ0CFgRUYvD14M/9wp68zkpYqsHp0lYFWlvmz//VNLhSORrnB/H+Q8xl8ePz+imBChvKB61FLrV8GflQDGJg9xOrDAaMxSwsmGGO/oGEn0HVPzjMCa0d3b+jkqv0D0wbYtJOY5nT99uvWcwF8iuWXjunaJs8BqnvSPGjMnh7luyw3y7eFd8CPfaGKpQL0XWouJM3MIDcu8xZINcLlfVWpKbN3d899zZSwanSRiF5NvGjHl9zz/8o13S0dExv2PcuJexfwjZUTclREqk3m0UY3u7uydgSjGJw8h8T/f44NiYRRorG2Y4o/FKqijiVhYlchIq6zQq0Sg6ent7NF4jNfL5/H4YD1NJq4Kek1u4YO/ChWRMxGEpV9d3dnYeNXXm08sWrYvkFi4cnVswP3kFmy+8s1otMVICkjISqeVHnnceuzUon8t19nR1jQ5OjVmksbJhhjuJWzbU2oDxCHI8letqCZrVa9GRz6f3vRLGpdvb2/X3f0nRpu3ajhGj9sFeFWwCesf35HIr4PbFyKie+fO/HVwo0Nu9cFS+a75aDBLR3tleUPAQDUgdiYwKTCk3WyK3IEmRchep4BE/lI1cbAUQZWNEvieXRteVMS2PlQ0znNHfcWJlQ1DxfA9DYzPOosK7AKVj1/5/9QkhjL2pfa+EUQM5CXb733WOeV1HR8d7sJ+k87jkFy5YLDf/3QkoYHPacrlTOseM+ewedz6+eXC5rTef7+jpWqixIokgnF0YGu+ggbO/CuQXyBXYaabKL3VfQqRIRLZ64Ve+rSfBO8nnRio9gjNjFmmc0c1wJ41uFLVu/G/6lMkntXV1fTPX1fUwVjsj5+1x76xjkFr9/o3STk2dOJwCJWgJjIOQO6iUF8oO87Werq7/cfhFncelp7uns2fhwkI3ybStPnQ7xt29I0ZcPvWWv79fdnjUnc91a7xFUuTGgrZ8/o58LvfH3Lx3H8vnuv6cz+fvwX4CisBehbuSofKxVstGRz5fmIocC8Io9730gBkWWNkww5nimI2enuJZCmhA6HXbrXc+FdEhbd3dp1KhrIv8NIWulY5gnEIabIIshWpwLZXzaMI3AnPM/NdffQD7nQhrfGVAPQs9ub64tr/77hEYGsj5c6VB52Jj5rR1dKr7IzZyp7enZzzhnt/W0TFtxtZr//y6HTY8dcbW650/Y8u1Tm3L5U7itn25L+kYmnbSJTIt8H9Mb2+Clol8vqO9oyO9zGdMC2NlwwxnCpV3vr099t9pFNO2mLRw+jbrqIXjLERjCKqmgTYDyks7tVtayoaWZ1+Cn3aNp/h9vqf7tu65c+8aveTSm3K+MpWoWmVi0dHWmS8P57SdNnw9t2DOZzncKJfLbT9izNg5o8ZP0BiXROQWzF+sN5fT4mZVi3e1jxyprqHS+I24SBF9h4iMQWkJzR8oPCu09/Y2vWBbGZ1kvR7cTzhOxpjWx8qGGe6oZSONZv0oNDND7if+1nrb4jfZl5g68+n3YmyS7174cPec2XPnv/HfkbNf+teEua+/0rFw7vwn8z09Wrvjm1EVbF0KOlFPxaDHkWMW/3PPgnlXd3Z2njpysbELFlt6WU3lTUS+J9fZm+uWQlGlgGGn9FYFHrsFBWVRq5Le197RsSzuTSza/h+kz7j2zs6PjlpiyTu5N17rREdHm1s2zHDByoYZ7vS05fOJBixSgS+HrIgsVv6XyrGmX6oVQctRF8ZGxIUKj1q1XRVgUtR6kevobfvyqMWXmDpm2c5d25cavV1b78jtuufN/zwencn1FfBuzcLdzdLRrhaBinEIqrg7Fxv7Yw67cXf9zlGLxVreu4qO9vzcuXOXDNJ9NDIKUQuSBr9K0Ui6583FyFzkaNydiIxERiBLE49jsde01SuRmHT0dowYkWt7++3xgdsSxcEtHWaRw8qGGe7MaxvZkUgRgA0QrVx5JZXQBbvf89SPqAA1K0WLZa3XlssdRYWr2RNJmN05dmyi7gcqMX3vWyO/n77turP0Rz59yqazb9952//decAOb0s6R468ieuqpD+KNE3n6DFvjhyz+Bv9K8zpUya/lM/nz+FQClPovinNMGLMuDn4teS4ceMu4nQ6aT0DUfrP4Hx//LoYP+cVbo4Jz8/CnZM53AR3f49cjmjWyzTstsnncmdwz5OFm2Mwcty4tzpHjR7bu8QSP8fNy5ArkEuRi8g/U4LbjFkksLJhhi1Utrmud9/56cLZc7U0eGyocG5uW7jw5PyCBb/v6e5SH/4yVBjz893dWr78K9O3Xvv+wo3JOKe9vf3C4DgWamHAuA75UcEiBO55vr2nR3uxxApzT1fXuZ0jRv4cd6rGUnR0dEwjTU7l8NaiTTwUjxFtbTOo7C/ILVjwx9y8efd1vfPWg8ishXPeuSs3f/5hM7ZcS0pIYnDnqra2rs9xOI13uqAX5RR/p2O334yt19ZS9Em4ATk7n8/dnc913ZdbMO9vxOVRwq/l40M3fzNmqOJdX40xxhiTKW7ZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMpljZMMYYY0ymWNkwxhhjTKZY2TDGGGNMhrS1/X/SFHBXXWeCdAAAAABJRU5ErkJggg==';
    
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
        
        <!-- Chat Container - SABIT LAYOUT -->
        <div class="cw-chat-container" style="display: none !important; flex-direction: column !important; height: 100% !important; width: 100% !important; position: relative !important; overflow: hidden !important;">
          <div class="cw-messages" id="cw-messages" style="flex: 1 1 auto !important; overflow-y: auto !important; overflow-x: hidden !important; padding: 15px !important; background: white !important; display: flex !important; flex-direction: column !important; gap: 12px !important; min-height: 0 !important; position: relative !important;">
            <div class="cw-welcome">
              <div class="cw-welcome-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <h3>Merhaba! </h3>
              <p>Size nasıl yardımcı olabilirim?</p>
            </div>
          </div>
          
          <div class="cw-input-container" style="flex-shrink: 0 !important; display: flex !important; padding: 15px !important; border-top: 1px solid #e2e8f0 !important; background: white !important; align-items: center !important; gap: 10px !important; position: relative !important; width: 100% !important; box-sizing: border-box !important;">
            <button type="button" id="cw-end-chat-btn" class="cw-end-chat-btn" style="padding: 8px 12px !important; border: 1px solid #dc2626 !important; border-radius: 20px !important; background: white !important; color: #dc2626 !important; cursor: pointer !important; font-size: 12px !important; font-weight: 500 !important; display: flex !important; align-items: center !important; gap: 5px !important; flex-shrink: 0 !important; transition: all 0.2s ease !important;">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 14px !important; height: 14px !important; fill: currentColor !important;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Sohbeti Bitir
            </button>
            <input type="text" id="cw-input" class="cw-input" placeholder="${this.config.placeholder}" style="flex: 1 1 auto !important; padding: 12px 16px !important; border: 1px solid #e2e8f0 !important; border-radius: 25px !important; outline: none !important; font-size: 14px !important; background: #f8fafc !important; display: block !important; visibility: visible !important; opacity: 1 !important; min-width: 0 !important;">
            <button type="button" id="cw-send-btn" class="cw-send-btn" style="width: 40px !important; height: 40px !important; border: none !important; border-radius: 50% !important; background: #AF3F27 !important; color: white !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; visibility: visible !important; opacity: 1 !important; position: relative !important;">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 18px !important; height: 18px !important; fill: currentColor !important;">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
              </svg>
            </button>
          </div>
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
    const sendButton = document.getElementById('cw-send-btn');
    const endChatButton = document.getElementById('cw-end-chat-btn');
    const chatInput = document.getElementById('cw-input');
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
    
    continueButton.addEventListener('click', (e) => {
      console.log('🖱️ Continue button clicked!', e);
      console.log('🔘 Button disabled?', continueButton.disabled);
      console.log('🔘 Button classes:', continueButton.className);
      
      e.preventDefault(); // Form submit'i engelle
      
      // Disabled ise zorla enable et
      if (continueButton.disabled) {
        console.log('⚠️ Button was disabled, forcing enable...');
        continueButton.disabled = false;
      }
      
      this.handleFormSubmit();
    });
    
    // Chat input event listeners
    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    }
    
    // End chat button event listener
    if (endChatButton) {
      endChatButton.addEventListener('click', () => this.handleEndChat());
    }
    
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }
    
    // Initial validation
    this.validateForm();
  }

  // Start polling for new messages
  startPolling() {
    try {
      const url = this.config.pollingUrl;
      const interval = this.config.pollingInterval;
      
      console.log('🔄 Starting polling to:', url, 'every', interval, 'ms');
      
      if (!url) {
        console.warn('Polling URL not configured');
        return;
      }
      
      // Store processed message IDs to avoid duplicates
      this.processedMessages = new Set();
      
      // Start polling
      this.pollingInterval = setInterval(async () => {
        try {
          await this.checkForMessages();
        } catch (error) {
          console.error('❌ Polling error:', error);
        }
      }, interval);
      
      console.log('✅ Polling started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start polling:', error);
    }
  }

  // Check for new messages via AloTech polling
  async checkForMessages() {
    try {
      const url = this.config.pollingUrl;
      
      if (!this.chatToken) {
        console.log('⏳ No chat token available for polling');
        return;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.chatToken
        })
      });
      
      if (!response.ok) {
        console.warn('⚠️ Polling response not OK:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('📨 AloTech polling response:', data);
      console.log('📊 Response type:', typeof data, 'Is Array:', Array.isArray(data));
      
      // AloTech returns messages in a list format
      if (Array.isArray(data)) {
        if (data.length === 0) {
          console.log('📭 No messages in response (empty array)');
        } else {
          console.log('📬 Found', data.length, 'message(s) in response');
        }
        
        for (const message of data) {
          // sistem/kuyruk mesajlarını atla
          if (
            message.message_status === 'queued' ||
            message.sender === 'system' ||
            message.text?.toLowerCase() === 'queued'
          ) continue;

          // Typing indicator kontrolü
          console.log('🔍 Checking message:', {
            type: message.type,
            sender: message.sender,
            name: message.name,
            text: message.text,
            fullMessage: message
          });
          
          // Typing signal kontrolü için detaylı log
          if (message.sender === 'agent') {
            if (message.type === 'typing') {
              console.log('✅ TYPING SIGNAL DETECTED!');
            } else if (message.type === 'text' && message.text) {
              console.log('📝 TEXT MESSAGE DETECTED:', message.text);
            }
          }
          
          // Typing signal kontrolü - farklı formatları da kontrol et
          const isTypingSignal = (
            (message.type === 'typing' && message.sender === 'agent') ||
            (message.sender === 'agent' && message.text === null && !message.message_body) ||
            (message.sender === 'agent' && message.typing === true) ||
            (message.sender === 'agent' && message.status === 'typing')
          );
          
          if (isTypingSignal) {
            // Agent yazıyor bildirimi göster
            const agentName = message.name || 'Temsilci';
            console.log('💬 Agent typing detected:', agentName);
            console.log('🔍 Typing signal format:', message);
            this.showTypingIndicator(agentName);
            continue; // Bu mesajı işleme, sadece typing indicator göster
          }

          // Mesaj ID kontrolü - duplicate mesajları engelle
          if (message.msg_id && this.processedMessages.has(message.msg_id)) {
            continue;
          }
          

          // Agent mesajı geldiğinde typing'i gizle ve mesajı göster
          if (message.text && message.sender === 'agent') {
            console.log('📨 Agent message received, hiding typing and showing message...');
            
            // Typing indicator'ı gizle
            this.hideTypingIndicator();
            
            // Temsilci adını al
            const agentName = message.name ? message.name.split(' ')[0] : null; // Sadece ilk isim
            
            console.log('🔍 DEBUG - Agent message processing:', {
              fullName: message.name,
              agentName: agentName,
              messageText: message.text
            });
            
            // Mesajı olduğu gibi göster (kişiselleştirme iptal edildi)
            console.log('📝 Agent message received:', { agentName, text: message.text });
            
            // İlk agent mesajı flag'ini işaretle
            if (!this.hasReceivedAgentMessage) {
              this.hasReceivedAgentMessage = true;
            }
            
            // Mesajı göster (agent adı ile birlikte)
            this.addMessage(message.text, 'bot', agentName);
            
            // Mesajı processed olarak işaretle
            if (message.msg_id) {
              this.processedMessages.add(message.msg_id);
            }
            
            continue;
          }
          
          // Diğer mesaj türleri için normal işlem
          if (message.text && message.sender !== 'agent') {
            this.addMessage(message.text, 'user');
            if (message.msg_id) {
              this.processedMessages.add(message.msg_id);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ AloTech polling request error:', error);
    }
  }

  // Stop polling (cleanup)
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 Polling stopped');
    }
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

  async sendMessage() {
    const input = document.getElementById('cw-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Kullanıcı mesajını ekle
    const messageElement = this.addMessage(message, 'user');
    input.value = '';
    
    // Chat session aktif değilse eski bot sistemini kullan
    if (!this.chatSessionActive || !this.chatToken) {
      this.sendOfflineMessage(message);
      return;
    }
    
    // API'ye mesaj gönder
    try {
      await this.sendMessageToAPI(message);
      
      // Mesaj gönderildikten sonra typing animasyonunu başlat
      this.startTypingAfterUserMessage();
      
    } catch (error) {
      console.error('Message send error:', error);
      this.addMessage('Mesaj gönderilemedi. Lütfen tekrar deneyin.', 'bot');
    }
  }


  // API'ye mesaj gönderme fonksiyonu
  async sendMessageToAPI(messageText) {
    try {
      const requestBody = {
        token: this.chatToken,
        message_body: messageText
      };
      
      console.log('📤 Sending message...', requestBody);
      console.log('📡 API URL:', `${this.config.apiUrl}/put_message`);
      
      const response = await fetch(`${this.config.apiUrl}/put_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Message Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Message API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      
      // Önceden: mesaj gönderilir gönderilmez typing göstergesi açılıyordu.
      // İstenmeyen davranış: sadece temsilci yazmaya başladığında görünmeli.
      // Bu nedenle burada typing göstergesi tetiklenmiyor.
      
      return result;
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Offline durumda otomatik bot cevabını devre dışı bırak
  sendOfflineMessage(message) {
    // Eskiden burada otomatik bot yanıtı üretiliyordu.
    // Artık sadece logluyoruz; gerçek cevap SSE/webhook üzerinden gelirse gösterilecek.
    try {
      console.log('Offline mode: no auto-reply. User said:', message);
    } catch {}
  }

  addMessage(text, sender, agentName = null) {
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
      this.getUserAvatar() : 
      'CR'; // City's Residences
    
    
    // Temsilci adı varsa göster
    const agentNameDisplay = (sender === 'bot' && agentName) ? 
      `<div class="cw-agent-name">${agentName}</div>` : '';
    
    messageElement.innerHTML = `
      <div class="cw-message-avatar">${avatar}</div>
      <div class="cw-message-content">
        <div class="cw-message-bubble">${this.escapeHtml(text)}</div>
        <div class="cw-message-time">${time}</div>
        ${agentNameDisplay}
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    return messageElement;
    
    this.messages.push({ text, sender, time });
  }

  addBotResponse(userMessage) {
    // Basit bot cevapları - gerçek bir chatbot için API entegrasyonu yapılabilir
  
    
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
      <div class="cw-message-avatar">CR</div>
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

  // Kullanıcı avatarını al (formdan girilen adın baş harfi)
  getUserAvatar() {
    // Önce customerData'dan adı al
    if (this.customerData && this.customerData.name) {
      const firstName = this.customerData.name.trim().split(' ')[0]; // İlk kelimeyi al (ad)
      if (firstName.length > 0) {
        return firstName.charAt(0).toUpperCase();
      }
    }
    
    // Fallback olarak config'den al
    return this.config.userName.charAt(0).toUpperCase();
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
  
  async handleFormSubmit() {
    console.log('🔄 Form submit triggered!');
    
    const form = document.getElementById('cw-contact-form');
    if (!form) {
      console.error('❌ Form not found!');
      return;
    }
    
    const formData = new FormData(form);
    
    // Form verilerini obje olarak tut
    const customerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('countryCode') + formData.get('phone'),
      permissions: {
        kvkk: formData.get('permission1') === 'on',
        commercial: formData.get('permission2') === 'on',
        consent: formData.get('permission3') === 'on'
      }
    };
    
    console.log('📝 Form data:', customerData);
    
    // Customer data'yı hemen sakla (avatar için gerekli)
    this.customerData = customerData;
    
    // Direkt chat ekranına geç
    this.showChatInterface();
    
    // Karşılama mesajını hemen göster
    this.showWelcomeMessage(customerData);
    
    // Arka planda API çağrısını yap
    try {
      await this.startChatSession(customerData);
      console.log('✅ Chat session started in background');
    } catch (error) {
      console.error('❌ Background API error:', error);
      // Hata durumunda kullanıcıya bilgi ver ama chat'i kesme
      setTimeout(() => {
        this.addMessage('⚠️ Bağlantı kurulurken bir sorun oluştu, ancak mesajlarınızı gönderebilirsiniz.', 'bot');
      }, 1000);
    }
  }
  
  // Chat arayüzünü göster (loading'den sonra)
  showChatInterface() {
    console.log('🎯 Showing chat interface...');
    
    const container = document.getElementById('cw-window');
    if (!container) {
      console.error('❌ Chat window container not found!');
      return;
    }
    
    console.log('✅ Container found:', container);
    
    // Mevcut chat arayüzünü göster, form/loading'i gizle
    const formContainer = container.querySelector('.cw-form-container');
    const loadingContainer = container.querySelector('.cw-loading-container');
    const chatContainer = container.querySelector('.cw-chat-container');
    
    console.log('📦 Containers:', {
      form: formContainer ? 'found' : 'not found',
      loading: loadingContainer ? 'found' : 'not found', 
      chat: chatContainer ? 'found' : 'not found'
    });
    
    if (formContainer) {
      formContainer.style.display = 'none';
      console.log('✅ Form container hidden');
    }
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
      console.log('✅ Loading container hidden');
    }
    if (chatContainer) {
      // Chat container'ı göster - SABIT LAYOUT
      chatContainer.style.setProperty('display', 'flex', 'important');
      chatContainer.style.setProperty('flex-direction', 'column', 'important');
      chatContainer.style.setProperty('height', '100%', 'important');
      chatContainer.style.setProperty('width', '100%', 'important');
      chatContainer.style.setProperty('position', 'relative', 'important');
      chatContainer.style.setProperty('overflow', 'hidden', 'important');
      console.log('✅ Chat container shown with STABLE layout');
      
      // Input alanını da kontrol et ve zorla görünür yap
      const inputContainer = chatContainer.querySelector('.cw-input-container');
      const inputElement = chatContainer.querySelector('#cw-input');
      const sendButton = chatContainer.querySelector('#cw-send-btn');
      
      console.log('🔍 Input elements:', {
        inputContainer: inputContainer ? 'found' : 'not found',
        inputElement: inputElement ? 'found' : 'not found',
        sendButton: sendButton ? 'found' : 'not found'
      });
      
      // Input container'ı zorla görünür yap - SABIT
      if (inputContainer) {
        inputContainer.style.setProperty('display', 'flex', 'important');
        inputContainer.style.setProperty('flex-shrink', '0', 'important');
        inputContainer.style.setProperty('padding', '15px', 'important');
        inputContainer.style.setProperty('border-top', '1px solid #e2e8f0', 'important');
        inputContainer.style.setProperty('background', 'white', 'important');
        inputContainer.style.setProperty('align-items', 'center', 'important');
        inputContainer.style.setProperty('gap', '10px', 'important');
        inputContainer.style.setProperty('position', 'relative', 'important');
        inputContainer.style.setProperty('width', '100%', 'important');
        inputContainer.style.setProperty('box-sizing', 'border-box', 'important');
        console.log('✅ Input container PERMANENTLY visible');
      }
      
      if (inputElement) {
        // Input'u zorla görünür yap - KALICI
        inputElement.style.setProperty('display', 'block', 'important');
        inputElement.style.setProperty('visibility', 'visible', 'important');
        inputElement.style.setProperty('opacity', '1', 'important');
        inputElement.style.setProperty('flex', '1 1 auto', 'important');
        inputElement.style.setProperty('padding', '12px 16px', 'important');
        inputElement.style.setProperty('border', '1px solid #e2e8f0', 'important');
        inputElement.style.setProperty('border-radius', '25px', 'important');
        inputElement.style.setProperty('outline', 'none', 'important');
        inputElement.style.setProperty('font-size', '14px', 'important');
        inputElement.style.setProperty('background', '#f8fafc', 'important');
        inputElement.style.setProperty('min-width', '0', 'important');
        
        console.log('✅ Input element PERMANENTLY visible');
        console.log('📝 Input element STABLE style:', {
          display: inputElement.style.display,
          visibility: inputElement.style.visibility,
          opacity: inputElement.style.opacity,
          flex: inputElement.style.flex
        });
        
        // Input'a focus ver
        setTimeout(() => {
          inputElement.focus();
          console.log('🎯 Input focused and STABLE');
        }, 200);
      }
      
      if (sendButton) {
        // Send button'u zorla görünür yap - KALICI
        sendButton.style.setProperty('display', 'flex', 'important');
        sendButton.style.setProperty('visibility', 'visible', 'important');
        sendButton.style.setProperty('opacity', '1', 'important');
        sendButton.style.setProperty('width', '40px', 'important');
        sendButton.style.setProperty('height', '40px', 'important');
        sendButton.style.setProperty('flex-shrink', '0', 'important');
        sendButton.style.setProperty('position', 'relative', 'important');
        sendButton.style.setProperty('align-items', 'center', 'important');
        sendButton.style.setProperty('justify-content', 'center', 'important');
        console.log('✅ Send button PERMANENTLY visible');
      }
      
    } else {
      console.error('❌ Chat container not found! Cannot show chat interface.');
    }
  }

  // Karşılama mesajını göster
  showWelcomeMessage(customerData) {
    // Önce welcome div'ini temizle
    const messagesContainer = document.getElementById('cw-messages');
    const welcome = messagesContainer.querySelector('.cw-welcome');
    if (welcome) {
      welcome.remove();
    }

    // Kişiselleştirilmiş karşılama mesajı
    const customerName = customerData.name || 'Değerli Müşterimiz';
    const welcomeMessages = [
      `Hoşgeldiniz  ${customerName}!`,
       
    
    ];

    // Mesajları hızlıca sırayla göster
    welcomeMessages.forEach((message, index) => {
      setTimeout(() => {
        this.addMessage(message, 'bot');
      }, index * 500); // 500ms aralıklarla daha hızlı
    });

     
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
        
        // Aktif chat session varsa sonlandır
        if (this.chatSessionActive && this.chatToken) {
          this.endChatSession();
        }
        
        // Verileri koruyoruz - sadece pencereyi kapatıyoruz
        // customerData ve form durumu korunuyor
      }
    }
  }

  getMessages() {
    return this.messages;
  }

  // Chat başlatma API'sini çağır
  async startChatSession(customerData = {}) {
    if (this.isConnecting || this.chatSessionActive) {
      console.log('Chat session already active or connecting...');
      return;
    }

    this.isConnecting = true;
    
    try {
      const requestBody = {
        cwid: this.config.cwid,
        security_token: this.config.securityToken,
        namespace: this.config.namespace || '',
        client_name: customerData.name || this.config.userName || '',
        client_email: customerData.email || '',
        phone_number: customerData.phone || '',
        customer_path: window.location.pathname || '',
        client_custom_data: JSON.stringify(customerData.customData || {}),
        lang: this.config.lang || 'tr'
      };

      // Customer history varsa ekle
      if (customerData.history && Array.isArray(customerData.history)) {
        requestBody.customer_history = customerData.history;
      }

      console.log('🚀 Starting chat session...', requestBody);
      console.log('📡 API URL:', `${this.config.apiUrl}/new`);
      
      const response = await fetch(`${this.config.apiUrl}/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.token) {
        this.chatToken = result.token;
        this.chatSessionActive = true;
        this.customerData = customerData;
        
        console.log('✅ Chat session started successfully!', result);
        console.log('🎫 Token received:', result.token);
        
        return result;
      } else {
        throw new Error('No token received from API');
      }
      
    } catch (error) {
      console.error('❌ Failed to start chat session:', error);
      
      // CORS hatası kontrolü
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.error('🚫 CORS Error detected - API server may not allow cross-origin requests');
        this.addMessage('Bağlantı hatası: CORS sorunu. API sunucusu ayarlarını kontrol edin.', 'bot');
      } else if (error.message.includes('404')) {
        console.error('🔍 404 Error - API endpoint not found');
        this.addMessage('API endpoint bulunamadı. URL\'yi kontrol edin.', 'bot');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('🔐 Authentication Error - Invalid credentials');
        this.addMessage('Kimlik doğrulama hatası. API anahtarlarını kontrol edin.', 'bot');
      } else {
        this.addMessage('Bağlantı kurulurken bir hata oluştu. Console\'u kontrol edin.', 'bot');
      }
      
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  // Sohbeti bitir butonuna tıklandığında çağrılır
  async handleEndChat() {
    console.log('🔚 End chat button clicked - ending immediately');
    
    // Hemen local state'i temizle ve uğurlama sayfasını göster
    this.endChatSessionLocally();
    
    // Uğurlama ekranını hemen göster
    this.showFarewellPage();
    
    // API'yi arka planda çağır (müşteriyi bekletmeden)
    this.endChatSessionAPI();
  }

  // Uğurlama sayfasını göster
  showFarewellPage() {
    const container = document.getElementById('cw-window');
    if (!container) return;

    // WebChat header'ından logo base64'ü al
    const headerLogo = document.querySelector('.cw-header-logo');
    const logoSrc = headerLogo ? headerLogo.src : '';

    container.innerHTML = `
         <div class="cw-farewell-container">
        <!-- WebChat ile aynı header yapısı -->
        <div class="cw-header">
          <img class="cw-header-logo" src="${logoSrc}" alt="Logo">
          <button class="cw-close-btn" id="cw-farewell-close-btn" type="button">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
          </button>
        </div>
        
        <div class="cw-farewell-content">
          <div class="cw-farewell-message">
            <p>City's Residences İletişim Merkezi'ni</p>
            <p>ziyaret ettiğiniz için</p>
            <p><span class="cw-farewell-highlight">teşekkür ederiz.</span></p>
            
            <div class="cw-farewell-logo-container">
              <img class="cw-farewell-logo" src="data:image/png;base64,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" alt="City's Residences Logo">
            </div>
            
            <p class="cw-farewell-info">Projemiz hakkında bilgi almak istediğiniz tüm</p>
            <p class="cw-farewell-info">konular için size destek vermekten</p>
            <p class="cw-farewell-info">memnuniyet duyarız.</p>
           
          </div>
        </div>
      </div>
    `;

    // Farewell page styles'ı ekle
    this.addFarewellPageStyles();

    // Event listeners
    const farewellCloseBtn = document.getElementById('cw-farewell-close-btn');
    const newConversationBtn = document.getElementById('cw-new-conversation-btn');

    if (farewellCloseBtn) {
      farewellCloseBtn.addEventListener('click', () => this.close());
    }

    if (newConversationBtn) {
      newConversationBtn.addEventListener('click', () => this.resetToForm());
    }
  }

  // Farewell page styles'ı ekle
  addFarewellPageStyles() {
    const existingStyles = document.getElementById('cw-farewell-styles');
    if (existingStyles) return;

    const style = document.createElement('style');
    style.id = 'cw-farewell-styles';
    style.textContent = `
      .cw-farewell-container {
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        background: white !important;
      }

      .cw-farewell-content {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        padding: 20px !important;
        text-align: center !important;
      }

      .cw-farewell-message {
        margin-bottom: 30px !important;
      }

      .cw-farewell-message p {
        margin: 5px 0 !important;
        font-size: 16px !important;
        color: #333 !important;
        line-height: 1.4 !important;
      }

      .cw-farewell-highlight {
        color: #AF3F27 !important;
        font-weight: bold !important;
      }

      .cw-farewell-logo-container {
        margin: 20px 0 !important;
      }

      .cw-farewell-logo {
        max-width: 120px !important;
        height: auto !important;
      }

      .cw-new-conversation-btn {
        background: linear-gradient(135deg, #AF3F27 0%, #AF3F27 100%) !important;
        color: white !important;
        border: none !important;
        padding: 12px 24px !important;
        border-radius: 25px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .cw-new-conversation-btn:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(175, 63, 39, 0.3) !important;
      }

      /* Typing Indicator Styles */
      .cw-typing-indicator {
        display: flex !important;
        align-items: center !important;
        flex-direction: row !important;
        padding: 12px 16px !important;
        background: white !important;
        border-radius: 16px !important;
        border-bottom-left-radius: 4px !important;
        max-width: 200px !important;
        opacity: 0 !important;
        transform: translateY(10px) !important;
        transition: all 0.3s ease !important;
        border: 1px solid #e2e8f0 !important;
      }

      .cw-typing-indicator.show {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }

      .cw-typing-text {
        color: #718096 !important;
        font-size: 14px !important;
      }

      /* Inline typing dots - conflict-free classes */
      .cw-inline-dots {
        display: inline-flex !important;
        gap: 4px !important;
        margin-left: 4px !important;
        align-items: baseline !important;
      }

      .cw-inline-dot {
        width: 6px !important;
        height: 6px !important;
        background: #2d3748 !important; /* dark gray */
        border-radius: 50% !important;
        animation: cw-inline-bounce 1s infinite ease-in-out !important;
      }

      .cw-inline-dot:nth-child(2) { animation-delay: .15s !important; }
      .cw-inline-dot:nth-child(3) { animation-delay: .3s !important; }

      @keyframes cw-inline-bounce {
        0%, 80%, 100% {
          transform: translateY(0) !important;
          opacity: .3 !important;
        }
        40% {
          transform: translateY(-5px) !important;
          opacity: 1 !important;
        }
      }

      /* Text-based dots: reveals one more dot with steps, no backgrounds */
      .cw-text-dots {
        display: inline-block !important;
        overflow: hidden !important;
        width: 0ch !important;
        vertical-align: baseline !important;
        color: #2d3748 !important;
        animation: cw-text-dots-reveal 1.2s steps(3, end) infinite !important;
        margin-left: 4px !important;
      }

      @keyframes cw-text-dots-reveal {
        from { width: 0ch; }
        to   { width: 3ch; }
      }

      /* BASİT TYPING ANIMASYONU - GÜÇLENDIRILMIŞ */
      #cw-typing-indicator .simple-dots {
        margin-left: 4px !important;
        display: inline !important;
      }
      
      #cw-typing-indicator .simple-dots span {
        animation: simple-blink 1s infinite ease-in-out !important;
        opacity: 0.3 !important;
        display: inline !important;
        font-weight: bold !important;
        font-size: 16px !important;
      }
      
      #cw-typing-indicator .simple-dots span:nth-child(1) { animation-delay: 0s !important; }
      #cw-typing-indicator .simple-dots span:nth-child(2) { animation-delay: 0.3s !important; }
      #cw-typing-indicator .simple-dots span:nth-child(3) { animation-delay: 0.6s !important; }
      
      @keyframes blink {
        0% { opacity: 0.2; }
        50% { opacity: 1; }
        100% { opacity: 0.2; }
      }
      
      @keyframes simple-blink {
        0% { opacity: 0.2 !important; transform: scale(1) !important; }
        50% { opacity: 1 !important; transform: scale(1.2) !important; }
        100% { opacity: 0.2 !important; transform: scale(1) !important; }
      }

      /* Your requested chat-bubble typing animation */
      .cw-typing-indicator.chat-bubble-mode {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

       
      }
    `;
    document.head.appendChild(style);
  }

  // Typing indicator göster
  showTypingIndicator(agentName = 'Temsilci') {
    console.log('🔄 showTypingIndicator called for:', agentName);
    
    // Chat ekranının açık olup olmadığını kontrol et
    const chatWindow = document.getElementById('cw-window');
    const chatContainer = document.querySelector('.cw-chat-container');
    
    console.log('🏠 Chat window:', chatWindow ? 'found' : 'NOT FOUND');
    console.log('📦 Chat container:', chatContainer ? 'found' : 'NOT FOUND');
    
    if (chatContainer) {
      const containerDisplay = window.getComputedStyle(chatContainer).display;
      console.log('📦 Chat container display:', containerDisplay);
      
      if (containerDisplay === 'none') {
        console.warn('⚠️ Chat container is hidden (display: none)');
        return;
      }
    }
    
    const messagesContainer = document.getElementById('cw-messages');
    if (!messagesContainer) {
      console.error('❌ Messages container not found!');
      return;
    }
    
    console.log('✅ Messages container found:', messagesContainer);
    console.log('📏 Messages container display:', window.getComputedStyle(messagesContainer).display);
    console.log('👁️ Messages container visibility:', window.getComputedStyle(messagesContainer).visibility);

    // Mevcut typing indicator'ı kaldır
    this.hideTypingIndicator();

    // Yeni typing indicator oluştur
    const typingDiv = document.createElement('div');
    typingDiv.className = 'cw-message bot';
    typingDiv.id = 'cw-typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="cw-message-avatar">CR</div>
      <div class="cw-message-content">
        <div class="cw-message-bubble">
          <span style="margin-left:4px;"><span style="animation: blink 1s infinite; opacity:1;">.</span><span style="animation: blink 1s infinite 0.3s; opacity:1;">.</span><span style="animation: blink 1s infinite 0.6s; opacity:1;">.</span></span>
        </div>
        <div class="cw-agent-name">${agentName}</div>
      </div>
    `;

    console.log('📝 Typing indicator HTML created:', typingDiv.innerHTML);
    messagesContainer.appendChild(typingDiv);
    console.log('➕ Typing indicator added to container');
    
    // Element'in DOM'a eklendiğini doğrula
    const addedElement = document.getElementById('cw-typing-indicator');
    console.log('🔍 Element added to DOM:', addedElement ? 'YES' : 'NO');
    
    if (addedElement) {
      console.log('📐 Element dimensions:', {
        offsetWidth: addedElement.offsetWidth,
        offsetHeight: addedElement.offsetHeight,
        offsetParent: addedElement.offsetParent
      });
    }
    
    // Animasyonlu gösterim
    setTimeout(() => {
      const indicator = typingDiv.querySelector('.cw-typing-indicator');
      if (indicator) {
        console.log('🎯 Found indicator element, adding show class...');
        indicator.classList.add('show');
        console.log('✨ Show class added to indicator');
        
        // CSS özelliklerini kontrol et
        const styles = window.getComputedStyle(indicator);
        console.log('🎨 Indicator styles after show:', {
          opacity: styles.opacity,
          transform: styles.transform,
          display: styles.display,
          visibility: styles.visibility
        });
      } else {
        console.error('❌ Indicator element not found in typingDiv');
        console.log('🔍 TypingDiv content:', typingDiv.innerHTML);
      }
    }, 50);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Artık timeout yok - API response gelene kadar gösterilecek
    // Sadece mevcut timeout'u temizle
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
    
    console.log('💬 Typing indicator shown for:', agentName);
  }

  // Kullanıcı mesajından sonra typing animasyonunu başlat
  startTypingAfterUserMessage() {
    console.log('⏰ Starting typing animation after user message...');
    
    // 2 saniye bekle
    setTimeout(() => {
      console.log('💬 Showing typing indicator after 2 second delay');
      this.showTypingIndicator('Temsilci');
    }, 2000);
  }



  // Mesaj kuyruğunu işle
  async processMessageQueue() {
    if (this.messageQueue.length === 0) {
      this.isProcessingMessage = false;
      return;
    }
    
    this.isProcessingMessage = true;
    const message = this.messageQueue.shift(); // İlk mesajı al
    
    console.log('🔄 Processing queued message:', message.text);
    
    // Typing indicator göster
    this.showTypingIndicator(message.name);
    
    // 2 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Typing indicator'ı gizle
    this.hideTypingIndicator();
    
    // Kısa bir transition delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mesajı göster
    this.addMessage(message.text, 'bot', message.name);
    console.log('✅ Message displayed after typing animation');
    
    // Bir sonraki mesajı işle (eğer varsa)
    setTimeout(() => {
      this.processMessageQueue();
    }, 500); // Mesajlar arası 500ms delay
  }

  // Typing indicator gizle
  hideTypingIndicator() {
    // Timeout'u temizle
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    const typingIndicator = document.getElementById('cw-typing-indicator');
    if (typingIndicator) {
      const indicator = typingIndicator.querySelector('.cw-typing-indicator');
      if (indicator) {
        indicator.classList.remove('show');
      }
      
      // Animasyon tamamlandıktan sonra kaldır
      setTimeout(() => {
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.parentNode.removeChild(typingIndicator);
        }
      }, 300);
      
      console.log('💬 Typing indicator hidden');
    }
  }

  // Form ekranına geri dön
  resetToForm() {
    console.log('🔄 Resetting to form...');
    
    // Chat session verilerini temizle
    this.chatToken = null;
    this.chatSessionActive = false;
    this.customerData = null;
    this.messages = [];
    this.messageQueue = []; // Mesaj kuyruğunu temizle
    this.isProcessingMessage = false;
    this.hasReceivedAgentMessage = false; // Agent mesaj flag'ini sıfırla
    this.hideTypingIndicator(); // Typing indicator'ı temizle
    
    // Widget'ı yeniden oluştur
    const container = document.getElementById('cw-window');
    if (container) {
      // Mevcut içeriği temizle
      container.innerHTML = '';
      
      // Form ekranını yeniden oluştur
      this.createChatWidget();
      
      // Event listener'ları yeniden bağla
      setTimeout(() => {
        this.attachEventListeners();
      }, 100);
      
      console.log('✅ Reset to form completed');
    }
  }

  // Local state'i hemen temizle (müşteriyi bekletmeden)
  endChatSessionLocally() {
    console.log('🔄 Ending chat session locally (immediate)');
    
    // Polling'i durdur
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Local state'i temizle
    this.chatSessionActive = false;
    this.customerData = null;
    this.messages = [];
    this.messageQueue = [];
    this.isProcessingMessage = false;
    this.hasReceivedAgentMessage = false;
    this.hideTypingIndicator();
    
    console.log('✅ Chat session ended locally (immediate)');
  }
  
  // API'ye arka planda istek gönder (async, müşteriyi bekletmeden)
  async endChatSessionAPI() {
    if (!this.chatToken) {
      console.log('No chat token for API end request');
      return;
    }
    
    const tokenToEnd = this.chatToken; // Token'ı sakla
    this.chatToken = null; // Hemen temizle
    
    try {
      console.log('📤 Sending end chat request to API (background)');
      
      // API'ye session sonlandırma isteği gönder
      const response = await fetch(`${this.config.apiUrl}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenToEnd
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Chat session ended successfully via API:', result);
      
    } catch (error) {
      console.error('❌ Failed to end chat session via API:', error);
      // API hatası olsa bile kullanıcı deneyimi etkilenmez
    }
  }
  
  // Eski fonksiyon - geriye dönük uyumluluk için
  async endChatSession() {
    this.endChatSessionLocally();
    await this.endChatSessionAPI();
  }

  // Customer history oluşturma yardımcı fonksiyonu
  createCustomerHistory() {
    const history = [];
    
    // Mevcut mesajlardan history oluştur
    this.messages.forEach(msg => {
      if (msg.sender === 'user') {
        history.push({
          message: msg.text,
          message_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    });
    
    return history;
  }

  // Chat session'ını history ile başlat
  async startChatWithHistory(customerData = {}) {
    // Mevcut mesajlardan history oluştur
    const history = this.createCustomerHistory();
    
    // Customer data'ya history ekle
    const dataWithHistory = {
      ...customerData,
      history: history.length > 0 ? history : undefined
    };
    
    return await this.startChatSession(dataWithHistory);
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
        <h3>Merhaba! </h3>
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

// Global erişim için WebChat'i window'a ekle
window.WebChat = WebChat;

// Debug ve test fonksiyonları
window.testAPI = async function() {
  console.log('🧪 Testing API manually...');
  if (!window.debugChat) {
    console.error('❌ No chat instance found! Create WebChat first.');
    return;
  }
  
  try {
    await window.debugChat.startChatSession({
      name: 'Test User',
      email: 'test@example.com',
      phone: '05551234567'
    });
    console.log('✅ API Test successful!');
  } catch (error) {
    console.error('❌ API Test failed:', error);
  }
};

// Input kontrol fonksiyonu
window.checkInput = function() {
  const input = document.getElementById('cw-input');
  const container = document.getElementById('cw-window');
  const chatContainer = container?.querySelector('.cw-chat-container');
  const inputContainer = chatContainer?.querySelector('.cw-input-container');
  const sendButton = document.getElementById('cw-send-btn');
  
  console.log('🔍 FULL Input Check:', {
    input: input ? 'found' : 'not found',
    chatContainer: chatContainer ? 'found' : 'not found',
    inputContainer: inputContainer ? 'found' : 'not found',
    sendButton: sendButton ? 'found' : 'not found',
    chatContainerDisplay: chatContainer?.style.display,
    inputContainerDisplay: inputContainer?.style.display,
    inputVisible: input ? (input.offsetParent !== null) : 'no input',
    inputBoundingRect: input ? input.getBoundingClientRect() : 'no input'
  });
  
  if (input) {
    console.log('📝 Input FULL details:', {
      value: input.value,
      placeholder: input.placeholder,
      disabled: input.disabled,
      type: input.type,
      id: input.id,
      className: input.className,
      parentElement: input.parentElement?.className,
      style: input.style.cssText,
      computedStyle: {
        display: getComputedStyle(input).display,
        visibility: getComputedStyle(input).visibility,
        opacity: getComputedStyle(input).opacity,
        position: getComputedStyle(input).position
      }
    });
  }
  
  // Input yoksa zorla oluştur
  if (!input) {
    console.log('⚠️ Input not found! Trying to recreate...');
    if (inputContainer) {
      const newInput = document.createElement('input');
      newInput.type = 'text';
      newInput.id = 'cw-input';
      newInput.className = 'cw-input';
      newInput.placeholder = 'Mesajınızı yazın...';
      newInput.style.cssText = 'flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 25px; outline: none; font-size: 14px;';
      inputContainer.insertBefore(newInput, inputContainer.firstChild);
      console.log('✅ Input recreated!');
    }
  }
};

// Otomatik başlatma fonksiyonu
WebChat.autoInit = function(customConfig = {}) {
  // Default konfigürasyon
  const defaultConfig = {
    title: 'Müşteri Destek',
    placeholder: 'Mesajınızı yazın...',
    position: 'bottom-right',
    botName: 'Asistan',
    userName: 'Misafir',
    // API Configuration - Postman'dan alınan gerçek bilgiler
    apiUrl: 'https://chatserver.alo-tech.com/chat-api',
    cwid: 'ahRzfm11c3RlcmktaGl6bWV0bGVyaXIYCxILQ2hhdFdpZGdldHMYgICa_s3EpAkMogEcY2l0eXNyZXNpZGVuY2VzLmFsby10ZWNoLmNvbQ',
    securityToken: 'd67b75778e32a9c71645c5aa84264220403d27102f366fa2cb1eb85afcb73417',
    namespace: 'citysresidences.alo-tech.com',
    lang: 'tr'
  };
  
  // Custom config ile default'u birleştir
  const finalConfig = { ...defaultConfig, ...customConfig };
  
  // Chat instance'ını oluştur
  const chat = new WebChat(finalConfig);
  
  // Debug için global erişim
  window.debugChat = chat;
  
  // Debug bilgilerini göster
  setTimeout(() => {
    console.log('Web Chat başarıyla yüklendi! ✅');
    console.log('🔧 Debug: API Config:', {
      apiUrl: chat.config.apiUrl,
      cwid: chat.config.cwid,
      securityToken: chat.config.securityToken ? '***' + chat.config.securityToken.slice(-10) : 'NOT SET',
      namespace: chat.config.namespace
    });
  }, 1000);
  
  return chat;
};

// Test fonksiyonu - typing indicator'ı test etmek için
window.testTypingIndicator = function() {
  if (window.debugChat) {
    console.log('🧪 Testing typing indicator...');
    
    // Önce chat ekranının açık olup olmadığını kontrol et
    const chatContainer = document.querySelector('.cw-chat-container');
    if (!chatContainer || window.getComputedStyle(chatContainer).display === 'none') {
      console.warn('⚠️ Chat ekranı kapalı! Önce chat\'i açın ve form\'u doldurun.');
      return;
    }
    
    window.debugChat.showTypingIndicator('Test Agent');
    
    // 3 saniye sonra gizle
    setTimeout(() => {
      window.debugChat.hideTypingIndicator();
      console.log('🧪 Test completed');
    }, 3000);
  } else {
    console.log('❌ WebChat not initialized');
  }
};

// CSS kontrol fonksiyonu
window.checkTypingCSS = function() {
  console.log('🎨 Checking typing indicator CSS...');
  
  // Test elementi oluştur
  const testDiv = document.createElement('div');
  testDiv.className = 'cw-typing-indicator';
  testDiv.innerHTML = `Temsilci yazıyor<span class="simple-dots"><span>.</span><span>.</span><span>.</span></span>`;
  testDiv.style.position = 'absolute';
  testDiv.style.top = '-9999px';
  document.body.appendChild(testDiv);
  
  // CSS özelliklerini kontrol et
  const containerStyles = window.getComputedStyle(testDiv);
  const dotsContainer = testDiv.querySelector('.simple-dots');
  const dotStyles = testDiv.querySelector('.simple-dots span');
  
  console.log('Simple Dots Container:', dotsContainer ? 'FOUND' : 'NOT FOUND');
  
  if (dotStyles) {
    const computedDotStyles = window.getComputedStyle(dotStyles);
    console.log('Dot Animation:', {
      animation: computedDotStyles.animation,
      opacity: computedDotStyles.opacity,
      animationDelay: computedDotStyles.animationDelay
    });
  } else {
    console.log('❌ Dot styles not found');
  }
  
  console.log('🔍 HTML Content:', testDiv.innerHTML);
  
  // Test elementini kaldır
  document.body.removeChild(testDiv);
};

// DOM kontrol fonksiyonu
window.checkChatDOM = function() {
  console.log('🔍 Checking chat DOM elements...');
  
  const elements = {
    chatWindow: document.getElementById('cw-window'),
    messagesContainer: document.getElementById('cw-messages'),
    chatContainer: document.querySelector('.cw-chat-container'),
    existingTyping: document.getElementById('cw-typing-indicator')
  };
  
  Object.entries(elements).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name}:`, element);
      if (name === 'messagesContainer') {
        console.log(`   - Children count: ${element.children.length}`);
        console.log(`   - Display: ${window.getComputedStyle(element).display}`);
        console.log(`   - Visibility: ${window.getComputedStyle(element).visibility}`);
      }
    } else {
      console.log(`❌ ${name}: NOT FOUND`);
    }
  });
};

// ACIL ANIMASYON TEST
window.testAnimation = function() {
  console.log('🚨 ACIL ANIMASYON TESTI');
  
  // Direkt HTML'e ekle
  const testHTML = `
    <div id="test-typing" style="position: fixed; top: 50px; left: 50px; background: white; padding: 20px; border: 2px solid red; z-index: 9999;">
      Temsilci yazıyor<span class="simple-dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', testHTML);
  
  setTimeout(() => {
    const testEl = document.getElementById('test-typing');
    if (testEl) testEl.remove();
  }, 5000);
  
  console.log('✅ Test animasyon eklendi - 5 saniye görünecek');
};

// Force refresh typing indicator
window.forceRefreshTyping = function() {
  if (!window.debugChat) {
    console.log('❌ WebChat not initialized');
    return;
  }
  
  console.log('🔄 Force refreshing typing indicator...');
  
  // Mevcut typing indicator'ı kaldır
  window.debugChat.hideTypingIndicator();
  
  // Kısa bir delay ile yeniden göster
  setTimeout(() => {
    window.debugChat.showTypingIndicator('Temsilci');
    console.log('✨ Typing indicator refreshed!');
    console.log('🎯 Expected: "Temsilci yazıyor..." + yanıp sönen noktalar');
    
    // Element kontrolü
    setTimeout(() => {
      const typingElement = document.getElementById('cw-typing-indicator');
      const dots = document.querySelectorAll('#cw-typing-indicator .simple-dots span');
      console.log('🔍 Typing element found:', typingElement ? 'YES' : 'NO');
      console.log('🔍 Simple dots found:', dots.length);
      if (dots.length > 0) {
        console.log('🎨 Dot animation:', {
          animation: window.getComputedStyle(dots[0]).animation,
          opacity: window.getComputedStyle(dots[0]).opacity,
          fontSize: window.getComputedStyle(dots[0]).fontSize
        });
      }
    }, 200);
  }, 100);
};

// Typing indicator layout test fonksiyonu
window.testTypingLayout = function() {
  if (!window.debugChat) {
    console.log('❌ WebChat not initialized');
    return;
  }
  
  console.log('🧪 Testing new horizontal typing layout...');
  
  // Chat ekranının açık olup olmadığını kontrol et
  const chatContainer = document.querySelector('.cw-chat-container');
  if (!chatContainer || window.getComputedStyle(chatContainer).display === 'none') {
    console.warn('⚠️ Chat ekranı kapalı! Önce chat\'i açın ve form\'u doldurun.');
    return;
  }
  
  // Typing indicator'ı göster
  window.debugChat.showTypingIndicator('Test Temsilci');
  
  console.log('💬 Typing indicator gösterildi - noktalar yatay mı?');
  console.log('🔍 Beklenen format: "Test Temsilci yazıyor ..."');
  
  // 5 saniye sonra gizle
  setTimeout(() => {
    window.debugChat.hideTypingIndicator();
    console.log('✅ Test tamamlandı');
  }, 5000);
};

// Avatar test fonksiyonu
window.testUserAvatar = function() {
  if (!window.debugChat) {
    console.log('❌ WebChat not initialized');
    return;
  }
  
  console.log('🧪 Testing user avatar with different names...');
  
  // Farklı isimlerle test et
  const testNames = [
    'Ahmet Yılmaz',
    'Mehmet Özkan', 
    'Zeynep Kaya',
    'Fatma Demir',
    'Ali Veli'
  ];
  
  testNames.forEach((name, index) => {
    // Customer data'yı güncelle
    window.debugChat.customerData = { name: name };
    
    setTimeout(() => {
      const avatar = window.debugChat.getUserAvatar();
      console.log(`👤 ${name} → Avatar: ${avatar}`);
      window.debugChat.addMessage(`Merhaba, ben ${name}`, 'user');
    }, index * 1000);
  });
  
  console.log('🎬 Watch different avatars appear!');
};

// Yeni typing flow test fonksiyonu
window.testNewTypingFlow = function() {
  if (!window.debugChat) {
    console.log('❌ WebChat not initialized');
    return;
  }
  
  console.log('🧪 Testing new typing flow...');
  console.log('1. Simulating user message send');
  
  // Kullanıcı mesajı simüle et
  window.debugChat.addMessage('Test mesajım', 'user');
  
  // Typing animasyonunu başlat
  window.debugChat.startTypingAfterUserMessage();
  
  // 5 saniye sonra fake API response simüle et
  setTimeout(() => {
    console.log('2. Simulating API response after 5 seconds');
    window.debugChat.hideTypingIndicator();
    
    setTimeout(() => {
      window.debugChat.addMessage('Bu bir test cevabıdır. Typing animasyonu gördünüz mü?', 'bot');
      console.log('✅ Test completed!');
    }, 200);
  }, 5000);
  
  console.log('🎬 Watch: 2 sec delay → typing animation → 5 sec later → response');
};

 
// Fake typing signal test fonksiyonu
window.simulateTypingSignal = function() {
  if (!window.debugChat) {
    console.log('❌ WebChat not initialized');
    return;
  }
  
  console.log('🎭 Simulating typing signal from API...');
  
  // Fake API response'u simüle et
  const fakeMessage = {
    "active_chat_key": "test-key",
    "text": null,
    "type": "typing",
    "sender": "agent",
    "name": "Test Agent",
    "chat_type": "http_api",
    "insert_date": {
      "date": "22-09-2025",
      "time": "11:07:49",
      "now": "2025-09-22 11:07:49.239644"
    },
    "avatar": "",
    "client_custom_data": "test data"
  };
  
  console.log('🔍 Fake message:', fakeMessage);
  
  // Typing indicator kontrolünü manuel çalıştır
  if (fakeMessage.type === 'typing' && fakeMessage.sender === 'agent') {
    const agentName = fakeMessage.name || 'Temsilci';
    console.log('💬 Fake agent typing detected:', agentName);
    window.debugChat.showTypingIndicator(agentName);
    
    // 5 saniye sonra gizle
    setTimeout(() => {
      window.debugChat.hideTypingIndicator();
      console.log('🎭 Fake typing simulation ended');
    }, 5000);
  }
};


// Sayfa yüklendiğinde otomatik başlat
document.addEventListener('DOMContentLoaded', function() {
  // Eğer manuel olarak WebChat oluşturulmamışsa otomatik başlat
  if (!window.debugChat) {
    WebChat.autoInit();
  }
  
  // Test için console'da bilgi ver
  setTimeout(() => {
    console.log('💬 WebChat Hazır!');
  }, 2000);
});

