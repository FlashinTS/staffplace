// Глобальные переменные
let selectedBlocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'M', 'N', 'P', 'S'];
let selectedShelves = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeSelectionPills();
    updateSelectedItems();
});

// Инициализация пиллов выбора
function initializeSelectionPills() {
    // Блоки
    const blockPills = document.querySelectorAll('#blocksContainer .selection-pill');
    blockPills.forEach(pill => {
        pill.classList.add('active');
        pill.addEventListener('click', () => {
            const value = pill.getAttribute('data-value');
            pill.classList.toggle('active');
            updateSelectedBlocks();
        });
    });

    // Полки
    const shelfPills = document.querySelectorAll('#shelvesContainer .selection-pill');
    shelfPills.forEach(pill => {
        pill.classList.add('active');
        pill.addEventListener('click', () => {
            const value = pill.getAttribute('data-value');
            pill.classList.toggle('active');
            updateSelectedShelves();
        });
    });
}

// Обновление выбранных блоков
function updateSelectedBlocks() {
    selectedBlocks = [];
    document.querySelectorAll('#blocksContainer .selection-pill.active').forEach(pill => {
        selectedBlocks.push(pill.getAttribute('data-value'));
    });
    updateSelectedItems();
}

// Обновление выбранных полок
function updateSelectedShelves() {
    selectedShelves = [];
    document.querySelectorAll('#shelvesContainer .selection-pill.active').forEach(pill => {
        selectedShelves.push(pill.getAttribute('data-value'));
    });
    updateSelectedItems();
}

// Функция для парсинга диапазонов
function parseRange(input) {
    if (!input) return [];
    
    if (input.includes('-')) {
        const [start, end] = input.split('-').map(Number);
        if (isNaN(start) || isNaN(end)) return [];
        return Array.from({length: end - start + 1}, (_, i) => start + i);
    } else if (input.includes(',')) {
        return input.split(',').map(x => x.trim()).map(Number).filter(x => !isNaN(x));
    } else {
        const num = Number(input);
        return isNaN(num) ? [] : [num];
    }
}

// Функция для форматирования номера ячейки
function formatCellNumber(format, data) {
    let result = format;
    
    // Заменяем плейсхолдеры с правильным форматированием
    result = result.replace(/{block}/g, data.block);
    result = result.replace(/{floor}/g, data.floor);
    result = result.replace(/{row}/g, data.row);
    result = result.replace(/{row:02}/g, data.row.toString().padStart(2, '0'));
    result = result.replace(/{shelf}/g, data.shelf);
    result = result.replace(/{cabinet}/g, data.cabinet);
    result = result.replace(/{cabinet:02}/g, data.cabinet.toString().padStart(2, '0'));
    result = result.replace(/{cabinet:03}/g, data.cabinet.toString().padStart(3, '0'));
    result = result.replace(/{place}/g, data.place);
    
    return result;
}

// Обновление выбранных элементов
function updateSelectedItems() {
    const container = document.getElementById('selectedItems');
    const floors = parseRange(document.getElementById('floors').value);
    const rows = parseRange(document.getElementById('rows').value);
    const cabinets = parseRange(document.getElementById('cabinets').value);
    const places = parseRange(document.getElementById('places').value);
    
    let html = `
        <div class="d-flex flex-wrap mb-2">
            <span class="tag">Блоки: ${selectedBlocks.join(', ')}</span>
            <span class="tag">Этажи: ${floors.join(', ')}</span>
            <span class="tag">Ряды: ${rows.join(', ')}</span>
        </div>
        <div class="d-flex flex-wrap">
            <span class="tag">Шкафы: ${cabinets.join(', ')}</span>
            <span class="tag">Полки: ${selectedShelves.join(', ')}</span>
            <span class="tag">Места: ${places.join(', ')}</span>
        </div>
        <div class="mt-3">
            <small class="text-muted">Всего комбинаций: ${calculateTotalCombinations().toLocaleString()}</small>
        </div>
    `;
    
    container.innerHTML = html;
}

// Расчет общего количества комбинаций
function calculateTotalCombinations() {
    const floors = parseRange(document.getElementById('floors').value);
    const rows = parseRange(document.getElementById('rows').value);
    const cabinets = parseRange(document.getElementById('cabinets').value);
    const places = parseRange(document.getElementById('places').value);
    
    return selectedBlocks.length * floors.length * rows.length * cabinets.length * selectedShelves.length * places.length;
}

// Обновление предпросмотра
function updatePreview() {
    try {
        const preview = document.getElementById('preview');
        preview.innerHTML = '<p class="text-center"><i class="fas fa-spinner fa-spin"></i> Генерация предпросмотра...</p>';
        
        setTimeout(() => {
            const floors = parseRange(document.getElementById('floors').value);
            const rows = parseRange(document.getElementById('rows').value);
            const cabinets = parseRange(document.getElementById('cabinets').value);
            const places = parseRange(document.getElementById('places').value);
            const format = document.getElementById('format').value;
            
            let html = '<div class="row">';
            let count = 0;
            const maxPreview = 12;
            
            // Генерируем примеры для предпросмотра
            for (const block of selectedBlocks.slice(0, 2)) {
                for (const floor of floors.slice(0, 1)) {
                    for (const row of rows.slice(0, 1)) {
                        for (const cabinet of cabinets.slice(0, 1)) {
                            for (const shelf of selectedShelves.slice(0, 2)) {
                                for (const place of places.slice(0, 1)) {
                                    if (count >= maxPreview) break;
                                    
                                    const cellData = { block, floor, row, cabinet, shelf, place };
                                    const cellNumber = formatCellNumber(format, cellData);
                                    
                                    html += `
                                        <div class="col-md-6">
                                            <div class="preview-item d-flex justify-content-between align-items-center">
                                                <span>${cellNumber}</span>
                                                <i class="fas fa-copy copy-btn" onclick="copyText('${cellNumber}')"></i>
                                            </div>
                                        </div>
                                    `;
                                    
                                    count++;
                                }
                            }
                        }
                    }
                }
            }
            
            html += '</div>';
            preview.innerHTML = html;
        }, 500);
        
    } catch (error) {
        document.getElementById('preview').innerHTML = `
            <div class="alert alert-danger">Ошибка предпросмотра: ${error.message}</div>
        `;
    }
}

