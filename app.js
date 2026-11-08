let SUPABASE_URL = "";
let SUPABASE_KEY = "";
let TABLE_NAME = "tasks";

let editingTaskId = null;

async function initConfig() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        SUPABASE_URL = config.supabaseUrl;
        SUPABASE_KEY = config.supabasePublishableKey;
        TABLE_NAME = config.tableName || "tasks";
        fetchTasks();
    } catch (err) {
        showStatus("Failed to load configuration.", true);
    }
}

function showStatus(msg, isError = false) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = msg;
    statusEl.style.color = isError ? 'red' : 'green';
}

async function fetchTasks() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (err) {
        showStatus(err.message, true);
    }
}

function renderTasks(tasks) {
    const listEl = document.getElementById('task-list');
    listEl.innerHTML = '';
    
    tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.setAttribute('data-id', task.id);
        div.style.border = "1px solid #ccc";
        div.style.margin = "10px 0";
        div.style.padding = "10px";

        div.innerHTML = `
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <p class="task-description">${escapeHtml(task.description || '')}</p>
            <p>Status: <span class="task-status">${task.completed ? 'Completed' : 'Incomplete'}</span></p>
            <button class="toggle-task" onclick="toggleTask(${task.id}, ${task.completed})">${task.completed ? 'Mark Incomplete' : 'Mark Complete'}</button>
            <button class="edit-task" onclick="startEdit(${task.id}, '${escapeHtml(task.title)}', '${escapeHtml(task.description || '')}')">Edit</button>
            <button class="delete-task" onclick="deleteTask(${task.id})">Delete</button>
        `;
        listEl.appendChild(div);
    });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;

    if (editingTaskId === null) {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({ title, description, completed: false })
            });
            if (!res.ok) throw new Error("Failed to create task");
            showStatus("Task successfully added!");
            document.getElementById('task-form').reset();
            fetchTasks();
        } catch (err) {
            showStatus(err.message, true);
        }
    } else {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${editingTaskId}`, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({ title, description })
            });
            if (!res.ok) throw new Error("Failed to update task");
            showStatus("Task successfully updated!");
            document.getElementById('task-form').reset();
            editingTaskId = null;
            document.getElementById('task-submit').textContent = "Save Task";
            fetchTasks();
        } catch (err) {
            showStatus(err.message, true);
        }
    }
});

async function deleteTask(id) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!res.ok) throw new Error("Failed to delete task");
        showStatus("Task deleted successfully");
        fetchTasks();
    } catch (err) {
        showStatus(err.message, true);
    }
}

async function toggleTask(id, currentStatus) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ completed: !currentStatus })
        });
        if (!res.ok) throw new Error("Failed to change task status");
        fetchTasks();
    } catch (err) {
        showStatus(err.message, true);
    }
}

function startEdit(id, title, description) {
    editingTaskId = id;
    document.getElementById('task-title').value = title;
    document.getElementById('task-description').value = description;
    document.getElementById('task-submit').textContent = "Update Task";
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

initConfig();