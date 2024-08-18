let calculationCache = [];
let currentCalculationIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
  const buttonContainer = document.getElementById('container');
  const responseButtons = await fetch('./buttons.json');
  const buttons = await responseButtons.json();
  
  let xmlData;
  const responseXML = await fetch('./svg.xml');
  const str = await responseXML.text();
  const svgs = new DOMParser().parseFromString(str, "application/xml");

  buttons.forEach(button => {
    let params = '';
    if (button.paramsToFunction) {
      button.paramsToFunction.forEach(param => {
        if (params != '')
          params += `,`
        params += `'${param}'`;
      })
    }
    let svg = new XMLSerializer().serializeToString(svgs.getElementById(button.nameInXML));
    
    let text = `<button onclick="${button.function}(${params})" class="icon-button"> ${svg} </button>`
    buttonContainer.innerHTML += text;
  });

  // Add the history SVG to the history button
  const historyButton = document.getElementById('historyButton');
  const historySvg = svgs.getElementById('history_fill');
  historyButton.innerHTML = new XMLSerializer().serializeToString(historySvg);

  historyButton.addEventListener('click', toggleHistoryPanel);
  updateHistoryButton();
  loadCache();
});

function updateHistoryButton() {
  const historyButton = document.getElementById('historyButton');
  if (calculationCache.length > 0) {
    historyButton.classList.remove('disabled');
    historyButton.style.backgroundColor = 'var(--button-bg-color)';
    historyButton.style.cursor = 'pointer';
 //historyButton.onclick = toggleHistoryPanel;
  } else {
    historyButton.style.backgroundColor = 'var(--button-bg-color)';
    historyButton.classList.add('disabled');
    historyButton.style.color = 'grey';
    historyButton.style.cursor = 'default';
    historyButton.onclick = null;
  }
}
function toggleHistoryPanel() {
  const historyPanel = document.getElementById('historyPanel');
  if (historyPanel.classList.contains('hidden') & (calculationCache.length > 0)) {
    historyPanel.classList.remove('hidden');
    historyPanel.value = '';
  } else {
    historyPanel.classList.add('hidden');
  }
}



function setDirection(dir) {
  document.getElementById('content').style.direction = dir;
}

function addInput(shouldAutoSave = true) {
  const newInputGroup = document.createElement('div');
  newInputGroup.className = 'input-group';
  newInputGroup.innerHTML = `
    <textarea class="inputItem" placeholder="Item" rows="1"></textarea>
    <textarea class="inputOptions" placeholder="Options" rows="1">true, false</textarea>
    <button class="remove-button icon-button">x</button>
  `;
  document.getElementById('inputContainer').appendChild(newInputGroup);

  const removeButton = newInputGroup.querySelector('.remove-button');
  removeButton.onclick = function() { removeInput(removeButton); };

  const inputs = newInputGroup.querySelectorAll('textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', autoSaveCalculation);
  });

  if (shouldAutoSave) {
    autoSaveCalculation();
  }
}

function removeInput(buttonElement) {
  const inputGroup = buttonElement.closest('.input-group');
  
  inputGroup.remove();
  autoSaveCalculation();
}

function clearForm(shouldAddInput = true) {
  const inputContainer = document.getElementById('inputContainer');
  inputContainer.innerHTML = '';
  document.getElementById('result').innerHTML = '';
  if (shouldAddInput) {
    addInput(false);
    currentCalculationIndex = -1;
  }
  if (shouldAddInput==true){
    location.reload();
  }
}


function calculateCartesianProduct() {
  const inputItems = Array.from(document.querySelectorAll('.inputItem'));
  const optionItems = Array.from(document.querySelectorAll('.inputOptions'));
  let result = [''];
  inputItems.forEach((input, index) => {
    const item = input.value.trim();
    const options = optionItems[index].value.split(',').map(opt => opt.trim());
    const newResult = [];
    for (const res of result) {
      for (const option of options) {
        newResult.push(`${res}<span class="bold">${item}</span> - ${option}, `);
      }
    }
    result = newResult;
  });
 
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = result.map(res => `<div class="result-box">${res}<input type="text" placeholder="Add comment"></div>`).join('<br>');

  document.querySelectorAll('.result-box input').forEach(input => {
    input.addEventListener('blur', autoSaveCalculation);
  });

  /*if (currentCalculationIndex === -1) {
    currentCalculationIndex = 0;
  }*/

  autoSaveCalculation();
}

