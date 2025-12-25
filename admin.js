// Данные для админ-панели
let adminProjects = [];
let allMunicipalities = [];
let editingProjectId = null;

// Загрузка данных для админ-панели
async function loadAdminData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        adminProjects = data.projects;
        allMunicipalities = data.municipalities;
        displayAdminProjects();
        updateMunicipalityFilter();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Обновление фильтра муниципалитетов в форме
function updateMunicipalityFilter() {
    const select = document.getElementById('project-municipality');
    select.innerHTML = '<option value="">Выберите муниципалитет</option>';
    
    allMunicipalities.forEach(municipality => {
        const option = document.createElement('option');
        option.value = municipality.id;
        option.textContent = municipality.name;
        select.appendChild(option);
    });
}

// Отображение проектов в админ-панели
function displayAdminProjects() {
    const container = document.getElementById('admin-projects-list');
    container.innerHTML = '';
    
    if (adminProjects.length === 0) {
        container.innerHTML = `
            <div class="no-projects">
                <i class="fas fa-info-circle"></i>
                <p>Проекты не найдены</p>
            </div>
        `;
        return;
    }
    
    adminProjects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'admin-project-item';
        
        // Находим муниципалитет
        const municipality = allMunicipalities.find(m => m.id === project.municipality_id);
        
        projectItem.innerHTML = `
            <div class="admin-project-header">
                <h4>${project.name}</h4>
                <div class="project-meta">
                    <span class="project-id">ID: ${project.id}</span>
                    <span class="project-category">${project.category}</span>
                    <span class="project-status ${project.status}">${getStatusText(project.status)}</span>
                </div>
            </div>
            <div class="admin-project-details">
                <div><strong>Муниципалитет:</strong> ${municipality ? municipality.name : 'Не указан'}</div>
                <div><strong>Бюджет:</strong> ${project.budget}</div>
                <div><strong>Прогресс:</strong> ${project.progress}%</div>
                <div><strong>Сроки:</strong> ${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div>
            </div>
            <div class="admin-project-actions">
                <button class="btn btn-primary" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="btn btn-secondary" onclick="addCheckpoint(${project.id})">
                    <i class="fas fa-plus"></i> Добавить КП
                </button>
                <button class="btn btn-warning" onclick="uploadPhoto(${project.id})">
                    <i class="fas fa-camera"></i> Добавить фото
                </button>
                <button class="btn btn-danger" onclick="deleteProject(${project.id})">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;
        
        container.appendChild(projectItem);
    });
}

// Получение текста статуса
function getStatusText(status) {
    const statusMap = {
        'completed': 'Выполнено',
        'in_progress': 'В работе',
        'delayed': 'Просрочено',
        'planned': 'Запланировано'
    };
    return statusMap[status] || status;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Редактирование проекта
function editProject(projectId) {
    const project = adminProjects.find(p => p.id === projectId);
    if (!project) return;
    
    editingProjectId = projectId;
    
    // Заполняем форму данными проекта
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description;
    document.getElementById('project-municipality').value = project.municipality_id;
    document.getElementById('project-category').value = project.category;
    document.getElementById('project-status').value = project.status;
    document.getElementById('project-progress').value = project.progress;
    document.getElementById('project-budget').value = project.budget;
    document.getElementById('project-responsible').value = project.responsible;
    document.getElementById('project-contractor').value = project.contractor;
    document.getElementById('project-start-date').value = project.start_date;
    document.getElementById('project-end-date').value = project.end_date;
    
    // Изменяем текст кнопки
    const submitButton = document.querySelector('#add-project-form button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save"></i> Обновить проект';
    
    // Добавляем кнопку отмены
    let cancelButton = document.getElementById('cancel-edit');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary';
        cancelButton.id = 'cancel-edit';
        cancelButton.innerHTML = '<i class="fas fa-times"></i> Отмена';
        cancelButton.onclick = cancelEdit;
        submitButton.parentNode.appendChild(cancelButton);
    }
}

// Отмена редактирования
function cancelEdit() {
    editingProjectId = null;
    document.getElementById('add-project-form').reset();
    
    const submitButton = document.querySelector('#add-project-form button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save"></i> Сохранить проект';
    
    const cancelButton = document.getElementById('cancel-edit');
    if (cancelButton) {
        cancelButton.remove();
    }
}

// Обработка формы добавления/редактирования проекта
document.getElementById('add-project-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        municipality_id: parseInt(document.getElementById('project-municipality').value),
        category: document.getElementById('project-category').value,
        status: document.getElementById('project-status').value,
        budget: document.getElementById('project-budget').value,
        start_date: document.getElementById('project-start-date').value,
        end_date: document.getElementById('project-end-date').value,
        progress: parseInt(document.getElementById('project-progress').value) || 0,
        responsible: document.getElementById('project-responsible').value,
        contractor: document.getElementById('project-contractor').value
    };
    
    if (editingProjectId) {
        // Обновляем существующий проект
        const projectIndex = adminProjects.findIndex(p => p.id === editingProjectId);
        if (projectIndex !== -1) {
            // Сохраняем старые данные, которые не меняются
            const oldProject = adminProjects[projectIndex];
            adminProjects[projectIndex] = {
                ...oldProject,
                ...formData
            };
            alert('Проект успешно обновлен!');
        }
    } else {
        // Добавляем новый проект
        const newProject = {
            id: adminProjects.length > 0 ? Math.max(...adminProjects.map(p => p.id)) + 1 : 1,
            ...formData,
            coordinates: getRandomCoordinates(),
            checkpoints: [],
            photos: []
        };
        adminProjects.push(newProject);
        alert('Проект успешно добавлен!');
    }
    
    this.reset();
    cancelEdit();
    displayAdminProjects();
});

// Генерация случайных координат в Тамбовской области
function getRandomCoordinates() {
    // Примерные границы Тамбовской области
    const latMin = 52.0;
    const latMax = 53.5;
    const lonMin = 40.0;
    const lonMax = 42.5;
    
    return [
        latMin + Math.random() * (latMax - latMin),
        lonMin + Math.random() * (lonMax - lonMin)
    ];
}

// Добавление контрольной точки
function addCheckpoint(projectId) {
    const project = adminProjects.find(p => p.id === projectId);
    if (!project) return;
    
    const checkpointName = prompt('Введите название контрольной точки:');
    if (!checkpointName) return;
    
    const plannedDate = prompt('Введите плановую дату (ГГГГ-ММ-ДД):');
    if (!plannedDate) return;
    
    const newCheckpoint = {
        id: project.checkpoints.length > 0 ? Math.max(...project.checkpoints.map(c => c.id)) + 1 : 1,
        name: checkpointName,
        planned_date: plannedDate,
        actual_date: null,
        status: 'planned'
    };
    
    project.checkpoints.push(newCheckpoint);
    alert('Контрольная точка добавлена!');
    displayAdminProjects();
}

// Загрузка фото
function uploadPhoto(projectId) {
    const project = adminProjects.find(p => p.id === projectId);
    if (!project) return;
    
    const photoDescription = prompt('Введите описание фото:');
    if (!photoDescription) return;
    
    const newPhoto = {
        id: project.photos.length > 0 ? Math.max(...project.photos.map(p => p.id)) + 1 : 1,
        url: `https://images.unsplash.com/photo-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: photoDescription
    };
    
    project.photos.push(newPhoto);
    alert('Фото добавлено!');
    displayAdminProjects();
}

// Удаление проекта
function deleteProject(projectId) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;
    
    const projectIndex = adminProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        adminProjects.splice(projectIndex, 1);
        alert('Проект удален!');
        displayAdminProjects();
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
});
