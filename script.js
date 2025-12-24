// 全局变量
let data = null;
let currentUser = null;
let currentPageIndex = 0;
let dataPages = [];

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
        dataPages[currentPageIndex].classList.remove('active');
        showBlessPage();
    }
}

// 显示上一页
function showPrevPage() {
    if (currentPageIndex > 0) {
        dataPages[currentPageIndex].classList.remove('active');
        currentPageIndex--;
        dataPages[currentPageIndex].classList.add('active');
    }
}

// 显示祝福页面
function showBlessPage() {
    const blessPage = document.getElementById('blessPage');
    const randomBless = data.summaryTexts[Math.floor(Math.random() * data.summaryTexts.length)];
    
    document.getElementById('blessTitle').textContent = randomBless.title;
    document.getElementById('blessContent').textContent = randomBless.content;
    
    blessPage.classList.add('active');
}

// 重新开始
function restart() {
    // 重置所有状态
    currentUser = null;
    currentPageIndex = 0;
    dataPages = [];
    
    // 清空输入框
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('errorMsg').textContent = '';
    
    // 隐藏所有页面，显示登录页
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('loginPage').classList.add('active');
    
    // 清空数据页面容器
    document.getElementById('dataPages').innerHTML = '';
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
});