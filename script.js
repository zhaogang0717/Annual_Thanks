// 全局变量
let data = null;
let currentUser = null;
let currentPageIndex = -1; // -1 表示登录页
let pages = []; // 存储所有页面 DOM
let totalPages = 0;

// 触摸事件相关
let startY = 0;
let isMoving = false;

// 加载配置数据
async function loadConfig() {
    try {
        const response = await fetch('bill-config.json');
        data = await response.json();
    } catch (error) {
        console.error('加载配置文件失败:', error);
    }
}

// 登录功能
async function login() {
    if (!data) return;

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    const user = data.users.find(u => u.name === username && u.password === password);

    if (!user) {
        errorMsg.textContent = '用户名或密码错误哦~';
        setTimeout(() => errorMsg.textContent = '', 2000);
        return;
    }

    currentUser = user;
    initPages();
    showPage(0); // 显示第一个数据页
}

// 布局生成器集合
const layoutGenerators = {
    classic: (fieldConfig, displayValue, unit, index, total, poseImg) => `
        <div class="dolphin-wrapper dolphin-float">
            <img src="${poseImg}" class="dolphin-img" alt="Dolphin">
        </div>
        <div class="content-card">
            <div class="data-label">${fieldConfig.label}</div>
            <div class="data-number-container">
                <span class="data-number" data-target="${displayValue}">${displayValue}</span>
                <span class="data-unit">${unit}</span>
            </div>
            <div class="data-desc">${fieldConfig.desc.replace('{value}', displayValue + unit)}</div>
        </div>
    `,
    hero: (fieldConfig, displayValue, unit, index, total, poseImg) => `
        <div class="dolphin-wrapper dolphin-float">
            <img src="${poseImg}" class="dolphin-img" alt="Dolphin">
        </div>
        <div class="layout-hero-content">
            <div class="data-label">${fieldConfig.label}</div>
            <div class="data-number-container">
                <span class="data-number" data-target="${displayValue}">${displayValue}</span>
                <span class="data-unit">${unit}</span>
            </div>
            <div class="data-desc">${fieldConfig.desc.replace('{value}', displayValue + unit)}</div>
        </div>
    `,
    split: (fieldConfig, displayValue, unit, index, total, poseImg) => `
        <div class="layout-split-part layout-split-top">
            <div class="dolphin-wrapper dolphin-float">
               <img src="${poseImg}" class="dolphin-img" alt="Dolphin">
            </div>
        </div>
        <div class="layout-split-part layout-split-bottom">
            <div class="content-card">
                <div class="data-label">${fieldConfig.label}</div>
                <div class="data-number-container">
                    <span class="data-number" data-target="${displayValue}">${displayValue}</span>
                    <span class="data-unit">${unit}</span>
                </div>
                <div class="data-desc">${fieldConfig.desc.replace('{value}', displayValue + unit)}</div>
            </div>
        </div>
    `,
    bento: (fieldConfig, displayValue, unit, index, total, poseImg) => `
        <div class="content-card" style="grid-row: 1; border-radius: 32px;">
            <div class="data-label">${fieldConfig.label}</div>
            <div class="data-number-container">
                <span class="data-number" data-target="${displayValue}">${displayValue}</span>
                <span class="data-unit">${unit}</span>
            </div>
        </div>
        <div class="dolphin-wrapper dolphin-float" style="grid-row: 2;">
            <img src="${poseImg}" class="dolphin-img" alt="Dolphin">
        </div>
        <div class="content-card" style="grid-row: 3; background: rgba(255,255,255,0.4); backdrop-filter: blur(5px);">
             <div class="data-desc">${fieldConfig.desc.replace('{value}', displayValue + unit)}</div>
        </div>
    `,
    scattered: (fieldConfig, displayValue, unit, index, total, poseImg) => `
         <div class="dolphin-wrapper dolphin-float">
            <img src="${poseImg}" class="dolphin-img" alt="Dolphin">
        </div>
        <div class="content-card">
            <div class="data-label" style="text-align:left;">${fieldConfig.label}</div>
            <div class="data-number-container" style="text-align:left;">
                <span class="data-number" data-target="${displayValue}">${displayValue}</span>
                <span class="data-unit">${unit}</span>
            </div>
            <div class="data-desc" style="text-align:left;">${fieldConfig.desc.replace('{value}', displayValue + unit)}</div>
        </div>
    `
};

const themes = ['theme-morning', 'theme-deep', 'theme-sunset', 'theme-purple'];
const poses = ['dolphin_idle.png', 'dolphin_diving.png', 'dolphin_happy.png'];

