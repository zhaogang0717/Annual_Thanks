// 全局变量
let data = null;
let currentUser = null;
let currentPageIndex = 0;
let dataPages = [];
let totalPages = 0;

// 触摸事件相关变量
let startY = 0;
let startTime = 0;
let isScrolling = false;

// 海豚姿势配置
const dolphinPoses = {
    'DEV': ['working-dolphin', 'coding-dolphin', 'thinking-dolphin', 'working-dolphin', 'coding-dolphin'],
    'TESTER': ['testing-dolphin', 'working-dolphin', 'thinking-dolphin', 'testing-dolphin']
};

// 加载配置数据
async function loadConfig() {
    try {
        const response = await fetch('bill-config.json');
        data = await response.json();
    } catch (error) {
        console.error('加载配置文件失败:', error);
        alert('配置文件加载失败，请检查 bill-config.json 文件是否存在');
    }
}

// 登录功能
async function login() {
    if (!data) {
        alert('配置数据未加载，请刷新页面重试');
        return;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    if (!username || !password) {
        errorMsg.textContent = '请输入用户名和密码';
        return;
    }

    // 查找用户
    const user = data.users.find(u => u.name === username && u.password === password);
    
    if (!user) {
        errorMsg.textContent = '用户名或密码错误';
        return;
    }

    currentUser = user;
    generateDataPages();
    showNextPage();
}

// 生成数据页面
function generateDataPages() {
    const container = document.getElementById('dataPages');
    container.innerHTML = '';
    dataPages = [];

    const fieldMap = data.fieldMap[currentUser.role];
    const workData = currentUser.workData;
    const poses = dolphinPoses[currentUser.role];

    // 根据角色确定要显示的字段
    let fieldsToShow = [];
    if (currentUser.role === 'DEV') {
        fieldsToShow = ['story', 'task', 'analysis', 'PR', 'codeLine'];
    } else if (currentUser.role === 'TESTER') {
        fieldsToShow = ['case', 'test', 'bugFound', 'release'];
    }

    totalPages = fieldsToShow.length + 2; // 数据页面 + 登录页 + 祝福页

    fieldsToShow.forEach((field, index) => {
        const fieldConfig = fieldMap[field];
        const value = workData[field];
        const dolphinPose = poses[index] || 'working-dolphin';
        
        if (fieldConfig && value !== undefined) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'data-page';
            pageDiv.innerHTML = `
                <div class="image-section">
                    <div class="dolphin-container">
                        <div class="dolphin ${dolphinPose}">🐬</div>
                        <div class="bubbles">
                            <div class="bubble"></div>
                            <div class="bubble"></div>
                            <div class="bubble"></div>
                        </div>
                    </div>
                </div>
                <div class="content-section">
                    <div class="data-content">
                        <div class="data-label">${fieldConfig.label}</div>
                        <div class="data-number">${formatNumber(value)}</div>
                        <div class="data-desc">${fieldConfig.desc.replace('{value}', formatNumber(value))}</div>
                        <div class="nav-buttons">
                            <button class="nav-btn" onclick="showPrevPage()" ${index === 0 ? 'style="visibility: hidden;"' : ''}>上一页</button>
                            <button class="nav-btn" onclick="showNextPage()">${index === fieldsToShow.length - 1 ? '完成回顾' : '下一页'}</button>
                        </div>
                    </div>
                    <div class="page-indicator">${index + 2}/${totalPages}</div>
                </div>
            `;
            container.appendChild(pageDiv);
            dataPages.push(pageDiv);
        }
    });
}

// 格式化数字显示
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

// 显示下一页
function showNextPage() {
    const loginPage = document.getElementById('loginPage');
    const dataContainer = document.getElementById('dataPages');
    const blessPage = document.getElementById('blessPage');

    if (loginPage.classList.contains('active')) {
        // 从登录页到第一个数据页
        loginPage.classList.remove('active');
        dataContainer.classList.add('active');
        if (dataPages.length > 0) {
            dataPages[0].classList.add('active');
            currentPageIndex = 0;
        }
    } else if (currentPageIndex < dataPages.length - 1) {
        // 数据页之间切换
        dataPages[currentPageIndex].classList.remove('active');
        currentPageIndex++;
        dataPages[currentPageIndex].classList.add('active');
    } else {
        // 从最后一个数据页到祝福页
        dataContainer.classList.remove('active');
        if (dataPages.length > 0) {
            dataPages[currentPageIndex].classList.remove('active');
        }
        showBlessPage();
    }
    updatePageIndicator();
}

