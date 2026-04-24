/* ==========================================================
   1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ПАМЯТЬ
   ========================================================== */

// Объект-память: хранит предыдущие цифры, чтобы анимация знала, от чего стартовать
let lastValues = {
    invested: 0,
    total: 0,
    profit: 0
};

/* ==========================================================
   2. ПОИСК ЭЛЕМЕНТОВ (Связи с HTML)
   ========================================================== */

// Вводные данные (откуда берем)
const inputAmount  = document.getElementById('input-amount');
const sliderAmount = document.getElementById('slider-amount');
const sliderPeriod = document.getElementById('slider-period');
const depositType  = document.getElementById('deposit-type');

// Результаты (куда пишем)
const resInvested   = document.getElementById('res-invested');
const resTotal      = document.getElementById('res-total');
const resProfit     = document.getElementById('res-profit');
const detailBase    = document.getElementById('detail-base');
const detailPercent = document.getElementById('detail-percent');

// Элементы оформления
const currencyBtns = document.querySelectorAll('.currency-btn');
const boxYellow    = document.querySelector('.box-yellow');

/* ==========================================================
   3. ИНИЦИАЛИЗАЦИЯ (Запуск сторонних библиотек)
   ========================================================== */

// Календарь Flatpickr
const fpStart = flatpickr("#date-start", {
    locale: "ru",
    dateFormat: "d F Y",
    defaultDate: "today",
    onChange: () => updateAll() // Пересчет при смене даты
});

/* ==========================================================
   4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Инструменты)
   ========================================================== */

// Функция закраски полоски ползунка (желтый след за бегунком)
function updateSliderTrack(slider) {
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.backgroundSize = value + '% 100%';
}

/**
* Функция для плавной анимации чисел
 * @param {HTMLElement} element - Элемент, где меняем текст
 * @param {number} start - С чего начинаем (старое значение)
 * @param {number} end - Чем заканчиваем (новое значение)
 * @param {string} currency - Валюта для приписки
 */

// Функция анимации чисел (одометр)
function animateValue(element, start, end, currency) {
    const duration = 500;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentValue = Math.floor(progress * (end - start) + start);
        
        element.innerText = currentValue.toLocaleString() + " " + currency;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}

/* ==========================================================
   5. СЛУШАТЕЛИ СОБЫТИЙ (Реакции на действия)
   ========================================================== */

// Ввод суммы (ползунком)
sliderAmount.addEventListener('input', () => {
    inputAmount.value = sliderAmount.value;
    updateSliderTrack(sliderAmount);
    updateAll();
});

// Ввод суммы (руками в поле)
inputAmount.addEventListener('input', () => {
    sliderAmount.value = inputAmount.value;
    updateAll();
});

// Выбор срока (второй ползунок)
sliderPeriod.addEventListener('input', () => {
    const steps = document.querySelectorAll('.calc__steps span');
    steps.forEach(step => step.classList.remove('active-step'));
    if (steps[sliderPeriod.value - 1]) {
        steps[sliderPeriod.value - 1].classList.add('active-step');
    }

    updateSliderTrack(sliderPeriod);
    updateAll();
});

// Выбор типа вклада (выпадающий список)
depositType.addEventListener('change', () => updateAll());

// Выбор валюты (кнопки)
currencyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        currencyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAll();
    });
});

/* ==========================================================
   6. ГЛАВНЫЙ МОЗГ (Функция расчета)
   ========================================================== */

function updateAll() {
    // 1. Получаем текущую валюту
    const activeCurrencyBtn = document.querySelector('.currency-btn.active');
    const currency = activeCurrencyBtn ? activeCurrencyBtn.innerText : "RUB";

    // 2. Базовые данные
    let amount = Number(inputAmount.value);
    let months = Number(sliderPeriod.value);

    // 3. Определяем процентную ставку
    let dailyRate = 0;
    if (depositType.value === 'standart') dailyRate = 0.005;
    else if (depositType.value === 'standart-plus') dailyRate = 0.0075;
    else if (depositType.value === 'vip') dailyRate = 0.01;

    // Вывод ставки на экран
    const percentRateDisplay = document.getElementById('percent-rate');
    if (percentRateDisplay) percentRateDisplay.innerText = (dailyRate * 100) + " %";

    // 4. Математика
    let totalDays = months * 30;
    let profit = amount * dailyRate * totalDays;
    let total = amount + profit;

    // 5. Визуализация (рост желтого блока)
    let percentage = (profit / total) * 100;
    percentage = Math.max(5, Math.min(95, percentage)); // Ограничители
    boxYellow.style.height = `${percentage}%`;

    // 6. Анимация цифр (используем память lastValues)
    animateValue(resInvested, lastValues.invested, amount, currency);
    animateValue(resTotal, lastValues.total, Math.round(total), currency);
    animateValue(resProfit, lastValues.profit, Math.round(profit), currency);

    // Обновляем память для следующего раза
    lastValues.invested = amount;
    lastValues.total = Math.round(total);
    lastValues.profit = Math.round(profit);

    // 7. Обновление текстовых полей и детализации
    document.querySelector('.calc__input-currency').innerText = currency;
    detailBase.innerText = amount.toLocaleString() + " " + currency;
    detailPercent.innerText = amount > 0 ? ((profit / amount) * 100).toFixed(1) + " %" : "0 %";

    // 8. Работа с датами
    let selectedDate = fpStart.selectedDates[0] || new Date();
    let endDate = new Date(selectedDate.getTime());
    endDate.setMonth(endDate.getMonth() + months);
    
    const endDateInput = document.getElementById('date-end');
    if (endDateInput) {
        endDateInput.value = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}

/* ==========================================================
   7. СТАРТ ПРИ ЗАГРУЗКЕ
   ========================================================== */
   
updateSliderTrack(sliderAmount); // Красим первый
updateSliderTrack(sliderPeriod); // Красим второй
updateAll();         // Считаем цифры