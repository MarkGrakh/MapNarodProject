// Загрузка деталей проекта
async function loadProjectDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        showError('ID проекта не указан');
        return;
    }
    
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        const project = data.projects.find(p => p.id == projectId);
        const municipality = data.municipalities.find(m => m.id === project.municipality_id);
        
        if (!project) {
            showError('Проект не найден');
            return;
        }
        
        displayProjectDetails(project, municipality);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить данные проекта');
    }
}

// Отображение деталей проекта
function displayProjectDetails(project, municipality) {
    const container = document.getElementById('project-detail');
    
    // Определяем цвет статуса
    let statusClass, statusText;
    switch(project.status) {
        case 'completed':
            statusClass = 'status-green';
            statusText = 'Выполнено';
            break;
        case 'in_progress':
            statusClass = 'status-yellow';
            statusText = 'В работе';
            break;
        case 'delayed':
            statusClass = 'status-red';
            statusText = 'Просрочено';
            break;
        default:
            statusClass = 'status-gray';
            statusText = 'Запланировано';
    }
    
    // Формируем HTML
    container.innerHTML = `
        <div class="project-header">
            <h2>${project.name}</h2>
            <div class="project-status-badge ${statusClass}">${statusText}</div>
        </div>
        
        <div class="project-main-info">
            <div class="project-description">
                <h3><i class="fas fa-info-circle"></i> Описание</h3>
                <p>${project.description}</p>
                
                <div class="project-actions" style="margin-top: 20px;">
                    <a href="index.html" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> К списку проектов
                    </a>
                    <a href="admin.html" class="btn btn-primary">
                        <i class="fas fa-edit"></i> Редактировать в админке
                    </a>
                </div>
            </div>
            
            <div class="project-meta">
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-tags"></i> Категория</div>
                    <div class="meta-value">${project.category}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-city"></i> Муниципалитет</div>
                    <div class="meta-value">${municipality ? municipality.name : 'Не указан'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-money-bill-wave"></i> Бюджет</div>
                    <div class="meta-value">${project.budget}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-calendar-alt"></i> Сроки</div>
                    <div class="meta-value">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-user-tie"></i> Ответственный</div>
                    <div class="meta-value">${project.responsible}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label"><i class="fas fa-hard-hat"></i> Подрядчик</div>
                    <div class="meta-value">${project.contractor}</div>
                </div>
                <div class="meta-item full-width">
                    <div class="meta-label"><i class="fas fa-chart-line"></i> Прогресс выполнения</div>
                    <div class="progress-section-small">
                        <div class="progress-bar">
                            <div class="progress-fill ${getProgressColorClass(project.progress)}" 
                                 style="width: ${project.progress}%"></div>
                        </div>
                        <div class="progress-percentage">${project.progress}% выполнено</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="checkpoints-section">
            <h3><i class="fas fa-tasks"></i> Контрольные точки</h3>
            ${project.checkpoints && project.checkpoints.length > 0 ? `
                <div class="checkpoints-list">
                    ${project.checkpoints.map(checkpoint => `
                        <div class="checkpoint-item">
                            <div class="checkpoint-status ${getCheckpointStatusClass(checkpoint)}"></div>
                            <div class="checkpoint-info">
                                <div class="checkpoint-name">${checkpoint.name}</div>
                                <div class="checkpoint-dates">
                                    <span><i class="fas fa-calendar-check"></i> План: ${formatDate(checkpoint.planned_date)}</span>
                                    <span><i class="fas fa-calendar-day"></i> Факт: ${formatDate(checkpoint.actual_date) || 'Не выполнено'}</span>
                                </div>
                                ${checkpoint.status === 'completed' ? 
                                    '<span class="checkpoint-completed"><i class="fas fa-check"></i> Выполнено</span>' : 
                                    checkpoint.actual_date ? 
                                    '<span class="checkpoint-in-progress"><i class="fas fa-spinner"></i> В работе</span>' :
                                    '<span class="checkpoint-delayed"><i class="fas fa-exclamation-triangle"></i> Ожидает выполнения</span>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="no-checkpoints">
                    <i class="fas fa-info-circle"></i>
                    <p>Контрольные точки не добавлены</p>
                </div>
            `}
        </div>
        
        <div class="photos-section">
            <h3><i class="fas fa-camera"></i> Фотоотчет</h3>
            ${project.photos && project.photos.length > 0 ? `
                <div class="photos-grid">
                    ${project.photos.map(photo => `
                        <div class="photo-item">
                            <img src="${photo.url}" alt="${photo.description}" loading="lazy">
                            <div class="photo-caption">
                                <div><i class="fas fa-calendar"></i> ${formatDate(photo.date)}</div>
                                <div>${photo.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="no-photos">
                    <i class="fas fa-camera-slash"></i>
                    <p>Фотоотчеты не добавлены</p>
                </div>
            `}
        </div>
    `;
}

// Получение класса статуса для контрольной точки
function getCheckpointStatusClass(checkpoint) {
    if (checkpoint.status === 'completed') return 'status-completed';
    if (checkpoint.actual_date === null) return 'status-delayed';
    return 'status-in-progress';
}

// Получение цвета прогресса
function getProgressColorClass(progress) {
    if (progress >= 100) return 'green';
    if (progress >= 80) return 'yellow';
    if (progress >= 50) return 'orange';
    return 'red';
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Не указано';
        return date.toLocaleDateString('ru-RU');
    } catch (error) {
        return 'Не указано';
    }
}

// Показ ошибки
function showError(message) {
    const container = document.getElementById('project-detail');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка</h3>
            <p>${message}</p>
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-arrow-left"></i> Вернуться на главную
            </a>
        </div>
    `;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', loadProjectDetails);
