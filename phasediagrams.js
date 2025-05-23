const elements = [
{symbol: "Al", position:49  ,color:"#B9FFB9"},  
{symbol: "Sc", position:57  ,color:"#9FDAF7"}, 
{symbol: "Ti", position:58  ,color:"#9FDAF7"}, 
{symbol: "V" , position:59  ,color:"#9FDAF7"}, 
{symbol: "Cr", position:60  ,color:"#9FDAF7"}, 
{symbol: "Mn", position:61  ,color:"#9FDAF7"}, 
{symbol: "Fe", position:62  ,color:"#9FDAF7"}, 
{symbol: "Co", position:63  ,color:"#9FDAF7"}, 
{symbol: "Ni", position:64  ,color:"#9FDAF7"}, 
{symbol: "Cu", position:65  ,color:"#9FDAF7"}, 
{symbol: "Zn", position:66  ,color:"#9FDAF7"}, 
{symbol: "Ga", position:67  ,color:"#B9FFB9"}, 
{symbol: "Ge", position:68  ,color:"#DFEDB8"}, 
{symbol: "Y" , position:75  ,color:"#9FDAF7"}, 
{symbol: "Zr", position:76  ,color:"#9FDAF7"}, 
{symbol: "Nb", position:77  ,color:"#9FDAF7"}, 
{symbol: "Mo", position:78  ,color:"#9FDAF7"}, 
{symbol: "Tc", position:79  ,color:"#9FDAF7"}, 
{symbol: "Ru", position:80  ,color:"#9FDAF7"}, 
{symbol: "Rh", position:81  ,color:"#9FDAF7"}, 
{symbol: "Pd", position:82  ,color:"#9FDAF7"}, 
{symbol: "Ag", position:83  ,color:"#9FDAF7"}, 
{symbol: "Cd", position:84  ,color:"#9FDAF7"}, 
{symbol: "In", position:85  ,color:"#B9FFB9"}, 
{symbol: "Sn", position:86  ,color:"#B9FFB9"}, 
{symbol: "Sb", position:87  ,color:"#DFEDB8"}, 
{symbol: "Hf", position:94  ,color:"#9FDAF7"}, 
{symbol: "Ta", position:95  ,color:"#9FDAF7"}, 
{symbol: "W ", position:96  ,color:"#9FDAF7"}, 
{symbol: "Re", position:97  ,color:"#9FDAF7"}, 
{symbol: "Os", position:98  ,color:"#9FDAF7"}, 
{symbol: "Ir", position:99  ,color:"#9FDAF7"}, 
{symbol: "Pt", position:100 ,color:"#9FDAF7"}, 
{symbol: "Au", position:101 ,color:"#9FDAF7"}, 
{symbol: "Tl", position:103 ,color:"#B9FFB9"}, 
{symbol: "Pb", position:104 ,color:"#B9FFB9"}, 
{symbol: "Bi", position:105 ,color:"#B9FFB9"}, 
{symbol: "Ce", position:130 ,color:"#ACFFFF"}, 
];


const positions = [
   [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
   [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
   [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72],
   [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
   [91, 92, 93, 94, 95, 96, 97, 98, 99,100,101,102,103,104,105,106,107,108],
   [109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126],
   [127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144]];


const selected = {
  ele1: null,
  ele2: null,
};

function displayElement(element, index) {
  if (element) {
    document.getElementById(index === 1 ? "ele1" : "ele2").textContent = element.symbol;
  } else {
    document.getElementById(index === 1 ? "ele1" : "ele2").textContent = "---";
  }
}


function displayPlot() {
  if (selected.ele1 && selected.ele2) {
    // Sort the symbols alphabetically to ensure a consistent file name (A_B.html)
    const symbols = [selected.ele1.symbol, selected.ele2.symbol].sort();
    const fileName = `./phase_diagram/phase_outputs/${symbols[0]}_${symbols[1]}.html`;
    window.location.href = fileName;
  }
}


function toggleElement(element) {
  if (selected.ele1 && selected.ele2) {
    selected.ele1 = element;
    delete selected.ele2;
  } else if (!selected.ele1) {
    selected.ele1 = element;
  } else if (!selected.ele2) {
    selected.ele2 = element;
  }
}


// ——— Clear all .selected & .hover-effect ———
function clearAllSelections() {
  elements.forEach(e => {
    if (e.domElement) e.domElement.classList.remove("selected", "hover-effect");
  });
}

// ——— Re-apply .selected to ele1/ele2 ———
function applySelections() {
  [selected.ele1, selected.ele2].forEach(el => {
    if (el && el.domElement) el.domElement.classList.add("selected");
  });
}

// ——— Keep hover-effect on whatever’s selected ———
function updateHoverEffects() {
  elements.forEach(e => {
    if (e.domElement) e.domElement.classList.remove("hover-effect");
  });
  [selected.ele1, selected.ele2].forEach(el => {
    if (el && el.domElement) el.domElement.classList.add("hover-effect");
  });
}

function updateSelectionInfo() {
  const info = document.getElementById("selected-elements");
  if (selected.ele1 && selected.ele2) {
    info.textContent = `You have selected ${selected.ele1.symbol} and ${selected.ele2.symbol}`;
  } else if (selected.ele1) {
    info.textContent = `You have selected ${selected.ele1.symbol}`;
  } else {
    info.textContent = "";
  }
}


// ——— Decide which two are ele1/ele2 ———
function toggleElement(element) {
  if (selected.ele1 && selected.ele2) {
    selected.ele1 = element;
    delete selected.ele2;
  } else if (!selected.ele1) {
    selected.ele1 = element;
  } else if (!selected.ele2) {
    selected.ele2 = element;
  }
}

// ——— Build the table & hook clicks ———
function createTable() {
  const table = document.getElementById("periodic-table");
  for (const row of positions) {
    for (const pos of row) {
      const element = elements.find(e => e.position === pos);
      if (!element) {
        const empty = document.createElement("div");
        empty.style.width  = empty.style.height = "40px";
        table.appendChild(empty);
        continue;
      }
      const cell = document.createElement("div");
      cell.classList.add("element");
      cell.style.backgroundColor = element.color;
      cell.innerHTML = `<span class="element-symbol">${element.symbol}</span>`;
      element.domElement = cell;

      cell.addEventListener("click", () => {
        toggleElement(element);
        clearAllSelections();
        applySelections();
        updateHoverEffects();
        updateSelectionInfo();
        displayPlot();
      });

      // optional triangle decorator
      if (["Pm","Ac","Th","Pa","U","Np","Pu","Xe","Kr"].includes(element.symbol)) {
        const tri = document.createElement("div");
        tri.classList.add("triangle");
        cell.appendChild(tri);
      }

      table.appendChild(cell);
    }
  }
}

// ——— Initialize ———
createTable();