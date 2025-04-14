document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const calendar = document.getElementById('calendar');
  const detailsPanel = document.getElementById('detailsPanel');
  const planDetails = document.getElementById('planDetails');
  const colorTabs = document.querySelectorAll('.color-tab');
  
  // 当前选中的颜色
  let selectedColor = null;
  
  // 训练计划数据（示例）
  const trainingPlans = {
    red: '红色训练日：主要进行力量训练，包括深蹲、卧推和硬拉等复合动作。',
    green: '绿色训练日：主要进行有氧训练，如慢跑、游泳或骑行等。',
    blue: '蓝色训练日：主要进行灵活性和核心训练，如瑜伽、普拉提等。',
    orange: '橙色训练日：主要进行高强度间歇训练(HIIT)，短时间内提高心率。'
  };
  
  // 生成日历网格
  function generateCalendar() {
    // 创建日历网格容器
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 生成7x7的网格（一周七天，共显示七周）
    for (let i = 1; i <= 49; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';
      
      // 添加日期数字
      const dateNumber = document.createElement('div');
      dateNumber.className = 'date-number';
      dateNumber.textContent = i;
      cell.appendChild(dateNumber);
      
      // 随机分配一些单元格为虚线框（表示未设计）
      if (Math.random() < 0.3) {
        cell.classList.add('empty');
      }
      
      // 为单元格添加点击事件
      cell.addEventListener('click', () => {
        // 如果是空单元格，则可以设置颜色
        if (cell.classList.contains('empty') && selectedColor) {
          // 移除empty类和其他颜色类
          cell.classList.remove('empty', 'red', 'green', 'blue', 'orange');
          // 添加选中的颜色类
          cell.classList.add(selectedColor);
          
          // 显示详情面板
          showDetails(selectedColor, i);
        } 
        // 如果已经有颜色，则显示详情
        else if (!cell.classList.contains('empty')) {
          // 获取单元格的颜色类
          const cellColor = ['red', 'green', 'blue', 'orange'].find(color => 
            cell.classList.contains(color)
          );
          
          if (cellColor) {
            showDetails(cellColor, i);
          }
        }
      });
      
      calendarGrid.appendChild(cell);
    }
    
    calendar.appendChild(calendarGrid);
  }
  
  // 显示详情面板
  function showDetails(color, day) {
    planDetails.innerHTML = `
      <h4>第${day}天 - ${color === 'red' ? '红色' : color === 'green' ? '绿色' : color === 'blue' ? '蓝色' : '橙色'}训练日</h4>
      <p>${trainingPlans[color]}</p>
      <p>具体计划可以根据个人情况进行调整。点击日历中的其他日期可以查看或设置不同的训练计划。</p>
    `;
    
    detailsPanel.classList.add('active');
  }
  
  // 为颜色标签添加点击事件
  colorTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 移除其他标签的选中状态
      colorTabs.forEach(t => t.style.transform = '');
      
      // 设置当前选中的颜色
      selectedColor = tab.dataset.color;
      
      // 添加选中效果
      tab.style.transform = 'translateY(-5px)';
    });
  });
  
  // 初始化日历
  generateCalendar();
});
