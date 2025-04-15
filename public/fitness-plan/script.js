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
  const modalOverlay = document.getElementById('modalOverlay');
  const formTitle = document.getElementById('formTitle');
  const editModuleIdInput = document.getElementById('editModuleId');

  // 数据
  let modules = [];
  let calendarAssignments = {}; // { 'YYYY-MM-DD': { moduleId: '...', note: '...' }, ... }
  let selectedModule = null;
  let currentDetailDateKey = null; // Stores 'note-YYYY-MM-DD' for notepad saving

  // 持久化函数
  function loadData() {
    const storedModules = localStorage.getItem('fitnessModules');
    const storedAssignments = localStorage.getItem('fitnessAssignments');
    if (storedModules) {
      try {
        modules = JSON.parse(storedModules);
        if (!Array.isArray(modules)) modules = []; // Ensure it's an array
      } catch (e) {
        console.error("Error parsing stored modules:", e);
        modules = [];
      }
    } else {
      modules = [];
    }
    if (storedAssignments) {
      try {
        calendarAssignments = JSON.parse(storedAssignments);
        if (typeof calendarAssignments !== 'object' || calendarAssignments === null) {
            calendarAssignments = {}; // Ensure it's an object
        }
      } catch (e) {
        console.error("Error parsing stored assignments:", e);
        calendarAssignments = {};
      }
    } else {
      calendarAssignments = {};
    }
    console.log("Data loaded:", { modules, calendarAssignments });
  }

  function saveModules() {
    localStorage.setItem('fitnessModules', JSON.stringify(modules));
    console.log("Modules saved:", modules);
  }

  function saveAssignments() {
    localStorage.setItem('fitnessAssignments', JSON.stringify(calendarAssignments));
    console.log("Assignments saved:", calendarAssignments);
  }

  // 获取当前日期
  const currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();

  // --- 事件监听器 ---

  // 添加模块按钮
  addModuleBtn.addEventListener('click', () => {
    resetForm();
    formTitle.textContent = '添加训练模块';
    moduleForm.style.display = 'block';
    modalOverlay.classList.add('active');
  });

  // 保存模块按钮 (完成)
  saveModuleBtn.addEventListener('click', () => {
    const name = document.getElementById('moduleName').value.trim();
    const description = document.getElementById('moduleDescription').value.trim();
    const duration = document.getElementById('moduleDuration').value.trim();
    const intensity = document.getElementById('moduleIntensity').value;
    const color = document.getElementById('moduleColor').value;
    const editId = editModuleIdInput.value; // 获取编辑ID

    if (!name || !description || !duration) {
      alert('请填写完整信息');
      return;
    }

    if (editId) {
      // --- 编辑模式 ---
      const moduleIndex = modules.findIndex(m => m.id === editId);
      if (moduleIndex > -1) {
        const originalColor = modules[moduleIndex].color;
        modules[moduleIndex] = { ...modules[moduleIndex], name, description, duration, intensity, color };
        console.log('Module edited:', modules[moduleIndex]);
        saveModules(); // 保存更新后的模块列表
        renderModules(); // 重新渲染模块列表
        // 如果颜色改变，需要更新日历上的标记颜色
        if (originalColor !== color) {
            generateCalendar(); // 重新生成日历以更新颜色
        }
      } else {
          console.error("Module to edit not found:", editId);
      }
    } else {
      // --- 添加模式 ---
      const newModule = {
        id: Date.now().toString(),
        name,
        description,
        duration,
        intensity,
        color
      };
      modules.push(newModule);
      console.log('Module added:', newModule);
      saveModules(); // 保存模块数据
      renderModules(); // 添加后只需渲染模块列表
    }

    moduleForm.style.display = 'none';
    modalOverlay.classList.remove('active'); // 隐藏遮罩
    resetForm();
  });

  // 取消按钮
  cancelModuleBtn.addEventListener('click', () => {
    moduleForm.style.display = 'none';
    modalOverlay.classList.remove('active');
    resetForm();
  });

  // 关闭详情面板按钮
  closeDetailsBtn.addEventListener('click', () => {
    detailsPanel.classList.remove('active');
    modalOverlay.classList.remove('active');
    currentDetailDateKey = null;
  });

  // 点击遮罩层关闭模态框/表单 (修改)
  modalOverlay.addEventListener('click', (event) => {
    // 检查点击事件的目标是否是遮罩层本身
    if (event.target === modalOverlay) { 
      detailsPanel.classList.remove('active');
      moduleForm.style.display = 'none'; 
      modalOverlay.classList.remove('active');
      currentDetailDateKey = null;
      resetForm(); 
    }
  });

  // 记事本输入
  notepad.addEventListener('input', () => {
    if (currentDetailDateKey) {
      const dateKey = currentDetailDateKey.replace('note-', ''); // 获取 YYYY-MM-DD
      if (!calendarAssignments[dateKey]) {
          calendarAssignments[dateKey] = {}; // 如果日期不存在，创建对象
      }
      calendarAssignments[dateKey].note = notepad.value; // 保存笔记
      // 如果笔记为空且没有模块ID，则删除该日期条目
      if (!calendarAssignments[dateKey].note && !calendarAssignments[dateKey].moduleId) {
          delete calendarAssignments[dateKey];
      }
      saveAssignments(); // 保存分配（包含笔记）
    }
  });

  // --- 函数 ---

  // 重置表单 (完成)
  function resetForm() {
    editModuleIdInput.value = '';
    document.getElementById('moduleName').value = '';
    document.getElementById('moduleDescription').value = '';
    document.getElementById('moduleDuration').value = '';
    document.getElementById('moduleIntensity').value = '高'; // Reset to default
    document.getElementById('moduleColor').value = '#ff6b6b'; // Reset to default
    formTitle.textContent = '添加训练模块';
  }

  // 渲染训练模块列表
  function renderModules() {
    moduleList.innerHTML = '';
    modules.forEach(module => {
      const moduleElement = document.createElement('div');
      moduleElement.className = 'module-item';
      moduleElement.style.backgroundColor = module.color;
      moduleElement.draggable = true;
      moduleElement.dataset.moduleId = module.id;

      const nameEl = document.createElement('strong');
      nameEl.textContent = module.name;
      const descEl = document.createElement('p');
      descEl.textContent = `描述: ${module.description}`;
      descEl.style.fontSize = '0.9em';
      descEl.style.margin = '5px 0';
      const durEl = document.createElement('p');
      durEl.textContent = `时长: ${module.duration}`;
      durEl.style.fontSize = '0.9em';
      durEl.style.margin = '5px 0';
      const intEl = document.createElement('p');
      intEl.textContent = `强度: ${module.intensity}`;
      intEl.style.fontSize = '0.9em';
      intEl.style.margin = '5px 0';

      moduleElement.appendChild(nameEl);
      moduleElement.appendChild(descEl);
      moduleElement.appendChild(durEl);
      moduleElement.appendChild(intEl);

      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'module-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'module-action-btn';
      editBtn.textContent = '✏️';
      editBtn.title = '编辑';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        formTitle.textContent = '编辑训练模块';
        editModuleIdInput.value = module.id;
        document.getElementById('moduleName').value = module.name;
        document.getElementById('moduleDescription').value = module.description;
        document.getElementById('moduleDuration').value = module.duration;
        document.getElementById('moduleIntensity').value = module.intensity;
        document.getElementById('moduleColor').value = module.color;
        moduleForm.style.display = 'block';
        modalOverlay.classList.add('active');
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'module-action-btn';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = '删除';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`确定要删除模块 "${module.name}" 吗？\n这将从日历中移除所有相关的训练安排。`)) {
          const index = modules.findIndex(m => m.id === module.id);
          if (index > -1) {
            modules.splice(index, 1);
            saveModules();

            let assignmentsChanged = false;
            Object.keys(calendarAssignments).forEach(dateKey => {
              if (calendarAssignments[dateKey] && calendarAssignments[dateKey].moduleId === module.id) {
                delete calendarAssignments[dateKey].moduleId;
                if (!calendarAssignments[dateKey].note) {
                    delete calendarAssignments[dateKey];
                }
                assignmentsChanged = true;
              }
            });
            if (assignmentsChanged) {
              saveAssignments();
            }

            renderModules();
            generateCalendar();
            console.log(`Module ${module.id} deleted.`);
          }
        }
      });

      actionsContainer.appendChild(editBtn);
      actionsContainer.appendChild(deleteBtn);
      moduleElement.appendChild(actionsContainer);

      moduleElement.addEventListener('dragstart', (e) => {
        const currentModuleData = modules.find(m => m.id === module.id);
        if (currentModuleData) {
            selectedModule = currentModuleData;
            e.dataTransfer.setData('text/plain', currentModuleData.id);
            console.log('Dragging module:', selectedModule);
        } else {
            e.preventDefault();
            console.error("Cannot drag deleted module");
        }
      });

      moduleList.appendChild(moduleElement);
    });
  }

  // 生成日历网格
  function generateCalendar() {
    calendar.innerHTML = '';

    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    // 添加切换月份的按钮
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.textContent = '<';
    prevMonthBtn.onclick = () => changeMonth(-1);
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.textContent = '>';
    nextMonthBtn.onclick = () => changeMonth(1);
    const monthTitle = document.createElement('h2');
    monthTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
    // 确保按钮和标题在同一行
    calendarHeader.style.display = 'flex';
    calendarHeader.style.justifyContent = 'space-between';
    calendarHeader.style.alignItems = 'center';
    prevMonthBtn.style.marginRight = '10px'; // 添加一些间距
    nextMonthBtn.style.marginLeft = '10px'; // 添加一些间距

    calendarHeader.appendChild(prevMonthBtn);
    calendarHeader.appendChild(monthTitle);
    calendarHeader.appendChild(nextMonthBtn);
    calendar.appendChild(calendarHeader);


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

    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 上个月
    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + i + 1;
      const cell = createCalendarCell(day, 'prev-month');
      calendarGrid.appendChild(cell);
    }

    // 当月
    for (let i = 1; i <= daysInMonth; i++) {
      const cell = createCalendarCell(i, 'current-month');
      // 确保 today 样式只在当前视图的今天应用
      if (i === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
        cell.classList.add('today');
      }
      calendarGrid.appendChild(cell);
    }

    // 下个月
    const totalCells = 42;
    const currentGridCells = firstDay + daysInMonth;
    const remainingCells = (totalCells - currentGridCells >= 0) ? totalCells - currentGridCells : (totalCells - currentGridCells + 7);

    for (let i = 1; i <= remainingCells; i++) {
        const cell = createCalendarCell(i, 'next-month');
        calendarGrid.appendChild(cell);
    }

    calendar.appendChild(calendarGrid);
  }

  // 切换月份函数
  function changeMonth(delta) {
      currentMonth += delta;
      if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
      } else if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
      }
      generateCalendar(); // 重新生成日历
  }

  // 创建日历单元格
  function createCalendarCell(day, monthClass) {
    const cell = document.createElement('div');
    cell.className = `calendar-cell ${monthClass}`;
    const dateKey = getDateKey(day, monthClass);

    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = day;
    cell.appendChild(dateNumber);

    const assignment = calendarAssignments[dateKey];
    if (assignment && assignment.moduleId) {
      const module = modules.find(m => m.id === assignment.moduleId);
      if (module) {
        addMarkerToCell(cell, module, dateKey);
      } else {
        console.warn(`Module ${assignment.moduleId} not found for date ${dateKey}. Cleaning assignment.`);
        delete calendarAssignments[dateKey].moduleId;
        if (!calendarAssignments[dateKey].note) {
            delete calendarAssignments[dateKey];
        }
        saveAssignments();
      }
    }

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (monthClass === 'current-month') {
          cell.style.border = '2px dashed #2196F3';
      }
    });

    cell.addEventListener('dragleave', () => {
      cell.style.border = '';
      // 确保 today 样式只在当前月份应用
      if (cell.classList.contains('today') && monthClass === 'current-month') {
         cell.style.border = '2px solid #2196F3';
      } else {
         cell.style.border = '1px solid #ddd';
      }
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.style.border = '';
      if (cell.classList.contains('today') && monthClass === 'current-month') {
         cell.style.border = '2px solid #2196F3';
      } else {
         cell.style.border = '1px solid #ddd';
      }

      if (monthClass !== 'current-month') {
          console.log("Cannot drop module in previous/next month.");
          return;
      }

      if (selectedModule) {
        console.log(`Dropped module ${selectedModule.id} onto date ${dateKey}`);
        if (!calendarAssignments[dateKey]) {
            calendarAssignments[dateKey] = {};
        }
        calendarAssignments[dateKey].moduleId = selectedModule.id;
        saveAssignments();

        const existingMarker = cell.querySelector('.module-marker');
        if (existingMarker) {
          existingMarker.remove();
        }
        addMarkerToCell(cell, selectedModule, dateKey);
      }
      selectedModule = null;
    });

    cell.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-marker-btn')) {
            return;
        }
        if (monthClass !== 'current-month') {
            return;
        }

        const assignmentData = calendarAssignments[dateKey];
        let module = null;
        if (assignmentData && assignmentData.moduleId) {
            module = modules.find(m => m.id === assignmentData.moduleId);
        }
        showDetails(module, day, monthClass);
    });

    return cell;
  }

  // 辅助函数 - 将模块标记添加到单元格
  function addMarkerToCell(cell, module, dateKey) {
      const marker = document.createElement('div');
      marker.className = 'module-marker';
      marker.style.backgroundColor = module.color;
      marker.textContent = module.name;
      marker.title = module.name;
      marker.dataset.moduleId = module.id;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-marker-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = '移除此安排';
      removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`确定要从 ${dateKey} 移除 "${module.name}" 吗？`)) {
              console.log(`Removing module ${module.id} from date ${dateKey}`);
              if (calendarAssignments[dateKey]) {
                  delete calendarAssignments[dateKey].moduleId;
                  if (!calendarAssignments[dateKey].note) {
                      delete calendarAssignments[dateKey];
                  }
                  saveAssignments();
                  marker.remove();
              }
          }
      });

      marker.appendChild(removeBtn);
      cell.appendChild(marker);
  }

  // 获取日期键 YYYY-MM-DD
  function getDateKey(day, monthClass) {
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
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  // 显示详情面板
  function showDetails(module, day, monthClass) {
    if (monthClass !== 'current-month') return;

    const dateKey = getDateKey(day, monthClass);
    currentDetailDateKey = `note-${dateKey}`;

    let yearValue = currentYear;
    let monthValue = currentMonth;

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const dateDisplay = `${yearValue}年${monthNames[monthValue]}${day}日`;

    planDetails.innerHTML = '';

    if (module) {
      planDetails.innerHTML = `
        <h4>本月${day}日 - ${module.name}</h4>
        <p><strong>日期：</strong>${dateDisplay}</p>
        <p><strong>训练类型：</strong>${module.description}</p>
        <p><strong>建议时长：</strong>${module.duration}</p>
        <p><strong>训练强度：</strong>${module.intensity}</p>
        <p>具体计划可以根据个人情况进行调整。</p>
      `;
    } else {
       planDetails.innerHTML = `<h4>本月${day}日</h4><p><strong>日期：</strong>${dateDisplay}</p><p>今天没有安排训练模块。</p>`;
    }

    const assignmentData = calendarAssignments[dateKey];
    const savedNote = (assignmentData && assignmentData.note) ? assignmentData.note : '';
    notepad.value = savedNote;

    if (detailsPanel && modalOverlay) {
        detailsPanel.classList.add('active');
        modalOverlay.classList.add('active');
    } else {
        console.error('Details panel or modal overlay element not found!');
    }
  }

  // --- 初始化 ---
  loadData();
  renderModules();
  generateCalendar();
});