// Копирование текста
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        const preview = document.getElementById('preview');
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-check-circle"></i> Скопировано: ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        preview.prepend(alert);
        
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 2000);
    });
}

// Копирование всего списка
function copyToClipboard() {
    try {
        const floors = parseRange(document.getElementById('floors').value);
        const rows = parseRange(document.getElementById('rows').value);
        const cabinets = parseRange(document.getElementById('cabinets').value);
        const places = parseRange(document.getElementById('places').value);
        const format = document.getElementById('format').value;
        
        let text = '';
        let count = 0;
        const maxCopy = 100;
        
        for (const block of selectedBlocks) {
            for (const floor of floors) {
                for (const row of rows) {
                    for (const cabinet of cabinets) {
                        for (const shelf of selectedShelves) {
                            for (const place of places) {
                                if (count >= maxCopy) break;
                                
                                const cellData = { block, floor, row, cabinet, shelf, place };
                                const cellNumber = formatCellNumber(format, cellData);
                                text += cellNumber + '\n';
                                count++;
                            }
                        }
                    }
                }
            }
        }
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`Скопировано ${count} ячеек в буфер обмена`);
        });
        
    } catch (error) {
        showNotification('Ошибка при копировании: ' + error.message, 'error');
    }
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
    `;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} me-2"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

// Основная функция генерации Excel
function generateExcel() {
    try {
        // Сбрасываем сообщения
        document.getElementById('error').classList.add('d-none');
        document.getElementById('progress').classList.remove('d-none');
        
        // Получаем параметры
        const floors = parseRange(document.getElementById('floors').value);
        const rows = parseRange(document.getElementById('rows').value);
        const cabinets = parseRange(document.getElementById('cabinets').value);
        const places = parseRange(document.getElementById('places').value);
        const format = document.getElementById('format').value;
        const filename = document.getElementById('filename').value;
        const limit = parseInt(document.getElementById('limit').value);
        
        // Валидация
        if (selectedBlocks.length === 0) throw new Error('Выберите хотя бы один блок');
        if (floors.length === 0) throw new Error('Укажите этажи');
        if (rows.length === 0) throw new Error('Укажите ряды');
        if (cabinets.length === 0) throw new Error('Укажите шкафы');
        if (selectedShelves.length === 0) throw new Error('Выберите хотя бы одну полку');
        if (places.length === 0) throw new Error('Укажите места');
        
        const total = Math.min(calculateTotalCombinations(), limit);
        
        // Создаем данные для Excel
        const data = [['Номер ячейки', 'Блок', 'Этаж', 'Ряд', 'Шкаф', 'Полка', 'Место']];
        let count = 0;
        
        // Генерируем все комбинации
        for (const block of selectedBlocks) {
            if (count >= limit) break;
            
            for (const floor of floors) {
                if (count >= limit) break;
                
                for (const row of rows) {
                    if (count >= limit) break;
                    
                    for (const cabinet of cabinets) {
                        if (count >= limit) break;
                        
                        for (const shelf of selectedShelves) {
                            if (count >= limit) break;
                            
                            for (const place of places) {
                                if (count >= limit) break;
                                
                                const cellData = {
                                    block,
                                    floor,
                                    row,
                                    cabinet,
                                    shelf,
                                    place
                                };
                                
                                const cellNumber = formatCellNumber(format, cellData);
                                
                                data.push([
                                    cellNumber,
                                    block,
                                    floor,
                                    row,
                                    cabinet,
                                    shelf,
                                    place
                                ]);
                                
                                count++;
                                
                                // Обновляем прогресс
                                if (count % 1000 === 0 || count === total) {
                                    const progress = (count / total) * 100;
                                    document.getElementById('progressText').textContent = `${count.toLocaleString()} / ${total.toLocaleString()}`;
                                    document.getElementById('progressBar').style.width = `${progress}%`;
                                    setTimeout(() => {}, 0);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Создаем книгу Excel
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ячейки хранения');
        
        // Скачиваем файл
        XLSX.writeFile(wb, filename);
        
        showNotification(`Файл "${filename}" успешно создан с ${count.toLocaleString()} ячейками`);
        
    } catch (error) {
        document.getElementById('error').textContent = 'Ошибка: ' + error.message;
        document.getElementById('error').classList.remove('d-none');
        document.getElementById('progress').classList.add('d-none');
        showNotification('Ошибка генерации: ' + error.message, 'error');
    }
}

// Слушатели изменений для обновления выбранных элементов
document.getElementById('floors').addEventListener('input', updateSelectedItems);
document.getElementById('rows').addEventListener('input', updateSelectedItems);
document.getElementById('cabinets').addEventListener('input', updateSelectedItems);
document.getElementById('places').addEventListener('input', updateSelectedItems);