// 显示上一页
function showPrevPage() {
    const loginPage = document.getElementById('loginPage');
    const dataContainer = document.getElementById('dataPages');
    const blessPage = document.getElementById('blessPage');

    if (blessPage.classList.contains('active')) {
        // 从祝福页回到最后一个数据页
        blessPage.classList.remove('active');
        dataContainer.classList.add('active');
        if (dataPages.length > 0) {
            currentPageIndex = dataPages.length - 1;
            dataPages[currentPageIndex].classList.add('active');
        }
    } else if (currentPageIndex > 0) {
        // 数据页之间切换
        dataPages[currentPageIndex].classList.remove('active');
        currentPageIndex--;
        dataPages[currentPageIndex].classList.add('active');
    } else if (dataContainer.classList.contains('active') && currentPageIndex === 0) {
        // 从第一个数据页回到登录页
        dataContainer.classList.remove('active');
        dataPages[0].classList.remove('active');
        loginPage.classList.add('active');
        currentPageIndex = -1;
    }
    updatePageIndicator();
}

// 显示祝福页面
function showBlessPage() {
    const blessPage = document.getElementById('blessPage');
    const randomBless = data.summaryTexts[Math.floor(Math.random() * data.summaryTexts.length)];
    
    document.getElementById('blessTitle').textContent = randomBless.title;
    document.getElementById('blessContent').textContent = randomBless.content;
    
    blessPage.classList.add('active');
    updatePageIndicator();
}

// 重新开始
function restart() {
    // 重置所有状态
    currentUser = null;
    currentPageIndex = 0;
    dataPages = [];
    totalPages = 0;
    
    // 清空输入框，但保留默认值
    document.getElementById('username').value = 'leon';
    document.getElementById('password').value = 'leon123';
    document.getElementById('errorMsg').textContent = '';
    
    // 隐藏所有页面，显示登录页
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('loginPage').classList.add('active');
    
    // 清空数据页面容器
    document.getElementById('dataPages').innerHTML = '';
    
    // 更新页面指示器
    updatePageIndicator();
}

// 更新页面指示器
function updatePageIndicator() {
    const loginPage = document.getElementById('loginPage');
    const dataContainer = document.getElementById('dataPages');
    const blessPage = document.getElementById('blessPage');
    
    let currentPage = 1;
    let total = totalPages || 1;
    
    if (loginPage.classList.contains('active')) {
        currentPage = 1;
    } else if (dataContainer.classList.contains('active')) {
        currentPage = currentPageIndex + 2;
    } else if (blessPage.classList.contains('active')) {
        currentPage = total;
    }
    
    // 更新所有页面的指示器
    const indicators = document.querySelectorAll('.page-indicator');
    indicators.forEach(indicator => {
        indicator.textContent = `${currentPage}/${total}`;
    });
}

// 触摸事件处理
function handleTouchStart(e) {
    startY = e.touches[0].clientY;
    startTime = Date.now();
    isScrolling = false;
}

function handleTouchMove(e) {
    if (!startY) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = startY - currentY;
    
    // 如果垂直滑动距离超过水平滑动距离，则认为是垂直滑动
    if (Math.abs(diffY) > 10) {
        isScrolling = true;
        e.preventDefault(); // 阻止默认滚动行为
    }
}

function handleTouchEnd(e) {
    if (!startY || !isScrolling) return;
    
    const endY = e.changedTouches[0].clientY;
    const diffY = startY - endY;
    const diffTime = Date.now() - startTime;
    
    // 滑动距离和时间的阈值
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    if (Math.abs(diffY) > minSwipeDistance && diffTime < maxSwipeTime) {
        if (diffY > 0) {
            // 向上滑动 - 下一页
            showNextPage();
        } else {
            // 向下滑动 - 上一页
            showPrevPage();
        }
    }
    
    // 重置
    startY = 0;
    startTime = 0;
    isScrolling = false;
}

// 键盘事件监听
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const loginPage = document.getElementById('loginPage');
        if (loginPage.classList.contains('active')) {
            login();
        }
    }
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载配置数据
    await loadConfig();
    
    // 添加触摸事件监听
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 为输入框添加焦点效果
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
        });
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // 初始化页面指示器
    updatePageIndicator();
});