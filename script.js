// 2025年度工作总结 - JavaScript
console.log('JavaScript文件已加载');

// 全局变量
let data = null;
let currentUser = null;
let currentPageIndex = -1;
let pages = [];
let totalPages = 0;
let complimentsByField = {};

// 图片预加载
const imageCache = new Map();
const imagesToPreload = ['idel.png', 'diving.png', 'happy.png', 'struggle.png'];
let imagesLoaded = 0;

const complimentCategoryMap = {
    DEV: {
        story: 'deliver',
        task: 'deliver',
        analysis: 'bug',
        bugFix: 'bug',
        PR: 'code',
        codeLine: 'code'
    },
    TESTER: {
        case: 'case',
        test: 'test',
        bugFound: 'bug',
    }
};

function buildValueMarkup(displayValue, unit) {
    const valueText = String(displayValue);
    if (unit) {
        return `<span class="data-value-inline"><span class="data-number data-number-inline">${valueText}</span><span class="data-unit-inline">${unit}</span></span>`;
    }
    return `<span class="data-value-inline"><span class="data-number data-number-inline">${valueText}</span></span>`;
}

function pickRandomItem(items) {
    if (!items || items.length === 0) {
        return null;
    }
    return items[Math.floor(Math.random() * items.length)];
}

function buildComplimentsByField(fieldsToShow) {
    const role = currentUser?.role;
    const roleCompliments = data?.compliments?.[role];
    if (!role || !roleCompliments) {
        return {};
    }

    const availableByCategory = {};
    Object.keys(roleCompliments).forEach(category => {
        availableByCategory[category] = [...roleCompliments[category]];
    });

    const used = new Set();
    const byField = {};

    fieldsToShow.forEach(field => {
        const category = complimentCategoryMap[role]?.[field];
        if (!category || !availableByCategory[category]) {
            return;
        }

        const candidates = availableByCategory[category].filter(text => !used.has(text));
        const chosen = pickRandomItem(candidates);
        if (!chosen) {
            return;
        }

        used.add(chosen);
        byField[field] = chosen;

        const removeIndex = availableByCategory[category].indexOf(chosen);
        if (removeIndex >= 0) {
            availableByCategory[category].splice(removeIndex, 1);
        }
    });

    return byField;
}

function preloadImages() {
    console.log('开始预加载图片...');
    
    imagesToPreload.forEach(src => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(src, img);
            imagesLoaded++;
            console.log(`图片 ${src} 预加载完成 (${imagesLoaded}/${imagesToPreload.length})`);
            
            if (imagesLoaded === imagesToPreload.length) {
                console.log('所有图片预加载完成');
            }
        };
        img.onerror = () => {
            console.error(`图片 ${src} 预加载失败`);
            imagesLoaded++;
        };
        img.src = src;
    });
}

