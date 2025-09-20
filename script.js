// Глобальные переменные
let selectedBlocks = [];
let selectedShelves = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    initializeSelectionPills();
    updateSelectedItems();
});

// Инициализация пиллов выбора
function initializeSelectionPills() {
    // Блоки
    const blockPills = document.querySelectorAll('#blocksContainer .selection-pill');
    blockPills.forEach(pill => {
        const value = pill.getAttribute('data-value');
        if (selectedBlocks.includes(value)) {
            pill.classList.add('active');
        }
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
            updateSelectedBlocks();
            saveSettings();
        });
    });

    // Полки
    const shelfPills = document.querySelectorAll('#shelvesContainer .selection-pill');
    shelfPills.forEach(pill => {
        const value = pill.getAttribute('data-value');
        if (selectedShelves.includes(value)) {
            pill.classList.add('active');
        }
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
            updateSelectedShelves();
            saveSettings();
        });
    });
}

// Сохранение настроек
function saveSettings() {
    const settings = {
        blocks: selectedBlocks,
        shelves: selectedShelves,
        floors: document.getElementById('floors').value,
        rows: document.getElementById('rows').value,
        cabinets: document.getElementById('cabinets').value,
        places: document.getElementById('places').value,
        format: document.getElementById('format').value,
        filename: document.getElementById('filename').value,
        limit: document.getElementById('limit').value
    };
    localStorage.setItem('storageSettings', JSON.stringify(settings));
}

// Загрузка настроек
function loadSettings() {
    const saved = localStorage.getItem('storageSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        selectedBlocks = settings.blocks || [];
        selectedShelves = settings.shelves || [];
        document.getElementById('floors').value = settings.floors || '1-5';
        document.getElementById('rows').value = settings.rows || '1-40';
        document.getElementById('cabinets').value = settings.cabinets || '1-50';
        document.getElementById('places').value = settings.places || '1-5';
        document.getElementById('format').value = settings.format || '{block}{floor}-{row:02}-{shelf}-{cabinet:02}{place}';
        document.getElementById('filename').value = settings.filename || 'ячейки_хранения.xlsx';
        document.getElementById('limit').value = settings.limit || '1000';
    }
}

