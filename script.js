// Загрузка данных проектов
let allProjects = [];
let allMunicipalities = [];
let map = null;
let placemarks = [];

// Загрузка данных из JSON
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        allProjects = data.projects;
        allMunicipalities = data.municipalities;
        
        // Заполняем фильтр муниципалитетов
        const municipalityFilter = document.getElementById('municipality-filter');
        allMunicipalities.forEach(mun => {
            const option = document.createElement('option');
            option.value = mun.id;
            option.textContent = mun.name;
            municipalityFilter.appendChild(option);
        });
        
        // Инициализируем карту
        initYandexMap();
        
        // Отображаем все проекты
        displayProjects(allProjects);
        
        // Обновляем статистику
        updateStatistics();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить данные проектов');
    }
}

// Инициализация Яндекс.Карты
function initYandexMap() {
    if (!window.ymaps) {
        console.error('Библиотека Яндекс.Карт не загружена');
        return;
    }

    ymaps.ready(function() {
        // Создаем карту с центром на Тамбовской области
        map = new ymaps.Map('map', {
            center: [52.7212, 41.4523], // Центр Тамбова
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
        }, {
            searchControlProvider: 'yandex#search'
        });
        
        // Добавляем объекты на карту
        addProjectsToMap(allProjects);
    });
}

// Добавление проектов на карту
function addProjectsToMap(projects) {
    // Удаляем старые метки
    if (placemarks.length > 0) {
        placemarks.forEach(pm => map.geoObjects.remove(pm));
        placemarks = [];
    }
    
    // Создаем кластеризатор для группировки меток
    const clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonItemContentLayout: ymaps.templateLayoutFactory.createClass(
            '<div class="cluster-item">' +
                '<strong>{{ properties.name }}</strong><br>' +
                '{{ properties.category }}<br>' +
                'Статус: {{ properties.statusText }}' +
            '</div>'
        )
    });
    
    projects.forEach(project => {
        // Определяем цвет метки по статусу
        let iconColor;
        switch(project.status) {
            case 'completed': iconColor = 'green'; break;
            case 'in_progress': iconColor = 'yellow'; break;
            case 'delayed': iconColor = 'red'; break;
            default: iconColor = 'gray';
        }
        
        // Определяем текст статуса
        const statusText = getStatusText(project.status);
        
        // Находим муниципалитет
        const municipality = allMunicipalities.find(m => m.id === project.municipality_id);
        
        // Создаем метку
        const placemark = new ymaps.Placemark(project.coordinates, {
            balloonContentHeader: `<strong>${project.name}</strong>`,
            balloonContentBody: `
                <div class="map-balloon">
                    <p><strong>Описание:</strong> ${project.description}</p>
                    <p><strong>Муниципалитет:</strong> ${municipality ? municipality.name : 'Не указан'}</p>
                    <p><strong>Категория:</strong> ${project.category}</p>
                    <p><strong>Статус:</strong> ${statusText}</p>
                    <p><strong>Бюджет:</strong> ${project.budget}</p>
                    <p><strong>Прогресс:</strong> ${project.progress}%</p>
                    <div style="margin-top: 10px;">
                        <a href="project.html?id=${project.id}" class="map-balloon-link">
                            <i class="fas fa-eye"></i> Подробнее
                        </a>
                    </div>
                </div>
            `,
            balloonContentFooter: `<em>Дата обновления: ${new Date().toLocaleDateString('ru-RU')}</em>`,
            hintContent: project.name
        }, {
            // Опции метки
            preset: 'islands#${iconColor}Icon',
            iconColor: iconColor,
            balloonCloseButton: true,
            hideIconOnBalloonOpen: false
        });
        
        placemarks.push(placemark);
        clusterer.add(placemark);
        
        // Добавляем обработчик клика для перехода на страницу проекта
        placemark.events.add('click', function() {
            window.location.href = `project.html?id=${project.id}`;
        });
    });
    
    // Добавляем кластеризатор на карту
    map.geoObjects.add(clusterer);
    
    // Если есть проекты, устанавливаем границы карты
    if (projects.length > 0) {
        if (projects.length === 1) {
            map.setCenter(projects[0].coordinates, 15);
        } else {
            const bounds = getProjectsBounds(projects);
            map.setBounds(bounds, { checkZoomRange: true });
        }
    }
}

