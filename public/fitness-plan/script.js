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

  // 添加贴纸容器
  const stickerContainer = document.createElement('div');
  stickerContainer.id = 'stickerContainer';
  stickerContainer.className = 'sticker-container';
  const mainLayout = document.querySelector('.main-layout'); // 假设主布局容器有这个类
  if (mainLayout) {
    mainLayout.parentNode.insertBefore(stickerContainer, mainLayout);
  } else {
    calendar.parentNode.insertBefore(stickerContainer, calendar);
  }

  // 创建贴纸选择界面
  const stickers = ['cow', 'sheep', 'deer',"zw","fucked","nice","rest"];
  stickers.forEach(stickerType => {
    const stickerElement = document.createElement('div');
    stickerElement.className = 'sticker';
    stickerElement.dataset.stickerType = stickerType;
    stickerElement.draggable = true;

    const stickerImg = document.createElement('img');
    stickerImg.src = `./assets/stickers/${stickerType}.png`;
    stickerImg.alt = stickerType;
    stickerImg.onerror = () => {
      console.error(`Failed to load sticker: ${stickerType}.png`);
      stickerElement.textContent = stickerType;
    };

    stickerElement.appendChild(stickerImg);
    stickerContainer.appendChild(stickerElement);

    stickerElement.addEventListener('dragstart', (e) => {
      if (e.target === stickerImg || e.target === stickerElement) {
        e.dataTransfer.setData('text/stickerType', stickerType);
        e.dataTransfer.effectAllowed = 'copy';
        console.log('Dragging sticker:', stickerType);
      } else {
        e.preventDefault();
      }
    });
  });

  // 数据
  let modules = [];
  let calendarAssignments = {}; // { 'YYYY-MM-DD': { moduleIds: [...], note: '...', stickers: [{type: 'cow', id: '...'}, ...] }, ... }
  let selectedModule = null;
  let currentDetailDateKey = null;

  // 持久化函数
  function loadData() {
    const storedModules = localStorage.getItem('fitnessModules');
    const storedAssignments = localStorage.getItem('fitnessAssignments');
    if (storedModules) {
      try {
        modules = JSON.parse(storedModules);
        if (!Array.isArray(modules)) modules = [];
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
          calendarAssignments = {};
        }

        Object.keys(calendarAssignments).forEach(dateKey => {
          const assignment = calendarAssignments[dateKey];
          if (assignment.moduleId && !assignment.moduleIds) {
            assignment.moduleIds = [assignment.moduleId];
            delete assignment.moduleId;
          } else if (!assignment.moduleIds) {
            assignment.moduleIds = [];
          }
          if (!assignment.stickers || !Array.isArray(assignment.stickers)) {
            assignment.stickers = [];
          }
          assignment.stickers.forEach(sticker => {
            if (!sticker.id) {
              sticker.id = Date.now().toString() + Math.random().toString(16).slice(2);
            }
          });
        });
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

  // 保存模块按钮
  saveModuleBtn.addEventListener('click', () => {
    const name = document.getElementById('moduleName').value.trim();
    const description = document.getElementById('moduleDescription').value.trim();
    const duration = document.getElementById('moduleDuration').value.trim();
    const intensity = document.getElementById('moduleIntensity').value;
    const color = document.getElementById('moduleColor').value;
    const editId = editModuleIdInput.value;

    if (!name || !description || !duration) {
      alert('请填写完整信息');
      return;
    }

    if (editId) {
      const moduleIndex = modules.findIndex(m => m.id === editId);
      if (moduleIndex > -1) {
        const originalColor = modules[moduleIndex].color;
        modules[moduleIndex] = { ...modules[moduleIndex], name, description, duration, intensity, color };
        console.log('Module edited:', modules[moduleIndex]);
        saveModules();
        renderModules();
        if (originalColor !== color) {
          generateCalendar();
        }
      } else {
        console.error("Module to edit not found:", editId);
      }
    } else {
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
      saveModules();
      renderModules();
    }

    moduleForm.style.display = 'none';
    modalOverlay.classList.remove('active');
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

  // 点击遮罩层关闭模态框/表单
  modalOverlay.addEventListener('click', (event) => {
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
      const dateKey = currentDetailDateKey.replace('note-', '');
      if (!calendarAssignments[dateKey]) {
        calendarAssignments[dateKey] = { moduleIds: [], stickers: [], note: '' };
      }
      calendarAssignments[dateKey].note = notepad.value;

      const assignment = calendarAssignments[dateKey];
      if (!assignment.note && (!assignment.moduleIds || assignment.moduleIds.length === 0) && (!assignment.stickers || assignment.stickers.length === 0)) {
        delete calendarAssignments[dateKey];
        console.log(`Removed empty entry for ${dateKey}`);
      }
      saveAssignments();
    }
  });

  // --- 函数 ---

  // 重置表单
  function resetForm() {
    editModuleIdInput.value = '';
    document.getElementById('moduleName').value = '';
    document.getElementById('moduleDescription').value = '';
    document.getElementById('moduleDuration').value = '';
    document.getElementById('moduleIntensity').value = '高';
    document.getElementById('moduleColor').value = '#ff6b6b';
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
          const moduleIdToDelete = module.id;
          const index = modules.findIndex(m => m.id === moduleIdToDelete);
          if (index > -1) {
            modules.splice(index, 1);
            saveModules();

            let assignmentsChanged = false;
            Object.keys(calendarAssignments).forEach(dateKey => {
              const assignment = calendarAssignments[dateKey];
              if (assignment && assignment.moduleIds && assignment.moduleIds.includes(moduleIdToDelete)) {
                assignment.moduleIds = assignment.moduleIds.filter(id => id !== moduleIdToDelete);
                assignmentsChanged = true;
                if (assignment.moduleIds.length === 0 && !assignment.note && (!assignment.stickers || assignment.stickers.length === 0)) {
                  delete calendarAssignments[dateKey];
                  console.log(`Removed empty entry for ${dateKey} after deleting module ${moduleIdToDelete}`);
                }
              }
            });
            if (assignmentsChanged) {
              saveAssignments();
            }

            renderModules();
            generateCalendar();
            console.log(`Module ${moduleIdToDelete} deleted and assignments updated.`);
          }
        }
      });

      actionsContainer.appendChild(editBtn);
      actionsContainer.appendChild(deleteBtn);
      moduleElement.appendChild(actionsContainer);

      moduleElement.addEventListener('dragstart', (e) => {
        const currentModuleData = modules.find(m => m.id === module.id);
        if (currentModuleData) {
          e.dataTransfer.setData('text/moduleId', currentModuleData.id);
          e.dataTransfer.effectAllowed = 'copy';
          console.log('Dragging module:', currentModuleData.id);
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
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.textContent = '<';
    prevMonthBtn.onclick = () => changeMonth(-1);
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.textContent = '>';
    nextMonthBtn.onclick = () => changeMonth(1);
    const monthTitle = document.createElement('h2');
    monthTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
    calendarHeader.style.display = 'flex';
    calendarHeader.style.justifyContent = 'space-between';
    calendarHeader.style.alignItems = 'center';
    prevMonthBtn.style.marginRight = '10px';
    nextMonthBtn.style.marginLeft = '10px';

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

    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrevMonth - firstDay + i + 1;
      const cell = createCalendarCell(day, 'prev-month');
      calendarGrid.appendChild(cell);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const cell = createCalendarCell(i, 'current-month');
      if (i === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
        cell.classList.add('today');
      }
      calendarGrid.appendChild(cell);
    }

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
    generateCalendar();
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

    const moduleArea = document.createElement('div');
    moduleArea.className = 'module-area';
    cell.appendChild(moduleArea);

    const assignment = calendarAssignments[dateKey];
    if (assignment && assignment.moduleIds && assignment.moduleIds.length > 0) {
      assignment.moduleIds.forEach(moduleId => {
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          addMarkerToCell(moduleArea, module, dateKey);
        } else {
          console.warn(`Module ${moduleId} not found for date ${dateKey}. Cleaning assignment.`);
          calendarAssignments[dateKey].moduleIds = calendarAssignments[dateKey].moduleIds.filter(id => id !== moduleId);
          if (calendarAssignments[dateKey].moduleIds.length === 0 && !calendarAssignments[dateKey].note && (!calendarAssignments[dateKey].stickers || calendarAssignments[dateKey].stickers.length === 0)) {
            delete calendarAssignments[dateKey];
          }
          saveAssignments();
        }
      });
    }

    const stickerArea = document.createElement('div');
    stickerArea.className = 'sticker-area';
    cell.appendChild(stickerArea);

    renderStickersInCell(stickerArea, dateKey);

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes('text/moduleid') && monthClass === 'current-month') {
        cell.style.border = '2px dashed #4CAF50';
        e.dataTransfer.dropEffect = 'copy';
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    });

    cell.addEventListener('dragleave', (e) => {
      cell.style.border = '';
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

      if (monthClass !== 'current-month') return;

      const droppedModuleId = e.dataTransfer.getData('text/moduleId');
      if (droppedModuleId) {
        const droppedModule = modules.find(m => m.id === droppedModuleId);
        if (droppedModule) {
          console.log(`Dropped module ${droppedModule.id} onto date ${dateKey}`);
          if (!calendarAssignments[dateKey]) {
            calendarAssignments[dateKey] = { moduleIds: [], stickers: [], note: '' };
          }
          if (!calendarAssignments[dateKey].moduleIds.includes(droppedModule.id)) {
            calendarAssignments[dateKey].moduleIds.push(droppedModule.id);
            saveAssignments();
            addMarkerToCell(moduleArea, droppedModule, dateKey);
          } else {
            console.log(`Module ${droppedModule.id} already exists on ${dateKey}`);
          }
        } else {
          console.error("Dropped module data not found:", droppedModuleId);
        }
      }
    });

    stickerArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes('text/stickertype') && monthClass === 'current-month') {
        stickerArea.style.backgroundColor = '#e0f7fa';
        e.dataTransfer.dropEffect = 'copy';
        e.stopPropagation();
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    });

    stickerArea.addEventListener('dragleave', (e) => {
      stickerArea.style.backgroundColor = '';
      e.stopPropagation();
    });

    stickerArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      stickerArea.style.backgroundColor = '';

      if (monthClass !== 'current-month') return;

      const stickerType = e.dataTransfer.getData('text/stickerType');
      if (stickerType && stickers.includes(stickerType)) {
        console.log(`Dropped sticker ${stickerType} onto date ${dateKey}`);
        if (!calendarAssignments[dateKey]) {
          calendarAssignments[dateKey] = { moduleIds: [], stickers: [], note: '' };
        }
        const newSticker = {
          type: stickerType,
          id: Date.now().toString() + Math.random().toString(16).slice(2)
        };
        calendarAssignments[dateKey].stickers.push(newSticker);
        saveAssignments();
        renderStickersInCell(stickerArea, dateKey);
      } else {
        console.warn("Invalid sticker type dropped:", stickerType);
      }
    });

    cell.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-marker-btn') || e.target.closest('.remove-marker-btn') ||
        e.target.classList.contains('remove-sticker-btn') || e.target.closest('.remove-sticker-btn')) {
        return;
      }
      if (monthClass !== 'current-month') {
        return;
      }

      showDetails(day, monthClass);
    });

    return cell;
  }

  function addMarkerToCell(moduleArea, module, dateKey) {
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
        const assignment = calendarAssignments[dateKey];
        if (assignment && assignment.moduleIds) {
          assignment.moduleIds = assignment.moduleIds.filter(id => id !== module.id);
          if (assignment.moduleIds.length === 0 && !assignment.note && (!assignment.stickers || assignment.stickers.length === 0)) {
            delete calendarAssignments[dateKey];
            console.log(`Removed empty entry for ${dateKey}`);
          }
          saveAssignments();
          marker.remove();
        }
      }
    });

    marker.appendChild(removeBtn);
    moduleArea.appendChild(marker);
  }

  function renderStickersInCell(stickerArea, dateKey) {
    stickerArea.innerHTML = '';
    const assignment = calendarAssignments[dateKey];
    if (assignment && assignment.stickers && assignment.stickers.length > 0) {
      assignment.stickers.forEach(sticker => {
        const stickerWrapper = document.createElement('div');
        stickerWrapper.className = 'cell-sticker';
        stickerWrapper.dataset.stickerId = sticker.id;

        const stickerImg = document.createElement('img');
        stickerImg.src = `./assets/stickers/${sticker.type}.png`;
        stickerImg.alt = sticker.type;
        stickerImg.onerror = () => {
          console.error(`Failed to load sticker in cell: ${sticker.type}.png`);
          stickerWrapper.textContent = sticker.type;
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-sticker-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = '移除贴纸';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log(`Removing sticker ${sticker.id} (${sticker.type}) from date ${dateKey}`);
          const currentAssignment = calendarAssignments[dateKey];
          if (currentAssignment && currentAssignment.stickers) {
            currentAssignment.stickers = currentAssignment.stickers.filter(s => s.id !== sticker.id);
            if (currentAssignment.stickers.length === 0 && !currentAssignment.note && (!currentAssignment.moduleIds || currentAssignment.moduleIds.length === 0)) {
              delete calendarAssignments[dateKey];
              console.log(`Removed empty entry for ${dateKey}`);
            }
            saveAssignments();
            stickerWrapper.remove();
          }
        });

        stickerWrapper.appendChild(stickerImg);
        stickerWrapper.appendChild(removeBtn);
        stickerArea.appendChild(stickerWrapper);
      });
    }
  }

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
    const dateObj = new Date(year, month, day);
    const formattedYear = dateObj.getFullYear();
    const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(dateObj.getDate()).padStart(2, '0');
    return `${formattedYear}-${formattedMonth}-${formattedDay}`;
  }

  function showDetails(day, monthClass) {
    if (monthClass !== 'current-month') return;

    const dateKey = getDateKey(day, monthClass);
    currentDetailDateKey = `note-${dateKey}`;

    const dateObj = new Date(dateKey + 'T00:00:00');
    const yearValue = dateObj.getFullYear();
    const monthValue = dateObj.getMonth();
    const dayValue = dateObj.getDate();

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const dateDisplay = `${yearValue}年${monthNames[monthValue]}${dayValue}日`;

    planDetails.innerHTML = '';

    const assignmentData = calendarAssignments[dateKey];
    const assignedModuleIds = (assignmentData && assignmentData.moduleIds) ? assignmentData.moduleIds : [];
    const savedNote = (assignmentData && assignmentData.note) ? assignmentData.note : '';

    const title = document.createElement('h4');
    title.textContent = `${monthNames[monthValue]}${dayValue}日 安排`;
    planDetails.appendChild(title);

    const dateP = document.createElement('p');
    dateP.innerHTML = `<strong>日期：</strong>${dateDisplay}`;
    planDetails.appendChild(dateP);

    if (assignedModuleIds.length > 0) {
      assignedModuleIds.forEach(moduleId => {
        const module = modules.find(m => m.id === moduleId);
        if (module) {
          const moduleDiv = document.createElement('div');
          moduleDiv.style.borderLeft = `5px solid ${module.color}`;
          moduleDiv.style.paddingLeft = '10px';
          moduleDiv.style.marginBottom = '10px';
          moduleDiv.innerHTML = `
            <p><strong>训练模块：</strong>${module.name}</p>
            <p><strong>描述：</strong>${module.description}</p>
            <p><strong>建议时长：</strong>${module.duration}</p>
            <p><strong>训练强度：</strong>${module.intensity}</p>
          `;
          planDetails.appendChild(moduleDiv);
        }
      });
    } else {
      const noModuleP = document.createElement('p');
      noModuleP.textContent = '今天没有安排训练模块。';
      planDetails.appendChild(noModuleP);
    }

    const adjustP = document.createElement('p');
    adjustP.textContent = '具体计划可以根据个人情况进行调整。';
    planDetails.appendChild(adjustP);

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
