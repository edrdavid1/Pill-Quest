// === КОНСТАНТЫ И СОСТОЯНИЕ ===
const STORAGE_KEY = 'pill_quest_data';
const SETTINGS_KEY = 'pill_quest_settings';

const IMG_NOT_TAKEN = '/pablic/a2.png';  // Таблетка НЕ выпита
const IMG_TAKEN = '/pablic/a1.png';      // Таблетка выпита

// Мотивационные фразы
const MOTIVATIONAL_MESSAGES = [
    "Чмок! За каждый шаг к внутреннему покою",
    "Даша, ты умничка! +100 к психической стабильности",
    "Миссия выполнена: Уровень тревожности снижен до минимума!",
    "Твой ментальный щит активирован",
    "LEVEL UP! Сопротивление стрессу увеличено",
    "Achievement Unlocked: Спокойная Даша — счастливая жабка",
    "Квест пройден: Внутренний дзен Даши под защитой",
    "Жабка чувствует, как твоя стабильность растет"
];

// Состояние приложения
let state = {
    history: {},
    settings: {
        notificationTime: '08:00',
        theme: 'light'
    },
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// === УТИЛИТЫ ===

// Получение локальной даты в ISO формате (без проблемы с часовыми поясами)
function getLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Парсинг локальной ISO даты
function parseLocalISODate(isoString) {
    const [year, month, day] = isoString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Безопасная загрузка данных
function loadSafeJSON(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        const parsed = JSON.parse(data);
        // Валидация структуры
        if (typeof parsed !== 'object' || parsed === null) {
            console.warn('Invalid data format, using default');
            return defaultValue;
        }
        return parsed;
    } catch (e) {
        console.error('Error loading data:', e);
        return defaultValue;
    }
}

// Безопасное сохранение данных
function saveSafeJSON(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);
        alert('Ошибка сохранения данных. Возможно, переполнено хранилище.');
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initTheme();
    renderMonthHeader();
    renderCalendar();
    updateUI();
    registerServiceWorker();
    showNotificationPrompt();
    scheduleDailyNotification();
});

function loadData() {
    state.history = loadSafeJSON(STORAGE_KEY, {});
    const settings = loadSafeJSON(SETTINGS_KEY, state.settings);
    state.settings = { ...state.settings, ...settings };
}

function saveData() {
    saveSafeJSON(STORAGE_KEY, state.history);
    saveSafeJSON(SETTINGS_KEY, state.settings);
}

// === ТЕМА ===

function initTheme() {
    applyTheme(state.settings.theme);
}

function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme(state.settings.theme);
    saveData();
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// === UI ФУНКЦИИ ===

function renderMonthHeader() {
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendarMonthYear').textContent = 
        `${months[state.currentMonth]} ${state.currentYear}`;
}

function updateUI() {
    const todayISO = getLocalISODate(new Date());
    const btn = document.getElementById('pillBtn');
    const img = document.getElementById('statusImage');
    const isTaken = state.history[todayISO];

    if (isTaken) {
        btn.classList.add('checked');
        btn.textContent = 'ГОТОВО';
        btn.disabled = true;
        img.src = IMG_TAKEN;
    } else {
        btn.classList.remove('checked');
        btn.textContent = 'ВЫПИТЬ!';
        btn.disabled = false;
        img.src = IMG_NOT_TAKEN;
        hideMotivationalMessage();
    }
}


// === КАЛЕНДАРЬ ===

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const today = new Date();
    const todayISO = getLocalISODate(today);

    const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();

    // Корректировка для понедельника (в JS 0 = воскресенье)
    let firstDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (firstDayOfWeek === -1) firstDayOfWeek = 6;

    // Пустые ячейки до начала месяца
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'day empty';
        grid.appendChild(emptyCell);
    }

    // Дни месяца
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = i;

        const currentDayISO = getLocalISODate(new Date(state.currentYear, state.currentMonth, i));

        if (currentDayISO === todayISO) dayEl.classList.add('today');
        if (state.history[currentDayISO]) dayEl.classList.add('checked');

        grid.appendChild(dayEl);
    }

    // Обновляем состояние кнопок навигации
    document.getElementById('prevMonth').disabled = 
        state.currentYear === today.getFullYear() && state.currentMonth === 0;
}

function changeMonth(delta) {
    state.currentMonth += delta;

    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    } else if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }

    renderMonthHeader();
    renderCalendar();
}

// === ОБРАБОТКА НАЖАТИЙ ===

function toggleTodayPill() {
    const todayISO = getLocalISODate(new Date());

    // Если ещё не выпита сегодня — добавляем отметку
    if (!state.history[todayISO]) {
        state.history[todayISO] = true;
        // Вибрация при успехе (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        // Показываем мотивационное сообщение
        showMotivationalMessage();
    }

    saveData();
    updateUI();
    renderCalendar();
}

// === SERVICE WORKER ===

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
                
                // Запрос на отправку уведомлений после регистрации SW
                if (Notification.permission === 'granted') {
                    scheduleDailyNotification();
                }
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// === УВЕДОМЛЕНИЯ ===

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                scheduleDailyNotification();
                hideNotificationPrompt();
            }
        });
    }
}

function showNotificationPrompt() {
    const prompt = document.getElementById('notificationPrompt');
    if ('Notification' in window && Notification.permission === 'default') {
        prompt.classList.add('visible');
    }
}

function hideNotificationPrompt() {
    const prompt = document.getElementById('notificationPrompt');
    prompt.classList.remove('visible');
}

function scheduleDailyNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    if (!('serviceWorker' in navigator)) {
        return;
    }

    // Парсим время уведомления
    const [hours, minutes] = state.settings.notificationTime.split(':').map(Number);
    
    const now = new Date();
    const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    
    // Если время уже прошло сегодня, планируем на завтра
    if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
    }
    
    const delay = notificationTime.getTime() - now.getTime();
    
    console.log(`Уведомление запланировано на ${notificationTime.toLocaleTimeString()}, задержка: ${Math.round(delay/1000)}с`);
    
    // Используем setTimeout как фоллбэк (в идеале нужен Background Sync)
    setTimeout(() => {
        sendNotification();
        // Планируем следующее уведомление
        scheduleDailyNotification();
    }, delay);
}

function sendNotification() {
    const todayISO = getLocalISODate(new Date());
    
    // Не показываем, если уже принято
    if (state.history[todayISO]) {
        return;
    }
    
    const options = {
        body: 'Пора пить таблетки!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'pill-quest-daily',
        requireInteraction: false,
        silent: false
    };
    
    // Пробуем отправить через Service Worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Pill Quest', options);
        });
    } else {
        // Фоллбэк
        new Notification('Pill Quest', options);
    }
}

// === МОТИВАЦИОННЫЕ СООБЩЕНИЯ ===

function showMotivationalMessage() {
    const popup = document.getElementById('messagePopup');
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    const message = MOTIVATIONAL_MESSAGES[randomIndex];
    
    popup.textContent = message;
    popup.classList.add('visible');
}

function hideMotivationalMessage() {
    const popup = document.getElementById('messagePopup');
    popup.classList.remove('visible');
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ (для HTML) ===

window.toggleTodayPill = toggleTodayPill;
window.changeMonth = changeMonth;
window.toggleTheme = toggleTheme;
window.requestNotificationPermission = requestNotificationPermission;
window.hideNotificationPrompt = hideNotificationPrompt;
