// API基础URL - 根据实际部署情况修改
const API_BASE_URL = 'https://contact-manager-backend-0lbk.onrender.com/api/contacts';

    
let currentEditId = null;
let currentDeleteId = null;

// DOM元素
const contactForm = document.getElementById('contact-form');
const contactsList = document.getElementById('contacts-list');
const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const deleteModal = document.getElementById('delete-modal');
const deleteContactName = document.getElementById('delete-contact-name');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const closeDeleteModal = document.getElementById('close-delete-modal');

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 表单提交事件
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 搜索功能
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // 删除模态框事件
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeModal);
    }
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', closeModal);
    }
    
    // 点击模态框外部关闭
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeModal();
            }
        });
    }
}

// API调用函数 - 增强CORS支持
async function apiCall(endpoint, options = {}) {
    try {
        // 添加CORS配置
        const fetchOptions = {
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        // 处理CORS预检请求
        if (response.status === 0) {
            throw new Error('CORS错误: 无法访问API');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误! 状态: ${response.status}, 信息: ${errorText}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API调用失败:', error);
        
        // 更详细的错误信息
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            alert('网络连接失败，请检查：\n1. 后端服务是否运行\n2. API地址是否正确\n3. 网络连接是否正常');
        } else if (error.message.includes('CORS')) {
            alert('跨域访问被阻止，请确保后端已正确配置CORS');
        } else {
            alert(`操作失败: ${error.message}`);
        }
        
        throw error;
    }
}

// 测试后端连接
async function testBackendConnection() {
    try {
        const response = await fetch(API_BASE_URL.replace('/api', ''), {
            method: 'HEAD',
            mode: 'cors'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 加载联系人
async function loadContacts() {
    try {
        // 显示加载状态
        contactsList.innerHTML = `
            <div class="empty-state">
                <i>⏳</i>
                <h3>加载中...</h3>
                <p>正在获取联系人数据</p>
            </div>
        `;

        // 先测试连接
        const isBackendAlive = await testBackendConnection();
        if (!isBackendAlive) {
            throw new Error('后端服务无法访问，请检查服务状态');
        }

        const contacts = await apiCall('/contacts');
        renderContacts(contacts);
    } catch (error) {
        console.error('加载联系人失败:', error);
        contactsList.innerHTML = `
            <div class="empty-state">
                <i>❌</i>
                <h3>加载失败</h3>
                <p>${error.message || '无法获取联系人数据'}</p>
                <button onclick="loadContacts()" class="btn" style="margin-top: 10px;">重试</button>
            </div>
        `;
    }
}

// 渲染联系人列表
function renderContacts(contactsToRender) {
    if (!contactsList) return;
    
    if (!contactsToRender || contactsToRender.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <i>📇</i>
                <h3>暂无联系人</h3>
                <p>添加您的第一个联系人开始使用通讯录</p>
            </div>
        `;
        return;
    }
    
    contactsList.innerHTML = '';
    
    contactsToRender.forEach(contact => {
        const groupNames = {
            'family': '家人',
            'friends': '朋友',
            'colleagues': '同事',
            'business': '商务',
            'other': '其他'
        };
        
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <div class="contact-info">
                <h3>${escapeHtml(contact.name)}</h3>
                <p>${escapeHtml(contact.phone)} | ${escapeHtml(contact.email || '无邮箱')} | ${groupNames[contact.group] || '其他'}</p>
                ${contact.company ? `<p>${escapeHtml(contact.company)}</p>` : ''}
            </div>
            <div class="contact-actions">
                <button class="action-btn edit-btn" data-id="${contact.id}">✏️</button>
                <button class="action-btn delete-btn" data-id="${contact.id}">🗑️</button>
            </div>
        `;
        
        contactsList.appendChild(contactElement);
    });
    
    // 添加编辑和删除按钮的事件监听
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editContact(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            showDeleteModal(id);
        });
    });
}

// HTML转义函数，防止XSS攻击
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!contactForm) return;
    
    const id = document.getElementById('contact-id')?.value;
    const name = document.getElementById('name')?.value;
    const phone = document.getElementById('phone')?.value;
    const email = document.getElementById('email')?.value;
    const company = document.getElementById('company')?.value;
    const group = document.getElementById('group')?.value;
    
    // 验证必填字段
    if (!name || !phone) {
        alert('姓名和电话号码是必填项');
        return;
    }
    
    const contactData = {
        name,
        phone,
        email: email || '',
        company: company || '',
        group: group || 'other'
    };
    
    try {
        if (id) {
            // 编辑现有联系人
            await apiCall(`/contacts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(contactData)
            });
            alert('联系人更新成功！');
        } else {
            // 添加新联系人
            await apiCall('/contacts', {
                method: 'POST',
                body: JSON.stringify(contactData)
            });
            alert('联系人添加成功！');
        }
        
        // 重新加载联系人列表
        loadContacts();
        resetForm();
    } catch (error) {
        // 错误已在apiCall中处理
    }
}

// 编辑联系人
async function editContact(id) {
    try {
        const contact = await apiCall(`/contacts/${id}`);
        
        const contactIdField = document.getElementById('contact-id');
        const nameField = document.getElementById('name');
        const phoneField = document.getElementById('phone');
        const emailField = document.getElementById('email');
        const companyField = document.getElementById('company');
        const groupField = document.getElementById('group');
        
        if (contactIdField) contactIdField.value = contact.id;
        if (nameField) nameField.value = contact.name;
        if (phoneField) phoneField.value = contact.phone;
        if (emailField) emailField.value = contact.email || '';
        if (companyField) companyField.value = contact.company || '';
        if (groupField) groupField.value = contact.group;
        
        // 滚动到表单区域
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        // 错误已在apiCall中处理
    }
}

// 显示删除确认模态框
async function showDeleteModal(id) {
    try {
        const contact = await apiCall(`/contacts/${id}`);
        currentDeleteId = id;
        if (deleteContactName) {
            deleteContactName.textContent = contact.name;
        }
        if (deleteModal) {
            deleteModal.style.display = 'flex';
        }
    } catch (error) {
        // 错误已在apiCall中处理
    }
}

// 确认删除
async function confirmDelete() {
    if (currentDeleteId) {
        try {
            await apiCall(`/contacts/${currentDeleteId}`, {
                method: 'DELETE'
            });
            
            // 重新加载联系人列表
            loadContacts();
            closeModal();
            alert('联系人删除成功！');
        } catch (error) {
            // 错误已在apiCall中处理
        }
    }
}

// 关闭模态框
function closeModal() {
    if (deleteModal) {
        deleteModal.style.display = 'none';
    }
    currentDeleteId = null;
}

// 重置表单
function resetForm() {
    const contactIdField = document.getElementById('contact-id');
    if (contactIdField) {
        contactIdField.value = '';
    }
    if (contactForm) {
        contactForm.reset();
    }
}

// 处理搜索
async function handleSearch() {
    const searchTerm = searchInput?.value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadContacts();
        return;
    }
    
    try {
        const contacts = await apiCall('/contacts');
        const filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
            (contact.company && contact.company.toLowerCase().includes(searchTerm))
        );
        
        renderContacts(filteredContacts);
    } catch (error) {
        // 错误已在apiCall中处理
    }
}

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    e.preventDefault();
});