function autoSaveCalculation() {
  
  const inputs = Array.from(document.querySelectorAll('.input-group')).map(group => ({
    item: group.querySelector('.inputItem').value.trim(),
    options: group.querySelector('.inputOptions').value.split(',').map(opt => opt.trim())
  }));
  const results = Array.from(document.querySelectorAll('.result-box')).map(box => ({
    result: box.innerHTML.split('<input')[0],
    comment: box.querySelector('input').value
  }));
  const calculationResult = {
    inputs: inputs,
    results: results,
    timestamp: new Date().getTime()
  };


  if (currentCalculationIndex === -1 || !calculationCache.length) {
    calculationCache.unshift(calculationResult);
    currentCalculationIndex = 0;
  } else {
    calculationCache[currentCalculationIndex] = calculationResult;
  }

  if (calculationCache.length > 10) {
    calculationCache.pop();
  }

  localStorage.setItem('calculationCache', JSON.stringify(calculationCache));
  updateCacheDisplay();
  updateHistoryButton();

}

function exportToFile(fileName = 'result') {
  const resultBoxes = document.querySelectorAll('.result-box');
  let content = '';
  resultBoxes.forEach(box => {
    const cartesianProductHtml = box.innerHTML.split('<input')[0];
    const tempElem = document.createElement('div');
    tempElem.innerHTML = cartesianProductHtml;
    const cartesianProductText = tempElem.textContent || tempElem.innerText;
    const commentText = box.querySelector('input').value;
    content += `${cartesianProductText} [Comment: ${commentText}]\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.addEventListener('keydown', function(event) {
  if (event.keyCode === 13) {
    calculateCartesianProduct();
  } else if (event.ctrlKey && event.keyCode === 83) {
    event.preventDefault();
    exportToFile();
  }
});

function loadCache() {
  const cached = localStorage.getItem('calculationCache');
  if (cached) {
    calculationCache = JSON.parse(cached);
    updateCacheDisplay();
    updateHistoryButton();
  }
}


function updateCacheDisplay() {
  const cacheContainer = document.getElementById('cacheContainer');
  cacheContainer.innerHTML = '';
  calculationCache.forEach((calc, index) => {
    const calcElement = document.createElement('div');
    calcElement.className = 'cache-item';
    
    const date = new Date(calc.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    const itemNames = calc.inputs.map(input => input.item).join(', ');
    const displayText = itemNames.length > 20 ? itemNames.substring(0, 20) + '...' : itemNames;
    
    calcElement.textContent = `${formattedDate} - ${displayText}`;
    calcElement.onclick = () => restoreCalculation(index);
    cacheContainer.appendChild(calcElement);

    if (index < calculationCache.length - 1) {
      const separator = document.createElement('hr');
      separator.className = 'cache-separator';
      cacheContainer.appendChild(separator);
    }
  });
}

function restoreCalculation(index) {

  const restoredCalc = calculationCache.splice(index, 1)[0];

  restoredCalc.timestamp = new Date().getTime(); // Update the timestamp
  calculationCache.unshift(restoredCalc);
  
  currentCalculationIndex = 0;


  clearForm(false);

  const inputContainer = document.getElementById('inputContainer');
  restoredCalc.inputs.forEach((input, i) => {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
      <textarea class="inputItem" placeholder="Item" rows="1">${input.item}</textarea>
      <textarea class="inputOptions" placeholder="Options" rows="1">${input.options.join(', ')}</textarea>
      <button class="remove-button icon-button">x</button>
    `;
    inputContainer.appendChild(inputGroup);
    
    const removeButton = inputGroup.querySelector('.remove-button');
    removeButton.onclick = function() { removeInput(removeButton); };
  });

  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = restoredCalc.results.map(res => 
    `<div class="result-box">${res.result}<input type="text" placeholder="Add comment" value="${res.comment}"></div>`
  ).join('<br>');
  
  document.querySelectorAll('.inputItem, .inputOptions').forEach(input => {
    input.addEventListener('blur', autoSaveCalculation);
  });
  document.querySelectorAll('.result-box input').forEach(input => {
    input.addEventListener('blur', autoSaveCalculation);
  });

  localStorage.setItem('calculationCache', JSON.stringify(calculationCache));
  updateCacheDisplay();
  updateHistoryButton();
}

function buildJsonObject() {
  const inputGroups = document.querySelectorAll('.input-group');
  const resultBoxes = document.querySelectorAll('.result-box');
  const textOrientation = document.getElementById('content').style.direction;
  
  const jsonObject = {
    numberOfInputBoxes: inputGroups.length,
    boxesContent: [],
    comments: [],
    textOrientation: textOrientation
  };
  
  inputGroups.forEach((inputGroup, index) => {
    const inputItem = inputGroup.querySelector('.inputItem').value.trim();
    const inputOptions = inputGroup.querySelector('.inputOptions').value.split(',').map(opt => opt.trim());
    jsonObject.boxesContent.push({
      boxNumber: index + 1,
      text: inputItem,
      values: inputOptions
    });
  });
  
  resultBoxes.forEach((resultBox, index) => {
    const commentText = resultBox.querySelector('input').value.trim();
    jsonObject.comments.push({
      boxNumber: index + 1,
      comment: commentText
    });
  });
  
  return jsonObject;
}