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
        this.levelThresholds = [0, 100, 250, 450, 750]; // Очки для перехода на след. уровень (макс. уровень 4)
        this.unlockedTypes = ['plastic', 'paper']; // Начинаем только с 2 контейнеров
        

        
        // Система лидерборда
        this.playerName = '';
        this.leaderboard = this.loadLeaderboard();
        
        // Сохраняем лидерборд после миграции
        this.saveLeaderboard();
        
        // Анимация заполнения контейнеров
        this.containerFillLevels = {
            plastic: 0,
            paper: 0,
            organic: 0,
            glass: 0,
            battery: 0
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
        
        // Система достижений
        this.correctAnswersStreak = 0; // Серия правильных ответов подряд
        this.unlockedAchievements = [];
        this.achievements = [
            {
                id: 'nature_friend',
                name: 'Друг природы',
                description: '10 правильных ответов подряд',
                icon: '🏅',
                requirement: 10,
                unlocked: false
            },
            {
                id: 'master_sorter',
                name: 'Мастер сортировки',
                description: '25 правильных ответов подряд',
                icon: '🛡️',
                requirement: 25,
                unlocked: false
            },
            {
                id: 'eco_warrior',
                name: 'Эко-воин',
                description: '40 правильных ответов подряд',
                icon: '🌟',
                requirement: 40,
                unlocked: false
            }
        ];
        
        // Web Audio API для звуков
        this.audioContext = null;
        this.initAudio();
        
        // Образовательные факты для повышения уровня
        this.ecoFacts = [
            {
                title: "Пластик и океаны",
                text: "Каждую минуту в океаны попадает целый грузовик пластикового мусора. Переработка 1 тонны пластика экономит 2000 литров нефти!"
            },
            {
                title: "Бумага спасает деревья",
                text: "Переработка 1 тонны бумаги спасает 17 деревьев, экономит 26 000 литров воды и 4000 кВт·ч электроэнергии!"
            },
            {
                title: "Органические отходы",
                text: "Органика составляет 30% всех отходов. При правильной переработке из неё получается отличный компост для растений!"
            },
            {
                title: "Стекло - вечный материал",
                text: "Стекло можно перерабатывать бесконечно без потери качества. Из 1 переработанной бутылки экономится энергия для работы лампочки 4 часа!"
            },
            {
                title: "Опасные отходы",
                text: "Батарейки, лекарства и химикаты требуют специальной утилизации. Одна батарейка загрязняет 20 кв.м почвы на десятки лет!"
            }
        ];

        // Факты дня для стартового экрана
        this.dailyFacts = [
            {
                title: "Великое тихоокеанское мусорное пятно",
                text: "В Тихом океане плавает остров из пластика размером с 3 Франции! Он состоит из 80 000 тонн мусора и продолжает расти.",
                icon: "🌊"
            },
            {
                title: "Микропластик в нашей еде",
                text: "Средний человек съедает 5 граммов пластика в неделю - это как кредитная карточка! Микропластик найден даже в питьевой воде.",
                icon: "🍽️"
            },
            {
                title: "Вторая жизнь пластиковых бутылок",
                text: "Из 25 пластиковых бутылок можно сделать одну флисовую куртку, а из 35 бутылок - детское автокресло!",
                icon: "♻️"
            },
            {
                title: "Бумага против планшетов",
                text: "Производство одного планшета загрязняет окружающую среду как 24 кг бумаги. Но планшет может заменить тысячи листов!",
                icon: "📱"
            },
            {
                title: "Компост - золото для почвы",
                text: "1 тонна пищевых отходов может превратиться в 200 кг питательного компоста, который заменяет химические удобрения.",
                icon: "🌱"
            },
            {
                title: "Стеклянная магия",
                text: "Переработка стекла экономит 25-32% энергии по сравнению с производством нового. Стекло можно перерабатывать вечно!",
                icon: "🍾"
            },
            {
                title: "Опасные отходы",
                text: "Батарейки, просроченные лекарства и химикаты нельзя выбрасывать в обычный мусор - они загрязняют окружающую среду!",
                icon: "⚠️"
            },
            {
                title: "Правило 3R",
                text: "Reduce (сокращай), Reuse (используй повторно), Recycle (перерабатывай) - три принципа экологичной жизни.",
                icon: "🔄"
            },
            {
                title: "Быстрая мода и планета",
                text: "Индустрия моды производит 20% всех промышленных сточных вод. Покупай качественную одежду, которая прослужит дольше!",
                icon: "👕"
            },
            {
                title: "Цифровое загрязнение",
                text: "Отправка 65 электронных писем = 1 км поездки на автомобиле по углеродному следу. Удаляй ненужные файлы и письма!",
                icon: "📧"
            },
            {
                title: "Леса - легкие планеты",
                text: "Каждую секунду вырубается участок леса размером с футбольное поле. Переработка бумаги помогает сохранить деревья!",
                icon: "🌳"
            },
            {
                title: "Энергия из мусора",
                text: "В Швеции перерабатывают 99% бытовых отходов - часть сжигают для производства энергии, часть превращают в новые товары.",
                icon: "⚡"
            },
            {
                title: "Пластиковые острова",
                text: "В мировом океане дрейфует 5 гигантских мусорных пятен. Самое большое в 2 раза превышает размер Техаса!",
                icon: "🏝️"
            },
            {
                title: "Алюминиевые банки-чемпионы",
                text: "Алюминиевая банка полностью перерабатывается всего за 60 дней и может стать новой банкой бесконечное число раз!",
                icon: "🥤"
            },
            {
                title: "Мусорные горы",
                text: "Каждый человек производит около 4.5 кг мусора в день. За год это целая гора высотой с трехэтажный дом!",
                icon: "🗑️"
            }
        ];
        
        // Время разложения материалов (в годах)
        this.decompositionTime = {
            plastic: { min: 450, max: 1000, unit: "лет" },
            paper: { min: 2, max: 5, unit: "месяцев" },
            organic: { min: 1, max: 6, unit: "месяцев" },
            glass: { min: 1000000, max: 1000000, unit: "лет" },
            battery: { min: 100, max: 1000, unit: "лет" }
        };
        
        // Статистика для финального экрана
        this.recyclingStats = {
            totalItemsSorted: 0,
            itemsByType: {
                plastic: 0,
                paper: 0,
                organic: 0,
                glass: 0,
                battery: 0
            }
        };
        
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
            { emoji: '⚗️', type: 'battery', name: 'Химикаты' },
            { emoji: '🧴', type: 'battery', name: 'Опасная жидкость' }
            

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
        // Создаем несколько типов частиц для разнообразия
        this.createSparkParticles(x, y);
        this.createStarParticles(x, y);
        this.createGlowParticles(x, y);
    }

    // Искры - основные яркие частицы
    createSparkParticles(x, y) {
        const colors = ['#2ecc71', '#27ae60', '#f1c40f', '#f39c12', '#fff'];
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle spark-particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Случайный размер
            const size = 4 + Math.random() * 6;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            // Радиальный разлет
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const velocity = 40 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            particle.style.setProperty('--rotation', Math.random() * 360 + 'deg');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'sparkParticle 1s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    // Звездочки - декоративные элементы
    createStarParticles(x, y) {
        const starSymbols = ['✨', '⭐', '🌟', '💫'];
        const particleCount = 4;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle star-particle';
            particle.style.position = 'fixed';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.fontSize = (12 + Math.random() * 8) + 'px';
            particle.innerHTML = starSymbols[Math.floor(Math.random() * starSymbols.length)];
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9998';
            particle.style.color = '#fff';
            particle.style.textShadow = '0 0 10px #f1c40f';
            
            // Медленный подъем с покачиванием
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = -30 - Math.random() * 40;
            
            particle.style.setProperty('--vx', offsetX + 'px');
            particle.style.setProperty('--vy', offsetY + 'px');
            particle.style.setProperty('--rotation', Math.random() * 360 + 'deg');
            
            document.body.appendChild(particle);
            
            // Анимация и удаление
            particle.style.animation = 'starParticle 1.5s ease-out forwards';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }

    // Сияющие кольца
    createGlowParticles(x, y) {
        const colors = ['rgba(46, 204, 113, 0.6)', 'rgba(241, 196, 15, 0.6)', 'rgba(255, 255, 255, 0.4)'];
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const ring = document.createElement('div');
            ring.className = 'particle glow-particle';
            ring.style.position = 'fixed';
            ring.style.left = (x - 20) + 'px';
            ring.style.top = (y - 20) + 'px';
            ring.style.width = '40px';
            ring.style.height = '40px';
            ring.style.border = `2px solid ${colors[i % colors.length]}`;
            ring.style.borderRadius = '50%';
            ring.style.pointerEvents = 'none';
            ring.style.zIndex = '9997';
            ring.style.animationDelay = (i * 0.2) + 's';
            
            document.body.appendChild(ring);
            
            // Анимация и удаление
            ring.style.animation = 'glowRing 1s ease-out forwards';
            setTimeout(() => {
                if (ring.parentNode) {
                    ring.parentNode.removeChild(ring);
                }
            }, 1000 + (i * 200));
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
        
        // Инициализируем цветовую схему для 1-го уровня
        this.updateColorScheme();
        
        // Инициализируем атмосферные эффекты
        this.initAtmosphericEffects();
        
        // Показываем факт дня, затем запускаем игру
        this.showDailyFact();
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

        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                this.showLeaderboard();
            });
        }
        
        if (gameOverBtn) {
            gameOverBtn.addEventListener('click', () => {
                this.endGame();
            });
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
                    // Передаем тип контейнера и координаты drop
                    this.checkAnswer(container.dataset.type, droppedId, e.clientX, e.clientY);
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
        // Добавляем класс для грязного мусора
        element.classList.add('dirty-trash', `dirty-${type}`);
        
        switch(type) {
            case 'plastic':
                element.style.background = `
                    radial-gradient(circle at 20% 30%, rgba(101, 67, 33, 0.4) 8%, transparent 20%),
                    radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.3) 12%, transparent 25%),
                    radial-gradient(circle at 45% 15%, rgba(160, 82, 45, 0.2) 6%, transparent 18%),
                    linear-gradient(135deg, rgba(41, 128, 185, 0.6) 0%, rgba(52, 152, 219, 0.4) 40%, rgba(30, 100, 150, 0.7) 100%)
                `;
                element.style.border = '2px solid rgba(30, 100, 150, 0.6)';
                break;
            case 'paper':
                element.style.background = `
                    radial-gradient(circle at 15% 25%, rgba(101, 67, 33, 0.5) 10%, transparent 22%),
                    radial-gradient(circle at 75% 80%, rgba(139, 69, 19, 0.4) 8%, transparent 20%),
                    radial-gradient(circle at 60% 10%, rgba(205, 133, 63, 0.3) 12%, transparent 28%),
                    linear-gradient(45deg, rgba(218, 165, 32, 0.8) 0%, rgba(184, 134, 11, 0.9) 60%, rgba(160, 120, 20, 0.7) 100%)
                `;
                element.style.border = '2px solid rgba(160, 120, 20, 0.8)';
                break;
            case 'organic':
                element.style.background = `
                    radial-gradient(circle at 25% 35%, rgba(101, 67, 33, 0.6) 12%, transparent 25%),
                    radial-gradient(circle at 70% 20%, rgba(139, 69, 19, 0.5) 10%, transparent 22%),
                    radial-gradient(circle at 40% 85%, rgba(85, 107, 47, 0.4) 15%, transparent 30%),
                    linear-gradient(200deg, rgba(34, 139, 34, 0.5) 0%, rgba(85, 107, 47, 0.7) 50%, rgba(107, 142, 35, 0.6) 100%)
                `;
                element.style.border = '2px solid rgba(85, 107, 47, 0.8)';
                break;
            case 'glass':
                element.style.background = `
                    linear-gradient(45deg, rgba(220, 220, 220, 0.1) 0%, transparent 20%),
                    linear-gradient(135deg, transparent 40%, rgba(200, 200, 200, 0.2) 60%),
                    radial-gradient(circle at 30% 40%, rgba(169, 169, 169, 0.3) 5%, transparent 15%),
                    radial-gradient(circle at 80% 30%, rgba(105, 105, 105, 0.2) 8%, transparent 20%),
                    linear-gradient(200deg, rgba(176, 196, 222, 0.4) 0%, rgba(135, 206, 235, 0.3) 100%)
                `;
                element.style.border = '2px solid rgba(135, 206, 235, 0.5)';
                break;
            case 'battery':
                element.style.background = `
                    radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.6) 8%, transparent 18%),
                    radial-gradient(circle at 85% 75%, rgba(160, 82, 45, 0.5) 12%, transparent 25%),
                    radial-gradient(circle at 50% 90%, rgba(101, 67, 33, 0.4) 10%, transparent 22%),
                    linear-gradient(135deg, rgba(178, 34, 34, 0.7) 0%, rgba(139, 0, 0, 0.8) 50%, rgba(102, 25, 25, 0.9) 100%)
                `;
                element.style.border = '2px solid rgba(139, 0, 0, 0.8)';
                break;
            case 'metal':
                element.style.background = `
                    radial-gradient(circle at 30% 25%, rgba(139, 69, 19, 0.5) 10%, transparent 20%),
                    radial-gradient(circle at 75% 70%, rgba(160, 82, 45, 0.4) 8%, transparent 18%),
                    radial-gradient(circle at 15% 80%, rgba(101, 67, 33, 0.3) 12%, transparent 24%),
                    linear-gradient(45deg, rgba(105, 105, 105, 0.8) 0%, rgba(119, 136, 153, 0.6) 40%, rgba(75, 85, 95, 0.9) 100%)
                `;
                element.style.border = '2px solid rgba(75, 85, 95, 0.8)';
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
            
            // Показываем информацию о времени разложения
            this.showDecompositionInfo(element.dataset.type);
        });

        element.addEventListener('dragend', (e) => {
            this.isDragging = false;
            element.style.opacity = '1';
            this.clearContainerHighlights();
            
            // Скрываем информацию о времени разложения
            this.hideDecompositionInfo();
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
            
            // Показываем информацию о времени разложения
            this.showDecompositionInfo(element.dataset.type);
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
                    // Передаем тип контейнера и координаты касания
                    this.checkAnswer(dropTarget.dataset.type, element.dataset.id, touch.clientX, touch.clientY);
                } else {
                    this.resetTrashItemPosition(element);
                }
                
                this.isDragging = false;
                this.currentDraggedElement = null;
                this.clearContainerHighlights();
                
                // Скрываем информацию о времени разложения
                this.hideDecompositionInfo();
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

    checkAnswer(containerType, itemId, dropX = null, dropY = null) {
        // Находим объект по ID
        const trashItem = this.activeTrashItems.find(item => item.id === itemId);
        if (!trashItem) return;
        
        // Проверяем, соответствует ли тип мусора типу контейнера
        const isCorrect = containerType === trashItem.data.type;
        
        if (isCorrect) {
            const basePoints = 5;
            
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
            this.correctAnswersStreak++;
            
            // Проверяем достижения
            this.checkAchievements();
            
            // Обновляем статистику переработки
            this.recyclingStats.totalItemsSorted++;
            this.recyclingStats.itemsByType[trashItem.data.type]++;
            
            // Формируем сообщение
            let message = `+${points} очков!`;
            if (this.comboCount > 1) {
                message += ` Комбо ×${this.comboMultiplier}!`;
            } else {
                // Добавляем информацию о времени разложения только для первого правильного ответа (без комбо)
                const decomp = this.decompositionTime[trashItem.data.type];
                if (decomp) {
                    if (decomp.unit === "месяцев") {
                        message += `\n🌱 Время разложения: ${decomp.min}-${decomp.max} ${decomp.unit}`;
                    } else {
                        message += `\n⏰ Время разложения: ${decomp.min === decomp.max ? decomp.min : decomp.min + '-' + decomp.max} ${decomp.unit}`;
                    }
                }
            }
            
            this.showFeedback(message, 'success');
            this.animateTrashCorrect(trashItem.element, dropX, dropY);
            this.playSuccessSound();
            
            // Создаем эффект взрыва при комбо 4+
            if (this.comboCount >= 4 && this.comboCount % 2 === 0) {
                // Используем координаты drop если есть, иначе центр элемента
                let centerX, centerY;
                if (dropX && dropY) {
                    centerX = dropX;
                    centerY = dropY;
                } else {
                    const rect = trashItem.element.getBoundingClientRect();
                    centerX = rect.left + rect.width / 2;
                    centerY = rect.top + rect.height / 2;
                }
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
            
            // Сбрасываем серию правильных ответов
            this.correctAnswersStreak = 0;
            
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
    animateTrashCorrect(element, dropX = null, dropY = null) {
        element.style.animation = 'correctAnswer 0.6s ease-out';
        
        // Создаем частицы успеха в точке касания или центре элемента
        let particleX, particleY;
        if (dropX && dropY) {
            particleX = dropX;
            particleY = dropY;
        } else {
            const rect = element.getBoundingClientRect();
            particleX = rect.left + rect.width / 2;
            particleY = rect.top + rect.height / 2;
        }
        this.createSuccessParticles(particleX, particleY);
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

    // Проверка достижений
    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && this.correctAnswersStreak >= achievement.requirement) {
                this.unlockAchievement(achievement);
            }
        });
    }

    // Разблокирование достижения
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.unlockedAchievements.push(achievement);
        this.showAchievementNotification(achievement);
        console.log(`Достижение разблокировано: ${achievement.name}`);
    }

    // Показ уведомления о достижении
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h3>Достижение разблокировано!</h3>
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
        
        // Закрытие по клику
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        });
    }

    // Обновление отображения комбо и множителя
    updateComboDisplay() {
        document.getElementById('combo').textContent = this.comboCount;
        document.getElementById('multiplier').textContent = this.comboMultiplier;
        
        // Обновляем счетчик серии правильных ответов
        const streakElement = document.getElementById('streak');
        if (streakElement) {
            streakElement.textContent = this.correctAnswersStreak;
        }
        
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
            this.pauseGame();
        } else {
            this.resumeGame();
        }
    }

    // Поставить игру на паузу
    pauseGame() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
            console.log('Игра на паузе');
        }
    }

    // Возобновить игру
    resumeGame() {
        if (!this.spawnTimer) {
            this.scheduleNextSpawn();
            console.log('Игра возобновлена');
        }
    }

    // Принудительно возобновить игру (для случаев когда нужно гарантированно запустить спавн)
    forceResumeGame() {
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        this.scheduleNextSpawn();
        console.log('Игра принудительно возобновлена');
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
            currentLevel: this.currentLevel,
            activeItems: this.activeTrashItems.length,
            unlockedAchievements: this.unlockedAchievements.slice() // копия массива достижений
        };
    }

    // Методы бонусов удалены

    // Проверка и обновление уровня
    checkLevelUp() {
        // Проверяем победу на максимальном уровне
        if (this.currentLevel >= this.maxLevel) {
            const victoryThreshold = 750; // 750 очков = победа
            if (this.score >= victoryThreshold) {
                console.log('ПОБЕДА! Достигнут порог победы:', victoryThreshold);
                this.endGame();
            }
            return;
        }
        
        const nextLevelThreshold = this.levelThresholds[this.currentLevel];
        if (this.score >= nextLevelThreshold) {
            this.currentLevel++;
            this.unlockNewTrashTypes();
            this.updateColorScheme(); // Изменяем цветовую схему
            this.showLevelUpAnimation();
            this.updateLevelDisplay();
            console.log(`Переход на уровень ${this.currentLevel}!`);
        }
    }

    // Разблокировка новых типов мусора
    unlockNewTrashTypes() {
        const levelTrashTypes = {
            2: ['organic'],   // Уровень 2: добавляем органику (3-й контейнер)
            3: ['glass'],     // Уровень 3: добавляем стекло (4-й контейнер)  
            4: ['battery']    // Уровень 4: добавляем опасные отходы (5-й контейнер)
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
            
            // Эффект материализации контейнера
            this.materializeContainer(container, type);
        });
    }

    // Вспомогательные методы для контейнеров
    getContainerClass(type) {
        const classes = {
            organic: 'green',
            glass: 'cyan',
            battery: 'red',
            metal: 'gray'
        };
        return classes[type] || 'gray';
    }

    getContainerIcon(type) {
        const icons = {
            organic: '🍕',
            glass: '🥃',
            battery: '⚠️'
        };
        return icons[type] || '❓';
    }

    getContainerLabel(type) {
        const labels = {
            organic: 'Органика',
            glass: 'Стекло',
            battery: 'Опасные отходы'
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
        // Ставим игру на паузу во время анимации уровня
        this.pauseGame();
        
        const levelUpMessage = document.createElement('div');
        levelUpMessage.className = 'level-up-message';
        
        // Выбираем случайный факт
        const randomFact = this.ecoFacts[Math.floor(Math.random() * this.ecoFacts.length)];
        
        levelUpMessage.innerHTML = `
            <div class="level-up-content">
                <h2>🎉 УРОВЕНЬ ${this.currentLevel}! 🎉</h2>
                <p>Разблокированы новые типы мусора!</p>
                <p>Требуется: ${this.currentLevel >= 4 ? '750 очков для победы' : `${this.levelThresholds[this.currentLevel]} очков для следующего уровня`}</p>
                
                <div class="eco-fact">
                    <h3>🌱 ${randomFact.title}</h3>
                    <p>${randomFact.text}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(levelUpMessage);
        
        setTimeout(() => {
            if (levelUpMessage.parentNode) {
                levelUpMessage.parentNode.removeChild(levelUpMessage);
            }
            // Принудительно возобновляем игру после закрытия анимации уровня
            this.forceResumeGame();
            
            // Добавляем немедленный спавн мусора для лучшего UX
            if (this.activeTrashItems.length < this.maxTrashItems) {
                setTimeout(() => {
                    this.spawnTrash();
                }, 500); // Небольшая задержка для плавности
            }
        }, 5000); // Время показа 5 секунд как в CSS анимации
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
        
        const currentThreshold = this.levelThresholds[this.currentLevel - 1] || 0;
        const nextThreshold = this.levelThresholds[this.currentLevel];
        
        let progress = 0;
        if (nextThreshold) {
            // Рассчитываем прогресс от текущего порога к следующему
            const currentLevelProgress = this.score - currentThreshold;
            const levelRange = nextThreshold - currentThreshold;
            progress = Math.max(0, Math.min(100, (currentLevelProgress / levelRange) * 100));
        } else {
            // Максимальный уровень - показываем прогресс до победы от начала 4-го уровня
            const currentThresholdFor4 = this.levelThresholds[this.currentLevel - 1]; // 450 (начало 4-го уровня)
            const victoryThreshold = 750;
            const progressToVictory = this.score - currentThresholdFor4; // очки сверх 450
            const victoryRange = victoryThreshold - currentThresholdFor4; // 750 - 450 = 300
            progress = Math.min(100, (progressToVictory / victoryRange) * 100);
        }
        
        levelDisplay.innerHTML = `
            <div class="level-info">
                <span class="level-number">Уровень ${this.currentLevel}</span>
                <div class="level-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        
        console.log('Обновление уровня:', {
            score: this.score,
            currentLevel: this.currentLevel,
            currentThreshold,
            nextThreshold,
            progress: progress.toFixed(1) + '%'
        });
     }



     // Показ начальной подсказки
     showInitialTutorial() {
         // Ставим игру на паузу во время показа туториала
         this.pauseGame();
         
         const tutorial = document.createElement('div');
         tutorial.className = 'tutorial-popup';
         tutorial.innerHTML = `
             <div class="tutorial-content">
                 <div class="tutorial-icon">💡</div>
                 <p>Перетаскивайте объекты в правильные контейнеры</p>
                 <p>Собирайте комбо и бонусы для высоких результатов!</p>
             </div>
         `;
         
         document.body.appendChild(tutorial);
         
         // Удаляем подсказку через 3 секунды и возобновляем игру
         setTimeout(() => {
             tutorial.style.opacity = '0';
             setTimeout(() => {
                 if (tutorial.parentNode) {
                     tutorial.parentNode.removeChild(tutorial);
                 }
                 // Возобновляем игру после закрытия туториала
                 this.resumeGame();
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
             battery: '🔋'
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
             battery: ['rgba(231, 76, 60, 0.3)', 'rgba(231, 76, 60, 0.8)']
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
         const bonusPoints = 10;
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
             const leaderboard = JSON.parse(savedLeaderboard);
             // Миграция старых записей без поля level и achievements
             leaderboard.forEach(entry => {
                 if (entry.level === undefined) {
                     entry.level = 1; // Устанавливаем уровень 1 для старых записей
                 }
                 if (entry.achievements === undefined) {
                     entry.achievements = []; // Пустой массив достижений для старых записей
                 }
             });
             return leaderboard;
         }
         return [];
     }

     // Сохранение лидерборда в localStorage
     saveLeaderboard() {
         localStorage.setItem('sortingGameLeaderboard', JSON.stringify(this.leaderboard));
     }

     // Проверка на новый рекорд в конце игры
     checkForNewRecord() {
         const gameStats = this.getGameStats();
         const minScoreForLeaderboard = 50; // Минимальный счет для попадания в лидерборд
         
         if (gameStats.score >= minScoreForLeaderboard) {
             this.showNameInputDialog(gameStats);
         } else {
             this.showLeaderboard();
         }
     }

     // Диалог ввода имени для лидерборда
     showNameInputDialog(gameStats) {
         // Ставим игру на паузу во время диалога
         this.pauseGame();
         
         const overlay = document.createElement('div');
         overlay.className = 'leaderboard-overlay';
         
         // Рассчитываем экологический эффект
         const ecoImpact = this.calculateEcoImpact();
         
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
                     
                     <div class="recycling-stats">
                         <h3>🌍 Ваш вклад в экологию:</h3>
                         <p><strong>Всего отсортировано:</strong> ${this.recyclingStats.totalItemsSorted} предметов</p>
                         ${this.generateRecyclingBreakdown()}
                         <div class="eco-impact">
                             <h4>💚 Экологический эффект:</h4>
                             ${ecoImpact}
                         </div>
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
             timestamp: Date.now(),
             achievements: gameStats.unlockedAchievements || []
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
         // Ставим игру на паузу во время показа лидерборда
         this.pauseGame();
         
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
                 
                 // Формируем строку с достижениями
                 let achievementsHTML = '';
                 if (entry.achievements && entry.achievements.length > 0) {
                     // Находим соответствующие достижения по ID
                     const achievementIcons = entry.achievements.map(achievementId => {
                         const achievement = this.achievements.find(a => a.id === achievementId);
                         return achievement ? achievement.icon : '';
                     }).filter(icon => icon !== '').join(' ');
                     
                     if (achievementIcons) {
                         achievementsHTML = ` ${achievementIcons}`;
                     }
                 }
                 
                 leaderboardHTML += `
                     <div class="table-row ${position <= 3 ? 'top-three' : ''}">
                         <span class="position">${medal}</span>
                         <span class="name">${entry.name}${achievementsHTML}</span>
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
         
         const closeLeaderboard = () => {
             document.body.removeChild(overlay);
             // Возобновляем игру при закрытии лидерборда
             this.resumeGame();
         };
         
         closeBtn.addEventListener('click', closeLeaderboard);
         
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
                 closeLeaderboard();
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
        
        // Останавливаем атмосферные эффекты
        this.stopAtmosphericEffects();
        
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
        
        // Сбрасываем достижения
        this.correctAnswersStreak = 0;
        this.unlockedAchievements = [];
        this.achievements.forEach(achievement => {
            achievement.unlocked = false;
        });
        
        // Сбрасываем статистику переработки
        this.recyclingStats.totalItemsSorted = 0;
        Object.keys(this.recyclingStats.itemsByType).forEach(type => {
            this.recyclingStats.itemsByType[type] = 0;
        });
        
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
        
        // Перезапускаем атмосферные эффекты
        this.initAtmosphericEffects();
        
        console.log('Игра перезапущена');
     }

     // Показать лидерборд (кнопка в интерфейсе)
     showLeaderboardButton() {
         this.showLeaderboard();
     }

     // Генерация разбивки переработки по типам
     generateRecyclingBreakdown() {
         let breakdown = '';
         const typeNames = {
             plastic: '♻️ Пластик',
             paper: '📄 Бумага', 
             organic: '🌱 Органика',
             glass: '🍾 Стекло',
             battery: '⚠️ Опасные отходы'
         };
         
         for (const [type, count] of Object.entries(this.recyclingStats.itemsByType)) {
             if (count > 0) {
                 breakdown += `<p>${typeNames[type]}: ${count} шт.</p>`;
             }
         }
         
         return breakdown || '<p>Нет данных о переработке</p>';
     }
     
     // Расчет экологического воздействия
     calculateEcoImpact() {
         const impacts = {
             plastic: { 
                 text: 'Сэкономлено нефти', 
                 perItem: 2, // кг нефти на 1 кг пластика
                 unit: 'кг'
             },
             paper: { 
                 text: 'Спасено деревьев', 
                 perItem: 0.017, // деревьев на кг бумаги
                 unit: 'шт'
             },
             organic: { 
                 text: 'Получено компоста', 
                 perItem: 0.3, // кг компоста из кг органики
                 unit: 'кг'
             },
             glass: { 
                 text: 'Сэкономлено энергии', 
                 perItem: 0.5, // кВт·ч на кг стекла
                 unit: 'кВт·ч'
             },
             battery: { 
                 text: 'Предотвращено загрязнения', 
                 perItem: 20, // кв.м почвы/воды
                 unit: 'кв.м почвы/воды'
             }
         };
         
         let result = '';
         for (const [type, count] of Object.entries(this.recyclingStats.itemsByType)) {
             if (count > 0 && impacts[type]) {
                 const impact = impacts[type];
                 const value = (count * impact.perItem).toFixed(impact.unit === 'шт' ? 1 : 2);
                 result += `<p>• ${impact.text}: ${value} ${impact.unit}</p>`;
             }
         }
         
         return result || '<p>Начните сортировать мусор, чтобы увидеть экологический эффект!</p>';
     }

     // Показ информации о времени разложения
     showDecompositionInfo(type) {
         // Удаляем предыдущую информацию если есть
         this.hideDecompositionInfo();
         
         const spawnArea = document.getElementById('trash-spawn-area');
         const decomp = this.decompositionTime[type];
         
         if (!decomp || !spawnArea) return;
         
         const infoDiv = document.createElement('div');
         infoDiv.id = 'decomposition-info';
         infoDiv.className = 'decomposition-info';
         
         let timeText;
         if (decomp.unit === "месяцев") {
             timeText = `${decomp.min}-${decomp.max} ${decomp.unit}`;
         } else {
             timeText = decomp.min === decomp.max ? `${decomp.min} ${decomp.unit}` : `${decomp.min}-${decomp.max} ${decomp.unit}`;
         }
         
         // Выбираем иконку и цвет в зависимости от скорости разложения
         let icon, colorClass;
         if (decomp.unit === "месяцев") {
             icon = '🌱'; // Быстро разлагается
             colorClass = 'fast-decomp';
         } else if (decomp.max <= 100) {
             icon = '⏰'; // Медленно разлагается
             colorClass = 'slow-decomp';
         } else {
             icon = '⚠️'; // Очень медленно
             colorClass = 'very-slow-decomp';
         }
         
         infoDiv.innerHTML = `
             <div class="decomp-content">
                 ${icon} <strong>Время разложения:</strong><br>
                 ${timeText}
             </div>
         `;
         infoDiv.className += ` ${colorClass}`;
         
         spawnArea.appendChild(infoDiv);
     }
     
     // Скрытие информации о времени разложения
     hideDecompositionInfo() {
         const infoDiv = document.getElementById('decomposition-info');
         if (infoDiv && infoDiv.parentNode) {
             infoDiv.parentNode.removeChild(infoDiv);
         }
     }

     // Показ факта дня при запуске игры
     showDailyFact() {
         // Ставим игру на паузу во время показа факта
         this.pauseGame();
         
         // Создаем более разнообразный выбор факта
         const today = new Date();
         const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
         const currentHour = today.getHours();
         const currentMinute = today.getMinutes();
         
         // Комбинируем день, час и случайность для разнообразия
         const seed = dayOfYear + currentHour + Math.floor(currentMinute / 15); // Меняется каждые 15 минут
         const factIndex = seed % this.dailyFacts.length;
         const dailyFact = this.dailyFacts[factIndex];
         
         // Создаем оверлей для факта дня
         const overlay = document.createElement('div');
         overlay.className = 'daily-fact-overlay';
         
         overlay.innerHTML = `
             <div class="daily-fact-dialog">
                 <div class="daily-fact-header">
                     <span class="daily-fact-icon">${dailyFact.icon}</span>
                     <h2>Факт дня</h2>
                     <span class="daily-fact-date">${today.toLocaleDateString('ru-RU')}</span>
                 </div>
                 <div class="daily-fact-content">
                     <h3>${dailyFact.title}</h3>
                     <p>${dailyFact.text}</p>
                 </div>
                 <div class="daily-fact-footer">
                     <button id="start-game-btn" class="btn-primary">🎮 Начать игру</button>
                 </div>
             </div>
         `;
         
         document.body.appendChild(overlay);
         
         // Добавляем обработчики событий
         const startGameBtn = document.getElementById('start-game-btn');
         
         const startGame = () => {
             document.body.removeChild(overlay);
             this.showInitialTutorial();
             this.startSpawning();
             this.startOverflowMonitoring();
         };
         
         startGameBtn.addEventListener('click', startGame);
         
         // Автоматически запускаем игру через 15 секунд
         setTimeout(() => {
             if (overlay.parentNode) {
                 startGame();
             }
         }, 15000);
     }

     // Завершение игры вручную
     endGame() {
        // Останавливаем спавн мусора
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        
        // Получаем статистику игры
        const gameStats = this.getGameStats();
        
        // Проверяем новый рекорд
        this.checkForNewRecord(gameStats);
    }

    // Методы атмосферных эффектов
    initAtmosphericEffects() {
        this.atmosphericTimers = {
            leaves: null,
            dust: null
        };
        
        // Запускаем эффекты с небольшими задержками
        setTimeout(() => this.startFallingLeaves(), 1000);
        setTimeout(() => this.startDustParticles(), 2000);
    }

    startFallingLeaves() {
        const container = document.getElementById('falling-leaves');
        const leafEmojis = ['🍃', '🌿', '🍂', '🌱'];
        
        const createLeaf = () => {
            const leaf = document.createElement('div');
            leaf.className = 'falling-leaf';
            
            // Случайный тип листа
            leaf.textContent = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];
            
            // Случайные стили
            const speeds = ['slow', 'medium', 'fast'];
            leaf.classList.add(speeds[Math.floor(Math.random() * speeds.length)]);
            
            // Случайная позиция по горизонтали
            leaf.style.left = Math.random() * 100 + '%';
            
            // Случайная задержка анимации
            leaf.style.animationDelay = Math.random() * 2 + 's';
            
            container.appendChild(leaf);
            
            // Удаляем после завершения анимации
            setTimeout(() => {
                if (leaf.parentNode) {
                    leaf.parentNode.removeChild(leaf);
                }
            }, 10000);
        };
        
        // Создаем листья каждые 3-6 секунд
        const scheduleNextLeaf = () => {
            this.atmosphericTimers.leaves = setTimeout(() => {
                createLeaf();
                scheduleNextLeaf();
            }, Math.random() * 3000 + 3000);
        };
        
        scheduleNextLeaf();
    }

    startDustParticles() {
        const container = document.getElementById('dust-particles');
        
        const createDustParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';
            
            // Случайная скорость
            const speeds = ['slow', 'medium', 'fast'];
            particle.classList.add(speeds[Math.floor(Math.random() * speeds.length)]);
            
            // Случайная позиция
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            
            // Случайный размер
            const size = Math.random() * 2 + 1;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            container.appendChild(particle);
            
            // Удаляем после завершения анимации
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 15000);
        };
        
        // Создаем частицы пыли каждые 1-3 секунды
        const scheduleNextDust = () => {
            this.atmosphericTimers.dust = setTimeout(() => {
                createDustParticle();
                scheduleNextDust();
            }, Math.random() * 2000 + 1000);
        };
        
        scheduleNextDust();
    }

    startRecyclingRain() {
        const container = document.getElementById('recycling-rain');
        const recyclingEmojis = ['♻️', '🔄', '🌍', '💚', '🌿', '⚡', '💧', '🌟'];
        
        const createRecyclingDrop = () => {
            const drop = document.createElement('div');
            drop.className = 'recycling-drop';
            
            // Случайный символ переработки
            drop.textContent = recyclingEmojis[Math.floor(Math.random() * recyclingEmojis.length)];
            
            // Случайная скорость
            const speeds = ['slow', 'medium', 'fast'];
            drop.classList.add(speeds[Math.floor(Math.random() * speeds.length)]);
            
            // Случайная позиция
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDelay = Math.random() * 3 + 's';
            
            container.appendChild(drop);
            
            // Удаляем после завершения анимации
            setTimeout(() => {
                if (drop.parentNode) {
                    drop.parentNode.removeChild(drop);
                }
            }, 8000);
        };
        
        // Создаем капли переработки каждые 4-8 секунд
        const scheduleNextDrop = () => {
            this.atmosphericTimers.rain = setTimeout(() => {
                createRecyclingDrop();
                scheduleNextDrop();
            }, Math.random() * 4000 + 4000);
        };
        
        scheduleNextDrop();
    }

    // Метод для остановки атмосферных эффектов (при необходимости)
    stopAtmosphericEffects() {
        if (this.atmosphericTimers) {
            Object.values(this.atmosphericTimers).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        }
        
        // Очищаем все атмосферные элементы
        ['falling-leaves', 'dust-particles'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
        });
    }

    // Эффект материализации контейнера
    materializeContainer(container, type) {
        // Добавляем класс материализации
        container.classList.add('materializing');
        
        // Создаем волну материализации
        const wave = document.createElement('div');
        wave.className = 'materialize-wave';
        container.appendChild(wave);
        
        // Создаем энергетические частицы
        this.createEnergyParticles(container, type);
        
        // Удаляем эффекты через 2 секунды
        setTimeout(() => {
            container.classList.remove('materializing');
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
            
            // Добавляем финальный эффект свечения
            container.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
            setTimeout(() => {
                container.style.boxShadow = '';
            }, 1000);
        }, 2000);
    }

    // Создание энергетических частиц
    createEnergyParticles(container, type) {
        const particleColors = {
            glass: 'cyan',
            battery: 'red', 
            metal: 'gray',
            plastic: 'blue',
            paper: 'yellow',
            organic: 'green'
        };
        
        const particleColor = particleColors[type] || 'blue';
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = `energy-particle ${particleColor}`;
                
                // Случайная позиция вокруг контейнера
                const angle = (i / particleCount) * 2 * Math.PI;
                const radius = 40 + Math.random() * 20;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                particle.style.left = `calc(50% + ${x}px)`;
                particle.style.top = `calc(50% + ${y}px)`;
                
                // Случайная задержка анимации
                particle.style.animationDelay = Math.random() * 0.5 + 's';
                
                container.appendChild(particle);
                
                // Удаляем частицу после анимации
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 1500);
            }, i * 100); // Задержка между частицами
        }
    }

    // Изменение цветовой схемы в зависимости от уровня
    updateColorScheme() {
        const root = document.documentElement;
        
        // Определяем цветовую схему на основе уровня
        let levelPrefix;
        if (this.currentLevel === 1) {
            levelPrefix = 'level1';
        } else if (this.currentLevel === 2) {
            levelPrefix = 'level2';
        } else {
            levelPrefix = 'level3';
        }
        
        // Обновляем CSS переменные
        root.style.setProperty('--current-primary', `var(--${levelPrefix}-primary)`);
        root.style.setProperty('--current-secondary', `var(--${levelPrefix}-secondary)`);
        root.style.setProperty('--current-accent', `var(--${levelPrefix}-accent)`);
        root.style.setProperty('--current-bg', `var(--${levelPrefix}-bg)`);
        root.style.setProperty('--current-particle', `var(--${levelPrefix}-particle)`);
        
        // Добавляем эффект перехода цвета
        this.createColorTransitionEffect();
        
        console.log(`Цветовая схема изменена на уровень ${this.currentLevel} (${levelPrefix})`);
    }

    // Эффект перехода цвета
    createColorTransitionEffect() {
        // Создаем волну цвета по экрану
        const colorWave = document.createElement('div');
        colorWave.style.cssText = `
            position: fixed;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: var(--current-primary);
            opacity: 0.3;
            z-index: 1000;
            pointer-events: none;
            animation: colorWaveAnimation 1.5s ease-out forwards;
        `;
        
        // Добавляем CSS анимацию для волны цвета
        const style = document.createElement('style');
        style.textContent = `
            @keyframes colorWaveAnimation {
                0% {
                    left: -100%;
                    opacity: 0.3;
                }
                50% {
                    left: 0%;
                    opacity: 0.5;
                }
                100% {
                    left: 100%;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(colorWave);
        
        // Удаляем элементы после анимации
        setTimeout(() => {
            if (colorWave.parentNode) {
                colorWave.parentNode.removeChild(colorWave);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 1500);
    }
}

// Запуск игры после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    const game = new SortingGame();
    
    // Добавляем глобальную ссылку для отладки
    window.game = game;
}); 