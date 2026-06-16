// Utility Functions
const Utils = {
    // DOM Helpers
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    createElement(tag, className = '', innerHTML = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    },

    // Validation
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    isValidPhone(phone) {
        const regex = /^[0-9]{10,}$/;
        return regex.test(phone.replace(/[\s-]/g, ''));
    },

    isValidPassword(password) {
        return password.length >= 8;
    },

    isEmpty(value) {
        return !value || value.trim() === '';
    },

    // Storage
    setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    getStorage(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    removeStorage(key) {
        localStorage.removeItem(key);
    },

    clearStorage() {
        localStorage.clear();
    },

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.createElement('div', `toast toast-${type}`, `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Modal
    showModal(title, message, buttons = ['OK']) {
        return new Promise(resolve => {
            const modal = this.createElement('div', 'modal', `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        ${buttons.map((btn, idx) => `<button class="btn btn-primary" data-index="${idx}">${btn}</button>`).join('')}
                    </div>
                </div>
            `);

            document.body.appendChild(modal);
            modal.style.display = 'flex';

            const closeModal = () => {
                modal.remove();
            };

            modal.querySelector('.modal-close').addEventListener('click', () => {
                resolve(-1);
                closeModal();
            });

            modal.querySelectorAll('[data-index]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    resolve(parseInt(e.target.dataset.index));
                    closeModal();
                });
            });
        });
    },

    // Loading
    showLoading(message = 'Loading...') {
        const loading = this.createElement('div', 'loading-overlay', `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `);
        document.body.appendChild(loading);
        return loading;
    },

    hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) loading.remove();
    },

    // Format
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(date) {
        if (typeof date === 'object' && date.toDate) {
            date = date.toDate();
        }
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    formatDateShort(date) {
        if (typeof date === 'object' && date.toDate) {
            date = date.toDate();
        }
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    },

    // Time
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [name, value] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / value);
            if (interval >= 1) {
                return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
            }
        }
        return 'just now';
    },

    // URL
    getQueryParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    },

    setQueryParam(param, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(param, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    },

    // Debounce & Throttle
    debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    throttle(func, delay = 300) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    },

    // Copy to Clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (error) {
            this.showToast('Failed to copy', 'error');
            return false;
        }
    },

    // File
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    },

    isValidVideoFile(file) {
        const validTypes = ['video/mp4', 'video/webm', 'video/avi'];
        return validTypes.includes(file.type);
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    // Animation
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.offsetHeight; // Trigger reflow
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '1';
    },

    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },

    // Scroll
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // User Agent Detection
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('android')) return 'android';
        if (userAgent.includes('iphone')) return 'ios';
        if (userAgent.includes('ipad')) return 'ipad';
        return 'desktop';
    },

    // API Calls
    async fetchJSON(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
};

// Global instance
window.Utils = Utils;

// CSS for Toast
const toastCSS = `
<style>
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.1);
        color: #e2e8f0;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        min-width: 300px;
    }

    .toast.show {
        opacity: 1;
        transform: translateX(0);
    }

    .toast-success {
        border-left: 4px solid #10b981;
    }

    .toast-success i {
        color: #10b981;
    }

    .toast-error {
        border-left: 4px solid #ef4444;
    }

    .toast-error i {
        color: #ef4444;
    }

    .toast-warning {
        border-left: 4px solid #f59e0b;
    }

    .toast-warning i {
        color: #f59e0b;
    }

    .toast-info {
        border-left: 4px solid #6366f1;
    }

    .toast-info i {
        color: #6366f1;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .modal-content {
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(148, 163, 184, 0.1);
        border-radius: 1rem;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        padding-bottom: 1rem;
    }

    .modal-close {
        background: none;
        border: none;
        color: #cbd5e1;
        font-size: 1.5rem;
        cursor: pointer;
    }

    .modal-body {
        margin: 1.5rem 0;
        color: #cbd5e1;
        line-height: 1.6;
    }

    .modal-footer {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        border-top: 1px solid rgba(148, 163, 184, 0.1);
        padding-top: 1rem;
    }

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    }

    .loading-container {
        text-align: center;
        color: white;
    }
</style>
`;

if (!document.querySelector('style[data-toast]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast', 'true');
    style.textContent = toastCSS.match(/<style>([\s\S]*?)<\/style>/)[1];
    document.head.appendChild(style);
}
