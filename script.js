const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoDate = document.getElementById('todo-date');
const todoList = document.getElementById('todo-list');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const notifyBtn = document.getElementById('notify-btn');
const clearBtn = document.getElementById('clear-btn'); 

const viewTodo = document.getElementById('view-todo');
const viewCalendar = document.getElementById('view-calendar');
const navTodo = document.getElementById('nav-todo');
const navCalendar = document.getElementById('nav-calendar');
const backToTodoBtn = document.getElementById('back-to-todo-btn');
const filterContainer = document.getElementById('filter-container');

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const filterBtns = document.querySelectorAll('.filter-btn');

const currentMonthText = document.getElementById('current-month');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const STORAGE_KEY = 'todo-list-pro';
const THEME_KEY = 'todo-theme-pref';

let currDate = new Date();
let currMonth = currDate.getMonth();
let currYear = currDate.getFullYear();
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadTheme();
    if ("Notification" in window && Notification.permission === "granted") {
        notifyBtn.style.display = "none";
        checkReminders();
    }
});


function switchView(viewName) {
    if (viewName === 'todo') {
        viewTodo.classList.remove('hidden');
        viewCalendar.classList.add('hidden');
        navTodo.classList.add('active');
        navCalendar.classList.remove('active');
        filterContainer.style.display = 'flex';
    } else if (viewName === 'calendar') {
        viewTodo.classList.add('hidden');
        viewCalendar.classList.remove('hidden');
        navTodo.classList.remove('active');
        navCalendar.classList.add('active');
        filterContainer.style.display = 'none';
        renderCalendar();
    }
}
navTodo.addEventListener('click', () => switchView('todo'));
navCalendar.addEventListener('click', () => switchView('calendar'));
backToTodoBtn.addEventListener('click', () => switchView('todo'));


function renderCalendar() {
    currentMonthText.innerText = `${months[currMonth]} ${currYear}`;
    const storedData = localStorage.getItem(STORAGE_KEY);
    const todos = storedData ? JSON.parse(storedData) : [];
    
    calendarGrid.innerHTML = "";
    const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    daysName.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-name';
        div.innerText = day;
        calendarGrid.appendChild(div);
    });

    const firstDay = new Date(currYear, currMonth, 1).getDay();
    const lastDate = new Date(currYear, currMonth + 1, 0).getDate();
    const lastDatePrev = new Date(currYear, currMonth, 0).getDate();

    for (let i = firstDay; i > 0; i--) {
        const div = document.createElement('div');
        div.className = 'calendar-date';
        div.style.opacity = '0.5';
        div.innerText = lastDatePrev - i + 1;
        calendarGrid.appendChild(div);
    }

    for (let i = 1; i <= lastDate; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-date';
        div.innerText = i;
        const today = new Date();
        if (i === today.getDate() && currMonth === today.getMonth() && currYear === today.getFullYear()) {
            div.classList.add('current-day');
        }
        
        const m = (currMonth + 1).toString().padStart(2, '0');
        const d = i.toString().padStart(2, '0');
        const dateStr = `${currYear}-${m}-${d}`;
        if (todos.some(t => t.date === dateStr && !t.completed)) {
            const dot = document.createElement('div');
            dot.className = 'has-task-dot';
            div.appendChild(dot);
        }
        calendarGrid.appendChild(div);
    }
}

prevMonthBtn.addEventListener('click', () => { currMonth--; if(currMonth < 0) { currMonth = 11; currYear--; } renderCalendar(); });
nextMonthBtn.addEventListener('click', () => { currMonth++; if(currMonth > 11) { currMonth = 0; currYear++; } renderCalendar(); });

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterTasks(btn.getAttribute('data-filter'));
    });
});
function filterTasks(status) {
    todoList.childNodes.forEach(todo => {
        if(todo.nodeType === 1) {
            switch(status) {
                case "all": todo.style.display = "flex"; break;
                case "completed": todo.style.display = todo.classList.contains('completed') ? "flex" : "none"; break;
                case "pending": todo.style.display = !todo.classList.contains('completed') ? "flex" : "none"; break;
            }
        }
    });
}
themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
});
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.innerText = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(THEME_KEY, theme);
}
function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
}