// Сброс настроек
function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
        localStorage.removeItem('storageSettings');
        selectedBlocks = [];
        selectedShelves = [];
        document.getElementById('floors').value = '1-5';
        document.getElementById('rows').value = '1-40';
        document.getElementById('cabinets').value = '1-50';
        document.getElementById('places').value = '1-5';
        document.getElementById('format').value = '{block}{floor}-{row:02}-{shelf}-{cabinet:02}{place}';
        document.getElementById('filename').value = 'ячейки_хранения.xlsx';
        document.getElementById('limit').value = '1000';
        
        // Сброс пиллов
        document.querySelectorAll('.selection-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        
        updateSelectedItems();
        showNotification('Настройки сброшены', 'success');
    }
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
// Новая функция для форматирования номера ячейки для печати
function formatCellForPrint(format, data) {
    // Форматируем основные части
    const blockFloor = data.block + data.floor;
    const rowFormatted = data.row.toString().padStart(2, '0');
    const cabinetFormatted = data.cabinet.toString().padStart(2, '0'); // Всегда 2 цифры
    const cabinetPlace = cabinetFormatted + data.place; // 01 + 1 = 011
    
    // Для отображения на этикетке (без дефиса перед цифрами)
    const displayText = `
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">${blockFloor}</div>
        <div style="font-size: 12px; font-weight: bold;">${rowFormatted}-${data.shelf}-${cabinetPlace}</div>
    `;
    
    // Для QR-кода (полный формат с дефисами)
    const qrText = `${blockFloor}-${rowFormatted}-${data.shelf}-${cabinetFormatted}${data.place}`;
    
    return {
        display: displayText,
        qr: qrText
    };
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
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Блоки: ${selectedBlocks.join(', ') || 'не выбраны'}</span>
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Этажи: ${floors.join(', ')}</span>
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Ряды: ${rows.join(', ')}</span>
        </div>
        <div class="d-flex flex-wrap">
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Шкафы: ${cabinets.join(', ')}</span>
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Полки: ${selectedShelves.join(', ') || 'не выбраны'}</span>
            <span class="tag" style="background:#dc3545;color:white;padding:4px 8px;border-radius:10px;margin:2px;">Места: ${places.join(', ')}</span>
        </div>
        <div class="mt-2">
            <small class="text-muted">Всего комбинаций: ${calculateTotalCombinations().toLocaleString()}</small>
        </div>
    `;
    
    container.innerHTML = html;
    saveSettings();
}

// Расчет общего количества комбинаций
function calculateTotalCombinations() {
    const floors = parseRange(document.getElementById('floors').value);
    const rows = parseRange(document.getElementById('rows').value);
    const cabinets = parseRange(document.getElementById('cabinets').value);
    const places = parseRange(document.getElementById('places').value);
    
    return selectedBlocks.length * floors.length * rows.length * cabinets.length * selectedShelves.length * places.length;
}

// Показать модальное окно предпросмотра
function showPreview() {
    try {
        const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        generateLabels();
        previewModal.show();
    } catch (error) {
        showNotification('Ошибка открытия предпросмотра: ' + error.message, 'error');
    }
}

// Генерация этикеток
function generateLabels() {
    try {
        const container = document.getElementById('previewContainer');
        const countElement = document.getElementById('previewCount');
        container.innerHTML = '<div class="text-center w-100"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Генерация этикеток...</p></div>';
        
        setTimeout(() => {
            const floors = parseRange(document.getElementById('floors').value);
            const rows = parseRange(document.getElementById('rows').value);
            const cabinets = parseRange(document.getElementById('cabinets').value);
            const places = parseRange(document.getElementById('places').value);
            
            let html = '<div class="print-container">';
            let count = 0;
            
            // Генерируем все комбинации для этикеток БЕЗ ОГРАНИЧЕНИЙ
            for (const block of selectedBlocks) {
                for (const floor of floors) {
                    for (const row of rows) {
                        for (const cabinet of cabinets) {
                            for (const shelf of selectedShelves) {
                                for (const place of places) {
                                    const cellData = { block, floor, row, cabinet, shelf, place };
                                    const formatted = formatCellForPrint('', cellData);
                                    
                                    html += `
                                        <div class="label-sheet">
                                            <div class="label-text">${formatted.display}</div>
                                            <div class="label-qr" id="qr-${count}" data-qrtext="${formatted.qr}"></div>
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
            container.innerHTML = html;
            countElement.textContent = count.toLocaleString();
            
            // Генерируем QR-коды с оптимизацией для большого количества
            let generated = 0;
            const total = count;
            
            function generateNextQr() {
                if (generated >= total) return;
                
                const qrContainer = document.getElementById(`qr-${generated}`);
                if (qrContainer) {
                    qrContainer.innerHTML = '';
                    const qrText = qrContainer.getAttribute('data-qrtext');
                    
                    new QRCode(qrContainer, {
                        text: qrText,
                        width: 80,
                        height: 80,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
                
                generated++;
                
                // Обновляем прогресс каждые 50 QR-кодов
                if (generated % 50 === 0 || generated === total) {
                    document.getElementById('previewCount').textContent = `${generated.toLocaleString()} / ${total.toLocaleString()}`;
                    
                    // Даем браузеру "подышать" чтобы не завис
                    if (generated < total) {
                        setTimeout(generateNextQr, 50);
                    }
                } else {
                    generateNextQr();
                }
            }
            
            // Запускаем генерацию QR-кодов
            setTimeout(generateNextQr, 100);
            
        }, 500);
        
    } catch (error) {
        document.getElementById('previewContainer').innerHTML = `
            <div class="alert alert-danger w-100">Ошибка генерации: ${error.message}</div>
        `;
    }
}
// Обновить предпросмотр
function regeneratePreview() {
    generateLabels();
}

