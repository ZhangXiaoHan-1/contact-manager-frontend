// API基础URL - 根据实际部署情况修改
const API_BASE_URL = 'https://contact-manager-backend-0lbk.onrender.com/api';
    
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
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // 搜索功能
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
    
    // 删除模态框事件
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeModal);
    closeDeleteModal.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeModal();
        }
    });
}

// API调用函数
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API调用失败:', error);
        alert('操作失败，请检查网络连接或服务器状态');
        throw error;
    }
}

// 加载联系人
async function loadContacts() {
    try {
        const contacts = await apiCall('/contacts');
        renderContacts(contacts);
    } catch (error) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <i>❌</i>
                <h3>加载失败</h3>
                <p>无法获取联系人数据，请刷新页面重试</p>
            </div>
        `;
    }
}

// 渲染联系人列表
function renderContacts(contactsToRender) {
    if (contactsToRender.length === 0) {
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
                <h3>${contact.name}</h3>
                <p>${contact.phone} | ${contact.email || '无邮箱'} | ${groupNames[contact.group]}</p>
                ${contact.company ? `<p>${contact.company}</p>` : ''}
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

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('contact-id').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const company = document.getElementById('company').value;
    const group = document.getElementById('group').value;
    
    const contactData = {
        name,
        phone,
        email,
        company,
        group
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
        
        document.getElementById('contact-id').value = contact.id;
        document.getElementById('name').value = contact.name;
        document.getElementById('phone').value = contact.phone;
        document.getElementById('email').value = contact.email || '';
        document.getElementById('company').value = contact.company || '';
        document.getElementById('group').value = contact.group;
        
        // 滚动到表单区域
        document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        // 错误已在apiCall中处理
    }
}

// 显示删除确认模态框
async function showDeleteModal(id) {
    try {
        const contact = await apiCall(`/contacts/${id}`);
        currentDeleteId = id;
        deleteContactName.textContent = contact.name;
        deleteModal.style.display = 'flex';
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
    deleteModal.style.display = 'none';
    currentDeleteId = null;
}

// 重置表单
function resetForm() {
    document.getElementById('contact-id').value = '';
    contactForm.reset();
}

// 处理搜索
async function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
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