// 加载配置数据
async function loadConfig() {
    try {
        console.log('开始加载配置文件...');
        const response = await fetch('bill-config.json');
        console.log('配置文件响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
        console.log('配置文件加载成功');
        return true;
    } catch (error) {
        console.error('加载配置文件失败:', error);
        data = null;
        return false;
    }
}

function setWelcomeMessage() {
    const subtitleEl = document.getElementById('welcomeSubtitle');
    const displayName = currentUser?.name ? `，${currentUser.name}` : '';

    if (subtitleEl) {
        subtitleEl.textContent = `欢迎回来${displayName}，准备开启你的年度回顾。`;
    }
}

function continueFromWelcome() {
    if (!currentUser) {
        return;
    }

    if (currentPageIndex < totalPages - 1) {
        showPage(currentPageIndex + 1);
    }
}

// 登录功能
async function login() {
    console.log('登录函数被调用');
    
    try {
        // 如果数据还没加载，先加载数据
        if (!data) {
            console.log('数据未加载，开始加载...');
            const loaded = await loadConfig();
            if (!loaded) {
                console.log('数据加载失败');
                document.getElementById('errorMsg').textContent = '系统初始化失败，请刷新页面重试';
                return;
            }
        }

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        console.log('用户输入:', username, password);

        const user = data.users.find(u => u.name === username && u.password === password);

        if (!user) {
            console.log('用户验证失败');
            errorMsg.textContent = '用户名或密码错误哦~';
            setTimeout(() => errorMsg.textContent = '', 2000);
            return;
        }

        console.log('用户验证成功:', user);
        currentUser = user;
        
        console.log('开始初始化页面');
        initPages();

        setWelcomeMessage();
        
        console.log('页面初始化完成，总页数:', totalPages);
        
        if (totalPages > 0) {
            console.log('开始显示第一页');
            showPage(0);
            blurActiveElement();
        } else {
            console.log('没有页面可显示');
        }
    } catch (error) {
        console.error('登录过程中发生错误:', error);
        document.getElementById('errorMsg').textContent = '登录过程中发生错误，请重试';
    }
}

// 初始化页面
function initPages() {
    console.log('initPages被调用');
    
    const dataContainer = document.getElementById('dataPages');
    dataContainer.innerHTML = '';

    pages = [];
    complimentsByField = {};
    const welcomePage = document.getElementById('welcomePage');
    if (welcomePage) {
        pages.push(welcomePage);
    }

    if (currentUser.role === 'SUPPORT') {
        const supportFlows = data?.supportFlows || [];
        const chosenFlow = pickRandomItem(supportFlows) || [];
        const supportMessages = chosenFlow.slice(0, 4);
        const supportPoses = ['idel.png', 'diving.png', 'struggle.png', 'happy.png'];

        console.log('Support流程页数:', supportMessages.length);

        supportMessages.forEach((message, index) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            const poseId = supportPoses[index % supportPoses.length];

            pageDiv.innerHTML = `
                <div class="dolphin-wrapper dolphin-float">
                    <img src="${poseId}" class="dolphin-img" alt="Dolphin" loading="lazy" style="background: linear-gradient(45deg, #e3f2fd, #bbdefb); border-radius: 50%;">
                </div>
                <div class="content-card">
                    <div class="data-desc">${message}</div>
                </div>
                <div class="page-indicator">${index + 1}/${supportMessages.length + 1}</div>
            `;

            dataContainer.appendChild(pageDiv);
            pages.push(pageDiv);
        });
    } else {
        const fieldMap = data.fieldMap[currentUser.role];
        const workData = currentUser.workData;

        let fieldsToShow = [];
        if (currentUser.role === 'DEV') {
            fieldsToShow = ['story', 'task', 'analysis', 'bugFix', 'PR', 'codeLine'];
        } else if (currentUser.role === 'TESTER') {
            fieldsToShow = ['case', 'test', 'bugFound'];
        }

        console.log('要显示的字段:', fieldsToShow);

        complimentsByField = buildComplimentsByField(fieldsToShow);

        fieldsToShow.forEach((field, index) => {
            console.log(`处理字段 ${field}, 索引 ${index}`);
            
            const fieldConfig = fieldMap[field];
            let value = workData[field] || 0;
            let unit = '';

            let displayValue = value;
            if (value >= 10000) {
                displayValue = (value / 10000).toFixed(1);
                unit = '万';
            }

            const valueMarkup = buildValueMarkup(displayValue, unit);

            // 根据字段选择不同的海豚图片
            let poseId = 'idel.png'; // 默认图片
            if (field === 'bugFix' || field === 'bugFound') {
                poseId = 'struggle.png'; // 修复bug时的困难表情
            } else if (field === 'task' || field === 'test' || field === 'codeLine') {
                poseId = 'diving.png'; // 工作中的专注表情
            } else if (field === 'PR') {
                poseId = 'happy.png'; // 完成工作的开心表情
            } else if (field === 'story' || field === 'case') {
                poseId = 'idel.png'; // 开始工作的平静表情
            } else if (field === 'analysis') {
                poseId = 'diving.png'; // 分析问题的专注表情
            }

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            const compliment = complimentsByField[field];
            const complimentHtml = compliment ? `<div class="data-compliment">${compliment}</div>` : '';
            
            pageDiv.innerHTML = `
                <div class="dolphin-wrapper dolphin-float">
                    <img src="${poseId}" class="dolphin-img" alt="Dolphin" loading="lazy" style="background: linear-gradient(45deg, #e3f2fd, #bbdefb); border-radius: 50%;">
                </div>
                <div class="content-card">
                    <div class="data-desc">${fieldConfig.desc.replace('{value}', valueMarkup)}</div>
                    ${complimentHtml}
                </div>
                <div class="page-indicator">${index + 1}/${fieldsToShow.length + 1}</div>
            `;
            
            dataContainer.appendChild(pageDiv);
            pages.push(pageDiv);
            
            console.log(`页面 ${index} 创建完成`);
        });
    }

    const blessPage = document.getElementById('blessPage');
    if (blessPage) {
        pages.push(blessPage);
    }
    totalPages = pages.length;
    
    console.log('页面初始化完成，总页数:', totalPages);
}