// Печать этикеток
function printLabels() {
    try {
        const printContainer = document.querySelector('.print-container');
        if (!printContainer) {
            showNotification('Сначала сгенерируйте этикетки', 'error');
            return;
        }
        
        const printContent = printContainer.innerHTML;
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            showNotification('Разрешите всплывающие окна для печати', 'error');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Печать этикеток ячеек хранения</title>
                <meta charset="UTF-8">
                <style>
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        font-family: Verdana, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    
                    .print-container {
                        display: grid;
                        grid-template-columns: repeat(1, 1fr);
                        gap: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .label-sheet {
                        width: 6cm;
                        height: 2.5cm;
                        margin: 0 auto;
                        padding: 0.2cm;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: white;
                        page-break-after: always;
                        border: none !important;
                        outline: none !important;
                    }
                    
                    .label-text {
                        flex: 1;
                        padding: 0.1cm;
                        font-family: Verdana, sans-serif;
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100%;
                    }
                    
                    .label-text div:first-child {
                        font-size: 20px;
                        font-weight: bold;
                        margin-bottom: 1px;
                    }
                    
                    .label-text div:last-child {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    
                    .label-qr {
                        flex: 1;
                        padding-left: 0.4cm;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 180%;
margin-bottom: 0.4cm !important;
                    }
                    
                    @page {
                        margin: 0 !important;
                        size: 6cm 2.5cm; /* Точный размер этикетки */
                    }
                    
                    @media print {
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: center !important;
                            min-height: 100vh !important;
                        }
                        
                        .label-sheet {
                            padding: 0.2cm !important;
 justify-content: space-between;
                        }
                        
                        .label-text {
                            padding: 0.1cm !important;
flex: 2; /* УВЕЛИЧИВАЕМ МЕСТО ДЛЯ ТЕКСТА */
font-weight: bold !important; /* ДЕЛАЕМ ЖИРНЫМ */
            margin-top: -5px !important; /* СДВИГАЕМ ВЫШЕ */
                        }
                        
                        .label-text div:first-child {
                            font-size: 22px !important;
                            margin-bottom: 1px !important;
 margin-top: -5px !important; /* СДВИГАЕМ ВЫШЕ */
                        }
                        
                        .label-text div:last-child {
                            font-size: 22px !important;
                        }
                        
                        .label-qr {
                            padding-left: 0.4cm;
margin-bottom: 0.4cm !important;
justify-content: flex-end; /* ВЫРАВНИВАЕМ ПО ПРАВОМУ КРАЮ */
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${printContent}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    }
                    
                    window.onafterprint = function() {
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    }
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        showNotification('Ошибка печати: ' + error.message, 'error');
        console.error('Print error:', error);
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
        font-family: Verdana, sans-serif;
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
// Обработчик ошибок для window.print
window.addEventListener('error', function(e) {
    if (e.message.includes('print')) {
        showNotification('Ошибка печати. Проверьте настройки браузера.', 'error');
    }
});

// Альтернативный метод печати
function alternativePrint() {
    const printContent = document.getElementById('previewContainer').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div class="print-container">${printContent}</div>
        <style>
            body { margin: 0; padding: 0; background: white; }
            .print-container { 
                display: grid; 
                grid-template-columns: repeat(3, 6cm);
                gap: 0.2cm;
                padding: 0.5cm;
            }
            .label-sheet { 
                width: 6cm; height: 2.5cm; 
                display: flex; align-items: center; justify-content: space-between;
                padding: 0.2cm; background: white; 
            }
            .label-text { flex: 2; font-size: 16px; font-weight: bold; text-align: center; }
            .label-qr { flex: 1; display: flex; align-items: center; justify-content: center; }
        </style>
    `;
    
    window.print();
    
    // Восстанавливаем содержимое
    setTimeout(() => {
        document.body.innerHTML = originalContent;
        initializeSelectionPills(); // Переинициализируем элементы
    }, 100);
}

// Слушатели изменений для обновления выбранных элементов
document.getElementById('floors').addEventListener('input', updateSelectedItems);
document.getElementById('rows').addEventListener('input', updateSelectedItems);
document.getElementById('cabinets').addEventListener('input', updateSelectedItems);
document.getElementById('places').addEventListener('input', updateSelectedItems);
document.getElementById('format').addEventListener('input', updateSelectedItems);
document.getElementById('filename').addEventListener('input', saveSettings);

document.getElementById('limit').addEventListener('input', saveSettings);

