

document.addEventListener('DOMContentLoaded', async () => {
  const buttonContainer = document.getElementById('container');
  const responseButtons = await fetch('./buttons.json');
  const buttons = await responseButtons.json();
  
let xmlData;
const responseXML = await fetch('./svg.xml');
const str = await responseXML.text();
const svgs = new DOMParser().parseFromString(str , "application/xml");

buttons.forEach(button =>{
      let params = '';
      if (button.paramsToFunction){
        button.paramsToFunction.forEach(param =>{
          if (params != '')
            params += `,`
          params += `'${param}'`;
        })
      }
      let svg = new XMLSerializer().serializeToString(svgs.getElementById(button.nameInXML));
    
      
      let text = `<button onclick="${button.function}(${params})" class="icon-button"> ${svg} </button>`
      buttonContainer.innerHTML += text;
      
  });

});

    function setDirection(dir) {
      document.getElementById('content').style.direction = dir;
    }

    function addInput() {
      const newInputGroup = document.createElement('div');
      newInputGroup.className = 'input-group';
      const newInput = document.createElement('textarea');
      newInput.className = 'inputItem';
      newInput.placeholder = 'Item';
      newInput.rows = '1';
      const newOptions = document.createElement('textarea');
      newOptions.className = 'inputOptions';
      newOptions.placeholder = 'Options';
      newOptions.value = 'true, false';
      newOptions.rows = '1';
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button icon-button';
      removeButton.innerHTML = 'x';
      removeButton.onclick = function() { removeInput(removeButton); };
      newInputGroup.appendChild(newInput);
      newInputGroup.appendChild(newOptions);
      newInputGroup.appendChild(removeButton);
      document.getElementById('inputContainer').appendChild(newInputGroup);
    }

    function removeInput(buttonElement) {
      const inputGroup = buttonElement.closest('.input-group');
      inputGroup.remove();
    }

    function clearForm() {
      const inputContainer = document.getElementById('inputContainer');
      inputContainer.innerHTML = '';
      addInput();
      document.getElementById('result').innerHTML = '';
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
  }


function exportToFile(fileName = 'result') {
  const resultBoxes = document.querySelectorAll('.result-box');
  let content = '';
  resultBoxes.forEach(box => {
      const cartesianProductHtml = box.innerHTML.split('<br>')[0];
      const tempElem = document.createElement('div');
      tempElem.innerHTML = cartesianProductHtml;
      const cartesianProductText = tempElem.textContent || tempElem.innerText;
      const commentText = box.querySelector('input').value;
      content += `${cartesianProductText} [Comment: ${commentText}]\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // Create an anchor element and trigger the download
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName}.txt`; // Set the file name here
  document.body.appendChild(a); // Append the anchor to the body
  a.click(); // Simulate a click on the anchor
  document.body.removeChild(a); // Remove the anchor from the body
	let jsonObject = buildJsonObject();

}


  
	 document.addEventListener('DOMContentLoaded', function() {
      document.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
              calculateCartesianProduct();
        } else if (event.ctrlKey && event.keyCode === 83) {
          event.preventDefault();  // Prevents the browser's default Ctrl+S action
          exportToFile();
        }
		
		
      });

    });
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
	
	
  