notifyBtn.addEventListener('click', () => {
    if (!("Notification" in window)) alert("Browser tidak support.");
    else Notification.requestPermission().then(p => { if (p === "granted") { notifyBtn.style.display = "none"; checkReminders(); }});
});

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const date = todoDate.value;
    if (text !== "") {
        createTodoHTML(text, date, false);
        saveData();
        todoInput.value = ""; todoDate.value = "";
    } else alert("Tulis tugas dulu!");
});

clearBtn.addEventListener('click', () => {
    if (todoList.children.length === 0) { alert("Tugas sudah kosong!"); return; }
    if (confirm("Yakin Nih Mau hapus Semua tugas?")) {
        todoList.innerHTML = '';
        localStorage.removeItem(STORAGE_KEY);
        updateCounter();
        renderCalendar();
        document.querySelector('.filter-btn[data-filter="all"]').click();
    }
});

function createTodoHTML(text, date, isCompleted) {
    const li = document.createElement('li');
    li.classList.add('todo-item');
    if (isCompleted) li.classList.add('completed');

    const div = document.createElement('div');
    div.className = 'task-content';
    
    const spanText = document.createElement('span');
    spanText.className = 'task-text';
    spanText.innerText = text;
    
    const spanDate = document.createElement('span');
    spanDate.className = 'task-date';
    if (date) {
        spanDate.innerText = `Deadline: ${date}`;
        const today = new Date().toISOString().split('T')[0];
        if (date < today && !isCompleted) { spanDate.classList.add('overdue'); spanDate.innerText += " (Terlewat!)"; }
        else if (date === today && !isCompleted) { spanDate.style.color = "#d35400"; spanDate.innerText += " (HARI INI!)"; }
    } else spanDate.innerText = "Tidak ada deadline";

    div.append(spanText, spanDate);

    const checkBtn = document.createElement('button');
    checkBtn.className = 'action-btn check-btn';
    checkBtn.innerHTML = '&#10003;';
    checkBtn.onclick = () => {
        li.classList.toggle('completed');
        if(li.classList.contains('completed')) spanDate.classList.remove('overdue');
        saveData();
        filterTasks(document.querySelector('.filter-btn.active').getAttribute('data-filter'));
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '&#10005;';
    deleteBtn.onclick = () => { if(confirm('Hapus tugas ini?')) { li.remove(); saveData(); }};

    li.append(div, checkBtn, deleteBtn);
    todoList.appendChild(li);
}

function saveData() {
    const todos = [];
    document.querySelectorAll('.todo-item').forEach(item => {
        const text = item.querySelector('.task-text').innerText;
        let dateText = item.querySelector('.task-date').innerText;
        let cleanDate = dateText.includes("Deadline: ") ? dateText.replace("Deadline: ", "").split(" ")[0] : "";
        todos.push({ text, date: cleanDate, completed: item.classList.contains('completed') });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    updateCounter();
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) JSON.parse(stored).forEach(t => createTodoHTML(t.text, t.date, t.completed));
    updateCounter();
}

function updateCounter() {
    const total = document.querySelectorAll('.todo-item').length;
    const completed = document.querySelectorAll('.todo-item.completed').length;
    countPending.innerText = total - completed;
    countCompleted.innerText = completed;
}

function checkReminders() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const today = new Date().toISOString().split('T')[0];
    let urgent = 0;
    JSON.parse(stored).forEach(t => { if (!t.completed && t.date && t.date <= today) urgent++; });
    if (urgent > 0) new Notification("Tugas Mendesak!", { body: `Ada ${urgent} tugas deadline hari ini/terlewat.` });
}