// 切换页面
function showPage(index) {
    console.log('showPage被调用，索引:', index);
    
    if (index < 0 || index >= totalPages) {
        console.log('索引超出范围');
        return;
    }

    // 移除当前活动页
    if (currentPageIndex === -1) {
        console.log('从登录页切换');
        document.getElementById('loginPage').classList.remove('active');
    } else if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
        console.log('从数据页切换');
        pages[currentPageIndex].classList.remove('active');
    }

    currentPageIndex = index;
    const targetPage = pages[currentPageIndex];
    
    console.log('目标页面:', targetPage);
    
    if (!targetPage) {
        console.log('目标页面不存在');
        return;
    }
    
    targetPage.classList.add('active');
    console.log('页面切换完成');

    // 祝福页特殊逻辑
    if (targetPage.id === 'blessPage') {
        showBlessPage();
    }
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
    pages = [];
    totalPages = 0;
    complimentsByField = {};
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('dataPages').innerHTML = '';
    document.getElementById('loginPage').classList.remove('keyboard-open');
}

function blurActiveElement() {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === 'function') {
        activeElement.blur();
    }
}

function setLoginKeyboardState(isOpen) {
    const loginPage = document.getElementById('loginPage');
    if (!loginPage) {
        return;
    }
    loginPage.classList.toggle('keyboard-open', isOpen);
}

function updateKeyboardStateFromViewport() {
    if (!window.visualViewport) {
        return;
    }
    const heightDiff = window.innerHeight - window.visualViewport.height;
    const active = document.activeElement;
    const isInputFocused = active && active.tagName === 'INPUT';

    if (heightDiff > 100) {
        setLoginKeyboardState(true);
    } else if (!isInputFocused) {
        setLoginKeyboardState(false);
    }
}

function setupKeyboardAvoidance() {
    const loginPage = document.getElementById('loginPage');
    if (!loginPage) {
        return;
    }

    const inputs = loginPage.querySelectorAll('input');
    if (!inputs.length) {
        return;
    }

    inputs.forEach(input => {
        input.addEventListener('focus', (event) => {
            setLoginKeyboardState(true);
            if (typeof event.target.scrollIntoView === 'function') {
                event.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });

        input.addEventListener('blur', () => {
            window.setTimeout(() => {
                const active = document.activeElement;
                if (active && active.tagName === 'INPUT') {
                    return;
                }
                if (window.visualViewport) {
                    updateKeyboardStateFromViewport();
                } else {
                    setLoginKeyboardState(false);
                }
            }, 120);
        });
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateKeyboardStateFromViewport);
    }
}

// 触摸事件
let startY = 0;
let startX = 0;
let isMoving = false;
let startOnEditable = false;

function isEditableTarget(target) {
    if (!target || typeof target.closest !== 'function') {
        return false;
    }
    return target.closest('input, textarea, select, [contenteditable="true"]');
}

function handleTouchStart(e) {
    if (e.touches.length !== 1) {
        isMoving = false;
        return;
    }
    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    startOnEditable = isEditableTarget(e.target);
    isMoving = !startOnEditable;
}

function handleTouchMove(e) {
    if (!isMoving || !e.cancelable) {
        return;
    }
    if (startOnEditable || isEditableTarget(e.target)) {
        return;
    }
    if (e.touches.length !== 1) {
        return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = Math.abs(currentY - startY);
    const diffX = Math.abs(currentX - startX);

    if (diffY > diffX) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    if (!isMoving) {
        startOnEditable = false;
        return;
    }
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;

    if (Math.abs(diff) > 50) {
        if (diff > 0 && currentPageIndex < totalPages - 1 && currentUser) {
            showPage(currentPageIndex + 1);
        } else if (diff < 0 && currentPageIndex > 0) {
            showPage(currentPageIndex - 1);
        }
    }
    isMoving = false;
    startOnEditable = false;
}

function handleTouchCancel() {
    isMoving = false;
    startOnEditable = false;
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面DOM加载完成');
    
    // 立即开始预加载图片
    preloadImages();
    
    loadConfig().then(() => {
        console.log('配置加载完成');
    });

    setupKeyboardAvoidance();

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);

    // 监听 Enter 键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (currentPageIndex === -1) {
                login();
            } else if (pages[currentPageIndex]?.id === 'welcomePage') {
                continueFromWelcome();
            }
        }
    });
    
    console.log('事件监听器已设置');
});
