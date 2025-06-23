// Игра сортировки мусора
class SortingGame {
    constructor() {
        this.gameArea = document.getElementById('game-area');
        this.trashSpawnArea = document.getElementById('trash-spawn-area');
        this.scoreElement = document.getElementById('score');
        this.containers = document.querySelectorAll('.container-btn');
        
        this.score = 0;
        this.spawnTimer = null;
        this.isDragging = false;
        this.currentDraggedElement = null;
        
        // Множественные объекты мусора
        this.activeTrashItems = [];
        this.nextTrashId = 0;
        this.maxTrashItems = 15;
        
        // Система штрафов за переполнение
        this.warningThreshold = 10;    // Предупреждение при 10+ объектах
        this.dangerThreshold = 12;     // Опасная зона при 12+ объектах
        this.overflowPenalty = 2;      // Штраф за секунду в опасной зоне
        this.lastPenaltyTime = 0;      // Время последнего штрафа
        this.penaltyInterval = 1000;   // Интервал штрафов (1 секунда)
        
        // Бонусные объекты отключены
        
        // Система уровней
        this.currentLevel = 1;
        this.maxLevel = 4;
        this.levelThresholds = [0, 50, 150, 300, 500]; // Очки для перехода на след. уровень
        this.unlockedTypes = ['plastic', 'paper', 'organic']; // Разблокированные типы мусора
        

        
        // Система лидерборда
        this.playerName = '';
        this.leaderboard = this.loadLeaderboard();
        
        // Анимация заполнения контейнеров
        this.containerFillLevels = {
            plastic: 0,
            paper: 0,
            organic: 0,
            glass: 0,
            battery: 0,
            electronics: 0
        };
        this.maxFillLevel = 100; // Максимальный уровень заполнения
        this.fillIncrement = 5;  // На сколько заполняется при каждом правильном ответе
        
        // Прогрессия игры
        this.correctAnswers = 0;
        this.baseSpawnInterval = 4000; // 4 секунды
        this.currentSpawnInterval = this.baseSpawnInterval;
        this.gameStartTime = Date.now();
        
        // Комбо-система
        this.comboCount = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        
        // Web Audio API для звуков
        this.audioContext = null;
        this.initAudio();
        
        // Touch events для мобильных устройств
        this.touchStartPos = { x: 0, y: 0 };
        this.originalTrashPosition = { x: 0, y: 0 };
        
        // Массив объектов мусора
        this.trashTypes = [
            // Пластик
            { emoji: '🍼', type: 'plastic', name: 'Пластиковая бутылка' },
            { emoji: '🥤', type: 'plastic', name: 'Стакан для напитков' },
            { emoji: '🛍️', type: 'plastic', name: 'Пластиковый пакет' },
            { emoji: '🧴', type: 'plastic', name: 'Бутылка шампуня' },
            { emoji: '📦', type: 'plastic', name: 'Пластиковая упаковка' },
            
            // Бумага
            { emoji: '📰', type: 'paper', name: 'Газета' },
            { emoji: '📄', type: 'paper', name: 'Лист бумаги' },
            { emoji: '📚', type: 'paper', name: 'Книга' },
            { emoji: '📋', type: 'paper', name: 'Картонная коробка' },
            { emoji: '🎫', type: 'paper', name: 'Билет' },
            
            // Органика
            { emoji: '🍌', type: 'organic', name: 'Банан' },
            { emoji: '🍎', type: 'organic', name: 'Яблоко' },
            { emoji: '🥕', type: 'organic', name: 'Морковь' },
            { emoji: '🍃', type: 'organic', name: 'Листья' },
            { emoji: '🌽', type: 'organic', name: 'Кукуруза' },
            { emoji: '🥔', type: 'organic', name: 'Картофель' },
            
            // Уровень 2 - Стекло
            { emoji: '🍾', type: 'glass', name: 'Стеклянная бутылка' },
            { emoji: '🌡️', type: 'glass', name: 'Термометр' },
            { emoji: '💡', type: 'glass', name: 'Лампочка' },
            { emoji: '🍷', type: 'glass', name: 'Бокал' },
            { emoji: '🥃', type: 'glass', name: 'Стакан' },
            
            // Уровень 3 - Батарейки и опасные отходы
            { emoji: '🔋', type: 'battery', name: 'Батарейка' },
            { emoji: '🪫', type: 'battery', name: 'Разряженная батарейка' },
            { emoji: '🔌', type: 'battery', name: 'Зарядное устройство' },
            { emoji: '💊', type: 'battery', name: 'Просроченные лекарства' },
            { emoji: '🧪', type: 'battery', name: 'Химикаты' },
            
            // Уровень 4 - Электроника
            { emoji: '📱', type: 'electronics', name: 'Смартфон' },
            { emoji: '💻', type: 'electronics', name: 'Ноутбук' },
            { emoji: '⌨️', type: 'electronics', name: 'Клавиатура' },
            { emoji: '🖱️', type: 'electronics', name: 'Мышь' },
            { emoji: '📺', type: 'electronics', name: 'Телевизор' },
            { emoji: '🎮', type: 'electronics', name: 'Игровая приставка' },
            

        ];
        
        // Бонусные объекты убраны
        
        this.init();
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API не поддерживается:', error);
        }
    }

    // Воспроизведение звука успеха
    playSuccessSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Мелодичный звук успеха
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // Воспроизведение звука ошибки
    playErrorSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Низкий звук ошибки
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
        oscillator.frequency.setValueAtTime(196, this.audioContext.currentTime + 0.15); // G3
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // Звук появления объекта
    playSpawnSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // Звук тревоги при переполнении
    playOverflowWarningSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Тревожный звук - низкий гудок
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    // Создание частиц успеха (искры)
    createSuccessParticles(x, y) {
        const colors = ['#2ecc71', '#27ae60', '#f1c40f', '#f39c12'];
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle success-particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            // Случайное направление
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 50 + Math.random() * 30;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'particleSuccess 0.8s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 800);
        }
    }

    // Создание частиц ошибки (дым)
    createErrorParticles(x, y) {
        const particleCount = 6;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle error-particle';
            particle.style.position = 'fixed';
            particle.style.left = (x - 10 + Math.random() * 20) + 'px';
            particle.style.top = (y - 10 + Math.random() * 20) + 'px';
            particle.style.width = (8 + Math.random() * 6) + 'px';
            particle.style.height = (8 + Math.random() * 6) + 'px';
            particle.style.backgroundColor = '#95a5a6';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.opacity = '0.7';
            
            // Направление вверх с небольшим разбросом
            const vx = (Math.random() - 0.5) * 20;
            const vy = -30 - Math.random() * 20;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'particleError 1.2s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1200);
        }
    }

    // Создание эффекта взрыва при комбо
    createComboExplosion(x, y, multiplier) {
        const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#ffffff'];
        const particleCount = multiplier * 4; // Больше частиц для больших комбо
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle combo-particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = (4 + Math.random() * 4) + 'px';
            particle.style.height = (4 + Math.random() * 4) + 'px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.boxShadow = '0 0 6px currentColor';
            
            // Радиальный взрыв
            const angle = Math.random() * Math.PI * 2;
            const velocity = 40 + Math.random() * 60;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'particleCombo 1s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    // Создание частиц появления объекта
    createSpawnParticles(x, y) {
        const colors = ['#3498db', '#9b59b6', '#1abc9c'];
        const particleCount = 4;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle spawn-particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            // Маленький радиус разлета
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 20 + Math.random() * 15;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'particleSpawn 0.6s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 600);
        }
    }

    init() {
        console.log('Игра инициализирована');
        this.setupEventListeners();
        this.updateLevelDisplay();
        this.initializeContainerFills();
        this.showInitialTutorial();
        this.startSpawning();
        this.startOverflowMonitoring();
    }

    setupEventListeners() {
        // Drag and Drop для десктопа
        this.setupDesktopDragAndDrop();

        // Включение звука при первом взаимодействии пользователя
        document.addEventListener('click', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
        
        // Кнопки управления игрой
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const gameOverBtn = document.getElementById('game-over-btn');

        console.log('Поиск кнопок:', {
            leaderboardBtn: !!leaderboardBtn,
            gameOverBtn: !!gameOverBtn
        });
        
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                console.log('Нажата кнопка лидерборда');
                this.showLeaderboard();
            });
        }
        
        if (gameOverBtn) {
            gameOverBtn.addEventListener('click', () => {
                console.log('Нажата кнопка завершения игры');
                this.endGame();
            });
        } else {
            console.error('Кнопка завершения игры не найдена!');
        }
        

    }

    setupDesktopDragAndDrop() {
        // Настройка drop-зон для контейнеров
        this.containers.forEach(container => {
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (this.isDragging) {
                    container.classList.add('drag-over');
                    
                    // Добавляем эффект свечения если его еще нет
                    if (!container.querySelector('.container-glow')) {
                        const glow = document.createElement('div');
                        glow.className = 'container-glow';
                        container.appendChild(glow);
                    }
                }
            });

            container.addEventListener('dragleave', (e) => {
                container.classList.remove('drag-over');
                const glow = container.querySelector('.container-glow');
                if (glow) glow.remove();
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.classList.remove('drag-over');
                const glow = container.querySelector('.container-glow');
                if (glow) glow.remove();
                
                if (this.isDragging) {
                    const droppedType = e.dataTransfer.getData('text/plain');
                    const droppedId = e.dataTransfer.getData('text/id');
                    // Передаем тип контейнера, а не тип мусора
                    this.checkAnswer(container.dataset.type, droppedId);
                }
            });
        });
    }

    highlightContainerUnderTouch(x, y) {
        this.clearContainerHighlights();
        const container = this.getContainerUnderTouch(x, y);
        if (container) {
            container.classList.add('drag-over');
            
            // Добавляем эффект свечения для мобильных устройств
            if (!container.querySelector('.container-glow')) {
                const glow = document.createElement('div');
                glow.className = 'container-glow';
                container.appendChild(glow);
            }
        }
    }

    getContainerUnderTouch(x, y) {
        for (let container of this.containers) {
            const rect = container.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return container;
            }
        }
        return null;
    }

    clearContainerHighlights() {
        this.containers.forEach(container => {
            container.classList.remove('drag-over');
            const glow = container.querySelector('.container-glow');
            if (glow) glow.remove();
        });
    }

    startSpawning() {
        // Первый объект через 1 секунду
        setTimeout(() => {
            this.spawnTrash();
        }, 1000);
        
        // Регулярное появление каждые 4 секунды
        this.scheduleNextSpawn();
    }

    scheduleNextSpawn() {
        this.spawnTimer = setTimeout(() => {
            // Проверяем лимит объектов на экране
            if (this.activeTrashItems.length < this.maxTrashItems) {
                this.spawnTrash();
            }
            this.scheduleNextSpawn();
        }, this.currentSpawnInterval);
    }

    // Запуск мониторинга переполнения
    startOverflowMonitoring() {
        setInterval(() => {
            this.checkOverflow();
        }, 500); // Проверяем каждые 0.5 секунды
    }

    // Проверка переполнения и применение штрафов
    checkOverflow() {
        const itemCount = this.activeTrashItems.length;
        const currentTime = Date.now();
        
        // Обновляем визуальное состояние зоны
        this.updateSpawnAreaState(itemCount);
        
        // Применяем штрафы в опасной зоне
        if (itemCount >= this.dangerThreshold) {
            if (currentTime - this.lastPenaltyTime >= this.penaltyInterval) {
                this.applyOverflowPenalty();
                this.lastPenaltyTime = currentTime;
            }
        }
        
        // Предупреждающие звуки
        if (itemCount === this.warningThreshold) {
            this.playOverflowWarningSound();
            this.showFeedback('⚠️ Внимание! Много мусора!', 'info');
        } else if (itemCount === this.dangerThreshold) {
            this.playOverflowWarningSound();
            this.showFeedback('🚨 Критическое переполнение! Штрафы!', 'error');
        }
    }

    // Обновление визуального состояния зоны спавна
    updateSpawnAreaState(itemCount) {
        const spawnArea = this.trashSpawnArea;
        
        // Обновляем счетчик мусора
        this.updateTrashCounter();
        
        // Убираем все классы состояния
        spawnArea.classList.remove('warning', 'danger');
        
        if (itemCount >= this.dangerThreshold) {
            spawnArea.classList.add('danger');
        } else if (itemCount >= this.warningThreshold) {
            spawnArea.classList.add('warning');
        }
    }

    // Обновление счетчика мусора
    updateTrashCounter() {
        const trashCountElement = document.getElementById('trash-count');
        if (trashCountElement) {
            trashCountElement.textContent = this.activeTrashItems.length;
            
            // Меняем цвет в зависимости от количества
            if (this.activeTrashItems.length >= this.dangerThreshold) {
                trashCountElement.style.color = '#e74c3c';
            } else if (this.activeTrashItems.length >= this.warningThreshold) {
                trashCountElement.style.color = '#f39c12';
            } else {
                trashCountElement.style.color = '#2c3e50';
            }
        }
    }

    // Применение штрафа за переполнение
    applyOverflowPenalty() {
        this.score = Math.max(0, this.score - this.overflowPenalty);
        this.comboCount = 0; // Сбрасываем комбо
        this.comboMultiplier = 1;
        
        this.updateScore();
        this.updateComboDisplay();
        
        // Показываем уведомление о штрафе
        this.showFeedback(`📉 Штраф за переполнение: -${this.overflowPenalty} очков!`, 'error');
        
        console.log('Применен штраф за переполнение:', this.overflowPenalty, 'очков. Объектов:', this.activeTrashItems.length);
    }

    updateGameSpeed() {
        // Ускорение каждые 5 правильных ответов
        const speedLevel = Math.floor(this.correctAnswers / 5);
        const speedMultiplier = Math.max(0.3, 1 - (speedLevel * 0.1)); // Минимум 30% от базовой скорости
        
        this.currentSpawnInterval = Math.floor(this.baseSpawnInterval * speedMultiplier);
        
        if (speedLevel > 0) {
            console.log(`Уровень скорости: ${speedLevel}, Интервал: ${this.currentSpawnInterval}мс`);
        }
    }

    spawnTrash() {
        // Выбираем случайный тип мусора из доступных для текущего уровня
        const availableTrash = this.trashTypes.filter(item => 
            this.unlockedTypes.includes(item.type)
        );
        const randomIndex = Math.floor(Math.random() * availableTrash.length);
        const trashData = availableTrash[randomIndex];
        
        // Создаем новый объект
        const trashElement = this.createTrashItem(trashData);
        
        // Добавляем в зону спавна и в массив активных объектов
        this.trashSpawnArea.appendChild(trashElement);
        this.activeTrashItems.push({
            element: trashElement,
            data: trashData,
            id: trashElement.dataset.id
        });
        
        // Звук появления
        this.playSpawnSound();
        
        // Обновляем счетчик
        this.updateTrashCounter();
        
        // Эффект появления (маленькие искры)
        setTimeout(() => {
            const rect = trashElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            this.createSpawnParticles(centerX, centerY);
        }, 200);
        
        // Убрана проверка автосортировки бонусов
        
        console.log('Появился объект:', trashData.name, 'Всего объектов:', this.activeTrashItems.length);
    }

    // Расчет множителя очков в зависимости от комбо
    getComboMultiplier() {
        if (this.comboCount >= 10) return 5;    // 10+ комбо = x5
        if (this.comboCount >= 7) return 3;     // 7-9 комбо = x3  
        if (this.comboCount >= 4) return 2;     // 4-6 комбо = x2
        return 1;                               // 0-3 комбо = x1
    }

    // Создание нового объекта мусора
    createTrashItem(trashData) {
        const trashElement = document.createElement('div');
        trashElement.className = 'trash-item spawn-animation';
        trashElement.innerHTML = trashData.emoji;
        trashElement.title = trashData.name;
        trashElement.draggable = true;
        trashElement.dataset.type = trashData.type;
        trashElement.dataset.id = this.nextTrashId++;
        

        
        // Случайная позиция в пределах зоны
        const position = this.getRandomPosition();
        trashElement.style.position = 'absolute';
        trashElement.style.left = position.x + 'px';
        trashElement.style.top = position.y + 'px';
        
        // Добавляем цвет фона
        this.setTrashItemColor(trashElement, trashData.type);
        
        // Добавляем обработчики событий
        this.setupTrashItemEvents(trashElement);
        
        return trashElement;
    }

    // Получение случайной позиции в пределах зоны спавна
    getRandomPosition() {
        const spawnArea = this.trashSpawnArea;
        const spawnRect = spawnArea.getBoundingClientRect();
        
        // Размеры объекта мусора
        const itemSize = 80;
        const margin = 10;
        
        // Доступное пространство
        const maxX = spawnArea.clientWidth - itemSize - margin * 2;
        const maxY = spawnArea.clientHeight - itemSize - margin * 2;
        
        return {
            x: margin + Math.random() * Math.max(0, maxX),
            y: margin + Math.random() * Math.max(0, maxY)
        };
    }

    // Настройка цвета объекта мусора
    setTrashItemColor(element, type) {
        switch(type) {
            case 'plastic':
                element.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
                break;
            case 'paper':
                element.style.backgroundColor = 'rgba(241, 196, 15, 0.2)';
                break;
            case 'organic':
                element.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';
                break;
            case 'glass':
                element.style.backgroundColor = 'rgba(52, 152, 219, 0.3)';
                element.style.border = '2px solid rgba(52, 152, 219, 0.8)';
                break;
            case 'battery':
                element.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                element.style.border = '2px solid rgba(231, 76, 60, 0.8)';
                break;
            case 'electronics':
                element.style.backgroundColor = 'rgba(155, 89, 182, 0.2)';
                element.style.border = '2px solid rgba(155, 89, 182, 0.8)';
                break;
            case 'metal':
                element.style.backgroundColor = 'rgba(127, 140, 141, 0.2)';
                element.style.border = '2px solid rgba(127, 140, 141, 0.8)';
                break;
        }
    }

    // Настройка событий для объекта мусора
    setupTrashItemEvents(element) {
        // Обычные объекты - стандартный drag & drop
        // Desktop drag events
        element.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            element.style.opacity = '0.7';
            e.dataTransfer.setData('text/plain', element.dataset.type);
            e.dataTransfer.setData('text/id', element.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        element.addEventListener('dragend', (e) => {
            this.isDragging = false;
            element.style.opacity = '1';
            this.clearContainerHighlights();
        });

        // Mobile touch events (для обычных объектов)
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.currentDraggedElement = element;
            
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            
            const rect = element.getBoundingClientRect();
            this.originalTrashPosition = { x: rect.left, y: rect.top };
            
            element.style.position = 'fixed';
            element.style.zIndex = '1000';
            element.style.opacity = '0.8';
            element.style.transform = 'scale(1.1)';
        });

        element.addEventListener('touchmove', (e) => {
            if (this.isDragging && this.currentDraggedElement === element) {
                e.preventDefault();
                const touch = e.touches[0];
                
                element.style.left = (touch.clientX - 40) + 'px';
                element.style.top = (touch.clientY - 40) + 'px';
                
                this.highlightContainerUnderTouch(touch.clientX, touch.clientY);
            }
        });

        element.addEventListener('touchend', (e) => {
            if (this.isDragging && this.currentDraggedElement === element) {
                e.preventDefault();
                const touch = e.changedTouches[0];
                const dropTarget = this.getContainerUnderTouch(touch.clientX, touch.clientY);
                
                if (dropTarget) {
                    // Передаем тип контейнера, а не тип мусора
                    this.checkAnswer(dropTarget.dataset.type, element.dataset.id);
                } else {
                    this.resetTrashItemPosition(element);
                }
                
                this.isDragging = false;
                this.currentDraggedElement = null;
                this.clearContainerHighlights();
            }
        });
    }

    // Сброс позиции конкретного объекта мусора
    resetTrashItemPosition(element) {
        element.style.position = 'absolute';
        element.style.zIndex = '';
        element.style.opacity = '1';
        element.style.transform = '';
        
        // Возвращаем в случайную позицию
        const position = this.getRandomPosition();
        element.style.left = position.x + 'px';
        element.style.top = position.y + 'px';
    }

    checkAnswer(containerType, itemId) {
        // Находим объект по ID
        const trashItem = this.activeTrashItems.find(item => item.id === itemId);
        if (!trashItem) return;
        
        // Проверяем, соответствует ли тип мусора типу контейнера
        const isCorrect = containerType === trashItem.data.type;
        
        if (isCorrect) {
            const basePoints = 10;
            
            // Увеличиваем комбо
            this.comboCount++;
            if (this.comboCount > this.maxCombo) {
                this.maxCombo = this.comboCount;
            }
            
            // Рассчитываем множитель и очки
            this.comboMultiplier = this.getComboMultiplier();
            let points = basePoints * this.comboMultiplier;
            
            this.score += points;
            this.correctAnswers++;
            
            // Формируем сообщение с комбо
            let message = `+${points} очков!`;
            if (this.comboCount > 1) {
                message += ` Комбо ×${this.comboMultiplier}!`;
            }
            
            this.showFeedback(message, 'success');
            this.animateTrashCorrect(trashItem.element);
            this.playSuccessSound();
            
            // Создаем эффект взрыва при комбо 4+
            if (this.comboCount >= 4 && this.comboCount % 2 === 0) {
                const rect = trashItem.element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                this.createComboExplosion(centerX, centerY, this.comboMultiplier);
            }
            
            // Обновляем скорость каждые 5 правильных ответов
            if (this.correctAnswers % 5 === 0) {
                this.updateGameSpeed();
            }
            
            // Заполняем контейнер
            this.fillContainer(trashItem.data.type);
            
            // Удаляем объект
            this.removeTrashItem(itemId);
        } else {
            // Сбрасываем комбо при ошибке
            this.comboCount = 0;
            this.comboMultiplier = 1;
            this.score = Math.max(0, this.score - 5);
            
            // Записываем время ошибки для достижения "Эколог со стажем"
            this.lastErrorTime = Date.now();
            this.perfectStreakStart = Date.now();
            
            this.showFeedback('Неправильно! -5 очков. Комбо сброшено!', 'error');
            this.animateTrashIncorrect(trashItem.element);
            this.playErrorSound();
            
            // Возвращаем объект на место
            this.resetTrashItemPosition(trashItem.element);
        }
        
        this.updateScore();
        this.updateComboDisplay();
        this.checkLevelUp();
        this.updateLevelDisplay();
        
        console.log('Контейнер:', containerType, 'Мусор:', trashItem.data.type, 'Правильно:', isCorrect, 'Комбо:', this.comboCount, 'Счет:', this.score, 'Уровень:', this.currentLevel, 'Объектов на экране:', this.activeTrashItems.length);
    }

    // Анимации для конкретных объектов
    animateTrashCorrect(element) {
        element.style.animation = 'correctAnswer 0.6s ease-out';
        
        // Создаем частицы успеха в центре элемента
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.createSuccessParticles(centerX, centerY);
    }

    animateTrashIncorrect(element) {
        element.style.animation = 'incorrectAnswer 0.6s ease-out';
        
        // Создаем частицы ошибки (дым) в центре элемента
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.createErrorParticles(centerX, centerY);
        
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    }

    showFeedback(message, type) {
        // Создаем элемент обратной связи
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        // Показываем текущую скорость при достижении нового уровня
        if (type === 'success' && this.correctAnswers % 5 === 0 && this.correctAnswers > 0) {
            const speedLevel = Math.floor(this.correctAnswers / 5);
            feedback.textContent += ` | Уровень скорости: ${speedLevel}`;
        }
        
        // Добавляем в игровую область
        this.gameArea.appendChild(feedback);
        
        // Удаляем через 2 секунды
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }

    // Удаление объекта мусора
    removeTrashItem(itemId) {
        const itemIndex = this.activeTrashItems.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const item = this.activeTrashItems[itemIndex];
            
            setTimeout(() => {
                if (item.element.parentNode) {
                    item.element.parentNode.removeChild(item.element);
                }
                this.activeTrashItems.splice(itemIndex, 1);
                this.updateTrashCounter(); // Обновляем счетчик после удаления
            }, 600);
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        
        // Анимация изменения счета
        this.scoreElement.style.animation = 'scoreUpdate 0.3s ease-out';
        setTimeout(() => {
            this.scoreElement.style.animation = '';
        }, 300);
    }

    // Обновление отображения комбо и множителя
    updateComboDisplay() {
        document.getElementById('combo').textContent = this.comboCount;
        document.getElementById('multiplier').textContent = this.comboMultiplier;
        
        const comboDisplay = document.querySelector('.stat-item:nth-child(2)');
        
        // Меняем цвет и эффекты в зависимости от уровня комбо
        if (this.comboCount >= 10) {
            comboDisplay.style.color = '#9b59b6';
            comboDisplay.style.textShadow = '0 0 15px rgba(155, 89, 182, 0.8)';
        } else if (this.comboCount >= 7) {
            comboDisplay.style.color = '#e74c3c';
            comboDisplay.style.textShadow = '0 0 10px rgba(231, 76, 60, 0.8)';
        } else if (this.comboCount >= 4) {
            comboDisplay.style.color = '#f39c12';
            comboDisplay.style.textShadow = '0 0 8px rgba(243, 156, 18, 0.6)';
        } else if (this.comboCount >= 2) {
            comboDisplay.style.color = '#2ecc71';
            comboDisplay.style.textShadow = '0 0 5px rgba(46, 204, 113, 0.5)';
        } else {
            comboDisplay.style.color = '#7f8c8d';
            comboDisplay.style.textShadow = 'none';
        }
        
        // Анимация при изменении комбо
        if (this.comboCount > 0) {
            comboDisplay.style.animation = 'comboUpdate 0.4s ease-out';
            setTimeout(() => {
                comboDisplay.style.animation = '';
            }, 400);
        }
    }

    // Метод для паузы/возобновления игры
    togglePause() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
            console.log('Игра на паузе');
        } else {
            this.scheduleNextSpawn();
            console.log('Игра возобновлена');
        }
    }

    // Получить статистику игры
    getGameStats() {
        const playTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const accuracy = this.correctAnswers > 0 ? Math.round((this.correctAnswers / (this.correctAnswers + Math.max(0, (this.score < 0 ? Math.abs(this.score) / 5 : 0)))) * 100) : 0;
        
        return {
            score: this.score,
            correctAnswers: this.correctAnswers,
            playTime: playTime,
            accuracy: accuracy,
            currentSpeed: this.currentSpawnInterval,
            maxCombo: this.maxCombo,
            activeItems: this.activeTrashItems.length
        };
    }

    // Методы бонусов удалены

    // Проверка и обновление уровня
    checkLevelUp() {
        if (this.currentLevel >= this.maxLevel) return;
        
        const nextLevelThreshold = this.levelThresholds[this.currentLevel + 1];
        if (this.score >= nextLevelThreshold) {
            this.currentLevel++;
            this.unlockNewTrashTypes();
            this.showLevelUpAnimation();
            this.updateLevelDisplay();
            console.log(`Переход на уровень ${this.currentLevel}!`);
        }
    }

    // Разблокировка новых типов мусора
    unlockNewTrashTypes() {
        const levelTrashTypes = {
            2: ['glass'],
            3: ['battery'], 
            4: ['electronics']
        };
        
        const newTypes = levelTrashTypes[this.currentLevel];
        if (newTypes) {
            this.unlockedTypes.push(...newTypes);
            this.createNewContainers(newTypes);
        }
    }

    // Создание новых контейнеров
    createNewContainers(newTypes) {
        const containersElement = document.querySelector('.containers');
        
        newTypes.forEach(type => {
            const container = document.createElement('div');
            container.className = `container-btn ${this.getContainerClass(type)}`;
            container.dataset.type = type;
            
            const icon = document.createElement('div');
            icon.className = 'container-icon';
            icon.textContent = this.getContainerIcon(type);
            
            const label = document.createElement('span');
            label.textContent = this.getContainerLabel(type);
            
            const handle = document.createElement('div');
            handle.className = 'lid-handle';
            
            container.appendChild(handle);
            container.appendChild(icon);
            container.appendChild(label);
            
            containersElement.appendChild(container);
            
            // Добавляем обработчики событий
            this.setupContainerEvents(container);
            
            // Анимация появления контейнера
            container.style.animation = 'containerAppear 1s ease-out';
        });
    }

    // Вспомогательные методы для контейнеров
    getContainerClass(type) {
        const classes = {
            glass: 'cyan',
            battery: 'red', 
            electronics: 'purple',
            metal: 'gray'
        };
        return classes[type] || 'gray';
    }

    getContainerIcon(type) {
        const icons = {
            glass: '🥃',
            battery: '🔋',
            electronics: '📱'
        };
        return icons[type] || '❓';
    }

    getContainerLabel(type) {
        const labels = {
            glass: 'Стекло',
            battery: 'Батарейки',
            electronics: 'Электроника'
        };
        return labels[type] || 'Неизвестно';
    }

    // Настройка событий для нового контейнера
    setupContainerEvents(container) {
        // Desktop drag events
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });

        container.addEventListener('dragleave', () => {
            container.classList.remove('drag-over');
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const droppedType = e.dataTransfer.getData('text/plain');
            const itemId = e.dataTransfer.getData('text/id');
            
            // Передаем тип контейнера, а не тип мусора
            this.checkAnswer(container.dataset.type, itemId);
        });
    }

    // Анимация повышения уровня
    showLevelUpAnimation() {
        const levelUpMessage = document.createElement('div');
        levelUpMessage.className = 'level-up-message';
        levelUpMessage.innerHTML = `
            <div class="level-up-content">
                <h2>🎉 УРОВЕНЬ ${this.currentLevel}! 🎉</h2>
                <p>Разблокированы новые типы мусора!</p>
                <p>Требуется: ${this.levelThresholds[this.currentLevel + 1] || 'Максимум'} очков для следующего уровня</p>
            </div>
        `;
        
        document.body.appendChild(levelUpMessage);
        
        setTimeout(() => {
            if (levelUpMessage.parentNode) {
                levelUpMessage.parentNode.removeChild(levelUpMessage);
            }
        }, 4000);
    }

    // Обновление отображения уровня
    updateLevelDisplay() {
        let levelDisplay = document.getElementById('level-display');
        if (!levelDisplay) {
            levelDisplay = document.createElement('div');
            levelDisplay.id = 'level-display';
            levelDisplay.className = 'level-display';
            document.querySelector('.score-board').appendChild(levelDisplay);
        }
        
        const nextThreshold = this.levelThresholds[this.currentLevel + 1];
        const progress = nextThreshold ? 
            Math.min(100, ((this.score - this.levelThresholds[this.currentLevel]) / 
            (nextThreshold - this.levelThresholds[this.currentLevel])) * 100) : 100;
        
        levelDisplay.innerHTML = `
            <div class="level-info">
                <span class="level-number">Уровень ${this.currentLevel}</span>
                <div class="level-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
                <span class="next-level">${nextThreshold ? `До ${nextThreshold}` : 'МАКС'}</span>
                         </div>
         `;
     }



     // Показ начальной подсказки
     showInitialTutorial() {
         const tutorial = document.createElement('div');
         tutorial.className = 'tutorial-popup';
         tutorial.innerHTML = `
             <div class="tutorial-content">
                 <div class="tutorial-icon">💡</div>
                 <h2>Добро пожаловать!</h2>
                 <p>Перетаскивайте объекты в правильные контейнеры</p>
                 <p>Собирайте комбо и бонусы для высоких результатов!</p>
             </div>
         `;
         
         document.body.appendChild(tutorial);
         
         // Удаляем подсказку через 3 секунды
         setTimeout(() => {
             tutorial.style.opacity = '0';
             setTimeout(() => {
                 if (tutorial.parentNode) {
                     tutorial.parentNode.removeChild(tutorial);
                 }
             }, 500);
         }, 3000);
     }

     // Заполнение контейнера
     fillContainer(type) {
         if (!this.containerFillLevels.hasOwnProperty(type)) return;
         
         // Увеличиваем уровень заполнения
         this.containerFillLevels[type] = Math.min(
             this.maxFillLevel, 
             this.containerFillLevels[type] + this.fillIncrement
         );
         
         // Обновляем визуальное отображение
         this.updateContainerFillDisplay(type);
         
         // Проверяем заполнение
         if (this.containerFillLevels[type] >= this.maxFillLevel) {
             this.emptyContainer(type);
         }
     }

     // Обновление визуального заполнения контейнера
     updateContainerFillDisplay(type) {
         const container = document.querySelector(`[data-type="${type}"]`);
         if (!container) return;
         
         const fillLevel = this.containerFillLevels[type];
         const fillPercentage = (fillLevel / this.maxFillLevel) * 100;
         
         // Создаем или обновляем элемент заполнения
         let fillElement = container.querySelector('.container-fill');
         if (!fillElement) {
             fillElement = document.createElement('div');
             fillElement.className = 'container-fill';
             container.appendChild(fillElement);
         }
         
         // Анимируем заполнение
         fillElement.style.height = `${fillPercentage}%`;
         
         // Добавляем анимацию при добавлении мусора
         this.animateContainerFill(container, type);
         
         // Меняем цвет в зависимости от заполнения
         this.updateContainerFillColor(fillElement, fillPercentage, type);
     }

     // Анимация при заполнении контейнера
     animateContainerFill(container, type) {
         // Анимация добавления мусора
         const trashParticle = document.createElement('div');
         trashParticle.className = 'trash-particle';
         trashParticle.innerHTML = this.getTrashParticleIcon(type);
         
         container.appendChild(trashParticle);
         
         // Удаляем частицу после анимации
         setTimeout(() => {
             if (trashParticle.parentNode) {
                 trashParticle.parentNode.removeChild(trashParticle);
             }
         }, 800);
         
         // Анимация встряхивания контейнера
         container.style.animation = 'containerShake 0.3s ease-out';
         setTimeout(() => {
             container.style.animation = '';
         }, 300);
     }

     // Получение иконки частицы мусора
     getTrashParticleIcon(type) {
         const icons = {
             plastic: '🧴',
             paper: '📄',
             organic: '🍕',
             glass: '🍾',
             battery: '🔋',
             electronics: '📱'
         };
         return icons[type] || '🗑️';
     }

     // Обновление цвета заполнения
     updateContainerFillColor(fillElement, percentage, type) {
         let color1, color2;
         
         // Базовые цвета для каждого типа
         const baseColors = {
             plastic: ['rgba(52, 152, 219, 0.3)', 'rgba(52, 152, 219, 0.8)'],
             paper: ['rgba(241, 196, 15, 0.3)', 'rgba(241, 196, 15, 0.8)'],
             organic: ['rgba(39, 174, 96, 0.3)', 'rgba(39, 174, 96, 0.8)'],
             glass: ['rgba(52, 152, 219, 0.4)', 'rgba(52, 152, 219, 0.9)'],
             battery: ['rgba(231, 76, 60, 0.3)', 'rgba(231, 76, 60, 0.8)'],
             electronics: ['rgba(155, 89, 182, 0.3)', 'rgba(155, 89, 182, 0.8)']
         };
         
         [color1, color2] = baseColors[type] || baseColors.plastic;
         
         // Градиент становится более насыщенным при заполнении
         const intensity = Math.min(1, percentage / 100);
         fillElement.style.background = `linear-gradient(180deg, ${color1}, ${color2})`;
         fillElement.style.opacity = 0.3 + (intensity * 0.4);
     }

     // Опустошение контейнера
     emptyContainer(type) {
         const container = document.querySelector(`[data-type="${type}"]`);
         if (!container) return;
         
         // Анимация опустошения
         this.animateContainerEmpty(container, type);
         
         // Сбрасываем уровень заполнения
         this.containerFillLevels[type] = 0;
         
         // Даем бонусные очки
         const bonusPoints = 20;
         this.score += bonusPoints;
         this.updateScore();
         
         this.showFeedback(`🎉 Контейнер заполнен! +${bonusPoints} очков!`, 'success');
         
         setTimeout(() => {
             this.updateContainerFillDisplay(type);
         }, 1000);
     }

     // Анимация опустошения контейнера
     animateContainerEmpty(container, type) {
         // Создаем эффект опустошения
         const emptyEffect = document.createElement('div');
         emptyEffect.className = 'empty-effect';
         emptyEffect.innerHTML = '✨ ЗАПОЛНЕН! ✨';
         
         container.appendChild(emptyEffect);
         
         // Анимация крышки
         container.classList.add('emptying');
         
         setTimeout(() => {
             container.classList.remove('emptying');
             if (emptyEffect.parentNode) {
                 emptyEffect.parentNode.removeChild(emptyEffect);
             }
         }, 1000);
         
         // Звуковой эффект опустошения
         this.playEmptyContainerSound();
     }

     // Звук опустошения контейнера
     playEmptyContainerSound() {
         if (!this.audioContext) return;
         
         // Звук опустошения - восходящая мелодия
         const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
         
         notes.forEach((freq, index) => {
             setTimeout(() => {
                 const oscillator = this.audioContext.createOscillator();
                 const gainNode = this.audioContext.createGain();
                 
                 oscillator.connect(gainNode);
                 gainNode.connect(this.audioContext.destination);
                 
                 oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                 oscillator.type = 'sine';
                 
                 gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                 gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
                 gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                 
                 oscillator.start(this.audioContext.currentTime);
                 oscillator.stop(this.audioContext.currentTime + 0.3);
             }, index * 100);
         });
     }

     // Инициализация заполнения для всех контейнеров
     initializeContainerFills() {
         Object.keys(this.containerFillLevels).forEach(type => {
             this.updateContainerFillDisplay(type);
         });
     }

     // === СИСТЕМА ЛИДЕРБОРДА ===
     
     // Загрузка лидерборда из localStorage
     loadLeaderboard() {
         const savedLeaderboard = localStorage.getItem('sortingGameLeaderboard');
         if (savedLeaderboard) {
             return JSON.parse(savedLeaderboard);
         }
         return [];
     }

     // Сохранение лидерборда в localStorage
     saveLeaderboard() {
         localStorage.setItem('sortingGameLeaderboard', JSON.stringify(this.leaderboard));
     }

     // Проверка на новый рекорд в конце игры
     checkForNewRecord() {
         console.log('checkForNewRecord() вызван');
         const gameStats = this.getGameStats();
         console.log('Статистика игры:', gameStats);
         const minScoreForLeaderboard = 50; // Минимальный счет для попадания в лидерборд
         
         if (gameStats.score >= minScoreForLeaderboard) {
             console.log('Показываем диалог ввода имени');
             this.showNameInputDialog(gameStats);
         } else {
             console.log('Очков недостаточно для лидерборда, показываем пустой лидерборд');
             this.showLeaderboard();
         }
     }

     // Диалог ввода имени для лидерборда
     showNameInputDialog(gameStats) {
         const overlay = document.createElement('div');
         overlay.className = 'leaderboard-overlay';
         
         overlay.innerHTML = `
             <div class="name-input-dialog">
                 <div class="dialog-content">
                     <h2>🏆 Отличный результат!</h2>
                     <div class="score-summary">
                         <p><strong>Очки:</strong> ${gameStats.score}</p>
                         <p><strong>Максимальное комбо:</strong> ${gameStats.maxCombo}</p>
                         <p><strong>Правильных ответов:</strong> ${gameStats.correctAnswers}</p>
                         <p><strong>Уровень:</strong> ${gameStats.currentLevel}</p>
                         <p><strong>Время игры:</strong> ${Math.floor(gameStats.playTime / 60)}:${String(gameStats.playTime % 60).padStart(2, '0')}</p>
                     </div>
                     <div class="name-input-section">
                         <label for="player-name">Введите ваше имя:</label>
                         <input type="text" id="player-name" maxlength="20" placeholder="Эколог" />
                         <div class="dialog-buttons">
                             <button id="save-score" class="btn-primary">Сохранить результат</button>
                             <button id="skip-save" class="btn-secondary">Пропустить</button>
                         </div>
                     </div>
                 </div>
             </div>
         `;
         
         document.body.appendChild(overlay);
         
         const nameInput = document.getElementById('player-name');
         const saveBtn = document.getElementById('save-score');
         const skipBtn = document.getElementById('skip-save');
         
         // Фокус на поле ввода
         nameInput.focus();
         
         // Обработчики событий
         const handleSave = () => {
             const playerName = nameInput.value.trim() || 'Аноним';
             this.addToLeaderboard(playerName, gameStats);
             this.showLeaderboard();
             document.body.removeChild(overlay);
         };
         
         const handleSkip = () => {
             this.showLeaderboard();
             document.body.removeChild(overlay);
         };
         
         saveBtn.addEventListener('click', handleSave);
         skipBtn.addEventListener('click', handleSkip);
         
         // Enter для сохранения
         nameInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 handleSave();
             }
         });
     }

     // Добавление результата в лидерборд
     addToLeaderboard(playerName, gameStats) {
         const newEntry = {
             name: playerName,
             score: gameStats.score,
             maxCombo: gameStats.maxCombo,
             correctAnswers: gameStats.correctAnswers,
             level: gameStats.currentLevel,
             playTime: gameStats.playTime,
             date: new Date().toLocaleDateString('ru-RU'),
             timestamp: Date.now()
         };
         
         this.leaderboard.push(newEntry);
         
         // Сортируем по очкам (по убыванию)
         this.leaderboard.sort((a, b) => b.score - a.score);
         
         // Оставляем только топ-10
         this.leaderboard = this.leaderboard.slice(0, 10);
         
         this.saveLeaderboard();
         console.log('Результат добавлен в лидерборд:', newEntry);
     }

     // Показать лидерборд
     showLeaderboard() {
         const overlay = document.createElement('div');
         overlay.className = 'leaderboard-overlay';
         
         let leaderboardHTML = `
             <div class="leaderboard-dialog">
                 <div class="leaderboard-header">
                     <h2>🏆 Лидерборд</h2>
                     <button class="close-leaderboard">×</button>
                 </div>
                 <div class="leaderboard-content">
         `;
         
         if (this.leaderboard.length === 0) {
             leaderboardHTML += `
                 <div class="empty-leaderboard">
                     <p>🎮 Лидерборд пуст</p>
                     <p>Наберите минимум 50 очков, чтобы попасть в рейтинг!</p>
                 </div>
             `;
         } else {
             leaderboardHTML += `
                 <div class="leaderboard-table">
                     <div class="table-header">
                         <span>Место</span>
                         <span>Имя</span>
                         <span>Очки</span>
                         <span>Комбо</span>
                         <span>Уровень</span>
                         <span>Дата</span>
                     </div>
             `;
             
             this.leaderboard.forEach((entry, index) => {
                 const position = index + 1;
                 const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position;
                 
                 leaderboardHTML += `
                     <div class="table-row ${position <= 3 ? 'top-three' : ''}">
                         <span class="position">${medal}</span>
                         <span class="name">${entry.name}</span>
                         <span class="score">${entry.score}</span>
                         <span class="combo">${entry.maxCombo}</span>
                         <span class="level">${entry.level}</span>
                         <span class="date">${entry.date}</span>
                     </div>
                 `;
             });
             
             leaderboardHTML += '</div>';
         }
         
         leaderboardHTML += `
                 </div>
                 <div class="leaderboard-actions">
                     <button id="new-game" class="btn-primary">Новая игра</button>
                     <button id="clear-leaderboard" class="btn-danger">Очистить рейтинг</button>
                 </div>
             </div>
         `;
         
         overlay.innerHTML = leaderboardHTML;
         document.body.appendChild(overlay);
         
         // Обработчики событий
         const closeBtn = overlay.querySelector('.close-leaderboard');
         const newGameBtn = overlay.querySelector('#new-game');
         const clearBtn = overlay.querySelector('#clear-leaderboard');
         
         closeBtn.addEventListener('click', () => {
             document.body.removeChild(overlay);
         });
         
         newGameBtn.addEventListener('click', () => {
             document.body.removeChild(overlay);
             this.restartGame();
         });
         
         clearBtn.addEventListener('click', () => {
             if (confirm('Вы уверены, что хотите очистить весь лидерборд?')) {
                 this.clearLeaderboard();
                 document.body.removeChild(overlay);
                 this.showLeaderboard(); // Показываем пустой лидерборд
             }
         });
         
         // Закрытие по клику вне диалога
         overlay.addEventListener('click', (e) => {
             if (e.target === overlay) {
                 document.body.removeChild(overlay);
             }
         });
     }

     // Очистка лидерборда
     clearLeaderboard() {
         this.leaderboard = [];
         this.saveLeaderboard();
         console.log('Лидерборд очищен');
     }

     // Перезапуск игры
     restartGame() {
         // Останавливаем все таймеры
         if (this.spawnTimer) {
             clearTimeout(this.spawnTimer);
             this.spawnTimer = null;
         }
         
         // Сбрасываем все значения
         this.score = 0;
         this.correctAnswers = 0;
         this.comboCount = 0;
         this.maxCombo = 0;
         this.comboMultiplier = 1;
         this.currentLevel = 1;
         this.unlockedTypes = ['plastic', 'paper', 'organic'];
         this.currentSpawnInterval = this.baseSpawnInterval;
         this.gameStartTime = Date.now();
         this.perfectStreakStart = Date.now();
         this.lastErrorTime = 0;
         
         // Очищаем все объекты мусора
         this.activeTrashItems.forEach(item => {
             if (item.element && item.element.parentNode) {
                 item.element.parentNode.removeChild(item.element);
             }
         });
         this.activeTrashItems = [];
         
         // Сбрасываем заполнение контейнеров
         Object.keys(this.containerFillLevels).forEach(type => {
             this.containerFillLevels[type] = 0;
         });
         
         // Удаляем дополнительные контейнеры
         const containers = document.querySelectorAll('.container-btn');
         containers.forEach((container, index) => {
             if (index >= 3) { // Оставляем только первые 3 базовых контейнера
                 container.remove();
             }
         });
         
         // Обновляем массив контейнеров
         this.containers = Array.from(document.querySelectorAll('.container-btn'));
         
         // Обновляем интерфейс
         this.updateScore();
         this.updateComboDisplay();
         this.updateLevelDisplay();
         this.updateTrashCounter();
         this.initializeContainerFills();
         
         // Перезапускаем игру
         this.startSpawning();
         
         console.log('Игра перезапущена');
     }

     // Показать лидерборд (кнопка в интерфейсе)
     showLeaderboardButton() {
         this.showLeaderboard();
     }

     // Завершение игры вручную
     endGame() {
         console.log('endGame() вызван');
         
         // Останавливаем спавн
         if (this.spawnTimer) {
             clearTimeout(this.spawnTimer);
             this.spawnTimer = null;
             console.log('Таймер спавна остановлен');
         }
         
         // Показываем финальные статистики и проверяем рекорд
         setTimeout(() => {
             console.log('Вызываем checkForNewRecord()');
             this.checkForNewRecord();
         }, 500);
         
         console.log('Игра завершена вручную');
     }
}

// Запуск игры после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    const game = new SortingGame();
    
    // Добавляем глобальную ссылку для отладки
    window.game = game;
}); 