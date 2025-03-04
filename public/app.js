document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    await loadTodos('life');
    await loadTodos('study');
    document.getElementById('lifeInput').addEventListener('keypress', e => handleKeyPress(e, 'life'));
    document.getElementById('studyInput').addEventListener('keypress', e => handleKeyPress(e, 'study'));
}

async function loadTodos(type) {
    try {
        const response = await fetch('/todos');
        if (!response.ok) throw new Error(response.statusText);
        const todos = await response.json();
        const filteredTodos = todos.filter(todo => todo.type === type);
        renderTodos(filteredTodos, type);
    } catch (error) {
        showError('加载待办事项失败: ' + error.message);
    }
}

function renderTodos(todos, type) {
    const list = document.getElementById(`${type}TodoList`);
    list.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    // 分离有日期和无日期的待办事项
    const todosWithDate = todos.filter(todo => todo.date).sort((a, b) => 
        new Date(a.date) - new Date(b.date));
    const todosWithoutDate = todos.filter(todo => !todo.date);

    // 渲染无日期事项
    if (todosWithoutDate.length > 0) {
        const section = createSection('未设置日期');
        todosWithoutDate.forEach(todo => section.appendChild(createTodoItem(todo, type)));
        list.appendChild(section);
    }

    // 渲染有日期事项
    if (todosWithDate.length > 0) {
        const section = createSection('已设置日期');
        todosWithDate.forEach(todo => {
            const isExpired = todo.date < today;
            section.appendChild(createTodoItem({ ...todo, isExpired }, type));
        });
        list.appendChild(section);
    }
}

function createTodoItem(todo, type) {
    const today = new Date().toISOString().split('T')[0];
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.isExpired ? 'expired' : ''} ${todo.date === today ? 'today' : ''}`;
    li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''} 
               onchange="toggleTodo('${todo.id}', '${type}')">
        <span class="todo-text">${escapeHTML(todo.text)}</span>
        <input type="date" class="todo-date" value="${todo.date || ''}" 
               onchange="updateTodoDate('${todo.id}', this.value, '${type}')">
        <button class="details-btn" onclick="showTodoDetails('${todo.id}', '${type}')">详情</button>
        <button class="delete-btn" onclick="deleteTodo('${todo.id}', '${type}')">删除</button>
        <div id="details-${todo.id}" class="todo-details"></div>
    `;
    return li;
}

function createSection(title) {
    const section = document.createElement('div');
    section.className = 'todo-section';
    section.innerHTML = `
        <h3>${title}</h3>
        <ul class="todo-sub-list"></ul>
    `;
    return section;
}

async function addTodo(type) {
    const input = document.getElementById(`${type}Input`);
    const text = input.value.trim();
    const date = document.getElementById(`${type}Date`).value || null;
    
    if (!text) {
        showError('请输入待办事项内容');
        return;
    }

    try {
        const response = await fetch('/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, date, type })
        });
        
        if (!response.ok) throw new Error(response.statusText);
        
        input.value = '';
        await loadTodos(type);
    } catch (error) {
        showError('添加失败: ' + error.message);
    }
}

async function updateTodoDate(id, newDate, type) {
    try {
        const response = await fetch(`/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: newDate })
        });
        
        if (!response.ok) throw new Error(response.statusText);
        await loadTodos(type);
    } catch (error) {
        showError('更新日期失败: ' + error.message);
    }
}

async function toggleTodo(id, type) {
    try {
        const todo = await getTodoById(id);
        const response = await fetch(`/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !todo.completed })
        });
        
        if (!response.ok) throw new Error(response.statusText);
        await loadTodos(type);
    } catch (error) {
        showError('更新状态失败: ' + error.message);
    }
}

async function deleteTodo(id, type) {
    if (!confirm('确定要删除此事项吗？')) return;
    
    try {
        const response = await fetch(`/todos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(response.statusText);
        await loadTodos(type);
    } catch (error) {
        showError('删除失败: ' + error.message);
    }
}

async function getTodoById(id) {
    const response = await fetch(`/todos/${id}`);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
}

function handleKeyPress(e, type) {
    if (e.key === 'Enter') {
        addTodo(type);
    }
}

function escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

async function showTodoDetails(id, type) {
    try {
        const todo = await getTodoById(id);
        const detailsDiv = document.getElementById(`details-${id}`);
        
        if (detailsDiv.style.display === 'block') {
            detailsDiv.style.display = 'none';
            return;
        }

        detailsDiv.innerHTML = `
            <textarea
                rows="4"
                placeholder="添加详细信息..."
                onchange="updateTodoDetails('${id}', this.value, '${type}')"
            >${todo.details || ''}</textarea>
        `;
        detailsDiv.style.display = 'block';
    } catch (error) {
        showError('获取详情失败: ' + error.message);
    }
}

async function updateTodoDetails(id, details, type) {
    try {
        const response = await fetch(`/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ details })
        });
        
        if (!response.ok) throw new Error(response.statusText);
        await loadTodos(type);
    } catch (error) {
        showError('更新详情失败: ' + error.message);
    }
}