// 初始化所有页面
function initPages() {
    const dataContainer = document.getElementById('dataPages');
    dataContainer.innerHTML = '';

    const fieldMap = data.fieldMap[currentUser.role];
    const workData = currentUser.workData;

    let fieldsToShow = [];
    if (currentUser.role === 'DEV') {
        fieldsToShow = ['story', 'task', 'analysis', 'bugFix', 'PR', 'codeLine'];
    } else if (currentUser.role === 'TESTER') {
        fieldsToShow = ['case', 'test', 'bugFound', 'release'];
    }

    pages = [document.getElementById('loginPage')];

    const layoutKeys = Object.keys(layoutGenerators);

    fieldsToShow.forEach((field, index) => {
        const fieldConfig = fieldMap[field];
        let value = workData[field] || 0;
        let unit = '';

        let displayValue = value;
        if (value >= 10000) {
            displayValue = (value / 10000).toFixed(1);
            unit = '万';
        }

        // 挑选布局和主题
        const layoutKey = layoutKeys[index % layoutKeys.length];
        const themeClass = themes[index % themes.length];

        let poseId = 'idel.png';
        if (field === 'bugFix' || field === 'bugFound') {
            poseId = 'struggle.png';
        } else if (field === 'task' || field === 'test' || field === 'codeLine') {
            poseId = 'diving.png';
        } else if (field === 'PR' || field === 'release') {
            poseId = 'happy.png';
        }

        const pageDiv = document.createElement('div');
        pageDiv.className = `page layout-${layoutKey} ${themeClass}`;
        pageDiv.dataset.theme = themeClass; // 存一下，切换时用

        pageDiv.innerHTML = `
            ${layoutGenerators[layoutKey](fieldConfig, displayValue, unit, index, fieldsToShow.length, poseId)}
            <div class="page-indicator">Step ${index + 1}/${fieldsToShow.length + 1}</div>
        `;
        dataContainer.appendChild(pageDiv);
        pages.push(pageDiv);
    });

    pages.push(document.getElementById('blessPage'));
    totalPages = pages.length;
}

// 切换页面
function showPage(index) {
    if (index < 0 || index >= totalPages) return;

    // 移除当前活动页
    if (currentPageIndex >= 0) {
        pages[currentPageIndex].classList.remove('active');
    } else {
        document.getElementById('loginPage').classList.remove('active');
    }

    currentPageIndex = index;
    const targetPage = pages[currentPageIndex];
    targetPage.classList.add('active');

    // 切换背景主题
    const oceanBg = document.querySelector('.ocean-bg');
    themes.forEach(t => oceanBg.classList.remove(t));
    if (targetPage.dataset.theme) {
        oceanBg.classList.add(targetPage.dataset.theme);
    } else if (targetPage.id === 'blessPage') {
        oceanBg.classList.add('theme-sunset');
    } else {
        oceanBg.classList.add('theme-morning');
    }

    // 触发数字动画
    const numberEl = targetPage.querySelector('.data-number');
    if (numberEl) {
        const target = parseFloat(numberEl.dataset.target);
        animateCount(numberEl, target);
    }

    // 触发进度条动画
    const progressEl = targetPage.querySelector('.data-progress-bar');
    if (progressEl) {
        setTimeout(() => {
            progressEl.style.width = progressEl.dataset.width || '100%';
        }, 300);
    }

    // 祝福页特殊逻辑
    if (targetPage.id === 'blessPage') {
        showBlessPage();
    }
}

// 数字增长动画
function animateCount(el, target) {
    let current = 0;
    const duration = 1500;
    const start = performance.now();

    const isInt = Number.isInteger(target);

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quad
        const easeProgress = progress * (2 - progress);
        current = target * easeProgress;

        el.textContent = isInt ? Math.floor(current).toLocaleString() : current.toFixed(1);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = isInt ? target.toLocaleString() : target.toFixed(1);
        }
    }
    requestAnimationFrame(update);
}

// 显示祝福页
function showBlessPage() {
    const randomBless = data.summaryTexts[Math.floor(Math.random() * data.summaryTexts.length)];
    document.getElementById('blessTitle').textContent = randomBless.title;
    document.getElementById('blessContent').textContent = randomBless.content;
}

// 重新开始
function restart() {
    currentUser = null;
    currentPageIndex = -1;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
}

// 气泡生成
function createBubbles() {
    const container = document.getElementById('bubblesContainer');
    setInterval(() => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble-bg';
        const size = Math.random() * 15 + 10 + 'px';
        bubble.style.width = size;
        bubble.style.height = size;
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.setProperty('--duration', Math.random() * 4 + 4 + 's');
        container.appendChild(bubble);
        setTimeout(() => bubble.remove(), 8000);
    }, 800);
}

// 触摸交互
function handleTouchStart(e) {
    startY = e.touches[0].clientY;
    isMoving = true;
}

function handleTouchEnd(e) {
    if (!isMoving) return;
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;

    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentPageIndex < totalPages - 1 && currentUser) {
            // 向上滑 -> 下一页
            showPage(currentPageIndex + 1);
        } else if (diff < 0 && currentPageIndex > 0) {
            // 向下滑 -> 上一页
            showPage(currentPageIndex - 1);
        }
    }
    isMoving = false;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    createBubbles();

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // 监听 Enter 键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && currentPageIndex === -1) {
            login();
        }
    });
});