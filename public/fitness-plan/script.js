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
  
  // 训练模块数据
  let modules = [];
  let selectedModule = null;
  
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
      cell.style.transform = 'scale(1.05)';
    });
    
    cell.addEventListener('dragleave', () => {
      cell.style.transform = '';
    });
    
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.style.transform = '';
      
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
        cell.appendChild(marker);
        
        // 显示详情面板
        showDetails(selectedModule, day, monthClass);
      }
    });
    
    // 点击事件显示详情
    cell.addEventListener('click', () => {
      const marker = cell.querySelector('.module-marker');
      if (marker) {
        const module = modules.find(m => m.name === marker.textContent);
        if (module) {
          showDetails(module, day, monthClass);
        }
      }
    });
    
    return cell;
  }
  
  // 显示详情面板
  function showDetails(module, day, monthClass) {
    let monthText = '';
    let monthValue = currentMonth;
    
    if (monthClass === 'prev-month') {
      monthText = '上个月';
      monthValue = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
    } else if (monthClass === 'next-month') {
      monthText = '下个月';
      monthValue = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
    } else {
      monthText = '本月';
    }
    
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    planDetails.innerHTML = `
      <h4>${monthText}${day}日 - ${module.name}</h4>
      <p><strong>日期：</strong>${currentYear}年${monthNames[monthValue]}${day}日</p>
      <p><strong>训练类型：</strong>${module.description}</p>
      <p><strong>建议时长：</strong>${module.duration}</p>
      <p><strong>训练强度：</strong>${module.intensity}</p>
      <p>具体计划可以根据个人情况进行调整。点击日历中的其他日期可以查看或设置不同的训练计划。</p>
    `;
    
    detailsPanel.classList.add('active');
  }
  
  // 初始化日历
  generateCalendar();
});