// Получение границ для всех проектов
function getProjectsBounds(projects) {
    const coordinates = projects.map(p => p.coordinates);
    return ymaps.util.bounds.fromPoints(coordinates);
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

// Отображение проектов
function displayProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="no-projects">
                <i class="fas fa-info-circle"></i>
                <p>Проекты не найдены</p>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        container.appendChild(projectCard);
    });
}

// Создание карточки проекта
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
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
    
    // Определяем цвет светофора
    let trafficLightClass, trafficLightText;
    if (project.progress >= 100) {
        trafficLightClass = 'green';
        trafficLightText = 'По графику';
    } else if (project.progress >= 80) {
        trafficLightClass = 'yellow';
        trafficLightText = 'Незначительное отставание';
    } else if (project.progress < 80) {
        trafficLightClass = 'red';
        trafficLightText = 'Критическое отставание';
    }
    
    // Находим муниципалитет
    const municipality = allMunicipalities.find(m => m.id === project.municipality_id);
    
    card.innerHTML = `
        <div class="project-status ${statusClass}"></div>
        <div class="project-content">
            <div class="project-header">
                <h3 class="project-title">${project.name}</h3>
                <span class="project-category">${project.category}</span>
            </div>
            
            <p class="project-description">${project.description}</p>
            
            <div class="project-details">
                <div class="project-detail">
                    <span class="detail-label">Муниципалитет:</span>
                    <span class="detail-value">${municipality ? municipality.name : 'Не указан'}</span>
                </div>
                <div class="project-detail">
                    <span class="detail-label">Статус:</span>
                    <span class="detail-value">${statusText}</span>
                </div>
                <div class="project-detail">
                    <span class="detail-label">Бюджет:</span>
                    <span class="detail-value">${project.budget}</span>
                </div>
                <div class="project-detail">
                    <span class="detail-label">Сроки:</span>
                    <span class="detail-value">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</span>
                </div>
            </div>
            
            <div class="progress-section">
                <div class="progress-bar">
                    <div class="progress-fill ${trafficLightClass}" style="width: ${project.progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>Выполнено: ${project.progress}%</span>
                    <span class="traffic-light-text">${trafficLightText}</span>
                </div>
            </div>
            
            <div class="project-footer">
                <div class="project-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${municipality ? municipality.name : 'Не указан'}</span>
                </div>
                <a href="project.html?id=${project.id}" class="btn-view">
                    <i class="fas fa-eye"></i> Подробнее
                </a>
            </div>
        </div>
    `;
    
    return card;
}

// Обновление статистики
function updateStatistics() {
    const total = allProjects.length;
    const completed = allProjects.filter(p => p.status === 'completed').length;
    const inProgress = allProjects.filter(p => p.status === 'in_progress').length;
    const delayed = allProjects.filter(p => p.status === 'delayed').length;
    
    document.querySelector('.stat-number.total').textContent = total;
    document.querySelector('.stat-number.completed').textContent = completed;
    document.querySelector('.stat-number.in-progress').textContent = inProgress;
    document.querySelector('.stat-number.delayed').textContent = delayed;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Применение фильтров
function applyFilters() {
    const municipalityFilter = document.getElementById('municipality-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    let filteredProjects = [...allProjects];
    
    if (municipalityFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.municipality_id == municipalityFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.category === categoryFilter);
    }
    
    displayProjects(filteredProjects);
    
    // Обновляем карту с отфильтрованными проектами
    if (map) {
        addProjectsToMap(filteredProjects);
    }
}

// Сброс фильтров
function resetFilters() {
    document.getElementById('municipality-filter').value = 'all';
    document.getElementById('status-filter').value = 'all';
    document.getElementById('category-filter').value = 'all';
    displayProjects(allProjects);
    
    // Обновляем карту со всеми проектами
    if (map) {
        addProjectsToMap(allProjects);
    }
}

// Показ ошибки
function showError(message) {
    const container = document.getElementById('projects-container');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем скрипт Яндекс.Карт
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=ваш_api_ключ';
    script.async = true;
    
    script.onload = function() {
        loadData();
    };
    
    script.onerror = function() {
        console.error('Не удалось загрузить Яндекс.Карты');
        showError('Не удалось загрузить карту');
        loadData(); // Все равно загружаем данные, но без карты
    };
    
    document.head.appendChild(script);
    
    // Назначаем обработчики фильтров
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});
