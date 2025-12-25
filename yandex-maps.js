// Файл для инициализации Яндекс.Карт с использованием бесплатного API ключа
// В демо-версии используем тестовый ключ

const YANDEX_MAPS_API_KEY = 'test'; // Для тестирования

// Функция для создания карты с использованием API Яндекс.Карт
function initializeYandexMaps() {
    if (typeof ymaps === 'undefined') {
        console.error('Библиотека Яндекс.Карт не загружена');
        return null;
    }
    
    return new Promise((resolve) => {
        ymaps.ready(() => {
            resolve(ymaps);
        });
    });
}

// Экспортируем функцию для использования в других файлах
window.initializeYandexMaps = initializeYandexMaps;