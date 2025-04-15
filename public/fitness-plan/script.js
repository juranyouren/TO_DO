document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const calendar = document.getElementById('calendar');
  const detailsPanel = document.getElementById('detailsPanel');
  const planDetails = document.getElementById('planDetails');
  const moduleList = document.getElementById('moduleList');
  const moduleForm = document.getElementById('moduleForm');
  const addModuleBtn = document.getElementById('addModuleBtn');
  const saveModuleBtn = document.getElementById('saveModuleBtn');
  const cancelModuleBtn = document.getElementById('cancelModuleBtn');
  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  const notepad = document.getElementById('notepad');
  // 新增获取遮罩层元素
  const modalOverlay = document.getElementById('modalOverlay'); 
  
  // 训练模块数据
  let modules = [];
  let selectedModule = null;
  
  // 当前显示的详情对应的日期key，用于保存笔记
  let currentDetailDateKey = null;

  // 获取当前日期
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // 添加模块按钮点击事件
  addModuleBtn.addEventListener('click', () => {
    moduleForm.style.display = 'block';
  });
  
  // 保存模块按钮点击事件
  saveModuleBtn.addEventListener('click', () => {
    const name = document.getElementById('moduleName').value;
    const description = document.getElementById('moduleDescription').value;
    const duration = document.getElementById('moduleDuration').value;
    const intensity = document.getElementById('moduleIntensity').value;
    const color = document.getElementById('moduleColor').value;
    
    if (!name || !description || !duration) {
      alert('请填写完整信息');
      return;
    }
    
    const module = {
      id: Date.now().toString(),
      name,
      description,
      duration,
      intensity,
      color
    };
    
    modules.push(module);
    renderModules();
    moduleForm.style.display = 'none';
    resetForm();
  });
  
  // 取消按钮点击事件
  cancelModuleBtn.addEventListener('click', () => {
    moduleForm.style.display = 'none';
    resetForm();
  });
  
  // 添加关闭详情面板按钮事件 (修改)
  closeDetailsBtn.addEventListener('click', () => {
    detailsPanel.classList.remove('active');
    modalOverlay.classList.remove('active'); // 同时隐藏遮罩层
    currentDetailDateKey = null; 
  });

  // 点击遮罩层关闭模态框
  modalOverlay.addEventListener('click', () => {
    detailsPanel.classList.remove('active');
    modalOverlay.classList.remove('active');
    currentDetailDateKey = null;
  });

  // 添加记事本输入事件，实时保存
  notepad.addEventListener('input', () => {
    if (currentDetailDateKey) {
      localStorage.setItem(currentDetailDateKey, notepad.value);
    }
  });

  // 重置表单
  function resetForm() {
    document.getElementById('moduleName').value = '';
    document.getElementById('moduleDescription').value = '';
    document.getElementById('moduleDuration').value = '';
    document.getElementById('moduleIntensity').value = '高';
    document.getElementById('moduleColor').value = '#ff6b6b';
  }
  
  // 渲染训练模块列表
  function renderModules() {
    moduleList.innerHTML = '';
    modules.forEach(module => {
      const moduleElement = document.createElement('div');
      moduleElement.className = 'module-item';
      moduleElement.style.backgroundColor = module.color;
      moduleElement.style.color = 'white';
      moduleElement.textContent = module.name;
      moduleElement.draggable = true;
      
      // 添加拖拽事件
      moduleElement.addEventListener('dragstart', (e) => {
        selectedModule = module;
        e.dataTransfer.setData('text/plain', module.id);
      });
      
      moduleList.appendChild(moduleElement);
    });
  }
  
  // 生成日历网格
  function generateCalendar() {
    calendar.innerHTML = '';
    
    // 创建日历标题
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    calendarHeader.innerHTML = `<h2>${currentYear}年${currentMonth + 1}月</h2>`;
    calendar.appendChild(calendarHeader);
    
    // 创建星期标题
    const weekdayHeader = document.createElement('div');
    weekdayHeader.className = 'weekday-header';
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    weekdays.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.className = 'weekday';
      dayElement.textContent = day;
      weekdayHeader.appendChild(dayElement);
    });
    calendar.appendChild(weekdayHeader);
    
    // 创建日历网格容器
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 获取当月第一天是星期几
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    // 获取当月的总天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 获取上个月的总天数
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // 生成日历单元格
    // 上个月的日期
    for (let i = 0; i < firstDay; i++) {
      const cell = createCalendarCell(daysInPrevMonth - firstDay + i + 1, 'prev-month');
      calendarGrid.appendChild(cell);
    }
    
    // 当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const cell = createCalendarCell(i, 'current-month');
      
      // 如果是今天，添加特殊样式
      if (i === currentDate.getDate() && currentDate.getMonth() === currentMonth) {
        cell.classList.add('today');
      }
      
      calendarGrid.appendChild(cell);
    }
    
    // 计算需要显示的下个月天数
    const totalCells = 42; // 6行7列
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    // 下个月的日期
    for (let i = 1; i <= remainingCells; i++) {
      const cell = createCalendarCell(i, 'next-month');
      calendarGrid.appendChild(cell);
    }
    
    calendar.appendChild(calendarGrid);
  }
  
  // 创建日历单元格
  function createCalendarCell(day, monthClass) {
    const cell = document.createElement('div');
    cell.className = `calendar-cell ${monthClass}`;
    
    // 添加日期数字
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = day;
    cell.appendChild(dateNumber);
    
    // 添加拖放事件
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      cell.style.border = '2px dashed #2196F3'; // 视觉反馈
    });
    
    cell.addEventListener('dragleave', () => {
      cell.style.border = ''; // 恢复边框
      // 恢复今天的特殊边框（如果适用）
      if (cell.classList.contains('today')) {
         cell.style.border = '2px solid #2196F3';
      } else {
         cell.style.border = '1px solid #ddd';
      }
    });
    
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.style.border = ''; // 恢复边框
      // 恢复今天的特殊边框（如果适用）
       if (cell.classList.contains('today')) {
         cell.style.border = '2px solid #2196F3';
      } else {
         cell.style.border = '1px solid #ddd';
      }
      
      if (selectedModule) {
        // 移除现有的训练标记
        const existingMarker = cell.querySelector('.module-marker');
        if (existingMarker) {
          existingMarker.remove();
        }
        
        // 添加新的训练标记
        const marker = document.createElement('div');
        marker.className = 'module-marker';
        marker.style.backgroundColor = selectedModule.color;
        marker.textContent = selectedModule.name;
        // 将模块ID存入data属性，方便点击时查找
        marker.dataset.moduleId = selectedModule.id; 
        cell.appendChild(marker);
        
        // 拖放后也显示详情
        showDetails(selectedModule, day, monthClass);
      }
    });
    
    // 点击事件显示详情
    cell.addEventListener('click', () => {
      const marker = cell.querySelector('.module-marker');
      let module = null;
      if (marker && marker.dataset.moduleId) {
        module = modules.find(m => m.id === marker.dataset.moduleId); 
      }
      showDetails(module, day, monthClass); 
    });
    return cell;
  }

  // 获取完整日期字符串 YYYY-MM-DD
  function getFullDateString(day, monthClass) {
    let year = currentYear;
    let month = currentMonth;

    if (monthClass === 'prev-month') {
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    } else if (monthClass === 'next-month') {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    // 格式化月份和日期为两位数
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    // 使用 'note-' 前缀避免与其他 localStorage 项冲突
    return `note-${year}-${formattedMonth}-${formattedDay}`; 
  }
  
  // 显示详情面板 (修改为激活模态框和遮罩层，移除日志)
  function showDetails(module, day, monthClass) {
    let monthText = '';
    let monthValue = currentMonth;
    let yearValue = currentYear; 
    
    if (monthClass === 'prev-month') {
      monthText = '上个月';
      monthValue = currentMonth - 1;
      if (monthValue < 0) {
        monthValue = 11;
        yearValue--; // 更新年份
      }
    } else if (monthClass === 'next-month') {
      monthText = '下个月';
      monthValue = currentMonth + 1;
       if (monthValue > 11) {
        monthValue = 0;
        yearValue++; // 更新年份
      }
    } else {
      monthText = '本月';
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const dateDisplay = `${yearValue}年${monthNames[monthValue]}${day}日`; 

    // 清空之前的模块详情
    planDetails.innerHTML = ''; 

    // 如果有模块，显示模块信息
    if (module) {
      planDetails.innerHTML = `
        <h4>${monthText}${day}日 - ${module.name}</h4>
        <p><strong>日期：</strong>${dateDisplay}</p>
        <p><strong>训练类型：</strong>${module.description}</p>
        <p><strong>建议时长：</strong>${module.duration}</p>
        <p><strong>训练强度：</strong>${module.intensity}</p>
        <p>具体计划可以根据个人情况进行调整。</p> 
      `;
    } else {
      // 如果没有模块，只显示日期标题和提示
       planDetails.innerHTML = `<h4>${monthText}${day}日</h4><p><strong>日期：</strong>${dateDisplay}</p><p>今天没有安排训练模块。</p>`;
    }

    // 处理记事本
    currentDetailDateKey = getFullDateString(day, monthClass); 
    const savedNote = localStorage.getItem(currentDetailDateKey) || ''; 
    notepad.value = savedNote; 
    
    if (detailsPanel && modalOverlay) { // 检查两个元素是否存在
        detailsPanel.classList.add('active'); // 激活模态框
        modalOverlay.classList.add('active'); // 激活遮罩层
    } else {
        console.error('Details panel or modal overlay element not found!'); // 保留错误检查
    }
  }
  
  // 初始化日历和模块列表
  renderModules(); 
  generateCalendar();
});
