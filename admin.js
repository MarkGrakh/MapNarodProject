// Данные для админ-панели
let adminProjects = [];

// Загрузка данных для админ-панели
async function loadAdminData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        adminProjects = data.projects;
        displayAdminProjects();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Отображение проектов в админ-панели
function displayAdminProjects() {
    const container = document.getElementById('admin-projects-list');
    container.innerHTML = '';
    
    adminProjects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'admin-project-item';
        
        // Находим муниципалитет
        const municipality = allMunicipalities.find(m => m.id === project.municipality_id);
        
        projectItem.innerHTML = `
            <div class="admin-project-header">
                <h4>${project.name}</h4>
                <span class="project-id">ID: ${project.id}</span>
            </div>
            <div class="admin-project-details">
                <div><strong>Муниципалитет:</strong> ${municipality ? municipality.name : 'Не указан'}</div>
                <div><strong>Статус:</strong> ${getStatusText(project.status)}</div>
                <div><strong>Прогресс:</strong> ${project.progress}%</div>
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

// Обработка формы добавления проекта
document.getElementById('add-project-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        id: adminProjects.length + 1,
        name: document.getElementById('project-name').value,
        description: document.getElementById('project-description').value,
        municipality_id: parseInt(document.getElementById('project-municipality').value),
        category: document.getElementById('project-category').value,
        status: document.getElementById('project-status').value,
        budget: document.getElementById('project-budget').value,
        start_date: document.getElementById('project-start-date').value,
        end_date: document.getElementById('project-end-date').value,
        progress: parseInt(document.getElementById('project-progress').value),
        responsible: document.getElementById('project-responsible').value,
        contractor: document.getElementById('project-contractor').value,
        coordinates: [55.7558, 37.6176],
        checkpoints: [],
        photos: []
    };
    
    // В реальном приложении здесь был бы запрос к API
    adminProjects.push(formData);
    alert('Проект успешно добавлен!');
    this.reset();
    displayAdminProjects();
});

// Добавление контрольной точки
function addCheckpoint(projectId) {
    const project = adminProjects.find(p => p.id === projectId);
    if (!project) return;
    
    const checkpointName = prompt('Введите название контрольной точки:');
    if (!checkpointName) return;
    
    const plannedDate = prompt('Введите плановую дату (ГГГГ-ММ-ДД):');
    if (!plannedDate) return;
    
    const newCheckpoint = {
        id: project.checkpoints.length + 1,
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
    
    // В реальном приложении здесь была бы загрузка файла
    const newPhoto = {
        id: project.photos.length + 1,
        url: `https://images.unsplash.com/photo-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: photoDescription
    };
    
    project.photos.push(newPhoto);
    alert('Фото добавлено!');
    displayAdminProjects();
}

// Редактирование проекта
function editProject(projectId) {
    alert(`Редактирование проекта ${projectId} (в демо-версии не реализовано)`);
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
});